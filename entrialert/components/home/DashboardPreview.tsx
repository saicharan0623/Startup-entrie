import { AlertTriangle, Wifi, WifiOff, ArrowRight } from "lucide-react";

const MOCK_ALERTS = [
  {
    severity: "CRITICAL",
    time: "10:42 AM",
    rule: "R002 — Brute Force Attempt",
    device: "DESKTOP-01",
    userip: "admin / 192.168.1.55",
    type: "Login Security",
    status: "Open",
    sc: { bg: "rgba(220,38,38,0.15)", text: "#f87171", dot: "#dc2626" },
  },
  {
    severity: "HIGH",
    time: "11:05 AM",
    rule: "R006 — Defender Disabled",
    device: "LAPTOP-02",
    userip: "System",
    type: "Endpoint Security",
    status: "Open",
    sc: { bg: "rgba(239,68,68,0.12)", text: "#fca5a5", dot: "#ef4444" },
  },
  {
    severity: "MEDIUM",
    time: "11:30 AM",
    rule: "R008 — Endpoint Offline",
    device: "PC-03",
    userip: "192.168.1.88",
    type: "Endpoint Health",
    status: "Monitoring",
    sc: { bg: "rgba(249,115,22,0.12)", text: "#fdba74", dot: "#f97316" },
  },
  {
    severity: "HIGH",
    time: "12:10 PM",
    rule: "R005 — New Admin Created",
    device: "DESKTOP-01",
    userip: "new_admin",
    type: "Privileged Access",
    status: "Needs Approval",
    sc: { bg: "rgba(239,68,68,0.12)", text: "#fca5a5", dot: "#ef4444" },
  },
];

const SUMMARY = [
  { label: "Total Events", value: "1,284", color: "#00d4ff" },
  { label: "Critical", value: "3", color: "#dc2626" },
  { label: "High", value: "11", color: "#ef4444" },
  { label: "Medium", value: "28", color: "#f97316" },
  { label: "Open Decisions", value: "7", color: "#a855f7" },
  { label: "Online Endpoints", value: "4 / 5", color: "#22c55e" },
];

const ENDPOINTS = [
  { name: "DESKTOP-01", os: "Windows 11", ip: "192.168.1.10", online: true },
  { name: "LAPTOP-02", os: "Windows 10", ip: "192.168.1.22", online: true },
  { name: "PC-03", os: "Windows 11", ip: "192.168.1.88", online: false },
  { name: "SERVER-01", os: "Windows Server 2022", ip: "192.168.1.5", online: true },
];

export default function DashboardPreview() {
  return (
    <div
      className="rounded-2xl border overflow-hidden"
      style={{ background: "#0d1424", borderColor: "#1e293b" }}
    >
      {/* Window chrome */}
      <div
        className="flex items-center gap-2 px-4 py-2.5 border-b"
        style={{ background: "#111827", borderColor: "#1e293b" }}
      >
        <span className="w-3 h-3 rounded-full" style={{ background: "#ef4444" }} />
        <span className="w-3 h-3 rounded-full" style={{ background: "#f97316" }} />
        <span className="w-3 h-3 rounded-full" style={{ background: "#22c55e" }} />
        <span className="ml-3 text-xs font-mono" style={{ color: "#475569" }}>
          entrialert — live monitoring dashboard
        </span>
        <span className="ml-auto flex items-center gap-1.5 text-xs" style={{ color: "#22c55e" }}>
          <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#22c55e" }} />
          LIVE
        </span>
      </div>

      <div className="p-4 space-y-4">
        {/* Summary cards */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {SUMMARY.map((s) => (
            <div
              key={s.label}
              className="rounded-lg p-2.5 text-center border"
              style={{ background: "#111827", borderColor: "#1e293b" }}
            >
              <div className="text-lg font-extrabold" style={{ color: s.color }}>{s.value}</div>
              <div className="text-xs mt-0.5" style={{ color: "#475569" }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-4">
          {/* Alert table */}
          <div className="lg:col-span-2">
            <div className="text-xs font-semibold mb-2 flex items-center gap-2" style={{ color: "#64748b" }}>
              <AlertTriangle size={12} /> Recent Alerts
            </div>
            <div className="rounded-lg overflow-hidden border" style={{ borderColor: "#1e293b" }}>
              <table className="w-full text-xs">
                <thead>
                  <tr style={{ background: "#111827" }}>
                    {["Severity", "Time", "Rule", "Device", "User / IP", "Status", ""].map((h) => (
                      <th key={h} className="px-3 py-2 text-left font-semibold" style={{ color: "#475569" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {MOCK_ALERTS.map((a, i) => (
                    <tr
                      key={i}
                      style={{ borderTop: "1px solid #1e293b", background: i % 2 === 0 ? "#0d1424" : "#0a0f1e" }}
                    >
                      <td className="px-3 py-2">
                        <span
                          className="px-1.5 py-0.5 rounded text-xs font-bold"
                          style={{ background: a.sc.bg, color: a.sc.text }}
                        >
                          {a.severity}
                        </span>
                      </td>
                      <td className="px-3 py-2 font-mono" style={{ color: "#64748b" }}>{a.time}</td>
                      <td className="px-3 py-2 font-medium" style={{ color: "#e2e8f0" }}>{a.rule}</td>
                      <td className="px-3 py-2" style={{ color: "#94a3b8" }}>{a.device}</td>
                      <td className="px-3 py-2 font-mono" style={{ color: "#64748b" }}>{a.userip}</td>
                      <td className="px-3 py-2">
                        <span
                          className="px-1.5 py-0.5 rounded-full text-xs"
                          style={{
                            background: a.status === "Open" ? "rgba(239,68,68,0.1)" : "rgba(100,116,139,0.1)",
                            color: a.status === "Open" ? "#f87171" : "#64748b",
                          }}
                        >
                          {a.status}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <span className="flex items-center gap-1 text-xs cursor-pointer" style={{ color: "var(--accent)" }}>
                          View <ArrowRight size={10} />
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Endpoints panel */}
          <div>
            <div className="text-xs font-semibold mb-2" style={{ color: "#64748b" }}>Monitored Endpoints</div>
            <div className="flex flex-col gap-2">
              {ENDPOINTS.map((ep) => (
                <div
                  key={ep.name}
                  className="rounded-lg p-3 border flex items-center justify-between"
                  style={{ background: "#111827", borderColor: "#1e293b" }}
                >
                  <div>
                    <div className="text-xs font-bold">{ep.name}</div>
                    <div className="text-xs" style={{ color: "#475569" }}>{ep.os}</div>
                    <div className="text-xs font-mono" style={{ color: "#334155" }}>{ep.ip}</div>
                  </div>
                  <div className="flex items-center gap-1 text-xs" style={{ color: ep.online ? "#22c55e" : "#ef4444" }}>
                    {ep.online ? <Wifi size={12} /> : <WifiOff size={12} />}
                    {ep.online ? "Online" : "Offline"}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
