"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, Shield, AlertTriangle, CheckCircle, XCircle,
  Flag, Download, Clock, Monitor, User, Wifi,
} from "lucide-react";
import Link from "next/link";
import { fetchDecision, submitFeedback } from "@/lib/api";
import AlertSummaryCard from "@/components/alert/AlertSummaryCard";
import DecisionEnginePanel from "@/components/alert/DecisionEnginePanel";
import ComplianceMapping from "@/components/alert/ComplianceMapping";
import EvidencePanel from "@/components/alert/EvidencePanel";

export type AlertDetail = {
  id: string;
  event_type: string;
  severity: string;
  title: string;
  what_happened: string;
  why_it_matters: string;
  business_impact: string;
  recommended_action: string;
  confidence: number;
  tags: string[];
  device?: { hostname: string; os: string; user: string; ip: string; mac: string };
  created_at: string;
  feedback?: string;
  feedback_note?: string;
};

const SEV: Record<string, { bg: string; text: string; border: string; glow: string }> = {
  CRITICAL: { bg: "rgba(220,38,38,0.12)", text: "#f87171", border: "rgba(220,38,38,0.4)", glow: "rgba(220,38,38,0.15)" },
  HIGH:     { bg: "rgba(239,68,68,0.10)", text: "#fca5a5", border: "rgba(239,68,68,0.3)",  glow: "rgba(239,68,68,0.1)" },
  MEDIUM:   { bg: "rgba(249,115,22,0.10)", text: "#fdba74", border: "rgba(249,115,22,0.3)", glow: "rgba(249,115,22,0.08)" },
  LOW:      { bg: "rgba(234,179,8,0.10)",  text: "#fde047", border: "rgba(234,179,8,0.3)",  glow: "rgba(234,179,8,0.08)" },
};

const FB_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  approve:   { bg: "rgba(34,197,94,0.12)",  color: "#4ade80", label: "Action Approved" },
  reject:    { bg: "rgba(239,68,68,0.12)",  color: "#f87171", label: "Rejected" },
  incorrect: { bg: "rgba(251,191,36,0.12)", color: "#fbbf24", label: "Marked as False Positive" },
};

function formatDateTime(iso: string) {
  try {
    return new Date(iso).toLocaleString([], {
      year: "numeric", month: "short", day: "2-digit",
      hour: "2-digit", minute: "2-digit", second: "2-digit",
    });
  } catch { return iso; }
}

export default function AlertDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [alert, setAlert] = useState<AlertDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchDecision(id)
      .then(setAlert)
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  const handleFeedback = async (action: string) => {
    if (!alert || submitting) return;
    setSubmitting(true);
    try {
      await submitFeedback(alert.id, action);
      setAlert((prev) => prev ? { ...prev, feedback: action } : prev);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--background)" }}>
      <div className="text-center">
        <Shield size={32} className="mx-auto mb-3 animate-pulse" style={{ color: "var(--accent)" }} />
        <p style={{ color: "#475569" }}>Loading alert details...</p>
      </div>
    </div>
  );

  if (notFound || !alert) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--background)" }}>
      <div className="text-center">
        <AlertTriangle size={32} className="mx-auto mb-3" style={{ color: "#ef4444" }} />
        <p className="font-semibold mb-2">Alert not found</p>
        <Link href="/dashboard" className="text-sm" style={{ color: "var(--accent)" }}>← Back to Dashboard</Link>
      </div>
    </div>
  );

  const sev = SEV[alert.severity] ?? SEV.LOW;
  const fb = alert.feedback ? FB_STYLES[alert.feedback] : null;

  return (
    <div className="min-h-screen" style={{ background: "var(--background)" }}>

      {/* ── Top bar ── */}
      <div
        className="sticky top-16 z-40 border-b px-4 sm:px-6 lg:px-8 py-3 flex items-center gap-3"
        style={{ background: "rgba(10,15,30,0.97)", borderColor: "var(--border)", backdropFilter: "blur(12px)" }}
      >
        <button onClick={() => router.back()}
          className="flex items-center gap-1.5 text-sm transition-colors hover:text-cyan-400"
          style={{ color: "#64748b" }}>
          <ArrowLeft size={16} /> Back to Dashboard
        </button>
        <span style={{ color: "#1e293b" }}>|</span>
        <span className="text-sm font-semibold truncate">{alert.title}</span>
        <span className="ml-auto px-2 py-0.5 rounded text-xs font-bold"
          style={{ background: sev.bg, color: sev.text }}>{alert.severity}</span>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

        {/* ── Alert Summary Card ── */}
        <AlertSummaryCard alert={alert} sev={sev} formatDateTime={formatDateTime} />

        {/* ── What Happened / Why / Impact / Action ── */}
        <div className="grid sm:grid-cols-2 gap-4">
          {[
            { label: "What Happened", value: alert.what_happened, color: "var(--accent)", icon: <AlertTriangle size={14} /> },
            { label: "Why It Matters", value: alert.why_it_matters, color: "#f97316", icon: <Shield size={14} /> },
            { label: "Business Impact", value: alert.business_impact, color: "#ef4444", icon: <AlertTriangle size={14} /> },
            { label: "Recommended Action", value: alert.recommended_action, color: "#22c55e", icon: <CheckCircle size={14} /> },
          ].map((item) => (
            <div key={item.label} className="rounded-xl p-5 border"
              style={{ background: "var(--card)", borderColor: "var(--border)" }}>
              <div className="flex items-center gap-2 text-xs font-bold mb-2" style={{ color: item.color }}>
                {item.icon} {item.label}
              </div>
              <p className="text-sm leading-relaxed" style={{ color: "#e2e8f0" }}>{item.value}</p>
            </div>
          ))}
        </div>

        {/* ── Decision Engine + Compliance side by side ── */}
        <div className="grid lg:grid-cols-2 gap-6">
          <DecisionEnginePanel alert={alert} />
          <ComplianceMapping alert={alert} />
        </div>

        {/* ── Evidence ── */}
        <EvidencePanel alert={alert} />

        {/* ── User Action Buttons ── */}
        <div className="rounded-xl border p-5" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
          <h3 className="font-bold text-sm mb-4 flex items-center gap-2">
            <User size={15} style={{ color: "var(--accent)" }} /> Operator Actions
          </h3>

          {fb ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold"
                style={{ background: fb.bg, color: fb.color }}>
                <CheckCircle size={15} /> {fb.label}
              </div>
              <span className="text-xs" style={{ color: "#475569" }}>
                Recorded in audit trail · {formatDateTime(alert.created_at)}
              </span>
            </div>
          ) : (
            <div className="flex flex-wrap gap-3">
              <button onClick={() => handleFeedback("approve")} disabled={submitting}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-50"
                style={{ background: "rgba(34,197,94,0.12)", color: "#4ade80", border: "1px solid rgba(34,197,94,0.3)" }}>
                <CheckCircle size={15} /> Approve Action
              </button>
              <button onClick={() => handleFeedback("reject")} disabled={submitting}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-50"
                style={{ background: "rgba(239,68,68,0.12)", color: "#f87171", border: "1px solid rgba(239,68,68,0.3)" }}>
                <XCircle size={15} /> Reject
              </button>
              <button onClick={() => handleFeedback("incorrect")} disabled={submitting}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-50"
                style={{ background: "rgba(251,191,36,0.12)", color: "#fbbf24", border: "1px solid rgba(251,191,36,0.3)" }}>
                <Flag size={15} /> Mark as False Positive
              </button>
              <button onClick={() => handleFeedback("approve")} disabled={submitting}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-50"
                style={{ background: "rgba(100,116,139,0.12)", color: "#94a3b8", border: "1px solid rgba(100,116,139,0.2)" }}>
                <Shield size={15} /> Resolve
              </button>
              <button
                className="ml-auto flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all hover:opacity-90"
                style={{ background: "rgba(0,212,255,0.1)", color: "var(--accent)", border: "1px solid rgba(0,212,255,0.2)" }}
                onClick={() => {
                  const content = `EntriAlert Evidence Report\n\nAlert: ${alert.title}\nSeverity: ${alert.severity}\nDevice: ${alert.device?.hostname ?? "—"}\nTime: ${formatDateTime(alert.created_at)}\n\nWhat Happened:\n${alert.what_happened}\n\nWhy It Matters:\n${alert.why_it_matters}\n\nBusiness Impact:\n${alert.business_impact}\n\nRecommended Action:\n${alert.recommended_action}\n\nConfidence: ${alert.confidence}%\nStatus: ${alert.feedback ?? "Open"}\n`;
                  const blob = new Blob([content], { type: "text/plain" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url; a.download = `entrialert-evidence-${alert.id.slice(0, 8)}.txt`;
                  a.click(); URL.revokeObjectURL(url);
                }}
              >
                <Download size={15} /> Export Evidence Report
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
