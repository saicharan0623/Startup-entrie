"use client";
import { useEffect, useState, useCallback } from "react";
import {
  ClipboardList, AlertTriangle, CheckCircle,
  ShieldAlert, RefreshCw, Download, ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { fetchCompliance } from "@/lib/api";
import ComplianceSummaryCards from "@/components/compliance/ComplianceSummaryCards";
import ControlMappingTable from "@/components/compliance/ControlMappingTable";

export type ComplianceItem = {
  id: string;
  event: string;
  device: string;
  control_area: string;
  evidence: string;
  risk_status: string;
  severity: string;
  created_at: string;
};

export type ComplianceData = {
  total: number;
  unresolved: number;
  critical_gaps: number;
  resolved: number;
  items: ComplianceItem[];
};

const STATUS_FILTERS = ["ALL", "Critical", "Unresolved", "Needs Review", "Resolved"];

export default function CompliancePage() {
  const [data, setData] = useState<ComplianceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");
  const [areaFilter, setAreaFilter] = useState("ALL");
  const [generating, setGenerating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const d = await fetchCompliance();
      setData(d);
    } catch {
      // backend offline
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Unique control areas for filter
  const areas = data
    ? ["ALL", ...Array.from(new Set(data.items.map((i) => i.control_area)))]
    : ["ALL"];

  const filtered = (data?.items ?? []).filter((item) => {
    const statusMatch = filter === "ALL" || item.risk_status === filter;
    const areaMatch = areaFilter === "ALL" || item.control_area === areaFilter;
    return statusMatch && areaMatch;
  });

  const handleGenerateReport = () => {
    if (!data) return;
    setGenerating(true);
    const lines = [
      "EntriAlert — Compliance Evidence Report",
      `Generated: ${new Date().toLocaleString()}`,
      `Organisation: EntriAlert Beta`,
      "",
      "SUMMARY",
      `Total Evidence Items : ${data.total}`,
      `Unresolved Risks     : ${data.unresolved}`,
      `Critical Gaps        : ${data.critical_gaps}`,
      `Resolved Items       : ${data.resolved}`,
      "",
      "CONTROL MAPPING",
      "-".repeat(80),
      ["Event", "Device", "Control Area", "Evidence", "Status"].join(" | "),
      "-".repeat(80),
      ...filtered.map((i) =>
        [i.event.slice(0, 30).padEnd(30), i.device.padEnd(12), i.control_area.padEnd(22), i.evidence.slice(0, 30).padEnd(30), i.risk_status].join(" | ")
      ),
      "",
      "NOTE: This report is for internal review only. It does not constitute formal compliance certification.",
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `entrialert-compliance-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    setTimeout(() => setGenerating(false), 800);
  };

  return (
    <div className="min-h-screen" style={{ background: "var(--background)" }}>

      {/* ── Top bar ── */}
      <div
        className="sticky top-16 z-40 border-b px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center gap-3 justify-between"
        style={{ background: "rgba(10,15,30,0.97)", borderColor: "var(--border)", backdropFilter: "blur(12px)" }}
      >
        <div className="flex items-center gap-3">
          <ClipboardList size={18} style={{ color: "var(--accent)" }} />
          <span className="font-bold text-sm">Compliance Evidence</span>
          <span className="text-xs px-2 py-0.5 rounded-full"
            style={{ background: "rgba(0,212,255,0.08)", color: "var(--accent)", border: "1px solid rgba(0,212,255,0.2)" }}>
            Beta — Internal Review Only
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load}
            className="p-1.5 rounded border transition-all hover:border-cyan-400"
            style={{ borderColor: "var(--border)", color: "#64748b" }} title="Refresh">
            <RefreshCw size={14} />
          </button>
          <button onClick={handleGenerateReport} disabled={generating || !data}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:opacity-90 disabled:opacity-50"
            style={{ background: "var(--accent)", color: "#0a0f1e" }}>
            <Download size={13} />
            {generating ? "Generating..." : "Generate Evidence Report"}
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

        {/* ── Header ── */}
        <div>
          <h1 className="text-2xl font-extrabold mb-1">Compliance Evidence Page</h1>
          <p className="text-sm" style={{ color: "#64748b" }}>
            Security alerts mapped to control areas. Shows which risks may affect compliance readiness.
            This is not a formal compliance audit — it is evidence for internal review.
          </p>
        </div>

        {/* ── Summary cards ── */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw size={22} className="animate-spin" style={{ color: "#475569" }} />
          </div>
        ) : (
          <>
            <ComplianceSummaryCards data={data} />

            {/* ── Filters ── */}
            <div className="flex flex-wrap gap-3 items-center">
              {/* Status filter */}
              <div className="flex flex-wrap gap-1">
                {STATUS_FILTERS.map((s) => (
                  <button key={s} onClick={() => setFilter(s)}
                    className="px-2.5 py-1 rounded text-xs font-semibold transition-all"
                    style={{
                      background: filter === s ? "var(--accent)" : "var(--card)",
                      color: filter === s ? "#0a0f1e" : "#64748b",
                      border: `1px solid ${filter === s ? "var(--accent)" : "var(--border)"}`,
                    }}>{s}</button>
                ))}
              </div>
              <span style={{ color: "#1e293b" }}>|</span>
              {/* Control area filter */}
              <div className="flex flex-wrap gap-1">
                {areas.map((a) => (
                  <button key={a} onClick={() => setAreaFilter(a)}
                    className="px-2.5 py-1 rounded text-xs font-semibold transition-all"
                    style={{
                      background: areaFilter === a ? "#1e293b" : "var(--card)",
                      color: areaFilter === a ? "#e2e8f0" : "#64748b",
                      border: `1px solid ${areaFilter === a ? "#334155" : "var(--border)"}`,
                    }}>{a}</button>
                ))}
              </div>
              <span className="ml-auto text-xs" style={{ color: "#334155" }}>
                {filtered.length} items
              </span>
            </div>

            {/* ── Control mapping table ── */}
            <ControlMappingTable items={filtered} />

            {/* ── Disclaimer ── */}
            <div className="rounded-xl border p-5"
              style={{ background: "rgba(0,212,255,0.03)", borderColor: "rgba(0,212,255,0.15)" }}>
              <div className="flex items-start gap-3">
                <ShieldAlert size={18} className="shrink-0 mt-0.5" style={{ color: "var(--accent)" }} />
                <div>
                  <div className="font-semibold text-sm mb-1">About This Page</div>
                  <p className="text-xs leading-relaxed" style={{ color: "#64748b" }}>
                    EntriAlert Beta maps security events to basic control areas to help you understand
                    which risks may affect your compliance readiness. This is not a full compliance audit,
                    does not claim certification, and should be reviewed by a qualified security professional
                    before use in formal reporting.
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
