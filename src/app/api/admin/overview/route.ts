import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { getAdminSupabase } from "@/lib/supabase-admin";
import { getClerkUserActivityMetrics } from "@/lib/clerk-user-metrics";

const PAGE_SIZE = 1_000;
const statusNames = ["uploaded", "queued", "processing", "completed", "failed"] as const;
const queueStatusNames = ["queued", "processing", "failed"] as const;

const relativeTime = (value: string) => {
  const seconds = Math.max(1, Math.floor((Date.now() - new Date(value).getTime()) / 1_000));
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3_600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86_400) return `${Math.floor(seconds / 3_600)}h ago`;
  return `${Math.floor(seconds / 86_400)}d ago`;
};

const titleCase = (value: string) => value ? value.charAt(0).toUpperCase() + value.slice(1) : "Uploaded";

async function getStorageBytes() {
  const database = getAdminSupabase();
  let total = 0;
  let from = 0;
  while (true) {
    const result = await database.from("documents").select("file_size").range(from, from + PAGE_SIZE - 1);
    if (result.error) throw result.error;
    const rows = result.data ?? [];
    total += rows.reduce((sum, row) => sum + (Number(row.file_size) || 0), 0);
    if (rows.length < PAGE_SIZE) return total;
    from += PAGE_SIZE;
  }
}

export async function GET() {
  const access = await requireAdmin();
  if (!access.ok) return NextResponse.json({ error: access.status === 401 ? "Authentication required" : "Admin access required" }, { status: access.status });
  try {
    const database = getAdminSupabase();
    const reportingStart = new Date();
    reportingStart.setUTCHours(0, 0, 0, 0);
    reportingStart.setUTCDate(reportingStart.getUTCDate() - 29);

    const [coreResults, statusResults, queueCountResults, userActivity, storageBytes] = await Promise.all([
      Promise.all([
        database.from("documents").select("id", { count: "exact", head: true }),
        database.from("documents").select("id", { count: "exact", head: true }).eq("status", "completed"),
        database.from("documents").select("id,filename,original_filename,owner_clerk_id,status,created_at").order("created_at", { ascending: false }).limit(5),
        database.from("document_analyses").select("id", { count: "exact", head: true }),
        database.from("document_risks").select("id", { count: "exact", head: true }),
        database.from("document_risks").select("id", { count: "exact", head: true }).eq("severity", "high"),
        database.from("document_risks").select("id", { count: "exact", head: true }).eq("severity", "medium"),
        database.from("document_risks").select("id", { count: "exact", head: true }).eq("severity", "low"),
        database.from("document_obligations").select("id", { count: "exact", head: true }),
        database.from("document_processing_jobs").select("id,status,stage,document_id,owner_clerk_id").in("status", ["queued", "processing"]).order("created_at", { ascending: false }).limit(4),
        database.from("audit_logs").select("id,action,entity_type,entity_id,metadata,created_at,owner_clerk_id").order("created_at", { ascending: false }).limit(5),
      ]),
      Promise.all(statusNames.map(status => database.from("documents").select("id", { count: "exact", head: true }).eq("status", status).gte("created_at", reportingStart.toISOString()))),
      Promise.all(queueStatusNames.map(status => database.from("document_processing_jobs").select("id", { count: "exact", head: true }).eq("status", status))),
      getClerkUserActivityMetrics(),
      getStorageBytes(),
    ]);

    const coreError = coreResults.find(result => result.error)?.error;
    const statusError = statusResults.find(result => result.error)?.error;
    const queueError = queueCountResults.find(result => result.error)?.error;
    if (coreError || statusError || queueError) throw coreError ?? statusError ?? queueError;

    const [totalDocs, processed, recent, analyses, risks, highRisks, mediumRisks, lowRisks, obligations, jobs, audit] = coreResults;
    const recentRows = recent.data ?? [];
    const recentIds = recentRows.map(document => document.id);
    const jobRows = jobs.data ?? [];
    const referencedDocumentIds = [...new Set([...recentIds, ...jobRows.map(job => job.document_id)])];
    const [recentRiskResult, documentNameResult] = await Promise.all([
      recentIds.length ? database.from("document_risks").select("document_id,severity").in("document_id", recentIds) : Promise.resolve({ data: [], error: null }),
      referencedDocumentIds.length ? database.from("documents").select("id,filename,original_filename").in("id", referencedDocumentIds) : Promise.resolve({ data: [], error: null }),
    ]);
    if (recentRiskResult.error || documentNameResult.error) throw recentRiskResult.error ?? documentNameResult.error;

    const riskRows = recentRiskResult.data ?? [];
    const severityRank: Record<string, number> = { low: 1, medium: 2, high: 3 };
    const documentNames = new Map((documentNameResult.data ?? []).map(document => [document.id, document.original_filename || document.filename]));
    const documents = recentRows.map(document => {
      const highestRisk = riskRows.filter(risk => risk.document_id === document.id).sort((left, right) => (severityRank[right.severity] || 0) - (severityRank[left.severity] || 0))[0];
      return { id: document.id, name: document.original_filename || document.filename, owner: document.owner_clerk_id, status: titleCase(document.status), uploaded: relativeTime(document.created_at), risk: highestRisk ? titleCase(highestRisk.severity) : "None" };
    });
    const auditRows = audit.data ?? [];

    return NextResponse.json({
      metrics: { totalUsers: userActivity.totalUsers, activeUsers: userActivity.activeUsers, documentsUploaded: totalDocs.count ?? 0, documentsProcessed: processed.count ?? 0, analysesCompleted: analyses.count ?? 0, storageBytes, totalRisks: risks.count ?? 0, highRisks: highRisks.count ?? 0, mediumRisks: mediumRisks.count ?? 0, lowRisks: lowRisks.count ?? 0, obligations: obligations.count ?? 0 },
      status: Object.fromEntries(statusNames.map((name, index) => [name, statusResults[index].count ?? 0])),
      documents,
      queue: { inQueue: queueCountResults[0].count ?? 0, processing: queueCountResults[1].count ?? 0, failed: queueCountResults[2].count ?? 0, jobs: jobRows.map(job => ({ id: job.id, name: documentNames.get(job.document_id) ?? job.document_id, owner: job.owner_clerk_id, stage: titleCase(job.stage.replaceAll("_", " ")), status: job.status })) },
      audit: auditRows.map(row => ({ id: row.id, action: row.action, user: row.owner_clerk_id, target: row.entity_type, details: JSON.stringify(row.metadata ?? {}), ip: String(row.metadata?.ip_address ?? "—"), time: relativeTime(row.created_at) })),
      growth: userActivity.dailyGrowth,
      aiUsage: null,
    });
  } catch (error) {
    const detail = error instanceof Error ? error.message : JSON.stringify(error);
    console.error("Admin overview query failed", detail);
    return NextResponse.json({ error: "Unable to load admin overview", detail: process.env.NODE_ENV === "development" ? detail : undefined }, { status: 500 });
  }
}
