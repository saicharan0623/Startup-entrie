const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export async function fetchCompliance() {
  const res = await fetch(`${BASE}/api/compliance`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch compliance data");
  return res.json();
}

export async function fetchDecision(id: string) {
  const res = await fetch(`${BASE}/api/decisions/${id}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Decision not found");
  return res.json();
}

export async function fetchDecisions(limit = 50, severity?: string) {
  const params = new URLSearchParams({ limit: String(limit) });
  if (severity) params.set("severity", severity);
  const res = await fetch(`${BASE}/api/decisions?${params}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch decisions");
  return res.json();
}

export async function fetchStats() {
  const res = await fetch(`${BASE}/api/stats`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch stats");
  return res.json();
}

export async function fetchDevices() {
  const res = await fetch(`${BASE}/api/devices`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch devices");
  return res.json();
}

export async function submitFeedback(decisionId: string, action: string, note = "") {
  const res = await fetch(`${BASE}/api/decisions/${decisionId}/feedback`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, note }),
  });
  if (!res.ok) throw new Error("Failed to submit feedback");
  return res.json();
}

// ── Auth ──────────────────────────────────────────────────────────────────────

export async function registerUser(data: {
  name: string;
  email: string;
  password: string;
  organization_name: string;
}) {
  const res = await fetch(`${BASE}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail ?? "Registration failed");
  }
  return res.json();
}

export async function loginUser(email: string, password: string) {
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail ?? "Login failed");
  }
  return res.json();
}

// ── Users ─────────────────────────────────────────────────────────────────────

export async function fetchUsers() {
  const res = await fetch(`${BASE}/api/users`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch users");
  return res.json();
}

export async function updateUserRole(userId: string, role: string) {
  const res = await fetch(`${BASE}/api/users/${userId}/role`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ role }),
  });
  if (!res.ok) throw new Error("Failed to update role");
  return res.json();
}

export async function deleteUser(userId: string) {
  const res = await fetch(`${BASE}/api/users/${userId}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete user");
  return res.json();
}

export async function regenerateApiKey(userId: string) {
  const res = await fetch(`${BASE}/api/users/${userId}/regenerate-key`, { method: "POST" });
  if (!res.ok) throw new Error("Failed to regenerate key");
  return res.json();
}

// ── Rules ─────────────────────────────────────────────────────────────────────

export async function fetchRules() {
  const res = await fetch(`${BASE}/api/rules`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch rules");
  return res.json();
}

export async function toggleRule(ruleId: string, enabled: boolean) {
  const res = await fetch(`${BASE}/api/rules/${ruleId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ enabled }),
  });
  if (!res.ok) throw new Error("Failed to update rule");
  return res.json();
}
