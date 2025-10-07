// src/context/AuthContext.tsx
import { createContext, useContext, useEffect, useState } from "react";

type Role = "OWNER" | "VET" | "ADMIN";
type Decoded = { sub?: string; role?: Role; exp?: number };

type Ctx = {
  token: string | null;
  role: Role | null;
  loading: boolean;
  login: (t: string) => Promise<void>;
  logout: () => void;
  refreshRole: () => Promise<void>;
};

const AuthCtx = createContext<Ctx>({
  token: null,
  role: null,
  loading: true,
  login: async () => {},
  logout: () => {},
  refreshRole: async () => {},
});

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

// minimal, safe JWT payload decoder (no deps)
function decodeJwt<T = Decoded>(token: string): T | {} {
  try {
    const [, payload] = token.split(".");
    if (!payload) return {};
    const b64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const json = decodeURIComponent(
      atob(b64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(json) as T;
  } catch {
    return {};
  }
}

async function fetchRole(token: string): Promise<Role | null> {
  try {
    const res = await fetch(`${API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return (data?.user?.role ?? data?.role) ?? null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(true);

  const ensureRole = async (t: string, decoded?: Decoded | {}) => {
    const d = (decoded || {}) as Decoded;
    const r = d.role ?? (await fetchRole(t));
    if (r) setRole(r);
  };

  useEffect(() => {
    (async () => {
      // Prefer new key 'access', but support old 'token' for backward-compat
      const saved = localStorage.getItem("access") || localStorage.getItem("token");
      if (saved) {
        const d = decodeJwt<Decoded>(saved);
        if (d?.exp && d.exp * 1000 < Date.now()) {
          localStorage.removeItem("access");
          localStorage.removeItem("token");
        } else {
          setToken(saved);
          await ensureRole(saved, d);
        }
      }
      setLoading(false);
    })();
  }, []);

  const login = async (t: string) => {
    localStorage.setItem("access", t); // new canonical key
    localStorage.removeItem("token");  // clean up legacy key
    setToken(t);
    await ensureRole(t, decodeJwt<Decoded>(t));
  };

  const logout = () => {
    localStorage.removeItem("access");
    localStorage.removeItem("token");
    setToken(null);
    setRole(null);
  };

  const refreshRole = async () => {
    if (!token) return;
    const r = await fetchRole(token);
    if (r) setRole(r);
  };

  return (
    <AuthCtx.Provider value={{ token, role, loading, login, logout, refreshRole }}>
      {children}
    </AuthCtx.Provider>
  );
}

export const useAuth = () => useContext(AuthCtx);
