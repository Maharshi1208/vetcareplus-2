import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute() {
  const { token, loading } = useAuth();
  if (loading) return null; // keep your UI as-is; add spinner if you like
  return token ? <Outlet /> : <Navigate to="/login" replace />;
}
