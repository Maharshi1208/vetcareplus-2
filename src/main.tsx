import React, { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import { Toaster } from "react-hot-toast";
import { PetsProvider } from "./context/PetsContext";
import { AuthProvider } from "./context/AuthContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";


const queryClient = new QueryClient();

/** Centralized theme applier */
function applyTheme(theme: "light" | "dark") {
  const root = document.documentElement;
  // Toggle 'dark' class in a single place
  root.classList.toggle("dark", theme === "dark");
}

/** Ensure theme is set before React mounts */
(function initTheme() {
  try {
    const saved = (localStorage.getItem("theme") as "light" | "dark") || "light";
    applyTheme(saved);
  } catch {
    // ignore
  }
})();

/** React to cross-tab/theme-change events */
window.addEventListener("storage", (e) => {
  if (e.key === "theme" && e.newValue) {
    const t = (e.newValue as "light" | "dark") || "light";
    applyTheme(t);
  }
});

/** Custom event our Settings page will dispatch after saving */
window.addEventListener("themechange", () => {
  const saved = (localStorage.getItem("theme") as "light" | "dark") || "light";
  applyTheme(saved);
});

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: any }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error: any) {
    return { error };
  }
  componentDidCatch(error: any, info: any) {
    console.error("UI error:", error, info);
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: "2rem", fontFamily: "ui-sans-serif" }}>
          <h1 style={{ fontSize: "1.25rem", fontWeight: 600 }}>
            Something went wrong
          </h1>
          <p style={{ color: "#6b7280" }}>
            Check the browser console for details. Fixing the error will restore
            the page.
          </p>
        </div>
      );
    }
    return this.props.children as any;
  }
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <PetsProvider>
          <ErrorBoundary>
            <App />
            <Toaster position="top-center" />
          </ErrorBoundary>
        </PetsProvider>
      </AuthProvider>
    </QueryClientProvider>
  </StrictMode>
);
