import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { getAdminSupabase } from "@/lib/supabase-admin";

export async function GET(request: Request) {
  const access = await requireAdmin();
  if (!access.ok) return NextResponse.json({ error: access.status === 401 ? "Authentication required" : "Admin access required" }, { status: access.status });
  const url = new URL(request.url); const query = (url.searchParams.get("query") || "").trim(); const status = url.searchParams.get("status"); const page = Math.max(0, Number(url.searchParams.get("page") || 0)); const pageSize = 25;
  try {
    const db = getAdminSupabase(); let requestQuery = db.from("documents").select("id,filename,original_filename,file_type,file_size,owner_clerk_id,status,classification,page_count,error_code,error_message,created_at,updated_at", { count: "exact" }).order("created_at", { ascending: false }).range(page * pageSize, (page + 1) * pageSize - 1);
    if (status && status !== "all") requestQuery = requestQuery.eq("status", status);
    if (query) requestQuery = requestQuery.or(`filename.ilike.%${query}%,original_filename.ilike.%${query}%,owner_clerk_id.ilike.%${query}%`);
    const result = await requestQuery; if (result.error) throw result.error;
    return NextResponse.json({ documents: result.data || [], total: result.count || 0, page, pageSize });
  } catch (error) { console.error("Admin documents query failed", error); return NextResponse.json({ error: "Unable to load documents" }, { status: 500 }); }
}
