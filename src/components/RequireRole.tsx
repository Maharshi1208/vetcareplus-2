// src/components/RequireRole.tsx
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

type Role = "OWNER" | "VET" | "ADMIN";

/**
 * Usage pattern:
 *   element={
 *     <>
 *       <RequireRole allow={["ADMIN"]} />
 *       <AppShell><AdminPage /></AppShell>
 *     </>
 *   }
 *
 * If allowed => returns null (lets siblings render).
 * If blocked => returns <Navigate to="/403" /> and prevents siblings from showing.
 */
export default function RequireRole({ allow }: { allow: Role[] }) {
  const { role, loading } = useAuth();

  // avoid false 403 while auth is still hydrating
  if (loading) return null;

  // must be logged in already (ProtectedRoute should guard this)
  if (!role) return <Navigate to="/403" replace />;

  // superuser can access everything
  if (role === "ADMIN") return null;

  return allow.includes(role) ? null : <Navigate to="/403" replace />;
}
