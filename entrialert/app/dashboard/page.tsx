"use client";
import { useEffect, useState, useCallback } from "react";
import {
  Shield, Activity, Monitor, Wifi, AlertTriangle,
  CheckCircle, XCircle, Flag, RefreshCw, Server,
} from "lucide-react";
import { useWebSocket } from "@/hooks/useWebSocket";
import { fetchDecisions, fetchStats, fetchDevices, submitFeedback } from "@/lib/api";
import DecisionCard from "@/components/dashboard/DecisionCard";
import StatsBar from "@/components/dashboard/StatsBar";
import DeviceList from "@/components/dashboard/DeviceList";
import SeverityChart from "@/components/dashboard/SeverityChart";

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
};

export type Stats = {
  total_events: number;
  total_decisions: number;
  approved: number;
  rejected: number;
  incorrect: number;
};

const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:8000/ws";
const SEVERITY_ORDER = ["CRITICAL", "HIGH", "MEDIUM", "LOW"];

export default function DashboardPage() {
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [devices, setDevices] = useState<unknown[]>([]);
  const [filter, setFilter] = useState<string>("ALL");
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);

  // Initial data load
  const loadData = useCallback(async () => {
    try {
      const [d, s, dev] = await Promise.all([fetchDecisions(100), fetchStats(), fetchDevices()]);
      setDecisions(d.decisions ?? []);
      setStats(s);
      setDevices(dev.devices ?? []);
    } catch {
      // backend not yet running — show empty state
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // WebSocket — live updates
  useWebSocket(WS_URL, (msg: unknown) => {
    const message = msg as { type: string; data?: Decision; decision_id?: string; action?: string };
    setConnected(true);
    if (message.type === "decision" && message.data) {
      setDecisions((prev) => [message.data!, ...prev].slice(0, 200));
      setStats((prev) => prev ? { ...prev, total_decisions: prev.total_decisions + 1 } : prev);
    }
    if (message.type === "feedback" && message.decision_id) {
      setDecisions((prev) =>
        prev.map((d) => d.id === message.decision_id ? { ...d, feedback: message.action } : d)
      );
    }
  });

  const handleFeedback = async (id: string, action: string) => {
    await submitFeedback(id, action);
    setDecisions((prev) => prev.map((d) => d.id === id ? { ...d, feedback: action } : d));
    setStats((prev) => {
      if (!prev) return prev;
      return { ...prev, [action]: (prev[action as keyof Stats] as number) + 1 };
    });
  };

  const filtered = filter === "ALL"
    ? decisions
    : decisions.filter((d) => d.severity === filter);

  const sorted = [...filtered].sort(
    (a, b) => SEVERITY_ORDER.indexOf(a.severity) - SEVERITY_ORDER.indexOf(b.severity)
  );

  return (
    <div className="min-h-screen" style={{ background: "var(--background)" }}>
      {/* Top bar */}
      <div
        className="sticky top-16 z-40 border-b px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between"
        style={{ background: "rgba(10,15,30,0.97)", borderColor: "var(--border)", backdropFilter: "blur(12px)" }}
      >
        <div className="flex items-center gap-3">
          <Shield size={20} style={{ color: "var(--accent)" }} />
          <span className="font-bold text-base">Live Dashboard</span>
          <span
            className="flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full"
            style={{
              background: connected ? "rgba(34,197,94,0.1)" : "rgba(100,116,139,0.1)",
              color: connected ? "#22c55e" : "#64748b",
              border: `1px solid ${connected ? "rgba(34,197,94,0.3)" : "rgba(100,116,139,0.2)"}`,
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: connected ? "#22c55e" : "#64748b", animation: connected ? "pulse 2s infinite" : "none" }}
            />
            {connected ? "LIVE" : "CONNECTING"}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Severity filter */}
          <div className="flex gap-1">
            {["ALL", "CRITICAL", "HIGH", "MEDIUM", "LOW"].map((s) => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className="px-2.5 py-1 rounded text-xs font-semibold transition-all"
                style={{
                  background: filter === s ? "var(--accent)" : "var(--card)",
                  color: filter === s ? "#0a0f1e" : "#64748b",
                  border: `1px solid ${filter === s ? "var(--accent)" : "var(--border)"}`,
                }}
              >
                {s}
              </button>
            ))}
          </div>
          <button
            onClick={loadData}
            className="p-1.5 rounded border transition-all hover:border-cyan-400"
            style={{ borderColor: "var(--border)", color: "#64748b" }}
            title="Refresh"
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Stats bar */}
        {stats && <StatsBar stats={stats} />}

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Decisions feed — 2/3 width */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-lg flex items-center gap-2">
                <Activity size={18} style={{ color: "var(--accent)" }} />
                Decisions
                <span
                  className="text-xs px-2 py-0.5 rounded-full font-normal"
                  style={{ background: "var(--card)", color: "#64748b", border: "1px solid var(--border)" }}
                >
                  {sorted.length}
                </span>
              </h2>
            </div>

            {loading && (
              <div className="text-center py-16" style={{ color: "#475569" }}>
                <RefreshCw size={24} className="animate-spin mx-auto mb-3" />
                Connecting to backend...
              </div>
            )}

            {!loading && sorted.length === 0 && (
              <div
                className="rounded-xl border p-10 text-center"
                style={{ background: "var(--card)", borderColor: "var(--border)" }}
              >
                <Shield size={32} className="mx-auto mb-3" style={{ color: "#334155" }} />
                <p style={{ color: "#475569" }}>No decisions yet. Start the agent to begin collecting events.</p>
              </div>
            )}

            {sorted.map((d) => (
              <DecisionCard key={d.id} decision={d} onFeedback={handleFeedback} />
            ))}
          </div>

          {/* Right sidebar — 1/3 width */}
          <div className="space-y-5">
            <SeverityChart decisions={decisions} />
            <DeviceList devices={devices} />
          </div>
        </div>
      </div>
    </div>
  );
}
