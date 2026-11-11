import {
  Search,
  Plus,
  Sliders,
  FileText,
  ExternalLink,
  Building2,
  ArrowRight,
  Check,
  X,
  Clock,
  Calendar,
  Award,
  RotateCcw,
} from "lucide-react";
import {
  getCandidateInitials,
  formatCandidateEmail,
  extractCandidateDocuments,
  getEffectiveStage,
} from "../shared/vendorHRUtils.jsx";
import { openUploadedDocument } from "../../../utils/printDocument.js";
import { isAppRefundLocked } from "../../../services/refundService.js";

export default function VendorHRCandidatesSection({
  applications = [],
  refunds = [],
  vendorName = "",
  hideProjectNames = false,
  candidateSearch = "",
  setCandidateSearch,
  candidateStageFilter = "ALL",
  setCandidateStageFilter,
  setActiveMenu,
  setShowSubmitModal,
  openCandidateModal,
  handleQuickStage,
  setScheduleInterviewTarget,
  setScheduleForm,
  setShowScheduleModal,
  openReassignModal,
  navigateByTag,
}) {
  const preSelectionCandidates = applications.filter((cand) => {
    if (isAppRefundLocked(cand, refunds)) return false;
    const stage = getEffectiveStage(cand);
    return !["Joined", "Deployed"].includes(stage);
  });

  const preSelectionCount = preSelectionCandidates.length;
  const postSelectionCount = applications.filter((cand) => {
    if (isAppRefundLocked(cand, refunds)) return false;
    const stage = getEffectiveStage(cand);
    return [
      "Selected",
      "Processing",
      "Offer Released",
      "Offer Accepted",
      "Visa Processing",
      "Visa Issued",
      "Visa Allotted",
      "Joined",
      "Deployed",
      "Completed",
    ].includes(stage);
  }).length;

  const filteredCandidates = preSelectionCandidates.filter((cand) => {
    if (candidateStageFilter !== "ALL") {
      const stage = getEffectiveStage(cand);
      if (candidateStageFilter === "Applied") {
        if (!["Applied", "Screening", "Submitted", "Under Review"].includes(stage)) return false;
      } else if (candidateStageFilter === "Shortlisted") {
        if (stage !== "Shortlisted") return false;
      } else if (candidateStageFilter === "Interview") {
        if (!stage.toLowerCase().includes("interview")) return false;
      } else if (candidateStageFilter === "On Hold") {
        if (stage !== "On Hold") return false;
      } else if (candidateStageFilter === "Rejected") {
        if (stage !== "Rejected") return false;
      } else if (stage !== candidateStageFilter) {
        return false;
      }
    }

    if (!candidateSearch) return true;
    const q = candidateSearch.toLowerCase();
    const cleanEmail = formatCandidateEmail(cand.candidateEmail);
    return (
      cand.candidateName?.toLowerCase().includes(q) ||
      cand.candidateId?.toLowerCase().includes(q) ||
      cand.passportNumber?.toLowerCase().includes(q) ||
      cand.jobTitle?.toLowerCase().includes(q) ||
      (!hideProjectNames && cand.projectName?.toLowerCase().includes(q)) ||
      cand.phone?.toLowerCase().includes(q) ||
      cand.candidatePhone?.toLowerCase().includes(q) ||
      cleanEmail.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-4">
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900">Candidate Directory & Screening</h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200">
              {preSelectionCount} Candidates
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Review full profiles, CVs, and passports, shortlist candidates, schedule interviews, and manage hiring decisions.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveMenu("milestones")}
            className="px-3 py-2 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 font-bold text-xs border border-teal-200 transition flex items-center gap-1.5 cursor-pointer"
          >
            <Sliders size={13} className="text-teal-700" />
            <span>Selected Milestones ({postSelectionCount})</span>
          </button>
          <button
            type="button"
            onClick={() => setShowSubmitModal(true)}
            className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer"
          >
            <Plus size={14} />
            <span>Submit Candidate</span>
          </button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={candidateSearch}
            onChange={(e) => setCandidateSearch(e.target.value)}
            placeholder={
              hideProjectNames
                ? "Search candidate by name, ID, passport, trade or phone..."
                : "Search candidate by name, ID, passport, trade, project or phone..."
            }
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-600"
          />
        </div>

        <div className="flex items-center space-x-1.5 flex-wrap">
          {[
            { id: "ALL", label: `All (${preSelectionCount})` },
            {
              id: "Applied",
              label: `Applied (${
                preSelectionCandidates.filter((c) =>
                  ["Applied", "Screening", "Submitted", "Under Review"].includes(getEffectiveStage(c))
                ).length
              })`,
            },
            {
              id: "Shortlisted",
              label: `Shortlisted (${
                preSelectionCandidates.filter((c) => getEffectiveStage(c) === "Shortlisted").length
              })`,
            },
            {
              id: "Interview",
              label: `Interview (${
                preSelectionCandidates.filter((c) =>
                  getEffectiveStage(c).toLowerCase().includes("interview")
                ).length
              })`,
            },
            {
              id: "On Hold",
              label: `On Hold (${
                preSelectionCandidates.filter((c) => getEffectiveStage(c) === "On Hold").length
              })`,
            },
            {
              id: "Rejected",
              label: `Rejected (${
                preSelectionCandidates.filter((c) => getEffectiveStage(c) === "Rejected").length
              })`,
            },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setCandidateStageFilter(tab.id)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                candidateStageFilter === tab.id
                  ? "bg-blue-600 text-white shadow-2xs"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/90 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10.5px]">
              <tr>
                <th className="py-3 px-4">Candidate &amp; Resume</th>
                <th className="py-3 px-4">{hideProjectNames ? "Trade & Agency" : "Trade & Project"}</th>
                <th className="py-3 px-3">Stage</th>
                <th className="py-3 px-4">Actions</th>
                <th className="py-3 px-4 text-right">Profile</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredCandidates.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-10 text-center text-slate-400">
                    No candidates found matching criteria.
                  </td>
                </tr>
              ) : (
                filteredCandidates.map((cand, idx) => {
                  const effectiveStage = getEffectiveStage(cand);
                  const cleanEmail = formatCandidateEmail(cand.candidateEmail);
                  const { primaryResume } = extractCandidateDocuments(cand);
                  const isPreScreening = ["Applied", "Screening", "Submitted", "Under Review"].includes(
                    effectiveStage
                  );
                  const isShortlisted = effectiveStage === "Shortlisted";
                  const isInterview = effectiveStage.toLowerCase().includes("interview");
                  const isOnHold = effectiveStage === "On Hold";
                  const isRejected = effectiveStage === "Rejected";
                  const isSelectedPipeline = [
                    "Selected",
                    "Processing",
                    "Offer Released",
                    "Offer Accepted",
                    "Visa Processing",
                    "Visa Issued",
                    "Visa Allotted",
                    "Completed",
                  ].includes(effectiveStage);

                  return (
                    <tr key={cand.applicationId || cand.id || idx} className="hover:bg-blue-50/20 transition">
                      <td className="py-3 px-4">
                        <div className="flex items-start space-x-2.5">
                          <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                            {getCandidateInitials(cand.candidateName)}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-slate-900 text-xs truncate">{cand.candidateName}</span>
                              {cand.candidateId && (
                                <span className="text-[10px] font-mono font-bold text-slate-600 bg-slate-100 px-1.5 py-0.2 rounded">
                                  {cand.candidateId}
                                </span>
                              )}
                            </div>
                            <div className="text-[10.5px] text-slate-500 truncate mt-0.5 flex items-center gap-2 flex-wrap">
                              {cand.passportNumber && (
                                <span className="font-mono">Passport: {cand.passportNumber}</span>
                              )}
                              {(cand.candidatePhone || cand.phone) && (
                                <span>{cand.candidatePhone || cand.phone}</span>
                              )}
                              {cleanEmail && <span>{cleanEmail}</span>}
                            </div>
                            {primaryResume ? (
                              <button
                                type="button"
                                onClick={() => openUploadedDocument(primaryResume)}
                                className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 px-2 py-0.5 rounded border border-blue-200 mt-1 cursor-pointer transition"
                                title="Open Candidate Resume / CV in new tab"
                              >
                                <FileText size={10} />
                                <span>View CV / Resume</span>
                                <ExternalLink size={9} />
                              </button>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded mt-1">
                                <FileText size={10} />
                                <span>No CV</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-800 text-xs truncate max-w-[190px]">
                          {cand.jobTitle || "Specialist Technician"}
                        </div>
                        {!hideProjectNames && (
                          <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                            <Building2 size={11} className="text-slate-400 shrink-0" />
                            <span className="truncate max-w-[180px]">{cand.projectName || "Overseas Deployment"}</span>
                          </div>
                        )}
                        {(cand.vendorName || vendorName) && (
                          <div className="text-[10px] text-indigo-700 font-semibold mt-0.5">
                            Vendor: {cand.vendorName || vendorName}
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-3">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (navigateByTag) navigateByTag(effectiveStage, cand);
                          }}
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold border inline-flex items-center gap-1 whitespace-nowrap cursor-pointer hover:shadow-xs transition ${
                            isShortlisted
                              ? "bg-indigo-50 text-indigo-800 border-indigo-200 hover:bg-indigo-100"
                              : isInterview
                              ? "bg-purple-50 text-purple-800 border-purple-200 hover:bg-purple-100"
                              : isRejected
                              ? "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100"
                              : isOnHold
                              ? "bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100"
                              : isSelectedPipeline
                              ? "bg-teal-50 text-teal-800 border-teal-200 hover:bg-teal-100"
                              : "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200"
                          }`}
                          title={`Click to open ${effectiveStage} section`}
                        >
                          <span>{isRejected ? "✕" : "●"} {effectiveStage}</span>
                          <ArrowRight size={10} className="text-slate-400 shrink-0" />
                        </button>

                        {cand.rejectionReason && (
                          <div
                            className="text-[10px] text-rose-600 font-medium truncate max-w-[160px] mt-1"
                            title={cand.rejectionReason}
                          >
                            Reason: {cand.rejectionReason}
                          </div>
                        )}
                        {isOnHold && cand.holdReason && (
                          <div
                            className="text-[10px] text-amber-700 font-medium truncate max-w-[160px] mt-1"
                            title={cand.holdReason}
                          >
                            Note: {cand.holdReason}
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        {isPreScreening ? (
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <button
                              type="button"
                              onClick={() => handleQuickStage(cand, "Shortlisted")}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] transition inline-flex items-center gap-1 cursor-pointer shadow-2xs"
                            >
                              <Check size={11} />
                              <span>Shortlist</span>
                            </button>
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
                              className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] transition inline-flex items-center gap-1 cursor-pointer shadow-2xs"
                            >
                              <Calendar size={11} />
                              <span>Interview</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleQuickStage(cand, "Selected")}
                              className="px-2.5 py-1 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold text-[11px] transition inline-flex items-center gap-1 cursor-pointer shadow-2xs"
                            >
                              <Award size={11} />
                              <span>Select</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleQuickStage(cand, "Rejected", "Rejected during HR screening")}
                              className="px-2 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-[11px] border border-rose-200 transition inline-flex items-center gap-1 cursor-pointer"
                            >
                              <X size={11} />
                              <span>Reject</span>
                            </button>
                          </div>
                        ) : isShortlisted ? (
                          <div className="flex items-center gap-1.5 flex-wrap">
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
                              className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] transition inline-flex items-center gap-1 cursor-pointer shadow-2xs"
                            >
                              <Calendar size={11} />
                              <span>Schedule Interview</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleQuickStage(cand, "Selected")}
                              className="px-2.5 py-1 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold text-[11px] transition inline-flex items-center gap-1 cursor-pointer shadow-2xs"
                            >
                              <Award size={11} />
                              <span>Select</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleQuickStage(cand, "Rejected", "Rejected after shortlisting")}
                              className="px-2 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-[11px] border border-rose-200 transition inline-flex items-center gap-1 cursor-pointer"
                            >
                              <X size={11} />
                              <span>Reject</span>
                            </button>
                          </div>
                        ) : isInterview ? (
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <button
                              type="button"
                              onClick={() => handleQuickStage(cand, "Selected")}
                              className="px-2.5 py-1 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold text-[11px] transition inline-flex items-center gap-1 cursor-pointer shadow-2xs"
                            >
                              <Award size={11} />
                              <span>Select</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleQuickStage(cand, "On Hold", "Candidate placed on hold after interview")}
                              className="px-2 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-[11px] border border-amber-200 transition inline-flex items-center gap-1 cursor-pointer"
                            >
                              <Clock size={11} />
                              <span>Hold</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleQuickStage(cand, "Rejected", "Did not clear technical interview round")}
                              className="px-2 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-[11px] border border-rose-200 transition inline-flex items-center gap-1 cursor-pointer"
                            >
                              <X size={11} />
                              <span>Reject</span>
                            </button>
                          </div>
                        ) : isOnHold ? (
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <button
                              type="button"
                              onClick={() => handleQuickStage(cand, "Selected")}
                              className="px-2.5 py-1 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold text-[11px] transition inline-flex items-center gap-1 cursor-pointer shadow-2xs"
                            >
                              <Award size={11} />
                              <span>Select</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleQuickStage(cand, "Rejected", "Rejected after on-hold review")}
                              className="px-2 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-[11px] border border-rose-200 transition inline-flex items-center gap-1 cursor-pointer"
                            >
                              <X size={11} />
                              <span>Reject</span>
                            </button>
                          </div>
                        ) : isRejected ? (
                          <button
                            type="button"
                            onClick={() => openReassignModal(cand)}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] transition inline-flex items-center gap-1.5 cursor-pointer shadow-2xs"
                          >
                            <RotateCcw size={12} />
                            <span>{hideProjectNames ? "Reassign Candidate" : "Apply to Another Project"}</span>
                          </button>
                        ) : isSelectedPipeline ? (
                          <button
                            type="button"
                            onClick={() => navigateByTag && navigateByTag("Selected", cand)}
                            className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold text-[11px] transition inline-flex items-center gap-1.5 cursor-pointer shadow-2xs"
                          >
                            <Award size={12} />
                            <span>View Milestones</span>
                          </button>
                        ) : null}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => openCandidateModal(cand)}
                          className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition cursor-pointer inline-flex items-center gap-1"
                        >
                          <span>View Details</span>
                          <ArrowRight size={12} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

