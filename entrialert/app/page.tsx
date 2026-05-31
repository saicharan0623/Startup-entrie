import Link from "next/link";
import { ArrowRight, BellRing, Settings, CheckCircle } from "lucide-react";
import HeroVisual from "@/components/HeroVisual";
import AlertTicker from "@/components/AlertTicker";
import HighlightCards from "@/components/HighlightCards";

export default function HomePage() {
  return (
    <>
      {/* ── HERO ── */}
      <section className="relative overflow-hidden">
        {/* Ambient glows */}
        <div className="absolute inset-0 pointer-events-none" style={{
          background: "radial-gradient(ellipse 70% 60% at 50% -5%, rgba(0,212,255,0.13) 0%, transparent 65%)",
        }} />
        <div className="absolute inset-0 pointer-events-none" style={{
          background: "radial-gradient(ellipse 40% 40% at 80% 60%, rgba(124,58,237,0.08) 0%, transparent 60%)",
        }} />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-10 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: copy */}
            <div>
              <div
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mb-6 border"
                style={{ borderColor: "var(--accent)", color: "var(--accent)", background: "rgba(0,212,255,0.08)" }}
              >
                <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: "var(--accent)" }} />
                Now in Testing Phase
              </div>

              <h1 className="text-4xl sm:text-5xl font-extrabold leading-tight mb-5">
                Security Decisions,{" "}
                <span style={{ color: "var(--accent)" }}>Not Just Alerts</span>
              </h1>

              <p className="text-base sm:text-lg mb-8 leading-relaxed" style={{ color: "#94a3b8" }}>
                EntriAlert sits between your alert tools and your operator.
                It converts thousands of raw events into a handful of clear, trusted decisions —
                so <span style={{ color: "#e2e8f0" }}>one person</span> can do the work of an entire SOC team.
              </p>

              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold text-sm transition-all hover:opacity-90"
                  style={{ background: "var(--accent)", color: "#0a0f1e" }}
                >
                  Get Early Access <ArrowRight size={16} />
                </Link>
                <Link
                  href="/how-it-works"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold text-sm border transition-all hover:border-cyan-400"
                  style={{ borderColor: "var(--border)", color: "var(--foreground)" }}
                >
                  See How It Works
                </Link>
              </div>
            </div>

            {/* Right: animated SVG diagram */}
            <div>
              <HeroVisual />
              <p className="text-center text-xs mt-2" style={{ color: "#334155" }}>
                Live simulation — alerts flowing into decisions in real time
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── LIVE FEED DEMO ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid lg:grid-cols-2 gap-12 items-start">
          <div>
            <h2 className="text-3xl font-bold mb-4">
              Watch Alerts Become Decisions
            </h2>
            <p className="mb-6 leading-relaxed" style={{ color: "#94a3b8" }}>
              Every incoming alert is normalised, enriched with context, and run through the decision engine.
              What comes out isn&apos;t noise — it&apos;s a clear action with a confidence score.
            </p>
            <div className="flex flex-col gap-3">
              {[
                { icon: <BellRing size={18} style={{ color: "#ef4444" }} />, label: "Raw alert arrives", color: "#ef4444" },
                { icon: <Settings size={18} style={{ color: "#00d4ff" }} />, label: "Engine analyses context", color: "#00d4ff" },
                { icon: <CheckCircle size={18} style={{ color: "#22c55e" }} />, label: "Decision ready for operator", color: "#22c55e" },
              ].map((step) => (
                <div key={step.label} className="flex items-center gap-3">
                  {step.icon}
                  <span className="text-sm font-medium" style={{ color: step.color }}>{step.label}</span>
                </div>
              ))}
            </div>
          </div>
          <AlertTicker />
        </div>
      </section>

      {/* ── HIGHLIGHTS ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 pb-20">
        <h2 className="text-3xl font-bold text-center mb-10">Why EntriAlert is Different</h2>
        <HighlightCards />
      </section>

      {/* ── CTA ── */}
      <section
        className="py-20"
        style={{ background: "linear-gradient(180deg, var(--background) 0%, var(--card) 100%)" }}
      >
        <div className="max-w-2xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">One operator. Full coverage.</h2>
          <p className="mb-8" style={{ color: "#94a3b8" }}>
            Join our testing phase — we&apos;re onboarding a small group of SMEs to validate the platform.
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 px-8 py-3 rounded-lg font-semibold transition-all hover:opacity-90"
            style={{ background: "var(--accent)", color: "#0a0f1e" }}
          >
            Apply for Early Access <ArrowRight size={18} />
          </Link>
        </div>
      </section>
    </>
  );
}
