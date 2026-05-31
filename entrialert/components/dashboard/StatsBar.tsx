import { Activity, CheckCircle, XCircle, Flag, Zap } from "lucide-react";
import type { Stats } from "@/app/dashboard/page";

export default function StatsBar({ stats }: { stats: Stats }) {
  const items = [
    { icon: <Activity size={18} />, label: "Total Events", value: stats.total_events, color: "#00d4ff" },
    { icon: <Zap size={18} />, label: "Decisions Made", value: stats.total_decisions, color: "#a855f7" },
    { icon: <CheckCircle size={18} />, label: "Approved", value: stats.approved, color: "#22c55e" },
    { icon: <XCircle size={18} />, label: "Rejected", value: stats.rejected, color: "#f87171" },
    { icon: <Flag size={18} />, label: "Flagged", value: stats.incorrect, color: "#fbbf24" },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-xl p-4 border flex items-center gap-3"
          style={{ background: "var(--card)", borderColor: "var(--border)" }}
        >
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: item.color + "18", color: item.color }}
          >
            {item.icon}
          </div>
          <div>
            <div className="text-xl font-extrabold leading-none" style={{ color: item.color }}>
              {item.value.toLocaleString()}
            </div>
            <div className="text-xs mt-0.5" style={{ color: "#475569" }}>{item.label}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
