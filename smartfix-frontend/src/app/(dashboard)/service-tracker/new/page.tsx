"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft } from "lucide-react";

export default function NewRequestPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    requesterEmail: user?.email ?? "",
    department: "",
    formType: "Support",
    application: "SAP",
    priority: "Medium",
    category: "System",
    description: "",
  });

  const set = (field: string) => (val: string | null) => setForm((p) => ({ ...p, [field]: val ?? "" }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.department) { setError("Please select a department"); return; }
    setError("");
    setLoading(true);
    try {
      await api.tickets.create(form);
      router.push("/service-tracker");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to submit request");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <h1 className="text-2xl font-bold mb-6">Submit New Request</h1>

      <div className="bg-card border border-primary/30 rounded-xl p-8">
        {error && (
          <div className="mb-5 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Requester Email */}
          <div>
            <Label className="text-xs uppercase tracking-wider text-muted-foreground mb-2 block">
              Requester Email *
            </Label>
            <Input
              type="email"
              placeholder="email@company.com"
              value={form.requesterEmail}
              onChange={(e) => set("requesterEmail")(e.target.value)}
              required
              className="bg-input border-border h-11 text-sm w-full"
            />
          </div>

          {/* Department + Form Type */}
          <div className="grid grid-cols-2 gap-5">
            <div>
              <Label className="text-xs uppercase tracking-wider text-muted-foreground mb-2 block">Department</Label>
              <Select value={form.department} onValueChange={set("department")}>
                <SelectTrigger className="bg-input border-border h-11 w-full text-sm">
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {["IT", "HR", "Finance", "Operations", "Marketing", "Sales", "MIS"].map((d) => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs uppercase tracking-wider text-muted-foreground mb-2 block">Form Type</Label>
              <Select value={form.formType} onValueChange={set("formType")}>
                <SelectTrigger className="bg-input border-border h-11 w-full text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {["Support", "Request", "Incident"].map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Application + Priority */}
          <div className="grid grid-cols-2 gap-5">
            <div>
              <Label className="text-xs uppercase tracking-wider text-muted-foreground mb-2 block">Application</Label>
              <Select value={form.application} onValueChange={set("application")}>
                <SelectTrigger className="bg-input border-border h-11 w-full text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {["SAP", "VoIP", "Dataverse", "Microsoft 365", "Azure", "Network", "Hardware", "Other"].map((a) => (
                    <SelectItem key={a} value={a}>{a}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs uppercase tracking-wider text-muted-foreground mb-2 block">Priority</Label>
              <Select value={form.priority} onValueChange={set("priority")}>
                <SelectTrigger className="bg-input border-border h-11 w-full text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {["Low", "Medium", "High", "Critical"].map((p) => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Category */}
          <div>
            <Label className="text-xs uppercase tracking-wider text-muted-foreground mb-2 block">Category</Label>
            <Select value={form.category} onValueChange={set("category")}>
              <SelectTrigger className="bg-input border-border h-11 w-full text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                {["System", "Network", "Software", "Hardware", "Access", "Other"].map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div>
            <Label className="text-xs uppercase tracking-wider text-muted-foreground mb-2 block">Description *</Label>
            <Textarea
              placeholder="Describe the issue..."
              value={form.description}
              onChange={(e) => set("description")(e.target.value)}
              required
              rows={5}
              className="bg-input border-border resize-none w-full text-sm"
            />
          </div>

          <Button
            type="submit"
            className="bg-primary hover:bg-red-700 text-white font-semibold px-10 h-11"
            disabled={loading}
          >
            {loading ? "Submitting..." : "Submit Request"}
          </Button>
        </form>
      </div>
    </div>
  );
}
