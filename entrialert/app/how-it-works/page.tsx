import AgentPipeline from "@/components/AgentPipeline";
import {
  CheckCircle, XCircle, AlertTriangle,
  BellRing, Settings, Search, Brain, Monitor, RefreshCw, ArrowRight,
} from "lucide-react";

const FLOW_NODES = [
  { icon: <BellRing size={20} />, label: "Alert", bg: "#ef444422", border: "#ef4444", color: "#ef4444" },
  { icon: <Settings size={20} />, label: "Normalize", bg: "#eab30822", border: "#eab308", color: "#eab308" },
  { icon: <Search size={20} />, label: "Context", bg: "#3b82f622", border: "#3b82f6", color: "#3b82f6" },
  { icon: <Brain size={20} />, label: "Decide", bg: "#00d4ff22", border: "#00d4ff", color: "#00d4ff" },
  { icon: <Monitor size={20} />, label: "Show", bg: "#a855f722", border: "#a855f7", color: "#a855f7" },
  { icon: <RefreshCw size={20} />, label: "Feedback", bg: "#22c55e22", border: "#22c55e", color: "#22c55e" },
];

const CARD_ROWS = [
  { icon: <Search size={14} />, label: "What happened", value: "Admin account logged in from 185.x.x.x at 2:14 AM" },
  { icon: <AlertTriangle size={14} />, label: "Why it matters", value: "IP has no prior history and matches threat intel feed" },
  { icon: <BellRing size={14} />, label: "Business impact", value: "Admin access to customer database — high sensitivity" },
  { icon: <CheckCircle size={14} />, label: "Recommended action", value: "Suspend session immediately, force re-authentication" },
];

export default function HowItWorksPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
      {/* Header */}
      <div className="text-center mb-16">
        <h1 className="text-4xl font-extrabold mb-4">How EntriAlert Works</h1>
        <p className="text-lg max-w-xl mx-auto" style={{ color: "#94a3b8" }}>
          Six specialised agents work in sequence — from raw alert to trusted decision.
          Hover any agent to explore its role.
        </p>
      </div>

      {/* Agent pipeline */}
      <AgentPipeline />

      {/* Flow diagram */}
      <div className="mt-20 mb-16">
        <h2 className="text-2xl font-bold text-center mb-10">The Full Flow</h2>
        <div className="flex flex-wrap justify-center items-center gap-1">
          {FLOW_NODES.map((node, i) => (
            <div key={node.label} className="flex items-center gap-1">
              <div
                className="flex flex-col items-center gap-2 px-4 py-3 rounded-xl border"
                style={{ background: node.bg, borderColor: node.border, minWidth: 76 }}
              >
                <span style={{ color: node.color }}>{node.icon}</span>
                <span className="text-xs font-semibold" style={{ color: "#94a3b8" }}>{node.label}</span>
              </div>
              {i < FLOW_NODES.length - 1 && (
                <ArrowRight size={16} style={{ color: "#334155" }} className="mx-1 shrink-0" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Decision card mockup */}
      <div className="mt-4">
        <h2 className="text-2xl font-bold text-center mb-8">What the Operator Sees</h2>
        <div
          className="rounded-2xl border p-6 max-w-2xl mx-auto"
          style={{
            background: "var(--card)",
            borderColor: "rgba(0,212,255,0.3)",
            boxShadow: "0 0 40px rgba(0,212,255,0.08)",
          }}
        >
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <span
                className="px-3 py-1 rounded-full text-xs font-bold"
                style={{ background: "rgba(239,68,68,0.15)", color: "#f87171" }}
              >
                HIGH SEVERITY
              </span>
              <span className="text-xs font-mono" style={{ color: "#475569" }}>
                #ALT-2847 · 2 min ago
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full" style={{ background: "#22c55e" }} />
              <span className="text-xs font-semibold" style={{ color: "#22c55e" }}>92% confidence</span>
            </div>
          </div>

          <h3 className="font-bold text-xl mb-5">Unusual admin login from unrecognised IP</h3>

          <div className="grid sm:grid-cols-2 gap-3 mb-6">
            {CARD_ROWS.map((item) => (
              <div
                key={item.label}
                className="rounded-lg p-3"
                style={{ background: "var(--background)", border: "1px solid var(--border)" }}
              >
                <div className="flex items-center gap-1.5 text-xs font-semibold mb-1" style={{ color: "var(--accent)" }}>
                  {item.icon} {item.label}
                </div>
                <div className="text-sm" style={{ color: "#e2e8f0" }}>{item.value}</div>
              </div>
            ))}
          </div>

          {/* Confidence bar */}
          <div className="mb-5">
            <div className="flex justify-between text-xs mb-1" style={{ color: "#64748b" }}>
              <span>Decision confidence</span>
              <span style={{ color: "#22c55e" }}>92%</span>
            </div>
            <div className="h-2 rounded-full" style={{ background: "#1e293b" }}>
              <div
                className="h-2 rounded-full"
                style={{
                  width: "92%",
                  background: "linear-gradient(90deg, #00d4ff, #22c55e)",
                  boxShadow: "0 0 8px rgba(34,197,94,0.4)",
                }}
              />
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap gap-3">
            <button
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all hover:opacity-90"
              style={{ background: "rgba(34,197,94,0.15)", color: "#4ade80", border: "1px solid rgba(34,197,94,0.3)" }}
            >
              <CheckCircle size={16} /> Approve Action
            </button>
            <button
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all hover:opacity-90"
              style={{ background: "rgba(239,68,68,0.15)", color: "#f87171", border: "1px solid rgba(239,68,68,0.3)" }}
            >
              <XCircle size={16} /> Reject
            </button>
            <button
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all hover:opacity-90"
              style={{ background: "rgba(251,191,36,0.15)", color: "#fbbf24", border: "1px solid rgba(251,191,36,0.3)" }}
            >
              <AlertTriangle size={16} /> Mark Incorrect
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
