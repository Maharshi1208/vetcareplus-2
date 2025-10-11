// src/pages/Dashboard.tsx
import React, { useMemo } from "react";
import StatCard from "../components/dashboard/StatCard";
import RecentActivity from "../components/dashboard/RecentActivity";
import AnalyticsLine from "../components/dashboard/AnalyticsLine";
import { PawPrint, CalendarDays, Users, DollarSign } from "lucide-react";
import ApiHealth from "../components/system/ApiHealth";
import { useMetrics } from "../hooks/useMetrics";   // ← normalized metrics (summary, appts, today)
import { useAuth } from "../context/AuthContext";

type ApiScheduleRow = {
  id: string;
  start: string; // ISO
  end: string;   // ISO
  status: "BOOKED" | "COMPLETED" | "CANCELLED" | "NO_SHOW";
  reason?: string | null;
  pet?: { id: string; name: string; ownerId?: string } | null;
  vet?: { id: string; name: string } | null;
};

type UiScheduleRow = {
  id: string;
  time: string;
  pet: string;
  owner: string;
  vet: string;
  reason?: string;
  status: "Booked" | "Completed" | "Cancelled" | "No show";
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
    "No show": "border-amber-200 bg-amber-50 text-amber-700",
  };
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs ${map[s]}`}>
      {s}
    </span>
  );
}

export default function Dashboard() {
  const { token } = useAuth();
  const { summary, appointments, todaySchedule } = useMetrics(token ?? "");

  // Transform API -> UI rows
  const scheduleRows: UiScheduleRow[] = useMemo(() => {
    const toHHMM = (d: Date) =>
      `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
    const src = (todaySchedule.data ?? []) as ApiScheduleRow[];
    return src.map((a) => {
      const start = new Date(a.start);
      const end = new Date(a.end);
      return {
        id: a.id,
        time: `${toHHMM(start)}–${toHHMM(end)}`,
        pet: a.pet?.name ?? "—",
        owner: "", // optional: add if backend returns owner
        vet: a.vet?.name ?? "—",
        reason: a.reason ?? undefined,
        status:
          a.status === "COMPLETED"
            ? "Completed"
            : a.status === "CANCELLED"
            ? "Cancelled"
            : a.status === "NO_SHOW"
            ? "No show"
            : "Booked",
      };
    });
  }, [todaySchedule.data]);

  // Group by vet for display
  const groupedByVet = useMemo(() => {
    const m = new Map<string, UiScheduleRow[]>();
    for (const r of scheduleRows) {
      if (!m.has(r.vet)) m.set(r.vet, []);
      m.get(r.vet)!.push(r);
    }
    return Array.from(m.entries());
  }, [scheduleRows]);

  function exportCSV() {
    const headers = ["Time", "Vet", "Pet", "Owner", "Reason", "Status", "Room"];
    const lines = [headers.join(",")];
    for (const r of scheduleRows) {
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

      {/* KPI cards */}
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

      {/* Analytics + Recent Activity */}
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

      {/* Today’s Schedule (LIVE via /api/metrics/schedule/today) */}
      <div className="rounded-2xl border bg-white shadow-sm">
        <div className="flex items-center justify-between border-b p-4">
          <div>
            <h2 className="text-base font-medium">Today’s Schedule (by Vet)</h2>
            <p className="text-xs text-gray-500">Live from /api/metrics/schedule/today</p>
          </div>
          <button
            onClick={exportCSV}
            className="rounded-xl bg-gradient-to-r from-blue-700 to-teal-700 px-4 py-2 text-sm text-white shadow-sm hover:opacity-90 disabled:opacity-60"
            title="Download CSV"
            disabled={todaySchedule.isLoading || scheduleRows.length === 0}
          >
            Export CSV
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-6">
          {todaySchedule.error && (
            <div className="text-sm text-rose-600">
              {(todaySchedule.error as Error).message || "Failed to load schedule"}
            </div>
          )}
          {todaySchedule.isLoading && <div className="text-sm text-gray-600">Loading schedule…</div>}

          {!todaySchedule.isLoading &&
            groupedByVet.map(([vet, rows]) => (
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

          {!todaySchedule.isLoading && groupedByVet.length === 0 && (
            <div className="text-sm text-gray-600">No appointments scheduled today.</div>
          )}
        </div>
      </div>
    </div>
  );
}
