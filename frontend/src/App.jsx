import { useEffect } from "react";
import ErrorBoundary from "./components/common/ErrorBoundary.jsx";
import { AppRoutes } from "./routes";
import appConfig from "./config/appConfig.js";
import { useAuth } from "./context/useAuth.js";
import { startRealtimeSync, stopRealtimeSync } from "./services/realtimeSync.js";
import "./App.css";

export default function App() {
  const { token, role } = useAuth();

  useEffect(() => {
    const warmBackend = () => {
      try {
        const healthUrl = `${appConfig.API_BASE_URL}/health`;
        fetch(healthUrl, { method: "GET", mode: "cors", cache: "no-cache" }).catch(() => {});
      } catch {}
    };

    warmBackend();

    const keepAliveTimer = setInterval(() => {
      if (typeof document !== "undefined" && !document.hidden) {
        warmBackend();
      }
    }, 10 * 60 * 1000);

    return () => clearInterval(keepAliveTimer);
  }, []);

  useEffect(() => {
    if (token && role) {
      startRealtimeSync({ token, role });
    } else {
      stopRealtimeSync();
    }
    return () => {
      stopRealtimeSync();
    };
  }, [token, role]);

  return (
    <ErrorBoundary>
      <AppRoutes />
    </ErrorBoundary>
  );
}
