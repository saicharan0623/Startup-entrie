import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { AuthProvider } from "@/lib/auth";

export const metadata: Metadata = {
  title: "EntriAlert — Autonomous Security Decision Support",
  description:
    "EntriAlert converts security alerts into clear, actionable decisions. One operator. Full control. No SOC team required.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col" style={{ background: "var(--background)", color: "var(--foreground)" }}>
        <AuthProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
