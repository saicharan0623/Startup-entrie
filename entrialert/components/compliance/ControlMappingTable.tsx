"use client";
import Link from "next/link";
import { ArrowRight, FileText } from "lucide-react";
import type { ComplianceItem } from "@/app/compliance/page";

const STATUS_STYLES: Record<string, { color: string; bg: string }> = {
  Critical:      { color: "#f87171", bg: "rgba(220,38,38,0.12)" },
  Unresolved:    { color: "#fdba74", bg: "rgba(249,115,22,0.12)" },
  "Needs Review":{ color: "#fbbf24", bg: "rgba(251,191,36,0.12)" },
  Rejected:      { color: "#64748b", bg: "rgba(100,116,139,0.1)" },
  Resolved:      { color: "#4ade80", bg: "rgba(34,197,94,0.12)" },
};

const SEV_DOT: Record<string, string> = {
  CRITICAL: "#dc2626",
  HIGH:     "#ef4444",
  MEDIUM:   "#f97316",
  LOW:      "#eab308",
};

function formatTime(iso: string) {
  try { return new Date(iso).toLocaleString([], { month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit" }); }
  catch { return "—"; }
}

export default function ControlMappingTable({ items }: { items: ComplianceItem[] }) {
  if (items.length === 0) {
    return (
      <div className="rounded-xl border p-12 text-center"
        style={{ background: "var(--card)", borderColor: "var(--border)" }}>
        <FileText size={28} className="mx-auto mb-3" style={{ color: "#334155" }} />
        <p className="text-sm" style={{ color: "#475569" }}>No compliance items match the current filter.</p>
        <p className="text-xs mt-1" style={{ color: "#334155" }}>Start the agent to collect security events.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border overflow-hidden" style={{ borderColor: "var(--border)" }}>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr style={{ background: "var(--card)", borderBottom: "1px solid var(--border)" }}>
              {["Event", "Device", "Control Area", "Evidence", "Risk Status", "Action"].map((h) => (
                <th key={h} className="px-4 py-3 text-left font-semibold whitespace-nowrap"
                  style={{ color: "#64748b" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((item, i) => {
              const st = STATUS_STYLES[item.risk_status] ?? STATUS_STYLES["Unresolved"];
              const dot = SEV_DOT[item.severity] ?? "#64748b";
              return (
                <tr key={item.id ?? i}
                  style={{
                    borderTop: "1px solid var(--border)",
                    background: i % 2 === 0 ? "var(--background)" : "var(--card)",
                  }}>
                  {/* Event */}
                  <td className="px-4 py-3 max-w-[200px]">
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: dot }} />
                      <span className="truncate font-medium" style={{ color: "#e2e8f0" }}>{item.event}</span>
                    </div>
                    <div className="text-xs mt-0.5 ml-3.5" style={{ color: "#334155" }}>
                      {formatTime(item.created_at)}
                    </div>
                  </td>
                  {/* Device */}
                  <td className="px-4 py-3 whitespace-nowrap font-mono" style={{ color: "#94a3b8" }}>
                    {item.device}
                  </td>
                  {/* Control Area */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="px-2 py-1 rounded-lg text-xs font-semibold"
                      style={{ background: "rgba(0,212,255,0.08)", color: "var(--accent)", border: "1px solid rgba(0,212,255,0.15)" }}>
                      {item.control_area}
                    </span>
                  </td>
                  {/* Evidence */}
                  <td className="px-4 py-3 max-w-[180px]">
                    <span className="text-xs font-mono" style={{ color: "#64748b" }}>{item.evidence}</span>
                  </td>
                  {/* Risk Status */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold"
                      style={{ background: st.bg, color: st.color }}>
                      {item.risk_status}
                    </span>
                  </td>
                  {/* Action */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    {item.id ? (
                      <Link href={`/alert/${item.id}`}
                        className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg transition-all hover:opacity-80"
                        style={{ background: "rgba(0,212,255,0.08)", color: "var(--accent)", border: "1px solid rgba(0,212,255,0.15)" }}>
                        View <ArrowRight size={11} />
                      </Link>
                    ) : (
                      <span className="text-xs" style={{ color: "#334155" }}>—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
