import React from "react";

export default function MilestoneTabsNav({
  milestonesList,
  activeMilestoneIdx,
  setActiveMilestoneIdx,
  totalAmount,
  setTotalAmount,
  autoSyncMilestones,
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-3 sm:p-3.5 space-y-2.5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
        <div>
          <h3 className="text-xs font-bold text-slate-900">Total Placement Fee Configuration</h3>
          <p className="text-[10px] text-slate-500 font-medium">Split overall candidate package into milestone payments.</p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-700">Total Amount:</span>
          <div className="relative">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">₹</span>
            <input
              type="number"
              value={totalAmount}
              onChange={(e) => {
                const val = Number(e.target.value);
                setTotalAmount(val);
                autoSyncMilestones(milestonesList, val);
              }}
              className="w-28 pl-6 pr-2.5 py-1 rounded-lg border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#163868]"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {milestonesList.map((m, idx) => {
          const isSelected = activeMilestoneIdx === idx;
          const isDone = m.status === "Completed";
          const isPaid = m.status === "Paid" || m.paymentStatus === "Approved" || isDone;
          const isLocked = m.status === "Locked";
          const amt = Number(m.paymentAmount ?? m.amount ?? 0);

          return (
            <button
              key={m.id || idx}
              onClick={() => setActiveMilestoneIdx(idx)}
              className={`p-2.5 rounded-lg border text-left transition-all duration-150 cursor-pointer ${isSelected
                ? "border-[#163868] bg-blue-50/60 shadow-2xs ring-1 ring-[#163868]/20"
                : "border-slate-200 bg-white hover:bg-slate-50"
                }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                  Phase {idx + 1}
                </span>
                <span
                  className={`px-1.5 py-0.2 rounded-md text-[9px] font-bold ${isDone
                    ? "bg-blue-100 text-[#163868] border border-blue-200"
                    : isPaid
                      ? "bg-blue-50 text-[#163868] border border-blue-200"
                      : isLocked
                        ? "bg-slate-100 text-slate-600"
                        : "bg-[#163868] text-white"
                    }`}
                >
                  {isDone ? "✓ Completed" : isPaid ? "Paid & Verified" : isLocked ? "Locked" : "In Progress"}
                </span>
              </div>
              <div className="font-bold text-xs text-slate-900 truncate">{m.name}</div>
              <div className="text-[11px] font-bold text-slate-600 mt-0.5">₹{amt.toLocaleString()}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

