import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import logo from "../assets/logofinal.png";
import { motion } from "framer-motion";
import ChatBot from "../components/ChatBot"; // ✅ Added import

export default function AppShell({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const { role, logout } = useAuth();

  const navItems = [
    { name: "Dashboard", path: "/dashboard" },
    { name: "Pets", path: "/pets" },
    { name: "Vets", path: "/vets" },
    { name: "Owners", path: "/owners" },
    { name: "Appointments", path: "/appointments" },
    { name: "Invoices", path: "/invoices" },
    { name: "Health", path: "/health" },
    { name: "Settings", path: "/settings" },
  ];

  return (
    <div className="min-h-screen flex bg-gray-50 text-gray-900 dark:bg-gray-900 dark:text-gray-100">
      {/* Sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-r bg-white/80 dark:bg-gray-800/80 backdrop-blur-md">
        {/* Logo */}
        <div className="h-20 flex items-center px-4 border-b border-gray-200 dark:border-gray-700">
          <img
            src={logo}
            alt="VetCare+"
            className="h-38 w-auto object-contain"
          />
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-2 relative">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                [
                  "relative flex items-center px-4 py-2 rounded-lg font-medium transition-colors duration-200",
                  isActive
                    ? "text-white"
                    : "text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100",
                ].join(" ")
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.span
                      layoutId="activeBackground"
                      className="absolute inset-0 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-500 shadow-md"
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  )}
                  {!isActive && (
                    <motion.span
                      whileHover={{
                        scale: 1.03,
                        backgroundColor: "rgba(0, 150, 255, 0.1)",
                      }}
                      className="absolute inset-0 rounded-lg"
                    />
                  )}
                  <span className="relative">{item.name}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Main column */}
      <div className="flex-1 flex flex-col">
        {/* Topbar */}
        <header className="h-16 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-4">
          <div className="relative flex-1 max-w-xl">
            <input
              placeholder="Search…"
              className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-blue-500/30"
            />
          </div>

          <div className="ml-4 flex items-center gap-4">
            <button
              type="button"
              onClick={() => {
                logout();
                navigate("/login");
              }}
              className="text-sm font-medium text-blue-700 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-200"
            >
              Logout
            </button>
            <span className="text-xs text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-600 px-2 py-1 rounded-lg">
              {role ?? "—"}
            </span>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
