"use client";
import { useState, useEffect, useCallback } from "react";
import {
  Download, Key, Terminal, Wifi, WifiOff,
  CheckCircle, Copy, RefreshCw, AlertTriangle,
  ChevronDown, ChevronUp, Clock, Monitor,
} from "lucide-react";
import { fetchDevices } from "@/lib/api";

const TENANT_ID = "ENT-BETA-001";
const DEFAULT_API_KEY = "dev-secret-key";
const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
const AGENT_VERSION = "1.0.0";

type Device = {
  hostname: string;
  os: string;
  user: string;
  ip: string;
  mac: string;
  last_seen?: string;
};

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={copy}
      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all"
      style={{ background: copied ? "rgba(34,197,94,0.12)" : "rgba(0,212,255,0.08)", color: copied ? "#4ade80" : "var(--accent)", border: `1px solid ${copied ? "rgba(34,197,94,0.25)" : "rgba(0,212,255,0.2)"}` }}>
      {copied ? <CheckCircle size={12} /> : <Copy size={12} />}
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}

function CodeBlock({ code, label }: { code: string; label?: string }) {
  return (
    <div className="rounded-xl overflow-hidden border" style={{ borderColor: "#1e293b" }}>
      {label && (
        <div className="flex items-center justify-between px-4 py-2 border-b"
          style={{ background: "#111827", borderColor: "#1e293b" }}>
          <span className="text-xs font-mono" style={{ color: "#475569" }}>{label}</span>
          <CopyButton text={code} />
        </div>
      )}
      <div className="px-4 py-3 overflow-x-auto" style={{ background: "#0d1424" }}>
        <pre className="text-xs font-mono whitespace-pre-wrap" style={{ color: "#00d4ff" }}>{code}</pre>
      </div>
    </div>
  );
}

const STEPS = [
  { num: 1, label: "Copy your API key", anchor: "api-key" },
  { num: 2, label: "Download the agent", anchor: "download" },
  { num: 3, label: "Run install command", anchor: "install" },
  { num: 4, label: "Verify connection", anchor: "status" },
];

const TROUBLESHOOT = [
  { check: "Agent process is running", cmd: 'Get-Process | Where-Object { $_.Name -like "*entrialert*" }', fix: "Run start_agent.bat as Administrator" },
  { check: "API key is correct", cmd: "Check ENTRIALERT_API_KEY in your .env file", fix: `Should be: ${DEFAULT_API_KEY}` },
  { check: "Backend is reachable", cmd: `curl ${BACKEND_URL}/health`, fix: "Start the backend: python -m uvicorn backend.main:app --port 8000" },
  { check: "Firewall not blocking", cmd: "Check Windows Firewall for outbound port 8000", fix: "Allow outbound connections to port 8000" },
  { check: "Backend URL configured", cmd: "Check ENTRIALERT_API_URL in agent config", fix: `Should be: ${BACKEND_URL}` },
];

export default function AgentSetupPage() {
  const [apiKey, setApiKey] = useState(DEFAULT_API_KEY);
  const [showKey, setShowKey] = useState(false);
  const [devices, setDevices] = useState<Device[]>([]);
  const [loadingDevices, setLoadingDevices] = useState(true);
  const [openTrouble, setOpenTrouble] = useState<number | null>(null);

  const loadDevices = useCallback(async () => {
    setLoadingDevices(true);
    try {
      const d = await fetchDevices();
      setDevices(d.devices ?? []);
    } catch { /* backend offline */ }
    finally { setLoadingDevices(false); }
  }, []);

  useEffect(() => { loadDevices(); }, [loadDevices]);

  const installCmd = `python agent/main.py`;
  const envConfig = `ENTRIALERT_API_URL=${BACKEND_URL}\nENTRIALERT_API_KEY=${apiKey}\nENTRIALERT_TENANT_ID=${TENANT_ID}`;
  const fullInstallCmd = `.\\entrialert-agent.exe install --api-key ${apiKey} --tenant-id ${TENANT_ID} --backend-url ${BACKEND_URL}`;

  function lastSeen(iso?: string) {
    if (!iso) return "Unknown";
    try {
      const diff = Date.now() - new Date(iso).getTime();
      const m = Math.floor(diff / 60000);
      if (m < 1) return "Just now";
      if (m < 60) return `${m}m ago`;
      return `${Math.floor(m / 60)}h ago`;
    } catch { return "Unknown"; }
  }

  function isOnline(iso?: string) {
    if (!iso) return false;
    return Date.now() - new Date(iso).getTime() < 5 * 60 * 1000;
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--background)" }}>

      {/* ── Top bar ── */}
      <div className="sticky top-16 z-40 border-b px-4 sm:px-6 lg:px-8 py-3 flex items-center gap-3"
        style={{ background: "rgba(10,15,30,0.97)", borderColor: "var(--border)", backdropFilter: "blur(12px)" }}>
        <Download size={18} style={{ color: "var(--accent)" }} />
        <span className="font-bold text-sm">Agent Setup</span>
        <span className="text-xs px-2 py-0.5 rounded-full"
          style={{ background: "rgba(34,197,94,0.08)", color: "#22c55e", border: "1px solid rgba(34,197,94,0.2)" }}>
          Windows Agent v{AGENT_VERSION}
        </span>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        {/* ── Header ── */}
        <div>
          <h1 className="text-2xl font-extrabold mb-2">Connect Your Windows Machine</h1>
          <p className="text-sm" style={{ color: "#64748b" }}>
            Install the EntriAlert agent on any Windows machine. It runs in the background,
            collects security logs automatically, and sends them to this backend.
          </p>
        </div>

        {/* ── Progress steps ── */}
        <div className="flex flex-wrap gap-2">
          {STEPS.map((s, i) => (
            <a key={s.num} href={`#${s.anchor}`}
              className="flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-semibold transition-all hover:border-cyan-400"
              style={{ background: "var(--card)", borderColor: "var(--border)", color: "#94a3b8" }}>
              <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
                style={{ background: "rgba(0,212,255,0.12)", color: "var(--accent)" }}>{s.num}</span>
              {s.label}
              {i < STEPS.length - 1 && <span style={{ color: "#334155" }}>→</span>}
            </a>
          ))}
        </div>

        {/* ── 1. API Key ── */}
        <section id="api-key" className="rounded-xl border p-6 space-y-4"
          style={{ background: "var(--card)", borderColor: "var(--border)" }}>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: "rgba(0,212,255,0.12)", color: "var(--accent)" }}>
              <Key size={16} />
            </div>
            <div>
              <h2 className="font-bold text-base">API Key</h2>
              <p className="text-xs" style={{ color: "#64748b" }}>The agent uses this to authenticate with the backend</p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { label: "Tenant ID", value: TENANT_ID, mono: true },
              { label: "Created", value: "2026-05-31", mono: false },
            ].map((f) => (
              <div key={f.label} className="rounded-lg p-3 border"
                style={{ background: "var(--background)", borderColor: "var(--border)" }}>
                <div className="text-xs font-semibold mb-1" style={{ color: "#64748b" }}>{f.label}</div>
                <div className={`text-sm ${f.mono ? "font-mono" : ""}`} style={{ color: "#e2e8f0" }}>{f.value}</div>
              </div>
            ))}
          </div>

          <div className="rounded-lg p-3 border" style={{ background: "var(--background)", borderColor: "var(--border)" }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold" style={{ color: "#64748b" }}>API Key</span>
              <div className="flex gap-2">
                <button onClick={() => setShowKey((v) => !v)}
                  className="text-xs px-2 py-1 rounded border transition-all"
                  style={{ borderColor: "var(--border)", color: "#64748b" }}>
                  {showKey ? "Hide" : "Show"}
                </button>
                <CopyButton text={apiKey} />
              </div>
            </div>
            <div className="font-mono text-sm" style={{ color: "var(--accent)" }}>
              {showKey ? apiKey : "•".repeat(apiKey.length)}
            </div>
          </div>

          <div className="rounded-lg p-3 border" style={{ background: "var(--background)", borderColor: "var(--border)" }}>
            <div className="text-xs font-semibold mb-2" style={{ color: "#64748b" }}>Status</div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full" style={{ background: "#22c55e" }} />
              <span className="text-sm font-semibold" style={{ color: "#22c55e" }}>Active</span>
            </div>
          </div>
        </section>

        {/* ── 2. Download ── */}
        <section id="download" className="rounded-xl border p-6 space-y-4"
          style={{ background: "var(--card)", borderColor: "var(--border)" }}>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: "rgba(34,197,94,0.12)", color: "#22c55e" }}>
              <Download size={16} />
            </div>
            <div>
              <h2 className="font-bold text-base">Download Windows Agent</h2>
              <p className="text-xs" style={{ color: "#64748b" }}>Python-based agent — runs on Windows 10 / 11 / Server 2019+</p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="rounded-xl border p-4 flex flex-col gap-3"
              style={{ background: "var(--background)", borderColor: "rgba(34,197,94,0.2)" }}>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-sm">entrialert-agent</span>
                <span className="text-xs px-2 py-0.5 rounded-full"
                  style={{ background: "rgba(34,197,94,0.1)", color: "#22c55e" }}>v{AGENT_VERSION}</span>
              </div>
              <div className="text-xs space-y-1" style={{ color: "#64748b" }}>
                <div>Platform: Windows x64</div>
                <div>Runtime: Python 3.11+</div>
                <div>Size: ~50 KB (+ dependencies)</div>
              </div>
              <p className="text-xs" style={{ color: "#475569" }}>
                The agent is already included in this repository under <span className="font-mono" style={{ color: "var(--accent)" }}>agent/</span>
              </p>
            </div>

            <div className="rounded-xl border p-4 flex flex-col gap-3"
              style={{ background: "var(--background)", borderColor: "var(--border)" }}>
              <div className="font-semibold text-sm">Requirements</div>
              <div className="flex flex-col gap-1.5">
                {["Python 3.11+", "psutil", "requests", "pydantic", "pywin32 (Windows)"].map((r) => (
                  <div key={r} className="flex items-center gap-2 text-xs">
                    <CheckCircle size={11} style={{ color: "#22c55e" }} />
                    <span style={{ color: "#94a3b8" }}>{r}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── 3. Install Command ── */}
        <section id="install" className="rounded-xl border p-6 space-y-4"
          style={{ background: "var(--card)", borderColor: "var(--border)" }}>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: "rgba(168,85,247,0.12)", color: "#a855f7" }}>
              <Terminal size={16} />
            </div>
            <div>
              <h2 className="font-bold text-base">Installation</h2>
              <p className="text-xs" style={{ color: "#64748b" }}>Run these commands on the Windows machine you want to monitor</p>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <p className="text-xs font-semibold mb-2" style={{ color: "#64748b" }}>
                Step 1 — Create a <span className="font-mono">.env</span> file in the project root:
              </p>
              <CodeBlock label="project-root/.env" code={envConfig} />
            </div>

            <div>
              <p className="text-xs font-semibold mb-2" style={{ color: "#64748b" }}>
                Step 2 — Install Python dependencies:
              </p>
              <CodeBlock label="PowerShell / CMD"
                code={`pip install psutil requests pydantic pydantic-settings pywin32`} />
            </div>

            <div>
              <p className="text-xs font-semibold mb-2" style={{ color: "#64748b" }}>
                Step 3 — Start the agent (run as Administrator for full log access):
              </p>
              <CodeBlock label="PowerShell (Administrator)" code={`python -m agent.main`} />
            </div>

            <div>
              <p className="text-xs font-semibold mb-2" style={{ color: "#64748b" }}>
                Or use the batch file (double-click):
              </p>
              <CodeBlock label="Windows Explorer" code={`start_agent.bat`} />
            </div>

            <div className="rounded-lg p-3 border"
              style={{ background: "rgba(251,191,36,0.05)", borderColor: "rgba(251,191,36,0.2)" }}>
              <div className="flex items-start gap-2">
                <AlertTriangle size={14} className="shrink-0 mt-0.5" style={{ color: "#fbbf24" }} />
                <p className="text-xs" style={{ color: "#94a3b8" }}>
                  Run as <strong>Administrator</strong> to enable Windows Security Event Log collection
                  (failed logins, account lockouts). Process and network monitoring work without admin rights.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── 4. Connection Status ── */}
        <section id="status" className="rounded-xl border p-6 space-y-4"
          style={{ background: "var(--card)", borderColor: "var(--border)" }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: "rgba(0,212,255,0.12)", color: "var(--accent)" }}>
                <Monitor size={16} />
              </div>
              <div>
                <h2 className="font-bold text-base">Agent Connection Status</h2>
                <p className="text-xs" style={{ color: "#64748b" }}>Devices currently sending logs to this backend</p>
              </div>
            </div>
            <button onClick={loadDevices}
              className="p-1.5 rounded border transition-all hover:border-cyan-400"
              style={{ borderColor: "var(--border)", color: "#64748b" }}>
              <RefreshCw size={14} className={loadingDevices ? "animate-spin" : ""} />
            </button>
          </div>

          {loadingDevices ? (
            <div className="text-center py-8">
              <RefreshCw size={20} className="animate-spin mx-auto mb-2" style={{ color: "#475569" }} />
              <p className="text-xs" style={{ color: "#475569" }}>Checking connected agents...</p>
            </div>
          ) : devices.length === 0 ? (
            <div className="rounded-xl border p-8 text-center"
              style={{ background: "var(--background)", borderColor: "var(--border)" }}>
              <WifiOff size={28} className="mx-auto mb-3" style={{ color: "#334155" }} />
              <p className="text-sm font-semibold mb-1" style={{ color: "#475569" }}>No agents connected yet</p>
              <p className="text-xs" style={{ color: "#334155" }}>Follow the installation steps above, then refresh.</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-3">
              {devices.map((d) => {
                const online = isOnline(d.last_seen);
                return (
                  <div key={d.hostname} className="rounded-xl border p-4"
                    style={{ background: "var(--background)", borderColor: online ? "rgba(34,197,94,0.25)" : "var(--border)" }}>
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-bold text-sm">{d.hostname}</span>
                      <span className="flex items-center gap-1.5 text-xs font-semibold"
                        style={{ color: online ? "#22c55e" : "#ef4444" }}>
                        {online ? <Wifi size={12} /> : <WifiOff size={12} />}
                        {online ? "Connected" : "Offline"}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { label: "OS", value: d.os },
                        { label: "IP Address", value: d.ip },
                        { label: "Agent Version", value: `v${AGENT_VERSION}` },
                        { label: "Last Log", value: lastSeen(d.last_seen) },
                      ].map((f) => (
                        <div key={f.label}>
                          <div className="text-xs" style={{ color: "#475569" }}>{f.label}</div>
                          <div className="text-xs font-semibold mt-0.5" style={{ color: "#94a3b8" }}>{f.value}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* ── 5. Troubleshooting ── */}
        <section className="rounded-xl border p-6 space-y-3"
          style={{ background: "var(--card)", borderColor: "var(--border)" }}>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: "rgba(249,115,22,0.12)", color: "#f97316" }}>
              <AlertTriangle size={16} />
            </div>
            <div>
              <h2 className="font-bold text-base">Troubleshooting</h2>
              <p className="text-xs" style={{ color: "#64748b" }}>Agent not sending logs? Check these items.</p>
            </div>
          </div>

          {TROUBLESHOOT.map((t, i) => (
            <div key={i} className="rounded-lg border overflow-hidden"
              style={{ borderColor: "var(--border)" }}>
              <button
                className="w-full flex items-center justify-between px-4 py-3 text-left transition-colors hover:bg-slate-800"
                style={{ background: "var(--background)" }}
                onClick={() => setOpenTrouble(openTrouble === i ? null : i)}>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{ background: "rgba(249,115,22,0.12)", color: "#f97316" }}>{i + 1}</div>
                  <span className="text-sm font-medium">{t.check}</span>
                </div>
                {openTrouble === i ? <ChevronUp size={14} style={{ color: "#475569" }} /> : <ChevronDown size={14} style={{ color: "#475569" }} />}
              </button>
              {openTrouble === i && (
                <div className="px-4 pb-4 pt-2 border-t space-y-2" style={{ borderColor: "var(--border)", background: "var(--card)" }}>
                  <div>
                    <p className="text-xs font-semibold mb-1" style={{ color: "#64748b" }}>Check command:</p>
                    <code className="block text-xs font-mono px-3 py-2 rounded"
                      style={{ background: "#0d1424", color: "#00d4ff" }}>{t.cmd}</code>
                  </div>
                  <div>
                    <p className="text-xs font-semibold mb-1" style={{ color: "#64748b" }}>Fix:</p>
                    <p className="text-xs" style={{ color: "#94a3b8" }}>{t.fix}</p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </section>

      </div>
    </div>
  );
}
