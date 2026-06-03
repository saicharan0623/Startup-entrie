import { FileText, Hash, User, Monitor, Wifi, Clock, Tag } from "lucide-react";
import type { AlertDetail } from "@/app/alert/[id]/page";

const EVENT_ID_MAP: Record<string, string> = {
  FAILED_LOGIN:       "4625 — An account failed to log on",
  ADMIN_LOGIN:        "4624 — An account was successfully logged on",
  ACCOUNT_LOCKOUT:    "4740 — A user account was locked out",
  POWERSHELL_EXEC:    "4688 — A new process has been created",
  PROCESS_SUSPICIOUS: "4688 — A new process has been created",
  UNKNOWN_SCRIPT:     "4688 — A new process has been created",
  SUSPICIOUS_PORT:    "5156 — Windows Filtering Platform permitted a connection",
  OUTBOUND_IP:        "5156 — Windows Filtering Platform permitted a connection",
};

export default function EvidencePanel({ alert }: { alert: AlertDetail }) {
  const eventId = EVENT_ID_MAP[alert.event_type] ?? "N/A";

  const rows = [
    { icon: <Hash size={13} />, label: "Event ID", value: eventId },
    { icon: <User size={13} />, label: "User Account", value: alert.device?.user ?? "—" },
    { icon: <Wifi size={13} />, label: "Source IP", value: alert.device?.ip ?? "—" },
    { icon: <Monitor size={13} />, label: "Device", value: alert.device ? `${alert.device.hostname} (${alert.device.os})` : "—" },
    { icon: <Tag size={13} />, label: "MAC Address", value: alert.device?.mac ?? "—" },
    { icon: <Clock size={13} />, label: "Timestamp", value: alert.created_at },
    { icon: <FileText size={13} />, label: "Alert ID", value: alert.id },
    { icon: <Tag size={13} />, label: "Event Type", value: alert.event_type },
    { icon: <Tag size={13} />, label: "Tags", value: alert.tags?.join(", ") || "—" },
  ];

  return (
    <div className="rounded-xl border p-5" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
      <h3 className="font-bold text-sm mb-1 flex items-center gap-2">
        <FileText size={15} style={{ color: "var(--accent)" }} /> Evidence Collected
      </h3>
      <p className="text-xs mb-4" style={{ color: "#475569" }}>
        Technical proof collected from Windows logs — for audit, investigation, and reporting
      </p>

      <div className="rounded-lg overflow-hidden border" style={{ borderColor: "var(--border)" }}>
        <table className="w-full text-xs">
          <thead>
            <tr style={{ background: "#111827" }}>
              <th className="px-4 py-2.5 text-left font-semibold w-1/3" style={{ color: "#64748b" }}>Field</th>
              <th className="px-4 py-2.5 text-left font-semibold" style={{ color: "#64748b" }}>Value</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.label} style={{
                borderTop: "1px solid var(--border)",
                background: i % 2 === 0 ? "var(--background)" : "var(--card)",
              }}>
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-1.5 font-semibold" style={{ color: "#64748b" }}>
                    {r.icon} {r.label}
                  </div>
                </td>
                <td className="px-4 py-2.5 font-mono break-all" style={{ color: "#e2e8f0" }}>
                  {r.value}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-lg"
        style={{ background: "rgba(34,197,94,0.05)", border: "1px solid rgba(34,197,94,0.15)" }}>
        <FileText size={12} style={{ color: "#22c55e" }} />
        <span className="text-xs" style={{ color: "#475569" }}>
          Evidence is collected automatically by the Windows agent and stored in the EntriAlert backend.
        </span>
      </div>
    </div>
  );
}
