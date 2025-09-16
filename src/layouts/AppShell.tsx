import React from "react";
import { NavLink, Link } from "react-router-dom";

const nav = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/pets", label: "Pets" },
  { to: "/vets", label: "Vets" },
  { to: "/owners", label: "Owners" },
  { to: "/appointments", label: "Appointments" },
  { to: "/invoices", label: "Invoices" },
  { to: "/health", label: "Health" },
  { to: "/settings", label: "Settings" },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-accent-300 to-brand-200 bg-fixed text-gray-900 flex">
      {/* Sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-r bg-white/90 backdrop-blur-sm">
        <div className="h-16 flex items-center gap-2 px-4 border-b">
          <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-accent-500 to-brand-500 grid place-items-center text-white font-bold">V</div>
          <Link to="/dashboard" className="text-lg font-semibold">VetCare+</Link>
        </div>

        <nav className="p-3 space-y-1">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                [
                  "flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition",
                  isActive
                    ? "bg-white border border-accent-200 text-accent-700 shadow"
                    : "text-gray-700 hover:bg-white/70",
                ].join(" ")
              }
            >
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Main column */}
      <div className="flex-1 flex flex-col">
        {/* Topbar */}
        <header className="h-16 bg-white/90 backdrop-blur-sm border-b flex items-center justify-between px-4">
          {/* Search (left) */}
          <div className="relative flex-1 max-w-xl">
            <input
              placeholder="Search…"
              className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent-500/30"
            />
          </div>

          {/* Right side */}
          <div className="ml-4 flex items-center gap-4">
            <Link
              to="/login"
              className="text-sm font-medium text-accent-700 hover:text-accent-900"
            >

              
            </Link>
            <div className="h-8 w-8 rounded-full bg-gradient-to-r from-accent-500 to-brand-500 text-white grid place-items-center text-xs font-bold">
              SR
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
