"use client";
import { useEffect, useState, useCallback } from "react";
import { Shield, RefreshCw, AlertTriangle, Activity } from "lucide-react";
import { useWebSocket } from "@/hooks/useWebSocket";
import { fetchDecisions, fetchStats, fetchDevices, submitFeedback } from "@/lib/api";
import SummaryCards from "@/components/dashboard/SummaryCards";
import AlertTable from "@/components/dashboard/AlertTable";
import SeverityChart from "@/components/dashboard/SeverityChart";
import EndpointsPanel from "@/components/dashboard/EndpointsPanel";

export type Decision = {
  id: string;
  event_type: string;
  severity: string;
  title: string;
  what_happened: string;
  why_it_matters: string;
  business_impact: string;
  recommended_action: string;
  confidence: number;
  tags: string[];
  device?: { hostname: string; os: string; user: string; ip: string; mac: string };
  created_at: string;
  feedback?: string;
  rule_id?: string;
};

export type Stats = {
  total_events: number;
  total_decisions: number;
  approved: number;
  rejected: number;
  incorrect: number;
};

export type Device = {
  hostname: string;
  os: string;
  user: string;
  ip: string;
  mac: string;
  last_seen?: string;
};

const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:8000/ws";
const SEVERITY_ORDER = ["CRITICAL", "HIGH", "MEDIUM", "LOW"];

export default function DashboardPage() {
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [devices, setDevices] = useState<Device[]>([]);
  const [filter, setFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const [d, s, dev] = await Promise.all([fetchDecisions(200), fetchStats(), fetchDevices()]);
      setDecisions(d.decisions ?? []);
      setStats(s);
      setDevices(dev.devices ?? []);
    } catch {
      // backend offline — show empty state
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  useWebSocket(WS_URL, (msg: unknown) => {
    const m = msg as { type: string; data?: Decision; decision_id?: string; action?: string };
    setConnected(true);
    if (m.type === "decision" && m.data) {
      setDecisions((prev) => [m.data!, ...prev].slice(0, 500));
      setStats((prev) => prev ? { ...prev, total_decisions: prev.total_decisions + 1 } : prev);
    }
    if (m.type === "feedback" && m.decision_id) {
      setDecisions((prev) =>
        prev.map((d) => d.id === m.decision_id ? { ...d, feedback: m.action } : d)
      );
    }
  });

  const handleFeedback = async (id: string, action: string) => {
    await submitFeedback(id, action);
    setDecisions((prev) => prev.map((d) => d.id === id ? { ...d, feedback: action } : d));
  };

  // Derived counts for summary cards
  const counts = {
    total: stats?.total_events ?? 0,
    critical: decisions.filter((d) => d.severity === "CRITICAL").length,
    high: decisions.filter((d) => d.severity === "HIGH").length,
    medium: decisions.filter((d) => d.severity === "MEDIUM").length,
    low: decisions.filter((d) => d.severity === "LOW").length,
    open: decisions.filter((d) => !d.feedback).length,
    online: devices.length,
  };

  // Filter decisions
  const filtered = decisions
    .filter((d) => filter === "ALL" || d.severity === filter)
    .filter((d) => {
      if (statusFilter === "ALL") return true;
      if (statusFilter === "OPEN") return !d.feedback;
      if (statusFilter === "RESOLVED") return d.feedback === "approve" || d.feedback === "reject";
      return true;
    })
    .sort((a, b) => SEVERITY_ORDER.indexOf(a.severity) - SEVERITY_ORDER.indexOf(b.severity));

  return (
    <div className="min-h-screen" style={{ background: "var(--background)" }}>

      {/* ── Top bar ── */}
      <div
        className="sticky top-16 z-40 border-b px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center gap-3 justify-between"
        style={{ background: "rgba(10,15,30,0.97)", borderColor: "var(--border)", backdropFilter: "blur(12px)" }}
      >
        <div className="flex items-center gap-3">
          <Shield size={18} style={{ color: "var(--accent)" }} />
          <span className="font-bold text-sm">Live Monitoring Dashboard</span>
          <span
            className="flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full"
            style={{
              background: connected ? "rgba(34,197,94,0.1)" : "rgba(100,116,139,0.1)",
              color: connected ? "#22c55e" : "#64748b",
              border: `1px solid ${connected ? "rgba(34,197,94,0.3)" : "rgba(100,116,139,0.2)"}`,
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{
              background: connected ? "#22c55e" : "#64748b",
              animation: connected ? "pulse 2s infinite" : "none",
            }} />
            {connected ? "LIVE" : "CONNECTING"}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Severity filter */}
          <div className="flex gap-1">
            {["ALL", "CRITICAL", "HIGH", "MEDIUM", "LOW"].map((s) => (
              <button key={s} onClick={() => setFilter(s)}
                className="px-2.5 py-1 rounded text-xs font-semibold transition-all"
                style={{
                  background: filter === s ? "var(--accent)" : "var(--card)",
                  color: filter === s ? "#0a0f1e" : "#64748b",
                  border: `1px solid ${filter === s ? "var(--accent)" : "var(--border)"}`,
                }}
              >{s}</button>
            ))}
          </div>
          {/* Status filter */}
          <div className="flex gap-1">
            {["ALL", "OPEN", "RESOLVED"].map((s) => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className="px-2.5 py-1 rounded text-xs font-semibold transition-all"
                style={{
                  background: statusFilter === s ? "#1e293b" : "var(--card)",
                  color: statusFilter === s ? "#e2e8f0" : "#64748b",
                  border: `1px solid ${statusFilter === s ? "#334155" : "var(--border)"}`,
                }}
              >{s}</button>
            ))}
          </div>
          <button onClick={loadData}
            className="p-1.5 rounded border transition-all hover:border-cyan-400"
            style={{ borderColor: "var(--border)", color: "#64748b" }}
            title="Refresh"
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

        {/* ── Summary cards ── */}
        <SummaryCards counts={counts} />

        {/* ── Main grid ── */}
        <div className="grid lg:grid-cols-3 gap-6">

          {/* Alert table — 2/3 */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-base flex items-center gap-2">
                <Activity size={16} style={{ color: "var(--accent)" }} />
                Alert Table
                <span className="text-xs px-2 py-0.5 rounded-full font-normal"
                  style={{ background: "var(--card)", color: "#64748b", border: "1px solid var(--border)" }}>
                  {filtered.length}
                </span>
              </h2>
            </div>

            {loading ? (
              <div className="rounded-xl border p-12 text-center" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
                <RefreshCw size={22} className="animate-spin mx-auto mb-3" style={{ color: "#475569" }} />
                <p className="text-sm" style={{ color: "#475569" }}>Connecting to backend...</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="rounded-xl border p-12 text-center" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
                <AlertTriangle size={28} className="mx-auto mb-3" style={{ color: "#334155" }} />
                <p className="text-sm" style={{ color: "#475569" }}>No alerts match the current filter.</p>
                <p className="text-xs mt-1" style={{ color: "#334155" }}>Start the agent to begin collecting events.</p>
              </div>
            ) : (
              <AlertTable decisions={filtered} onFeedback={handleFeedback} />
            )}
          </div>

          {/* Right sidebar — 1/3 */}
          <div className="space-y-5">
            <SeverityChart decisions={decisions} />
            <EndpointsPanel devices={devices} />
          </div>
        </div>
      </div>
    </div>
  );
}
