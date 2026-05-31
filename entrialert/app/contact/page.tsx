"use client";
import { useState } from "react";
import { Send, CheckCircle } from "lucide-react";

const roles = ["IT Admin", "DevOps Engineer", "Security-Aware User", "Founder / CTO", "Other"];

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", company: "", role: "", message: "" });

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // In production this would POST to the backend
    setSubmitted(true);
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-extrabold mb-4">Get Early Access</h1>
        <p className="text-lg" style={{ color: "#94a3b8" }}>
          We&apos;re onboarding a small group of SMEs for our testing phase. Tell us about your setup.
        </p>
      </div>

      {submitted ? (
        <div
          className="rounded-2xl p-10 border text-center"
          style={{ background: "var(--card)", borderColor: "rgba(0,212,255,0.3)" }}
        >
          <CheckCircle size={48} className="mx-auto mb-4" style={{ color: "var(--accent)" }} />
          <h2 className="text-2xl font-bold mb-2">You&apos;re on the list</h2>
          <p style={{ color: "#94a3b8" }}>
            We&apos;ll be in touch shortly to discuss your security setup and next steps.
          </p>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border p-8 flex flex-col gap-5"
          style={{ background: "var(--card)", borderColor: "var(--border)" }}
        >
          <div className="grid sm:grid-cols-2 gap-5">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium" htmlFor="name">Full Name</label>
              <input
                id="name"
                name="name"
                type="text"
                required
                placeholder="Your name"
                value={form.name}
                onChange={handleChange}
                className="rounded-lg px-4 py-2.5 text-sm outline-none border focus:border-cyan-400 transition-colors"
                style={{ background: "var(--background)", borderColor: "var(--border)", color: "var(--foreground)" }}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium" htmlFor="email">Work Email</label>
              <input
                id="email"
                name="email"
                type="email"
                required
                placeholder="you@company.com"
                value={form.email}
                onChange={handleChange}
                className="rounded-lg px-4 py-2.5 text-sm outline-none border focus:border-cyan-400 transition-colors"
                style={{ background: "var(--background)", borderColor: "var(--border)", color: "var(--foreground)" }}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium" htmlFor="company">Company Name</label>
            <input
              id="company"
              name="company"
              type="text"
              required
              placeholder="Your company"
              value={form.company}
              onChange={handleChange}
              className="rounded-lg px-4 py-2.5 text-sm outline-none border focus:border-cyan-400 transition-colors"
              style={{ background: "var(--background)", borderColor: "var(--border)", color: "var(--foreground)" }}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium" htmlFor="role">Your Role</label>
            <select
              id="role"
              name="role"
              required
              value={form.role}
              onChange={handleChange}
              className="rounded-lg px-4 py-2.5 text-sm outline-none border focus:border-cyan-400 transition-colors"
              style={{ background: "var(--background)", borderColor: "var(--border)", color: form.role ? "var(--foreground)" : "#64748b" }}
            >
              <option value="" disabled>Select your role</option>
              {roles.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium" htmlFor="message">
              Tell us about your current security setup
            </label>
            <textarea
              id="message"
              name="message"
              rows={4}
              placeholder="How many alerts do you deal with? What tools do you use? What's your biggest pain point?"
              value={form.message}
              onChange={handleChange}
              className="rounded-lg px-4 py-2.5 text-sm outline-none border focus:border-cyan-400 transition-colors resize-none"
              style={{ background: "var(--background)", borderColor: "var(--border)", color: "var(--foreground)" }}
            />
          </div>

          <button
            type="submit"
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold text-sm transition-all hover:opacity-90 mt-2"
            style={{ background: "var(--accent)", color: "#0a0f1e" }}
          >
            <Send size={16} /> Submit Application
          </button>
        </form>
      )}
    </div>
  );
}
