import {
  Award,
  X,
  ShieldCheck,
  Check,
  Lock,
  Unlock,
  IndianRupee,
  Circle,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { isAppRefundLocked, getAppRefundStatus } from "../../../services/refundService.js";

export default function VendorHRMilestoneStepperModal({
  show,
  selectedMilestoneCandidate,
  refunds = [],
  onClose,
  completingStageId,
  setCompletingStageId,
  stageCompletionRemark,
  setStageCompletionRemark,
  handleCompleteMilestoneStage,
  handleApproveMilestonePayment,
  hideProjectNames = false,
  actionLoading = false,
}) {
  if (!show || !selectedMilestoneCandidate) return null;

  const refundLocked = isAppRefundLocked(selectedMilestoneCandidate, refunds);
  const refundStatus = getAppRefundStatus(selectedMilestoneCandidate, refunds);

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex justify-end animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-white max-w-3xl w-full h-[100dvh] flex flex-col shadow-2xl border-l border-slate-200 overflow-hidden animate-in slide-in-from-right duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 sm:p-5 bg-gradient-to-r from-teal-900 via-slate-900 to-indigo-950 text-white flex items-start sm:items-center justify-between gap-2">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center text-teal-300">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-white flex items-center gap-2">
                <span>Candidate Deployment Milestones</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30">
                  Sequential Paid Stages
                </span>
              </h3>
              <div className="text-xs text-slate-300 flex items-center gap-2 mt-0.5 flex-wrap">
                <span className="font-semibold text-white">{selectedMilestoneCandidate.candidateName}</span>
                <span>•</span>
                <span className="font-mono text-slate-300">
                  {selectedMilestoneCandidate.passportNumber
                    ? `Passport: ${selectedMilestoneCandidate.passportNumber}`
                    : `ID: ${selectedMilestoneCandidate.applicationId || selectedMilestoneCandidate.id}`}
                </span>
                {!hideProjectNames && selectedMilestoneCandidate.projectName && (
                  <>
                    <span>•</span>
                    <span className="text-teal-300">{selectedMilestoneCandidate.projectName}</span>
                  </>
                )}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {refundLocked && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 flex items-start space-x-3 text-xs text-rose-900">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-bold text-rose-950 block">
                  Payment &amp; Processing Frozen — Refund Claim ({refundStatus || "Pending Admin Approval"})
                </span>
                <p className="text-[11.5px] leading-relaxed text-rose-800">
                  {refundStatus === "Pending Admin Approval"
                    ? "Milestone payment approvals and stage progression are paused until Admin reviews and responds to this refund claim."
                    : "Admin has processed this refund claim. Payment and stage progression on this project remain closed; proceed with candidate reassignment."}
                </p>
              </div>
            </div>
          )}
          <div className="p-3.5 rounded-2xl bg-blue-50/80 border border-blue-200 flex items-start space-x-3 text-xs">
            <ShieldCheck className="w-5 h-5 text-blue-700 shrink-0 mt-0.5" />
            <div className="text-slate-700 space-y-1">
              <span className="font-bold text-blue-900 block">
                Strict Sequential Progression & Payment Gate Rules:
              </span>
              <p className="text-[11.5px] leading-relaxed text-slate-600">
                1. <strong>Payment Gate:</strong> Stages for a milestone unlock <em>only after</em> the Vendor pays for that milestone (Approved).
                <br />
                2. <strong>Sequential Lock:</strong> Milestone 2 & subsequent milestones remain <strong>LOCKED</strong> until all stages of the previous milestone are 100% completed by Vendor HR.
                <br />
                3. <strong>Live Sync:</strong> Stages completed here immediately update the Vendor Portal in real-time.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {(selectedMilestoneCandidate.processMilestones || []).map((milestone, mIdx) => {
              const milestones = selectedMilestoneCandidate.processMilestones || [];
              const prevMilestone = mIdx > 0 ? milestones[mIdx - 1] : null;
              const isPrevCompleted =
                mIdx === 0 ||
                prevMilestone?.status === "Completed" ||
                (Array.isArray(prevMilestone?.stages) &&
                  prevMilestone.stages.length > 0 &&
                  prevMilestone.stages.every((s) => s.status === "Completed"));

              const isMilestoneStagesCompleted =
                Array.isArray(milestone.stages) &&
                milestone.stages.length > 0 &&
                milestone.stages.every((s) => s.status === "Completed");

              const isCompleted = milestone.status === "Completed" || isMilestoneStagesCompleted;
              const isLocked = !isPrevCompleted;
              const isApproved =
                milestone.paymentStatus === "Approved" ||
                milestone.status === "Paid" ||
                milestone.status === "Completed";
              const amt = Number(milestone.paymentAmount ?? milestone.amount ?? 0);
              const requiresPayment = !isLocked && amt > 0 && !isApproved;
              const isUnlockedAndActive = !isLocked && !requiresPayment && !isCompleted;

              return (
                <div
                  key={milestone.id || mIdx}
                  className={`rounded-2xl border transition overflow-hidden ${
                    isCompleted
                      ? "border-emerald-200 bg-emerald-50/20"
                      : isUnlockedAndActive
                      ? "border-blue-300 bg-white shadow-xs ring-2 ring-blue-50"
                      : requiresPayment
                      ? "border-amber-300 bg-amber-50/20"
                      : "border-slate-200 bg-slate-50/60 opacity-85"
                  }`}
                >
                  <div className="p-3.5 sm:p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2 bg-slate-50/50">
                    <div className="flex items-center space-x-3">
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${
                          isCompleted
                            ? "bg-emerald-600 text-white"
                            : isUnlockedAndActive
                            ? "bg-blue-600 text-white"
                            : requiresPayment
                            ? "bg-amber-600 text-white"
                            : "bg-slate-300 text-slate-600"
                        }`}
                      >
                        {isCompleted ? <Check size={14} /> : isLocked ? <Lock size={12} /> : `M${mIdx + 1}`}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 text-xs sm:text-sm">
                          {milestone.name || `Milestone ${mIdx + 1}`}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {milestone.stages?.length || 0} Sub-stages in this deployment phase
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {amt > 0 ? (
                        isApproved ? (
                          <span className="px-2.5 py-1 rounded-full text-[10.5px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                            <Unlock size={11} className="text-emerald-700" />
                            <span>Paid: ₹{amt.toLocaleString()}</span>
                          </span>
                        ) : isLocked ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-600 flex items-center gap-1">
                            <Lock size={10} />
                            <span>Fee: ₹{amt.toLocaleString()}</span>
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-[10.5px] font-bold bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1 animate-pulse">
                            <IndianRupee size={11} className="text-amber-800" />
                            <span>Awaiting Payment: ₹{amt.toLocaleString()}</span>
                          </span>
                        )
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600">
                          No Fee
                        </span>
                      )}

                      <span
                        className={`px-2.5 py-1 rounded-full text-[10.5px] font-bold ${
                          isCompleted
                            ? "bg-emerald-100 text-emerald-800"
                            : isUnlockedAndActive
                            ? "bg-blue-100 text-blue-800"
                            : requiresPayment
                            ? "bg-amber-100 text-amber-900"
                            : "bg-slate-200 text-slate-600"
                        }`}
                      >
                        {isCompleted
                          ? "✓ Completed"
                          : isUnlockedAndActive
                          ? "● In Progress"
                          : requiresPayment
                          ? "Payment Gate Active"
                          : "Locked"}
                      </span>
                    </div>
                  </div>

                  <div className="p-3.5 sm:p-4">
                    {isLocked && (
                      <div className="p-3 rounded-xl bg-slate-100/90 border border-slate-200 flex items-center space-x-2.5 text-xs text-slate-600">
                        <Lock size={15} className="text-slate-400 shrink-0" />
                        <div>
                          <span className="font-bold text-slate-700">Milestone Locked: </span>
                          <span>All stages of {prevMilestone?.name || `Milestone ${mIdx}`} must be 100% completed before this milestone can begin.</span>
                        </div>
                      </div>
                    )}

                    {requiresPayment && (
                      <div className="p-3.5 rounded-xl bg-amber-50/90 border border-amber-200 space-y-2.5 text-xs">
                        <div className="flex items-start space-x-2.5">
                          <Lock size={16} className="text-amber-700 shrink-0 mt-0.5" />
                          <div className="text-amber-900">
                            <span className="font-bold">Sub-stages Gated by Payment: </span>
                            <span>
                              Vendor has not yet completed payment for this milestone (<strong>₹{amt.toLocaleString()}</strong>). Sub-stages cannot be updated by HR until payment is verified.
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-amber-200/80">
                          <span className="text-[11px] text-amber-800 font-medium">
                            {refundLocked
                              ? "Payment verification frozen awaiting Admin refund response"
                              : "Received payment offline / bank transfer?"}
                          </span>
                          {!refundLocked && (
                            <button
                              type="button"
                              disabled={actionLoading}
                              onClick={() => handleApproveMilestonePayment(milestone.id)}
                              className="px-3 py-1.5 rounded-lg bg-amber-700 hover:bg-amber-800 text-white font-bold text-xs transition cursor-pointer shadow-2xs flex items-center gap-1.5"
                            >
                              <Check size={12} />
                              <span>Verify & Approve Payment (₹{amt.toLocaleString()})</span>
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    {!isLocked && !requiresPayment && (
                      <div className="space-y-3">
                        {(milestone.stages || []).map((stage, sIdx) => {
                          const isStageDone = stage.status === "Completed";
                          const isPrevStageDone =
                            sIdx === 0 || milestone.stages[sIdx - 1]?.status === "Completed";
                          const isStageActive = !isStageDone && isPrevStageDone;
                          const isStageLocked = !isPrevStageDone;

                          return (
                            <div
                              key={stage.id || sIdx}
                              className={`p-3 rounded-xl border transition ${
                                isStageDone
                                  ? "bg-emerald-50/60 border-emerald-200"
                                  : isStageActive
                                  ? "bg-blue-50/40 border-blue-300 ring-1 ring-blue-100"
                                  : "bg-slate-50 border-slate-200 opacity-60"
                              }`}
                            >
                              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2.5">
                                <div className="flex items-start space-x-2.5 min-w-0 flex-1">
                                  <div className="mt-0.5 shrink-0">
                                    {isStageDone ? (
                                      <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                                        <Check size={11} />
                                      </div>
                                    ) : isStageActive ? (
                                      <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center animate-pulse">
                                        <Circle size={8} fill="currentColor" />
                                      </div>
                                    ) : (
                                      <div className="w-5 h-5 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center">
                                        <Lock size={10} />
                                      </div>
                                    )}
                                  </div>
                                  <div className="min-w-0">
                                    <div className="font-bold text-xs text-slate-900 truncate">
                                      {sIdx + 1}. {stage.name}
                                    </div>
                                    {isStageDone && (
                                      <div className="text-[10.5px] text-emerald-800 mt-0.5 space-y-0.5">
                                        <div>
                                          ✓ Completed on {stage.completedAt || "Recent"} by {stage.completedBy || "Vendor HR"}
                                        </div>
                                        {stage.remark && (
                                          <div className="text-[10px] text-slate-600 italic">
                                            Remark: &quot;{stage.remark}&quot;
                                          </div>
                                        )}
                                      </div>
                                    )}
                                    {isStageLocked && (
                                      <div className="text-[10px] text-slate-400 mt-0.5">
                                        Locked: Complete Stage {sIdx} first
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {!refundLocked && isStageActive && (
                                  <div className="w-full sm:w-auto shrink-0 flex flex-wrap items-center gap-2">
                                    {completingStageId === stage.id ? (
                                      <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto animate-in fade-in">
                                        <input
                                          type="text"
                                          value={stageCompletionRemark}
                                          onChange={(e) => setStageCompletionRemark(e.target.value)}
                                          placeholder="Optional verification remark..."
                                          className="px-2.5 py-1 bg-white border border-blue-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600 w-full sm:w-56"
                                        />
                                        <button
                                          type="button"
                                          disabled={actionLoading}
                                          onClick={() => handleCompleteMilestoneStage(milestone.id, stage.id)}
                                          className="px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-2xs transition cursor-pointer disabled:opacity-50"
                                        >
                                          {actionLoading ? "Saving..." : "Confirm"}
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setCompletingStageId(null);
                                            setStageCompletionRemark("");
                                          }}
                                          className="px-2 py-1 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100 text-xs font-semibold cursor-pointer"
                                        >
                                          Cancel
                                        </button>
                                      </div>
                                    ) : (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setCompletingStageId(stage.id);
                                          setStageCompletionRemark("");
                                        }}
                                        className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-2xs transition cursor-pointer flex items-center gap-1.5"
                                      >
                                        <Check size={12} />
                                        <span>Mark Stage Done</span>
                                      </button>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
            <CheckCircle2 size={13} className="text-teal-600" />
            <span>All updates reflect immediately in the Vendor&apos;s Candidate Tracking portal.</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition cursor-pointer"
          >
            Close Stepper
          </button>
        </div>
      </div>
    </div>
  );
}

