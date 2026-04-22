"use client";

import { useEffect, useState, useCallback } from "react";
import { api, UserRecord, Role } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { ToggleLeft, ToggleRight, UserCog } from "lucide-react";

// ── Level Badge ────────────────────────────────────────────────────────────

function LevelBadge({ level }: { level: string }) {
  if (!level) return null;
  return (
    <span className="text-[11px] bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-full px-2 py-0.5">
      {level}
    </span>
  );
}

// ── Status Badge ───────────────────────────────────────────────────────────

function ActiveBadge({ active }: { active: boolean }) {
  return (
    <span
      className={`text-[11px] rounded-full px-2 py-0.5 border ${
        active
          ? "bg-green-500/20 text-green-400 border-green-500/30"
          : "bg-red-500/20 text-red-400 border-red-500/30"
      }`}
    >
      {active ? "Active" : "Inactive"}
    </span>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function UsersPage() {
  const { can } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!can("users")) { router.replace("/dashboard"); return; }
    fetchData();
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [usersRes, rolesRes] = await Promise.all([api.users.list(), api.roles.list()]);
      setUsers(usersRes);
      setRoles(rolesRes);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleRoleChange = async (userId: number, roleId: number) => {
    const updated = await api.users.updateRole(userId, roleId);
    setUsers((prev) => prev.map((u) => (u.id === userId ? updated : u)));
  };

  const handleToggleActive = async (userId: number) => {
    const updated = await api.users.toggleActive(userId);
    setUsers((prev) => prev.map((u) => (u.id === userId ? updated : u)));
  };

  const filtered = users.filter(
    (u) =>
      u.fullName.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.department?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6 max-w-5xl">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold">Users</h1>
          <p className="text-sm text-muted-foreground">Manage registered users and their roles</p>
        </div>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search users…"
          className="px-3 py-1.5 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary w-56"
        />
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading users…</p>
      ) : (
        <div className="border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs">Name</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs">Department</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs">Level</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs">Role</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs">Status</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs">Joined</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-muted-foreground text-sm">
                    No users found.
                  </td>
                </tr>
              ) : (
                filtered.map((u) => (
                  <tr key={u.id} className="border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                          {u.fullName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium leading-tight">{u.fullName}</p>
                          <p className="text-[11px] text-muted-foreground">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{u.department || "—"}</td>
                    <td className="px-4 py-3">
                      <LevelBadge level={u.level} />
                    </td>
                    <td className="px-4 py-3">
                      {can("users", "edit") ? (
                        <div className="flex items-center gap-1.5">
                          <UserCog className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                          <select
                            value={u.roleId ?? ""}
                            onChange={(e) => handleRoleChange(u.id, Number(e.target.value))}
                            className="text-xs bg-background border border-border rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary"
                          >
                            <option value="" disabled>— No role —</option>
                            {roles.map((r) => (
                              <option key={r.id} value={r.id}>{r.name}</option>
                            ))}
                          </select>
                        </div>
                      ) : (
                        <span className="text-xs">{u.roleName ?? "—"}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <ActiveBadge active={u.isActive} />
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      {can("users", "edit") && (
                        <button
                          onClick={() => handleToggleActive(u.id)}
                          title={u.isActive ? "Deactivate" : "Activate"}
                          className="text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {u.isActive ? (
                            <ToggleRight className="w-5 h-5 text-green-400" />
                          ) : (
                            <ToggleLeft className="w-5 h-5" />
                          )}
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
