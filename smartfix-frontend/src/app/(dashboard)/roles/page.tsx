"use client";

import { useEffect, useState, useCallback } from "react";
import { api, Role, RolePermission, MODULES } from "@/lib/api";
import { Plus, Trash2, Edit2, Save, X, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";

// ── Types ──────────────────────────────────────────────────────────────────

type PermMap = Record<string, { canView: boolean; canCreate: boolean; canEdit: boolean; canDelete: boolean }>;

const MODULE_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  service_tracker: "Service Tracker",
  approvals: "Approvals",
  maintenance: "Maintenance",
  reports: "Reports",
  status: "Status",
  users: "Users",
  roles: "Roles",
};

// ── Helpers ────────────────────────────────────────────────────────────────

function emptyPermMap(): PermMap {
  return Object.fromEntries(
    MODULES.map((m) => [m, { canView: false, canCreate: false, canEdit: false, canDelete: false }])
  );
}

function roleToPermMap(role: Role): PermMap {
  const map = emptyPermMap();
  for (const p of role.permissions) {
    map[p.module] = { canView: p.canView, canCreate: p.canCreate, canEdit: p.canEdit, canDelete: p.canDelete };
  }
  return map;
}

function permMapToList(map: PermMap): RolePermission[] {
  return Object.entries(map).map(([module, p]) => ({
    module,
    canView: p.canView,
    canCreate: p.canCreate,
    canEdit: p.canEdit,
    canDelete: p.canDelete,
  }));
}

// ── Permission Checkbox Row ────────────────────────────────────────────────

function PermRow({
  module,
  perms,
  onChange,
  disabled,
}: {
  module: string;
  perms: { canView: boolean; canCreate: boolean; canEdit: boolean; canDelete: boolean };
  onChange: (field: keyof typeof perms, val: boolean) => void;
  disabled?: boolean;
}) {
  const actions: Array<{ key: keyof typeof perms; label: string }> = [
    { key: "canView", label: "View" },
    { key: "canCreate", label: "Create" },
    { key: "canEdit", label: "Edit" },
    { key: "canDelete", label: "Delete" },
  ];

  return (
    <div className="flex items-center gap-4 py-2.5 border-b border-border/50 last:border-0">
      <span className="w-36 text-sm font-medium shrink-0">{MODULE_LABELS[module] ?? module}</span>
      <div className="flex gap-6">
        {actions.map(({ key, label }) => (
          <label key={key} className="flex items-center gap-1.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={perms[key]}
              disabled={disabled}
              onChange={(e) => onChange(key, e.target.checked)}
              className="w-4 h-4 accent-primary rounded"
            />
            <span className="text-xs text-muted-foreground">{label}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

// ── Role Form ──────────────────────────────────────────────────────────────

function RoleForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: Role;
  onSave: (name: string, description: string, permissions: RolePermission[]) => Promise<void>;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [permMap, setPermMap] = useState<PermMap>(initial ? roleToPermMap(initial) : emptyPermMap());
  const [saving, setSaving] = useState(false);

  const setModulePerm = (module: string, field: string, val: boolean) => {
    setPermMap((prev) => ({ ...prev, [module]: { ...prev[module], [field]: val } }));
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      await onSave(name.trim(), description.trim(), permMapToList(permMap));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="border border-border rounded-xl bg-card p-5 space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Role Name</label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Helpdesk Tier 1"
            disabled={initial?.isSystem}
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Description</label>
          <Input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief description of this role"
            disabled={initial?.isSystem}
          />
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Module Permissions</p>
        <div className="border border-border rounded-lg px-4">
          {MODULES.map((m) => (
            <PermRow
              key={m}
              module={m}
              perms={permMap[m]}
              onChange={(field, val) => setModulePerm(m, field, val)}
              disabled={initial?.isSystem && initial.name === "SuperAdmin"}
            />
          ))}
        </div>
      </div>

      <div className="flex gap-2 justify-end">
        <Button variant="outline" size="sm" onClick={onCancel}>
          <X className="w-3.5 h-3.5 mr-1" /> Cancel
        </Button>
        <Button size="sm" onClick={handleSave} disabled={saving || !name.trim()}>
          <Save className="w-3.5 h-3.5 mr-1" /> {saving ? "Saving…" : "Save Role"}
        </Button>
      </div>
    </div>
  );
}

// ── Role Card ──────────────────────────────────────────────────────────────

function RoleCard({
  role,
  onEdit,
  onDelete,
}: {
  role: Role;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const granted = role.permissions.filter((p) => p.canView || p.canCreate || p.canEdit || p.canDelete);

  return (
    <div className="border border-border rounded-xl bg-card p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
            <span className="font-semibold text-sm">{role.name}</span>
            {role.isDefault && (
              <span className="text-[10px] bg-green-500/20 text-green-400 border border-green-500/30 rounded-full px-2 py-0.5">
                Default
              </span>
            )}
            {role.isSystem && (
              <span className="text-[10px] bg-primary/20 text-primary border border-primary/30 rounded-full px-2 py-0.5">
                System
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">{role.description}</p>
        </div>
        <div className="flex gap-1 shrink-0">
          <Button variant="ghost" size="icon" className="w-7 h-7" onClick={onEdit}>
            <Edit2 className="w-3.5 h-3.5" />
          </Button>
          {!role.isSystem && (
            <Button variant="ghost" size="icon" className="w-7 h-7 text-destructive hover:text-destructive" onClick={onDelete}>
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {granted.length === 0 ? (
          <span className="text-xs text-muted-foreground italic">No permissions</span>
        ) : (
          granted.map((p) => (
            <span key={p.module} className="text-[11px] bg-muted border border-border rounded px-1.5 py-0.5">
              {MODULE_LABELS[p.module] ?? p.module}
            </span>
          ))
        )}
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function RolesPage() {
  const { can } = useAuth();
  const router = useRouter();
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  useEffect(() => {
    if (!can("roles")) { router.replace("/dashboard"); return; }
    fetchRoles();
  }, []);

  const fetchRoles = useCallback(async () => {
    setLoading(true);
    try {
      setRoles(await api.roles.list());
    } finally {
      setLoading(false);
    }
  }, []);

  const handleCreate = async (name: string, description: string, permissions: RolePermission[]) => {
    await api.roles.create({ name, description, permissions });
    setCreating(false);
    fetchRoles();
  };

  const handleUpdate = async (id: number, name: string, description: string, permissions: RolePermission[]) => {
    await api.roles.update(id, { name, description, permissions });
    setEditingId(null);
    fetchRoles();
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this role? Users assigned to it will have no role.")) return;
    await api.roles.delete(id);
    fetchRoles();
  };

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Roles</h1>
          <p className="text-sm text-muted-foreground">Manage roles and their module permissions</p>
        </div>
        {!creating && (
          <Button size="sm" onClick={() => { setCreating(true); setEditingId(null); }}>
            <Plus className="w-3.5 h-3.5 mr-1" /> New Role
          </Button>
        )}
      </div>

      {creating && (
        <RoleForm
          onSave={handleCreate}
          onCancel={() => setCreating(false)}
        />
      )}

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading roles…</p>
      ) : (
        <div className="space-y-3">
          {roles.map((role) =>
            editingId === role.id ? (
              <RoleForm
                key={role.id}
                initial={role}
                onSave={(name, desc, perms) => handleUpdate(role.id, name, desc, perms)}
                onCancel={() => setEditingId(null)}
              />
            ) : (
              <RoleCard
                key={role.id}
                role={role}
                onEdit={() => { setEditingId(role.id); setCreating(false); }}
                onDelete={() => handleDelete(role.id)}
              />
            )
          )}
        </div>
      )}
    </div>
  );
}
