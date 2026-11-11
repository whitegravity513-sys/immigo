import React from "react";
import { RotateCcw } from "lucide-react";

export function ProjectAssignmentForm({
  selectedCandidateIds,
  candidates,
  allProjects,
  selectedProjectId,
  onSelectProject,
  selectedPosition,
  setSelectedPosition,
  availableRequirements,
  selectedProject,
  requiredHeadcount,
  selectedOrShortlisted,
  vendorNotes,
  setVendorNotes,
  onBack,
  onSubmit,
  onRefreshProjects,
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="bg-white rounded-lg border border-slate-300 shadow-xs p-4 sm:p-5">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[11px] font-bold flex items-center justify-center">2</span>
              <span>Assign to Project Details</span>
            </h2>
            <p className="text-[11px] text-slate-600 font-medium mt-0.5">
              Select target project and trade role for the <strong className="text-blue-700">{selectedCandidateIds.length} selected candidate(s)</strong>.
            </p>
          </div>
          <button
            type="button"
            onClick={onBack}
            className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
          >
            Back to Candidates List
          </button>
        </div>

        {/* Selected Candidates Summary Pills */}
        <div className="mb-4 p-3 bg-blue-50/50 rounded-lg border border-blue-200 text-xs">
          <span className="font-bold text-blue-900 block mb-1">
            Selected Candidate(s) for Assignment ({selectedCandidateIds.length}):
          </span>
          <div className="flex flex-wrap gap-1.5">
            {selectedCandidateIds.map((cid) => {
              const c = candidates.find(
                (cand) => String(cand.id || cand.candidateId || cand._id || "") === String(cid)
              );
              return (
                <span
                  key={cid}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-blue-200 text-[11px] font-bold text-slate-800"
                >
                  <span>{c?.fullName || cid}</span>
                  <span className="text-[10px] text-slate-400">({c?.currentPosition || "Trade"})</span>
                </span>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider">
                Select Project Name <span className="text-rose-500">*</span>
              </label>
              <button
                type="button"
                onClick={onRefreshProjects}
                className="text-[10px] text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 cursor-pointer"
                title="Reload latest projects from Admin"
              >
                <RotateCcw size={10} />
                <span>Refresh</span>
              </button>
            </div>
            <select
              value={selectedProjectId}
              onChange={(e) => onSelectProject(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold cursor-pointer"
              required
            >
              <option value="">
                {allProjects.length === 0
                  ? "-- No Projects Added by Admin Yet --"
                  : "-- Choose Target Project --"}
              </option>
              {allProjects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.projectName || p.name || p.title || "Overseas Project"} ({p.country || "Overseas"}) - {p.clientName || "Direct Client"}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider mb-1.5">
              Target Trade / Position Role <span className="text-rose-500">*</span>
            </label>
            {availableRequirements.length > 0 ? (
              <select
                value={selectedPosition}
                onChange={(e) => setSelectedPosition(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold cursor-pointer"
                required
              >
                <option value="">-- Select Project Position --</option>
                {availableRequirements.map((req, idx) => {
                  const posTitle = req.position || req.positionTitle || req.title || req.role || "General";
                  const qty = req.quantity ?? req.openings ?? 0;
                  return (
                    <option key={req.id || req._id || idx} value={posTitle}>
                      {posTitle} ({qty} required)
                    </option>
                  );
                })}
              </select>
            ) : (
              <input
                type="text"
                value={selectedPosition}
                onChange={(e) => setSelectedPosition(e.target.value)}
                placeholder="Enter Trade / Position title..."
                className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                required
              />
            )}
          </div>
        </div>

        {selectedProject && (
          <div className="mt-4 p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs">
            <div className="flex items-center justify-between font-bold text-slate-900 border-b border-slate-200 pb-1.5 mb-2">
              <span>Project Overview & Vacancy Status</span>
              <span className="text-blue-600 font-semibold">{selectedProject.country}</span>
            </div>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Positions Required</span>
                <span className="font-bold text-slate-900">
                  {requiredHeadcount || selectedProject.totalHeadcount || selectedProject.totalManpowerRequired || "Flexible"}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-bold">In Selection / Shortlist</span>
                <span className="font-bold text-slate-900">{selectedOrShortlisted} candidates</span>
              </div>
            </div>
          </div>
        )}

        <div className="mt-4">
          <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider mb-1.5">
            Vendor Submission Notes (Optional)
          </label>
          <textarea
            rows={3}
            value={vendorNotes}
            onChange={(e) => setVendorNotes(e.target.value)}
            placeholder="Add trade qualification, GCC experience highlights or availability remarks for client review..."
            className="w-full p-2.5 rounded-lg border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="mt-4 pt-3 border-t border-slate-200 flex justify-end gap-2">
          <button
            type="button"
            onClick={onBack}
            className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
          >
            Back
          </button>
          <button
            type="submit"
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition shadow-xs cursor-pointer"
          >
            Review & Finalize Submission
          </button>
        </div>
      </div>
    </form>
  );
}

export function ConfirmSubmissionModal({
  isOpen,
  onClose,
  selectedCandidateIds,
  selectedProject,
  selectedPosition,
  candidates,
  onConfirm,
  submitting,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
        <h3 className="text-base font-bold text-slate-900">Confirm Candidate Assignment</h3>
        <p className="text-xs text-slate-600">
          You are submitting <strong>{selectedCandidateIds.length} candidate(s)</strong> to project{" "}
          <strong>{selectedProject?.projectName}</strong> for position <strong>{selectedPosition}</strong>.
        </p>

        <div className="max-h-36 overflow-y-auto space-y-1 bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-xs">
          {selectedCandidateIds.map((cid) => {
            const c = candidates.find(
              (cand) => String(cand.id || cand.candidateId || cand._id || "") === String(cid)
            );
            return (
              <div key={cid} className="flex items-center justify-between font-medium text-slate-800">
                <span>{c?.fullName || cid}</span>
                <span className="text-[10px] text-slate-400 font-mono">{c?.passportNumber || "Passport"}</span>
              </div>
            );
          })}
        </div>

        <div className="pt-2 flex justify-end space-x-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={submitting}
            className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold cursor-pointer shadow-xs disabled:opacity-50"
          >
            {submitting ? "Submitting..." : "Confirm & Submit"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function SubmissionSuccessBanner({
  submitSuccess,
  onReset,
}) {
  if (!submitSuccess) return null;

  return (
    <div className="p-5 rounded-lg bg-emerald-50 border border-emerald-300 shadow-xs">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-emerald-500 flex items-center justify-center text-white shrink-0 shadow-xs">
          ✓
        </div>
        <div className="flex-1">
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 mb-1">
            Assignment Successful
          </span>
          <h2 className="text-base sm:text-lg font-bold text-slate-900">
            {submitSuccess.count} Candidate(s) Assigned to {submitSuccess.projectName}
          </h2>
          <p className="text-xs text-slate-700 mt-0.5">
            Role: <strong className="text-slate-900">{submitSuccess.position}</strong>. Candidates have been placed under review and excluded from the available roster.
          </p>

          <div className="mt-4 flex flex-wrap gap-2.5">
            <button
              type="button"
              onClick={onReset}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-bold transition shadow-2xs cursor-pointer"
            >
              <RotateCcw size={14} className="text-slate-500" />
              <span>Assign More Candidates</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

