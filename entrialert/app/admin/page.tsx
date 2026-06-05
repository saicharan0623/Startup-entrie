"use client";
import { useEffect, useState, useCallback } from "react";
import { ShieldCheck, Users, RefreshCw, Clock, Activity } from "lucide-react";
import RequireAuth from "@/components/RequireAuth";
import { fetchUsers, fetchStats } from "@/lib/api";

type User = {
  id: string;
  name: string;
  email: string;
  organization_name: string;
  role: "admin" | "viewer";
  created_at: string;
  last_login: string | null;
};

type Stats = {
  total_events: number;
  total_decisions: number;
  approved: number;
  rejected: number;
  incorrect: number;
};

function StatCard({ label, value, color }: { label: string; value: number | string; color: string }) {
  return (
    <div className="rounded-xl border p-4"
      style={{ background: "var(--card)", borderColor: "var(--border)" }}>
      <div className="text-xs font-semibold mb-1" style={{ color: "#64748b" }}>{label}</div>
      <div className="text-2xl font-extrabold" style={{ color }}>{value}</div>
    </div>
  );
}

function relativeTime(iso: string | null) {
  if (!iso) return "Never";
  try {
    const diff = Date.now() - new Date(iso).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return "Just now";
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  } catch { return "—"; }
}

function AdminContent() {
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [u, s] = await Promise.all([fetchUsers(), fetchStats()]);
      setUsers(u.users ?? []);
      setStats(s);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  const adminCount = users.filter((u) => u.role === "admin").length;
  const viewerCount = users.filter((u) => u.role === "viewer").length;

  return (
    <div className="min-h-screen" style={{ background: "var(--background)" }}>

      {/* Top bar */}
      <div className="sticky top-16 z-40 border-b px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between"
        style={{ background: "rgba(10,15,30,0.97)", borderColor: "var(--border)", backdropFilter: "blur(12px)" }}>
        <div className="flex items-center gap-3">
          <ShieldCheck size={18} style={{ color: "#a855f7" }} />
          <span className="font-bold text-sm">Admin Panel</span>
          <span className="text-xs px-2 py-0.5 rounded-full"
            style={{ background: "rgba(168,85,247,0.1)", color: "#a855f7", border: "1px solid rgba(168,85,247,0.2)" }}>
            Admin Only
          </span>
        </div>
        <button onClick={loadAll}
          className="p-1.5 rounded border transition-all hover:border-cyan-400"
          style={{ borderColor: "var(--border)", color: "#64748b" }}>
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        {/* ── User stats cards ── */}
        <div>
          <h2 className="font-bold text-base mb-4 flex items-center gap-2">
            <Users size={16} style={{ color: "var(--accent)" }} />
            User Overview
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatCard label="Total Users" value={users.length} color="var(--accent)" />
            <StatCard label="Admins" value={adminCount} color="#a855f7" />
            <StatCard label="Viewers" value={viewerCount} color="#64748b" />
            <StatCard label="Total Decisions" value={stats?.total_decisions ?? "—"} color="#22c55e" />
          </div>
        </div>

        {/* ── Platform stats ── */}
        {stats && (
          <div>
            <h2 className="font-bold text-base mb-4 flex items-center gap-2">
              <Activity size={16} style={{ color: "var(--accent)" }} />
              Platform Activity
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <StatCard label="Total Events" value={stats.total_events} color="#00d4ff" />
              <StatCard label="Approved" value={stats.approved} color="#22c55e" />
              <StatCard label="Rejected" value={stats.rejected} color="#ef4444" />
              <StatCard label="Marked Incorrect" value={stats.incorrect} color="#f97316" />
            </div>
          </div>
        )}

        {/* ── Users table ── */}
        <div>
          <h2 className="font-bold text-base mb-4 flex items-center gap-2">
            <Users size={16} style={{ color: "var(--accent)" }} />
            Registered Users
            <span className="text-xs px-2 py-0.5 rounded-full font-normal"
              style={{ background: "var(--card)", color: "#64748b", border: "1px solid var(--border)" }}>
              {users.length}
            </span>
          </h2>

          {loading ? (
            <div className="rounded-2xl border p-12 text-center"
              style={{ background: "var(--card)", borderColor: "var(--border)" }}>
              <RefreshCw size={20} className="animate-spin mx-auto mb-2" style={{ color: "#475569" }} />
              <p className="text-sm" style={{ color: "#475569" }}>Loading...</p>
            </div>
          ) : (
            <div className="rounded-2xl border overflow-hidden"
              style={{ background: "var(--card)", borderColor: "var(--border)" }}>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ background: "var(--background)", borderBottom: "1px solid var(--border)" }}>
                      {["User", "Email", "Organization", "Role", "Joined", "Last Login"].map((h) => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold"
                          style={{ color: "#64748b" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {users.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-10 text-center text-sm"
                          style={{ color: "#475569" }}>
                          No users registered yet.
                        </td>
                      </tr>
                    ) : users.map((u, i) => (
                      <tr key={u.id}
                        style={{ borderBottom: i < users.length - 1 ? "1px solid var(--border)" : "none" }}>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                              style={{ background: u.role === "admin" ? "rgba(168,85,247,0.12)" : "rgba(0,212,255,0.1)", color: u.role === "admin" ? "#a855f7" : "var(--accent)" }}>
                              {u.name.charAt(0).toUpperCase()}
                            </div>
                            <span className="font-medium">{u.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs" style={{ color: "#94a3b8" }}>{u.email}</td>
                        <td className="px-4 py-3 text-xs" style={{ color: "#94a3b8" }}>{u.organization_name}</td>
                        <td className="px-4 py-3">
                          <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                            style={{
                              background: u.role === "admin" ? "rgba(168,85,247,0.1)" : "rgba(100,116,139,0.1)",
                              color: u.role === "admin" ? "#a855f7" : "#64748b",
                              border: `1px solid ${u.role === "admin" ? "rgba(168,85,247,0.2)" : "rgba(100,116,139,0.15)"}`,
                            }}>
                            {u.role === "admin" ? "Admin" : "Viewer"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs" style={{ color: "#64748b" }}>
                          {new Date(u.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5 text-xs" style={{ color: "#64748b" }}>
                            <Clock size={11} />
                            {relativeTime(u.last_login)}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdminPage() {
  return (
    <RequireAuth adminOnly>
      <AdminContent />
    </RequireAuth>
  );
}
