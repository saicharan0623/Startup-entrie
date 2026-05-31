"use client";
import { useEffect, useState } from "react";
import { Radio, Settings, Search, Brain, Monitor, RefreshCw } from "lucide-react";
import type { ReactNode } from "react";

type Agent = {
  id: string;
  icon: ReactNode;
  label: string;
  sublabel: string;
  color: string;
  glow: string;
  desc: string;
};

const AGENTS: Agent[] = [
  {
    id: "ingest",
    icon: <Radio size={28} />,
    label: "Ingestor",
    sublabel: "Pulls alerts",
    color: "#f97316",
    glow: "rgba(249,115,22,0.3)",
    desc: "Connects to your tools and pulls raw security events in real time.",
  },
  {
    id: "normalize",
    icon: <Settings size={28} />,
    label: "Normalizer",
    sublabel: "Cleans data",
    color: "#eab308",
    glow: "rgba(234,179,8,0.3)",
    desc: "Strips noise, deduplicates, and maps every alert to a standard schema.",
  },
  {
    id: "context",
    icon: <Search size={28} />,
    label: "Context Agent",
    sublabel: "Enriches",
    color: "#3b82f6",
    glow: "rgba(59,130,246,0.3)",
    desc: "Adds asset importance, user role, and data sensitivity to each event.",
  },
  {
    id: "decision",
    icon: <Brain size={28} />,
    label: "Decision Engine",
    sublabel: "Decides",
    color: "#00d4ff",
    glow: "rgba(0,212,255,0.35)",
    desc: "Rule-based engine converts enriched alerts into recommended actions with confidence scores.",
  },
  {
    id: "display",
    icon: <Monitor size={28} />,
    label: "UI Layer",
    sublabel: "Shows operator",
    color: "#a855f7",
    glow: "rgba(168,85,247,0.3)",
    desc: "Presents a clear decision card: what happened, why it matters, and what to do.",
  },
  {
    id: "feedback",
    icon: <RefreshCw size={28} />,
    label: "Feedback Loop",
    sublabel: "Learns",
    color: "#22c55e",
    glow: "rgba(34,197,94,0.3)",
    desc: "Operator approves, rejects, or flags. Every response improves future decisions.",
  },
];

export default function AgentPipeline() {
  const [active, setActive] = useState(0);
  const [hovered, setHovered] = useState<number | null>(null);

  useEffect(() => {
    const t = setInterval(() => {
      setActive((a) => (a + 1) % AGENTS.length);
    }, 1800);
    return () => clearInterval(t);
  }, []);

  const displayed = hovered !== null ? hovered : active;

  return (
    <div className="w-full">
      {/* Agent nodes */}
      <div className="flex flex-wrap justify-center gap-4 sm:gap-6 mb-10">
        {AGENTS.map((agent, i) => {
          const isActive = i === active;
          const isHovered = i === hovered;
          const highlight = isActive || isHovered;
          return (
            <button
              key={agent.id}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              className="flex flex-col items-center gap-2 focus:outline-none"
              aria-label={agent.label}
            >
              <div
                className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center transition-all duration-300"
                style={{
                  background: highlight ? agent.glow : "#111827",
                  border: `2px solid ${highlight ? agent.color : "#1e293b"}`,
                  boxShadow: highlight ? `0 0 24px ${agent.glow}, 0 0 8px ${agent.color}` : "none",
                  transform: highlight ? "scale(1.12)" : "scale(1)",
                  color: highlight ? agent.color : "#475569",
                }}
              >
                {agent.icon}
                {isActive && (
                  <span
                    className="absolute inset-0 rounded-full animate-ping"
                    style={{ border: `2px solid ${agent.color}`, opacity: 0.4 }}
                  />
                )}
                <span
                  className="absolute -top-1 -right-1 w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center"
                  style={{ background: highlight ? agent.color : "#1e293b", color: highlight ? "#0a0f1e" : "#475569" }}
                >
                  {i + 1}
                </span>
              </div>
              <span className="text-xs font-semibold text-center" style={{ color: highlight ? agent.color : "#64748b" }}>
                {agent.label}
              </span>
              <span className="text-xs text-center" style={{ color: "#334155" }}>{agent.sublabel}</span>
            </button>
          );
        })}
      </div>

      {/* Progress bar */}
      <div className="relative h-1 mx-auto mb-10 rounded-full overflow-hidden" style={{ background: "#1e293b", maxWidth: 600 }}>
        <div
          className="absolute left-0 top-0 h-full rounded-full transition-all duration-500"
          style={{
            width: `${((active + 1) / AGENTS.length) * 100}%`,
            background: "linear-gradient(90deg, #f97316, #00d4ff, #a855f7)",
            boxShadow: "0 0 8px rgba(0,212,255,0.5)",
          }}
        />
      </div>

      {/* Detail card */}
      <div
        className="max-w-xl mx-auto rounded-2xl p-6 border transition-all duration-300"
        style={{
          background: "#111827",
          borderColor: AGENTS[displayed].color + "55",
          boxShadow: `0 0 32px ${AGENTS[displayed].glow}`,
        }}
      >
        <div className="flex items-center gap-4 mb-3">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{ background: AGENTS[displayed].glow, color: AGENTS[displayed].color }}
          >
            {AGENTS[displayed].icon}
          </div>
          <div>
            <div className="font-bold text-lg" style={{ color: AGENTS[displayed].color }}>
              {AGENTS[displayed].label}
            </div>
            <div className="text-xs" style={{ color: "#64748b" }}>
              Step {displayed + 1} of {AGENTS.length}
            </div>
          </div>
          <div
            className="ml-auto px-3 py-1 rounded-full text-xs font-semibold"
            style={{ background: AGENTS[displayed].color + "22", color: AGENTS[displayed].color }}
          >
            {AGENTS[displayed].sublabel}
          </div>
        </div>
        <p className="text-sm leading-relaxed" style={{ color: "#94a3b8" }}>
          {AGENTS[displayed].desc}
        </p>
        <div className="flex gap-2 mt-4">
          {AGENTS.map((_, i) => (
            <div
              key={i}
              className="h-1.5 rounded-full transition-all duration-300"
              style={{
                width: i === displayed ? 24 : 8,
                background: i === displayed ? AGENTS[displayed].color : "#1e293b",
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
