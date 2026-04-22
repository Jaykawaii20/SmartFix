"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { api, Ticket, TicketInfoOptions, ResolveTicketRequest } from "@/lib/api";
import { X, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

// ── Badges ─────────────────────────────────────────────────────────────────

function PriorityBadge({ priority }: { priority: string }) {
  const colors: Record<string, string> = {
    Critical: "bg-red-600/20 text-red-400 border-red-600/40",
    High: "bg-orange-600/20 text-orange-400 border-orange-600/40",
    Medium: "bg-blue-600/20 text-blue-400 border-blue-600/40",
    Low: "bg-green-600/20 text-green-400 border-green-600/40",
  };
  return (
    <span className={`text-xs px-2.5 py-1 rounded border font-medium ${colors[priority] ?? "bg-muted text-muted-foreground border-border"}`}>
      {priority}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    Transferred: "bg-blue-600/20 text-blue-400 border-blue-600/40",
    Pending: "bg-yellow-600/20 text-yellow-400 border-yellow-600/40",
    Resolved: "bg-green-600/20 text-green-400 border-green-600/40",
    Disapproved: "bg-red-600/20 text-red-400 border-red-600/40",
    Cancelled: "bg-gray-600/20 text-gray-400 border-gray-600/40",
  };
  return (
    <span className={`text-xs px-2.5 py-1 rounded border font-medium ${colors[status] ?? "bg-muted text-muted-foreground border-border"}`}>
      {status}
    </span>
  );
}

// ── Resolve Modal ──────────────────────────────────────────────────────────

function ResolveModal({
  ticket,
  options,
  onClose,
  onConfirm,
}: {
  ticket: Ticket;
  options: TicketInfoOptions;
  onClose: () => void;
  onConfirm: (data: ResolveTicketRequest) => Promise<void>;
}) {
  const [priority, setPriority] = useState("");
  const [supportCategory, setSupportCategory] = useState("");
  const [problemCategory, setProblemCategory] = useState("");
  const [subCategory, setSubCategory] = useState("");
  const [severity, setSeverity] = useState("");
  const [personnelLevel, setPersonnelLevel] = useState("");
  const [troubleshootingDescription, setTroubleshootingDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const isValid =
    priority && supportCategory && problemCategory &&
    subCategory && severity && personnelLevel &&
    troubleshootingDescription.trim();

  const handleConfirm = async () => {
    if (!isValid) return;
    setSubmitting(true);
    try {
      await onConfirm({ priority, supportCategory, problemCategory, subCategory, severity, personnelLevel, troubleshootingDescription });
    } finally {
      setSubmitting(false);
    }
  };

  const selectClass = "w-full rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground";
  const emptyOption = (label: string) => <option value="">{label}</option>;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/60" onClick={onClose} />
      <div className="relative z-10 bg-card border border-border rounded-xl p-6 w-full max-w-lg shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
        <div>
          <h2 className="font-bold text-lg">Resolve Ticket</h2>
          <p className="text-sm text-muted-foreground">Complete all fields to resolve {ticket.ticketNumber}</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Priority *</label>
            <select value={priority} onChange={(e) => setPriority(e.target.value)} className={selectClass}>
              {emptyOption("Select Priority…")}
              {options.priorities.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Support Category *</label>
            <select value={supportCategory} onChange={(e) => setSupportCategory(e.target.value)} className={selectClass}>
              {emptyOption("Select Support Category…")}
              {options.supportCategories.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Problem Category *</label>
            <select value={problemCategory} onChange={(e) => setProblemCategory(e.target.value)} className={selectClass}>
              {emptyOption("Select Problem Category…")}
              {options.problemCategories.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Sub-Category *</label>
            <select value={subCategory} onChange={(e) => setSubCategory(e.target.value)} className={selectClass}>
              {emptyOption("Select Sub-Category…")}
              {options.subCategories.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Severity *</label>
            <select value={severity} onChange={(e) => setSeverity(e.target.value)} className={selectClass}>
              {emptyOption("Select Severity…")}
              {options.severities.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Personnel Level *</label>
            <select value={personnelLevel} onChange={(e) => setPersonnelLevel(e.target.value)} className={selectClass}>
              {emptyOption("Select Personnel Level…")}
              {options.personnelLevels.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Troubleshooting Description *</label>
          <Textarea
            value={troubleshootingDescription}
            onChange={(e) => setTroubleshootingDescription(e.target.value)}
            placeholder="Describe steps taken…"
            rows={4}
            className="bg-input border-border resize-none"
          />
        </div>

        {/* Email notice */}
        <div className="flex items-start gap-2 bg-teal-600/10 border border-teal-600/30 rounded-lg px-4 py-3">
          <span className="text-teal-400 text-sm shrink-0">✉</span>
          <p className="text-sm text-teal-300">
            Evaluation email will be sent to{" "}
            <span className="font-semibold">{ticket.requesterEmail}</span> after resolution.
          </p>
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <Button variant="ghost" onClick={onClose} disabled={submitting}>Cancel</Button>
          <Button
            onClick={handleConfirm}
            disabled={!isValid || submitting}
            className="bg-primary hover:bg-red-700 text-white font-semibold disabled:opacity-50"
          >
            {submitting ? "Resolving…" : "Confirm Resolve"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────

export default function ApprovalsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [ticketOptions, setTicketOptions] = useState<TicketInfoOptions>({
    priorities: [], supportCategories: [], problemCategories: [],
    subCategories: [], severities: [], personnelLevels: [],
  });
  const [resolveTarget, setResolveTarget] = useState<Ticket | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const fetchApprovals = useCallback(() => {
    setLoading(true);
    api.approvals.list()
      .then((res) => setTickets(res.tickets))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchApprovals();
    api.maintenance.getTicketOptions().then(setTicketOptions).catch(() => {});
  }, [fetchApprovals]);

  const handleTransfer = async (ticket: Ticket) => {
    setActionLoading(ticket.id);
    await api.approvals.transferL2(ticket.id).catch(() => {});
    setActionLoading(null);
    fetchApprovals();
  };

  const handleCancel = async (ticket: Ticket) => {
    setActionLoading(ticket.id);
    await api.approvals.cancel(ticket.id).catch(() => {});
    setActionLoading(null);
    fetchApprovals();
  };

  const handleResolve = async (data: ResolveTicketRequest) => {
    if (!resolveTarget) return;
    await api.approvals.resolve(resolveTarget.id, data);
    setResolveTarget(null);
    fetchApprovals();
  };

  function formatDate(dateStr: string) {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("en-CA");
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Approvals</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Tickets awaiting your action.</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">Loading…</div>
      ) : tickets.length === 0 ? (
        <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
          No tickets awaiting your action.
        </div>
      ) : (
        <div className="space-y-3">
          {tickets.map((ticket) => {
            const busy = actionLoading === ticket.id;
            return (
              <div
                key={ticket.id}
                className="bg-card border border-border rounded-xl p-5 space-y-3"
                style={{ borderLeftColor: "rgb(220 38 38 / 0.5)", borderLeftWidth: "3px" }}
              >
                {/* Ticket header */}
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-primary font-bold text-base">{ticket.ticketNumber}</p>
                    <p className="text-sm font-medium mt-0.5">{ticket.requesterName}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {ticket.department} · {formatDate(ticket.createdAt)}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1.5 line-clamp-1">{ticket.description}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <PriorityBadge priority={ticket.priority} />
                    <StatusBadge status={ticket.status} />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => handleTransfer(ticket)}
                    disabled={busy}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-violet-500/50 bg-violet-600/10 text-violet-400 hover:bg-violet-600/20 text-sm font-medium transition-colors disabled:opacity-50"
                  >
                    ↑ Transfer L2
                  </button>
                  <button
                    onClick={() => setResolveTarget(ticket)}
                    disabled={busy}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-green-500/50 bg-green-600/10 text-green-400 hover:bg-green-600/20 text-sm font-medium transition-colors disabled:opacity-50"
                  >
                    ✓ Resolve
                  </button>
                  <button
                    onClick={() => handleCancel(ticket)}
                    disabled={busy}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-card text-muted-foreground hover:text-foreground hover:border-foreground/30 text-sm font-medium transition-colors disabled:opacity-50"
                  >
                    ⊘ Cancel
                  </button>
                  <Link
                    href={`/service-tracker/${ticket.id}`}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-card text-muted-foreground hover:text-foreground hover:border-foreground/30 text-sm font-medium transition-colors"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {resolveTarget && (
        <ResolveModal
          ticket={resolveTarget}
          options={ticketOptions}
          onClose={() => setResolveTarget(null)}
          onConfirm={handleResolve}
        />
      )}
    </div>
  );
}
