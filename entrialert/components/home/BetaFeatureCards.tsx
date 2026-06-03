"use client";
import {
  Radio, ShieldCheck, BarChart2, Lightbulb,
  Monitor, ClipboardList, FileText, Settings, CheckCircle,
} from "lucide-react";

const FEATURES = [
  {
    icon: <Radio size={20} />,
    title: "Windows Log Monitoring",
    desc: "Automatic collection of Windows Security Event Logs from enrolled endpoints.",
    color: "#f97316",
  },
  {
    icon: <ShieldCheck size={20} />,
    title: "Rule-Based Alert Detection",
    desc: "10 detection rules covering brute force, admin creation, Defender changes, PowerShell, and more.",
    color: "#ef4444",
  },
  {
    icon: <BarChart2 size={20} />,
    title: "Severity Classification",
    desc: "Every alert is classified as Critical, High, Medium, or Low — automatically.",
    color: "#eab308",
  },
  {
    icon: <Lightbulb size={20} />,
    title: "Decision Recommendations",
    desc: "Each alert comes with a plain-language explanation and a recommended action.",
    color: "#00d4ff",
  },
  {
    icon: <Monitor size={20} />,
    title: "Endpoint Status Tracking",
    desc: "See which Windows devices are online, offline, or not sending logs.",
    color: "#3b82f6",
  },
  {
    icon: <ClipboardList size={20} />,
    title: "Audit Trail",
    desc: "Every operator action — approve, reject, resolve — is recorded with a timestamp.",
    color: "#a855f7",
  },
  {
    icon: <FileText size={20} />,
    title: "Basic Compliance Evidence",
    desc: "Alerts mapped to security control areas. Generate an evidence report for internal review.",
    color: "#22c55e",
  },
  {
    icon: <Settings size={20} />,
    title: "Agent Setup & API Keys",
    desc: "Simple agent installer, API key management, and connection status — all in one page.",
    color: "#64748b",
  },
];

export default function BetaFeatureCards() {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {FEATURES.map((f) => (
        <div
          key={f.title}
          className="rounded-xl p-5 border transition-all duration-200 hover:-translate-y-1 cursor-default group"
          style={{ background: "var(--card)", borderColor: "var(--border)" }}
          onMouseEnter={(e) => {
            const el = e.currentTarget as HTMLDivElement;
            el.style.borderColor = f.color;
            el.style.boxShadow = `0 0 18px ${f.color}22`;
          }}
          onMouseLeave={(e) => {
            const el = e.currentTarget as HTMLDivElement;
            el.style.borderColor = "var(--border)";
            el.style.boxShadow = "none";
          }}
        >
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center mb-3"
            style={{ background: f.color + "18", color: f.color }}
          >
            {f.icon}
          </div>
          <div className="flex items-start gap-1.5 mb-1">
            <CheckCircle size={12} className="mt-0.5 shrink-0" style={{ color: f.color }} />
            <h3 className="font-semibold text-sm leading-snug">{f.title}</h3>
          </div>
          <p className="text-xs leading-relaxed" style={{ color: "#64748b" }}>{f.desc}</p>
        </div>
      ))}
    </div>
  );
}
