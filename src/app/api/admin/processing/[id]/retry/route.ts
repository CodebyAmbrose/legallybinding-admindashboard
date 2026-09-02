import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { getAdminSupabase } from "@/lib/supabase-admin";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const access = await requireAdmin();
  if (!access.ok) return NextResponse.json({ error: access.status === 401 ? "Authentication required" : "Admin access required" }, { status: access.status });
  const { id } = await params;
  if (!id) return NextResponse.json({ error: "Processing job id is required" }, { status: 400 });
  try {
    const db = getAdminSupabase();
    const job = await db.from("document_processing_jobs").select("id,document_id,attempt_count,max_attempts").eq("id", id).single();
    if (job.error || !job.data) return NextResponse.json({ error: "Processing job not found" }, { status: 404 });
    const nextAttempt = Math.min(Number(job.data.attempt_count || 0) + 1, Number(job.data.max_attempts || 3));
    const update = await db.from("document_processing_jobs").update({ status: "queued", error_code: null, error_message: null, next_run_at: new Date().toISOString(), attempt_count: nextAttempt }).eq("id", id);
    if (update.error) throw update.error;
    await db.from("documents").update({ status: "queued", error_code: null, error_message: null }).eq("id", job.data.document_id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Admin processing retry failed", error);
    return NextResponse.json({ error: "Unable to retry processing job" }, { status: 500 });
  }
}
