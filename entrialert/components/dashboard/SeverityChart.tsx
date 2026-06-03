"use client";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import type { Decision } from "@/app/dashboard/page";

const SEVS = [
  { key: "CRITICAL", color: "#dc2626" },
  { key: "HIGH",     color: "#ef4444" },
  { key: "MEDIUM",   color: "#f97316" },
  { key: "LOW",      color: "#eab308" },
];

export default function SeverityChart({ decisions }: { decisions: Decision[] }) {
  const counts: Record<string, number> = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 };
  for (const d of decisions) {
    if (d.severity in counts) counts[d.severity]++;
  }
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  const data = SEVS.filter((s) => counts[s.key] > 0).map((s) => ({ name: s.key, value: counts[s.key], color: s.color }));

  return (
    <div className="rounded-xl border p-4" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
      <h3 className="font-semibold text-sm mb-1" style={{ color: "#94a3b8" }}>Severity Breakdown</h3>
      <p className="text-xs mb-4" style={{ color: "#334155" }}>{total} total alerts</p>

      {data.length === 0 ? (
        <div className="text-center py-8 text-xs" style={{ color: "#334155" }}>No data yet</div>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={150}>
            <PieChart>
              <Pie data={data} cx="50%" cy="50%" innerRadius={42} outerRadius={65}
                paddingAngle={3} dataKey="value">
                {data.map((e) => <Cell key={e.name} fill={e.color} />)}
              </Pie>
              <Tooltip
                contentStyle={{ background: "#111827", border: "1px solid #1e293b", borderRadius: 8, fontSize: 11 }}
                formatter={(v) => [`${v} alerts`]}
              />
            </PieChart>
          </ResponsiveContainer>

          {/* Bar rows */}
          <div className="flex flex-col gap-2 mt-3">
            {SEVS.map((s) => {
              const count = counts[s.key];
              const pct = total > 0 ? (count / total) * 100 : 0;
              return (
                <div key={s.key}>
                  <div className="flex justify-between text-xs mb-1">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full" style={{ background: s.color }} />
                      <span style={{ color: "#94a3b8" }}>{s.key}</span>
                    </div>
                    <span className="font-bold" style={{ color: s.color }}>{count}</span>
                  </div>
                  <div className="h-1 rounded-full" style={{ background: "#1e293b" }}>
                    <div className="h-1 rounded-full transition-all duration-500"
                      style={{ width: `${pct}%`, background: s.color }} />
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
