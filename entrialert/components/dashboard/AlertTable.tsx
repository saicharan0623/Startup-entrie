"use client";
import { useState } from "react";
import { ArrowRight, ChevronDown, ChevronUp, CheckCircle, XCircle, Flag, Tag } from "lucide-react";
import Link from "next/link";
import type { Decision } from "@/app/dashboard/page";

const SEV: Record<string, { bg: string; text: string; dot: string }> = {
  CRITICAL: { bg: "rgba(220,38,38,0.15)", text: "#f87171", dot: "#dc2626" },
  HIGH:     { bg: "rgba(239,68,68,0.12)", text: "#fca5a5", dot: "#ef4444" },
  MEDIUM:   { bg: "rgba(249,115,22,0.12)", text: "#fdba74", dot: "#f97316" },
  LOW:      { bg: "rgba(234,179,8,0.10)",  text: "#fde047", dot: "#eab308" },
};

const FB: Record<string, { bg: string; color: string; label: string }> = {
  approve:   { bg: "rgba(34,197,94,0.12)",  color: "#4ade80", label: "Approved" },
  reject:    { bg: "rgba(239,68,68,0.12)",  color: "#f87171", label: "Rejected" },
  incorrect: { bg: "rgba(251,191,36,0.12)", color: "#fbbf24", label: "False Positive" },
};

function statusLabel(d: Decision) {
  if (!d.feedback) return { label: "Open", color: "#ef4444", bg: "rgba(239,68,68,0.1)" };
  if (d.feedback === "approve") return { label: "Resolved", color: "#22c55e", bg: "rgba(34,197,94,0.1)" };
  if (d.feedback === "reject") return { label: "Rejected", color: "#64748b", bg: "rgba(100,116,139,0.1)" };
  return { label: "False Positive", color: "#fbbf24", bg: "rgba(251,191,36,0.1)" };
}

function timeStr(iso: string) {
  try {
    return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch { return "—"; }
}

function eventTypeLabel(t: string) {
  const map: Record<string, string> = {
    FAILED_LOGIN: "Login Security",
    ADMIN_LOGIN: "Privileged Access",
    ACCOUNT_LOCKOUT: "Login Security",
    POWERSHELL_EXEC: "Endpoint Security",
    PROCESS_SUSPICIOUS: "Endpoint Security",
    UNKNOWN_SCRIPT: "Endpoint Security",
    SUSPICIOUS_PORT: "Network Security",
    OUTBOUND_IP: "Network Security",
    DNS_REQUEST: "Network Security",
  };
  return map[t] ?? t;
}

function ExpandedRow({ d, onFeedback }: { d: Decision; onFeedback: (id: string, action: string) => void }) {
  const fb = d.feedback ? FB[d.feedback] : null;
  return (
    <tr style={{ background: "rgba(0,212,255,0.03)" }}>
      <td colSpan={8} className="px-4 pb-4 pt-2">
        <div className="grid sm:grid-cols-3 gap-3 mb-3">
          {[
            { label: "What Happened", value: d.what_happened },
            { label: "Why It Matters", value: d.why_it_matters },
            { label: "Business Impact", value: d.business_impact },
          ].map((item) => (
            <div key={item.label} className="rounded-lg p-3"
              style={{ background: "var(--background)", border: "1px solid var(--border)" }}>
              <div className="text-xs font-semibold mb-1" style={{ color: "var(--accent)" }}>{item.label}</div>
              <div className="text-xs leading-relaxed" style={{ color: "#94a3b8" }}>{item.value}</div>
            </div>
          ))}
        </div>

        <div className="rounded-lg p-3 mb-3"
          style={{ background: "var(--background)", border: "1px solid var(--border)" }}>
          <div className="text-xs font-semibold mb-1" style={{ color: "#22c55e" }}>Recommended Action</div>
          <div className="text-xs leading-relaxed" style={{ color: "#e2e8f0" }}>{d.recommended_action}</div>
        </div>

        {/* Confidence bar */}
        <div className="mb-3">
          <div className="flex justify-between text-xs mb-1" style={{ color: "#475569" }}>
            <span>Decision Confidence</span>
            <span style={{ color: "#00d4ff" }}>{d.confidence}%</span>
          </div>
          <div className="h-1.5 rounded-full" style={{ background: "#1e293b" }}>
            <div className="h-1.5 rounded-full"
              style={{ width: `${d.confidence}%`, background: "linear-gradient(90deg,#00d4ff,#22c55e)" }} />
          </div>
        </div>

        {/* Tags */}
        {d.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {d.tags.map((t) => (
              <span key={t} className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs"
                style={{ background: "rgba(0,212,255,0.08)", color: "#00d4ff", border: "1px solid rgba(0,212,255,0.2)" }}>
                <Tag size={9} /> {t}
              </span>
            ))}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex flex-wrap gap-2 items-center">
          {!d.feedback ? (
            <>
              <button onClick={() => onFeedback(d.id, "approve")}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
                style={{ background: "rgba(34,197,94,0.12)", color: "#4ade80", border: "1px solid rgba(34,197,94,0.25)" }}>
                <CheckCircle size={12} /> Approve Action
              </button>
              <button onClick={() => onFeedback(d.id, "reject")}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
                style={{ background: "rgba(239,68,68,0.12)", color: "#f87171", border: "1px solid rgba(239,68,68,0.25)" }}>
                <XCircle size={12} /> Reject
              </button>
              <button onClick={() => onFeedback(d.id, "incorrect")}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
                style={{ background: "rgba(251,191,36,0.12)", color: "#fbbf24", border: "1px solid rgba(251,191,36,0.25)" }}>
                <Flag size={12} /> Mark as False Positive
              </button>
            </>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
              style={{ background: fb?.bg, color: fb?.color }}>
              <CheckCircle size={12} /> {fb?.label}
            </span>
          )}
          <Link href={`/alert/${d.id}`}
            className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
            style={{ background: "rgba(0,212,255,0.1)", color: "var(--accent)", border: "1px solid rgba(0,212,255,0.2)" }}>
            Full Investigation <ArrowRight size={12} />
          </Link>
        </div>
      </td>
    </tr>
  );
}

export default function AlertTable({
  decisions,
  onFeedback,
}: {
  decisions: Decision[];
  onFeedback: (id: string, action: string) => void;
}) {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div className="rounded-xl border overflow-hidden" style={{ borderColor: "var(--border)" }}>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr style={{ background: "var(--card)", borderBottom: "1px solid var(--border)" }}>
              {["Severity", "Date / Time", "Rule Name", "Device", "User / IP", "Type", "Status", "Action"].map((h) => (
                <th key={h} className="px-3 py-3 text-left font-semibold whitespace-nowrap"
                  style={{ color: "#64748b" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {decisions.map((d, i) => {
              const sev = SEV[d.severity] ?? SEV.LOW;
              const st = statusLabel(d);
              const isOpen = expanded === d.id;
              return (
                <>
                  <tr
                    key={d.id}
                    className="cursor-pointer transition-colors"
                    style={{
                      background: isOpen ? "rgba(0,212,255,0.04)" : i % 2 === 0 ? "var(--background)" : "var(--card)",
                      borderTop: "1px solid var(--border)",
                    }}
                    onClick={() => setExpanded(isOpen ? null : d.id)}
                  >
                    {/* Severity */}
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: sev.dot }} />
                        <span className="px-1.5 py-0.5 rounded font-bold"
                          style={{ background: sev.bg, color: sev.text }}>{d.severity}</span>
                      </div>
                    </td>
                    {/* Time */}
                    <td className="px-3 py-2.5 font-mono whitespace-nowrap" style={{ color: "#64748b" }}>
                      {timeStr(d.created_at)}
                    </td>
                    {/* Rule */}
                    <td className="px-3 py-2.5 font-medium max-w-[180px]" style={{ color: "#e2e8f0" }}>
                      <div className="truncate">{d.title}</div>
                    </td>
                    {/* Device */}
                    <td className="px-3 py-2.5 whitespace-nowrap" style={{ color: "#94a3b8" }}>
                      {d.device?.hostname ?? "—"}
                    </td>
                    {/* User / IP */}
                    <td className="px-3 py-2.5 font-mono whitespace-nowrap" style={{ color: "#64748b" }}>
                      {d.device?.user ?? d.device?.ip ?? "—"}
                    </td>
                    {/* Type */}
                    <td className="px-3 py-2.5 whitespace-nowrap" style={{ color: "#64748b" }}>
                      {eventTypeLabel(d.event_type)}
                    </td>
                    {/* Status */}
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium"
                        style={{ background: st.bg, color: st.color }}>{st.label}</span>
                    </td>
                    {/* Action */}
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      <button
                        className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg transition-all"
                        style={{ background: "rgba(0,212,255,0.08)", color: "var(--accent)", border: "1px solid rgba(0,212,255,0.15)" }}
                        onClick={(e) => { e.stopPropagation(); setExpanded(isOpen ? null : d.id); }}
                      >
                        {isOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                        {isOpen ? "Close" : "Investigate"}
                      </button>
                    </td>
                  </tr>
                  {isOpen && <ExpandedRow key={`exp-${d.id}`} d={d} onFeedback={onFeedback} />}
                </>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
