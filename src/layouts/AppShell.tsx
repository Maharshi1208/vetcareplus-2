import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import logo from "../assets/logofinal.png";
import { motion } from "framer-motion";
import ChatBot from "../components/ChatBot"; // if you use it elsewhere, keep it

export default function AppShell({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const { role, logout } = useAuth();

  // --- Theme toggle (persisted) ---
  const [theme, setTheme] = React.useState<"light" | "dark">(
    (localStorage.getItem("theme") as "light" | "dark") || "light"
  );

  React.useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") root.classList.add("dark");
    else root.classList.remove("dark");
    localStorage.setItem("theme", theme);
  }, [theme]);

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
    <div className="min-h-screen flex bg-background text-foreground">
      {/* Sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-r bg-card/80 backdrop-blur-md">
        {/* Logo */}
        <div className="h-20 flex items-center px-4 border-b">
          <img src={logo} alt="VetCare+" className="h-16 w-auto object-contain" />
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
                    ? "text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground",
                ].join(" ")
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.span
                      layoutId="activeBackground"
                      className="absolute inset-0 rounded-lg bg-primary shadow-md"
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  )}
                  {!isActive && (
                    <motion.span
                      whileHover={{ scale: 1.03 }}
                      className="absolute inset-0 rounded-lg"
                      style={{ background: "hsla(var(--primary), 0.08)" }}
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
        <header className="h-16 bg-card/80 backdrop-blur-md border-b flex items-center justify-between px-4">
          <div className="relative flex-1 max-w-xl">
            <input
              placeholder="Search…"
              className="w-full rounded-xl border bg-background text-foreground placeholder:text-muted-foreground text-sm outline-none focus:ring-2 focus:ring-ring focus:border-ring px-3 py-2"
            />
          </div>

          <div className="ml-4 flex items-center gap-3">
            <button
              type="button"
              onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
              className="text-sm font-medium px-3 py-1.5 rounded-lg bg-muted text-foreground hover:opacity-90"
              title="Toggle theme"
            >
              {theme === "dark" ? "Light" : "Dark"}
            </button>

            <span className="text-xs px-2 py-1 rounded-lg border">
              {role ?? "—"}
            </span>

            <button
              type="button"
              onClick={() => {
                logout();
                navigate("/login");
              }}
              className="text-sm font-medium text-primary hover:opacity-90"
            >
              Logout
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
