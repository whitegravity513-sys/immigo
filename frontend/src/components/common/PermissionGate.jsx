import React from "react";
import { usePermissions } from "../../context/PermissionContext.jsx";

export function PermissionGate({
  children,
  permission,
  permissions,
  mode = "all", // "all" or "any"
  superAdminOnly = false,
  fallback = null,
  disableInsteadOfHide = false,
}) {
  const { hasPermission, hasAnyPermission, hasAllPermissions, isSuperAdmin } = usePermissions();

  let isAllowed = false;

  if (isSuperAdmin) {
    isAllowed = true;
  } else if (superAdminOnly) {
    isAllowed = false;
  } else if (permissions && Array.isArray(permissions)) {
    isAllowed =
      mode === "any"
        ? hasAnyPermission(permissions)
        : hasAllPermissions(permissions);
  } else if (permission) {
    isAllowed = hasPermission(permission);
  } else {
    isAllowed = true;
  }

  if (isAllowed) {
    return <>{children}</>;
  }

  if (disableInsteadOfHide) {
    return (
      <span
        className="opacity-50 cursor-not-allowed pointer-events-none inline-block select-none"
        title="Permission required for this action"
      >
        {children}
      </span>
    );
  }

  return fallback;
}

export default PermissionGate;
