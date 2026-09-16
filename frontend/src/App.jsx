import { useState, useEffect, lazy, Suspense } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import apiClient from "./services/apiClient.js";
import appConfig from "./config/appConfig.js";
import LoadingFallback from "./components/common/LoadingFallback.jsx";
import "./App.css";

// Lazy-loaded routes for enterprise-grade code-splitting & ultra-fast initial page loads
const UnifiedLogin = lazy(() => import("./pages/UnifiedLogin.jsx"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard.jsx"));
const EmployeeDashboard = lazy(() => import("./pages/employee/EmployeeDashboard.jsx"));

const isSessionValid = () => {
  const ts = localStorage.getItem(appConfig.STORAGE_KEYS.SESSION_TIMESTAMP);
  if (!ts) return true; // if no ts, assume valid for admin
  return (Date.now() - parseInt(ts)) < 3650 * 24 * 60 * 60 * 1000;
};

function App() {
  const navigate = useNavigate();

  const [token, setToken] = useState(() => {
    const t = localStorage.getItem(appConfig.STORAGE_KEYS.TOKEN);
    const r = localStorage.getItem(appConfig.STORAGE_KEYS.ROLE);
    if (t && r === "admin" && isSessionValid()) return t;
    if (t && r === "employee") return t;
    return "";
  });

  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(appConfig.STORAGE_KEYS.USER) || "null");
    } catch {
      return null;
    }
  });

  const [role, setRole] = useState(
    localStorage.getItem(appConfig.STORAGE_KEYS.ROLE) || "employee"
  );

  const [authChecking] = useState(false);

  // Silent refresh: called on every page load if admin role is stored, running silently in background
  useEffect(() => {
    const storedRole = localStorage.getItem(appConfig.STORAGE_KEYS.ROLE);
    if (storedRole !== "admin" || !isSessionValid()) {
      return;
    }

    apiClient
      .post("/auth/admin/refresh-token", {})
      .then((res) => {
        if (res.data?.accessToken) {
          const newToken = res.data.accessToken;
          setToken(newToken);
          localStorage.setItem(appConfig.STORAGE_KEYS.TOKEN, newToken);
          localStorage.setItem(appConfig.STORAGE_KEYS.SESSION_TIMESTAMP, Date.now().toString());
        }
      })
      .catch(() => {
        console.warn("Silent refresh failed or cookie missing, preserving existing session across refresh");
      });
  }, []);

  // Schedule a silent refresh 1 minute before the 15-min access token expires
  useEffect(() => {
    if (!token || role !== "admin") return;
    const REFRESH_IN_MS = 14 * 60 * 1000; // 14 minutes
    const timer = setTimeout(async () => {
      try {
        const res = await apiClient.post("/auth/admin/refresh-token", {});
        const newToken = res.data.accessToken;
        setToken(newToken);
        localStorage.setItem(appConfig.STORAGE_KEYS.TOKEN, newToken);
        localStorage.setItem(appConfig.STORAGE_KEYS.SESSION_TIMESTAMP, Date.now().toString());
      } catch {
        console.warn("Background token refresh failed");
      }
    }, REFRESH_IN_MS);
    return () => clearTimeout(timer);
  }, [token, role]);

  const handleLogout = async () => {
    const prevRole = role;
    try {
      if (prevRole === "admin") {
        await apiClient.post("/auth/admin/logout", {});
      }
    } catch {
      /* ignore */
    }
    setToken("");
    setUser(null);
    [
      appConfig.STORAGE_KEYS.TOKEN,
      appConfig.STORAGE_KEYS.USER,
      appConfig.STORAGE_KEYS.ROLE,
      appConfig.STORAGE_KEYS.SESSION_TIMESTAMP,
    ].forEach((k) => localStorage.removeItem(k));
    navigate("/login");
  };

  const handleLoginSuccess = (newToken, newUser, newRole) => {
    setToken(newToken);
    setUser(newUser);
    setRole(newRole);
    localStorage.setItem(appConfig.STORAGE_KEYS.TOKEN, newToken);
    localStorage.setItem(appConfig.STORAGE_KEYS.USER, JSON.stringify(newUser));
    localStorage.setItem(appConfig.STORAGE_KEYS.ROLE, newRole);
    if (newRole === "admin") {
      localStorage.setItem(appConfig.STORAGE_KEYS.SESSION_TIMESTAMP, Date.now().toString());
      navigate("/admin/dashboard/live");
    } else {
      navigate("/employee/dashboard");
    }
  };

  if (authChecking) {
    return <LoadingFallback message="Restoring your session…" />;
  }

  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        <Route path="/admin/login" element={
          token && role === "admin" ? <Navigate to="/admin/dashboard/live" /> : <Navigate to="/login?role=admin" replace />
        } />

        <Route path="/employee/login" element={
          token && role === "employee" ? <Navigate to="/employee/dashboard" /> : <Navigate to="/login?role=employee" replace />
        } />

        <Route path="/login" element={
          token ? (role === "admin" ? <Navigate to="/admin/dashboard/live" /> : <Navigate to="/employee/dashboard" />) : <UnifiedLogin onLoginSuccess={handleLoginSuccess} />
        } />

        {/* Admin Dashboard shell — handles all /admin/dashboard/* sub-routes internally */}
        <Route path="/admin/dashboard/*" element={
          token && role === "admin"
            ? <AdminDashboard user={user} token={token} onLogout={handleLogout} />
            : <Navigate to="/login?role=admin" />
        } />

        <Route path="/employee/dashboard" element={
          token && role === "employee"
            ? <EmployeeDashboard user={user} token={token} onLogout={handleLogout} />
            : <Navigate to="/login?role=employee" />
        } />

        <Route path="/" element={
          token
            ? (role === "admin" ? <Navigate to="/admin/dashboard/live" /> : <Navigate to="/employee/dashboard" />)
            : <Navigate to="/employee/login" />
        } />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Suspense>
  );
}

export default App;

