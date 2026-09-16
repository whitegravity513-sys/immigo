import React from "react";

/**
 * Reusable immiGo Logo Component
 */
export function ImmiGoLogo({
  size = "md",
  theme = "dark",
  subtitle = null,
  showBadge = false,
  badgeText = "",
  className = "",
}) {
  const sizeClasses = {
    xs: {
      text: "text-lg",
      arrow: "w-2.5 h-2.5 mb-1",
      sub: "text-[9px]",
    },
    sm: {
      text: "text-xl",
      arrow: "w-3 h-3 mb-1.5",
      sub: "text-[10px]",
    },
    md: {
      text: "text-2xl",
      arrow: "w-3.5 h-3.5 mb-2",
      sub: "text-[11px]",
    },
    lg: {
      text: "text-3xl",
      arrow: "w-4 h-4 mb-2.5",
      sub: "text-xs",
    },
    xl: {
      text: "text-4xl",
      arrow: "w-5 h-5 mb-3",
      sub: "text-sm",
    },
  }[size] || {
    text: "text-2xl",
    arrow: "w-3.5 h-3.5 mb-2",
    sub: "text-[11px]",
  };

  const isLight = theme === "light";

  return (
    <div className={`flex flex-col select-none ${className}`}>
      <div className="flex items-end gap-0.5 leading-none">
        <span
          className={`font-black ${sizeClasses.text} tracking-tighter leading-none ${
            isLight ? "text-white" : "text-slate-900"
          }`}
        >
          immi
        </span>
        <span
          className={`font-black ${sizeClasses.text} tracking-tighter leading-none ${
            isLight ? "text-blue-400" : "text-blue-600"
          }`}
        >
          Go
        </span>
        <svg
          viewBox="0 0 20 20"
          fill="none"
          className={`${sizeClasses.arrow} ${
            isLight ? "text-orange-400" : "text-orange-500"
          } ml-0.5 shrink-0`}
        >
          <path
            d="M3 10h14M10 3l7 7-7 7"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>

        {showBadge && badgeText && (
          <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider bg-blue-50 text-blue-600 border border-blue-200/80 mb-1">
            {badgeText}
          </span>
        )}
      </div>

      {subtitle && (
        <span
          className={`font-bold tracking-wider uppercase mt-1 ${sizeClasses.sub} ${
            isLight ? "text-blue-200/80" : "text-blue-600"
          }`}
        >
          {subtitle}
        </span>
      )}
    </div>
  );
}

/**
 * Compact Icon for Collapsed Sidebar
 */
export function ImmiGoIcon({ size = "md", className = "" }) {
  return (
    <div
      className={`rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center text-white font-black shadow-sm shrink-0 select-none ${
        size === "sm" ? "w-7 h-7 text-xs" : "w-8 h-8 text-sm"
      } ${className}`}
    >
      <div className="flex items-center">
        <span>i</span>
        <span className="text-orange-400">G</span>
      </div>
    </div>
  );
}

/**
 * Watermark Logo for Dashboard Backgrounds ("dashbod ma logo bg ma ligh color ma dike")
 * Sits subtly in the viewport background without blocking interactions.
 */
export function DashboardWatermark() {
  return (
    <div
      className="fixed inset-0 pointer-events-none select-none z-0 flex items-center justify-center overflow-hidden"
      aria-hidden="true"
    >
      <div className="relative flex flex-col items-center justify-center opacity-[0.032] transform -rotate-12 scale-110 sm:scale-125 lg:scale-150">
        <div className="flex items-end gap-2">
          <span className="font-black text-7xl sm:text-9xl text-slate-900 tracking-tighter leading-none">
            immi
          </span>
          <span className="font-black text-7xl sm:text-9xl text-blue-600 tracking-tighter leading-none">
            Go
          </span>
          <svg
            viewBox="0 0 20 20"
            fill="none"
            className="w-16 h-16 sm:w-24 sm:h-24 text-orange-500 mb-4 ml-1 shrink-0"
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
        <div className="text-lg sm:text-2xl font-black text-blue-900 uppercase tracking-[0.35em] mt-3">
          Immigration &bull; Recruitment &bull; Global Mobility
        </div>
      </div>
    </div>
  );
}

/**
 * Employee ID Badge Styled in the signature immiGo Brand Identity ("employe id logo jaisa bnao")
 */
export function EmployeeIdBadge({ id, size = "md", className = "" }) {
  if (id && /^[0-9a-fA-F]{24}$/.test(id)) {
    return null;
  }
  const cleanId = id || "EMP-001";
  const isSm = size === "sm";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-lg font-black tracking-tight select-none shadow-2xs ${
        isSm
          ? "px-2 py-0.5 text-[10px] bg-blue-50/95 border border-blue-200/90 text-slate-900"
          : "px-2.5 py-1 text-xs bg-blue-50/95 border border-blue-200/90 text-slate-900"
      } ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0 animate-pulse"></span>
      <span className="font-black text-slate-900 tracking-tight">{cleanId}</span>
      <svg
        viewBox="0 0 20 20"
        fill="none"
        className={`${isSm ? "w-2.5 h-2.5" : "w-3 h-3"} text-orange-500 shrink-0`}
      >
        <path
          d="M3 10h14M10 3l7 7-7 7"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

export default ImmiGoLogo;

