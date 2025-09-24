import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

type Role = "OWNER" | "VET" | "ADMIN";

export default function RequireRole({ allow }: { allow: Role[] }) {
  const { role } = useAuth();

  // ProtectedRoute already ensures you're logged in.
  if (!role) return <Navigate to="/403" replace />;

  // ⬅️ Superuser: ADMIN can see everything
  if (role === "ADMIN") return null;

  return allow.includes(role) ? null : <Navigate to="/403" replace />;
}
