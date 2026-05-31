"use client";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import type { Decision } from "@/app/dashboard/page";

const COLORS: Record<string, string> = {
  CRITICAL: "#dc2626",
  HIGH: "#ef4444",
  MEDIUM: "#f97316",
  LOW: "#eab308",
};

export default function SeverityChart({ decisions }: { decisions: Decision[] }) {
  const counts: Record<string, number> = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 };
  for (const d of decisions) {
    if (d.severity in counts) counts[d.severity]++;
  }

  const data = Object.entries(counts)
    .filter(([, v]) => v > 0)
    .map(([name, value]) => ({ name, value }));

  return (
    <div
      className="rounded-xl border p-4"
      style={{ background: "var(--card)", borderColor: "var(--border)" }}
    >
      <h3 className="font-semibold text-sm mb-4" style={{ color: "#94a3b8" }}>Severity Breakdown</h3>

      {data.length === 0 ? (
        <div className="text-center py-6 text-xs" style={{ color: "#334155" }}>No data yet</div>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={70}
                paddingAngle={3}
                dataKey="value"
              >
                {data.map((entry) => (
                  <Cell key={entry.name} fill={COLORS[entry.name] ?? "#64748b"} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ background: "#111827", border: "1px solid #1e293b", borderRadius: 8, fontSize: 12 }}
                labelStyle={{ color: "#e2e8f0" }}
              />
            </PieChart>
          </ResponsiveContainer>

          <div className="flex flex-col gap-1.5 mt-2">
            {data.map((entry) => (
              <div key={entry.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[entry.name] }} />
                  <span style={{ color: "#94a3b8" }}>{entry.name}</span>
                </div>
                <span className="font-bold" style={{ color: COLORS[entry.name] }}>{entry.value}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
