import { Server, Wifi } from "lucide-react";

type Device = {
  hostname: string;
  os: string;
  user: string;
  ip: string;
  mac: string;
  last_seen?: string;
};

export default function DeviceList({ devices }: { devices: unknown[] }) {
  const list = devices as Device[];

  return (
    <div
      className="rounded-xl border p-4"
      style={{ background: "var(--card)", borderColor: "var(--border)" }}
    >
      <h3 className="font-semibold text-sm mb-4 flex items-center gap-2" style={{ color: "#94a3b8" }}>
        <Server size={14} /> Monitored Endpoints
        <span
          className="ml-auto text-xs px-1.5 py-0.5 rounded"
          style={{ background: "var(--background)", color: "#475569" }}
        >
          {list.length}
        </span>
      </h3>

      {list.length === 0 ? (
        <div className="text-center py-6 text-xs" style={{ color: "#334155" }}>
          No agents connected yet
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {list.map((d) => (
            <div
              key={d.hostname}
              className="rounded-lg p-3 border"
              style={{ background: "var(--background)", borderColor: "var(--border)" }}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold">{d.hostname}</span>
                <span className="flex items-center gap-1 text-xs" style={{ color: "#22c55e" }}>
                  <Wifi size={10} /> online
                </span>
              </div>
              <div className="text-xs" style={{ color: "#475569" }}>{d.os}</div>
              <div className="text-xs font-mono mt-0.5" style={{ color: "#334155" }}>{d.ip}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
