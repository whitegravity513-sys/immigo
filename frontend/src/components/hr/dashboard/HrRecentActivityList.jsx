import React from "react";

export default function HrRecentActivityList({ recentHrActivity }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200/90 shadow-2xs overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
        <h2 className="text-xs sm:text-sm font-bold text-gray-900">Recent HR Activity</h2>
        <span className="text-[10px] text-gray-400">Chronological event log</span>
      </div>

      <div className="divide-y divide-gray-100">
        {recentHrActivity.map((act) => (
          <div key={act.id} className="px-4 py-3 flex items-center justify-between gap-3 text-xs hover:bg-gray-50/50 transition-colors">
            <div>
              <p className="font-bold text-gray-900">{act.title}</p>
              <p className="text-[11px] text-gray-500 mt-0.5">{act.desc}</p>
            </div>
            <span className="text-[10px] text-gray-400 shrink-0">{act.time}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
