import React from "react";

export default function CandidatePoolFilterCards({
  totalCandidates,
  freshCount,
  rejectedCount,
  busyCandidatesCount,
  categoryFilter,
  setCategoryFilter,
}) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-3">
      <div
        onClick={() => setCategoryFilter("All")}
        className={`p-2 rounded-lg border transition-all cursor-pointer ${
          categoryFilter === "All"
            ? "bg-slate-100 border-slate-400 ring-2 ring-slate-400 shadow-xs"
            : "bg-white border-slate-200 hover:bg-slate-50 shadow-2xs"
        }`}
      >
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Total Assignable</span>
        <span className="text-base sm:text-lg font-bold text-slate-900">{totalCandidates}</span>
        <span className="text-[10px] text-slate-400 block">In available pool</span>
      </div>

      <div
        onClick={() => setCategoryFilter("fresh")}
        className={`p-2 rounded-lg border transition-all cursor-pointer ${
          categoryFilter === "fresh"
            ? "bg-emerald-100 border-emerald-400 ring-2 ring-emerald-500 shadow-xs"
            : "bg-emerald-50/70 border-emerald-200 hover:bg-emerald-100/70 shadow-2xs"
        }`}
      >
        <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">Fresh Candidates</span>
        <span className="text-base sm:text-lg font-bold text-emerald-800">{freshCount}</span>
        <span className="text-[10px] text-emerald-600 block">Never submitted</span>
      </div>

      <div
        onClick={() => setCategoryFilter("rejected")}
        className={`p-2 rounded-lg border transition-all cursor-pointer ${
          categoryFilter === "rejected"
            ? "bg-rose-100 border-rose-400 ring-2 ring-rose-500 shadow-xs"
            : "bg-rose-50/70 border-rose-200 hover:bg-rose-100/70 shadow-2xs"
        }`}
      >
        <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wider block">Rejected (Reusable)</span>
        <span className="text-base sm:text-lg font-bold text-rose-800">{rejectedCount}</span>
        <span className="text-[10px] text-rose-600 block">Ready to re-assign</span>
      </div>

      <div
        onClick={() => setCategoryFilter("in_progress")}
        className={`p-2 rounded-lg border transition-all cursor-pointer ${
          categoryFilter === "in_progress"
            ? "bg-indigo-100 border-indigo-400 ring-2 ring-indigo-500 shadow-xs"
            : "bg-indigo-50/70 border-indigo-200 hover:bg-indigo-100/70 shadow-2xs"
        }`}
      >
        <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider block">In Progress / Active</span>
        <span className="text-base sm:text-lg font-bold text-indigo-800">{busyCandidatesCount}</span>
        <span className="text-[10px] text-indigo-600 block">Click to view active ({busyCandidatesCount})</span>
      </div>
    </div>
  );
}
