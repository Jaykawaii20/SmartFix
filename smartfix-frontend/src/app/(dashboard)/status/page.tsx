"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, StatusData, Ticket } from "@/lib/api";

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
    Resolved: "bg-green-600/20 text-green-400 border-green-600/30",
    Pending: "bg-yellow-600/20 text-yellow-400 border-yellow-600/30",
  };
  return <span className={`text-xs px-2 py-0.5 rounded border font-medium ${colors[status] ?? "bg-muted text-muted-foreground border-border"}`}>{status}</span>;
}

function TicketRow({ ticket }: { ticket: Ticket }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-border last:border-0">
      <div>
        <p className="text-sm">
          <span className="text-primary font-semibold">{ticket.ticketNumber}</span>
          <span className="text-muted-foreground mx-1">—</span>
          <span className="text-foreground">{ticket.application}</span>
        </p>
        <p className="text-[11px] text-muted-foreground mt-0.5">
          {ticket.requesterName} · {ticket.department} · SLA: {ticket.slaHours}h
        </p>
      </div>
      <div className="flex items-center gap-2">
        <PriorityBadge priority={ticket.priority} />
        <StatusBadge status={ticket.status} />
        {ticket.slaStatus === "OnTime" ? (
          <span className="text-xs px-2 py-0.5 rounded border font-medium bg-green-600/20 text-green-400 border-green-600/30">✓ On Time</span>
        ) : (
          <span className="text-xs px-2 py-0.5 rounded border font-medium bg-red-600/20 text-red-400 border-red-600/30">⚠ Delayed</span>
        )}
        <Link href={`/service-tracker/${ticket.id}`} className="text-xs text-muted-foreground hover:text-foreground transition-colors ml-1">
          View →
        </Link>
      </div>
    </div>
  );
}

export default function StatusPage() {
  const [data, setData] = useState<StatusData | null>(null);

  useEffect(() => {
    api.dashboard.status().then(setData).catch(() => {});
  }, []);

  const total = (data?.onTimeCount ?? 0) + (data?.delayedCount ?? 0) + (data?.overdueCount ?? 0);

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold">Status</h1>
        <p className="text-muted-foreground text-sm mt-0.5">SLA tracking — On Time vs Delayed.</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-xl p-5">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">On Time (Resolved)</p>
          <p className="text-3xl font-bold text-green-400">{data?.onTimeCount ?? 0}</p>
          <p className="text-xs text-muted-foreground mt-1">of {total} total</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-5">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">Delayed (Resolved)</p>
          <p className="text-3xl font-bold text-red-400">{data?.delayedCount ?? 0}</p>
          <p className="text-xs text-muted-foreground mt-1">of {total} total</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-5">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">Active — Overdue</p>
          <p className="text-3xl font-bold text-yellow-400">{data?.overdueCount ?? 0}</p>
          <p className="text-xs text-muted-foreground mt-1">of {total} total</p>
        </div>
      </div>

      {/* On Time section */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-400" />
            <span className="font-semibold text-sm">On Time</span>
          </div>
          <span className="text-xs bg-green-400/20 text-green-400 border border-green-400/30 px-2 py-0.5 rounded-full font-bold">
            {data?.onTimeTickets.length ?? 0}
          </span>
        </div>
        <div className="px-5">
          {data?.onTimeTickets.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-6">None.</p>
          ) : (
            data?.onTimeTickets.map((t) => <TicketRow key={t.id} ticket={t} />)
          )}
        </div>
      </div>

      {/* Delayed section */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-400" />
            <span className="font-semibold text-sm">Delayed</span>
          </div>
          <span className="text-xs bg-red-400/20 text-red-400 border border-red-400/30 px-2 py-0.5 rounded-full font-bold">
            {data?.delayedTickets.length ?? 0}
          </span>
        </div>
        <div className="px-5">
          {data?.delayedTickets.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-6">None.</p>
          ) : (
            data?.delayedTickets.map((t) => <TicketRow key={t.id} ticket={t} />)
          )}
        </div>
      </div>

      {/* Active Overdue section */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-yellow-400" />
            <span className="font-semibold text-sm">Active — Overdue</span>
          </div>
          <span className="text-xs bg-yellow-400/20 text-yellow-400 border border-yellow-400/30 px-2 py-0.5 rounded-full font-bold">
            {data?.overdueTickets.length ?? 0}
          </span>
        </div>
        <div className="px-5">
          {data?.overdueTickets.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-6">None.</p>
          ) : (
            data?.overdueTickets.map((t) => <TicketRow key={t.id} ticket={t} />)
          )}
        </div>
      </div>
    </div>
  );
}
