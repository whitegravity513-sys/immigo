import { useEffect } from "react";
import ErrorBoundary from "./components/common/ErrorBoundary.jsx";
import { AppRoutes } from "./routes";
import appConfig from "./config/appConfig.js";
import "./App.css";

export default function App() {
  useEffect(() => {
    // Non-blocking background pre-warm of backend (eliminates cold-start latency)
    const warmBackend = () => {
      try {
        const healthUrl = `${appConfig.API_BASE_URL}/health`;
        fetch(healthUrl, { method: "GET", mode: "cors", cache: "no-cache" }).catch(() => {});
      } catch {}
    };

    warmBackend();

    // Gentle 10-minute keep-alive ping while user has the browser open
    const keepAliveTimer = setInterval(() => {
      if (typeof document !== "undefined" && !document.hidden) {
        warmBackend();
      }
    }, 10 * 60 * 1000);

    return () => clearInterval(keepAliveTimer);
  }, []);

  return (
    <ErrorBoundary>
      <AppRoutes />
    </ErrorBoundary>
  );
}
