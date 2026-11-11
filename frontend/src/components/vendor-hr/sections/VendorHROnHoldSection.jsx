import { useState } from "react";
import {
  Search,
  X,
  Clock,
  Award,
  ArrowRight,
} from "lucide-react";
import { getCandidateInitials, getEffectiveStage } from "../shared/vendorHRUtils.jsx";
import { isAppRefundLocked } from "../../../services/refundService.js";

export default function VendorHROnHoldSection({
  applications = [],
  refunds = [],
  hideProjectNames = false,
  handleQuickStage,
  openCandidateModal,
  navigateByTag,
}) {
  const [onHoldSearch, setOnHoldSearch] = useState("");

  const onHoldCandidates = applications.filter((c) => {
    if (isAppRefundLocked(c, refunds)) return false;
    return getEffectiveStage(c) === "On Hold";
  });

  const filteredOnHold = onHoldCandidates.filter((cand) => {
    if (!onHoldSearch) return true;
    const q = onHoldSearch.toLowerCase();
    return (
      cand.candidateName?.toLowerCase().includes(q) ||
      cand.passportNumber?.toLowerCase().includes(q) ||
      cand.jobTitle?.toLowerCase().includes(q) ||
      (!hideProjectNames && cand.projectName?.toLowerCase().includes(q))
    );
  });

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 sm:p-5 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900">Candidates On Hold</h2>
            <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
              {filteredOnHold.length} On Hold
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Candidates placed on hold after interview. Select or reject once final decision is ready.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative w-64">
            <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search on-hold candidates..."
              value={onHoldSearch}
              onChange={(e) => setOnHoldSearch(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
            />
            {onHoldSearch && (
              <button
                type="button"
                onClick={() => setOnHoldSearch("")}
                className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600"
              >
                <X size={13} />
              </button>
            )}
          </div>
        </div>
      </div>

      {filteredOnHold.length === 0 ? (
        <div className="py-12 px-4 text-center space-y-2 bg-slate-50/60 rounded-xl border border-dashed border-slate-200">
          <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center mx-auto text-amber-600">
            <Clock size={18} />
          </div>
          <h4 className="text-xs font-bold text-slate-700">No Candidates On Hold</h4>
          <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
            No applicants are currently placed on hold.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold text-[11px] uppercase tracking-wider">
                <th className="py-3 px-4">Candidate & Identity</th>
                <th className="py-3 px-4">{hideProjectNames ? "Trade & Agency" : "Trade & Project"}</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-4 text-center">Action</th>
                <th className="py-3 px-4 text-right">Dossier</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOnHold.map((cand, idx) => (
                <tr key={cand.applicationId || cand.id || idx} className="hover:bg-slate-50/60 transition">
                  <td className="py-3.5 px-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-amber-50 text-amber-800 border border-amber-200 flex items-center justify-center font-bold text-[11px] shrink-0">
                        {getCandidateInitials(cand.candidateName)}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-slate-900 text-xs truncate">{cand.candidateName}</h4>
                        <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5 font-mono">
                          <span>{cand.passportNumber ? `Passport: ${cand.passportNumber}` : `ID: ${cand.candidateId || cand.applicationId}`}</span>
                          {cand.candidatePhone && <span>• {cand.candidatePhone}</span>}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-slate-800 truncate">{cand.jobTitle || "Trade Specialist"}</div>
                    {!hideProjectNames ? (
                      <div className="text-[11px] text-blue-700 font-medium truncate mt-0.5">{cand.projectName || "Project"}</div>
                    ) : (
                      cand.vendorName && (
                        <div className="text-[11px] text-indigo-700 font-medium truncate mt-0.5">{cand.vendorName}</div>
                      )
                    )}
                  </td>
                  <td className="py-3.5 px-3 text-center">
                    <button
                      type="button"
                      onClick={() => navigateByTag && navigateByTag("On Hold", cand)}
                      className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 cursor-pointer hover:scale-105 transition"
                      title="Click to view On Hold section"
                    >
                      On Hold
                    </button>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <div className="flex items-center justify-center gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={() => handleQuickStage(cand, "Selected", "Candidate selected from on-hold review")}
                        className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs transition inline-flex items-center gap-1 cursor-pointer shadow-2xs"
                      >
                        <Award size={12} />
                        <span>Select Candidate</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickStage(cand, "Rejected", "Rejected from on-hold")}
                        className="px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs border border-rose-200 transition cursor-pointer inline-flex items-center gap-1"
                      >
                        <X size={12} />
                        <span>Reject</span>
                      </button>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      type="button"
                      onClick={() => openCandidateModal(cand)}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer inline-flex items-center gap-1"
                    >
                      <span>Details</span>
                      <ArrowRight size={12} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

