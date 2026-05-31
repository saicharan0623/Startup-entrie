"use client";
import { Shield, Zap, Eye, TrendingDown } from "lucide-react";

const highlights = [
  {
    icon: <Zap size={24} style={{ color: "#f97316" }} />,
    title: "Decision-First",
    desc: "Not just alerts — clear actions with business context.",
    color: "#f97316",
  },
  {
    icon: <Eye size={24} style={{ color: "#3b82f6" }} />,
    title: "Full Transparency",
    desc: "See what the system saw, ignored, and why.",
    color: "#3b82f6",
  },
  {
    icon: <TrendingDown size={24} style={{ color: "#00d4ff" }} />,
    title: "1000 → 10",
    desc: "Thousands of alerts reduced to a handful of decisions.",
    color: "#00d4ff",
  },
  {
    icon: <Shield size={24} style={{ color: "#a855f7" }} />,
    title: "You Stay in Control",
    desc: "Approve, reject, or flag every recommendation.",
    color: "#a855f7",
  },
];

export default function HighlightCards() {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
      {highlights.map((h) => (
        <div
          key={h.title}
          className="rounded-xl p-5 border transition-all duration-200 hover:-translate-y-1 cursor-default"
          style={{ background: "var(--card)", borderColor: "var(--border)" }}
          onMouseEnter={(e) => {
            const el = e.currentTarget as HTMLDivElement;
            el.style.borderColor = h.color;
            el.style.boxShadow = `0 0 20px ${h.color}22`;
          }}
          onMouseLeave={(e) => {
            const el = e.currentTarget as HTMLDivElement;
            el.style.borderColor = "var(--border)";
            el.style.boxShadow = "none";
          }}
        >
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center mb-4"
            style={{ background: h.color + "18" }}
          >
            {h.icon}
          </div>
          <h3 className="font-bold text-base mb-1">{h.title}</h3>
          <p className="text-sm" style={{ color: "#94a3b8" }}>{h.desc}</p>
        </div>
      ))}
    </div>
  );
}
