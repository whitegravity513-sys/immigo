import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useAuth } from "./AuthContext.jsx";
import permissionService from "../services/permissionService.js";

const PermissionContext = createContext(null);

export const PermissionProvider = ({ children }) => {
  const { token, user, role: authRole } = useAuth();
  const [permissions, setPermissions] = useState(() => {
    try {
      const stored = localStorage.getItem("user_permissions");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [isSuperAdmin, setIsSuperAdmin] = useState(() => {
    const r = (authRole || user?.role || "").toUpperCase().replace(/[\s_-]/g, "");
    return r === "SUPERADMIN" || user?.isSuperAdmin === true;
  });

  const [loading, setLoading] = useState(false);

  const fetchPermissions = useCallback(async () => {
    if (!token) {
      setPermissions([]);
      setIsSuperAdmin(false);
      localStorage.removeItem("user_permissions");
      return;
    }

    try {
      setLoading(true);
      const data = await permissionService.getMyPermissions();
      if (data?.success) {
        const perms = data.permissions || [];
        const isSuper = data.isSuperAdmin || (data.role || "").toUpperCase().includes("SUPER");
        setPermissions(perms);
        setIsSuperAdmin(isSuper);
        localStorage.setItem("user_permissions", JSON.stringify(perms));
      }
    } catch (err) {
      if (user?.permissions) {
        setPermissions(user.permissions);
      }
      const isSuper = (authRole || user?.role || "").toUpperCase().includes("SUPER") || user?.isSuperAdmin;
      setIsSuperAdmin(Boolean(isSuper));
    } finally {
      setLoading(false);
    }
  }, [token, authRole, user]);

  useEffect(() => {
    fetchPermissions();
  }, [fetchPermissions]);

  const hasPermission = useCallback(
    (permKey) => {
      if (!permKey) return true;
      if (isSuperAdmin || permissions.includes("*")) return true;
      return permissions.includes(permKey);
    },
    [isSuperAdmin, permissions]
  );

  const hasAnyPermission = useCallback(
    (permKeys = []) => {
      if (!permKeys || permKeys.length === 0) return true;
      if (isSuperAdmin || permissions.includes("*")) return true;
      return permKeys.some((k) => permissions.includes(k));
    },
    [isSuperAdmin, permissions]
  );

  const hasAllPermissions = useCallback(
    (permKeys = []) => {
      if (!permKeys || permKeys.length === 0) return true;
      if (isSuperAdmin || permissions.includes("*")) return true;
      return permKeys.every((k) => permissions.includes(k));
    },
    [isSuperAdmin, permissions]
  );

  const canAccessModule = useCallback(
    (moduleId) => {
      if (!moduleId) return false;
      if (isSuperAdmin || permissions.includes("*")) return true;
      return permissions.some((p) => p.startsWith(`${moduleId}.`));
    },
    [isSuperAdmin, permissions]
  );

  const userRole = (authRole || user?.role || "").toUpperCase().replace(/[\s_-]/g, "");

  const value = {
    permissions,
    isSuperAdmin,
    isAdmin: userRole === "ADMIN" || isSuperAdmin,
    isHR: userRole === "HR",
    role: userRole,
    loading,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    canAccessModule,
    reloadPermissions: fetchPermissions,
  };

  return <PermissionContext.Provider value={value}>{children}</PermissionContext.Provider>;
};

export const usePermissions = () => {
  const context = useContext(PermissionContext);
  if (!context) {
    throw new Error("usePermissions must be used within a PermissionProvider");
  }
  return context;
};

export default PermissionContext;
