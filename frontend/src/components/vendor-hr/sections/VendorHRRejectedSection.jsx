import { useState } from "react";
import {
  Search,
  X,
  XCircle,
  RotateCcw,
  ArrowRight,
} from "lucide-react";
import { getCandidateInitials, getEffectiveStage } from "../shared/vendorHRUtils.jsx";
import { isAppRefundLocked } from "../../../services/refundService.js";

export default function VendorHRRejectedSection({
  applications = [],
  refunds = [],
  hideProjectNames = false,
  openReassignModal,
  openCandidateModal,
  navigateByTag,
}) {
  const [rejectedSearch, setRejectedSearch] = useState("");

  const rejectedCandidates = applications.filter((c) => {
    if (isAppRefundLocked(c, refunds)) return false;
    return getEffectiveStage(c) === "Rejected";
  });

  const filteredRejected = rejectedCandidates.filter((cand) => {
    if (!rejectedSearch) return true;
    const q = rejectedSearch.toLowerCase();
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
            <h2 className="text-base font-bold text-slate-900">Rejected Candidates / Talent Pool</h2>
            <span className="text-xs font-bold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
              {filteredRejected.length} Candidates
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {hideProjectNames
              ? "Candidates rejected in prior evaluations. They remain in your vendor talent pool and can be reassigned to other open requirements."
              : "Candidates rejected in prior project evaluations. They remain in your vendor talent pool and can be re-applied to other open project requirements."}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative w-64">
            <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search rejected candidates..."
              value={rejectedSearch}
              onChange={(e) => setRejectedSearch(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white"
            />
            {rejectedSearch && (
              <button
                type="button"
                onClick={() => setRejectedSearch("")}
                className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600"
              >
                <X size={13} />
              </button>
            )}
          </div>
        </div>
      </div>

      {filteredRejected.length === 0 ? (
        <div className="py-12 px-4 text-center space-y-2 bg-slate-50/60 rounded-xl border border-dashed border-slate-200">
          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
            <XCircle size={18} />
          </div>
          <h4 className="text-xs font-bold text-slate-700">No Rejected Candidates</h4>
          <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
            There are no rejected candidates in your current talent pool.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold text-[11px] uppercase tracking-wider">
                <th className="py-3 px-4">Candidate & Identity</th>
                <th className="py-3 px-4">{hideProjectNames ? "Trade & Agency" : "Previous Project & Trade"}</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-4 text-center">Talent Pool Action</th>
                <th className="py-3 px-4 text-right">Dossier</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRejected.map((cand, idx) => (
                <tr key={cand.applicationId || cand.id || idx} className="hover:bg-slate-50/60 transition">
                  <td className="py-3.5 px-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-rose-50 text-rose-700 border border-rose-200 flex items-center justify-center font-bold text-[11px] shrink-0">
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
                      <div className="text-[11px] text-slate-500 font-medium truncate mt-0.5">{cand.projectName || "Previous Project"}</div>
                    ) : (
                      cand.vendorName && (
                        <div className="text-[11px] text-indigo-700 font-medium truncate mt-0.5">{cand.vendorName}</div>
                      )
                    )}
                  </td>
                  <td className="py-3.5 px-3 text-center">
                    <button
                      type="button"
                      onClick={() => navigateByTag && navigateByTag("Rejected", cand)}
                      className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 cursor-pointer hover:scale-105 transition"
                      title="Click to view Rejected section"
                    >
                      Rejected
                    </button>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <button
                      type="button"
                      onClick={() => openReassignModal(cand)}
                      className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition inline-flex items-center gap-1.5 cursor-pointer shadow-2xs"
                      title={hideProjectNames ? "Reassign this candidate to another requirement" : "Submit this candidate to another open project requirement"}
                    >
                      <RotateCcw size={12} />
                      <span>{hideProjectNames ? "Reassign Candidate" : "Apply to Another Project"}</span>
                    </button>
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

