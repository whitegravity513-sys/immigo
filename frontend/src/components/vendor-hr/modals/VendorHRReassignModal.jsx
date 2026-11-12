import { RotateCcw } from "lucide-react";
import {
  getAppRefundStatus,
  REASSIGN_ELIGIBLE_REFUND_STATUSES,
} from "../../../services/refundService.js";

export default function VendorHRReassignModal({
  show,
  reassignTargetCandidate,
  refunds = [],
  onClose,
  onSubmit,
  reassignForm,
  setReassignForm,
  projectsList = [],
  jobs = [],
  hideProjectNames = false,
  actionLoading = false,
}) {
  if (!show || !reassignTargetCandidate) return null;

  const refundStatus = getAppRefundStatus(reassignTargetCandidate, refunds);
  const isRefundApprovedReassign = REASSIGN_ELIGIBLE_REFUND_STATUSES.has(refundStatus);

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex justify-end"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white max-w-lg w-full h-[100dvh] p-4 sm:p-6 space-y-4 shadow-2xl border-l border-slate-200 overflow-y-auto animate-in slide-in-from-right duration-200"
      >
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              {hideProjectNames ? "Reassign Candidate to New Opening" : "Reassign Candidate to Another Project"}
            </h3>
            <p className="text-xs text-slate-500">
              {isRefundApprovedReassign
                ? `Re-allocate ${reassignTargetCandidate.candidateName} following approved refund settlement`
                : `Re-allocate ${reassignTargetCandidate.candidateName} from vendor candidate pool`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
          >
            ✕
          </button>
        </div>

        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-xs space-y-1">
          <div className="flex justify-between">
            <span className="text-slate-500 font-medium">Candidate Name:</span>
            <span className="font-bold text-slate-900">{reassignTargetCandidate.candidateName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500 font-medium">Passport / ID:</span>
            <span className="font-mono text-slate-700">
              {reassignTargetCandidate.passportNumber || reassignTargetCandidate.candidateId}
            </span>
          </div>
          {!hideProjectNames && reassignTargetCandidate.projectName && (
            <div className="flex justify-between">
              <span className="text-slate-500 font-medium">Previous Project:</span>
              <span className="text-rose-700 font-semibold truncate max-w-[220px]">
                {reassignTargetCandidate.projectName}
              </span>
            </div>
          )}
          {refundStatus && (
            <div className="flex justify-between">
              <span className="text-slate-500 font-medium">Refund Status:</span>
              <span className="font-bold text-blue-700">{refundStatus}</span>
            </div>
          )}
        </div>

        <form onSubmit={onSubmit} className="space-y-3.5 text-xs font-medium">
          <div>
            <label className="block text-slate-700 font-bold mb-1">
              {hideProjectNames ? "Select New Target Allocation *" : "Select New Target Project *"}
            </label>
            <select
              required
              value={reassignForm.projectId}
              onChange={(e) => {
                const selectedProjId = e.target.value;
                const matchedProj = projectsList.find((p) => p.projectId === selectedProjId);
                const defaultJob = jobs.find((j) => j.projectId === selectedProjId);
                setReassignForm({
                  ...reassignForm,
                  projectId: selectedProjId,
                  projectName: matchedProj?.projectName || "",
                  jobId: defaultJob?.jobId || "",
                  jobTitle: defaultJob?.title || "",
                });
              }}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-600 cursor-pointer font-bold"
            >
              <option value="">
                {hideProjectNames ? "Select an available active opening" : "Select an available active project"}
              </option>
              {projectsList.map((p, idx) => (
                <option key={p.projectId} value={p.projectId}>
                  {hideProjectNames
                    ? `Assigned Opening #${idx + 1} (${p.destinationCountry || p.country || "Overseas"}) [${p.projectId}]`
                    : `${p.projectName} (${p.destinationCountry || "Overseas"})`}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1">Target Trade Job / Designation</label>
            <select
              value={reassignForm.jobId}
              onChange={(e) => {
                const jbId = e.target.value;
                const jb = jobs.find((j) => j.jobId === jbId);
                setReassignForm({
                  ...reassignForm,
                  jobId: jbId,
                  jobTitle: jb?.title || "",
                });
              }}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-600 cursor-pointer"
            >
              <option value="">Select Trade Job</option>
              {jobs
                .filter((j) => !reassignForm.projectId || j.projectId === reassignForm.projectId)
                .map((j) => (
                  <option key={j.jobId} value={j.jobId}>
                    {j.title} ({j.department || "Technical"})
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1">Reassignment Notes & Justification</label>
            <textarea
              rows="2"
              value={reassignForm.notes}
              onChange={(e) => setReassignForm({ ...reassignForm, notes: e.target.value })}
              placeholder="e.g. Candidate trade skill verified; re-allocated to open requirement"
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none"
            />
          </div>

          <div className="pt-2 flex flex-wrap justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-xs transition cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
            >
              <RotateCcw size={13} />
              <span>{actionLoading ? "Reassigning..." : "Confirm Reassignment"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

