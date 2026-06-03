import { Brain, Zap, User } from "lucide-react";
import type { AlertDetail } from "@/app/alert/[id]/page";

const RULE_MAP: Record<string, string> = {
  FAILED_LOGIN:      "R001 — Multiple Failed Login Attempts",
  ACCOUNT_LOCKOUT:   "R001 — Multiple Failed Login Attempts",
  ADMIN_LOGIN:       "R003 — Successful Admin Login After Failures",
  POWERSHELL_EXEC:   "R007 — Suspicious PowerShell Execution",
  PROCESS_SUSPICIOUS:"R007 — Suspicious PowerShell Execution",
  UNKNOWN_SCRIPT:    "R007 — Suspicious PowerShell Execution",
  SUSPICIOUS_PORT:   "R002 — Brute Force / C2 Attempt",
  OUTBOUND_IP:       "R002 — Brute Force / C2 Attempt",
};

const PRIORITY_MAP: Record<string, string> = {
  CRITICAL: "P1 — Immediate Action",
  HIGH:     "P2 — Investigate Today",
  MEDIUM:   "P3 — Review Soon",
  LOW:      "P4 — Monitor",
};

export default function DecisionEnginePanel({ alert }: { alert: AlertDetail }) {
  const rule = RULE_MAP[alert.event_type] ?? "R009 — Repeated / Unknown Event";
  const priority = PRIORITY_MAP[alert.severity] ?? "P3 — Review Soon";

  const rows = [
    { label: "Decision", value: alert.severity === "CRITICAL" || alert.severity === "HIGH" ? "Escalate" : "Monitor", color: alert.severity === "CRITICAL" ? "#f87171" : "#fdba74" },
    { label: "Priority", value: priority, color: "#00d4ff" },
    { label: "Confidence", value: `${alert.confidence}%`, color: "#22c55e" },
    { label: "Rule Triggered", value: rule, color: "#a855f7" },
    { label: "Automation Status", value: "Human approval required", color: "#64748b" },
  ];

  return (
    <div className="rounded-xl border p-5" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
      <h3 className="font-bold text-sm mb-4 flex items-center gap-2">
        <Brain size={15} style={{ color: "var(--accent)" }} /> Decision Engine Output
      </h3>

      <div className="flex flex-col gap-2 mb-4">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center justify-between py-2 border-b"
            style={{ borderColor: "var(--border)" }}>
            <span className="text-xs" style={{ color: "#64748b" }}>{r.label}</span>
            <span className="text-xs font-semibold text-right max-w-[60%]" style={{ color: r.color }}>{r.value}</span>
          </div>
        ))}
      </div>

      {/* Confidence bar */}
      <div>
        <div className="flex justify-between text-xs mb-1.5" style={{ color: "#475569" }}>
          <span className="flex items-center gap-1"><Zap size={11} /> Confidence Score</span>
          <span style={{ color: "#00d4ff" }}>{alert.confidence}%</span>
        </div>
        <div className="h-2 rounded-full" style={{ background: "#1e293b" }}>
          <div className="h-2 rounded-full transition-all"
            style={{ width: `${alert.confidence}%`, background: "linear-gradient(90deg,#00d4ff,#22c55e)" }} />
        </div>
        <div className="flex justify-between text-xs mt-1" style={{ color: "#334155" }}>
          <span>Low</span><span>High</span>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2 px-3 py-2 rounded-lg"
        style={{ background: "rgba(100,116,139,0.08)", border: "1px solid rgba(100,116,139,0.15)" }}>
        <User size={13} style={{ color: "#64748b" }} />
        <span className="text-xs" style={{ color: "#64748b" }}>
          This decision requires operator approval before any action is taken.
        </span>
      </div>
    </div>
  );
}
