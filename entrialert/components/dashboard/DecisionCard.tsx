"use client";
import { useState } from "react";
import { CheckCircle, XCircle, Flag, ChevronDown, ChevronUp, Tag } from "lucide-react";
import type { Decision } from "@/app/dashboard/page";

const SEVERITY_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  CRITICAL: { bg: "rgba(220,38,38,0.12)", text: "#f87171", border: "rgba(220,38,38,0.4)" },
  HIGH:     { bg: "rgba(239,68,68,0.10)", text: "#fca5a5", border: "rgba(239,68,68,0.3)" },
  MEDIUM:   { bg: "rgba(249,115,22,0.10)", text: "#fdba74", border: "rgba(249,115,22,0.3)" },
  LOW:      { bg: "rgba(234,179,8,0.10)", text: "#fde047", border: "rgba(234,179,8,0.3)" },
};

const FEEDBACK_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  approve:   { bg: "rgba(34,197,94,0.12)", color: "#4ade80", label: "Approved" },
  reject:    { bg: "rgba(239,68,68,0.12)", color: "#f87171", label: "Rejected" },
  incorrect: { bg: "rgba(251,191,36,0.12)", color: "#fbbf24", label: "Marked Incorrect" },
};

export default function DecisionCard({
  decision,
  onFeedback,
}: {
  decision: Decision;
  onFeedback: (id: string, action: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const sev = SEVERITY_STYLES[decision.severity] ?? SEVERITY_STYLES.LOW;
  const fb = decision.feedback ? FEEDBACK_STYLES[decision.feedback] : null;

  const timeAgo = (() => {
    const diff = Date.now() - new Date(decision.created_at).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return "just now";
    if (m < 60) return `${m}m ago`;
    return `${Math.floor(m / 60)}h ago`;
  })();

  return (
    <div
      className="rounded-xl border transition-all duration-200"
      style={{
        background: "var(--card)",
        borderColor: fb ? "transparent" : sev.border,
        boxShadow: fb ? "none" : `0 0 0 1px ${sev.border}`,
        outline: fb ? `1px solid ${fb.color}44` : "none",
      }}
    >
      {/* Header */}
      <div className="p-4 flex items-start gap-3">
        <div className="flex flex-col items-center gap-1 shrink-0 mt-0.5">
          <span
            className="px-2 py-0.5 rounded text-xs font-bold"
            style={{ background: sev.bg, color: sev.text }}
          >
            {decision.severity}
          </span>
          <span className="text-xs" style={{ color: "#475569" }}>{timeAgo}</span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm mb-1 leading-snug">{decision.title}</div>
          <div className="text-xs truncate" style={{ color: "#64748b" }}>{decision.what_happened}</div>
          {decision.device && (
            <div className="text-xs mt-1" style={{ color: "#334155" }}>
              {decision.device.hostname} · {decision.device.ip}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Confidence */}
          <div className="text-right">
            <div className="text-xs font-bold" style={{ color: "#00d4ff" }}>{decision.confidence}%</div>
            <div className="text-xs" style={{ color: "#334155" }}>conf.</div>
          </div>
          <button
            onClick={() => setExpanded((v) => !v)}
            className="p-1 rounded transition-colors hover:bg-slate-800"
            style={{ color: "#475569" }}
          >
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="px-4 pb-4 border-t" style={{ borderColor: "var(--border)" }}>
          <div className="grid sm:grid-cols-2 gap-3 mt-4 mb-4">
            {[
              { label: "Why it matters", value: decision.why_it_matters },
              { label: "Business impact", value: decision.business_impact },
              { label: "Recommended action", value: decision.recommended_action, full: true },
            ].map((item) => (
              <div
                key={item.label}
                className={`rounded-lg p-3 ${item.full ? "sm:col-span-2" : ""}`}
                style={{ background: "var(--background)", border: "1px solid var(--border)" }}
              >
                <div className="text-xs font-semibold mb-1" style={{ color: "var(--accent)" }}>{item.label}</div>
                <div className="text-xs leading-relaxed" style={{ color: "#e2e8f0" }}>{item.value}</div>
              </div>
            ))}
          </div>

          {/* Confidence bar */}
          <div className="mb-4">
            <div className="h-1.5 rounded-full" style={{ background: "#1e293b" }}>
              <div
                className="h-1.5 rounded-full transition-all"
                style={{
                  width: `${decision.confidence}%`,
                  background: "linear-gradient(90deg, #00d4ff, #22c55e)",
                }}
              />
            </div>
          </div>

          {/* Tags */}
          {decision.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-4">
              {decision.tags.map((t) => (
                <span
                  key={t}
                  className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs"
                  style={{ background: "rgba(0,212,255,0.08)", color: "#00d4ff", border: "1px solid rgba(0,212,255,0.2)" }}
                >
                  <Tag size={10} /> {t}
                </span>
              ))}
            </div>
          )}

          {/* Feedback buttons */}
          {!decision.feedback ? (
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => onFeedback(decision.id, "approve")}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:opacity-90"
                style={{ background: "rgba(34,197,94,0.12)", color: "#4ade80", border: "1px solid rgba(34,197,94,0.25)" }}
              >
                <CheckCircle size={13} /> Approve
              </button>
              <button
                onClick={() => onFeedback(decision.id, "reject")}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:opacity-90"
                style={{ background: "rgba(239,68,68,0.12)", color: "#f87171", border: "1px solid rgba(239,68,68,0.25)" }}
              >
                <XCircle size={13} /> Reject
              </button>
              <button
                onClick={() => onFeedback(decision.id, "incorrect")}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:opacity-90"
                style={{ background: "rgba(251,191,36,0.12)", color: "#fbbf24", border: "1px solid rgba(251,191,36,0.25)" }}
              >
                <Flag size={13} /> Mark Incorrect
              </button>
            </div>
          ) : (
            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold"
              style={{ background: fb?.bg, color: fb?.color }}
            >
              <CheckCircle size={13} /> {fb?.label}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
