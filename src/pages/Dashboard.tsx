// src/pages/Dashboard.tsx
import React, { useMemo } from "react";
import StatCard from "../components/dashboard/StatCard";
import RecentActivity from "../components/dashboard/RecentActivity";
import AnalyticsLine from "../components/dashboard/AnalyticsLine";
import { PawPrint, CalendarDays, Users, DollarSign } from "lucide-react";
import ApiHealth from "../components/system/ApiHealth";

// ---------------- UI-only mock for the new Reports block ----------------
type ScheduleRow = {
  id: string;
  time: string; // e.g. "09:00–09:30"
  pet: string;
  owner: string;
  vet: string;
  reason?: string;
  status: "Booked" | "Completed" | "Cancelled";
  room?: string;
};

const MOCK_SCHEDULE: ScheduleRow[] = [
  { id: "s1", time: "09:00–09:30", pet: "Buddy", owner: "Alice Johnson", vet: "Dr. Anna Smith", reason: "Checkup", status: "Booked", room: "R1" },
  { id: "s2", time: "10:00–10:45", pet: "Misty", owner: "Alice Johnson", vet: "Dr. Brian Lee", reason: "Skin rash", status: "Completed", room: "R2" },
  { id: "s3", time: "11:30–12:00", pet: "Kiwi",  owner: "Bob Patel",     vet: "Dr. Carla Gomez", reason: "Beak trim", status: "Cancelled", room: "R1" },
  { id: "s4", time: "13:15–13:45", pet: "Luna",  owner: "Charlie Kim",    vet: "Dr. Brian Lee", reason: "Vaccination", status: "Booked", room: "R3" },
  { id: "s5", time: "15:00–15:20", pet: "Milo",  owner: "Bob Patel",      vet: "Dr. Anna Smith", reason: "Follow-up", status: "Booked", room: "R2" },
];

function statusBadge(s: ScheduleRow["status"]) {
  const map: Record<ScheduleRow["status"], string> = {
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
  // group schedule by vet (UI-only)
  const groupedByVet = useMemo(() => {
    const m = new Map<string, ScheduleRow[]>();
    for (const r of MOCK_SCHEDULE) {
      if (!m.has(r.vet)) m.set(r.vet, []);
      m.get(r.vet)!.push(r);
    }
    return Array.from(m.entries()); // [ [vet, rows[]], ... ]
  }, []);

  // simple CSV export (UI-only)
  function exportCSV() {
    const headers = ["Time", "Vet", "Pet", "Owner", "Reason", "Status", "Room"];
    const lines = [headers.join(",")];
    for (const r of MOCK_SCHEDULE) {
      const row = [
        r.time, r.vet, r.pet, r.owner, r.reason ?? "", r.status, r.room ?? "",
      ]
        .map((v) => `"${String(v).replaceAll('"', '""')}"`)
        .join(",");
      lines.push(row);
    }
    const csv = lines.join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `dashboard_schedule_${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      {/* Header + API health (kept AND enhanced) */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <ApiHealth />
      </div>

      {/* 1) Top KPI cards (UNCHANGED: your colorful gradient StatCards) */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Pets"
          value={128}
          hint="All-time registered"
          icon={<PawPrint size={18} />}
          gradient="bg-gradient-to-br from-sky-500 to-emerald-500"
        />

        <StatCard
          label="Upcoming Appointments"
          value={23}
          hint="Next 7 days"
          icon={<CalendarDays size={18} />}
          gradient="bg-gradient-to-br from-fuchsia-500 to-sky-500"
        />

        <StatCard
          label="Owners"
          value={86}
          hint="Active profiles"
          icon={<Users size={18} />}
          gradient="bg-gradient-to-br from-amber-500 to-rose-500"
        />

        <StatCard
          label="Revenue (MTD)"
          value="$12,430"
          hint="Month to date"
          icon={<DollarSign size={18} />}
          gradient="bg-gradient-to-br from-indigo-500 to-cyan-500"
        />
      </div>

      {/* 2) Your existing analytics + activity (UNCHANGED) */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border bg-white p-4 shadow-sm lg:col-span-2">
          <div className="mb-2 text-sm font-medium">Appointments (last 7 days)</div>
          <AnalyticsLine />
        </div>
        <div className="rounded-2xl border bg-white p-4 shadow-sm">
          <div className="mb-2 text-sm font-medium">Recent Activity</div>
          <RecentActivity />
        </div>
      </div>

      {/* 3) NEW: Reports block, added AFTER your original UI */}
      <div className="rounded-2xl border bg-white shadow-sm">
        <div className="flex items-center justify-between border-b p-4">
          <div>
            <h2 className="text-base font-medium">Today’s Schedule (by Vet)</h2>
            <p className="text-xs text-gray-500">UI-only, grouped by veterinarian.</p>
          </div>
          <button
            onClick={exportCSV}
            className="rounded-xl border px-3 py-2 text-sm hover:bg-gray-50"
            title="Download CSV (UI-only)"
          >
            Export CSV
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-6">
          {groupedByVet.map(([vet, rows]) => (
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
                        <td className="px-4 py-3">{r.owner}</td>
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

          {groupedByVet.length === 0 && (
            <div className="text-sm text-gray-600">No appointments scheduled today.</div>
          )}
        </div>
      </div>
    </div>
  );
}
