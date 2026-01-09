//Guard de rutas por rol
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/auth/AuthContext";
import { canAccess, type Section } from "@/auth/rbac";

export default function RequireRole({ section }: { section: Section }) {
  const { user, loading } = useAuth();

  if (loading) return null; // o tu PageState loading
  if (!user) return <Navigate to="/login" replace />;

  if (!canAccess(user.role, section)) {
    return <Navigate to="/403" replace />;
  }

  return <Outlet />;
}
