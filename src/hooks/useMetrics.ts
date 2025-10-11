// src/hooks/useMetrics.ts
import { useQuery } from "@tanstack/react-query";

// --- BASE URL: force /api suffix even if env is missing it ---
let RAW = import.meta.env.VITE_API_URL || "http://localhost:4000";
if (!/\/api\/?$/.test(RAW)) RAW = RAW.replace(/\/+$/, "") + "/api";
const API_URL = RAW.replace(/\/+$/, "");

// --- Tiny helper with nicer errors & JSON fallback ---
async function api<T>(path: string, token: string): Promise<T> {
  const url = `${API_URL}${path.startsWith("/") ? path : `/${path}`}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const text = await res.text().catch(() => "");
  const data = text ? (() => { try { return JSON.parse(text); } catch { return text; } })() : null;

  if (!res.ok) {
    const msg =
      (data && typeof data === "object" && ("error" in data || "message" in data) &&
        ((data as any).error || (data as any).message)) ||
      `HTTP ${res.status}`;
    throw new Error(String(msg));
  }

  return data as T;
}

type SummaryResp = { ok: true; data: any };
type ApptsResp   = { ok: true; data: any[] } | { ok: true; appointments: any[] };
type TodayResp   = { ok: true; data: any[] } | { ok: true; schedule: any[] };

export function useMetrics(token: string) {
  // Summary (cards)
  const summary = useQuery({
    queryKey: ["metrics", "summary"],
    queryFn: () => api<SummaryResp>("/metrics/summary", token).then((r) => r.data),
    enabled: !!token,
    refetchInterval: 15_000,
  });

  // Appointments last 7 days (chart)
  const appointments = useQuery({
    queryKey: ["metrics", "appointments", 7],
    queryFn: () =>
      api<ApptsResp>("/metrics/appointments?days=7", token).then((r: any) => r.data ?? r.appointments ?? []),
    enabled: !!token,
    refetchInterval: 30_000,
  });

  // Optional: today's schedule by vet (dashboard table/card)
  const todaySchedule = useQuery({
    queryKey: ["metrics", "schedule", "today"],
    queryFn: () =>
      api<TodayResp>("/metrics/schedule/today", token).then((r: any) => r.data ?? r.schedule ?? []),
    enabled: !!token,
    refetchInterval: 30_000,
  });

  return { summary, appointments, todaySchedule };
}
