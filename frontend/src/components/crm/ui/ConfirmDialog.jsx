import React from "react";
import { AlertTriangle, X } from "lucide-react";

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirm Action",
  message = "Are you sure you want to proceed? This action cannot be undone.",
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "danger", // "danger" | "warning" | "primary"
  loading = false,
}) {
  if (!isOpen) return null;

  const variantStyles = {
    danger: {
      iconBg: "bg-red-50 text-red-600 border-red-100",
      btn: "bg-red-600 hover:bg-red-700 text-white focus:ring-red-500/30",
    },
    warning: {
      iconBg: "bg-amber-50 text-amber-600 border-amber-100",
      btn: "bg-amber-600 hover:bg-amber-700 text-white focus:ring-amber-500/30",
    },
    primary: {
      iconBg: "bg-blue-50 text-blue-600 border-blue-100",
      btn: "bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500/30",
    },
  };

  const current = variantStyles[variant] || variantStyles.danger;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div
        className="fixed inset-0 bg-gray-900/60 backdrop-blur-2xs transition-opacity"
        onClick={!loading ? onClose : undefined}
      />

      <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
        <div className="relative transform overflow-hidden rounded-xl bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-md border border-gray-200">
          <div className="bg-white p-6">
            <div className="flex items-start gap-4">
              <div
                className={`w-10 h-10 rounded-full border flex items-center justify-center shrink-0 ${current.iconBg}`}
              >
                <AlertTriangle size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-gray-900">{title}</h3>
                  <button
                    onClick={onClose}
                    disabled={loading}
                    className="text-gray-400 hover:text-gray-600 p-1 rounded-md"
                  >
                    <X size={16} />
                  </button>
                </div>
                <p className="mt-2 text-sm text-gray-600">{message}</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 px-6 py-3.5 flex items-center justify-end gap-2.5 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-300 transition-colors cursor-pointer"
            >
              {cancelText}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={loading}
              className={`px-4 py-2 text-sm font-semibold rounded-lg shadow-2xs focus:outline-none focus:ring-2 transition-colors cursor-pointer ${current.btn} ${
                loading ? "opacity-70 cursor-not-allowed" : ""
              }`}
            >
              {loading ? "Processing..." : confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ConfirmDialog;
