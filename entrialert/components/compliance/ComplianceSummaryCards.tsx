import { FileText, AlertTriangle, ShieldAlert, CheckCircle } from "lucide-react";
import type { ComplianceData } from "@/app/compliance/page";

export default function ComplianceSummaryCards({ data }: { data: ComplianceData | null }) {
  const cards = [
    {
      icon: <FileText size={18} />,
      label: "Total Evidence Items",
      value: data?.total ?? 0,
      color: "#00d4ff",
      desc: "All mapped security events",
    },
    {
      icon: <AlertTriangle size={18} />,
      label: "Unresolved Risks",
      value: data?.unresolved ?? 0,
      color: "#f97316",
      desc: "Require operator attention",
    },
    {
      icon: <ShieldAlert size={18} />,
      label: "Critical Control Gaps",
      value: data?.critical_gaps ?? 0,
      color: "#dc2626",
      desc: "High-priority unresolved items",
      pulse: (data?.critical_gaps ?? 0) > 0,
    },
    {
      icon: <CheckCircle size={18} />,
      label: "Resolved Items",
      value: data?.resolved ?? 0,
      color: "#22c55e",
      desc: "Approved by operator",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((c) => (
        <div key={c.label} className="rounded-xl border p-4"
          style={{ background: "var(--card)", borderColor: "var(--border)" }}>
          <div className="flex items-center justify-between mb-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center"
              style={{ background: c.color + "18", color: c.color }}>
              {c.icon}
            </div>
            {c.pulse && (
              <span className="w-2.5 h-2.5 rounded-full animate-pulse" style={{ background: "#dc2626" }} />
            )}
          </div>
          <div className="text-3xl font-extrabold mb-1" style={{ color: c.color }}>
            {c.value.toLocaleString()}
          </div>
          <div className="text-xs font-semibold" style={{ color: "#94a3b8" }}>{c.label}</div>
          <div className="text-xs mt-0.5" style={{ color: "#334155" }}>{c.desc}</div>
        </div>
      ))}
    </div>
  );
}
