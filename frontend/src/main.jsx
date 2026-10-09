import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext.jsx";
import { UIProvider } from "./context/UIContext.jsx";
import App from "./App.jsx";
import "./index.css";

// Auto-reload on new deployments when old chunk hashes fail to load
window.addEventListener("vite:preloadError", (event) => {
  event?.preventDefault?.();
  window.location.reload();
});

const handleDynamicImportError = (msg) => {
  if (
    msg &&
    (msg.includes("Failed to fetch dynamically imported module") ||
      msg.includes("error loading dynamically imported module") ||
      msg.includes("Importing a module script failed"))
  ) {
    const key = "last_chunk_reload";
    const last = sessionStorage.getItem(key);
    const now = Date.now();
    if (!last || now - Number(last) > 5000) {
      sessionStorage.setItem(key, String(now));
      window.location.reload();
    }
  }
};

window.addEventListener("unhandledrejection", (event) => {
  const reason = event?.reason;
  const msg = reason?.message || String(reason || "");
  handleDynamicImportError(msg);
});

window.addEventListener("error", (e) => {
  const msg = e?.message || "";
  handleDynamicImportError(msg);
});


createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <UIProvider>
          <App />
        </UIProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);
