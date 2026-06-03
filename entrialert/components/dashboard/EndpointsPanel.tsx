import { Monitor, Wifi, WifiOff, Clock } from "lucide-react";
import type { Device } from "@/app/dashboard/page";

function lastSeen(iso?: string) {
  if (!iso) return "Unknown";
  try {
    const diff = Date.now() - new Date(iso).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return "Just now";
    if (m < 60) return `${m}m ago`;
    return `${Math.floor(m / 60)}h ago`;
  } catch { return "Unknown"; }
}

export default function EndpointsPanel({ devices }: { devices: Device[] }) {
  return (
    <div className="rounded-xl border p-4" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
      <h3 className="font-semibold text-sm mb-4 flex items-center gap-2" style={{ color: "#94a3b8" }}>
        <Monitor size={14} /> Monitored Endpoints
        <span className="ml-auto text-xs px-1.5 py-0.5 rounded"
          style={{ background: "var(--background)", color: "#475569" }}>
          {devices.length}
        </span>
      </h3>

      {devices.length === 0 ? (
        <div className="text-center py-8">
          <WifiOff size={24} className="mx-auto mb-2" style={{ color: "#334155" }} />
          <p className="text-xs" style={{ color: "#334155" }}>No agents connected yet</p>
          <p className="text-xs mt-1" style={{ color: "#1e293b" }}>Install the Windows agent to start</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {devices.map((d) => {
            const online = d.last_seen
              ? Date.now() - new Date(d.last_seen).getTime() < 5 * 60 * 1000
              : false;
            return (
              <div key={d.hostname} className="rounded-lg p-3 border"
                style={{ background: "var(--background)", borderColor: online ? "rgba(34,197,94,0.2)" : "var(--border)" }}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold">{d.hostname}</span>
                  <span className="flex items-center gap-1 text-xs"
                    style={{ color: online ? "#22c55e" : "#ef4444" }}>
                    {online ? <Wifi size={11} /> : <WifiOff size={11} />}
                    {online ? "Online" : "Offline"}
                  </span>
                </div>
                <div className="text-xs" style={{ color: "#475569" }}>{d.os}</div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs font-mono" style={{ color: "#334155" }}>{d.ip}</span>
                  <span className="flex items-center gap-1 text-xs" style={{ color: "#334155" }}>
                    <Clock size={9} /> {lastSeen(d.last_seen)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
