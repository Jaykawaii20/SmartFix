"use client";

import { useEffect, useState } from "react";
import { api, ReportsData } from "@/lib/api";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

function PriorityBadge({ priority }: { priority: string }) {
  const colors: Record<string, string> = {
    Critical: "bg-red-600/20 text-red-400 border-red-600/30",
    High: "bg-orange-600/20 text-orange-400 border-orange-600/30",
    Medium: "bg-blue-600/20 text-blue-400 border-blue-600/30",
    Low: "bg-green-600/20 text-green-400 border-green-600/30",
  };
  return <span className={`text-xs px-2 py-0.5 rounded border font-medium ${colors[priority] ?? "bg-muted text-muted-foreground border-border"}`}>{priority}</span>;
}

export default function ReportsPage() {
  const [data, setData] = useState<ReportsData | null>(null);

  useEffect(() => {
    api.dashboard.reports().then(setData).catch(() => {});
  }, []);

  const chartData = data
    ? [
        { name: "Transferred", value: data.ticketDistribution.transferred },
        { name: "Pending", value: data.ticketDistribution.pending },
        { name: "Resolved", value: data.ticketDistribution.resolved },
        { name: "Disapproved", value: data.ticketDistribution.disapproved },
        { name: "Cancelled", value: data.ticketDistribution.cancelled },
      ]
    : [];

  return (
    <div className="space-y-6 max-w-full">
      <div>
        <h1 className="text-2xl font-bold">Reports &amp; Analytics</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Performance metrics and SLA overview.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Ticket Distribution */}
        <div className="bg-card border border-border rounded-xl p-5">
          <p className="font-semibold mb-0.5">Ticket Distribution</p>
          <p className="text-xs text-muted-foreground mb-4">{data?.ticketDistribution.total ?? 0} total:</p>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={chartData} margin={{ left: -20, right: 10 }}>
              <defs>
                <linearGradient id="redGradR" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#dc2626" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#dc2626" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="name" tick={{ fill: "#6b7280", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#6b7280", fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip
                contentStyle={{ background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 8 }}
                labelStyle={{ color: "#f5f5f5" }}
                itemStyle={{ color: "#dc2626" }}
              />
              <Area type="linear" dataKey="value" stroke="#dc2626" strokeWidth={2} fill="url(#redGradR)" dot={{ fill: "#dc2626", r: 4 }} activeDot={{ r: 6 }} />
            </AreaChart>
          </ResponsiveContainer>
          {/* Legend */}
          <div className="flex flex-wrap gap-3 mt-2">
            {[
              { label: "Transferred", value: data?.ticketDistribution.transferred ?? 0, color: "#8b5cf6" },
              { label: "Pending", value: data?.ticketDistribution.pending ?? 0, color: "#f59e0b" },
              { label: "Resolved", value: data?.ticketDistribution.resolved ?? 0, color: "#10b981" },
              { label: "Disapproved", value: data?.ticketDistribution.disapproved ?? 0, color: "#ef4444" },
              { label: "Cancelled", value: data?.ticketDistribution.cancelled ?? 0, color: "#6b7280" },
            ].map((d) => {
              const pct = data ? Math.round((d.value / (data.ticketDistribution.total || 1)) * 100) : 0;
              return (
                <div key={d.label} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: d.color }} />
                  {d.label} {d.value} ({pct}%)
                </div>
              );
            })}
          </div>
        </div>

        {/* SLA Status */}
        <div className="bg-card border border-border rounded-xl p-5">
          <p className="font-semibold mb-4">SLA Status</p>
          <div className="space-y-2">
            {data?.slaStatuses.map((s) => (
              <div key={s.ticketNumber} className="flex items-center justify-between py-1.5 border-b border-border last:border-0">
                <div className="flex items-center gap-2">
                  <span className="text-primary font-semibold text-sm">{s.ticketNumber}</span>
                  <PriorityBadge priority={s.priority} />
                  <span className="text-xs text-muted-foreground">{s.slaHours}h</span>
                </div>
                <div className="flex items-center gap-2">
                  {s.slaStatus === "OnTime" ? (
                    <span className="text-xs text-green-400">—</span>
                  ) : (
                    <span className="text-xs px-2 py-0.5 rounded border bg-red-600/20 text-red-400 border-red-600/30">⚠ Delayed</span>
                  )}
                  <span className="text-xs text-muted-foreground">{s.requesterName}</span>
                </div>
              </div>
            ))}
            {(!data?.slaStatuses || data.slaStatuses.length === 0) && (
              <p className="text-muted-foreground text-sm text-center py-4">No data yet.</p>
            )}
          </div>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "MTTR", value: `${data?.kpis.mttrHours ?? 4.2} hrs` },
          { label: "FCR Rate", value: `${data?.kpis.fcrRate ?? 68}%` },
          { label: "SLA Compliance", value: `${data?.kpis.slaCompliance ?? 91}%` },
          { label: "CSAT Score", value: `${data?.kpis.csatScore ?? 4.3}/5` },
        ].map(({ label, value }) => (
          <div key={label} className="bg-card border border-border rounded-xl p-5 text-center">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">{label}</p>
            <p className="text-2xl font-bold text-primary">{value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
