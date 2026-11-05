import React from "react";
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
  Calendar,
  Award,
  RotateCcw,
} from "lucide-react";
import { AVATARS } from "../shared/vendorHRUtils.jsx";

export default function VendorHRCandidatesSection({
  applications = [],
  vendorName = "Global Staffing Solutions Pvt Ltd",
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
    const stage = cand.recruitmentStage || cand.status || "Applied";
    return !["Joined", "Deployed"].includes(stage);
  });

  const preSelectionCount = preSelectionCandidates.length;
  const postSelectionCount = applications.filter((cand) => {
    const stage = cand.recruitmentStage || cand.status || "";
    return ["Selected", "Offer Released", "Offer Accepted", "Visa Processing", "Visa Issued", "Joined", "Deployed"].includes(stage);
  }).length;

  const filteredCandidates = preSelectionCandidates.filter((cand) => {
    if (candidateStageFilter !== "ALL") {
      const stage = cand.recruitmentStage || cand.status || "Applied";
      if (candidateStageFilter === "Applied") {
        if (!["Applied", "Screening", "Submitted", "Under Review", "On Hold"].includes(stage)) return false;
      } else if (candidateStageFilter === "Shortlisted") {
        if (stage !== "Shortlisted") return false;
      } else if (candidateStageFilter === "Interview") {
        if (!stage.includes("Interview")) return false;
      } else if (candidateStageFilter === "Rejected") {
        if (stage !== "Rejected") return false;
      } else if (stage !== candidateStageFilter) {
        return false;
      }
    }

    if (!candidateSearch) return true;
    const q = candidateSearch.toLowerCase();
    return (
      cand.candidateName?.toLowerCase().includes(q) ||
      cand.passportNumber?.toLowerCase().includes(q) ||
      cand.jobTitle?.toLowerCase().includes(q) ||
      cand.projectName?.toLowerCase().includes(q) ||
      cand.phone?.toLowerCase().includes(q) ||
      cand.candidateEmail?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-4">
      {/* Header Card */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900">Candidate Directory & Screening</h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200">
              {preSelectionCount} Candidates
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Evaluate profiles, review CV & passport, shortlist, hold, reject, and schedule interviews. Selected candidates move to <strong>Candidate Milestones</strong>.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveMenu("milestones")}
            className="px-3 py-2 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 font-bold text-xs border border-teal-200 transition flex items-center gap-1.5 cursor-pointer"
          >
            <Sliders size={13} className="text-teal-700" />
            <span>Go to Selected Milestones ({postSelectionCount})</span>
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

      {/* Search & Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={candidateSearch}
            onChange={(e) => setCandidateSearch(e.target.value)}
            placeholder="Search candidate by name, passport, trade, project or phone..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-600"
          />
        </div>

        {/* Status Tabs Bar */}
        <div className="flex items-center space-x-1.5 flex-wrap">
          {[
            { id: "ALL", label: `All (${preSelectionCount})` },
            {
              id: "Applied",
              label: `Applied (${
                preSelectionCandidates.filter(
                  (c) =>
                    !c.recruitmentStage ||
                    ["Applied", "Screening", "Submitted", "Under Review", "On Hold"].includes(c.recruitmentStage) ||
                    ["Applied", "Submitted", "Under Review"].includes(c.status)
                ).length
              })`,
            },
            {
              id: "Shortlisted",
              label: `Shortlisted (${
                preSelectionCandidates.filter((c) => c.recruitmentStage === "Shortlisted" || c.status === "Shortlisted").length
              })`,
            },
            {
              id: "Interview",
              label: `Interview (${
                preSelectionCandidates.filter(
                  (c) => c.recruitmentStage?.includes("Interview") || c.status?.includes("Interview")
                ).length
              })`,
            },
            {
              id: "Rejected",
              label: `Rejected (${
                preSelectionCandidates.filter((c) => c.recruitmentStage === "Rejected" || c.status === "Rejected").length
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

      {/* Pre-Selection Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/90 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10.5px]">
              <tr>
                <th className="py-3 px-4">Candidate Profile & CV</th>
                <th className="py-3 px-4">Job & Project</th>
                <th className="py-3 px-3">Screening Stage</th>
                <th className="py-3 px-4">HR Decisions (Admin Controls)</th>
                <th className="py-3 px-4 text-right">Dossier</th>
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
                  const resumeLink = cand.resumeUrl || (Array.isArray(cand.documents) && cand.documents[0]?.fileUrl);

                  return (
                    <tr key={cand.applicationId || cand.id || idx} className="hover:bg-blue-50/20 transition">
                      {/* Col 1: Profile + Resume */}
                      <td className="py-3 px-4">
                        <div className="flex items-start space-x-2.5">
                          <img
                            src={AVATARS[idx % AVATARS.length]}
                            alt={cand.candidateName}
                            className="w-9 h-9 rounded-full object-cover shrink-0 mt-0.5"
                          />
                          <div className="min-w-0">
                            <div className="font-bold text-slate-900 text-xs truncate">{cand.candidateName}</div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              {cand.passportNumber ? `🛂 ${cand.passportNumber}` : `ID: ${cand.candidateId || cand.applicationId}`}
                            </div>
                            <div className="text-[10px] text-slate-500 truncate mt-0.5">
                              {cand.candidatePhone || cand.candidateEmail}
                            </div>
                            {resumeLink ? (
                              <a
                                href={resumeLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-[9.5px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 px-2 py-0.5 rounded border border-blue-200 mt-1 cursor-pointer transition"
                                title="Open Candidate Resume / CV in new tab"
                              >
                                <FileText size={10} />
                                <span>View CV / Resume</span>
                                <ExternalLink size={9} />
                              </a>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[9.5px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded mt-1">
                                <FileText size={10} />
                                <span>CV Verified</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Col 2: Job & Project */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-800 text-xs truncate max-w-[190px]">
                          {cand.jobTitle || "Specialist Technician"}
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <Building2 size={11} className="text-slate-400 shrink-0" />
                          <span className="truncate max-w-[180px]">{cand.projectName || "Overseas Deployment"}</span>
                        </div>
                        <div className="text-[10px] text-indigo-700 font-semibold mt-0.5">
                          Vendor: {cand.vendorName || vendorName}
                        </div>
                      </td>

                      {/* Col 3: Current Stage Badge */}
                      <td className="py-3 px-3">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (navigateByTag) navigateByTag(cand.recruitmentStage || cand.status, cand);
                          }}
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold border inline-flex items-center gap-1 whitespace-nowrap cursor-pointer hover:shadow-xs hover:scale-105 active:scale-95 transition ${
                            cand.recruitmentStage === "Shortlisted"
                              ? "bg-indigo-50 text-indigo-800 border-indigo-200 hover:bg-indigo-100"
                              : cand.recruitmentStage?.includes("Interview")
                              ? "bg-purple-50 text-purple-800 border-purple-200 hover:bg-purple-100"
                              : cand.recruitmentStage === "Rejected" || cand.status === "Rejected"
                              ? "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100"
                              : cand.recruitmentStage === "On Hold" || cand.status === "On Hold"
                              ? "bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100"
                              : cand.recruitmentStage === "Selected"
                              ? "bg-teal-50 text-teal-800 border-teal-200 hover:bg-teal-100"
                              : cand.recruitmentStage === "Visa Issued"
                              ? "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100"
                              : "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200"
                          }`}
                          title={`Click to open ${cand.recruitmentStage || cand.status || "Candidates"} section`}
                        >
                          {cand.recruitmentStage === "Rejected" || cand.status === "Rejected" ? "✕ " : "● "}
                          <span>{cand.recruitmentStage || cand.status || "Applied"}</span>
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
                      </td>

                      {/* Col 4: Pre-Screening Decisions */}
                      <td className="py-3 px-4">
                        {/* Applied / Screening / Submitted -> Shortlist & Reject together */}
                        {(!cand.recruitmentStage ||
                          ["Applied", "Screening", "Submitted", "Under Review", "On Hold"].includes(cand.recruitmentStage || cand.status)) &&
                          cand.recruitmentStage !== "Shortlisted" &&
                          !cand.recruitmentStage?.includes("Interview") &&
                          cand.recruitmentStage !== "Rejected" &&
                          cand.status !== "Rejected" && (
                          <div className="space-y-1">
                            <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">
                              Screening Decision:
                            </span>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <button
                                type="button"
                                onClick={() => handleQuickStage(cand, "Shortlisted")}
                                className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] transition inline-flex items-center gap-1 cursor-pointer shadow-2xs"
                                title="Shortlist for Interview"
                              >
                                <Check size={11} />
                                <span>Shortlist</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleQuickStage(cand, "Rejected", "Rejected during HR screening")}
                                className="px-2 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-[11px] border border-rose-200 transition cursor-pointer"
                                title="Reject Candidate"
                              >
                                <X size={11} />
                                <span>Reject</span>
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Shortlisted -> Schedule Interview */}
                        {cand.recruitmentStage === "Shortlisted" && (
                          <div className="space-y-1">
                            <span className="text-[10px] font-bold text-indigo-600 block">Shortlisted Cleared:</span>
                            <button
                              type="button"
                              onClick={() => {
                                setScheduleInterviewTarget(cand);
                                setScheduleForm((prev) => ({
                                  ...prev,
                                  applicationId: cand.applicationId,
                                  round: "Technical Interview",
                                }));
                                setShowScheduleModal(true);
                              }}
                              className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] transition inline-flex items-center gap-1.5 cursor-pointer shadow-2xs"
                            >
                              <Calendar size={12} />
                              <span>Schedule Interview</span>
                            </button>
                          </div>
                        )}

                        {/* Interview Scheduled / L1 / L2 -> Select or Reject */}
                        {(cand.recruitmentStage?.includes("Interview") || cand.status?.includes("Interview")) && (
                          <div className="space-y-1">
                            <span className="text-[10px] font-bold text-purple-700 block">Interview Active:</span>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <button
                                type="button"
                                onClick={() => handleQuickStage(cand, "Selected")}
                                className="px-2.5 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold text-[11px] transition inline-flex items-center gap-1 cursor-pointer shadow-2xs"
                                title="Select Candidate"
                              >
                                <Award size={12} />
                                <span>Select Candidate</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleQuickStage(cand, "Rejected", "Did not clear technical interview round")}
                                className="px-2 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-[11px] border border-rose-200 transition cursor-pointer"
                                title="Reject Candidate"
                              >
                                <X size={11} />
                                <span>Reject</span>
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Rejected -> Available for Reassignment */}
                        {(cand.recruitmentStage === "Rejected" || cand.status === "Rejected") && (
                          <div className="space-y-1">
                            <span className="text-[10px] font-bold text-slate-400 block">In Vendor Pool:</span>
                            <button
                              type="button"
                              onClick={() => openReassignModal(cand)}
                              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] transition inline-flex items-center gap-1.5 cursor-pointer shadow-2xs"
                              title="Submit this candidate to a different overseas project"
                            >
                              <RotateCcw size={12} />
                              <span>Apply to Another Project</span>
                            </button>
                          </div>
                        )}
                      </td>

                      {/* Col 5: Dossier Details */}
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => openCandidateModal(cand)}
                          className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition cursor-pointer inline-flex items-center gap-1"
                        >
                          <span>Manage</span>
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
