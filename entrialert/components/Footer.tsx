import Link from "next/link";
import { Shield } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t mt-20" style={{ borderColor: "var(--border)", background: "var(--card)" }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-2 font-bold text-lg" style={{ color: "var(--accent)" }}>
          <Shield size={20} />
          EntriAlert
        </div>
        <p className="text-sm" style={{ color: "#64748b" }}>
          Autonomous Security Decision Support for SMEs
        </p>
        <div className="flex gap-6 text-sm" style={{ color: "#64748b" }}>
          <Link href="/features" className="hover:text-cyan-400 transition-colors">Features</Link>
          <Link href="/how-it-works" className="hover:text-cyan-400 transition-colors">How It Works</Link>
          <Link href="/contact" className="hover:text-cyan-400 transition-colors">Contact</Link>
        </div>
      </div>
      <div className="text-center text-xs pb-4" style={{ color: "#334155" }}>
        © {new Date().getFullYear()} EntriAlert. All rights reserved.
      </div>
    </footer>
  );
}
