"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, Ticket, TicketListResponse } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";

const STATUSES = ["All", "Pending", "Transferred", "Resolved", "Disapproved", "Cancelled"];

function PriorityBadge({ priority }: { priority: string }) {
  const colors: Record<string, string> = {
    Critical: "bg-red-600/20 text-red-400 border-red-600/30",
    High: "bg-orange-600/20 text-orange-400 border-orange-600/30",
    Medium: "bg-blue-600/20 text-blue-400 border-blue-600/30",
    Low: "bg-green-600/20 text-green-400 border-green-600/30",
  };
  return <span className={`text-xs px-2 py-0.5 rounded border font-medium ${colors[priority] ?? "bg-muted text-muted-foreground border-border"}`}>{priority}</span>;
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    Transferred: "bg-blue-600/20 text-blue-400 border-blue-600/30",
    Pending: "bg-yellow-600/20 text-yellow-400 border-yellow-600/30",
    Resolved: "bg-green-600/20 text-green-400 border-green-600/30",
    Disapproved: "bg-red-600/20 text-red-400 border-red-600/30",
    Cancelled: "bg-gray-600/20 text-gray-400 border-gray-600/30",
  };
  return <span className={`text-xs px-2 py-0.5 rounded border font-medium ${colors[status] ?? "bg-muted text-muted-foreground border-border"}`}>{status}</span>;
}

function SlaBadge({ slaStatus }: { slaStatus: string }) {
  if (slaStatus === "OnTime") return null;
  return (
    <span className="text-xs px-2 py-0.5 rounded border font-medium bg-red-600/20 text-red-400 border-red-600/30 flex items-center gap-1">
      ⚠ {slaStatus === "Delayed" ? "Delayed" : "Overdue"}
    </span>
  );
}

export default function ServiceTrackerPage() {
  const [data, setData] = useState<TicketListResponse | null>(null);
  const [activeStatus, setActiveStatus] = useState("All");
  const [search, setSearch] = useState("");

  const fetchTickets = (status?: string, q?: string) => {
    api.tickets.list({ status: status !== "All" ? status : undefined, search: q || undefined })
      .then(setData)
      .catch(() => {});
  };

  useEffect(() => { fetchTickets(); }, []);

  const handleStatusChange = (s: string) => {
    setActiveStatus(s);
    fetchTickets(s, search);
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    fetchTickets(activeStatus, e.target.value);
  };

  const counts: Record<string, number> = {
    All: data?.totalCount ?? 0,
    Pending: data?.pendingCount ?? 0,
    Transferred: data?.transferredCount ?? 0,
    Resolved: data?.resolvedCount ?? 0,
    Disapproved: data?.disapprovedCount ?? 0,
    Cancelled: data?.cancelledCount ?? 0,
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Service Tracker</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Track your requests.</p>
        </div>
        <Link href="/service-tracker/new">
          <Button className="bg-primary hover:bg-red-700 text-white font-semibold">+ New Request</Button>
        </Link>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          className="pl-9 bg-card border-border"
          placeholder="Search by requester or ticket ID..."
          value={search}
          onChange={handleSearch}
        />
      </div>

      {/* Status tabs */}
      <div className="flex flex-wrap gap-2">
        {STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => handleStatusChange(s)}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-sm border transition-colors ${
              activeStatus === s
                ? "bg-primary/20 border-primary text-primary font-semibold"
                : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/30"
            }`}
          >
            {s}
            <span className={`text-xs font-bold ${activeStatus === s ? "text-primary" : "text-muted-foreground"}`}>
              {counts[s]}
            </span>
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="grid grid-cols-[auto_150px_1fr_100px_110px_80px_60px] gap-4 px-4 py-3 border-b border-border text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
          <span>Ticket</span>
          <span>Requester</span>
          <span>Description</span>
          <span className="text-right">Priority</span>
          <span className="text-right">Status</span>
          <span className="text-right">SLA</span>
          <span className="text-right">Level</span>
        </div>

        {data?.tickets.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">No tickets found.</div>
        ) : (
          data?.tickets.map((ticket: Ticket) => (
            <div key={ticket.id} className="border-b border-border last:border-0 hover:bg-accent/50 transition-colors">
              <div className="grid grid-cols-[auto_150px_1fr_100px_110px_80px_60px] gap-4 px-4 py-3 items-center">
                <span className="text-primary font-semibold text-sm whitespace-nowrap">{ticket.ticketNumber}</span>
                <span className="text-sm font-medium truncate">{ticket.requesterName}</span>
                <span className="text-sm text-muted-foreground truncate">{ticket.description}</span>
                <div className="flex justify-end"><PriorityBadge priority={ticket.priority} /></div>
                <div className="flex justify-end"><StatusBadge status={ticket.status} /></div>
                <div className="flex justify-end"><SlaBadge slaStatus={ticket.slaStatus} /></div>
                <div className="text-right">
                  {ticket.level && <span className="text-xs font-bold text-primary">{ticket.level}</span>}
                </div>
              </div>
              <div className="px-4 pb-3">
                <Link
                  href={`/service-tracker/${ticket.id}`}
                  className="text-xs px-3 py-1 rounded border border-border text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors inline-block"
                >
                  View Details
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
