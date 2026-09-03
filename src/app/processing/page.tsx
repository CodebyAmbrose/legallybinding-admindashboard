"use client";

import { useCallback, useEffect, useMemo, useState, type ComponentType } from "react";
import Link from "next/link";
import {
  Activity,
  ArrowLeft,
  BrainCircuit,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Code2,
  FileClock,
  Filter,
  Inbox,
  Menu,
  MoreVertical,
  RefreshCw,
  Search,
  ShieldCheck,
  TextCursorInput,
  TriangleAlert,
  X,
} from "lucide-react";
import { SharedSidebar } from "@/components/admin/shared-sidebar";
import { readAdminCache, writeAdminCache } from "@/lib/admin-cache";

type Job = {
  id: string;
  document_id: string;
  owner_clerk_id: string;
  stage: string;
  status: string;
  attempt_count: number;
  max_attempts: number;
  provider: string | null;
  error_code: string | null;
  error_message: string | null;
  started_at: string | null;
  completed_at: string | null;
  next_run_at: string | null;
  created_at: string;
  updated_at: string;
};

type Icon = ComponentType<{ size?: number; strokeWidth?: number }>;

const PAGE_SIZE = 10;

function pretty(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, character => character.toUpperCase());
}

function dateParts(value: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return {
    date: date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
    time: date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", second: "2-digit" }),
  };
}

function formatDuration(milliseconds: number | null) {
  if (milliseconds === null || !Number.isFinite(milliseconds) || milliseconds < 0) return "—";
  const totalSeconds = Math.round(milliseconds / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return [hours, minutes, seconds].map(value => String(value).padStart(2, "0")).join(":");
}

function jobDuration(job: Job) {
  if (!job.started_at || !job.completed_at) return null;
  const started = new Date(job.started_at).getTime();
  const completed = new Date(job.completed_at).getTime();
  if (Number.isNaN(started) || Number.isNaN(completed)) return null;
  return completed - started;
}

function stageDetails(stage: string) {
  const normalized = stage.toLowerCase();
  if (normalized.includes("embed")) return { label: pretty(stage), icon: Code2, tone: "blue" };
  if (normalized.includes("extract") || normalized.includes("ocr") || normalized.includes("text")) {
    return { label: pretty(stage), icon: TextCursorInput, tone: "amber" };
  }
  return { label: pretty(stage), icon: BrainCircuit, tone: "purple" };
}

function StatusBadge({ status }: { status: string }) {
  const normalized = status.toLowerCase();
  return <span className={`processing-status-badge ${normalized}`}><i aria-hidden="true" />{pretty(status)}</span>;
}

function ProviderBadge({ provider }: { provider: string | null }) {
  if (!provider) return <span className="processing-muted">—</span>;
  const normalized = provider.toLowerCase().replace(/\s+/g, "-");
  return <span className={`processing-provider-badge ${normalized}`}>{provider}</span>;
}

function MetricCard({ icon: MetricIcon, label, value, supporting, tone }: { icon: Icon; label: string; value: string; supporting: string; tone: string }) {
  return <article className="processing-metric-card"><span className={`processing-metric-icon ${tone}`}><MetricIcon size={19} /></span><div><span>{label}</span><strong>{value}</strong><small>{supporting}</small></div></article>;
}

function ProcessingMetrics({ jobs }: { jobs: Job[] }) {
  const metrics = useMemo(() => {
    const total = jobs.length;
    const completed = jobs.filter(job => job.status.toLowerCase() === "completed").length;
    const processing = jobs.filter(job => ["processing", "queued"].includes(job.status.toLowerCase())).length;
    const failed = jobs.filter(job => job.status.toLowerCase() === "failed").length;
    const durations = jobs.map(jobDuration).filter((duration): duration is number => duration !== null);
    const average = durations.length ? durations.reduce((sum, duration) => sum + duration, 0) / durations.length : null;
    const percent = (count: number) => total ? `${(count / total * 100).toFixed(1)}% of total` : "No jobs yet";
    return { total, completed, processing, failed, average, percent };
  }, [jobs]);

  return <section className="processing-metrics" aria-label="Processing metrics">
    <MetricCard icon={FileClock} label="Total Jobs" value={String(metrics.total)} supporting={metrics.total ? "Live from Supabase" : "No jobs yet"} tone="blue" />
    <MetricCard icon={ShieldCheck} label="Completed" value={String(metrics.completed)} supporting={metrics.total ? metrics.percent(metrics.completed) : "No completed jobs"} tone="green" />
    <MetricCard icon={Clock3} label="Processing" value={String(metrics.processing)} supporting={metrics.total ? `${metrics.percent(metrics.processing)} · includes queued` : "No active jobs"} tone="amber" />
    <MetricCard icon={TriangleAlert} label="Failed" value={String(metrics.failed)} supporting={metrics.total ? metrics.percent(metrics.failed) : "No failed jobs"} tone="red" />
    <MetricCard icon={Activity} label="Avg. Duration" value={formatDuration(metrics.average)} supporting={metrics.average === null ? "Not available yet" : "Across completed jobs"} tone="purple" />
  </section>;
}

function ProcessingFilters({
  query,
  setQuery,
  stage,
  setStage,
  status,
  setStatus,
  provider,
  setProvider,
  stages,
  providers,
  moreFilters,
  setMoreFilters,
  hasErrorOnly,
  setHasErrorOnly,
  refresh,
  loading,
}: {
  query: string;
  setQuery: (value: string) => void;
  stage: string;
  setStage: (value: string) => void;
  status: string;
  setStatus: (value: string) => void;
  provider: string;
  setProvider: (value: string) => void;
  stages: string[];
  providers: string[];
  moreFilters: boolean;
  setMoreFilters: (value: boolean) => void;
  hasErrorOnly: boolean;
  setHasErrorOnly: (value: boolean) => void;
  refresh: () => void;
  loading: boolean;
}) {
  return <div className="processing-filter-toolbar">
    <label className="processing-search"><Search size={15} /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search by document ID, owner..." /></label>
    <label className="processing-filter-field"><span>Stage</span><select value={stage} onChange={event => setStage(event.target.value)}><option value="all">All stages</option>{stages.map(value => <option key={value} value={value}>{pretty(value)}</option>)}</select></label>
    <label className="processing-filter-field"><span>Status</span><select value={status} onChange={event => setStatus(event.target.value)}><option value="all">All statuses</option><option value="queued">Queued</option><option value="processing">Processing</option><option value="completed">Completed</option><option value="failed">Failed</option></select></label>
    <label className="processing-filter-field"><span>Provider</span><select value={provider} onChange={event => setProvider(event.target.value)}><option value="all">All providers</option>{providers.map(value => <option key={value} value={value}>{value}</option>)}</select></label>
    <label className="processing-filter-field"><span>Workspace</span><select disabled defaultValue="all" title="Workspace data is not returned by the processing API"><option value="all">Not tracked</option></select></label>
    <button className={`processing-more-filter${moreFilters ? " active" : ""}`} onClick={() => setMoreFilters(!moreFilters)} aria-expanded={moreFilters}><Filter size={14} />More filters</button>
    <button className="processing-refresh" onClick={refresh} disabled={loading}><RefreshCw size={14} className={loading ? "processing-spin" : ""} />Refresh</button>
    {moreFilters && <div className="processing-extra-filters"><label><input type="checkbox" checked={hasErrorOnly} onChange={event => setHasErrorOnly(event.target.checked)} /> Has errors only</label></div>}
  </div>;
}

function StageCell({ stage }: { stage: string }) {
  const details = stageDetails(stage);
  const StageIcon = details.icon;
  return <div className="processing-stage-cell"><span className={`processing-stage-icon ${details.tone}`}><StageIcon size={15} /></span><strong>{details.label}</strong></div>;
}

function ProcessingRow({ job, onView, onRetry, retrying, menuOpen, toggleMenu }: { job: Job; onView: (job: Job) => void; onRetry: (job: Job) => void; retrying: boolean; menuOpen: boolean; toggleMenu: () => void }) {
  const updated = dateParts(job.updated_at);
  const error = job.error_message || job.error_code;
  return <tr className={job.status.toLowerCase() === "failed" ? "processing-failed-row" : undefined}>
    <td><StageCell stage={job.stage} /></td>
    <td><StatusBadge status={job.status} /></td>
    <td><span className="processing-id" title={job.document_id}>{job.document_id}</span><small className="processing-job-id" title={job.id}>Job: {job.id}</small></td>
    <td><div className="processing-owner"><span title={job.owner_clerk_id}>{job.owner_clerk_id}</span><small>Workspace not tracked</small></div></td>
    <td><span className={job.attempt_count >= job.max_attempts && job.status.toLowerCase() === "failed" ? "processing-attempts failed" : "processing-attempts"}>{job.attempt_count} / {job.max_attempts}</span></td>
    <td><ProviderBadge provider={job.provider} /></td>
    <td>{updated ? <span className="processing-updated"><b>{updated.date}</b><small>{updated.time}</small></span> : <span className="processing-muted">—</span>}</td>
    <td>{error ? <span className="processing-error" title={error}>{error}</span> : <span className="processing-muted">—</span>}</td>
    <td><div className="processing-actions"><button onClick={() => onView(job)}>View</button><div className="processing-menu-wrap"><button className="processing-menu-button" aria-label={`More actions for ${job.document_id}`} aria-expanded={menuOpen} onClick={toggleMenu}><MoreVertical size={15} /></button>{menuOpen && <div className="processing-menu"><button onClick={() => onView(job)}>View details</button>{job.status.toLowerCase() === "failed" && <button onClick={() => onRetry(job)} disabled={retrying}>{retrying ? "Retrying..." : "Retry job"}</button>}<button onClick={() => navigator.clipboard?.writeText(job.document_id)}>Copy document ID</button></div>}</div></div></td>
    </tr>;
}

function ProcessingDetails({ job, close, onRetry, retrying }: { job: Job; close: () => void; onRetry: (job: Job) => void; retrying: boolean }) {
  const updated = dateParts(job.updated_at);
  const created = dateParts(job.created_at);
  return <div className="processing-detail-backdrop" onClick={close}><aside className="processing-detail-drawer" onClick={event => event.stopPropagation()} aria-label="Processing job details">
    <button className="processing-detail-close" onClick={close} aria-label="Close processing details"><X size={17} /></button>
    <span className="processing-detail-eyebrow">Processing job</span>
    <h2>{job.document_id}</h2>
    <p className="processing-detail-subtitle"><StatusBadge status={job.status} /></p>
    <dl className="processing-detail-list">
      <div><dt>Stage</dt><dd><StageCell stage={job.stage} /></dd></div>
      <div><dt>Job ID</dt><dd title={job.id}>{job.id}</dd></div>
      <div><dt>Owner</dt><dd>{job.owner_clerk_id}</dd></div>
      <div><dt>Provider</dt><dd><ProviderBadge provider={job.provider} /></dd></div>
      <div><dt>Attempts</dt><dd>{job.attempt_count} / {job.max_attempts}</dd></div>
      <div><dt>Created</dt><dd>{created ? `${created.date} at ${created.time}` : "—"}</dd></div>
      <div><dt>Updated</dt><dd>{updated ? `${updated.date} at ${updated.time}` : "—"}</dd></div>
      <div><dt>Duration</dt><dd>{formatDuration(jobDuration(job))}</dd></div>
      <div><dt>Error summary</dt><dd className={job.error_message || job.error_code ? "processing-detail-error" : ""}>{job.error_message || job.error_code || "—"}</dd></div>
    </dl>
    {job.status.toLowerCase() === "failed" && <button className="processing-detail-retry" onClick={() => onRetry(job)} disabled={retrying}>{retrying ? "Retrying..." : "Retry job"}</button>}
    <p className="processing-privacy-note"><ShieldCheck size={14} /> Operational metadata only. Private document contents are not displayed.</p>
  </aside></div>;
}

function ProcessingTable({ jobs, loading, query, onView, onRetry, retryingId, menuId, setMenuId }: { jobs: Job[]; loading: boolean; query: string; onView: (job: Job) => void; onRetry: (job: Job) => void; retryingId: string | null; menuId: string | null; setMenuId: (id: string | null) => void }) {
  if (loading && !jobs.length) return <div className="processing-table-state"><span className="loading-ring" /><strong>Loading processing jobs...</strong></div>;
  if (!loading && !jobs.length) return <div className="processing-table-state"><Inbox size={28} /><strong>No processing jobs found</strong><p>{query ? "Try changing your search or filters." : "No processing jobs have been created yet."}</p></div>;
  return <div className="processing-table-scroll"><table className="processing-table"><thead><tr><th>Stage</th><th>Status</th><th>Document ID</th><th>Owner / Workspace</th><th>Attempts</th><th>Provider</th><th>Updated</th><th>Duration</th><th>Error</th><th><span className="sr-only">Actions</span></th></tr></thead><tbody>{jobs.map(job => <ProcessingRow key={job.id} job={job} onView={onView} onRetry={onRetry} retrying={retryingId === job.id} menuOpen={menuId === job.id} toggleMenu={() => setMenuId(menuId === job.id ? null : job.id)} />)}</tbody></table></div>;
}

function ProcessingSkeleton() {
  return <><div className="processing-metrics">{Array.from({ length: 5 }, (_, index) => <div className="processing-metric-card skeleton" key={index} />)}</div><section className="panel processing-panel processing-skeleton-panel"><div className="processing-skeleton-toolbar skeleton" /><div className="processing-skeleton-table">{Array.from({ length: 10 }, (_, index) => <div className="processing-skeleton-row skeleton" key={index} />)}</div></section></>;
}

export default function ProcessingPage() {
  const [status, setStatus] = useState("all");
  const cachedJobs = readAdminCache<Job[]>(`admin-processing-cache-v1-${status}`, []);
  const [jobs, setJobs] = useState<Job[]>(cachedJobs);
  const [stage, setStage] = useState("all");
  const [provider, setProvider] = useState("all");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(!cachedJobs.length);
  const [error, setError] = useState("");
  const [menu, setMenu] = useState(false);
  const [menuId, setMenuId] = useState<string | null>(null);
  const [selected, setSelected] = useState<Job | null>(null);
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [moreFilters, setMoreFilters] = useState(false);
  const [hasErrorOnly, setHasErrorOnly] = useState(false);

  const loadJobs = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/admin/processing?status=${encodeURIComponent(status)}`);
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Unable to load processing jobs");
      const nextJobs = Array.isArray(body.jobs) ? body.jobs : [];
      setJobs(nextJobs);
      writeAdminCache(`admin-processing-cache-v1-${status}`, nextJobs);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to load processing jobs");
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/admin/processing?status=${encodeURIComponent(status)}`)
      .then(async response => {
        const body = await response.json();
        if (!response.ok) throw new Error(body.error || "Unable to load processing jobs");
        if (!cancelled) { const nextJobs = Array.isArray(body.jobs) ? body.jobs : []; setJobs(nextJobs); writeAdminCache(`admin-processing-cache-v1-${status}`, nextJobs); }
      })
      .catch(reason => {
        if (!cancelled) setError(reason instanceof Error ? reason.message : "Unable to load processing jobs");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [status]);

  const stages = useMemo(() => Array.from(new Set(jobs.map(job => job.stage).filter(Boolean))).sort(), [jobs]);
  const providers = useMemo(() => Array.from(new Set(jobs.map(job => job.provider).filter((value): value is string => Boolean(value)))).sort(), [jobs]);
  const filteredJobs = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return jobs.filter(job => {
      const matchesQuery = !normalizedQuery || [job.id, job.document_id, job.owner_clerk_id, job.stage, job.provider || "", job.error_message || ""].join(" ").toLowerCase().includes(normalizedQuery);
      const matchesStage = stage === "all" || job.stage === stage;
      const matchesProvider = provider === "all" || job.provider === provider;
      const matchesErrors = !hasErrorOnly || Boolean(job.error_message || job.error_code);
      return matchesQuery && matchesStage && matchesProvider && matchesErrors;
    });
  }, [hasErrorOnly, jobs, provider, query, stage]);

  const pagedJobs = filteredJobs.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const pageCount = Math.max(1, Math.ceil(filteredJobs.length / PAGE_SIZE));
  const start = filteredJobs.length ? page * PAGE_SIZE + 1 : 0;
  const end = Math.min((page + 1) * PAGE_SIZE, filteredJobs.length);

  const retryJob = useCallback(async (job: Job) => {
    setRetryingId(job.id);
    setError("");
    try {
      const response = await fetch(`/api/admin/processing/${encodeURIComponent(job.id)}/retry`, { method: "POST" });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Unable to retry processing job");
      setMenuId(null);
      setSelected(null);
      await loadJobs();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to retry processing job");
    } finally {
      setRetryingId(null);
    }
  }, [loadJobs]);

  return <div className="admin-shell">
    <SharedSidebar open={menu} close={() => setMenu(false)} />
    {menu && <button className="sidebar-backdrop" onClick={() => setMenu(false)} aria-label="Close navigation" />}
    <main className="admin-main">
      <header className="admin-topbar processing-topbar">
        <button className="mobile-menu" onClick={() => setMenu(true)} aria-label="Open navigation"><Menu size={20} /></button>
        <Link className="back-link" href="/"><ArrowLeft size={17} />Overview</Link>
        <label className="global-search processing-global-search"><Search size={16} /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search processing jobs..." /><kbd>⌘K</kbd></label>
        <div className="topbar-actions"><button className="processing-top-refresh" onClick={loadJobs} disabled={loading}><RefreshCw size={15} className={loading ? "processing-spin" : ""} />Refresh</button><button className="notification" aria-label="Notifications"><Activity size={19} /><span>12</span></button><div className="admin-profile"><span>AR</span><div><b>Admin User</b><small>Super Admin</small></div><ChevronDown size={14} /></div></div>
      </header>
      <div className="dashboard-content processing-content">
        <div className="page-heading"><h1>Processing</h1><p>Monitor extraction, OCR and classification jobs across all workspaces.</p></div>
        {loading && !jobs.length && !error ? <ProcessingSkeleton /> : <>
          <ProcessingMetrics jobs={jobs} />
          <section className="panel processing-panel">
            <ProcessingFilters query={query} setQuery={value => { setPage(0); setQuery(value); }} stage={stage} setStage={value => { setPage(0); setStage(value); }} status={status} setStatus={value => { setPage(0); setLoading(true); setError(""); setStatus(value); }} provider={provider} setProvider={value => { setPage(0); setProvider(value); }} stages={stages} providers={providers} moreFilters={moreFilters} setMoreFilters={setMoreFilters} hasErrorOnly={hasErrorOnly} setHasErrorOnly={value => { setPage(0); setHasErrorOnly(value); }} refresh={loadJobs} loading={loading} />
            {error ? <div className="processing-table-state error-state"><TriangleAlert size={28} /><strong>Unable to load processing jobs</strong><p>{error}</p><button onClick={loadJobs}>Retry</button></div> : <ProcessingTable jobs={pagedJobs} loading={loading} query={query} onView={setSelected} onRetry={retryJob} retryingId={retryingId} menuId={menuId} setMenuId={setMenuId} />}
            <footer className="processing-footer"><span>Showing {start}–{end} of {filteredJobs.length} jobs</span><div className="processing-pagination"><button disabled={page === 0} onClick={() => setPage(Math.max(0, page - 1))} aria-label="Previous page"><ChevronLeft size={16} /></button>{Array.from({ length: Math.min(pageCount, 5) }, (_, index) => <button key={index} className={index === page ? "current-page" : ""} onClick={() => setPage(index)}>{index + 1}</button>)}<button disabled={page >= pageCount - 1} onClick={() => setPage(Math.min(pageCount - 1, page + 1))} aria-label="Next page"><ChevronRight size={16} /></button><button className="page-size">10 / page <ChevronDown size={13} /></button></div></footer>
          </section>
        </>}
      </div>
    </main>
    {selected && <ProcessingDetails job={selected} close={() => setSelected(null)} onRetry={retryJob} retrying={retryingId === selected.id} />}
  </div>;
}
