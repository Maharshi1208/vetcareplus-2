import { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark";
type ThemeCtx = {
  theme: Theme;
  setTheme: (t: Theme) => void;
  toggle: () => void;
};

const Ctx = createContext<ThemeCtx>({
  theme: "light",
  setTheme: () => {},
  toggle: () => {},
});

function applyTheme(t: Theme) {
  const html = document.documentElement; // <html>
  // Tailwind "dark:" support
  html.classList.toggle("dark", t === "dark");
  // Attribute selector support (and handy for plain CSS)
  html.setAttribute("data-theme", t);
  // Persist
  localStorage.setItem("theme", t);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("light");

  // Initialize from storage or OS preference
  useEffect(() => {
    const saved = localStorage.getItem("theme") as Theme | null;

    const detectOS = (): Theme =>
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";

    const initial = saved ?? detectOS();
    setThemeState(initial);
    applyTheme(initial);

    // If the user has NOT explicitly chosen a theme, follow OS changes live
    if (!saved && window.matchMedia) {
      const media = window.matchMedia("(prefers-color-scheme: dark)");
      const handler = (e: MediaQueryListEvent) => {
        const next = e.matches ? "dark" : "light";
        setThemeState(next);
        applyTheme(next);
      };
      media.addEventListener?.("change", handler);
      return () => media.removeEventListener?.("change", handler);
    }
  }, []);

  const setTheme = (t: Theme) => {
    setThemeState(t);
    applyTheme(t);
  };

  const toggle = () => setTheme(theme === "dark" ? "light" : "dark");

  return (
    <Ctx.Provider value={{ theme, setTheme, toggle }}>
      {children}
    </Ctx.Provider>
  );
}

export const useTheme = () => useContext(Ctx);
