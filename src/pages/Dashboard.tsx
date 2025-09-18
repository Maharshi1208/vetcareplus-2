
import React from "react";
import StatCard from "../components/dashboard/StatCard";
import RecentActivity from "../components/dashboard/RecentActivity";
import AnalyticsLine from "../components/dashboard/AnalyticsLine";
import { PawPrint, CalendarDays, Users, DollarSign } from "lucide-react";
import ApiHealth from "../components/system/ApiHealth";


export default function Dashboard() {
  return (
    <div className="space-y-6">
      {/* Header + API health (UI-only) */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <ApiHealth />
      </div>

   {/* 1) Top KPI cards */}
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

      {/* 2) Charts row */}
      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2">
          <AnalyticsLine />
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-gray-600">Average Daily Sales</p>
          <div className="mt-2 text-2xl font-semibold">$28,450</div>
          <p className="mt-1 text-xs text-gray-500">
            Placeholder — we’ll wire backend later
          </p>
        </div>
      </div>

      {/* 3) Recent Activity */}
      <RecentActivity
        items={[
          {
            id: "1",
            type: "APPOINTMENT",
            when: "Today, 2:30 PM",
            who: "Ava Smith",
            pet: "Bella",
          },
          {
            id: "2",
            type: "INVOICE",
            when: "Today, 12:10 PM",
            who: "Oliver Chen",
            amount: "$120.00",
          },
          {
            id: "3",
            type: "PET_ADDED",
            when: "Yesterday, 6:40 PM",
            who: "Mia Patel",
            pet: "Simba",
          },
          {
            id: "4",
            type: "OWNER_ADDED",
            when: "Yesterday, 4:05 PM",
            who: "Liam Parker",
          },
        ]}
      />
    </div>
  );
}
