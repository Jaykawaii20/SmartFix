"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { api, Ticket, ApprovalStep } from "@/lib/api";
import { ArrowLeft, AlertTriangle } from "lucide-react";

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

function SlaBadge({ slaStatus }: { slaStatus: string }) {
  if (slaStatus === "OnTime") return null;
  return (
    <span className="text-xs px-2.5 py-1 rounded border font-medium bg-red-600/20 text-red-400 border-red-600/40 flex items-center gap-1">
      <AlertTriangle className="w-3 h-3" />
      {slaStatus === "Delayed" ? "Delayed" : "Overdue"}
    </span>
  );
}

function ApprovalStepBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    Transferred: "bg-blue-600/20 text-blue-400 border-blue-600/40",
    Pending: "bg-yellow-600/20 text-yellow-400 border-yellow-600/40",
    Approved: "bg-green-600/20 text-green-400 border-green-600/40",
    Disapproved: "bg-red-600/20 text-red-400 border-red-600/40",
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded border font-medium ${colors[status] ?? "bg-muted text-muted-foreground border-border"}`}>
      {status}
    </span>
  );
}

function InfoField({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="bg-[#1e1e1e] rounded-lg p-4 border border-border">
      <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1.5 font-semibold">{label}</p>
      <p className="text-sm font-medium text-foreground">{value || "—"}</p>
    </div>
  );
}

function formatDate(dateStr: string) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-CA"); // YYYY-MM-DD
}

export default function TicketDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = Number(params.id);
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api.tickets.get(id)
      .then(setTicket)
      .catch(() => setError("Failed to load ticket."))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
        Loading...
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="flex items-center justify-center h-48 text-red-400 text-sm">
        {error || "Ticket not found."}
      </div>
    );
  }

  const approvalChain: ApprovalStep[] = ticket.approvalChain ?? [];

  return (
    <div className="max-w-4xl space-y-6">
      {/* Back */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      {/* Main card */}
      <div className="bg-card border border-border rounded-xl p-6 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-primary">{ticket.ticketNumber}</h1>
            {ticket.scaNumber && (
              <p className="text-sm text-muted-foreground mt-0.5">SCA: {ticket.scaNumber}</p>
            )}
          </div>
          <div className="flex items-center gap-2 flex-wrap justify-end">
            <PriorityBadge priority={ticket.priority} />
            <StatusBadge status={ticket.status} />
            <SlaBadge slaStatus={ticket.slaStatus} />
          </div>
        </div>

        {/* Info grid */}
        <div className="grid grid-cols-2 gap-3">
          <InfoField label="Requester" value={ticket.requesterName} />
          <InfoField label="Email" value={ticket.requesterEmail} />
          <InfoField label="Department" value={ticket.department} />
          <InfoField label="Business Unit" value={ticket.businessUnit} />
          <InfoField label="Application" value={ticket.application} />
          <InfoField label="Form Type" value={ticket.formType} />
          <InfoField label="Date Reported" value={formatDate(ticket.createdAt)} />
          <InfoField label="Assignee" value={ticket.assignedToName} />
        </div>

        {/* SLA Limit — full width */}
        <div className="bg-[#1e1e1e] rounded-lg p-4 border border-border max-w-[calc(50%-6px)]">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1.5 font-semibold">SLA Limit</p>
          <p className="text-sm font-medium text-foreground">{ticket.slaHours}h max</p>
        </div>

        {/* Description */}
        <div>
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2 font-semibold">Description</p>
          <p className="text-sm text-foreground leading-relaxed">{ticket.description}</p>
        </div>
      </div>

      {/* Approval Chain */}
      {approvalChain.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-base font-bold">Approval Chain</h2>
          <div className="flex items-start gap-3 flex-wrap">
            {approvalChain.map((step, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <div className="bg-card border border-border rounded-lg p-4 min-w-[140px]">
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2 font-semibold">
                    Level {step.level}
                  </p>
                  <p className="text-sm font-semibold mb-2">{step.assigneeName}</p>
                  <ApprovalStepBadge status={step.status} />
                  {step.note && (
                    <p className="text-xs text-muted-foreground mt-1.5 italic">{step.note}</p>
                  )}
                </div>
                {idx < approvalChain.length - 1 && (
                  <span className="text-muted-foreground text-lg">→</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
