import React from "react";
import { usePermissions } from "../../context/PermissionContext.jsx";
import AccessDenied from "./AccessDenied.jsx";
import LoadingFallback from "./LoadingFallback.jsx";

export function PermissionRoute({
  children,
  permission,
  permissions,
  mode = "all", // "all" or "any"
  superAdminOnly = false,
  requiredRole,
}) {
  const { hasPermission, hasAnyPermission, hasAllPermissions, isSuperAdmin, role, loading } =
    usePermissions();

  if (loading) {
    return <LoadingFallback message="Verifying permissions..." />;
  }

  if (isSuperAdmin) {
    return children;
  }

  if (superAdminOnly && !isSuperAdmin) {
    return (
      <AccessDenied
        title="Super Administrator Restricted"
        message="This configuration panel is strictly reserved for Super Administrators."
        requiredRole="SUPER_ADMIN"
      />
    );
  }

  if (requiredRole) {
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    const normalized = roles.map((r) => r.toUpperCase().replace(/[\s_-]/g, ""));
    const current = (role || "").toUpperCase().replace(/[\s_-]/g, "");
    if (!normalized.includes(current)) {
      return (
        <AccessDenied
          title="Role Restriction"
          message={`This area requires one of the following roles: [${roles.join(", ")}].`}
          requiredRole={roles.join(" or ")}
        />
      );
    }
  }

  if (permissions && Array.isArray(permissions)) {
    const passed =
      mode === "any"
        ? hasAnyPermission(permissions)
        : hasAllPermissions(permissions);

    if (!passed) {
      return (
        <AccessDenied
          requiredPermission={permissions}
          message={`You do not possess the required permissions [${permissions.join(
            ", "
          )}] to access this area.`}
        />
      );
    }
  }

  if (permission && typeof permission === "string") {
    if (!hasPermission(permission)) {
      return (
        <AccessDenied
          requiredPermission={permission}
          message={`Access forbidden: The '${permission}' permission is required for this module.`}
        />
      );
    }
  }

  return children;
}

export default PermissionRoute;
