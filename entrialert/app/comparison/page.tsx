import { CheckCircle, XCircle, MinusCircle } from "lucide-react";

const rows = [
  { feature: "Alert display", existing: true, entrialert: true },
  { feature: "Investigation assistance", existing: true, entrialert: "Limited" },
  { feature: "Decision making", existing: false, entrialert: true },
  { feature: "Business context", existing: "Limited", entrialert: true },
  { feature: "Target user", existing: "SOC teams", entrialert: "Single operator" },
  { feature: "Automation", existing: "Partial", entrialert: "Controlled" },
  { feature: "Transparency", existing: false, entrialert: true },
  { feature: "Feedback learning", existing: "Limited", entrialert: true },
  { feature: "Confidence scoring", existing: false, entrialert: true },
  { feature: "SME-friendly", existing: false, entrialert: true },
];

function Cell({ value }: { value: boolean | string }) {
  if (value === true)
    return <CheckCircle size={20} className="mx-auto" style={{ color: "#4ade80" }} />;
  if (value === false)
    return <XCircle size={20} className="mx-auto" style={{ color: "#f87171" }} />;
  return (
    <span className="flex items-center justify-center gap-1 text-xs" style={{ color: "#fbbf24" }}>
      <MinusCircle size={14} /> {value}
    </span>
  );
}

export default function ComparisonPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
      <div className="text-center mb-16">
        <h1 className="text-4xl font-extrabold mb-4">EntriAlert vs Existing Tools</h1>
        <p className="text-lg max-w-2xl mx-auto" style={{ color: "#94a3b8" }}>
          Existing tools assist analysts. EntriAlert reduces the need for analysts.
        </p>
      </div>

      {/* Key difference callout */}
      <div
        className="rounded-xl p-6 border mb-12 text-center"
        style={{ background: "rgba(0,212,255,0.05)", borderColor: "rgba(0,212,255,0.2)" }}
      >
        <p className="text-lg font-semibold">
          <span style={{ color: "#94a3b8" }}>Existing tools: </span>
          <span>assist analysts</span>
          <span className="mx-4" style={{ color: "#334155" }}>|</span>
          <span style={{ color: "var(--accent)" }}>EntriAlert: </span>
          <span>reduce the need for analysts</span>
        </p>
      </div>

      {/* Comparison table */}
      <div className="rounded-2xl border overflow-hidden" style={{ borderColor: "var(--border)" }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: "var(--card)" }}>
              <th className="text-left px-6 py-4 font-semibold" style={{ color: "#94a3b8" }}>Feature</th>
              <th className="text-center px-6 py-4 font-semibold" style={{ color: "#94a3b8" }}>
                Existing Tools
                <div className="text-xs font-normal mt-0.5" style={{ color: "#475569" }}>
                  CrowdStrike, Microsoft, etc.
                </div>
              </th>
              <th
                className="text-center px-6 py-4 font-bold"
                style={{ color: "var(--accent)", background: "rgba(0,212,255,0.05)" }}
              >
                EntriAlert
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr
                key={row.feature}
                style={{
                  background: i % 2 === 0 ? "var(--background)" : "var(--card)",
                  borderTop: "1px solid var(--border)",
                }}
              >
                <td className="px-6 py-4 font-medium">{row.feature}</td>
                <td className="px-6 py-4 text-center">
                  <Cell value={row.existing} />
                </td>
                <td className="px-6 py-4 text-center" style={{ background: "rgba(0,212,255,0.03)" }}>
                  <Cell value={row.entrialert} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Who it's for */}
      <div className="mt-16 grid sm:grid-cols-2 gap-6">
        <div
          className="rounded-xl p-6 border"
          style={{ background: "var(--card)", borderColor: "var(--border)" }}
        >
          <h3 className="font-bold text-lg mb-3" style={{ color: "#f87171" }}>Not the right fit if you...</h3>
          <ul className="space-y-2 text-sm" style={{ color: "#94a3b8" }}>
            <li>• Already have a dedicated SOC team</li>
            <li>• Need enterprise-scale compliance automation</li>
            <li>• Require deep SIEM integrations on day one</li>
          </ul>
        </div>
        <div
          className="rounded-xl p-6 border"
          style={{ background: "var(--card)", borderColor: "rgba(0,212,255,0.3)" }}
        >
          <h3 className="font-bold text-lg mb-3" style={{ color: "var(--accent)" }}>Perfect fit if you...</h3>
          <ul className="space-y-2 text-sm" style={{ color: "#94a3b8" }}>
            <li>• Are an SME without a full security team</li>
            <li>• Have one IT admin or DevOps engineer handling security</li>
            <li>• Are drowning in alerts with no clear actions</li>
            <li>• Want transparency and control over security decisions</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
