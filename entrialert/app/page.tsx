import Link from "next/link";
import { ArrowRight, Monitor, Play } from "lucide-react";
import HeroVisual from "@/components/HeroVisual";
import AlertTicker from "@/components/AlertTicker";
import BetaFeatureCards from "@/components/home/BetaFeatureCards";
import HowItWorksFlow from "@/components/home/HowItWorksFlow";
import DashboardPreview from "@/components/home/DashboardPreview";

export default function HomePage() {
  return (
    <>
      {/* ── HERO ── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{
          background: "radial-gradient(ellipse 70% 55% at 50% -5%, rgba(0,212,255,0.14) 0%, transparent 65%)",
        }} />
        <div className="absolute inset-0 pointer-events-none" style={{
          background: "radial-gradient(ellipse 40% 40% at 85% 55%, rgba(124,58,237,0.09) 0%, transparent 60%)",
        }} />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12 relative z-10">
          <div className="grid lg:grid-cols-2 gap-14 items-center">

            {/* Left — copy */}
            <div>
              <div
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mb-6 border"
                style={{ borderColor: "var(--accent)", color: "var(--accent)", background: "rgba(0,212,255,0.08)" }}
              >
                <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: "var(--accent)" }} />
                Beta — Now Available for SMEs
              </div>

              <h1 className="text-4xl sm:text-5xl font-extrabold leading-tight mb-5">
                Security Decisions,{" "}
                <span style={{ color: "var(--accent)" }}>Not Just Alerts</span>
              </h1>

              <p className="text-base sm:text-lg mb-8 leading-relaxed" style={{ color: "#94a3b8" }}>
                EntriAlert collects Windows security logs, detects risky events, and converts them into
                clear security decisions for SMEs —
                so <span style={{ color: "#e2e8f0" }}>one operator</span> can manage what used to need a full SOC team.
              </p>

              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold text-sm transition-all hover:opacity-90"
                  style={{ background: "var(--accent)", color: "#0a0f1e" }}
                >
                  Get Beta Access <ArrowRight size={16} />
                </Link>
                <Link
                  href="/dashboard"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold text-sm border transition-all hover:border-cyan-400"
                  style={{ borderColor: "var(--border)", color: "var(--foreground)" }}
                >
                  <Play size={15} /> View Live Demo
                </Link>
              </div>

              {/* Trust line */}
              <p className="mt-6 text-xs" style={{ color: "#334155" }}>
                Windows agent · Rule-based detection · No SOC team required
              </p>
            </div>

            {/* Right — animated diagram */}
            <div>
              <HeroVisual />
              <p className="text-center text-xs mt-2" style={{ color: "#334155" }}>
                Live simulation — Windows logs flowing into decisions in real time
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-3">How It Works</h2>
          <p style={{ color: "#94a3b8" }}>Five steps from Windows log to security decision</p>
        </div>
        <HowItWorksFlow />
      </section>

      {/* ── LIVE FEED DEMO ── */}
      <section
        className="py-20"
        style={{ background: "linear-gradient(180deg, var(--background) 0%, var(--card) 50%, var(--background) 100%)" }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-14 items-start">
            <div>
              <h2 className="text-3xl font-bold mb-4">Watch Alerts Become Decisions</h2>
              <p className="mb-8 leading-relaxed" style={{ color: "#94a3b8" }}>
                Every Windows security event is normalised, enriched with context, and run through
                the rule engine. What comes out isn&apos;t noise — it&apos;s a clear action with a confidence score.
              </p>
              <div className="flex flex-col gap-4">
                {[
                  { color: "#ef4444", label: "Windows log event arrives", sub: "Failed login, PowerShell, Defender change..." },
                  { color: "#f97316", label: "Rule engine classifies it", sub: "R001–R010 detection rules applied" },
                  { color: "#00d4ff", label: "Decision generated", sub: "What happened · Why it matters · What to do" },
                  { color: "#22c55e", label: "Operator approves or rejects", sub: "Full audit trail recorded" },
                ].map((s) => (
                  <div key={s.label} className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ background: s.color }} />
                    <div>
                      <div className="text-sm font-semibold" style={{ color: s.color }}>{s.label}</div>
                      <div className="text-xs mt-0.5" style={{ color: "#475569" }}>{s.sub}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <AlertTicker />
          </div>
        </div>
      </section>

      {/* ── BETA FEATURES ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-12">
          <div
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mb-4 border"
            style={{ borderColor: "#a855f7", color: "#a855f7", background: "rgba(168,85,247,0.08)" }}
          >
            Beta Feature Scope
          </div>
          <h2 className="text-3xl font-bold mb-3">Everything in the Beta</h2>
          <p style={{ color: "#94a3b8" }}>Built and available now — no overclaiming, no vaporware</p>
        </div>
        <BetaFeatureCards />
      </section>

      {/* ── DASHBOARD PREVIEW ── */}
      <section
        className="py-20"
        style={{ background: "linear-gradient(180deg, var(--background) 0%, var(--card) 100%)" }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold mb-3">The Operator Dashboard</h2>
            <p style={{ color: "#94a3b8" }}>
              Real alerts, real decisions, real endpoints — all in one view
            </p>
          </div>
          <DashboardPreview />
          <div className="text-center mt-8">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-semibold text-sm transition-all hover:opacity-90"
              style={{ background: "var(--accent)", color: "#0a0f1e" }}
            >
              <Monitor size={16} /> Open Live Dashboard
            </Link>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
        <h2 className="text-3xl font-bold mb-4">One operator. Full coverage.</h2>
        <p className="mb-8 text-lg" style={{ color: "#94a3b8" }}>
          Join the beta — we&apos;re onboarding a small group of SMEs to validate the platform.
          No SOC team required.
        </p>
        <Link
          href="/contact"
          className="inline-flex items-center gap-2 px-8 py-3 rounded-lg font-semibold transition-all hover:opacity-90"
          style={{ background: "var(--accent)", color: "#0a0f1e" }}
        >
          Apply for Beta Access <ArrowRight size={18} />
        </Link>
      </section>
    </>
  );
}
