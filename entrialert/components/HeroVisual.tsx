"use client";
import { useEffect, useRef, useState } from "react";

const ALERTS = [
  { id: 1, label: "Brute Force", color: "#ef4444", x: 8, y: 18 },
  { id: 2, label: "Port Scan", color: "#f97316", x: 6, y: 42 },
  { id: 3, label: "SQL Inject", color: "#ef4444", x: 10, y: 66 },
  { id: 4, label: "Phishing", color: "#f97316", x: 7, y: 82 },
  { id: 5, label: "Malware", color: "#ef4444", x: 9, y: 55 },
  { id: 6, label: "DDoS", color: "#f97316", x: 5, y: 30 },
  { id: 7, label: "Ransomware", color: "#ef4444", x: 11, y: 72 },
  { id: 8, label: "Exfiltration", color: "#f97316", x: 8, y: 90 },
];

const DECISIONS = [
  { id: 1, label: "Block IP", confidence: 94, severity: "HIGH", color: "#ef4444" },
  { id: 2, label: "Isolate Host", confidence: 88, severity: "HIGH", color: "#ef4444" },
  { id: 3, label: "Reset Creds", confidence: 91, severity: "MED", color: "#f97316" },
];

export default function HeroVisual() {
  const [tick, setTick] = useState(0);
  const [activeAlert, setActiveAlert] = useState<number | null>(null);
  const [activeDecision, setActiveDecision] = useState<number | null>(null);
  const [particles, setParticles] = useState<{ id: number; progress: number; alertIdx: number }[]>([]);
  const nextId = useRef(100);

  useEffect(() => {
    const interval = setInterval(() => {
      setTick((t) => t + 1);
    }, 80);
    return () => clearInterval(interval);
  }, []);

  // Spawn particles periodically
  useEffect(() => {
    const spawn = setInterval(() => {
      const alertIdx = Math.floor(Math.random() * ALERTS.length);
      setParticles((prev) => [
        ...prev.slice(-12),
        { id: nextId.current++, progress: 0, alertIdx },
      ]);
      setActiveAlert(alertIdx);
    }, 900);
    return () => clearInterval(spawn);
  }, []);

  // Advance particles
  useEffect(() => {
    setParticles((prev) =>
      prev
        .map((p) => ({ ...p, progress: p.progress + 2.2 }))
        .filter((p) => p.progress <= 100)
    );
  }, [tick]);

  // Trigger decision flash when particle arrives
  useEffect(() => {
    const arriving = particles.filter((p) => p.progress >= 95);
    if (arriving.length > 0) {
      const idx = Math.floor(Math.random() * DECISIONS.length);
      setActiveDecision(idx);
      const t = setTimeout(() => setActiveDecision(null), 800);
      return () => clearTimeout(t);
    }
  }, [particles]);

  return (
    <div className="relative w-full h-72 sm:h-80 select-none" aria-hidden="true">
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 500 280" preserveAspectRatio="xMidYMid meet">
        <defs>
          <radialGradient id="engineGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#00d4ff" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#00d4ff" stopOpacity="0" />
          </radialGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id="softglow">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {/* ── LEFT: Alert cloud ── */}
        <text x="52" y="14" textAnchor="middle" fontSize="9" fill="#64748b" fontFamily="monospace">ALERTS</text>
        {ALERTS.map((a, i) => (
          <g key={a.id}>
            <rect
              x={a.x} y={a.y + 2} width={68} height={16} rx={4}
              fill={activeAlert === i ? a.color + "33" : "#111827"}
              stroke={activeAlert === i ? a.color : "#1e293b"}
              strokeWidth={activeAlert === i ? 1.5 : 0.8}
            />
            <circle cx={a.x + 7} cy={a.y + 10} r={3}
              fill={a.color}
              opacity={activeAlert === i ? 1 : 0.5}
            />
            <text x={a.x + 14} y={a.y + 14} fontSize="7.5" fill={activeAlert === i ? "#e2e8f0" : "#64748b"} fontFamily="monospace">
              {a.label}
            </text>
          </g>
        ))}

        {/* ── FLOW LINES from alerts to engine ── */}
        {ALERTS.map((a) => (
          <line
            key={`line-${a.id}`}
            x1={a.x + 68} y1={a.y + 10}
            x2={195} y2={140}
            stroke="#1e293b" strokeWidth={0.6} strokeDasharray="3 3"
          />
        ))}

        {/* ── PARTICLES travelling along lines ── */}
        {particles.map((p) => {
          const a = ALERTS[p.alertIdx];
          const t = p.progress / 100;
          const x1 = a.x + 68, y1 = a.y + 10;
          const x2 = 195, y2 = 140;
          const cx = x1 + (x2 - x1) * t;
          const cy = y1 + (y2 - y1) * t;
          return (
            <circle key={p.id} cx={cx} cy={cy} r={3.5}
              fill={a.color} filter="url(#glow)" opacity={1 - t * 0.3}
            />
          );
        })}

        {/* ── ENGINE (center) ── */}
        <circle cx={220} cy={140} r={52} fill="url(#engineGlow)" />
        <circle cx={220} cy={140} r={40}
          fill="#0a0f1e"
          stroke="#00d4ff"
          strokeWidth={1.5}
          strokeDasharray={`${(tick * 1.2) % 251} 251`}
          style={{ transition: "stroke-dasharray 0.08s linear" }}
        />
        <circle cx={220} cy={140} r={32} fill="#111827" stroke="#1e293b" strokeWidth={1} />
        {/* Rotating inner ring */}
        <circle cx={220} cy={140} r={24}
          fill="none"
          stroke="#7c3aed"
          strokeWidth={1}
          strokeDasharray="8 6"
          transform={`rotate(${tick * 1.5}, 220, 140)`}
        />
        {/* Shield icon */}
        <text x={220} y={136} textAnchor="middle" fontSize="18" fill="#00d4ff" filter="url(#softglow)">⬡</text>
        <text x={220} y={148} textAnchor="middle" fontSize="7" fill="#00d4ff" fontFamily="monospace" letterSpacing="1">ENGINE</text>

        {/* ── FLOW LINES from engine to decisions ── */}
        {DECISIONS.map((d, i) => {
          const dy = 80 + i * 60;
          return (
            <line key={`dline-${d.id}`}
              x1={260} y1={140}
              x2={310} y2={dy}
              stroke="#1e293b" strokeWidth={0.8}
            />
          );
        })}

        {/* ── RIGHT: Decision cards ── */}
        <text x={390} y={14} textAnchor="middle" fontSize="9" fill="#64748b" fontFamily="monospace">DECISIONS</text>
        {DECISIONS.map((d, i) => {
          const dy = 70 + i * 60;
          const isActive = activeDecision === i;
          return (
            <g key={d.id}>
              <rect
                x={310} y={dy} width={160} height={42} rx={6}
                fill={isActive ? "#0a0f1e" : "#111827"}
                stroke={isActive ? "#00d4ff" : "#1e293b"}
                strokeWidth={isActive ? 2 : 0.8}
              />
              {/* Confidence bar bg */}
              <rect x={318} y={dy + 28} width={144} height={5} rx={2} fill="#1e293b" />
              {/* Confidence bar fill */}
              <rect x={318} y={dy + 28} width={isActive ? (d.confidence / 100) * 144 : (d.confidence / 100) * 100} height={5} rx={2}
                fill={isActive ? "#00d4ff" : "#334155"}
                style={{ transition: "width 0.6s ease" }}
              />
              {/* Severity badge */}
              <rect x={318} y={dy + 7} width={26} height={12} rx={3}
                fill={d.color + "22"} stroke={d.color} strokeWidth={0.8}
              />
              <text x={331} y={dy + 16} textAnchor="middle" fontSize="6.5" fill={d.color} fontFamily="monospace">{d.severity}</text>
              {/* Label */}
              <text x={352} y={dy + 17} fontSize="9" fill={isActive ? "#e2e8f0" : "#94a3b8"} fontFamily="monospace" fontWeight="bold">
                {d.label}
              </text>
              {/* Confidence % */}
              <text x={462} y={dy + 17} textAnchor="end" fontSize="8" fill={isActive ? "#00d4ff" : "#475569"} fontFamily="monospace">
                {d.confidence}%
              </text>
              {/* Pulse dot when active */}
              {isActive && (
                <circle cx={464} cy={dy + 8} r={4} fill="#00d4ff" filter="url(#glow)" />
              )}
            </g>
          );
        })}

        {/* ── OPERATOR (far right) ── */}
        <circle cx={490} cy={140} r={18} fill="#111827" stroke="#7c3aed" strokeWidth={1.5} />
        <text x={490} y={136} textAnchor="middle" fontSize="14">👤</text>
        <text x={490} y={148} textAnchor="middle" fontSize="6.5" fill="#7c3aed" fontFamily="monospace">OPS</text>
        <line x1={470} y1={140} x2={470} y2={140}
          stroke="#7c3aed" strokeWidth={0.8} strokeDasharray="3 3"
        />
        {/* Lines from decisions to operator */}
        {DECISIONS.map((d, i) => {
          const dy = 91 + i * 60;
          return (
            <line key={`oline-${d.id}`}
              x1={470} y1={dy}
              x2={474} y2={140}
              stroke="#7c3aed" strokeWidth={0.6} strokeDasharray="3 3" opacity={0.5}
            />
          );
        })}
      </svg>
    </div>
  );
}
