import React from "react";
import { RECRUITMENT_STAGES } from "../../../../constants/recruitmentStages.js";

export default function VendorRecruitmentTab({ candidates }) {
  return (
    <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
      <h3 className="text-sm font-bold text-white uppercase tracking-wider">
        Recruitment Pipeline Performance
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {RECRUITMENT_STAGES.slice(0, 8).map((stage) => {
          const count = candidates.filter(
            (c) => c.recruitmentStage === stage || c.status === stage
          ).length;
          return (
            <div key={stage} className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/60">
              <div className="text-xs text-slate-400 font-medium">{stage}</div>
              <div className="text-xl font-bold text-white mt-1">{count}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

