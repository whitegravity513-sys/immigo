import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import LoadingFallback from "./LoadingFallback.jsx";

export default function ProtectedRoute({ children, allowedRole, allowedRoles: allowedRolesProp }) {
  const { role, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingFallback message="Verifying session..." />;
  }

  if (!isAuthenticated) {
    const defaultRole = Array.isArray(allowedRole)
      ? allowedRole[0]
      : allowedRole?.split(",")[0]?.trim() || "admin";
    const normalizedDefault = defaultRole?.toLowerCase();
    const isHrTarget =
      location.pathname.startsWith("/hr") || normalizedDefault === "hr";
    const loginUrl =
      isHrTarget
        ? "/hr/login"
        : normalizedDefault === "admin" || normalizedDefault === "super_admin"
        ? "/admin/login"
        : normalizedDefault === "vendor"
        ? "/vendor/login"
        : normalizedDefault === "candidate"
        ? "/candidate/login"
        : normalizedDefault === "employee"
        ? "/employee/login"
        : "/admin/login";
    return <Navigate to={loginUrl} state={{ from: location }} replace />;
  }

  const normalizedRole = (role || "").toLowerCase().replace(/[\s_-]/g, "");

  let validRoles = null;
  if (allowedRolesProp && Array.isArray(allowedRolesProp)) {
    validRoles = allowedRolesProp.map((r) => r.toLowerCase().replace(/[\s_-]/g, ""));
  } else if (Array.isArray(allowedRole)) {
    validRoles = allowedRole.map((r) => r.toLowerCase().replace(/[\s_-]/g, ""));
  } else if (typeof allowedRole === "string" && allowedRole.trim()) {
    validRoles = allowedRole
      .toLowerCase()
      .split(",")
      .map((r) => r.trim().replace(/[\s_-]/g, ""));
  }

  // Super Admin can access admin & hr areas
  const isSuperAdmin = normalizedRole === "superadmin";
  const hasAccess =
    !validRoles ||
    validRoles.includes(normalizedRole) ||
    (isSuperAdmin && (validRoles.includes("admin") || validRoles.includes("hr")));

  if (!hasAccess) {
    const redirectUrl =
      normalizedRole === "admin" || normalizedRole === "superadmin"
        ? "/admin/dashboard"
        : normalizedRole === "hr"
        ? "/hr/dashboard"
        : normalizedRole === "vendor"
        ? "/vendor/dashboard"
        : normalizedRole === "candidate"
        ? "/candidate/dashboard"
        : "/employee/dashboard";
    return <Navigate to={redirectUrl} replace />;
  }

  return children;
}
