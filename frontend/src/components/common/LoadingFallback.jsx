import React from "react";

/**
 * Enterprise loading fallback screen for React.Suspense during route transitions.
 */
export default function LoadingFallback({ message = "Loading secure portal…" }) {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-slate-50 relative overflow-hidden">
      <div className="relative z-10 flex flex-col items-center gap-4">
        {/* Animated Brand Logo Mark */}
        <div className="flex items-end gap-0.5 select-none animate-pulse">
          <span className="font-black text-3xl text-slate-900 tracking-tighter leading-none">
            immi
          </span>
          <span className="font-black text-3xl text-blue-600 tracking-tighter leading-none">
            Go
          </span>
          <svg
            viewBox="0 0 20 20"
            fill="none"
            className="w-3.5 h-3.5 text-orange-500 mb-2 ml-0.5"
          >
            <path
              d="M3 10h14M10 3l7 7-7 7"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        {/* Spinner */}
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-bold text-slate-600 tracking-wide uppercase">
            {message}
          </span>
        </div>
      </div>
    </div>
  );
}
