import React from "react";
import { ArrowRight } from "lucide-react";

/**
 * Enterprise submit button with gradient, loading spinner, and micro-animations.
 */
export default function AuthSubmitButton({ loading, label }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="group w-full flex items-center justify-center gap-2 py-3.5 mt-2 bg-gradient-to-r from-blue-600 via-blue-700 to-blue-600 hover:from-blue-700 hover:to-blue-800 disabled:opacity-60 text-white text-sm font-extrabold rounded-xl transition-all duration-200 shadow-md shadow-blue-500/25 hover:shadow-lg hover:shadow-blue-500/30 active:scale-[0.99] cursor-pointer"
    >
      {loading ? (
        <span className="inline-flex items-center gap-2">
          <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          Authenticating securely…
        </span>
      ) : (
        <>
          <span>{label}</span>
          <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform duration-200" />
        </>
      )}
    </button>
  );
}
