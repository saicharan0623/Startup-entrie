"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Shield, Eye, EyeOff, UserPlus } from "lucide-react";
import { registerUser } from "@/lib/api";
import { useAuth } from "@/lib/auth";

export default function RegisterPage() {
  const { setUser, isLoggedIn } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    email: "",
    organization_name: "",
    password: "",
    confirmPassword: "",
  });
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isLoggedIn) router.replace("/dashboard");
  }, [isLoggedIn, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (form.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    setLoading(true);
    try {
      const data = await registerUser({
        name: form.name,
        email: form.email,
        password: form.password,
        organization_name: form.organization_name,
      });
      setUser(data.user);
      router.push("/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const field = (
    key: keyof typeof form,
    label: string,
    type: string,
    placeholder: string,
    extra?: React.ReactNode
  ) => (
    <div>
      <label className="block text-sm font-medium mb-1.5" style={{ color: "#94a3b8" }}>
        {label}
      </label>
      <div className="relative">
        <input
          type={type}
          required
          value={form[key]}
          onChange={(e) => setForm({ ...form, [key]: e.target.value })}
          placeholder={placeholder}
          className="w-full px-4 py-2.5 rounded-lg border text-sm outline-none transition-colors"
          style={{
            background: "var(--background)",
            borderColor: "var(--border)",
            color: "var(--foreground)",
            paddingRight: extra ? "2.5rem" : undefined,
          }}
        />
        {extra}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12"
      style={{ background: "var(--background)" }}>

      <div className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse 60% 40% at 50% 10%, rgba(0,212,255,0.08) 0%, transparent 60%)" }} />

      <div className="w-full max-w-md relative z-10">

        <div className="flex items-center justify-center gap-2 mb-8">
          <Shield size={28} style={{ color: "var(--accent)" }} />
          <span className="text-2xl font-extrabold" style={{ color: "var(--accent)" }}>EntriAlert</span>
        </div>

        <div className="rounded-2xl border p-8 space-y-6"
          style={{ background: "var(--card)", borderColor: "var(--border)" }}>

          <div>
            <h1 className="text-xl font-bold mb-1">Create your account</h1>
            <p className="text-sm" style={{ color: "#64748b" }}>
              Already have an account?{" "}
              <Link href="/login" className="hover:underline" style={{ color: "var(--accent)" }}>
                Sign in
              </Link>
            </p>
          </div>

          {error && (
            <div className="rounded-lg px-4 py-3 text-sm border"
              style={{ background: "rgba(239,68,68,0.08)", borderColor: "rgba(239,68,68,0.25)", color: "#f87171" }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {field("name", "Full Name", "text", "Jane Smith")}
            {field("email", "Work Email", "email", "you@company.com")}
            {field("organization_name", "Organization Name", "text", "Acme Corp")}

            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "#94a3b8" }}>
                Password
              </label>
              <div className="relative">
                <input
                  type={showPwd ? "text" : "password"}
                  required
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="Min. 6 characters"
                  className="w-full px-4 py-2.5 rounded-lg border text-sm outline-none transition-colors pr-10"
                  style={{ background: "var(--background)", borderColor: "var(--border)", color: "var(--foreground)" }}
                />
                <button type="button" onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "#475569" }}>
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {field("confirmPassword", "Confirm Password", showPwd ? "text" : "password", "Re-enter password")}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg font-semibold text-sm transition-all hover:opacity-90 disabled:opacity-50"
              style={{ background: "var(--accent)", color: "#0a0f1e" }}
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                <UserPlus size={16} />
              )}
              {loading ? "Creating account..." : "Create Account"}
            </button>
          </form>

          <p className="text-xs text-center" style={{ color: "#334155" }}>
            Your account starts with Viewer role. An admin can upgrade your access.
          </p>
        </div>
      </div>
    </div>
  );
}
