import { useState } from "react";
import {
  Search,
  X,
  UserCheck,
  Calendar,
  ArrowRight,
} from "lucide-react";
import { getCandidateInitials, getEffectiveStage } from "../shared/vendorHRUtils.jsx";
import { isAppRefundLocked } from "../../../services/refundService.js";

export default function VendorHRShortlistedSection({
  applications = [],
  refunds = [],
  hideProjectNames = false,
  setScheduleInterviewTarget,
  setScheduleForm,
  setShowScheduleModal,
  handleQuickStage,
  openCandidateModal,
  navigateByTag,
}) {
  const [shortlistSearch, setShortlistSearch] = useState("");

  const shortlistedCandidates = applications.filter((c) => {
    if (isAppRefundLocked(c, refunds)) return false;
    return getEffectiveStage(c) === "Shortlisted";
  });

  const filteredShortlisted = shortlistedCandidates.filter((cand) => {
    if (!shortlistSearch) return true;
    const q = shortlistSearch.toLowerCase();
    return (
      cand.candidateName?.toLowerCase().includes(q) ||
      cand.passportNumber?.toLowerCase().includes(q) ||
      cand.jobTitle?.toLowerCase().includes(q) ||
      cand.vendorName?.toLowerCase().includes(q) ||
      (!hideProjectNames && cand.projectName?.toLowerCase().includes(q))
    );
  });

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 sm:p-5 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base font-bold text-slate-900">Shortlisted Candidates Roster</h2>
            <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200 whitespace-nowrap">
              {filteredShortlisted.length} Shortlisted
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Candidates approved by HR screening. Schedule technical rounds or reject before interview.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
          <div className="relative w-full sm:w-64">
            <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search shortlisted candidates..."
              value={shortlistSearch}
              onChange={(e) => setShortlistSearch(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white"
            />
            {shortlistSearch && (
              <button
                type="button"
                onClick={() => setShortlistSearch("")}
                className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600"
              >
                <X size={13} />
              </button>
            )}
          </div>
        </div>
      </div>

      {filteredShortlisted.length === 0 ? (
        <div className="py-12 px-4 text-center space-y-2 bg-slate-50/60 rounded-xl border border-dashed border-slate-200">
          <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center mx-auto text-indigo-600">
            <UserCheck size={18} />
          </div>
          <h4 className="text-xs font-bold text-slate-700">No Shortlisted Candidates</h4>
          <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
            Screen candidates from the &quot;All Candidates&quot; directory to shortlist candidates for upcoming interviews.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full min-w-[760px] text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold text-[11px] uppercase tracking-wider">
                <th className="py-3 px-4">Candidate & Identity</th>
                <th className="py-3 px-4">{hideProjectNames ? "Applied Trade & Agency" : "Applied Trade & Project"}</th>
                <th className="py-3 px-3 text-center">Stage</th>
                <th className="py-3 px-4 text-center">Next Action</th>
                <th className="py-3 px-4 text-right">Dossier</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredShortlisted.map((cand, idx) => (
                <tr key={cand.applicationId || cand.id || idx} className="hover:bg-slate-50/60 transition">
                  <td className="py-3.5 px-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center justify-center font-bold text-[11px] shrink-0">
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
                    <div className="text-[11px] text-blue-700 font-medium truncate mt-0.5">
                      {hideProjectNames
                        ? cand.vendorName || cand.destinationCountry || "Shortlisted Trade"
                        : cand.projectName || cand.destinationCountry || "-"}
                    </div>
                  </td>
                  <td className="py-3.5 px-3 text-center whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => navigateByTag && navigateByTag("Shortlisted", cand)}
                      className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 cursor-pointer hover:scale-105 transition whitespace-nowrap"
                      title="Click to view Shortlisted section"
                    >
                      Shortlisted
                    </button>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex flex-wrap items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const appId = cand.applicationId || cand.id || cand._id;
                          setScheduleInterviewTarget({ ...cand, applicationId: appId });
                          setScheduleForm((prev) => ({
                            ...prev,
                            applicationId: appId,
                            round: "Technical Interview",
                          }));
                          setShowScheduleModal(true);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition inline-flex items-center gap-1.5 cursor-pointer shadow-2xs whitespace-nowrap"
                      >
                        <Calendar size={13} />
                        <span>Schedule Interview</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickStage(cand, "Rejected", "Rejected during shortlisting")}
                        className="px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs border border-rose-200 transition inline-flex items-center gap-1 cursor-pointer whitespace-nowrap"
                        title="Reject Candidate"
                      >
                        <X size={12} />
                        <span>Reject</span>
                      </button>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => openCandidateModal(cand)}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer inline-flex items-center gap-1 whitespace-nowrap"
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

