import { useAuthStore } from "@/store/authStore";
import type { UserRole } from "@/types";
import { Navigate } from "react-router-dom";

const ProtectedRoute: React.FC<{
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}> = ({ children, allowedRoles }) => {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuthStore();

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export { ProtectedRoute, PublicRoute };
