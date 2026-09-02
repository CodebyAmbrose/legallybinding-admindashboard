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

type FindingRow = {
  id: string;
  document_id: string;
  owner_clerk_id: string;
  title: string;
  severity?: "low" | "medium" | "high";
  explanation: string;
  source_text: string | null;
  section_reference?: string | null;
  responsible_party?: string | null;
  due_date?: string | null;
  created_at: string;
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
  const kind = url.searchParams.get("kind") === "obligation" ? "obligation" : "risk";
  const severity = url.searchParams.get("severity") ?? "all";
  const query = sanitizeSearch(url.searchParams.get("query"));
  const page = parsePage(url.searchParams.get("page"));
  const pageSize = 25;

  try {
    const database = getAdminSupabase();
    const table = kind === "risk" ? "document_risks" : "document_obligations";
    const selection = kind === "risk"
      ? "id,document_id,owner_clerk_id,title,severity,explanation,source_text,section_reference,created_at,documents(id,filename,original_filename,status,classification)"
      : "id,document_id,owner_clerk_id,title,responsible_party,due_date,explanation,source_text,created_at,documents(id,filename,original_filename,status,classification)";

    let listQuery = database
      .from(table)
      .select(selection, { count: "exact" })
      .order("created_at", { ascending: false })
      .range(page * pageSize, (page + 1) * pageSize - 1);

    if (kind === "risk" && ["low", "medium", "high"].includes(severity)) listQuery = listQuery.eq("severity", severity);
    if (query) {
      const fields = kind === "risk"
        ? `owner_clerk_id.ilike.%${query}%,title.ilike.%${query}%,explanation.ilike.%${query}%,section_reference.ilike.%${query}%`
        : `owner_clerk_id.ilike.%${query}%,title.ilike.%${query}%,explanation.ilike.%${query}%,responsible_party.ilike.%${query}%,due_date.ilike.%${query}%`;
      listQuery = listQuery.or(fields);
    }

    const [list, allRisks, high, medium, low, obligations] = await Promise.all([
      listQuery,
      database.from("document_risks").select("id", { count: "exact", head: true }),
      database.from("document_risks").select("id", { count: "exact", head: true }).eq("severity", "high"),
      database.from("document_risks").select("id", { count: "exact", head: true }).eq("severity", "medium"),
      database.from("document_risks").select("id", { count: "exact", head: true }).eq("severity", "low"),
      database.from("document_obligations").select("id", { count: "exact", head: true }),
    ]);

    const failure = [list, allRisks, high, medium, low, obligations].find(result => result.error)?.error;
    if (failure) throw failure;

    const rows = (list.data ?? []) as unknown as FindingRow[];
    const ownerMap = await loadOwners(database, rows.map(row => row.owner_clerk_id));

    return NextResponse.json({
      items: rows.map(row => ({
        ...row,
        documents: undefined,
        kind,
        document: normalizeDocument(row.documents),
        owner: resolveOwner(ownerMap, row.owner_clerk_id),
      })),
      stats: {
        risks: allRisks.count ?? 0,
        high: high.count ?? 0,
        medium: medium.count ?? 0,
        low: low.count ?? 0,
        obligations: obligations.count ?? 0,
      },
      total: list.count ?? 0,
      page,
      pageSize,
      kind,
    });
  } catch (error) {
    const detail = errorDetail(error);
    console.error("Admin risks and obligations query failed", detail);
    return NextResponse.json(
      { error: "Unable to load risks and obligations", detail: process.env.NODE_ENV === "development" ? detail : undefined },
      { status: 500 },
    );
  }
}
