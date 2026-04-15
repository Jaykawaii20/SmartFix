"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Settings } from "lucide-react";

export default function RegisterPage() {
  const { register } = useAuth();
  const [form, setForm] = useState({ fullName: "", email: "", password: "", confirmPassword: "", department: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (!form.department) {
      setError("Please select a department");
      return;
    }
    setLoading(true);
    try {
      await register({ fullName: form.fullName, email: form.email, password: form.password, department: form.department });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
            <Settings className="w-5 h-5 text-white" />
          </div>
          <span className="text-2xl font-bold text-foreground">SmartFix IT</span>
        </div>

        <div className="bg-card border border-border rounded-xl p-8 shadow-lg">
          <h1 className="text-xl font-semibold mb-1">Create an account</h1>
          <p className="text-muted-foreground text-sm mb-6">Join SmartFix IT to track your requests</p>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label className="text-xs uppercase tracking-wider text-muted-foreground mb-1.5 block">Full Name</Label>
              <Input placeholder="Juan Dela Cruz" value={form.fullName} onChange={set("fullName")} required className="bg-input border-border" />
            </div>

            <div>
              <Label className="text-xs uppercase tracking-wider text-muted-foreground mb-1.5 block">Email</Label>
              <Input type="email" placeholder="email@company.com" value={form.email} onChange={set("email")} required className="bg-input border-border" />
            </div>

            <div>
              <Label className="text-xs uppercase tracking-wider text-muted-foreground mb-1.5 block">Department</Label>
              <Select onValueChange={(v: string | null) => setForm((p) => ({ ...p, department: v ?? "" }))}>
                <SelectTrigger className="bg-input border-border">
                  <SelectValue placeholder="Select department..." />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {["IT", "HR", "Finance", "Operations", "Marketing", "Sales", "MIS"].map((d) => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs uppercase tracking-wider text-muted-foreground mb-1.5 block">Password</Label>
              <Input type="password" placeholder="••••••••" value={form.password} onChange={set("password")} required className="bg-input border-border" />
            </div>

            <div>
              <Label className="text-xs uppercase tracking-wider text-muted-foreground mb-1.5 block">Confirm Password</Label>
              <Input type="password" placeholder="••••••••" value={form.confirmPassword} onChange={set("confirmPassword")} required className="bg-input border-border" />
            </div>

            <Button type="submit" className="w-full bg-primary hover:bg-red-700 text-white font-semibold mt-2" disabled={loading}>
              {loading ? "Creating account..." : "Create Account"}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Already have an account?{" "}
            <Link href="/login" className="text-primary hover:underline font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
