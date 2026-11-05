import React from "react";
import { Link } from "react-router-dom";
import { IndianRupee, Unlock, CheckCircle2, FileText, Check, ShieldCheck } from "lucide-react";

export default function MilestoneHeaderCard({
  currentM,
  activeMilestoneIdx,
  milestonesList,
  setMilestonesList,
  autoSyncMilestones,
  isCurrentPaid,
  isCurrentCompleted,
  application,
  onOpenRecordPayment,
  onUnlockMilestone,
  onCompleteMilestone,
}) {
  return (
    <>
      <div className="p-3 sm:p-3.5 bg-slate-50 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex-1 max-w-sm">
          <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">
            Milestone Name
          </label>
          <input
            type="text"
            value={currentM.name}
            onChange={(e) => {
              const updated = [...milestonesList];
              updated[activeMilestoneIdx].name = e.target.value;
              setMilestonesList(updated);
              autoSyncMilestones(updated);
            }}
            className="w-full px-2.5 py-1 rounded-lg border border-slate-300 bg-white font-bold text-xs text-slate-900 focus:outline-none focus:border-[#163868]"
          />
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <div>
            <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">
              Milestone Fee
            </label>
            <div className="relative">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">₹</span>
              <input
                type="number"
                value={currentM.amount || currentM.paymentAmount || 15000}
                onChange={(e) => {
                  const updated = [...milestonesList];
                  const val = Number(e.target.value);
                  updated[activeMilestoneIdx].amount = val;
                  updated[activeMilestoneIdx].paymentAmount = val;
                  setMilestonesList(updated);
                  autoSyncMilestones(updated);
                }}
                className="w-28 pl-6 pr-2.5 py-1 rounded-lg border border-slate-300 bg-white font-bold text-xs text-slate-900 focus:outline-none focus:border-[#163868]"
              />
            </div>
          </div>

          <div className="pt-3.5 flex items-center gap-2">
            {!isCurrentPaid ? (
              <>
                <button
                  onClick={() => onOpenRecordPayment(activeMilestoneIdx)}
                  className="px-3 py-1.5 rounded-lg bg-[#163868] hover:bg-[#1e4a82] text-white font-bold text-xs shadow-2xs flex items-center gap-1 cursor-pointer transition"
                >
                  <IndianRupee size={13} />
                  <span>Record Payment</span>
                </button>
                <button
                  onClick={() => onUnlockMilestone(activeMilestoneIdx)}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs flex items-center gap-1 cursor-pointer transition"
                  title="Direct Unlock Milestone"
                >
                  <Unlock size={12} />
                  <span>Direct Unlock</span>
                </button>
              </>
            ) : (
              <>
                <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-[#163868] border border-blue-200 text-xs font-bold flex items-center gap-1">
                  <CheckCircle2 size={13} className="text-[#163868]" />
                  <span>{isCurrentCompleted ? "Milestone Completed" : "Paid & Verified"}</span>
                </span>
                <Link
                  to={`/invoice/${application.applicationId || application.id}/${currentM.id}`}
                  target="_blank"
                  className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1 cursor-pointer transition"
                >
                  <FileText size={12} />
                  <span>Receipt</span>
                </Link>
              </>
            )}

            {!isCurrentCompleted && (
              <button
                onClick={() => onCompleteMilestone(activeMilestoneIdx)}
                className="px-3 py-1.5 rounded-lg bg-[#163868] hover:bg-[#1e4a82] text-white font-bold text-xs flex items-center gap-1 cursor-pointer transition shadow-2xs"
                title="Mark all stages completed and advance to the next process"
              >
                <Check size={13} />
                <span>Complete & Next Phase</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {(currentM.paymentRef || currentM.paymentDate) && (
        <div className="px-3.5 py-2 bg-blue-50/50 border-b border-blue-100 text-xs flex items-center justify-between text-slate-700 flex-wrap gap-2">
          <div className="flex items-center gap-2 font-medium text-[11px]">
            <ShieldCheck className="w-3.5 h-3.5 text-[#163868]" />
            <span>
              Ref ID: <strong className="font-mono text-slate-900">{currentM.paymentRef || "N/A"}</strong>
            </span>
            {currentM.paymentDate && <span>• Date: {currentM.paymentDate}</span>}
            {currentM.approvedBy && <span>• Verified By: {currentM.approvedBy}</span>}
          </div>
          {currentM.paymentRemark && (
            <span className="text-[10px] text-slate-500 italic">"{currentM.paymentRemark}"</span>
          )}
        </div>
      )}
    </>
  );
}

