import React from 'react';

/**
 * Reusable statistic card used across the admin dashboard.
 * Props:
 * - icon: React element for the visual icon.
 * - label: Short description string.
 * - value: Display value (string or number).
 * - bgColor: Tailwind background color class (e.g., 'bg-emerald-50').
 * - textColor: Tailwind text color class (e.g., 'text-emerald-600').
 * - id: optional unique id for testing.
 */
export default function StatCard({ icon, label, value, bgColor = 'bg-slate-50', textColor = 'text-slate-800', id }) {
  return (
    <div
      id={id}
      className={`flex items-center gap-3 p-4 rounded-2xl border border-slate-200/60 shadow-xs ${bgColor}`}
    >
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${bgColor.replace('bg-', 'bg-')}`}>
        {icon}
      </div>
      <div>
        <div className={`text-xl font-black ${textColor}`}>{value}</div>
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">{label}</div>
      </div>
    </div>
  );
}
