"use client";
import { useState } from "react";
import { Download, Radio, ArrowRight, Brain, LayoutDashboard } from "lucide-react";

const STEPS = [
  {
    icon: <Download size={22} />,
    step: "01",
    title: "Install Windows Agent",
    desc: "Install the EntriAlert agent on your Windows machine. It runs as a background service — no manual log uploads needed.",
    color: "#f97316",
  },
  {
    icon: <Radio size={22} />,
    step: "02",
    title: "Collect Windows Logs",
    desc: "The agent reads selected Windows Event Logs — failed logins, admin creation, Defender changes, PowerShell execution, and more.",
    color: "#eab308",
  },
  {
    icon: <ArrowRight size={22} />,
    step: "03",
    title: "Send Securely to Backend",
    desc: "Events are converted to JSON and sent via HTTPS to the EntriAlert backend using your API key. Fully encrypted in transit.",
    color: "#3b82f6",
  },
  {
    icon: <Brain size={22} />,
    step: "04",
    title: "Rule Engine Detects Risks",
    desc: "10 detection rules (R001–R010) classify each event by severity — Critical, High, Medium, or Low — and generate a decision.",
    color: "#00d4ff",
  },
  {
    icon: <LayoutDashboard size={22} />,
    step: "05",
    title: "Dashboard Shows Decisions",
    desc: "The operator sees clear alerts with what happened, why it matters, recommended action, and compliance evidence — not raw logs.",
    color: "#a855f7",
  },
];

export default function HowItWorksFlow() {
  const [active, setActive] = useState<number | null>(null);

  return (
    <div className="flex flex-col gap-0">
      {/* Desktop: horizontal flow */}
      <div className="hidden lg:flex items-start gap-0">
        {STEPS.map((s, i) => (
          <div key={s.step} className="flex items-start flex-1">
            <div
              className="flex-1 flex flex-col items-center text-center cursor-pointer group"
              onMouseEnter={() => setActive(i)}
              onMouseLeave={() => setActive(null)}
            >
              {/* Circle */}
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center mb-3 transition-all duration-300 relative"
                style={{
                  background: active === i ? s.color + "22" : "#111827",
                  border: `2px solid ${active === i ? s.color : "#1e293b"}`,
                  boxShadow: active === i ? `0 0 20px ${s.color}44` : "none",
                  color: active === i ? s.color : "#475569",
                }}
              >
                {s.icon}
                <span
                  className="absolute -top-1 -right-1 w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center"
                  style={{
                    background: active === i ? s.color : "#1e293b",
                    color: active === i ? "#0a0f1e" : "#475569",
                  }}
                >
                  {s.step.replace("0", "")}
                </span>
              </div>
              <div className="font-semibold text-sm mb-1" style={{ color: active === i ? s.color : "#e2e8f0" }}>
                {s.title}
              </div>
              <div className="text-xs leading-relaxed px-2" style={{ color: "#64748b" }}>
                {s.desc}
              </div>
            </div>

            {/* Arrow connector */}
            {i < STEPS.length - 1 && (
              <div className="flex items-center pt-6 px-1 shrink-0">
                <ArrowRight size={16} style={{ color: "#1e293b" }} />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Mobile: vertical list */}
      <div className="flex flex-col gap-4 lg:hidden">
        {STEPS.map((s, i) => (
          <div
            key={s.step}
            className="flex items-start gap-4 p-4 rounded-xl border"
            style={{ background: "var(--card)", borderColor: "var(--border)" }}
          >
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
              style={{ background: s.color + "18", color: s.color, border: `1px solid ${s.color}44` }}
            >
              {s.icon}
            </div>
            <div>
              <div className="text-xs font-bold mb-0.5" style={{ color: s.color }}>Step {i + 1}</div>
              <div className="font-semibold text-sm mb-1">{s.title}</div>
              <div className="text-xs leading-relaxed" style={{ color: "#64748b" }}>{s.desc}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
