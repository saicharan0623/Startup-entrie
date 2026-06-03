import { Monitor, User, Wifi, Clock, Hash } from "lucide-react";
import type { AlertDetail } from "@/app/alert/[id]/page";

type SevStyle = { bg: string; text: string; border: string; glow: string };

export default function AlertSummaryCard({
  alert, sev, formatDateTime,
}: {
  alert: AlertDetail;
  sev: SevStyle;
  formatDateTime: (s: string) => string;
}) {
  const fields = [
    { icon: <Hash size={13} />, label: "Rule / Alert", value: alert.title },
    { icon: <Monitor size={13} />, label: "Device", value: alert.device?.hostname ?? "—" },
    { icon: <User size={13} />, label: "User", value: alert.device?.user ?? "—" },
    { icon: <Wifi size={13} />, label: "Source IP", value: alert.device?.ip ?? "—" },
    { icon: <Clock size={13} />, label: "Detected", value: formatDateTime(alert.created_at) },
    {
      icon: null, label: "Status",
      value: alert.feedback
        ? alert.feedback === "approve" ? "Resolved"
          : alert.feedback === "reject" ? "Rejected"
          : "False Positive"
        : "Open",
      valueColor: alert.feedback ? "#22c55e" : "#ef4444",
    },
  ];

  return (
    <div
      className="rounded-xl border p-5"
      style={{ background: "var(--card)", borderColor: sev.border, boxShadow: `0 0 32px ${sev.glow}` }}
    >
      <div className="flex items-start justify-between gap-4 mb-5">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-1 rounded-lg text-xs font-extrabold tracking-wide"
              style={{ background: sev.bg, color: sev.text }}>{alert.severity}</span>
            <span className="text-xs font-mono" style={{ color: "#475569" }}>
              #{alert.id.slice(0, 8).toUpperCase()}
            </span>
          </div>
          <h1 className="text-xl font-bold leading-snug">{alert.title}</h1>
        </div>
        <div className="text-right shrink-0">
          <div className="text-2xl font-extrabold" style={{ color: "#00d4ff" }}>{alert.confidence}%</div>
          <div className="text-xs" style={{ color: "#475569" }}>confidence</div>
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-3">
        {fields.map((f) => (
          <div key={f.label} className="rounded-lg p-3"
            style={{ background: "var(--background)", border: "1px solid var(--border)" }}>
            <div className="flex items-center gap-1.5 text-xs font-semibold mb-1" style={{ color: "#64748b" }}>
              {f.icon} {f.label}
            </div>
            <div className="text-sm font-medium truncate" style={{ color: f.valueColor ?? "#e2e8f0" }}>
              {f.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
