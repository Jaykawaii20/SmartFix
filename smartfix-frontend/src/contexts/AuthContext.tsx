"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, AuthResponse, RolePermission } from "@/lib/api";

interface AuthContextType {
  user: AuthResponse | null;
  permissions: RolePermission[];
  login: (email: string, password: string) => Promise<void>;
  register: (data: { fullName: string; email: string; password: string; department: string }) => Promise<void>;
  logout: () => void;
  loading: boolean;
  can: (module: string, action?: "view" | "create" | "edit" | "delete") => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthResponse | null>(null);
  const [permissions, setPermissions] = useState<RolePermission[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const stored = localStorage.getItem("smartfix_user");
    const storedPerms = localStorage.getItem("smartfix_permissions");
    if (stored) {
      try {
        setUser(JSON.parse(stored));
        if (storedPerms) setPermissions(JSON.parse(storedPerms));
      } catch {
        localStorage.removeItem("smartfix_user");
        localStorage.removeItem("smartfix_token");
        localStorage.removeItem("smartfix_permissions");
      }
    }
    setLoading(false);
  }, []);

  const applySession = async (res: AuthResponse) => {
    localStorage.setItem("smartfix_token", res.token);
    localStorage.setItem("smartfix_user", JSON.stringify(res));
    setUser(res);

    try {
      const perms = await api.users.myPermissions();
      setPermissions(perms);
      localStorage.setItem("smartfix_permissions", JSON.stringify(perms));
    } catch {
      setPermissions([]);
      localStorage.removeItem("smartfix_permissions");
    }
  };

  const login = async (email: string, password: string) => {
    const res = await api.auth.login({ email, password });
    await applySession(res);
    router.push("/dashboard");
  };

  const register = async (data: { fullName: string; email: string; password: string; department: string }) => {
    const res = await api.auth.register(data);
    await applySession(res);
    router.push("/dashboard");
  };

  const logout = () => {
    localStorage.removeItem("smartfix_token");
    localStorage.removeItem("smartfix_user");
    localStorage.removeItem("smartfix_permissions");
    setUser(null);
    setPermissions([]);
    router.push("/login");
  };

  const can = (module: string, action: "view" | "create" | "edit" | "delete" = "view"): boolean => {
    if (user?.role === "SuperAdmin") return true;
    const perm = permissions.find((p) => p.module === module);
    if (!perm) return false;
    if (action === "view") return perm.canView;
    if (action === "create") return perm.canCreate;
    if (action === "edit") return perm.canEdit;
    if (action === "delete") return perm.canDelete;
    return false;
  };

  return (
    <AuthContext.Provider value={{ user, permissions, login, register, logout, loading, can }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
