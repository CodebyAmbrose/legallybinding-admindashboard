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

type TemplateGenerationRow = {
  id: string;
  owner_clerk_id: string;
  document_id: string;
  template_slug: string;
  template_version: string;
  output_format: "pdf" | "docx";
  jurisdiction: string;
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
  const query = sanitizeSearch(url.searchParams.get("query"));
  const format = url.searchParams.get("format") ?? "all";
  const page = parsePage(url.searchParams.get("page"));
  const pageSize = 25;
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  try {
    const database = getAdminSupabase();
    let listQuery = database
      .from("template_generations")
      .select(
        "id,owner_clerk_id,document_id,template_slug,template_version,output_format,jurisdiction,created_at,documents(id,filename,original_filename,status,classification,created_at)",
        { count: "exact" },
      )
      .order("created_at", { ascending: false })
      .range(page * pageSize, (page + 1) * pageSize - 1);

    if (["pdf", "docx"].includes(format)) listQuery = listQuery.eq("output_format", format);
    if (query) {
      listQuery = listQuery.or(
        `owner_clerk_id.ilike.%${query}%,template_slug.ilike.%${query}%,template_version.ilike.%${query}%,jurisdiction.ilike.%${query}%`,
      );
    }

    const [list, total, pdf, docx, recent] = await Promise.all([
      listQuery,
      database.from("template_generations").select("id", { count: "exact", head: true }),
      database.from("template_generations").select("id", { count: "exact", head: true }).eq("output_format", "pdf"),
      database.from("template_generations").select("id", { count: "exact", head: true }).eq("output_format", "docx"),
      database.from("template_generations").select("id", { count: "exact", head: true }).gte("created_at", thirtyDaysAgo),
    ]);

    const failure = [list, total, pdf, docx, recent].find(result => result.error)?.error;
    if (failure) throw failure;

    const rows = (list.data ?? []) as unknown as TemplateGenerationRow[];
    const ownerMap = await loadOwners(database, rows.map(row => row.owner_clerk_id));

    return NextResponse.json({
      generations: rows.map(row => ({
        ...row,
        documents: undefined,
        document: normalizeDocument(row.documents),
        owner: resolveOwner(ownerMap, row.owner_clerk_id),
      })),
      stats: {
        total: total.count ?? 0,
        pdf: pdf.count ?? 0,
        docx: docx.count ?? 0,
        recent: recent.count ?? 0,
      },
      total: list.count ?? 0,
      page,
      pageSize,
    });
  } catch (error) {
    const detail = errorDetail(error);
    console.error("Admin template generations query failed", detail);
    return NextResponse.json(
      { error: "Unable to load template activity", detail: process.env.NODE_ENV === "development" ? detail : undefined },
      { status: 500 },
    );
  }
}
