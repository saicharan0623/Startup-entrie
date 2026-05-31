"use client";
import { useState } from "react";
import Link from "next/link";
import { Shield, Menu, X } from "lucide-react";

const links = [
  { href: "/", label: "Home" },
  { href: "/features", label: "Features" },
  { href: "/how-it-works", label: "How It Works" },
  { href: "/comparison", label: "Compare" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/contact", label: "Contact" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <nav
      className="sticky top-0 z-50 border-b"
      style={{ background: "rgba(10,15,30,0.95)", borderColor: "var(--border)", backdropFilter: "blur(12px)" }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-bold text-xl" style={{ color: "var(--accent)" }}>
          <Shield size={24} />
          EntriAlert
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-8">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-sm font-medium transition-colors hover:text-cyan-400"
              style={{ color: "var(--foreground)" }}
            >
              {l.label}
            </Link>
          ))}
          <Link
            href="/contact"
            className="px-4 py-2 rounded-lg text-sm font-semibold transition-all hover:opacity-90"
            style={{ background: "var(--accent)", color: "#0a0f1e" }}
          >
            Get Early Access
          </Link>
        </div>

        {/* Mobile toggle */}
        <button className="md:hidden" onClick={() => setOpen(!open)} aria-label="Toggle menu">
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden px-4 pb-4 flex flex-col gap-3" style={{ background: "var(--card)" }}>
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-sm font-medium py-2 border-b"
              style={{ borderColor: "var(--border)" }}
              onClick={() => setOpen(false)}
            >
              {l.label}
            </Link>
          ))}
          <Link
            href="/contact"
            className="mt-2 px-4 py-2 rounded-lg text-sm font-semibold text-center"
            style={{ background: "var(--accent)", color: "#0a0f1e" }}
            onClick={() => setOpen(false)}
          >
            Get Early Access
          </Link>
        </div>
      )}
    </nav>
  );
}
