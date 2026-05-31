"use client";
import { useEffect, useState } from "react";
import { BellRing, Settings, CheckCircle } from "lucide-react";

const ALERT_POOL = [
  { raw: "Failed SSH login × 847", severity: "HIGH", color: "#ef4444" },
  { raw: "Port scan from 192.168.x.x", severity: "MED", color: "#f97316" },
  { raw: "Unusual outbound traffic spike", severity: "HIGH", color: "#ef4444" },
  { raw: "Admin login at 3:22 AM", severity: "HIGH", color: "#ef4444" },
  { raw: "DNS query to known C2 domain", severity: "CRIT", color: "#dc2626" },
  { raw: "New device on internal network", severity: "LOW", color: "#eab308" },
  { raw: "Firewall rule modified", severity: "MED", color: "#f97316" },
  { raw: "Credential stuffing attempt", severity: "HIGH", color: "#ef4444" },
  { raw: "S3 bucket made public", severity: "CRIT", color: "#dc2626" },
  { raw: "Lateral movement detected", severity: "HIGH", color: "#ef4444" },
];

const DECISION_POOL = [
  "Block IP immediately",
  "Isolate endpoint",
  "Force re-authentication",
  "Revoke session token",
  "Notify admin + quarantine",
  "Suspend account",
];

type Item = {
  id: number;
  raw: string;
  severity: string;
  color: string;
  decision: string;
  confidence: number;
  state: "alert" | "processing" | "decided";
};

let uid = 0;

export default function AlertTicker() {
  const [items, setItems] = useState<Item[]>([]);

  useEffect(() => {
    const seed: Item[] = Array.from({ length: 3 }, (_, i) => ({
      id: uid++,
      ...ALERT_POOL[i % ALERT_POOL.length],
      decision: DECISION_POOL[i % DECISION_POOL.length],
      confidence: 85 + Math.floor(Math.random() * 14),
      state: "decided" as const,
    }));
    setItems(seed);

    const interval = setInterval(() => {
      const pool = ALERT_POOL[Math.floor(Math.random() * ALERT_POOL.length)];
      const newItem: Item = {
        id: uid++,
        ...pool,
        decision: DECISION_POOL[Math.floor(Math.random() * DECISION_POOL.length)],
        confidence: 82 + Math.floor(Math.random() * 17),
        state: "alert",
      };

      setItems((prev) => [...prev.slice(-5), newItem]);

      setTimeout(() => {
        setItems((prev) =>
          prev.map((it) => (it.id === newItem.id ? { ...it, state: "processing" } : it))
        );
      }, 600);

      setTimeout(() => {
        setItems((prev) =>
          prev.map((it) => (it.id === newItem.id ? { ...it, state: "decided" } : it))
        );
      }, 1600);
    }, 2200);

    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className="rounded-2xl border overflow-hidden"
      style={{ background: "#0d1424", borderColor: "#1e293b", minHeight: 260 }}
    >
      {/* Header bar */}
      <div
        className="flex items-center gap-2 px-4 py-2 border-b"
        style={{ background: "#111827", borderColor: "#1e293b" }}
      >
        <span className="w-3 h-3 rounded-full" style={{ background: "#ef4444" }} />
        <span className="w-3 h-3 rounded-full" style={{ background: "#f97316" }} />
        <span className="w-3 h-3 rounded-full" style={{ background: "#22c55e" }} />
        <span className="ml-3 text-xs font-mono" style={{ color: "#475569" }}>
          entrialert — live decision feed
        </span>
        <span className="ml-auto flex items-center gap-1.5 text-xs" style={{ color: "#22c55e" }}>
          <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#22c55e" }} />
          LIVE
        </span>
      </div>

      {/* Feed */}
      <div className="p-3 flex flex-col gap-2">
        {items.map((item) => (
          <div
            key={item.id}
            className="rounded-lg px-3 py-2 flex items-center gap-3 transition-all duration-500"
            style={{
              background:
                item.state === "processing"
                  ? "rgba(0,212,255,0.06)"
                  : item.state === "decided"
                  ? "rgba(34,197,94,0.05)"
                  : "rgba(239,68,68,0.06)",
              border: `1px solid ${
                item.state === "processing"
                  ? "rgba(0,212,255,0.2)"
                  : item.state === "decided"
                  ? "rgba(34,197,94,0.2)"
                  : item.color + "33"
              }`,
              opacity: item.state === "alert" ? 0.7 : 1,
            }}
          >
            {/* State icon */}
            <div className="shrink-0">
              {item.state === "alert" && (
                <BellRing size={16} style={{ color: item.color }} />
              )}
              {item.state === "processing" && (
                <Settings
                  size={16}
                  className="animate-spin"
                  style={{ color: "#00d4ff" }}
                />
              )}
              {item.state === "decided" && (
                <CheckCircle size={16} style={{ color: "#22c55e" }} />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span
                  className="text-xs font-bold px-1.5 py-0.5 rounded"
                  style={{ background: item.color + "22", color: item.color }}
                >
                  {item.severity}
                </span>
                <span className="text-xs font-mono truncate" style={{ color: "#94a3b8" }}>
                  {item.raw}
                </span>
              </div>
              {item.state === "decided" && (
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs font-semibold" style={{ color: "#00d4ff" }}>
                    → {item.decision}
                  </span>
                  <span className="text-xs ml-auto" style={{ color: "#22c55e" }}>
                    {item.confidence}% conf.
                  </span>
                </div>
              )}
              {item.state === "processing" && (
                <div className="text-xs mt-1" style={{ color: "#00d4ff" }}>
                  Analysing context...
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
