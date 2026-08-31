"use client";

import { useMemo, useState } from "react";
import {
  Activity, AlertTriangle, Bell, BookOpen, BriefcaseBusiness, CheckCircle2,
  ChevronDown, CircleDollarSign, Clock3, Database, Download, FileText,
  LayoutDashboard, LifeBuoy, Menu, MoreHorizontal, Search, Settings,
  ShieldCheck, Sparkles, Users, X, Zap,
} from "lucide-react";

const navGroups = [
  { label: "", items: [["Overview", LayoutDashboard]] },
  { label: "MANAGE", items: [["Users", Users], ["Documents", FileText], ["Processing", Activity], ["AI Analysis", Sparkles], ["Risks & Obligations", AlertTriangle], ["Templates", BookOpen], ["Lawyers & Firms", BriefcaseBusiness]] },
  { label: "BUSINESS", items: [["Subscriptions & Billing", CircleDollarSign], ["Credits & Usage", Zap]] },
  { label: "SUPPORT", items: [["Support Requests", LifeBuoy], ["Reports & Exports", Download]] },
  { label: "SYSTEM", items: [["Audit Logs", ShieldCheck], ["System Settings", Settings]] },
] as const;

const documents = [
  { name: "Pine-Harbor-Analytics-Services-Agreement-2026.docx", type: "Service Agreement", owner: "Pine Harbor Analytics", risk: "Medium", uploaded: "2 min ago", obligations: 12 },
  { name: "Ambrose Insurance.pdf", type: "Travel Insurance", owner: "Ambrose RRG", risk: "Low", uploaded: "18 min ago", obligations: 5 },
  { name: "Red-Canyon-NDA.pdf", type: "NDA", owner: "Red Canyon Retail", risk: "High", uploaded: "1 hr ago", obligations: 8 },
  { name: "Employment-Agreement-Jordan-Lee.docx", type: "Employment", owner: "Jordan Lee", risk: "Low", uploaded: "3 hrs ago", obligations: 3 },
  { name: "Vendor-Supply-Agreement.pdf", type: "Supply Agreement", owner: "Acme Supplies Inc.", risk: "Medium", uploaded: "Yesterday", obligations: 9 },
];

function Metric({ icon: Icon, value, label, tone }: { icon: typeof Users; value: string; label: string; tone: string }) {
  return <div className="metric"><span className={`metric-icon ${tone}`}><Icon size={18}/></span><div><strong>{value}</strong><span>{label}</span></div></div>;
}

export default function AdminDashboard() {
  const [active, setActive] = useState("Overview");
  const [query, setQuery] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const filtered = useMemo(() => documents.filter((doc) => Object.values(doc).join(" ").toLowerCase().includes(query.toLowerCase())), [query]);

  return <div className="admin-shell">
    <aside className={`sidebar ${mobileOpen ? "open" : ""}`}>
      <div className="brand"><span className="brand-mark">✓</span><div><b>LegallyBinding<span>.AI</span></b><small>Admin Panel</small></div><button className="close-nav" onClick={() => setMobileOpen(false)} aria-label="Close menu"><X size={18}/></button></div>
      <nav>{navGroups.map((group) => <div className="nav-group" key={group.label || "overview"}>{group.label && <small>{group.label}</small>}{group.items.map(([label, Icon]) => <button key={label} className={active === label ? "active" : ""} onClick={() => { setActive(label); setMobileOpen(false); }}><Icon size={17}/><span>{label}</span></button>)}</div>)}</nav>
      <div className="system-status"><span className="status-dot"/><div><b>System Status</b><small>Operational</small><em>All systems running normally</em><hr/><b>API Health <strong>99.9%</strong></b><div className="mini-spark"><i/><i/><i/><i/><i/><i/><i/></div></div></div>
    </aside>
    {mobileOpen && <button className="backdrop" onClick={() => setMobileOpen(false)} aria-label="Close menu"/>}

    <main className="main">
      <header className="topbar"><button className="menu-btn" onClick={() => setMobileOpen(true)} aria-label="Open menu"><Menu size={21}/></button><div className="crumb">Admin / <b>{active}</b></div><label className="search top-search"><Search size={16}/><input placeholder="Search users, documents, contracts, risks..."/><kbd>⌘ K</kbd></label><div className="top-actions"><button className="icon-btn" aria-label="Notifications"><Bell size={18}/><i/></button><div className="admin-user"><span className="avatar">AR</span><div><b>Admin User</b><small>Super Admin</small></div><ChevronDown size={15}/></div></div></header>
      <div className="content">
        <div className="page-heading"><div><h1>Overview</h1><p className="subtitle">Welcome back, Admin. Here’s what’s happening with your platform.</p></div><div className="heading-actions"><button className="range"><Clock3 size={16}/>May 31 – Jun 30, 2026<ChevronDown size={14}/></button><button className="export"><Download size={16}/>Export <ChevronDown size={14}/></button></div></div>

        <section className="metrics"><Metric icon={Users} value="2,845" label="Total Users" tone="blue"/><Metric icon={ShieldCheck} value="1,928" label="Active Users" tone="green"/><Metric icon={FileText} value="12,486" label="Documents Uploaded" tone="blue"/><Metric icon={Activity} value="10,258" label="Documents Processed" tone="purple"/><Metric icon={Sparkles} value="8,934" label="AI Analyses Completed" tone="purple"/><Metric icon={Database} value="488.7 GB" label="Storage Used" tone="orange"/></section>

        <div className="grid-two">
          <section className="panel chart-panel"><div className="panel-head"><div><h2>User growth</h2><p>New users over the last 30 days</p></div><span className="trend">+18.4% <span>vs previous</span></span></div><div className="chart"><div className="y-axis"><span>3k</span><span>2k</span><span>1k</span><span>0</span></div><svg viewBox="0 0 700 220" preserveAspectRatio="none" role="img" aria-label="User growth rising over 30 days"><defs><linearGradient id="growth-fill" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#4169e1" stopOpacity=".19"/><stop offset="1" stopColor="#4169e1" stopOpacity="0"/></linearGradient></defs><path d="M0 184 C55 178 70 160 120 169 S190 139 238 151 S294 130 340 139 S402 100 448 121 S510 93 556 101 S625 52 700 64 L700 220 L0 220Z" fill="url(#growth-fill)"/><path d="M0 184 C55 178 70 160 120 169 S190 139 238 151 S294 130 340 139 S402 100 448 121 S510 93 556 101 S625 52 700 64" fill="none" stroke="#4169e1" strokeWidth="3"/></svg></div><div className="x-axis"><span>Aug 1</span><span>Aug 8</span><span>Aug 15</span><span>Aug 22</span><span>Aug 30</span></div></section>
          <section className="panel status-panel"><div className="panel-head"><div><h2>Documents by status</h2><p>Current processing overview</p></div><MoreHorizontal size={19}/></div><div className="donut-wrap"><div className="donut"><div><b>12,406</b><span>Total</span></div></div><div className="legend"><span><i className="dot blue"/>Processed <b>87.8%</b></span><span><i className="dot purple"/>Processing <b>6.1%</b></span><span><i className="dot amber"/>Needs review <b>4.3%</b></span><span><i className="dot gray"/>Failed <b>1.8%</b></span></div></div></section>
        </div>

        <section className="panel table-panel"><div className="panel-head"><div><h2>Recent documents</h2><p>Latest documents across your workspace</p></div><button className="link-btn">View all →</button></div><div className="toolbar"><label className="search"><Search size={16}/><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search documents..."/></label><button className="filter">All statuses <ChevronDown size={14}/></button><button className="filter">All types <ChevronDown size={14}/></button></div><div className="table-scroll"><table><thead><tr><th>DOCUMENT</th><th>TYPE</th><th>OWNER</th><th>RISK</th><th>UPLOADED</th><th/></tr></thead><tbody>{filtered.map((doc) => <tr key={doc.name}><td><div className="doc-name"><span className="file-icon"><FileText size={17}/></span><div><b>{doc.name}</b><small>{doc.obligations} obligations</small></div></div></td><td>{doc.type}</td><td>{doc.owner}</td><td><span className={`status ${doc.risk.toLowerCase()}`}>{doc.risk}</span></td><td>{doc.uploaded}</td><td><button className="row-more" aria-label={`Actions for ${doc.name}`}><MoreHorizontal size={17}/></button></td></tr>)}</tbody></table>{filtered.length === 0 && <div className="empty">No documents match your search.</div>}</div></section>

        <div className="grid-three">
          <section className="panel small-panel"><div className="panel-head"><div><h2>AI usage</h2><p>This month</p></div><Sparkles size={18} className="purple-text"/></div><div className="usage-number">8,641 <span>/ 10,000 credits</span></div><div className="progress"><i style={{width: "86%"}}/></div><div className="usage-foot"><span>86% used</span><b>1,359 remaining</b></div></section>
          <section className="panel small-panel"><div className="panel-head"><div><h2>Processing queue</h2><p>Live document pipeline</p></div><Activity size={18} className="blue-text"/></div><div className="queue-number">24 <span>documents in queue</span></div><div className="queue-row"><span>Text extraction</span><b>12</b></div><div className="queue-row"><span>AI analysis</span><b>8</b></div><div className="queue-row"><span>Search indexing</span><b>4</b></div></section>
          <section className="panel small-panel"><div className="panel-head"><div><h2>Risk summary</h2><p>Across all documents</p></div><AlertTriangle size={18} className="red-text"/></div><div className="risk-list"><span><i className="dot red"/>High priority <b>42</b></span><span><i className="dot amber"/>Medium priority <b>183</b></span><span><i className="dot green"/>Low priority <b>621</b></span></div><button className="link-btn">Review risks →</button></section>
        </div>

        <section className="panel activity-panel"><div className="panel-head"><div><h2>Recent activity</h2><p>Latest administrative actions</p></div><button className="link-btn">View audit log →</button></div><div className="activity-list"><div><span className="activity-icon blue"><Users size={15}/></span><p><b>New user registered</b><small>jordan.lee@example.com · 2 minutes ago</small></p></div><div><span className="activity-icon purple"><Sparkles size={15}/></span><p><b>AI analysis completed</b><small>Service Agreement · 8 minutes ago</small></p></div><div><span className="activity-icon green"><FileText size={15}/></span><p><b>Document uploaded</b><small>Ambrose Insurance.pdf · 18 minutes ago</small></p></div></div></section>
      </div>
    </main>
  </div>;
}
