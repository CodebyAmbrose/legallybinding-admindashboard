import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { getAdminSupabase } from "@/lib/supabase-admin";

export async function GET(request: Request) {
  const access = await requireAdmin();
  if (!access.ok) return NextResponse.json({ error: access.status === 401 ? "Authentication required" : "Admin access required" }, { status: access.status });
  try {
    const db = getAdminSupabase(); const status = new URL(request.url).searchParams.get("status"); let query = db.from("document_processing_jobs").select("id,document_id,owner_clerk_id,stage,status,attempt_count,max_attempts,provider,error_code,error_message,started_at,completed_at,next_run_at,created_at,updated_at").order("created_at", { ascending: false }).limit(200); if (status && status !== "all") query = query.eq("status", status); const result = await query;
    if (result.error) throw result.error; return NextResponse.json({ jobs: result.data || [] });
  } catch (error) { console.error("Admin processing query failed", error); return NextResponse.json({ error: "Unable to load processing jobs" }, { status: 500 }); }
}
