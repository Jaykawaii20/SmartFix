"use client";

import { useEffect, useState, useCallback } from "react";
import {
  api,
  MaintenanceStaffData,
  TicketInfoOptions,
  EvalForm,
  EvalFormQuestion,
  RoutingRule,
  UserRecord,
} from "@/lib/api";
import { X, Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

// ── Types ──────────────────────────────────────────────────────────────────

type MainTab = "Routing & Staff" | "Ticket Information" | "Evaluation Form";
type StaffTab = "L1" | "L2" | "L3" | "L4" | "Depts" | "Business Units";
type InfoTab = "Priority" | "Support Category" | "Problem Category" | "Sub-Category" | "Severity" | "Personnel Level";

const MAIN_TABS: MainTab[] = ["Routing & Staff", "Ticket Information", "Evaluation Form"];
const STAFF_TABS: StaffTab[] = ["L1", "L2", "L3", "L4", "Depts", "Business Units"];
const INFO_TABS: InfoTab[] = ["Priority", "Support Category", "Problem Category", "Sub-Category", "Severity", "Personnel Level"];
const INFO_NEW_BADGE: InfoTab[] = ["Severity"];
const QUESTION_TYPES = ["Rating", "Yes/No", "Text"];

// ── Small helpers ──────────────────────────────────────────────────────────

function TabBar<T extends string>({
  tabs,
  active,
  onChange,
  newBadge = [],
}: {
  tabs: readonly T[];
  active: T;
  onChange: (t: T) => void;
  newBadge?: T[];
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {tabs.map((t) => (
        <button
          key={t}
          onClick={() => onChange(t)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
            active === t
              ? "bg-primary/20 border-primary text-primary"
              : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/30 bg-card"
          }`}
        >
          {t}
          {newBadge.includes(t) && (
            <span className="text-[9px] bg-primary text-white font-bold px-1 py-0.5 rounded uppercase">NEW</span>
          )}
        </button>
      ))}
    </div>
  );
}

function Tag({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#242424] border border-border text-sm font-medium">
      {label}
      <button onClick={onRemove} className="text-muted-foreground hover:text-red-400 transition-colors">
        <X className="w-3 h-3" />
      </button>
    </span>
  );
}

function UserTag({ name, onRemove }: { name: string; onRemove: () => void }) {
  const initials = name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
  return (
    <span className="flex items-center gap-2 pl-1 pr-2.5 py-1 rounded-lg bg-[#242424] border border-border text-sm font-medium">
      <span className="w-6 h-6 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-[10px] font-bold text-primary shrink-0">
        {initials}
      </span>
      {name}
      <button onClick={onRemove} className="text-muted-foreground hover:text-red-400 transition-colors ml-0.5">
        <X className="w-3 h-3" />
      </button>
    </span>
  );
}

function StaffUserPicker({
  assigned,
  supportUsers,
  onAdd,
}: {
  assigned: string[];
  supportUsers: UserRecord[];
  onAdd: (name: string) => void;
}) {
  const available = supportUsers.filter((u) => !assigned.includes(u.fullName));

  if (available.length === 0) {
    return (
      <p className="text-xs text-muted-foreground py-1">
        {supportUsers.length === 0
          ? "No users with Support role found."
          : "All Support users are already assigned."}
      </p>
    );
  }

  return (
    <div className="flex gap-2">
      <select
        defaultValue=""
        onChange={(e) => {
          if (e.target.value) { onAdd(e.target.value); e.target.value = ""; }
        }}
        className="flex-1 rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
      >
        <option value="" disabled>Select a Support user to assign…</option>
        {available.map((u) => (
          <option key={u.id} value={u.fullName}>
            {u.fullName}{u.department ? ` — ${u.department}` : ""}
          </option>
        ))}
      </select>
    </div>
  );
}

function TagInput({
  placeholder,
  value,
  onChange,
  onAdd,
}: {
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  onAdd: () => void;
}) {
  return (
    <div className="flex gap-2">
      <div className="relative flex-1">
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); onAdd(); } }}
          placeholder={placeholder}
          className="bg-card border-border pr-8"
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs pointer-events-none">▾</span>
      </div>
      <button
        onClick={onAdd}
        className="px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold transition-colors whitespace-nowrap"
      >
        + Add
      </button>
    </div>
  );
}

// ── New Routing Modal ──────────────────────────────────────────────────────

function NewRoutingModal({
  onClose,
  onSave,
  users,
}: {
  onClose: () => void;
  onSave: (data: Omit<RoutingRule, "id" | "assigneeName">) => Promise<void>;
  users: UserRecord[];
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [formType, setFormType] = useState("");
  const [department, setDepartment] = useState("");
  const [assignedLevel, setAssignedLevel] = useState("L1");
  const [assigneeId, setAssigneeId] = useState<number | undefined>(undefined);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      await onSave({ name: name.trim(), description, formType, department, assignedLevel, assigneeId });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/60" onClick={onClose} />
      <div className="relative z-10 bg-card border border-border rounded-xl p-6 w-full max-w-md space-y-4 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-bold text-lg">New Routing Rule</h2>
            <p className="text-sm text-muted-foreground">Define routing criteria for ticket assignment.</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Rule Name *</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., SAP Support Routing"
              className="mt-1 bg-input border-border"
            />
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Description</label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description"
              className="mt-1 bg-input border-border"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Form Type</label>
              <Input
                value={formType}
                onChange={(e) => setFormType(e.target.value)}
                placeholder="Support, Request…"
                className="mt-1 bg-input border-border"
              />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Department</label>
              <Input
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="IT, Finance…"
                className="mt-1 bg-input border-border"
              />
            </div>
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Assigned Level</label>
            <select
              value={assignedLevel}
              onChange={(e) => setAssignedLevel(e.target.value)}
              className="mt-1 w-full rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground"
            >
              {["L1", "L2", "L3", "L4"].map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
              Assign To User <span className="text-muted-foreground normal-case">(overrides level lookup)</span>
            </label>
            <select
              value={assigneeId ?? ""}
              onChange={(e) => setAssigneeId(e.target.value ? Number(e.target.value) : undefined)}
              className="mt-1 w-full rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground"
            >
              <option value="">— Use level assignment —</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>{u.fullName}{u.level ? ` (${u.level})` : ""}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <Button variant="ghost" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button
            onClick={handleSave}
            disabled={saving || !name.trim()}
            className="bg-primary hover:bg-red-700 text-white"
          >
            {saving ? "Saving…" : "Save Rule"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Routing & Staff Tab ────────────────────────────────────────────────────

function RoutingStaffTab() {
  const [staffData, setStaffData] = useState<MaintenanceStaffData>({
    l1: [], l2: [], l3: [], l4: [], departments: [], businessUnits: [],
  });
  const [activeStaffTab, setActiveStaffTab] = useState<StaffTab>("L1");
  const [newEntry, setNewEntry] = useState("");
  const [routingRules, setRoutingRules] = useState<RoutingRule[]>([]);
  const [allUsers, setAllUsers] = useState<UserRecord[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [savingStaff, setSavingStaff] = useState(false);

  useEffect(() => {
    api.maintenance.getStaffLists().then(setStaffData).catch(() => {});
    api.maintenance.getRoutingRules().then(setRoutingRules).catch(() => {});
    api.users.list().then(setAllUsers).catch(() => {});
  }, []);

  function getCurrentList(): string[] {
    const map: Record<StaffTab, keyof MaintenanceStaffData> = {
      L1: "l1", L2: "l2", L3: "l3", L4: "l4", Depts: "departments", "Business Units": "businessUnits",
    };
    return staffData[map[activeStaffTab]] ?? [];
  }

  function setCurrentList(list: string[]) {
    const map: Record<StaffTab, keyof MaintenanceStaffData> = {
      L1: "l1", L2: "l2", L3: "l3", L4: "l4", Depts: "departments", "Business Units": "businessUnits",
    };
    setStaffData((prev) => ({ ...prev, [map[activeStaffTab]]: list }));
  }

  const handleAdd = async () => {
    const val = newEntry.trim();
    if (!val) return;
    const list = getCurrentList();
    if (list.includes(val)) return;
    const updated = [...list, val];
    setCurrentList(updated);
    setNewEntry("");
    const newData = { ...staffData };
    const map: Record<StaffTab, keyof MaintenanceStaffData> = {
      L1: "l1", L2: "l2", L3: "l3", L4: "l4", Depts: "departments", "Business Units": "businessUnits",
    };
    (newData[map[activeStaffTab]] as string[]) = updated;
    setSavingStaff(true);
    await api.maintenance.updateStaffLists(newData).catch(() => {});
    setSavingStaff(false);
  };

  const handleRemove = async (entry: string) => {
    const list = getCurrentList().filter((x) => x !== entry);
    setCurrentList(list);
    const newData = { ...staffData };
    const map: Record<StaffTab, keyof MaintenanceStaffData> = {
      L1: "l1", L2: "l2", L3: "l3", L4: "l4", Depts: "departments", "Business Units": "businessUnits",
    };
    (newData[map[activeStaffTab]] as string[]) = list;
    await api.maintenance.updateStaffLists(newData).catch(() => {});
  };

  const handleCreateRouting = async (data: Omit<RoutingRule, "id">) => {
    const rule = await api.maintenance.createRoutingRule(data).catch(() => null);
    if (rule) setRoutingRules((prev) => [...prev, rule]);
  };

  const handleDeleteRouting = async (id: number) => {
    await api.maintenance.deleteRoutingRule(id).catch(() => {});
    setRoutingRules((prev) => prev.filter((r) => r.id !== id));
  };

  return (
    <div className="space-y-4">
      {/* Routing Rules */}
      <div className="flex justify-end">
        <Button
          onClick={() => setShowModal(true)}
          className="bg-primary hover:bg-red-700 text-white font-semibold"
        >
          + New Routing
        </Button>
      </div>

      {routingRules.length > 0 && (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <h2 className="font-bold text-sm">Routing Rules</h2>
          </div>
          <div className="divide-y divide-border">
            {routingRules.map((rule) => (
              <div key={rule.id} className="flex items-center justify-between px-5 py-3 gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-medium">{rule.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {[rule.formType, rule.department].filter(Boolean).join(" · ")}
                    {rule.assignedLevel && ` → ${rule.assignedLevel}`}
                    {rule.assigneeName && ` · ${rule.assigneeName}`}
                  </p>
                </div>
                <button
                  onClick={() => handleDeleteRouting(rule.id)}
                  className="text-muted-foreground hover:text-red-400 transition-colors shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Staff & Department Lists */}
      <div className="bg-card border border-border rounded-xl p-5 space-y-4">
        <div>
          <h2 className="font-bold text-sm">Staff &amp; Department Lists</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            L1–L4 levels are assigned from registered Support users. Depts &amp; Business Units are free text.
          </p>
        </div>

        <TabBar tabs={STAFF_TABS} active={activeStaffTab} onChange={(t) => { setActiveStaffTab(t); setNewEntry(""); }} />

        {(["L1", "L2", "L3", "L4"] as StaffTab[]).includes(activeStaffTab) ? (
          <StaffUserPicker
            assigned={getCurrentList()}
            supportUsers={allUsers.filter((u) => u.roleName === "Support")}
            onAdd={async (name) => {
              const list = getCurrentList();
              if (list.includes(name)) return;
              const updated = [...list, name];
              setCurrentList(updated);
              const newData = { ...staffData };
              const map: Record<StaffTab, keyof MaintenanceStaffData> = {
                L1: "l1", L2: "l2", L3: "l3", L4: "l4", Depts: "departments", "Business Units": "businessUnits",
              };
              (newData[map[activeStaffTab]] as string[]) = updated;
              setSavingStaff(true);
              await api.maintenance.updateStaffLists(newData).catch(() => {});
              setSavingStaff(false);
            }}
          />
        ) : (
          <TagInput
            placeholder="Add new entry…"
            value={newEntry}
            onChange={setNewEntry}
            onAdd={handleAdd}
          />
        )}

        <div className="flex flex-wrap gap-2 min-h-[2rem]">
          {getCurrentList().length === 0 ? (
            <p className="text-xs text-muted-foreground">No entries yet.</p>
          ) : (["L1", "L2", "L3", "L4"] as StaffTab[]).includes(activeStaffTab) ? (
            getCurrentList().map((name) => (
              <UserTag key={name} name={name} onRemove={() => handleRemove(name)} />
            ))
          ) : (
            getCurrentList().map((entry) => (
              <Tag key={entry} label={entry} onRemove={() => handleRemove(entry)} />
            ))
          )}
        </div>
        {savingStaff && <p className="text-xs text-muted-foreground">Saving…</p>}
      </div>

      {showModal && (
        <NewRoutingModal onClose={() => setShowModal(false)} onSave={handleCreateRouting} users={allUsers} />
      )}
    </div>
  );
}

// ── Ticket Information Tab ─────────────────────────────────────────────────

function TicketInformationTab() {
  const [options, setOptions] = useState<TicketInfoOptions>({
    priorities: [], supportCategories: [], problemCategories: [],
    subCategories: [], severities: [], personnelLevels: [],
  });
  const [activeTab, setActiveTab] = useState<InfoTab>("Priority");
  const [newOption, setNewOption] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.maintenance.getTicketOptions().then(setOptions).catch(() => {});
  }, []);

  const keyMap: Record<InfoTab, keyof TicketInfoOptions> = {
    "Priority": "priorities",
    "Support Category": "supportCategories",
    "Problem Category": "problemCategories",
    "Sub-Category": "subCategories",
    "Severity": "severities",
    "Personnel Level": "personnelLevels",
  };

  const currentList = options[keyMap[activeTab]] ?? [];

  const handleAdd = () => {
    const val = newOption.trim();
    if (!val || currentList.includes(val)) return;
    setOptions((prev) => ({ ...prev, [keyMap[activeTab]]: [...currentList, val] }));
    setNewOption("");
    setSaved(false);
  };

  const handleRemove = (item: string) => {
    setOptions((prev) => ({ ...prev, [keyMap[activeTab]]: currentList.filter((x) => x !== item) }));
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    await api.maintenance.updateTicketOptions(options).catch(() => {});
    setSaving(false);
    setSaved(true);
  };

  return (
    <div className="bg-card border border-border rounded-xl p-5 space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-bold text-sm">Ticket Information</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Manage dropdown options used across all ticket forms and resolve flows.</p>
        </div>
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-primary hover:bg-red-700 text-white font-semibold shrink-0"
        >
          {saved && !saving ? "Saved ✓" : saving ? "Saving…" : "Save Changes"}
        </Button>
      </div>

      <TabBar tabs={INFO_TABS} active={activeTab} onChange={(t) => { setActiveTab(t); setNewOption(""); }} newBadge={INFO_NEW_BADGE} />

      <TagInput
        placeholder={`Add new ${activeTab} option…`}
        value={newOption}
        onChange={setNewOption}
        onAdd={handleAdd}
      />

      <div className="flex flex-wrap gap-2 min-h-[2rem]">
        {currentList.map((item) => (
          <Tag key={item} label={item} onRemove={() => handleRemove(item)} />
        ))}
        {currentList.length === 0 && (
          <p className="text-xs text-muted-foreground">No options yet.</p>
        )}
      </div>
    </div>
  );
}

// ── Evaluation Form Tab ────────────────────────────────────────────────────

function EvaluationFormTab() {
  const [form, setForm] = useState<EvalForm>({ title: "", introMessage: "", questions: [] });
  const [newQuestion, setNewQuestion] = useState("");
  const [newQType, setNewQType] = useState("Rating");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.maintenance.getEvalForm().then(setForm).catch(() => {});
  }, []);

  const handleAddQuestion = () => {
    const text = newQuestion.trim();
    if (!text) return;
    const id = Date.now();
    setForm((prev) => ({
      ...prev,
      questions: [...prev.questions, { id, text, type: newQType }],
    }));
    setNewQuestion("");
    setSaved(false);
  };

  const handleRemoveQuestion = (id: number) => {
    setForm((prev) => ({ ...prev, questions: prev.questions.filter((q) => q.id !== id) }));
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    await api.maintenance.updateEvalForm(form).catch(() => {});
    setSaving(false);
    setSaved(true);
  };

  function typeIcon(type: string) {
    if (type === "Rating") return "★";
    if (type === "Yes/No") return "◎";
    return "¶";
  }

  return (
    <div className="bg-card border border-border rounded-xl p-5 space-y-5">
      <div>
        <h2 className="font-bold text-sm">Evaluation Form</h2>
        <p className="text-xs text-muted-foreground mt-0.5">Sent automatically to requesters after ticket resolution.</p>
      </div>

      {/* Form Title */}
      <div className="space-y-1.5">
        <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Form Title</label>
        <Input
          value={form.title}
          onChange={(e) => { setForm((p) => ({ ...p, title: e.target.value })); setSaved(false); }}
          placeholder="e.g., IT Service Evaluation"
          className="bg-input border-border"
        />
      </div>

      {/* Intro Message */}
      <div className="space-y-1.5">
        <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Intro Message</label>
        <Textarea
          value={form.introMessage}
          onChange={(e) => { setForm((p) => ({ ...p, introMessage: e.target.value })); setSaved(false); }}
          placeholder="Thank you for using SmartFix IT."
          rows={3}
          className="bg-input border-border resize-none"
        />
      </div>

      {/* Questions */}
      <div className="space-y-2">
        <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Questions</label>

        {form.questions.length > 0 && (
          <div className="space-y-2">
            {form.questions.map((q, idx) => (
              <div key={q.id} className="flex items-center gap-3 bg-[#1e1e1e] border border-border rounded-lg px-4 py-3">
                <span className="text-xs text-muted-foreground font-semibold w-5 shrink-0">{idx + 1}.</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{q.text}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {typeIcon(q.type)} {q.type}
                  </p>
                </div>
                <button
                  onClick={() => handleRemoveQuestion(q.id)}
                  className="text-muted-foreground hover:text-red-400 transition-colors shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Add question row */}
        <div className="flex gap-2">
          <Input
            value={newQuestion}
            onChange={(e) => setNewQuestion(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddQuestion(); } }}
            placeholder="New question…"
            className="flex-1 bg-input border-border"
          />
          <select
            value={newQType}
            onChange={(e) => setNewQType(e.target.value)}
            className="rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground shrink-0"
          >
            {QUESTION_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <button
            onClick={handleAddQuestion}
            className="px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold transition-colors whitespace-nowrap"
          >
            + Add
          </button>
        </div>
      </div>

      <div className="flex justify-end pt-1">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-primary hover:bg-red-700 text-white font-semibold"
        >
          {saved && !saving ? "Saved ✓" : saving ? "Saving…" : "Save Form"}
        </Button>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────

export default function MaintenancePage() {
  const [activeTab, setActiveTab] = useState<MainTab>("Routing & Staff");

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Maintenance</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Routing, ticket information, and evaluation form.</p>
      </div>

      {/* Main tabs */}
      <div className="flex gap-2 border-b border-border pb-0">
        {MAIN_TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg border-b-2 transition-colors -mb-px ${
              activeTab === tab
                ? "border-primary text-primary bg-primary/10"
                : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "Routing & Staff" && <RoutingStaffTab />}
      {activeTab === "Ticket Information" && <TicketInformationTab />}
      {activeTab === "Evaluation Form" && <EvaluationFormTab />}
    </div>
  );
}
