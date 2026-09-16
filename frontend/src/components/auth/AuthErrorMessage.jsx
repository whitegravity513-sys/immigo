import React from "react";
import { AlertCircle } from "lucide-react";

/**
 * Shared error message banner for authentication forms.
 */
export default function AuthErrorMessage({ msg }) {
  if (!msg) return null;
  return (
    <div className="flex items-center gap-2.5 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-xs font-semibold animate-shake">
      <AlertCircle size={15} className="shrink-0 text-red-500" />
      <span>{msg}</span>
    </div>
  );
}
