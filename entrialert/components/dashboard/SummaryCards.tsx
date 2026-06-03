import { Activity, AlertTriangle, Zap, Shield, Monitor } from "lucide-react";

type Counts = {
  total: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  open: number;
  online: number;
};

const CARDS = [
  { key: "total",    label: "Total Events",      color: "#00d4ff", icon: <Activity size={16} /> },
  { key: "critical", label: "Critical Alerts",   color: "#dc2626", icon: <AlertTriangle size={16} /> },
  { key: "high",     label: "High Alerts",       color: "#ef4444", icon: <AlertTriangle size={16} /> },
  { key: "medium",   label: "Medium Alerts",     color: "#f97316", icon: <Zap size={16} /> },
  { key: "low",      label: "Low Alerts",        color: "#eab308", icon: <Zap size={16} /> },
  { key: "open",     label: "Open Decisions",    color: "#a855f7", icon: <Shield size={16} /> },
  { key: "online",   label: "Online Endpoints",  color: "#22c55e", icon: <Monitor size={16} /> },
];

export default function SummaryCards({ counts }: { counts: Counts }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
      {CARDS.map((c) => {
        const value = counts[c.key as keyof Counts];
        return (
          <div
            key={c.key}
            className="rounded-xl p-3 border flex flex-col gap-2"
            style={{ background: "var(--card)", borderColor: "var(--border)" }}
          >
            <div className="flex items-center justify-between">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background: c.color + "18", color: c.color }}>
                {c.icon}
              </div>
              {c.key === "critical" && value > 0 && (
                <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: "#dc2626" }} />
              )}
            </div>
            <div>
              <div className="text-2xl font-extrabold leading-none" style={{ color: c.color }}>
                {value.toLocaleString()}
              </div>
              <div className="text-xs mt-1 leading-tight" style={{ color: "#475569" }}>{c.label}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
