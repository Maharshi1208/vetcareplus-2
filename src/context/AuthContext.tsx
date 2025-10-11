// src/context/AuthContext.tsx
import { createContext, useContext, useEffect, useState } from "react";
import {
  API_URL as API_BASE,     // normalized base (includes /api)
  getAccessToken,
  setAccessToken,
  clearTokens,
} from "../services/api";

type Role = "OWNER" | "VET" | "ADMIN";
type User = { id?: string; email?: string; name?: string; role?: Role } | null;
type Decoded = { sub?: string; role?: Role; exp?: number };

type Ctx = {
  token: string | null;
  user: User;
  role: Role | null;
  isAdmin: boolean;
  loading: boolean;
  // `user` param is optional so existing calls `login(token)` still work.
  login: (t: string, user?: NonNullable<User>) => Promise<void>;
  logout: () => void;
  refreshRole: () => Promise<void>;
};

const AuthCtx = createContext<Ctx>({
  token: null,
  user: null,
  role: null,
  isAdmin: false,
  loading: true,
  login: async () => {},
  logout: () => {},
  refreshRole: async () => {},
});

// Use the same base URL as api.ts (already trimmed and includes /api)
const API_URL = API_BASE;

// ---- Minimal, safe JWT payload decoder (no deps) ---------------------------
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
  const [user, setUser] = useState<User>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(true);

  const ensureRole = async (t: string, decoded?: Decoded | {}) => {
    const d = (decoded || {}) as Decoded;
    const r = d.role ?? (await fetchRole(t));
    if (r) setRole(r);
  };

  // Boot: restore token (and role) from storage
  useEffect(() => {
    (async () => {
      const saved = getAccessToken();
      if (saved) {
        const d = decodeJwt<Decoded>(saved);
        if (d?.exp && d.exp * 1000 < Date.now()) {
          clearTokens();
        } else {
          setToken(saved);
          await ensureRole(saved, d);
        }
      }
      setLoading(false);
    })();
  }, []);

  const login = async (t: string, u?: NonNullable<User>) => {
    setAccessToken(t); // canonical key "access"
    setToken(t);
    if (u) {
      setUser(u);
      if (u.role) setRole(u.role);
    } else {
      await ensureRole(t, decodeJwt<Decoded>(t));
    }
  };

  const logout = () => {
    clearTokens();
    setUser(null);
    setToken(null);
    setRole(null);
  };

  const refreshRole = async () => {
    if (!token) return;
    const r = await fetchRole(token);
    if (r) setRole(r);
  };

  return (
    <AuthCtx.Provider
      value={{
        token,
        user,
        role,
        isAdmin: role === "ADMIN",
        loading,
        login,
        logout,
        refreshRole,
      }}
    >
      {children}
    </AuthCtx.Provider>
  );
}

export const useAuth = () => useContext(AuthCtx);
