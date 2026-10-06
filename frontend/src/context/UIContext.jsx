import { createContext, useContext, useState, useCallback } from "react";

const UIContext = createContext(null);

export function UIProvider({ children }) {
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = "info", duration = 4000) => {
    setToast({ id: Date.now(), message, type });
    if (duration > 0) {
      setTimeout(() => {
        setToast((current) => (current?.message === message ? null : current));
      }, duration);
    }
  }, []);

  const hideToast = useCallback(() => {
    setToast(null);
  }, []);

  return (
    <UIContext.Provider
      value={{
        toast,
        showToast,
        hideToast,
        showSuccess: (msg) => showToast(msg, "success"),
        showError: (msg) => showToast(msg, "error"),
        showWarning: (msg) => showToast(msg, "warning"),
        showInfo: (msg) => showToast(msg, "info"),
      }}
    >
      {children}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl text-sm font-semibold transition-all duration-300 transform translate-y-0 backdrop-blur-md bg-white border border-slate-200 text-slate-800 animate-in fade-in slide-in-from-bottom-5">
          <span
            className={`w-2 h-2 rounded-full ${
              toast.type === "success"
                ? "bg-emerald-500"
                : toast.type === "error"
                ? "bg-rose-500"
                : toast.type === "warning"
                ? "bg-amber-500"
                : "bg-blue-500"
            }`}
          />
          <span>{toast.message}</span>
          <button
            onClick={hideToast}
            className="ml-2 text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            ×
          </button>
        </div>
      )}
    </UIContext.Provider>
  );
}

export function useUI() {
  const context = useContext(UIContext);
  if (!context) {
    throw new Error("useUI must be used within a UIProvider");
  }
  return context;
}

export default UIContext;
