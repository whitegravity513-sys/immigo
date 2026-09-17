import React from "react";
import { Users, UserCheck, Clock, Award, CheckCircle2 } from "lucide-react";

export default function DeptHRWidgets() {
  const recruitmentStats = [
    { label: "Screening", count: 42, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Technical Interview", count: 18, color: "text-indigo-600", bg: "bg-indigo-50" },
    { label: "Offer Issued", count: 8, color: "text-amber-600", bg: "bg-amber-50" },
    { label: "Onboarded (This Month)", count: 14, color: "text-emerald-600", bg: "bg-emerald-50" },
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
            <Users size={18} />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900">Manpower & Recruitment Funnel</h3>
            <p className="text-[11px] text-slate-500 font-medium">Candidate pipeline & deployment status</p>
          </div>
        </div>
        <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
          Batch 2026-Q3
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {recruitmentStats.map((item, idx) => (
          <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-100">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{item.label}</div>
            <div className={`text-xl font-black ${item.color} mt-1`}>{item.count}</div>
            <div className="text-[10px] text-slate-500 font-semibold mt-0.5">Candidates</div>
          </div>
        ))}
      </div>
    </div>
  );
}
