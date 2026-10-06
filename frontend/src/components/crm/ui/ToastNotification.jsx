import React, { useEffect } from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

export function ToastNotification({
  message,
  type = "success", // "success" | "error" | "info"
  onClose,
  duration = 4000,
}) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [message, duration, onClose]);

  if (!message) return null;

  const styles = {
    success: {
      bg: "bg-emerald-50 border-emerald-200 text-emerald-900",
      icon: <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />,
    },
    error: {
      bg: "bg-red-50 border-red-200 text-red-900",
      icon: <AlertCircle size={18} className="text-red-600 shrink-0" />,
    },
    info: {
      bg: "bg-blue-50 border-blue-200 text-blue-900",
      icon: <Info size={18} className="text-blue-600 shrink-0" />,
    },
  };

  const current = styles[type] || styles.success;

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-md animate-in fade-in slide-in-from-bottom-4 duration-200">
      <div
        className={`flex items-center gap-3 p-4 rounded-xl border shadow-lg ${current.bg}`}
      >
        {current.icon}
        <p className="text-sm font-medium flex-1">{message}</p>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 p-1 rounded-md transition-colors"
        >
          <X size={15} />
        </button>
      </div>
    </div>
  );
}

export default ToastNotification;
