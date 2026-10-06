import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import LoadingFallback from "./LoadingFallback.jsx";

export default function ProtectedRoute({ children, allowedRole, allowedRoles: allowedRolesProp }) {
  const { token, role, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingFallback message="Verifying session..." />;
  }

  if (!isAuthenticated) {
    const defaultRole = Array.isArray(allowedRole)
      ? allowedRole[0]
      : (allowedRole?.split(",")[0]?.trim() || "admin");
    const loginUrl = defaultRole === "vendor" ? "/vendor/login" : `/login?role=${defaultRole}`;
    return <Navigate to={loginUrl} state={{ from: location }} replace />;
  }

  const normalizedRole = role?.toLowerCase();

  let validRoles = null;
  if (allowedRolesProp && Array.isArray(allowedRolesProp)) {
    validRoles = allowedRolesProp.map((r) => r.toLowerCase());
  } else if (Array.isArray(allowedRole)) {
    validRoles = allowedRole.map((r) => r.toLowerCase());
  } else if (typeof allowedRole === "string" && allowedRole.trim()) {
    validRoles = allowedRole.toLowerCase().split(",").map((r) => r.trim());
  }

  if (validRoles && !validRoles.includes(normalizedRole)) {
    const redirectUrl =
      normalizedRole === "admin"
        ? "/admin/dashboard"
        : normalizedRole === "vendor"
        ? "/vendor/dashboard"
        : "/employee/dashboard";
    return <Navigate to={redirectUrl} replace />;
  }

  return children;
}

