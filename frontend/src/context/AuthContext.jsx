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

  const logout = useCallback(async () => {
    try {
      if (role === "admin") {
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
    isAdmin: role === "admin" || role === "ADMIN",
    isEmployee: role === "employee",
    isVendor: role === "vendor" || role === "VENDOR",
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
