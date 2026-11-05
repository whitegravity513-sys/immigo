import React from "react";

export function HireFlowIcon({ className = "", size = 40 }) {
  return (
    <div
      style={{ width: size, height: size }}
      className={`relative rounded-2xl bg-gradient-to-tr from-blue-700 via-indigo-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-600/30 overflow-hidden shrink-0 ${className}`}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-3/5 h-3/5 text-white"
      >
        <path
          d="M5 12h14M12 5l7 7-7 7"
          stroke="white"
          strokeWidth="2.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <div className="absolute inset-0 bg-gradient-to-t from-white/0 via-white/10 to-white/25 pointer-events-none" />
    </div>
  );
}

export function HireFlowBrand({ className = "", subtitle = "Vendor HR Portal", light = false }) {
  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      <HireFlowIcon size={38} />
      <div>
        <div className={`text-xl font-extrabold tracking-tight ${light ? "text-slate-900" : "text-white"}`}>
          IMMI<span className="text-blue-400">GO</span>
        </div>
        {subtitle && (
          <div className="text-[10px] font-bold text-blue-200/90 uppercase tracking-wider -mt-0.5">
            {subtitle}
          </div>
        )}
      </div>
    </div>
  );
}

export default HireFlowBrand;

