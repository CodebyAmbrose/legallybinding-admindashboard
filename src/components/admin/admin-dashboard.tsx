"use client";

import { useEffect, useMemo, useRef, useState, type ComponentType, type CSSProperties } from "react";
import Link from "next/link";
import {
  Bell,
  BrainCircuit,
  CalendarDays,
  ChevronDown,
  Database,
  Download,
  FileClock,
  FileText,
  Inbox,
  Menu,
  MoreVertical,
  Search,
  ShieldCheck,
  Users,
} from "lucide-react";
import type { AdminOverview } from "@/lib/admin-data";
import { SharedSidebar } from "@/components/admin/shared-sidebar";
import { AdminUserMenu } from "@/components/admin/admin-user-menu";

type Icon = ComponentType<{ size?: number; strokeWidth?: number }>;
type Tone = "blue" | "green" | "purple" | "orange";

function LegacyAdminTopbar({ menu, query, setQuery, exportData }: { menu: () => void; query: string; setQuery: (value: string) => void; exportData: () => void }) {
  const searchRef = useRef<HTMLInputElement>(null);
  useEffect(() => { const onKey = (event: KeyboardEvent) => { if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") { event.preventDefault(); searchRef.current?.focus(); } }; window.addEventListener("keydown", onKey); return () => window.removeEventListener("keydown", onKey); }, []);
  return <header className="admin-topbar"><button className="mobile-menu" onClick={menu} aria-label="Open navigation"><Menu size={20}/></button><label className="global-search"><Search size={17}/><input ref={searchRef} value={query} onChange={event => setQuery(event.target.value)} placeholder="Search documents, owners, actions..."/><kbd>⌘K</kbd></label><div className="topbar-actions"><button className="topbar-control" aria-label="Dashboard reporting period"><CalendarDays size={16}/><span>All time</span><ChevronDown size={13}/></button><button className="topbar-control" onClick={exportData}><Download size={16}/><span>Export</span><ChevronDown size={13}/></button><button className="notification" aria-label="Notifications"><Bell size={19}/></button><div className="admin-profile"><span>AR</span><div><b>Admin User</b><small>Super Admin</small></div><ChevronDown size={14}/></div></div></header>;
}

function AdminTopbar(props: { menu: () => void; query: string; setQuery: (value: string) => void; exportData: () => void }) {
  const { menu, query, setQuery, exportData } = props;
  const searchRef = useRef<HTMLInputElement>(null);
  useEffect(() => { const onKey = (event: KeyboardEvent) => { if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") { event.preventDefault(); searchRef.current?.focus(); } }; window.addEventListener("keydown", onKey); return () => window.removeEventListener("keydown", onKey); }, []);
  return <header className="admin-topbar"><button className="mobile-menu" onClick={menu} aria-label="Open navigation"><Menu size={20}/></button><label className="global-search"><Search size={17}/><input ref={searchRef} value={query} onChange={event => setQuery(event.target.value)} placeholder="Search documents, owners, actions..."/><kbd>⌘K</kbd></label><div className="topbar-actions"><button className="topbar-control" aria-label="Dashboard reporting period"><CalendarDays size={16}/><span>All time</span><ChevronDown size={13}/></button><button className="topbar-control" onClick={exportData}><Download size={16}/><span>Export</span><ChevronDown size={13}/></button><button className="notification" aria-label="Notifications"><Bell size={19}/></button><AdminUserMenu/></div></header>;
}

function PeriodSelect({ value }: { value: string }) {
  const [period, setPeriod] = useState(value);
  return <label className="period-select"><select value={period} onChange={event => setPeriod(event.target.value)} aria-label={`${value} reporting period`}><option>Last 7 days</option><option>Last 30 days</option><option>Last 90 days</option><option>All time</option></select><ChevronDown size={12}/></label>;
}

function CardHeader({ title, period, action, actionHref }: { title: string; period?: string; action?: string; actionHref?: string }) {
  const href = actionHref || ({ "Recent Documents": "/documents", "Processing Queue": "/processing", "Risk Summary": "/risks-obligations", "Recent Activity (Audit Log)": "/audit-logs" } as Record<string, string>)[title];
  return <div className="panel-header"><h2>{title}</h2>{period ? <PeriodSelect value={period}/> : action ? href ? <Link className="panel-action" href={href}>{action}</Link> : <span className="panel-action">{action}</span> : null}</div>;
}

function EmptyState({ icon: EmptyIcon = Inbox, title, copy }: { icon?: Icon; title: string; copy: string }) {
  return <div className="empty-state"><span><EmptyIcon size={25}/></span><strong>{title}</strong><p>{copy}</p></div>;
}

function MetricCard({ label, value, icon: MetricIcon, tone, untracked, sparkPoints }: { label: string; value: string; icon: Icon; tone: Tone; untracked?: boolean; sparkPoints?: string }) {
  return <article className={`metric-card ${untracked ? "is-untracked" : ""}`}><div className="metric-top"><span className={`metric-icon ${tone}`}><MetricIcon size={21}/></span><span>{label}</span></div><strong className="metric-value">{untracked ? "—" : value}</strong>{untracked ? <div className="metric-meta"><b>Not tracked yet</b><small>Tracking not enabled</small></div> : <div className="metric-meta live"><b><i/>Live</b><small>Updated from Supabase</small></div>}{sparkPoints ? <svg className={`metric-spark ${tone}`} viewBox="0 0 170 31" preserveAspectRatio="none" aria-hidden="true"><polyline points={sparkPoints}/></svg> : untracked ? <div className="untracked-baseline"/> : null}</article>;
}

function Metrics({ data }: { data: AdminOverview }) {
  const cumulative = useMemo(() => data.growth.slice(-14).reduce<readonly (readonly [number, number])[]>((points, point, index, rows) => {
    const x = rows.length === 1 ? 0 : index * 170 / (rows.length - 1);
    return [...points, [x, point.total] as const];
  }, []), [data.growth]);
  const max = Math.max(1, ...cumulative.map(([, value]) => value));
  const userSpark = cumulative.map(([x, value]) => `${x},${28 - value / max * 23}`).join(" ");
  const rows: { label: string; value: string; icon: Icon; tone: Tone; untracked?: boolean; sparkPoints?: string }[] = [
    { label: "Total Users", value: String(data.metrics.totalUsers), icon: Users, tone: "blue", sparkPoints: userSpark || undefined },
    { label: "Active Users", value: String(data.metrics.activeUsers ?? 0), icon: ShieldCheck, tone: "green" },
    { label: "Documents Uploaded", value: String(data.metrics.documentsUploaded), icon: FileText, tone: "blue" },
    { label: "Documents Processed", value: String(data.metrics.documentsProcessed), icon: FileClock, tone: "purple" },
    { label: "AI Analyses Completed", value: String(data.metrics.analysesCompleted), icon: BrainCircuit, tone: "purple" },
    { label: "Storage Used", value: `${(data.metrics.storageBytes / 1073741824).toFixed(2)} GB`, icon: Database, tone: "orange" },
  ];
  return <section className="metrics-grid" aria-label="Platform metrics">{rows.map(row => <MetricCard key={row.label} {...row}/>)}</section>;
}

function UserGrowthCard({ data }: { data: AdminOverview }) {
  const values = data.growth.slice(-30);
  if (!values.length) return <section className="panel user-growth"><CardHeader title="User Growth" period="Last 30 days"/><EmptyState title="No growth data yet" copy="User history will appear as accounts are created."/></section>;
  const series = values;
  const max = Math.max(1, ...series.flatMap(value => [value.total, value.users]));
  const width = 620, height = 144, top = 7, bottom = 13;
  const point = (value: number, index: number) => `${series.length === 1 ? width / 2 : index * width / (series.length - 1)},${top + (max - value) / max * (height - top - bottom)}`;
  const totalPoints = series.map((value, index) => point(value.total, index));
  const newPoints = series.map((value, index) => point(value.users, index));
  const totalPath = totalPoints.join(" "), newPath = newPoints.join(" ");
  const dates = [series[0], series[Math.floor((series.length - 1) / 2)], series[series.length - 1]];
  const formatDate = (date: string) => new Date(`${date}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return <section className="panel user-growth"><CardHeader title="User Growth" period="Last 30 days"/><div className="chart-legend"><span><i className="blue"/>Total users</span><span><i className="green"/>New users</span></div><div className="growth-plot"><div className="growth-y"><span>{max}</span><span>{Math.round(max * .66)}</span><span>{Math.round(max * .33)}</span><span>0</span></div><svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" role="img" aria-label="Total and new user growth"><defs><linearGradient id="userArea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#1677ff" stopOpacity=".13"/><stop offset="1" stopColor="#1677ff" stopOpacity="0"/></linearGradient></defs><g className="chart-grid"><path d={`M0 7H${width}M0 48H${width}M0 89H${width}M0 131H${width}`}/></g>{series.length > 1 && <polygon className="growth-area" points={`0,131 ${totalPath} ${width},131`}/>}<polyline className="growth-total" points={totalPath}/><polyline className="growth-new" points={newPath}/>{totalPoints.map((coordinates, index) => { const [cx, cy] = coordinates.split(","); return <circle className="growth-total-dot" key={`total-${index}`} cx={cx} cy={cy} r="3"/>; })}{newPoints.map((coordinates, index) => { const [cx, cy] = coordinates.split(","); return <circle className="growth-new-dot" key={`new-${index}`} cx={cx} cy={cy} r="2.5"/>; })}</svg></div><div className="growth-x">{dates.map((value, index) => <span key={`${value.date}-${index}`}>{formatDate(value.date)}</span>)}</div></section>;
}

const statusOrder = ["uploaded", "queued", "processing", "completed", "failed"] as const;
const statusColors = { uploaded: "#1677ff", queued: "#6d5ce8", processing: "#f59e0b", completed: "#22b97b", failed: "#ef4444" };
function DocumentStatusCard({ data }: { data: AdminOverview }) {
  const total = statusOrder.reduce((sum, status) => sum + data.status[status], 0);
  let start = 0;
  const stops = statusOrder.map(status => { const end = start + (total ? data.status[status] / total * 100 : 0); const stop = `${statusColors[status]} ${start}% ${end}%`; start = end; return stop; });
  const donutStyle = { "--donut": total ? `conic-gradient(${stops.join(",")})` : "#edf1f5" } as CSSProperties;
  return <section className="panel document-status"><CardHeader title="Documents by Status" period="Last 30 days"/>{total ? <div className="donut-layout"><div className="donut" style={donutStyle}><div><strong>{total}</strong><span>Total</span></div></div><div className="status-list">{statusOrder.map(status => <div key={status}><i style={{ background: statusColors[status] }}/><span>{status.charAt(0).toUpperCase() + status.slice(1)}</span><strong>{data.status[status]}</strong><small>({(data.status[status] / total * 100).toFixed(1)}%)</small></div>)}</div></div> : <EmptyState title="No documents yet" copy="Document statuses will appear after the first upload."/>}</section>;
}

function AIUsageCard() { const [usage,setUsage]=useState<{available?:boolean;inputTokens:number;outputTokens:number;estimatedCost:number;requests:number}|null>(null); useEffect(()=>{let mounted=true; const load=()=>fetch("/api/admin/usage").then(r=>r.ok?r.json():null).then(value=>{if(mounted)setUsage(value)}).catch(()=>null); load(); const timer=window.setInterval(load,30000); return()=>{mounted=false;window.clearInterval(timer)}},[]); if(!usage||usage.available===false) return <section className="panel ai-usage"><CardHeader title="AI Usage (Tokens)"/><EmptyState icon={BrainCircuit} title="Usage tracking unavailable" copy="Apply the AI usage migration to start recording token and cost metrics."/></section>; const formatTokens=(value:number)=>value>=1000000?`${(value/1000000).toFixed(2)}M`:value>=1000?`${(value/1000).toFixed(1)}K`:String(value); const formatCost=(value:number)=>value===0?"$0.00":value<0.01?`$${value.toFixed(4)}`:`$${value.toFixed(2)}`; const total=usage.inputTokens+usage.outputTokens; return <section className="panel ai-usage"><CardHeader title="AI Usage (Tokens)" period="All time"/><div className="ai-usage-body"><div><strong>{formatTokens(total)}</strong><span>Total Tokens</span></div><div className="ai-usage-grid"><p><b>{formatTokens(usage.inputTokens)}</b><span>Input Tokens</span></p><p><b>{formatTokens(usage.outputTokens)}</b><span>Output Tokens</span></p><p><b>{formatCost(usage.estimatedCost)}</b><span>Estimated Cost</span></p><p><b>{usage.requests.toLocaleString()}</b><span>AI Requests</span></p></div></div></section>; }

function StatusBadge({ value }: { value: string }) { return <span className={`status-badge ${value.toLowerCase()}`}>{value}</span>; }
function RiskBadge({ value }: { value: string }) { return <span className={`risk-badge ${value.toLowerCase()}`}>{value}</span>; }

function RecentDocumentsCard({ data, query }: { data: AdminOverview; query: string }) {
  const documents = data.documents.filter(document => `${document.name} ${document.owner} ${document.status} ${document.risk}`.toLowerCase().includes(query.toLowerCase()));
  return <section className="panel recent-documents"><CardHeader title="Recent Documents" action="View all"/><div className="table-wrap"><table><thead><tr><th>Document</th><th>Owner</th><th>Status</th><th>Uploaded</th><th>Risk</th><th><span className="sr-only">Actions</span></th></tr></thead><tbody>{documents.map(document => <tr key={document.id}><td><div className="document-cell"><span className="file-chip"><FileText size={13}/></span><strong title={document.name}>{document.name}</strong></div></td><td><span className="owner-cell" title={document.owner}>{document.owner}</span></td><td><StatusBadge value={document.status}/></td><td>{document.uploaded}</td><td><RiskBadge value={document.risk}/></td><td><button className="more-button" aria-label={`Actions for ${document.name}`}><MoreVertical size={15}/></button></td></tr>)}</tbody></table>{!documents.length && <EmptyState title="No recent documents" copy={query ? "No documents match your search." : "New uploads will appear here."}/>}</div></section>;
}

function ProcessingQueueCard({ data }: { data: AdminOverview }) {
  return <section className="panel processing-queue"><CardHeader title="Processing Queue" action="View all"/><div className="queue-totals"><div><strong>{data.queue.inQueue}</strong><span>In Queue</span></div><div><strong>{data.queue.processing}</strong><span>Processing</span></div><div><strong>{data.queue.failed}</strong><span>Failed</span></div></div><h3>Current Jobs</h3>{data.queue.jobs.length ? <div className="job-list">{data.queue.jobs.map(job => <div className="job-row" key={job.id}><span className="file-chip"><FileText size={13}/></span><div className="job-name"><strong>{job.name}</strong><small title={`${job.stage} · ${job.owner}`}>{job.stage}</small></div><span className={`job-state ${job.status}`}>{job.status === "processing" ? "Processing" : "Queued"}</span></div>)}</div> : <EmptyState title="No active jobs" copy="The processing queue is currently idle."/>}</section>;
}

function RiskSummaryCard({ data }: { data: AdminOverview }) {
  const rows = [["High", data.metrics.highRisks, "red"], ["Medium", data.metrics.mediumRisks, "orange"], ["Low", data.metrics.lowRisks, "green"]] as const;
  return <section className="panel risk-summary"><CardHeader title="Risk Summary" action="View all"/><div className="risk-totals"><div><strong>{data.metrics.totalRisks}</strong><span>Total Risks</span></div>{rows.map(([name, count]) => <div key={name}><strong>{count}</strong><span>{name} Risk</span></div>)}</div><h3>Risk Severity</h3>{data.metrics.totalRisks ? <div className="risk-list">{rows.map(([name, count, tone]) => { const percent = count / data.metrics.totalRisks * 100; return <div className="risk-row" key={name}><span>{name} Risk</span><div><i className={tone} style={{ width: `${percent}%` }}/></div><strong>{count} <small>({percent.toFixed(1)}%)</small></strong></div>; })}</div> : <EmptyState title="No risks detected" copy="Risk findings will appear after analysis."/>}</section>;
}

function AuditLogCard({ data }: { data: AdminOverview }) {
  return <section className="panel audit-log"><CardHeader title="Recent Activity (Audit Log)" action="View all"/><div className="table-wrap"><table><thead><tr><th>Action</th><th>User</th><th>Target</th><th>Details</th><th>IP Address</th><th>Time</th></tr></thead><tbody>{data.audit.map(event => <tr key={event.id}><td>{event.action}</td><td><span title={event.user}>{event.user}</span></td><td>{event.target}</td><td><span className="audit-details" title={event.details}>{event.details}</span></td><td>{event.ip}</td><td>{event.time}</td></tr>)}</tbody></table>{!data.audit.length && <EmptyState title="No recent activity" copy="Administrative actions will appear here."/>}</div></section>;
}

function DashboardSkeleton() {
  return <div className="dashboard-content" aria-label="Loading dashboard"><div className="heading-skeleton skeleton"/><div className="metrics-grid">{Array.from({ length: 6 }, (_, index) => <div className="metric-card skeleton" key={index}/>)}</div><div className="analytics-grid">{Array.from({ length: 3 }, (_, index) => <div className="panel skeleton skeleton-panel" key={index}/>)}</div><div className="operations-grid">{Array.from({ length: 3 }, (_, index) => <div className="panel skeleton skeleton-panel" key={index}/>)}</div></div>;
}

export function AdminDashboard() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [data, setData] = useState<AdminOverview | null>(null);
  const [error, setError] = useState("");
  const requestDashboard = async () => { const response = await fetch("/api/admin/overview"); const text = await response.text(); let body: { error?: string; detail?: string } | AdminOverview; try { body = JSON.parse(text); } catch { throw new Error(`Admin API returned an invalid response (${response.status})`); } if (!response.ok) { const failure = body as { error?: string; detail?: string }; throw new Error(failure.detail || failure.error || "Unable to load dashboard"); } return body as AdminOverview; };
  const load = () => { setError(""); setData(null); requestDashboard().then(setData).catch(reason => setError(reason instanceof Error ? reason.message : "Unable to load dashboard")); };
  useEffect(() => { let mounted = true; let firstLoad = true; const refresh = () => requestDashboard().then(value => { if (mounted) { setData(value); setError(""); firstLoad = false; } }).catch(reason => { if (mounted && firstLoad) setError(reason instanceof Error ? reason.message : "Unable to load dashboard"); }); refresh(); const timer = window.setInterval(refresh, 30000); return () => { mounted = false; window.clearInterval(timer); }; }, []);
  const exportData = () => { if (!data) return; const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }), url = URL.createObjectURL(blob), link = document.createElement("a"); link.href = url; link.download = `legallybinding-admin-${new Date().toISOString().slice(0, 10)}.json`; link.click(); URL.revokeObjectURL(url); };
  return <div className="admin-shell"><SharedSidebar open={menuOpen} close={() => setMenuOpen(false)}/>{menuOpen && <button className="sidebar-backdrop" onClick={() => setMenuOpen(false)} aria-label="Close navigation"/>}<main className="admin-main"><AdminTopbar menu={() => setMenuOpen(true)} query={query} setQuery={setQuery} exportData={exportData}/>{!data && !error ? <DashboardSkeleton/> : error ? <div className="dashboard-content"><div className="page-heading"><h1>Overview</h1><p>Live operational data from LegallyBinding.AI.</p></div><section className="panel overview-error"><ShieldCheck size={27}/><strong>Unable to load dashboard data</strong><p>{error}</p><button onClick={load}>Retry</button></section></div> : data && <div className="dashboard-content"><div className="page-heading"><h1>Overview</h1><p>Live operational data from LegallyBinding.AI.</p></div><Metrics data={data}/><div className="analytics-grid"><UserGrowthCard data={data}/><DocumentStatusCard data={data}/><AIUsageCard/></div><div className="operations-grid"><RecentDocumentsCard data={data} query={query}/><ProcessingQueueCard data={data}/><RiskSummaryCard data={data}/></div><AuditLogCard data={data}/></div>}</main></div>;
}
