// src/pages/Dashboard.tsx
// src/pages/Dashboard.tsx
import React, { useEffect, useMemo, useState } from "react";
import StatCard from "../components/dashboard/StatCard";
import RecentActivity from "../components/dashboard/RecentActivity";
import AnalyticsLine from "../components/dashboard/AnalyticsLine";
import { PawPrint, CalendarDays, Users, DollarSign } from "lucide-react";
import ApiHealth from "../components/system/ApiHealth";
import { useMetrics } from "../hooks/useMetrics";          // ← live metrics
import { useAuth } from "../context/AuthContext";           // ← must provide token

type ApiScheduleRow = {
  id: string;
  start: string;               // ISO date
  end: string;                 // ISO date
  status: "BOOKED" | "COMPLETED" | "CANCELLED";
  reason?: string | null;
  pet: { name: string; ownerId?: string } | null;
  vet: { name: string } | null;
};

type UiScheduleRow = {
  id: string;
  time: string;
  pet: string;
  owner: string;
  vet: string;
  reason?: string;
  status: "Booked" | "Completed" | "Cancelled";
  room?: string;
};

function fmtCents(cents: number | undefined) {
  const n = (cents ?? 0) / 100;
  return n.toLocaleString(undefined, { style: "currency", currency: "CAD" });
}

function statusBadge(s: UiScheduleRow["status"]) {
  const map: Record<UiScheduleRow["status"], string> = {
    Booked: "border-sky-200 bg-sky-50 text-sky-700",
    Completed: "border-emerald-200 bg-emerald-50 text-emerald-700",
    Cancelled: "border-rose-200 bg-rose-50 text-rose-700",
  };
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs ${map[s]}`}>
      {s}
    </span>
  );
}

export default function Dashboard() {
  const { token } = useAuth();
  const { summary, appointments } = useMetrics(token);

  // ---------- LIVE today schedule ----------
  const [schedule, setSchedule] = useState<UiScheduleRow[]>([]);
  const [schedLoading, setSchedLoading] = useState(false);
  const [schedErr, setSchedErr] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        setSchedLoading(true);
        setSchedErr(null);
        const res = await fetch(
          `${import.meta.env.VITE_API_URL || "http://localhost:4000"}/metrics/schedule/today`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (!res.ok) throw new Error(await res.text());
        const json: { ok: boolean; data: ApiScheduleRow[] } = await res.json();
        const rows: UiScheduleRow[] = (json.data || []).map((a) => {
          const start = new Date(a.start);
          const end = new Date(a.end);
          const pad = (n: number) => String(n).padStart(2, "0");
          const hhmm = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;
          return {
            id: a.id,
            time: `${hhmm(start)}–${hhmm(end)}`,
            pet: a.pet?.name ?? "—",
            owner: "", // optional: fetch owner name if you include it in API
            vet: a.vet?.name ?? "—",
            reason: a.reason ?? undefined,
            status:
              a.status === "COMPLETED" ? "Completed" :
              a.status === "CANCELLED" ? "Cancelled" : "Booked",
          };
        });
        setSchedule(rows);
      } catch (e: any) {
        setSchedErr(e?.message || "Failed to load schedule");
      } finally {
        setSchedLoading(false);
      }
    })();
  }, [token]);

  // group schedule by vet
  const groupedByVet = useMemo(() => {
    const m = new Map<string, UiScheduleRow[]>();
    for (const r of schedule) {
      if (!m.has(r.vet)) m.set(r.vet, []);
      m.get(r.vet)!.push(r);
    }
    return Array.from(m.entries());
  }, [schedule]);

  // CSV export (now uses live schedule)
  function exportCSV() {
    const headers = ["Time", "Vet", "Pet", "Owner", "Reason", "Status", "Room"];
    const lines = [headers.join(",")];
    for (const r of schedule) {
      const row = [r.time, r.vet, r.pet, r.owner, r.reason ?? "", r.status, r.room ?? ""]
        .map((v) => `"${String(v).replaceAll('"', '""')}"`)
        .join(",");
      lines.push(row);
    }
    const csv = lines.join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `dashboard_schedule_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      {/* Header + API health */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <ApiHealth />
      </div>

      {/* KPI cards — now LIVE */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Pets"
          value={summary.data?.totalPets ?? "—"}
          hint="All-time registered"
          icon={<PawPrint size={18} />}
          gradient="bg-gradient-to-br from-sky-500 to-emerald-500"
          loading={summary.isLoading}
        />
        <StatCard
          label="Upcoming Appointments"
          value={summary.data?.upcoming7 ?? "—"}
          hint="Next 7 days"
          icon={<CalendarDays size={18} />}
          gradient="bg-gradient-to-br from-fuchsia-500 to-sky-500"
          loading={summary.isLoading}
        />
        <StatCard
          label="Owners"
          value={summary.data?.activeOwners ?? "—"}
          hint="Active profiles"
          icon={<Users size={18} />}
          gradient="bg-gradient-to-br from-amber-500 to-rose-500"
          loading={summary.isLoading}
        />
        <StatCard
          label="Revenue (MTD)"
          value={fmtCents(summary.data?.revenueMtd)}
          hint="Month to date"
          icon={<DollarSign size={18} />}
          gradient="bg-gradient-to-br from-indigo-500 to-cyan-500"
          loading={summary.isLoading}
        />
      </div>

      {/* Analytics + Recent Activity (keep your components; wire data as you like) */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border bg-white p-4 shadow-sm lg:col-span-2">
          <div className="mb-2 text-sm font-medium">Appointments (last 7 days)</div>
          <AnalyticsLine data={appointments.data ?? []} loading={appointments.isLoading} />
        </div>
        <div className="rounded-2xl border bg-white p-4 shadow-sm">
          <div className="mb-2 text-sm font-medium">Recent Activity</div>
          <RecentActivity />
        </div>
      </div>

      {/* Today’s Schedule (LIVE) */}
      <div className="rounded-2xl border bg-white shadow-sm">
        <div className="flex items-center justify-between border-b p-4">
          <div>
            <h2 className="text-base font-medium">Today’s Schedule (by Vet)</h2>
            <p className="text-xs text-gray-500">Live from /metrics/schedule/today</p>
          </div>
          <button
            onClick={exportCSV}
            className="rounded-xl bg-gradient-to-r from-blue-700 to-teal-700 px-4 py-2 text-sm text-white shadow-sm hover:opacity-90 disabled:opacity-60"
            title="Download CSV"
            disabled={schedLoading || schedule.length === 0}
          >
            Export CSV
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-6">
          {schedErr && <div className="text-sm text-rose-600">{schedErr}</div>}
          {schedLoading && <div className="text-sm text-gray-600">Loading schedule…</div>}

          {!schedLoading && groupedByVet.map(([vet, rows]) => (
            <div key={vet} className="space-y-2">
              <div className="text-sm font-semibold">{vet}</div>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-50 text-left text-sm text-gray-600">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Time</th>
                      <th className="px-4 py-3 font-semibold">Pet</th>
                      <th className="px-4 py-3 font-semibold">Owner</th>
                      <th className="px-4 py-3 font-semibold">Reason</th>
                      <th className="px-4 py-3 font-semibold">Status</th>
                      <th className="px-4 py-3 font-semibold">Room</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y text-sm">
                    {rows.map((r) => (
                      <tr key={r.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 whitespace-nowrap">{r.time}</td>
                        <td className="px-4 py-3">{r.pet}</td>
                        <td className="px-4 py-3">{r.owner || "—"}</td>
                        <td className="px-4 py-3">{r.reason ?? "—"}</td>
                        <td className="px-4 py-3">{statusBadge(r.status)}</td>
                        <td className="px-4 py-3">{r.room ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}

          {!schedLoading && groupedByVet.length === 0 && (
            <div className="text-sm text-gray-600">No appointments scheduled today.</div>
          )}
        </div>
      </div>
    </div>
  );
}
