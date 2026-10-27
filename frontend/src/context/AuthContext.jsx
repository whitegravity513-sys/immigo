import { createContext, useContext, useState, useEffect, useCallback } from "react";
import appConfig from "../config/appConfig.js";
import apiClient from "../services/apiClient.js";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => {
    return localStorage.getItem(appConfig.STORAGE_KEYS.TOKEN) || "";
  });

  const [role, setRole] = useState(() => {
    return localStorage.getItem(appConfig.STORAGE_KEYS.ROLE) || "";
  });

  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem(appConfig.STORAGE_KEYS.USER);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (token) {
      apiClient.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    } else {
      delete apiClient.defaults.headers.common["Authorization"];
    }
  }, [token]);

  const login = useCallback((newToken, newUser, newRole) => {
    setToken(newToken);
    setUser(newUser);
    setRole(newRole);
    localStorage.setItem(appConfig.STORAGE_KEYS.TOKEN, newToken);
    localStorage.setItem(appConfig.STORAGE_KEYS.USER, JSON.stringify(newUser));
    localStorage.setItem(appConfig.STORAGE_KEYS.ROLE, newRole);
    localStorage.setItem(appConfig.STORAGE_KEYS.SESSION_TIMESTAMP, Date.now().toString());
  }, []);

  const logout = useCallback(async (customRedirect) => {
    // If called directly via onClick={logout}, customRedirect is the React event object!
    const redirectUrl =
      typeof customRedirect === "string" && customRedirect.trim()
        ? customRedirect.trim()
        : null;

    let storedUser = null;
    try {
      storedUser = JSON.parse(localStorage.getItem(appConfig.STORAGE_KEYS.USER) || "null");
    } catch {}

    const previousRole = (
      role ||
      localStorage.getItem(appConfig.STORAGE_KEYS.ROLE) ||
      storedUser?.role ||
      (storedUser?.employeeId ? "employee" : "") ||
      ""
    ).toLowerCase();
    const currentPath = window.location.pathname.toLowerCase();
    try {
      if (previousRole === "admin" || previousRole === "superadmin" || previousRole === "super_admin") {
        await apiClient.post("/auth/admin/logout", {});
      }
    } catch {
    } finally {
      setToken("");
      setUser(null);
      setRole("");
      [
        appConfig.STORAGE_KEYS.TOKEN,
        appConfig.STORAGE_KEYS.USER,
        appConfig.STORAGE_KEYS.ROLE,
        appConfig.STORAGE_KEYS.SESSION_TIMESTAMP,
      ].forEach((key) => localStorage.removeItem(key));

      let targetLogin = "/admin/login";
      if (
        previousRole === "super_admin" ||
        previousRole === "superadmin" ||
        previousRole === "admin" ||
        currentPath.startsWith("/super-admin") ||
        currentPath.startsWith("/admin")
      ) {
        // Normal Admin & Super Admin both redirect directly to /admin/login
        targetLogin = "/admin/login";
      } else if (previousRole === "hr" || currentPath.startsWith("/hr")) {
        targetLogin = "/hr/login";
      } else if (previousRole === "vendor" || currentPath.startsWith("/vendor")) {
        targetLogin = "/vendor/login";
      } else if (previousRole === "candidate" || currentPath.startsWith("/candidate")) {
        targetLogin = "/candidate/login";
      } else if (
        previousRole === "employee" ||
        currentPath.includes("employee") ||
        Boolean(storedUser?.employeeId)
      ) {
        targetLogin = "/employee/login";
      } else {
        targetLogin = "/admin/login";
      }

      window.location.href = redirectUrl || targetLogin;
    }
  }, [role]);

  const updateUser = useCallback((updatedFields) => {
    setUser((prev) => {
      const merged = { ...(prev || {}), ...updatedFields };
      localStorage.setItem(appConfig.STORAGE_KEYS.USER, JSON.stringify(merged));
      return merged;
    });
  }, []);

  const value = {
    token,
    user,
    role,
    loading,
    isAuthenticated: Boolean(token && role),
    isSuperAdmin: (role || "").toUpperCase().replace(/[\s_-]/g, "") === "SUPERADMIN",
    isAdmin: ["ADMIN", "SUPERADMIN"].includes((role || "").toUpperCase().replace(/[\s_-]/g, "")),
    isHR: (role || "").toUpperCase().replace(/[\s_-]/g, "") === "HR",
    isEmployee: (role || "").toLowerCase() === "employee",
    isVendor: (role || "").toUpperCase() === "VENDOR",
    isCandidate: (role || "").toUpperCase() === "CANDIDATE",

    login,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export default AuthContext;
