"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { api, DashboardData } from "@/lib/api";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart
} from "recharts";

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    api.dashboard.get().then(setData).catch(() => {});
  }, []);

  const chartData = data
    ? [
        { label: "Transferred", value: data.ticketDistribution.transferred, color: "#8b5cf6" },
        { label: "Pending", value: data.ticketDistribution.pending, color: "#f59e0b" },
        { label: "Resolved", value: data.ticketDistribution.resolved, color: "#10b981" },
        { label: "Disapproved", value: data.ticketDistribution.disapproved, color: "#ef4444" },
        { label: "Cancelled", value: data.ticketDistribution.cancelled, color: "#6b7280" },
      ]
    : [];

  const linePoints = chartData.map((d) => ({ name: d.label, value: d.value }));

  return (
    <div className="space-y-6 max-w-full">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          Welcome back,{" "}
          <span className="text-primary font-medium">{user?.fullName}.</span>
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Ticket Distribution */}
        <div className="bg-card border border-border rounded-xl p-5">
          <p className="font-semibold mb-0.5">Ticket Distribution</p>
          <p className="text-xs text-muted-foreground mb-4">{data?.ticketDistribution.total ?? 0} total tickets</p>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={linePoints} margin={{ left: -20, right: 10 }}>
              <defs>
                <linearGradient id="redGrad" x1="0" y1="0" x2="0" y2="1">
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
              <Area type="linear" dataKey="value" stroke="#dc2626" strokeWidth={2} fill="url(#redGrad)" dot={{ fill: "#dc2626", r: 4 }} activeDot={{ r: 6 }} />
            </AreaChart>
          </ResponsiveContainer>
          {/* Legend */}
          <div className="flex flex-wrap gap-3 mt-3">
            {chartData.map((d) => (
              <div key={d.label} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: d.color }} />
                {d.label} {d.value} ({data ? Math.round((d.value / (data.ticketDistribution.total || 1)) * 100) : 0}%)
              </div>
            ))}
          </div>
        </div>

        {/* Staff Workload */}
        <div className="bg-card border border-border rounded-xl p-5">
          <p className="font-semibold mb-0.5">Staff Workload</p>
          <p className="text-xs text-muted-foreground mb-4">Active tickets per personnel</p>
          <div className="space-y-3">
            {data?.staffWorkload.map((s) => {
              const pct = s.totalCount > 0 ? (s.activeCount / s.totalCount) * 100 : 0;
              const colors = ["bg-red-800", "bg-blue-800", "bg-teal-800", "bg-slate-700"];
              const idx = ["L1", "L2", "L3", "L4"].indexOf(s.level);
              const barColor = colors[idx] ?? "bg-slate-700";
              return (
                <div key={s.name}>
                  <div className="flex justify-between items-center mb-1">
                    <div>
                      <span className="text-sm font-medium text-primary">{s.name}</span>
                      <span className="text-[10px] text-muted-foreground ml-2">{s.level} — {s.department}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">{s.activeCount} active</span>
                      <span className="text-xs text-muted-foreground">{s.totalCount} total</span>
                    </div>
                  </div>
                  <div className="h-5 bg-muted rounded overflow-hidden">
                    <div className={`h-full ${barColor} rounded transition-all`} style={{ width: `${Math.max(pct, 5)}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
          <p className="text-[10px] text-muted-foreground mt-3">↑ Above surface = most visible · Below = submerged load</p>
        </div>

        {/* SLA & Performance */}
        <div className="bg-card border border-border rounded-xl p-5">
          <p className="font-semibold mb-4">SLA &amp; Performance</p>
          <div className="space-y-3">
            {[
              { label: "On-Time Resolved", value: data?.slaPerformance.onTimeResolved ?? 0, color: "text-green-400" },
              { label: "Critical Overdue", value: data?.slaPerformance.criticalOverdue ?? 0, color: "text-red-400" },
              { label: "Active Delayed", value: data?.slaPerformance.activeDelayed ?? 0, color: "text-yellow-400" },
            ].map(({ label, value, color }) => (
              <div key={label} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <span className="text-sm text-muted-foreground">{label}</span>
                <span className={`font-bold ${color}`}>{value}</span>
              </div>
            ))}
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-muted-foreground">Sync Health</span>
              <span className="text-green-400 text-sm font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" /> Live
              </span>
            </div>
          </div>
        </div>

        {/* KPIs */}
        <div className="bg-card border border-border rounded-xl p-5">
          <p className="font-semibold mb-4">KPIs</p>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "MTTR", value: `${data?.kpis.mttrHours ?? 4.2} hrs`, color: "text-red-400" },
              { label: "FCR Rate", value: `${data?.kpis.fcrRate ?? 68}%`, color: "text-red-400" },
              { label: "SLA Compliance", value: `${data?.kpis.slaCompliance ?? 91}%`, color: "text-red-400" },
              { label: "CSAT Score", value: `${data?.kpis.csatScore ?? 4.3}/5`, color: "text-red-400" },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-muted/30 rounded-lg p-3 text-center border border-border">
                <p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-1">{label}</p>
                <p className={`text-xl font-bold ${color}`}>{value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
