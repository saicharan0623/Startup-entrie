"use client";
import { useEffect, useState, useCallback } from "react";
import {
  Settings, Building2, Key, Users, Copy, CheckCircle,
  RefreshCw, Shield, Eye, EyeOff, Pencil, Trash2, ShieldAlert,
} from "lucide-react";
import RequireAuth from "@/components/RequireAuth";
import { useAuth } from "@/lib/auth";
import { fetchUsers, updateUserRole, deleteUser, regenerateApiKey, fetchRules, toggleRule } from "@/lib/api";

type User = {
  id: string;
  name: string;
  email: string;
  organization_name: string;
  organization_id: string;
  role: "admin" | "viewer";
  api_key: string;
  created_at: string;
  last_login: string | null;
};

type Rule = {
  rule_id: string;
  name: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  description: string;
  purpose: string;
  enabled: boolean;
};

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all"
      style={{
        background: copied ? "rgba(34,197,94,0.1)" : "rgba(0,212,255,0.08)",
        color: copied ? "#4ade80" : "var(--accent)",
        border: `1px solid ${copied ? "rgba(34,197,94,0.25)" : "rgba(0,212,255,0.2)"}`,
      }}
    >
      {copied ? <CheckCircle size={12} /> : <Copy size={12} />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

function SectionHeader({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle: string }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <div className="w-9 h-9 rounded-lg flex items-center justify-center"
        style={{ background: "rgba(0,212,255,0.1)", color: "var(--accent)" }}>
        {icon}
      </div>
      <div>
        <h2 className="font-bold text-base">{title}</h2>
        <p className="text-xs" style={{ color: "#64748b" }}>{subtitle}</p>
      </div>
    </div>
  );
}

function SettingsContent() {
  const { user, setUser, isAdmin } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [regenLoading, setRegenLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"org" | "apikey" | "users" | "rules">("org");

  // Rules state
  const [rules, setRules] = useState<Rule[]>([]);
  const [loadingRules, setLoadingRules] = useState(false);
  const [togglingRule, setTogglingRule] = useState<string | null>(null);

  const loadUsers = useCallback(async () => {
    setLoadingUsers(true);
    try {
      const data = await fetchUsers();
      setUsers(data.users ?? []);
    } catch { /* ignore */ }
    finally { setLoadingUsers(false); }
  }, []);

  const loadRules = useCallback(async () => {
    setLoadingRules(true);
    try {
      const data = await fetchRules();
      setRules(data.rules ?? []);
    } catch { /* ignore */ }
    finally { setLoadingRules(false); }
  }, []);

  useEffect(() => {
    if (activeTab === "users") loadUsers();
    if (activeTab === "rules") loadRules();
  }, [activeTab, loadUsers, loadRules]);

  const handleRoleChange = async (userId: string, newRole: string) => {
    await updateUserRole(userId, newRole);
    setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, role: newRole as "admin" | "viewer" } : u));
  };

  const handleDelete = async (userId: string) => {
    if (!confirm("Remove this user?")) return;
    await deleteUser(userId);
    setUsers((prev) => prev.filter((u) => u.id !== userId));
  };

  const handleRegenKey = async () => {
    if (!user) return;
    if (!confirm("Regenerate API key? Your current agent connections will need to be updated.")) return;
    setRegenLoading(true);
    try {
      const data = await regenerateApiKey(user.id);
      setUser({ ...user, api_key: data.api_key });
    } catch { /* ignore */ }
    finally { setRegenLoading(false); }
  };

  const handleToggleRule = async (ruleId: string, currentEnabled: boolean) => {
    if (!isAdmin) return;
    setTogglingRule(ruleId);
    try {
      await toggleRule(ruleId, !currentEnabled);
      setRules((prev) => prev.map((r) => r.rule_id === ruleId ? { ...r, enabled: !currentEnabled } : r));
    } catch { /* ignore */ }
    finally { setTogglingRule(null); }
  };

  const tabs = [
    { key: "org", label: "Organization", icon: <Building2 size={14} /> },
    { key: "apikey", label: "API Key", icon: <Key size={14} /> },
    { key: "users", label: "Users", icon: <Users size={14} /> },
    { key: "rules", label: "Detection Rules", icon: <ShieldAlert size={14} /> },
  ] as const;

  return (
    <div className="min-h-screen" style={{ background: "var(--background)" }}>

      {/* Top bar */}
      <div className="sticky top-16 z-40 border-b px-4 sm:px-6 lg:px-8 py-3 flex items-center gap-3"
        style={{ background: "rgba(10,15,30,0.97)", borderColor: "var(--border)", backdropFilter: "blur(12px)" }}>
        <Settings size={18} style={{ color: "var(--accent)" }} />
        <span className="font-bold text-sm">Settings</span>
        {isAdmin && (
          <span className="text-xs px-2 py-0.5 rounded-full"
            style={{ background: "rgba(168,85,247,0.1)", color: "#a855f7", border: "1px solid rgba(168,85,247,0.2)" }}>
            Admin
          </span>
        )}
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Tabs */}
        <div className="flex gap-1 mb-8 p-1 rounded-xl border w-fit"
          style={{ background: "var(--card)", borderColor: "var(--border)" }}>
          {tabs.map((t) => (
            <button key={t.key} onClick={() => setActiveTab(t.key)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all"
              style={{
                background: activeTab === t.key ? "var(--background)" : "transparent",
                color: activeTab === t.key ? "var(--accent)" : "#64748b",
                border: activeTab === t.key ? "1px solid var(--border)" : "1px solid transparent",
              }}>
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>

        {/* ── Tab: Organization ── */}
        {activeTab === "org" && (
          <div className="rounded-2xl border p-6"
            style={{ background: "var(--card)", borderColor: "var(--border)" }}>
            <SectionHeader
              icon={<Building2 size={18} />}
              title="Organization"
              subtitle="Your organization identity and contact details"
            />
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                { label: "Organization Name", value: user?.organization_name ?? "—" },
                { label: "Organization ID", value: user?.organization_id ?? "—", mono: true },
                { label: "Contact Email", value: user?.email ?? "—" },
                { label: "Your Name", value: user?.name ?? "—" },
                { label: "Role", value: user?.role === "admin" ? "Admin" : "Viewer" },
                { label: "Member Since", value: user?.created_at ? new Date(user.created_at).toLocaleDateString() : "—" },
              ].map((f) => (
                <div key={f.label} className="rounded-lg p-4 border"
                  style={{ background: "var(--background)", borderColor: "var(--border)" }}>
                  <div className="text-xs font-semibold mb-1" style={{ color: "#64748b" }}>{f.label}</div>
                  <div className={`text-sm ${(f as { mono?: boolean }).mono ? "font-mono" : "font-medium"}`}
                    style={{ color: "#e2e8f0" }}>
                    {f.value}
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-4 text-xs" style={{ color: "#334155" }}>
              Contact support to update organization details.
            </p>
          </div>
        )}

        {/* ── Tab: API Key ── */}
        {activeTab === "apikey" && (
          <div className="rounded-2xl border p-6 space-y-4"
            style={{ background: "var(--card)", borderColor: "var(--border)" }}>
            <SectionHeader
              icon={<Key size={18} />}
              title="API Key"
              subtitle="Used by the Windows agent to authenticate with the backend"
            />

            {/* Key display */}
            <div className="rounded-xl border p-4"
              style={{ background: "var(--background)", borderColor: "rgba(0,212,255,0.2)" }}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold" style={{ color: "#64748b" }}>Your API Key</span>
                <div className="flex gap-2">
                  <button onClick={() => setShowApiKey(!showApiKey)}
                    className="flex items-center gap-1 text-xs px-2 py-1 rounded border transition-all"
                    style={{ borderColor: "var(--border)", color: "#64748b" }}>
                    {showApiKey ? <EyeOff size={12} /> : <Eye size={12} />}
                    {showApiKey ? "Hide" : "Show"}
                  </button>
                  <CopyButton text={user?.api_key ?? ""} />
                </div>
              </div>
              <div className="font-mono text-sm break-all" style={{ color: "var(--accent)" }}>
                {showApiKey ? user?.api_key : "•".repeat(32)}
              </div>
            </div>

            {/* Info fields */}
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                { label: "Tenant ID", value: user?.organization_id ?? "—" },
                { label: "Status", value: "Active" },
              ].map((f) => (
                <div key={f.label} className="rounded-lg p-4 border"
                  style={{ background: "var(--background)", borderColor: "var(--border)" }}>
                  <div className="text-xs font-semibold mb-1" style={{ color: "#64748b" }}>{f.label}</div>
                  <div className="flex items-center gap-2">
                    {f.label === "Status" && <span className="w-2 h-2 rounded-full" style={{ background: "#22c55e" }} />}
                    <span className="text-sm font-medium font-mono" style={{ color: "#e2e8f0" }}>{f.value}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Regenerate — admin only */}
            {isAdmin && (
              <div className="rounded-xl border p-4"
                style={{ background: "rgba(249,115,22,0.04)", borderColor: "rgba(249,115,22,0.2)" }}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold mb-0.5">Regenerate API Key</div>
                    <div className="text-xs" style={{ color: "#64748b" }}>
                      This will invalidate the current key. Update your agent config after regenerating.
                    </div>
                  </div>
                  <button onClick={handleRegenKey} disabled={regenLoading}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-50"
                    style={{ background: "rgba(249,115,22,0.12)", color: "#f97316", border: "1px solid rgba(249,115,22,0.25)" }}>
                    <RefreshCw size={14} className={regenLoading ? "animate-spin" : ""} />
                    Regenerate
                  </button>
                </div>
              </div>
            )}

            {/* Usage snippet */}
            <div className="rounded-xl border overflow-hidden"
              style={{ borderColor: "#1e293b" }}>
              <div className="px-4 py-2 border-b flex items-center justify-between"
                style={{ background: "#111827", borderColor: "#1e293b" }}>
                <span className="text-xs font-mono" style={{ color: "#475569" }}>agent/.env</span>
                <CopyButton text={`ENTRIALERT_API_KEY=${user?.api_key}\nENTRIALERT_TENANT_ID=${user?.organization_id}`} />
              </div>
              <div className="px-4 py-3" style={{ background: "#0d1424" }}>
                <pre className="text-xs font-mono" style={{ color: "#00d4ff" }}>
{`ENTRIALERT_API_KEY=${user?.api_key ?? "your-api-key"}
ENTRIALERT_TENANT_ID=${user?.organization_id ?? "your-tenant-id"}`}
                </pre>
              </div>
            </div>
          </div>
        )}

        {/* ── Tab: Users ── */}
        {activeTab === "users" && (
          <div className="rounded-2xl border p-6"
            style={{ background: "var(--card)", borderColor: "var(--border)" }}>
            <SectionHeader
              icon={<Users size={18} />}
              title="User Management"
              subtitle={isAdmin ? "Manage team members and their roles" : "View team members in your organization"}
            />

            {loadingUsers ? (
              <div className="py-12 text-center">
                <RefreshCw size={20} className="animate-spin mx-auto mb-2" style={{ color: "#475569" }} />
                <p className="text-sm" style={{ color: "#475569" }}>Loading users...</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border" style={{ borderColor: "var(--border)" }}>
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ background: "var(--background)", borderBottom: "1px solid var(--border)" }}>
                      {["Name", "Email", "Organization", "Role", "Joined", isAdmin ? "Actions" : ""].map((h) => h && (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold"
                          style={{ color: "#64748b" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u, i) => (
                      <tr key={u.id}
                        style={{ borderBottom: i < users.length - 1 ? "1px solid var(--border)" : "none" }}>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                              style={{ background: "rgba(0,212,255,0.1)", color: "var(--accent)" }}>
                              {u.name.charAt(0).toUpperCase()}
                            </div>
                            <span className="font-medium">{u.name}</span>
                            {u.id === user?.id && (
                              <span className="text-xs px-1.5 py-0.5 rounded"
                                style={{ background: "rgba(0,212,255,0.1)", color: "var(--accent)" }}>you</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs" style={{ color: "#94a3b8" }}>{u.email}</td>
                        <td className="px-4 py-3 text-xs" style={{ color: "#94a3b8" }}>{u.organization_name}</td>
                        <td className="px-4 py-3">
                          <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                            style={{
                              background: u.role === "admin" ? "rgba(168,85,247,0.1)" : "rgba(100,116,139,0.1)",
                              color: u.role === "admin" ? "#a855f7" : "#64748b",
                              border: `1px solid ${u.role === "admin" ? "rgba(168,85,247,0.2)" : "rgba(100,116,139,0.15)"}`,
                            }}>
                            {u.role === "admin" ? "Admin" : "Viewer"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs" style={{ color: "#64748b" }}>
                          {new Date(u.created_at).toLocaleDateString()}
                        </td>
                        {isAdmin && (
                          <td className="px-4 py-3">
                            {u.id !== user?.id ? (
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleRoleChange(u.id, u.role === "admin" ? "viewer" : "admin")}
                                  className="flex items-center gap-1 text-xs px-2 py-1 rounded border transition-all hover:opacity-80"
                                  style={{ borderColor: "var(--border)", color: "#94a3b8" }}>
                                  <Pencil size={11} />
                                  {u.role === "admin" ? "Make Viewer" : "Make Admin"}
                                </button>
                                <button
                                  onClick={() => handleDelete(u.id)}
                                  className="flex items-center gap-1 text-xs px-2 py-1 rounded border transition-all hover:opacity-80"
                                  style={{ borderColor: "rgba(239,68,68,0.25)", color: "#f87171" }}>
                                  <Trash2 size={11} />
                                  Remove
                                </button>
                              </div>
                            ) : (
                              <span className="text-xs" style={{ color: "#334155" }}>—</span>
                            )}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {!isAdmin && (
              <p className="mt-4 text-xs" style={{ color: "#334155" }}>
                <Shield size={11} className="inline mr-1" />
                Only admins can change roles or remove users.
              </p>
            )}
          </div>
        )}

        {/* ── Tab: Detection Rules ── */}
        {activeTab === "rules" && (
          <div className="rounded-2xl border p-6"
            style={{ background: "var(--card)", borderColor: "var(--border)" }}>
            <SectionHeader
              icon={<ShieldAlert size={18} />}
              title="Detection Rules"
              subtitle={isAdmin ? "Enable or disable beta detection rules" : "View active detection rules"}
            />

            {/* Stats row */}
            <div className="flex gap-3 mb-5 flex-wrap">
              {[
                { label: "Total Rules", value: rules.length, color: "var(--accent)" },
                { label: "Enabled", value: rules.filter((r) => r.enabled).length, color: "#22c55e" },
                { label: "Disabled", value: rules.filter((r) => !r.enabled).length, color: "#64748b" },
              ].map((s) => (
                <div key={s.label} className="flex items-center gap-2 px-3 py-2 rounded-lg border"
                  style={{ background: "var(--background)", borderColor: "var(--border)" }}>
                  <span className="text-lg font-extrabold" style={{ color: s.color }}>{s.value}</span>
                  <span className="text-xs" style={{ color: "#64748b" }}>{s.label}</span>
                </div>
              ))}
            </div>

            {loadingRules ? (
              <div className="py-12 text-center">
                <RefreshCw size={20} className="animate-spin mx-auto mb-2" style={{ color: "#475569" }} />
                <p className="text-sm" style={{ color: "#475569" }}>Loading rules...</p>
              </div>
            ) : (
              <div className="space-y-2">
                {rules.map((rule) => {
                  const severityColor = {
                    CRITICAL: "#ef4444",
                    HIGH: "#f97316",
                    MEDIUM: "#eab308",
                    LOW: "#64748b",
                  }[rule.severity] ?? "#64748b";

                  return (
                    <div key={rule.rule_id}
                      className="rounded-xl border p-4 transition-all"
                      style={{
                        background: "var(--background)",
                        borderColor: rule.enabled ? "var(--border)" : "rgba(100,116,139,0.15)",
                        opacity: rule.enabled ? 1 : 0.55,
                      }}>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          {/* Rule ID badge */}
                          <span className="shrink-0 text-xs font-bold px-2 py-1 rounded font-mono"
                            style={{ background: "rgba(0,212,255,0.08)", color: "var(--accent)", border: "1px solid rgba(0,212,255,0.15)" }}>
                            {rule.rule_id}
                          </span>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <span className="font-semibold text-sm">{rule.name}</span>
                              <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                                style={{
                                  background: `${severityColor}18`,
                                  color: severityColor,
                                  border: `1px solid ${severityColor}30`,
                                }}>
                                {rule.severity}
                              </span>
                            </div>
                            <p className="text-xs leading-relaxed" style={{ color: "#64748b" }}>
                              {rule.description}
                            </p>
                            <p className="text-xs mt-1" style={{ color: "#475569" }}>
                              <span style={{ color: "#334155" }}>Purpose: </span>{rule.purpose}
                            </p>
                          </div>
                        </div>

                        {/* Toggle */}
                        <div className="shrink-0 flex items-center gap-2">
                          <span className="text-xs" style={{ color: rule.enabled ? "#22c55e" : "#64748b" }}>
                            {rule.enabled ? "Enabled" : "Disabled"}
                          </span>
                          <button
                            onClick={() => handleToggleRule(rule.rule_id, rule.enabled)}
                            disabled={!isAdmin || togglingRule === rule.rule_id}
                            title={isAdmin ? (rule.enabled ? "Disable rule" : "Enable rule") : "Admin only"}
                            className="relative w-10 h-5 rounded-full transition-all disabled:cursor-not-allowed"
                            style={{
                              background: rule.enabled ? "#22c55e" : "#1e293b",
                              border: `1px solid ${rule.enabled ? "rgba(34,197,94,0.4)" : "var(--border)"}`,
                              opacity: !isAdmin ? 0.5 : 1,
                            }}
                          >
                            <span
                              className="absolute top-0.5 w-4 h-4 rounded-full transition-all"
                              style={{
                                background: rule.enabled ? "white" : "#475569",
                                left: rule.enabled ? "calc(100% - 1.1rem)" : "2px",
                              }}
                            />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {!isAdmin && (
              <p className="mt-4 text-xs" style={{ color: "#334155" }}>
                <Shield size={11} className="inline mr-1" />
                Only admins can enable or disable rules.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <RequireAuth>
      <SettingsContent />
    </RequireAuth>
  );
}
