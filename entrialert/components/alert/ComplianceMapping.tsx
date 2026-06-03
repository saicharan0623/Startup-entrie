import { ClipboardList } from "lucide-react";
import type { AlertDetail } from "@/app/alert/[id]/page";

type ComplianceRow = {
  area: string;
  risk: string;
  evidence: string;
  status: string;
  statusColor: string;
  statusBg: string;
};

const COMPLIANCE_MAP: Record<string, ComplianceRow[]> = {
  FAILED_LOGIN: [
    { area: "Access Control", risk: "Unauthorized login attempt", evidence: "Windows failed login logs (Event ID 4625)", status: "Unresolved", statusColor: "#f87171", statusBg: "rgba(239,68,68,0.1)" },
    { area: "Identity Security", risk: "Account targeted by attacker", evidence: "Username and event logs", status: "Needs Review", statusColor: "#fbbf24", statusBg: "rgba(251,191,36,0.1)" },
    { area: "Incident Response", risk: "Potential brute force", evidence: "Decision record", status: "Pending", statusColor: "#94a3b8", statusBg: "rgba(100,116,139,0.1)" },
  ],
  ACCOUNT_LOCKOUT: [
    { area: "Access Control", risk: "Account locked after failures", evidence: "Event ID 4740 log", status: "Unresolved", statusColor: "#f87171", statusBg: "rgba(239,68,68,0.1)" },
    { area: "Identity Security", risk: "Possible credential attack", evidence: "Lockout event logs", status: "Needs Review", statusColor: "#fbbf24", statusBg: "rgba(251,191,36,0.1)" },
  ],
  ADMIN_LOGIN: [
    { area: "Privileged Access", risk: "Admin account used", evidence: "Event ID 4624 — logon type 2/10", status: "Needs Review", statusColor: "#fbbf24", statusBg: "rgba(251,191,36,0.1)" },
    { area: "Access Control", risk: "Elevated privilege login", evidence: "Admin login event log", status: "Pending", statusColor: "#94a3b8", statusBg: "rgba(100,116,139,0.1)" },
  ],
  POWERSHELL_EXEC: [
    { area: "Endpoint Protection", risk: "Script execution detected", evidence: "Process execution log", status: "Unresolved", statusColor: "#f87171", statusBg: "rgba(239,68,68,0.1)" },
    { area: "Incident Response", risk: "Possible malware execution", evidence: "PowerShell command log", status: "Pending", statusColor: "#94a3b8", statusBg: "rgba(100,116,139,0.1)" },
  ],
  SUSPICIOUS_PORT: [
    { area: "Network Security", risk: "Suspicious outbound connection", evidence: "Network connection log", status: "Unresolved", statusColor: "#f87171", statusBg: "rgba(239,68,68,0.1)" },
    { area: "Incident Response", risk: "Possible C2 channel", evidence: "Port and IP log", status: "Pending", statusColor: "#94a3b8", statusBg: "rgba(100,116,139,0.1)" },
  ],
};

const DEFAULT_ROWS: ComplianceRow[] = [
  { area: "Security Monitoring", risk: "Suspicious activity detected", evidence: "Agent event log", status: "Needs Review", statusColor: "#fbbf24", statusBg: "rgba(251,191,36,0.1)" },
  { area: "Incident Response", risk: "Event requires investigation", evidence: "Decision record", status: "Pending", statusColor: "#94a3b8", statusBg: "rgba(100,116,139,0.1)" },
];

export default function ComplianceMapping({ alert }: { alert: AlertDetail }) {
  const rows = COMPLIANCE_MAP[alert.event_type] ?? DEFAULT_ROWS;

  return (
    <div className="rounded-xl border p-5" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
      <h3 className="font-bold text-sm mb-1 flex items-center gap-2">
        <ClipboardList size={15} style={{ color: "var(--accent)" }} /> Compliance Mapping
      </h3>
      <p className="text-xs mb-4" style={{ color: "#475569" }}>
        Security control areas affected by this alert
      </p>

      <div className="flex flex-col gap-2">
        {rows.map((r, i) => (
          <div key={i} className="rounded-lg p-3 border"
            style={{ background: "var(--background)", borderColor: "var(--border)" }}>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold" style={{ color: "#e2e8f0" }}>{r.area}</span>
              <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                style={{ background: r.statusBg, color: r.statusColor }}>{r.status}</span>
            </div>
            <div className="text-xs mb-1" style={{ color: "#94a3b8" }}>{r.risk}</div>
            <div className="text-xs font-mono" style={{ color: "#475569" }}>{r.evidence}</div>
          </div>
        ))}
      </div>

      <div className="mt-3 px-3 py-2 rounded-lg text-xs"
        style={{ background: "rgba(0,212,255,0.05)", border: "1px solid rgba(0,212,255,0.1)", color: "#475569" }}>
        This is basic control mapping for internal review. It does not constitute formal compliance certification.
      </div>
    </div>
  );
}
