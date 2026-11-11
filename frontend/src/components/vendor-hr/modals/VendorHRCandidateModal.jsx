import { Plane, Calendar, RotateCcw } from "lucide-react";

export default function VendorHRCandidateModal({
  show,
  candidate,
  onClose,
  onSubmit,
  candidateUpdateForm,
  setCandidateUpdateForm,
  hideProjectNames = false,
  actionLoading = false,
  openReassignModal,
  setScheduleInterviewTarget,
  setScheduleForm,
  setShowScheduleModal,
}) {
  if (!show || !candidate) return null;

  const currentStage = candidate.recruitmentStage || candidate.status || "Applied";
  const isOnHoldStage = currentStage === "On Hold";
  const isInterviewStage = currentStage.toLowerCase().includes("interview");
  const isPostSelectionStage = ["Selected", "Visa Issued", "Visa Allotted", "Joined", "Deployed", "Completed", "Processing"].includes(currentStage);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-bold text-slate-900">{candidate.candidateName}</h3>
            <p className="text-xs text-slate-500">
              {candidate.jobTitle}
              {!hideProjectNames && candidate.projectName ? ` • ${candidate.projectName}` : ""}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Alert Banner if Candidate is Rejected -> Quick Reassign Access */}
        {(candidate.recruitmentStage === "Rejected" || candidate.status === "Rejected") && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h4 className="font-bold text-rose-900 text-xs">
                {hideProjectNames ? "Candidate Reassignment Eligible" : "Candidate Rejected for this Project"}
              </h4>
              <p className="text-[11px] text-rose-700 mt-0.5">
                {hideProjectNames
                  ? "This candidate profile remains in your vendor talent pool. You can reassign them to another open requirement."
                  : "This candidate profile remains in your vendor talent pool. You can re-allocate them to another overseas project."}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                onClose();
                if (openReassignModal) openReassignModal(candidate);
              }}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shrink-0 flex items-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <RotateCcw size={12} />
              <span>{hideProjectNames ? "Reassign Candidate" : "Reassign to Other Project"}</span>
            </button>
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-4 text-xs font-medium">
          {/* Stage Transition Select - strictly: Applied, Shortlisted, Interview, Selected, Visa Allotted, On Hold, Rejected */}
          <div className="p-3.5 rounded-xl bg-indigo-50/60 border border-indigo-100 space-y-2">
            <label className="block text-slate-900 font-bold">Update Recruitment Stage *</label>
            <select
              value={candidateUpdateForm.stage}
              onChange={(e) => setCandidateUpdateForm({ ...candidateUpdateForm, stage: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-600 cursor-pointer"
            >
              {!isOnHoldStage && (
                <>
                  <option value="Applied">Applied</option>
                  <option value="Screening">Screening</option>
                  <option value="Under Review">Under Review</option>
                  <option value="Shortlisted">Shortlisted</option>
                  <option value="Interview Scheduled">Interview</option>
                </>
              )}
              <option value="Selected">Selected</option>
              <option value="Visa Issued">Visa Allotted</option>
              {(isInterviewStage || isOnHoldStage) && <option value="On Hold">On Hold</option>}
              <option value="Rejected">Rejected</option>
            </select>
            <input
              type="text"
              value={candidateUpdateForm.remarks}
              onChange={(e) => setCandidateUpdateForm({ ...candidateUpdateForm, remarks: e.target.value })}
              placeholder="Add evaluation remarks or stage notes..."
              className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none"
            />
          </div>

          {/* Visa & Flight Deployment Details (shows for selected / visa allotted candidates) */}
          {["Selected", "Visa Issued", "Visa Allotted", "Joined", "Deployed"].includes(candidateUpdateForm.stage) && (
            <div className="p-3.5 rounded-xl bg-blue-50/50 border border-blue-100 space-y-2.5">
              <div className="flex items-center space-x-1.5 text-blue-900 font-bold text-xs">
                <Plane className="w-4 h-4 text-blue-600" />
                <span>Visa & Flight Deployment Details</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 mb-1">Visa Status</label>
                  <select
                    value={candidateUpdateForm.visaStatus}
                    onChange={(e) => setCandidateUpdateForm({ ...candidateUpdateForm, visaStatus: e.target.value })}
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-900 text-xs cursor-pointer"
                  >
                    <option value="Not Started">Not Started</option>
                    <option value="In Process">In Process</option>
                    <option value="Visa Issued">Visa Issued</option>
                    <option value="Flight Booked">Flight Booked</option>
                    <option value="Deployed">Deployed at Site</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-600 mb-1">Visa Reference #</label>
                  <input
                    type="text"
                    value={candidateUpdateForm.visaNumber}
                    onChange={(e) => setCandidateUpdateForm({ ...candidateUpdateForm, visaNumber: e.target.value })}
                    placeholder="e.g. VISA-REF-001"
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-900 text-xs"
                  />
                </div>
              </div>
              <div>
                <label className="block text-slate-600 mb-1">Flight Booking & Departure Details</label>
                <input
                  type="text"
                  value={candidateUpdateForm.flightDetails}
                  onChange={(e) => setCandidateUpdateForm({ ...candidateUpdateForm, flightDetails: e.target.value })}
                  placeholder="e.g. Emirates EK-513 (DEL -> DXB)"
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-900 text-xs"
                />
              </div>
            </div>
          )}

          <div className="pt-2 flex justify-between items-center border-t border-slate-100">
            {!isOnHoldStage && !isPostSelectionStage && currentStage !== "Rejected" ? (
              <button
                type="button"
                onClick={() => {
                  if (setScheduleInterviewTarget) setScheduleInterviewTarget(candidate);
                  if (setScheduleForm) {
                    setScheduleForm((prev) => ({
                      ...prev,
                      applicationId: candidate.applicationId || candidate.id || candidate._id,
                    }));
                  }
                  onClose();
                  if (setShowScheduleModal) setShowScheduleModal(true);
                }}
                className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer flex items-center space-x-1"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Schedule Interview</span>
              </button>
            ) : (
              <span />
            )}

            <div className="flex space-x-2">
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
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-xs transition cursor-pointer disabled:opacity-50"
              >
                {actionLoading ? "Saving..." : "Save Progress"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

