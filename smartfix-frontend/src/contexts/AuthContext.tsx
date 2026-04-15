"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, AuthResponse } from "@/lib/api";

interface AuthContextType {
  user: AuthResponse | null;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { fullName: string; email: string; password: string; department: string }) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const stored = localStorage.getItem("smartfix_user");
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        localStorage.removeItem("smartfix_user");
        localStorage.removeItem("smartfix_token");
      }
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.auth.login({ email, password });
    localStorage.setItem("smartfix_token", res.token);
    localStorage.setItem("smartfix_user", JSON.stringify(res));
    setUser(res);
    router.push("/dashboard");
  };

  const register = async (data: { fullName: string; email: string; password: string; department: string }) => {
    const res = await api.auth.register(data);
    localStorage.setItem("smartfix_token", res.token);
    localStorage.setItem("smartfix_user", JSON.stringify(res));
    setUser(res);
    router.push("/dashboard");
  };

  const logout = () => {
    localStorage.removeItem("smartfix_token");
    localStorage.removeItem("smartfix_user");
    setUser(null);
    router.push("/login");
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
