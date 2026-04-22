"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import {
  LayoutDashboard, Ticket, Activity, BarChart3, Settings,
  CheckSquare, Wrench, Users, ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarProps {
  ticketBadge?: number;
}

export function Sidebar({ ticketBadge = 0 }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout, can } = useAuth();
  const [approvalsBadge, setApprovalsBadge] = useState(0);

  const isITStaff = !!(user?.level && ["L1", "L2", "L3", "L4"].includes(user.level));

  useEffect(() => {
    if (!isITStaff && !can("approvals")) return;
    api.approvals.list()
      .then((res) => setApprovalsBadge(res.count))
      .catch(() => {});
  }, [isITStaff, user]);

  const initials = user?.fullName
    ? user.fullName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : "??";

  type NavItem = { label: string; href: string; icon: React.ElementType; badge?: number };
  type NavSection = { section: string; items: NavItem[] };

  const operationsItems: NavItem[] = [
    ...(can("service_tracker") ? [{ label: "Service Tracker", href: "/service-tracker", icon: Ticket, badge: ticketBadge }] : []),
    ...((isITStaff || can("approvals")) ? [{ label: "Approvals", href: "/approvals", icon: CheckSquare, badge: approvalsBadge }] : []),
    ...(can("status") ? [{ label: "Status", href: "/status", icon: Activity }] : []),
  ];

  const navSections: NavSection[] = [
    ...(can("dashboard") ? [{ section: "OVERVIEW", items: [{ label: "Dashboard", href: "/dashboard", icon: LayoutDashboard }] }] : []),
    ...(operationsItems.length > 0 ? [{ section: "OPERATIONS", items: operationsItems }] : []),
    ...(can("reports") ? [{ section: "ANALYTICS", items: [{ label: "Reports", href: "/reports", icon: BarChart3 }] }] : []),
    ...(can("maintenance") || can("users") || can("roles") ? [{
      section: "SETTINGS",
      items: [
        ...(can("maintenance") ? [{ label: "Maintenance", href: "/maintenance", icon: Wrench }] : []),
        ...(can("users") ? [{ label: "Users", href: "/users", icon: Users }] : []),
        ...(can("roles") ? [{ label: "Roles", href: "/roles", icon: ShieldCheck }] : []),
      ],
    }] : []),
  ];

  return (
    <aside className="w-[180px] shrink-0 flex flex-col h-screen bg-sidebar border-r border-sidebar-border fixed left-0 top-0 z-30">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 py-4 border-b border-sidebar-border">
        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0">
          <Settings className="w-4 h-4 text-white" />
        </div>
        <span className="font-bold text-sm text-foreground leading-tight">SmartFix IT</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-5">
        {navSections.map(({ section, items }) => (
          <div key={section}>
            <p className="text-[10px] font-semibold text-muted-foreground px-2 mb-1 tracking-wider">{section}</p>
            {items.map(({ label, href, icon: Icon, badge = 0 }) => {
              const active = pathname === href || pathname.startsWith(href + "/");
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "flex items-center justify-between px-2 py-2 rounded-md text-sm transition-colors",
                    active
                      ? "bg-primary/20 text-primary font-medium"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  )}
                >
                  <div className="flex items-center gap-2">
                    {active ? (
                      <span className="w-1 h-4 rounded-full bg-primary shrink-0" />
                    ) : (
                      <Icon className="w-4 h-4 shrink-0" />
                    )}
                    <span>{label}</span>
                  </div>
                  {badge > 0 && (
                    <span className="text-[10px] bg-primary text-white rounded-full w-4 h-4 flex items-center justify-center font-bold shrink-0">
                      {badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* User */}
      <div className="border-t border-sidebar-border p-3 space-y-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-xs font-bold text-primary shrink-0">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold truncate">{user?.fullName}</p>
            <p className="text-[10px] text-muted-foreground">{user?.role}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="w-full text-[11px] text-muted-foreground hover:text-foreground transition-colors text-center py-1 rounded hover:bg-accent"
        >
          Switch Account
        </button>
      </div>
    </aside>
  );
}
