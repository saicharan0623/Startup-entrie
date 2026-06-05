"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Shield, Menu, X, LogOut, ShieldCheck } from "lucide-react";
import { useAuth } from "@/lib/auth";

const publicLinks = [
  { href: "/", label: "Home" },
];

const authLinks = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/compliance", label: "Compliance" },
  { href: "/agent-setup", label: "Agent Setup" },
  { href: "/settings", label: "Settings" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { user, isLoggedIn, isAdmin, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    setOpen(false);
    router.push("/");
  };

  const links = isLoggedIn ? [...publicLinks, ...authLinks] : publicLinks;

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
        <div className="hidden md:flex items-center gap-6">
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

          {isAdmin && (
            <Link
              href="/admin"
              className="flex items-center gap-1.5 text-sm font-medium transition-colors hover:opacity-80"
              style={{ color: "#a855f7" }}
            >
              <ShieldCheck size={15} />
              Admin
            </Link>
          )}

          {isLoggedIn ? (
            <div className="flex items-center gap-3">
              {/* User badge */}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border"
                style={{ background: "var(--card)", borderColor: "var(--border)" }}>
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{ background: "rgba(0,212,255,0.12)", color: "var(--accent)" }}>
                  {user?.name.charAt(0).toUpperCase()}
                </div>
                <span className="text-xs font-medium" style={{ color: "#94a3b8" }}>
                  {user?.name.split(" ")[0]}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all hover:opacity-80"
                style={{ background: "rgba(239,68,68,0.08)", color: "#f87171", border: "1px solid rgba(239,68,68,0.2)" }}
              >
                <LogOut size={14} />
                Logout
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="px-4 py-2 rounded-lg text-sm font-semibold transition-all border hover:border-cyan-400"
                style={{ borderColor: "var(--border)", color: "var(--foreground)" }}
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="px-4 py-2 rounded-lg text-sm font-semibold transition-all hover:opacity-90"
                style={{ background: "var(--accent)", color: "#0a0f1e" }}
              >
                Get Started
              </Link>
            </div>
          )}
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

          {isAdmin && (
            <Link
              href="/admin"
              className="flex items-center gap-1.5 text-sm font-medium py-2 border-b"
              style={{ borderColor: "var(--border)", color: "#a855f7" }}
              onClick={() => setOpen(false)}
            >
              <ShieldCheck size={14} />
              Admin Panel
            </Link>
          )}

          {isLoggedIn ? (
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-sm font-semibold py-2"
              style={{ color: "#f87171" }}
            >
              <LogOut size={14} />
              Logout ({user?.name.split(" ")[0]})
            </button>
          ) : (
            <div className="flex flex-col gap-2 mt-1">
              <Link href="/login" onClick={() => setOpen(false)}
                className="text-sm font-semibold py-2 text-center rounded-lg border"
                style={{ borderColor: "var(--border)", color: "var(--foreground)" }}>
                Sign In
              </Link>
              <Link href="/register" onClick={() => setOpen(false)}
                className="text-sm font-semibold py-2 text-center rounded-lg"
                style={{ background: "var(--accent)", color: "#0a0f1e" }}>
                Get Started
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
