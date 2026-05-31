const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

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
