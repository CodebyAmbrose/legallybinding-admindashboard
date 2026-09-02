"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  BookOpen,
  BriefcaseBusiness,
  CircleDollarSign,
  FileClock,
  FileText,
  Headphones,
  LayoutDashboard,
  Settings,
  ShieldCheck,
  Users,
  X,
  Zap,
  type LucideIcon,
} from "lucide-react";

type NavigationItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

type NavigationGroup = {
  label: string;
  items: NavigationItem[];
};

const navigation: NavigationGroup[] = [
  {
    label: "MAIN",
    items: [
      { label: "Overview", href: "/", icon: LayoutDashboard },
      { label: "Users", href: "/users", icon: Users },
      { label: "Documents", href: "/documents", icon: FileText },
      { label: "Processing", href: "/processing", icon: FileClock },
      { label: "AI Analysis", href: "/ai-analysis", icon: Activity },
      { label: "Risks & Obligations", href: "/risks-obligations", icon: ShieldCheck },
      { label: "Templates", href: "/templates", icon: BookOpen },
      { label: "Lawyers & Firms", href: "/", icon: BriefcaseBusiness },
    ],
  },
  {
    label: "BUSINESS",
    items: [
      { label: "Subscriptions & Billing", href: "/", icon: CircleDollarSign },
      { label: "Credits & Usage", href: "/", icon: Zap },
    ],
  },
  {
    label: "SUPPORT",
    items: [
      { label: "Support Requests", href: "/", icon: Headphones },
      { label: "Reports & Exports", href: "/", icon: FileText },
    ],
  },
  {
    label: "SYSTEM",
    items: [
      { label: "Audit Logs", href: "/", icon: Activity },
      { label: "System Settings", href: "/", icon: Settings },
    ],
  },
];

function isActiveRoute(pathname: string, item: NavigationItem) {
  if (item.label === "Overview") return pathname === "/";
  return item.href !== "/" && (pathname === item.href || pathname.startsWith(`${item.href}/`));
}

export function SharedSidebar({ open, close }: { open: boolean; close: () => void }) {
  const pathname = usePathname();

  return (
    <aside className={`admin-sidebar${open ? " open" : ""}`}>
      <div className="sidebar-brand">
        <div className="brand">
          <span className="brand-logo"><ShieldCheck size={21}/></span>
          <div><strong>LegallyBinding.AI</strong><small>Admin Panel</small></div>
        </div>
        <button className="close-nav" onClick={close} aria-label="Close navigation"><X size={18}/></button>
      </div>

      <nav aria-label="Admin navigation">
        {navigation.map(group => (
          <section key={group.label}>
            <h3>{group.label}</h3>
            {group.items.map(item => {
              const active = isActiveRoute(pathname, item);
              const Icon = item.icon;
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={active ? "active" : undefined}
                  aria-current={active ? "page" : undefined}
                  onClick={close}
                >
                  <Icon size={17}/>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </section>
        ))}
      </nav>

      <div className="system-card">
        <div className="system-heading"><span className="health-dot"/><strong>System Status</strong></div>
        <span className="system-operational"><i/>Operational</span>
        <p>Admin API connected</p>
        <div className="system-divider"/>
        <div className="api-status"><strong>API Status</strong><span>Connected</span></div>
        <svg viewBox="0 0 180 34" aria-hidden="true">
          <path d="M1 27 10 27 18 23 27 25 36 19 45 21 54 12 63 22 72 8 81 19 90 13 99 24 108 19 117 20 126 14 135 20 144 16 153 20 162 24 179 29"/>
        </svg>
        <small>Live connection</small>
      </div>
    </aside>
  );
}
