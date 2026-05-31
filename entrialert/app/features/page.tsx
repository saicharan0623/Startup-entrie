import { Shield, Zap, Eye, MessageSquare, TrendingDown, RefreshCw, Lock, BarChart2 } from "lucide-react";

const features = [
  {
    icon: <Zap size={32} style={{ color: "var(--accent)" }} />,
    title: "Alert Ingestion & Normalization",
    desc: "Pulls alerts from your existing tools and normalizes them into a consistent format — no matter the source.",
  },
  {
    icon: <Eye size={32} style={{ color: "var(--accent)" }} />,
    title: "Context Enrichment",
    desc: "Enriches each alert with asset importance, user role, and data sensitivity to understand real-world impact.",
  },
  {
    icon: <Shield size={32} style={{ color: "var(--accent)" }} />,
    title: "Rule-Based Decision Engine",
    desc: "A transparent, auditable engine that converts enriched alerts into clear recommended actions.",
  },
  {
    icon: <BarChart2 size={32} style={{ color: "var(--accent)" }} />,
    title: "Confidence Scoring",
    desc: "Every decision comes with a confidence level so you always know how much to trust the recommendation.",
  },
  {
    icon: <MessageSquare size={32} style={{ color: "var(--accent)" }} />,
    title: "Operator Feedback Loop",
    desc: "Approve, reject, or mark decisions as incorrect. Your feedback improves the system over time.",
  },
  {
    icon: <TrendingDown size={32} style={{ color: "var(--accent)" }} />,
    title: "Intelligent Alert Reduction",
    desc: "Reduces 1000+ raw alerts down to ~10 meaningful decisions — cutting noise without cutting coverage.",
  },
  {
    icon: <Lock size={32} style={{ color: "var(--accent)" }} />,
    title: "Human-in-the-Loop Control",
    desc: "Critical actions always require operator approval. The system recommends; you decide.",
  },
  {
    icon: <RefreshCw size={32} style={{ color: "var(--accent)" }} />,
    title: "Continuous Improvement",
    desc: "Feedback data feeds back into the decision engine, making it smarter with every interaction.",
  },
];

export default function FeaturesPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
      {/* Header */}
      <div className="text-center mb-16">
        <h1 className="text-4xl font-extrabold mb-4">Platform Features</h1>
        <p className="text-lg max-w-2xl mx-auto" style={{ color: "#94a3b8" }}>
          Everything you need to manage security effectively — without a full SOC team.
        </p>
      </div>

      {/* Feature grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {features.map((f) => (
          <div
            key={f.title}
            className="rounded-xl p-6 border transition-all hover:border-cyan-500 hover:-translate-y-1"
            style={{ background: "var(--card)", borderColor: "var(--border)" }}
          >
            <div className="mb-4">{f.icon}</div>
            <h3 className="font-semibold text-base mb-2">{f.title}</h3>
            <p className="text-sm leading-relaxed" style={{ color: "#94a3b8" }}>
              {f.desc}
            </p>
          </div>
        ))}
      </div>

      {/* Testing phase callout */}
      <div
        className="mt-16 rounded-2xl p-8 border text-center"
        style={{ background: "rgba(0,212,255,0.05)", borderColor: "rgba(0,212,255,0.2)" }}
      >
        <h2 className="text-2xl font-bold mb-3">Testing Phase Scope</h2>
        <p className="max-w-xl mx-auto mb-6" style={{ color: "#94a3b8" }}>
          The current phase focuses on validating core decision-making. Advanced automation, AI enhancements,
          and compliance features are planned for later phases.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          {["Alert ingestion", "Normalization", "Context enrichment", "Rule-based decisions", "Feedback collection"].map(
            (item) => (
              <span
                key={item}
                className="px-3 py-1 rounded-full text-xs font-medium border"
                style={{ borderColor: "var(--accent)", color: "var(--accent)", background: "rgba(0,212,255,0.08)" }}
              >
                {item}
              </span>
            )
          )}
        </div>
      </div>
    </div>
  );
}
