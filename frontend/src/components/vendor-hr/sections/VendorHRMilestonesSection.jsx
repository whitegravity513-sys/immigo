import React from "react";
import {
  Search,
  ArrowLeft,
  UserCheck,
  Clock,
  Lock,
  Unlock,
  Building2,
} from "lucide-react";
import CandidateProcessTimeline from "../../vendor/CandidateProcessTimeline.jsx";
import crmVendorService from "../../../services/crmVendorService.js";
import { AVATARS } from "../shared/vendorHRUtils.jsx";

export default function VendorHRMilestonesSection({
  applications = [],
  projectsList = [],
  vendorName = "",
  hideProjectNames = false,
  selectedMilestoneApp,
  setSelectedMilestoneApp,
  milestoneSearchQuery = "",
  setMilestoneSearchQuery,
  milestoneStageFilter = "ALL",
  setMilestoneStageFilter,
  handleTimelineUpdate,
  openCandidateModal,
  navigateByTag,
}) {
  const resolveMatchedProject = (cand) => {
    if (!cand || !Array.isArray(projectsList) || projectsList.length === 0) return null;
    const pId = String(cand.projectId || "").trim();
    const pName = String(cand.projectName || "").trim().toLowerCase();
    return (
      projectsList.find(
        (p) =>
          (pId && [p.projectId, p.id, p._id].filter(Boolean).map(String).includes(pId)) ||
          (pName && String(p.projectName || "").trim().toLowerCase() === pName)
      ) || null
    );
  };

  const resolveCandMilestones = (cand) => {
    const matchedProj = resolveMatchedProject(cand);
    if (!cand?.milestonesOverridden && crmVendorService.syncAppMilestonesWithProject) {
      const synced = crmVendorService.syncAppMilestonesWithProject(
        cand,
        matchedProj ? [matchedProj] : projectsList
      );
      if (Array.isArray(synced) && synced.length > 0) return synced;
    }
    return Array.isArray(cand?.processMilestones) ? cand.processMilestones : [];
  };
  const postSelectionCandidates = applications.filter((cand) => {
    const stage = cand.recruitmentStage || cand.status || "";
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
  });

  const filteredMilestoneCandidates = postSelectionCandidates.filter((cand) => {
    if (milestoneStageFilter !== "ALL") {
      const stage = cand.recruitmentStage || cand.status || "";
      if (stage !== milestoneStageFilter) return false;
    }

    if (!milestoneSearchQuery) return true;
    const q = milestoneSearchQuery.toLowerCase();
    return (
      cand.candidateName?.toLowerCase().includes(q) ||
      cand.passportNumber?.toLowerCase().includes(q) ||
      cand.jobTitle?.toLowerCase().includes(q) ||
      (!hideProjectNames && cand.projectName?.toLowerCase().includes(q)) ||
      cand.vendorName?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-4">
      {/* Case 1: When a Selected Candidate is picked, show full Processing Timeline */}
      {selectedMilestoneApp ? (
        <div className="space-y-3">
          {/* Top Compact Bar: Back button, Candidate overview, and Processing ID */}
          <div className="bg-white rounded-xl border border-slate-200/90 p-3 sm:p-3.5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                onClick={() => setSelectedMilestoneApp(null)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition shadow-xs cursor-pointer shrink-0"
              >
                <ArrowLeft size={14} />
                <span>Back</span>
              </button>
              <div className="w-8 h-8 rounded-lg bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center font-bold text-sm shrink-0">
                {selectedMilestoneApp.candidateName?.charAt(0).toUpperCase() || <UserCheck size={16} />}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm font-bold text-slate-900 truncate">
                    {selectedMilestoneApp.candidateName}
                  </h3>
                  <span className="font-mono text-[11px] font-bold px-2 py-0.2 bg-teal-50 text-teal-800 border border-teal-200 rounded">
                    {selectedMilestoneApp.jobTitle || "Selected Candidate"}
                  </span>
                  <span className="px-2 py-0.2 bg-emerald-50 text-emerald-800 font-bold text-[10px] rounded-full border border-emerald-200">
                    ● {selectedMilestoneApp.recruitmentStage || selectedMilestoneApp.status || "Selected"}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 font-medium flex items-center gap-2 flex-wrap mt-0.5">
                  <span>
                    Passport: <strong className="text-slate-800">{selectedMilestoneApp.passportNumber ? `🛂 ${selectedMilestoneApp.passportNumber}` : "Verified"}</strong>
                  </span>
                  {!hideProjectNames && selectedMilestoneApp.projectName && (
                    <>
                      <span>•</span>
                      <span>
                        Project: <strong className="text-blue-700">{selectedMilestoneApp.projectName}</strong>
                      </span>
                    </>
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[11px] font-mono font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200/80">
                ID: {selectedMilestoneApp.applicationId || selectedMilestoneApp.id}
              </span>
            </div>
          </div>

          {/* Integrated Candidate Process Timeline */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Clock size={16} className="text-indigo-600" />
                <span>Candidate Deployment Milestones & Stage Verification</span>
              </h3>
              <span className="text-[11px] text-slate-400 font-medium">Sequential verification & vendor payments</span>
            </div>

            <CandidateProcessTimeline
              application={selectedMilestoneApp}
              project={resolveMatchedProject(selectedMilestoneApp)}
              isAdmin={true}
              onUpdate={handleTimelineUpdate}
            />
          </div>
        </div>
      ) : (
        /* Case 2: Selected Candidates Roster List */
        <div className="space-y-4">
          {/* Section Title Card */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">Selected Candidate Milestones & Processing</h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-50 text-teal-800 border border-teal-200">
                  {postSelectionCandidates.length} Selected Candidates
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Post-selection deployment workflow: Trade verification, medicals, visas & flight deployment. Milestones unlock strictly upon vendor payment.
              </p>
            </div>
          </div>

          {/* Summary Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Selected</span>
              <div className="text-xl font-bold text-slate-900 mt-1">{postSelectionCandidates.length}</div>
              <span className="text-[10.5px] text-teal-700 font-semibold mt-0.5 block">Cleared interview</span>
            </div>
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">In Active Processing</span>
              <div className="text-xl font-bold text-blue-600 mt-1">
                {postSelectionCandidates.filter((c) => c.recruitmentStage !== "Joined" && c.recruitmentStage !== "Deployed" && c.recruitmentStage !== "Completed").length}
              </div>
              <span className="text-[10.5px] text-blue-700 font-semibold mt-0.5 block">Milestones active</span>
            </div>
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Awaiting Payment</span>
              <div className="text-xl font-bold text-amber-600 mt-1">
                {postSelectionCandidates.filter((cand) => {
                  const milestones = resolveCandMilestones(cand);
                  return milestones.some((m) => Number(m.paymentAmount ?? m.amount ?? 0) > 0 && m.paymentStatus !== "Approved");
                }).length}
              </div>
              <span className="text-[10.5px] text-amber-700 font-semibold mt-0.5 block">Payment gate active</span>
            </div>
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Mobilized / Joined</span>
              <div className="text-xl font-bold text-emerald-600 mt-1">
                {postSelectionCandidates.filter((c) => c.recruitmentStage === "Joined" || c.recruitmentStage === "Deployed" || c.recruitmentStage === "Completed").length}
              </div>
              <span className="text-[10.5px] text-emerald-700 font-semibold mt-0.5 block">Deployment completed</span>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={milestoneSearchQuery}
                onChange={(e) => setMilestoneSearchQuery(e.target.value)}
                placeholder={
                  hideProjectNames
                    ? "Search selected candidate by name, passport, trade or vendor..."
                    : "Search selected candidate by name, passport, trade, project or vendor..."
                }
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-600"
              />
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold text-slate-500">Deployment Stage:</span>
              <select
                value={milestoneStageFilter}
                onChange={(e) => setMilestoneStageFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-600 cursor-pointer"
              >
                <option value="ALL">All Selected Candidates ({postSelectionCandidates.length})</option>
                <option value="Selected">1. Selected</option>
                <option value="Processing">2. Processing</option>
                <option value="Offer Released">3. Offer Released</option>
                <option value="Offer Accepted">4. Offer Accepted</option>
                <option value="Visa Processing">5. Visa Processing</option>
                <option value="Visa Issued">6. Visa Issued</option>
                <option value="Visa Allotted">7. Visa Allotted</option>
                <option value="Joined">8. Joined / Deployed</option>
                <option value="Completed">9. Completed</option>
              </select>
            </div>
          </div>

          {/* Selected Candidates Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/90 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10.5px]">
                  <tr>
                    <th className="py-3 px-4">Selected Candidate & Passport</th>
                    <th className="py-3 px-4">{hideProjectNames ? "Trade & Agency" : "Trade & Project"}</th>
                    <th className="py-3 px-3">Stage</th>
                    <th className="py-3 px-4">Active Milestone & Progress</th>
                    <th className="py-3 px-4">Payment Gate</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredMilestoneCandidates.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="py-12 text-center text-slate-400">
                        <UserCheck className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        <div className="font-bold text-slate-700">No selected candidates found matching criteria.</div>
                        <div className="text-xs text-slate-400 mt-0.5">Select candidates from the Candidates tab to initiate deployment milestones.</div>
                      </td>
                    </tr>
                  ) : (
                    filteredMilestoneCandidates.map((cand, idx) => {
                      const milestones = resolveCandMilestones(cand);
                      const totalFeeAmount = milestones.reduce(
                        (sum, m) => sum + Number(m.paymentAmount ?? m.amount ?? 0),
                        0
                      );

                      // Calculate Active Milestone
                      let activeM = null;
                      let activeMIdx = 0;
                      for (let mIdx = 0; mIdx < milestones.length; mIdx++) {
                        const m = milestones[mIdx];
                        const allStagesDone = Array.isArray(m.stages) && m.stages.length > 0 && m.stages.every((s) => s.status === "Completed");
                        if (!allStagesDone) {
                          activeM = m;
                          activeMIdx = mIdx;
                          break;
                        }
                      }
                      if (!activeM && milestones.length > 0) {
                        activeM = milestones[milestones.length - 1];
                        activeMIdx = milestones.length - 1;
                      }

                      const totalStages = milestones.reduce((sum, m) => sum + (Array.isArray(m.stages) ? m.stages.length : 0), 0);
                      const doneStages = milestones.reduce((sum, m) => sum + (Array.isArray(m.stages) ? m.stages.filter((s) => s.status === "Completed").length : 0), 0);
                      const percentDone = totalStages > 0 ? Math.round((doneStages / totalStages) * 100) : 0;

                      const prevM = activeMIdx > 0 ? milestones[activeMIdx - 1] : null;
                      const isPrevDone =
                        activeMIdx === 0 ||
                        prevM?.status === "Completed" ||
                        (Array.isArray(prevM?.stages) && prevM.stages.length > 0 && prevM.stages.every((s) => s.status === "Completed"));
                      const isMApproved =
                        activeM?.paymentStatus === "Approved" ||
                        activeM?.status === "Paid" ||
                        activeM?.status === "Completed";
                      const mAmt = Number(activeM?.paymentAmount ?? activeM?.amount ?? 0);
                      const mRequiresPayment = isPrevDone && mAmt > 0 && !isMApproved;
                      const isMLocked = !isPrevDone;

                      const currentSubStage = activeM?.stages?.find((s) => s.status !== "Completed") || activeM?.stages?.[0];

                      return (
                        <tr key={cand.applicationId || cand.id || idx} className="hover:bg-teal-50/20 transition">
                          {/* Col 1: Profile + Passport */}
                          <td className="py-3 px-4">
                            <div className="flex items-start space-x-2.5">
                              <img
                                src={AVATARS[idx % AVATARS.length]}
                                alt={cand.candidateName}
                                className="w-9 h-9 rounded-full object-cover shrink-0 mt-0.5"
                              />
                              <div className="min-w-0">
                                <div className="font-bold text-slate-900 text-xs truncate flex items-center gap-1.5">
                                  <span>{cand.candidateName}</span>
                                  <span className="text-[9.5px] text-teal-700 bg-teal-50 px-1.5 py-0.2 rounded font-mono font-bold">
                                    Selected
                                  </span>
                                </div>
                                <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                                  {cand.passportNumber ? `🛂 ${cand.passportNumber}` : `ID: ${cand.candidateId || cand.applicationId}`}
                                </div>
                                <div className="text-[10px] text-slate-400 truncate mt-0.5">
                                  {cand.candidatePhone || cand.candidateEmail}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Col 2: Job & Project */}
                          <td className="py-3 px-4">
                            <div className="font-bold text-slate-800 text-xs truncate max-w-[190px]">
                              {cand.jobTitle || "Specialist Technician"}
                            </div>
                            {!hideProjectNames && cand.projectName && (
                              <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                                <Building2 size={11} className="text-slate-400 shrink-0" />
                                <span className="truncate max-w-[180px]">{cand.projectName}</span>
                              </div>
                            )}
                            {(cand.vendorName || vendorName) && (
                              <div className="text-[10px] text-indigo-700 font-semibold mt-0.5">
                                Vendor: {cand.vendorName || vendorName}
                              </div>
                            )}
                          </td>

                          {/* Col 3: Stage Badge */}
                          <td className="py-3 px-3">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (navigateByTag) navigateByTag(cand.recruitmentStage || "Selected", cand);
                              }}
                              className={`px-2.5 py-1 rounded-full text-[10px] font-bold border inline-flex items-center gap-1 whitespace-nowrap cursor-pointer hover:scale-105 transition ${
                                cand.recruitmentStage === "Joined" || cand.recruitmentStage === "Deployed"
                                  ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                  : cand.recruitmentStage === "Visa Issued"
                                  ? "bg-indigo-50 text-indigo-800 border-indigo-200"
                                  : cand.recruitmentStage === "Visa Processing"
                                  ? "bg-purple-50 text-purple-800 border-purple-200"
                                  : "bg-teal-50 text-teal-800 border-teal-200"
                              }`}
                              title={`Click to view ${cand.recruitmentStage || "Selected"} section`}
                            >
                              ● {cand.recruitmentStage || "Selected"}
                            </button>
                            <div className="text-[10px] text-slate-400 mt-1 font-semibold">
                              Overall: {percentDone}% Done
                            </div>
                          </td>

                          {/* Col 4: Active Milestone & Progress */}
                          <td className="py-3 px-4">
                            <div className="space-y-1.5 max-w-[210px]">
                              <div className="text-[11px] font-bold text-slate-900 truncate">
                                {activeM?.name || `Milestone ${activeMIdx + 1}`}
                              </div>
                              <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                <div
                                  className="bg-teal-600 h-1.5 rounded-full transition-all duration-300"
                                  style={{ width: `${percentDone}%` }}
                                />
                              </div>
                              <div className="text-[10px] text-slate-500 truncate flex items-center gap-1">
                                <Clock size={10} className="text-slate-400 shrink-0" />
                                <span className="truncate">Stage: {currentSubStage?.name || "Processing"}</span>
                              </div>
                            </div>
                          </td>

                          {/* Col 5: Payment Gate Status */}
                          <td className="py-3 px-4">
                            {totalFeeAmount > 0 && (
                              <div className="text-[10.5px] font-bold text-slate-700 mb-1">
                                Total Fee: ₹{totalFeeAmount.toLocaleString()}
                              </div>
                            )}
                            {isMLocked ? (
                              <div className="space-y-0.5">
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200 inline-flex items-center gap-1">
                                  <Lock size={10} />
                                  <span>Milestone Locked</span>
                                </span>
                                <div className="text-[9.5px] text-slate-400">Complete preceding milestone first</div>
                              </div>
                            ) : mRequiresPayment ? (
                              <div className="space-y-0.5">
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 inline-flex items-center gap-1">
                                  <Lock size={10} className="text-amber-600" />
                                  <span>Payment Required: ₹{mAmt.toLocaleString()}</span>
                                </span>
                                <div className="text-[9.5px] text-amber-700 font-semibold">
                                  Stages locked awaiting vendor payment
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-0.5">
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 inline-flex items-center gap-1">
                                  <Unlock size={10} className="text-emerald-600" />
                                  <span>{mAmt > 0 ? "Payment Approved" : "No Payment Required"}</span>
                                </span>
                                <div className="text-[9.5px] text-emerald-700 font-semibold">
                                  Stages unlocked for HR processing
                                </div>
                              </div>
                            )}
                          </td>

                          {/* Col 6: Actions */}
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end space-x-1.5">
                              <button
                                type="button"
                                onClick={() => setSelectedMilestoneApp(cand)}
                                className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-2xs transition cursor-pointer inline-flex items-center gap-1.5"
                                title="Open Full Processing Timeline & Stepper"
                              >
                                <Clock size={12} />
                                <span>View Timeline</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => openCandidateModal(cand)}
                                className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition cursor-pointer"
                                title="Open Full Candidate Dossier"
                              >
                                Dossier
                              </button>
                            </div>
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
      )}
    </div>
  );
}

