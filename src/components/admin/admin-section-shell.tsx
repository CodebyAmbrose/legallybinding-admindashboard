"use client";

import { useState, type ReactNode } from "react";
import {
  Bell,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Menu,
  RefreshCw,
  Search,
  X,
  type LucideIcon,
} from "lucide-react";
import { SharedSidebar } from "@/components/admin/shared-sidebar";

export type OwnerIdentity = {
  id: string;
  name: string | null;
  email: string | null;
};

export function AdminSectionShell({
  title,
  description,
  query,
  setQuery,
  searchPlaceholder,
  refreshing,
  refresh,
  children,
}: {
  title: string;
  description: string;
  query: string;
  setQuery: (value: string) => void;
  searchPlaceholder: string;
  refreshing: boolean;
  refresh: () => void;
  children: ReactNode;
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="admin-shell">
      <SharedSidebar open={menuOpen} close={() => setMenuOpen(false)}/>
      {menuOpen && <button className="sidebar-backdrop" onClick={() => setMenuOpen(false)} aria-label="Close navigation"/>}
      <main className="admin-main">
        <header className="admin-topbar">
          <button className="mobile-menu" onClick={() => setMenuOpen(true)} aria-label="Open navigation"><Menu size={20}/></button>
          <label className="global-search section-global-search">
            <Search size={17}/>
            <input value={query} onChange={event => setQuery(event.target.value)} placeholder={searchPlaceholder}/>
          </label>
          <div className="topbar-actions">
            <button className="topbar-control" onClick={refresh} disabled={refreshing}>
              <RefreshCw size={16} className={refreshing ? "is-spinning" : undefined}/>
              <span>{refreshing ? "Refreshing" : "Refresh"}</span>
            </button>
            <button className="notification" aria-label="Notifications"><Bell size={19}/></button>
            <div className="admin-profile"><span>AR</span><div><b>Admin User</b><small>Super Admin</small></div><ChevronDown size={14}/></div>
          </div>
        </header>
        <div className="dashboard-content admin-section-content">
          <div className="page-heading"><h1>{title}</h1><p>{description}</p></div>
          {children}
        </div>
      </main>
    </div>
  );
}

export function SectionMetric({ icon: Icon, label, value, tone, note }: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  tone: "blue" | "purple" | "red" | "amber" | "green";
  note: string;
}) {
  return (
    <article className="section-metric-card">
      <span className={`section-metric-icon ${tone}`}><Icon size={20}/></span>
      <div><span>{label}</span><strong>{value}</strong><small>{note}</small></div>
    </article>
  );
}

export function OwnerCell({ owner }: { owner: OwnerIdentity }) {
  const label = owner.name?.trim() || owner.email?.trim() || "Unknown user";
  return <div className="owner-identity"><strong>{label}</strong><span title={owner.id}>{owner.email && owner.name ? owner.email : owner.id}</span></div>;
}

export function TableState({ loading, error, empty, retry }: {
  loading: boolean;
  error: string;
  empty: boolean;
  retry: () => void;
}) {
  if (loading) return <div className="section-table-state"><span className="loading-ring"/><strong>Loading live data...</strong></div>;
  if (error) return <div className="section-table-state error-state"><strong>Unable to load data</strong><p>{error}</p><button onClick={retry}>Retry</button></div>;
  if (empty) return <div className="section-table-state"><strong>No records found</strong><p>Try changing the search or filters.</p></div>;
  return null;
}

export function SectionPagination({ page, pageSize, total, setPage }: {
  page: number;
  pageSize: number;
  total: number;
  setPage: (page: number) => void;
}) {
  const start = total ? page * pageSize + 1 : 0;
  const end = Math.min((page + 1) * pageSize, total);
  const pages = Math.max(1, Math.ceil(total / pageSize));
  return (
    <footer className="section-table-footer">
      <span>Showing {start}–{end} of {total}</span>
      <div>
        <button disabled={page === 0} onClick={() => setPage(page - 1)} aria-label="Previous page"><ChevronLeft size={16}/></button>
        <span>Page {page + 1} of {pages}</span>
        <button disabled={page + 1 >= pages} onClick={() => setPage(page + 1)} aria-label="Next page"><ChevronRight size={16}/></button>
      </div>
    </footer>
  );
}

export function DetailDrawer({ title, subtitle, close, children }: {
  title: string;
  subtitle: string;
  close: () => void;
  children: ReactNode;
}) {
  return (
    <div className="section-detail-backdrop" onClick={close}>
      <aside className="section-detail-drawer" onClick={event => event.stopPropagation()}>
        <button className="section-detail-close" onClick={close} aria-label="Close details"><X size={18}/></button>
        <p className="section-detail-eyebrow">Admin record</p>
        <h2>{title}</h2>
        <p className="section-detail-subtitle">{subtitle}</p>
        {children}
      </aside>
    </div>
  );
}

export function DetailField({ label, children }: { label: string; children: ReactNode }) {
  return <div className="section-detail-field"><dt>{label}</dt><dd>{children || "—"}</dd></div>;
}

export function formatAdminDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export function humanize(value: string) {
  return value.replaceAll("-", " ").replaceAll("_", " ").replace(/\b\w/g, character => character.toUpperCase());
}
