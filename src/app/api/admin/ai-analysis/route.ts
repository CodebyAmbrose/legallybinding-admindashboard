import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { getAdminSupabase } from "@/lib/supabase-admin";
import {
  errorDetail,
  loadOwners,
  normalizeDocument,
  parsePage,
  resolveOwner,
  sanitizeSearch,
  type RelatedDocument,
} from "@/lib/admin-query";

type AnalysisRow = {
  id: string;
  document_id: string;
  owner_clerk_id: string;
  provider: string;
  model: string;
  document_type: string;
  overall_risk_level: "low" | "medium" | "high";
  summary: string;
  recommended_next_steps: string[];
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  documents: RelatedDocument | RelatedDocument[] | null;
};

export async function GET(request: Request) {
  const access = await requireAdmin();
  if (!access.ok) {
    return NextResponse.json(
      { error: access.status === 401 ? "Authentication required" : "Admin access required" },
      { status: access.status },
    );
  }

  const url = new URL(request.url);
  const query = sanitizeSearch(url.searchParams.get("query"));
  const risk = url.searchParams.get("risk") ?? "all";
  const page = parsePage(url.searchParams.get("page"));
  const pageSize = 25;

  try {
    const database = getAdminSupabase();
    let listQuery = database
      .from("document_analyses")
      .select(
        "id,document_id,owner_clerk_id,provider,model,document_type,overall_risk_level,summary,recommended_next_steps,metadata,created_at,updated_at,documents(id,filename,original_filename,status,classification,created_at)",
        { count: "exact" },
      )
      .order("updated_at", { ascending: false })
      .range(page * pageSize, (page + 1) * pageSize - 1);

    if (["low", "medium", "high"].includes(risk)) listQuery = listQuery.eq("overall_risk_level", risk);
    if (query) {
      listQuery = listQuery.or(
        `owner_clerk_id.ilike.%${query}%,document_type.ilike.%${query}%,provider.ilike.%${query}%,model.ilike.%${query}%,summary.ilike.%${query}%`,
      );
    }

    const [list, total, high, medium, low] = await Promise.all([
      listQuery,
      database.from("document_analyses").select("id", { count: "exact", head: true }),
      database.from("document_analyses").select("id", { count: "exact", head: true }).eq("overall_risk_level", "high"),
      database.from("document_analyses").select("id", { count: "exact", head: true }).eq("overall_risk_level", "medium"),
      database.from("document_analyses").select("id", { count: "exact", head: true }).eq("overall_risk_level", "low"),
    ]);

    const failure = [list, total, high, medium, low].find(result => result.error)?.error;
    if (failure) throw failure;

    const rows = (list.data ?? []) as unknown as AnalysisRow[];
    const documentIds = rows.map(row => row.document_id);
    const [ownerMap, risks, obligations] = await Promise.all([
      loadOwners(database, rows.map(row => row.owner_clerk_id)),
      documentIds.length
        ? database.from("document_risks").select("document_id").in("document_id", documentIds)
        : Promise.resolve({ data: [], error: null }),
      documentIds.length
        ? database.from("document_obligations").select("document_id").in("document_id", documentIds)
        : Promise.resolve({ data: [], error: null }),
    ]);

    if (risks.error) throw risks.error;
    if (obligations.error) throw obligations.error;

    const riskCounts = new Map<string, number>();
    const obligationCounts = new Map<string, number>();
    (risks.data ?? []).forEach(row => riskCounts.set(row.document_id, (riskCounts.get(row.document_id) ?? 0) + 1));
    (obligations.data ?? []).forEach(row => obligationCounts.set(row.document_id, (obligationCounts.get(row.document_id) ?? 0) + 1));

    return NextResponse.json({
      analyses: rows.map(row => ({
        ...row,
        documents: undefined,
        document: normalizeDocument(row.documents),
        owner: resolveOwner(ownerMap, row.owner_clerk_id),
        riskCount: riskCounts.get(row.document_id) ?? 0,
        obligationCount: obligationCounts.get(row.document_id) ?? 0,
      })),
      stats: {
        total: total.count ?? 0,
        high: high.count ?? 0,
        medium: medium.count ?? 0,
        low: low.count ?? 0,
      },
      total: list.count ?? 0,
      page,
      pageSize,
    });
  } catch (error) {
    const detail = errorDetail(error);
    console.error("Admin AI analysis query failed", detail);
    return NextResponse.json(
      { error: "Unable to load AI analyses", detail: process.env.NODE_ENV === "development" ? detail : undefined },
      { status: 500 },
    );
  }
}
