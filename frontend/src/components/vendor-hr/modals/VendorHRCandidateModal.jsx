import {
  Plane,
  Calendar,
  RotateCcw,
  AlertTriangle,
  FileText,
  ExternalLink,
  Download,
  User,
  Phone,
  Mail,
  MapPin,
  Briefcase,
} from "lucide-react";
import {
  isAppRefundLocked,
  getAppRefundStatus,
  REASSIGN_ELIGIBLE_REFUND_STATUSES,
} from "../../../services/refundService.js";
import {
  formatCandidateEmail,
  extractCandidateDocuments,
  getEffectiveStage,
} from "../shared/vendorHRUtils.jsx";
import {
  openUploadedDocument,
  downloadUploadedDocument,
} from "../../../utils/printDocument.js";

export default function VendorHRCandidateModal({
  show,
  candidate,
  refunds = [],
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

  const currentStage = getEffectiveStage(candidate);
  const isOnHoldStage = currentStage === "On Hold";
  const isInterviewStage = currentStage.toLowerCase().includes("interview");
  const isPostSelectionStage = ["Selected", "Visa Issued", "Visa Allotted", "Joined", "Deployed", "Completed", "Processing"].includes(currentStage);
  const refundStatus = getAppRefundStatus(candidate, refunds);
  const refundLocked = isAppRefundLocked(candidate, refunds);
  const isRefundReassignable = REASSIGN_ELIGIBLE_REFUND_STATUSES.has(refundStatus);
  const cleanEmail = formatCandidateEmail(candidate.candidateEmail || candidate.email);
  const phoneVal = candidate.candidatePhone || candidate.phone || candidate.phoneNumber || "";
  const { docs: candidateDocs } = extractCandidateDocuments(candidate);
  const normalizeTextValue = (val) => {
    if (val === null || val === undefined || val === "") return "";
    if (typeof val === "string" || typeof val === "number") return String(val).trim();
    if (Array.isArray(val)) {
      return val
        .map((item) => {
          if (!item) return "";
          if (typeof item === "string" || typeof item === "number") return String(item).trim();
          if (typeof item === "object") {
            return [
              item.degree,
              item.title,
              item.qualification,
              item.institution,
              item.school,
              item.field,
              item.company,
              item.year,
            ]
              .filter(Boolean)
              .join(" - ");
          }
          return "";
        })
        .filter(Boolean)
        .join(", ");
    }
    if (typeof val === "object") {
      return [
        val.degree,
        val.title,
        val.qualification,
        val.line1,
        val.street,
        val.city,
        val.state,
        val.country,
        val.pincode,
      ]
        .filter(Boolean)
        .join(", ");
    }
    return "";
  };

  const expText =
    candidate.experienceYears !== undefined && candidate.experienceYears !== null && candidate.experienceYears !== ""
      ? `${candidate.experienceYears} Years`
      : normalizeTextValue(candidate.experience) || "Not specified";
  const qualificationText =
    normalizeTextValue(candidate.qualification) ||
    normalizeTextValue(candidate.education) ||
    "Not specified";
  const locationText = [
    normalizeTextValue(candidate.address),
    normalizeTextValue(candidate.city),
    normalizeTextValue(candidate.state),
    normalizeTextValue(candidate.location),
    normalizeTextValue(candidate.pincode),
    normalizeTextValue(candidate.nationality),
  ]
    .filter(Boolean)
    .join(", ");
  const profileNotesText = normalizeTextValue(candidate.notes);
  const adminRemarksText = normalizeTextValue(candidate.adminRemarks);
  const rejectionReasonText = normalizeTextValue(candidate.rejectionReason);
  const holdReasonText = normalizeTextValue(candidate.holdReason);
  const didNotJoinReasonText = normalizeTextValue(candidate.didNotJoinReason);
  const tradeText = normalizeTextValue(candidate.trade);
  const dobText = candidate.dob ? String(candidate.dob).slice(0, 10) : "";
  const genderText = normalizeTextValue(candidate.gender);
  const skillsList = Array.isArray(candidate.skills)
    ? candidate.skills
        .map((s) => (s && typeof s === "object" ? s.name || s.skill || "" : String(s || "")))
        .filter(Boolean)
    : typeof candidate.skills === "string" && candidate.skills.trim()
    ? candidate.skills.split(",").map((s) => s.trim()).filter(Boolean)
    : [];

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-bold text-slate-900">{candidate.candidateName}</h3>
              {candidate.candidateId && (
                <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-[10px] font-bold border border-slate-200">
                  {candidate.candidateId}
                </span>
              )}
              <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-[10px] font-bold border border-indigo-200">
                {currentStage}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {candidate.jobTitle || candidate.position || "Trade Specialist"}
              {!hideProjectNames && candidate.projectName ? ` • ${candidate.projectName}` : ""}
              {candidate.vendorName ? ` • ${candidate.vendorName}` : ""}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
          >
            ✕
          </button>
        </div>

        <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/80 space-y-3 text-xs">
          <div className="flex items-center gap-1.5 font-bold text-slate-800 border-b border-slate-200/70 pb-2">
            <User size={14} className="text-indigo-600" />
            <span>Candidate Profile &amp; Verification Details</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            <div className="p-2 rounded-lg bg-white border border-slate-200/70">
              <span className="text-[10px] font-semibold text-slate-400 uppercase block">Candidate ID</span>
              <span className="font-mono font-bold text-slate-800">{candidate.candidateId || candidate.applicationId || "-"}</span>
            </div>
            <div className="p-2 rounded-lg bg-white border border-slate-200/70">
              <span className="text-[10px] font-semibold text-slate-400 uppercase flex items-center gap-1">
                <Phone size={10} /> Phone Number
              </span>
              <span className="font-semibold text-slate-800">{phoneVal || "Not provided"}</span>
            </div>
            <div className="p-2 rounded-lg bg-white border border-slate-200/70">
              <span className="text-[10px] font-semibold text-slate-400 uppercase flex items-center gap-1">
                <Mail size={10} /> Email Address
              </span>
              <span className="font-semibold text-slate-800 break-all">{cleanEmail || "Not provided"}</span>
            </div>
            <div className="p-2 rounded-lg bg-white border border-slate-200/70">
              <span className="text-[10px] font-semibold text-slate-400 uppercase block">Passport Number</span>
              <span className="font-mono font-bold text-slate-800">
                {candidate.passportNumber || "Not provided"}
                {candidate.passportExpiry ? ` (Exp: ${String(candidate.passportExpiry).slice(0, 10)})` : ""}
              </span>
            </div>
            <div className="p-2 rounded-lg bg-white border border-slate-200/70">
              <span className="text-[10px] font-semibold text-slate-400 uppercase flex items-center gap-1">
                <Briefcase size={10} /> Experience &amp; Trade
              </span>
              <span className="font-semibold text-slate-800">
                {expText}{tradeText ? ` • ${tradeText}` : ""}
              </span>
            </div>
            <div className="p-2 rounded-lg bg-white border border-slate-200/70">
              <span className="text-[10px] font-semibold text-slate-400 uppercase block">Qualification</span>
              <span className="font-semibold text-slate-800">
                {qualificationText}
              </span>
            </div>
            {(dobText || genderText) && (
              <div className="p-2 rounded-lg bg-white border border-slate-200/70">
                <span className="text-[10px] font-semibold text-slate-400 uppercase block">DOB / Gender</span>
                <span className="font-semibold text-slate-800">
                  {[dobText, genderText].filter(Boolean).join(" • ")}
                </span>
              </div>
            )}
            {locationText && (
              <div className="p-2 rounded-lg bg-white border border-slate-200/70 sm:col-span-2">
                <span className="text-[10px] font-semibold text-slate-400 uppercase flex items-center gap-1">
                  <MapPin size={10} /> Address / Nationality
                </span>
                <span className="font-semibold text-slate-800">{locationText}</span>
              </div>
            )}
          </div>

          {skillsList.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
              <span className="text-[10px] font-bold text-slate-500 uppercase mr-1">Skills:</span>
              {skillsList.map((skill, sIdx) => (
                <span
                  key={sIdx}
                  className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10.5px] font-semibold"
                >
                  {skill}
                </span>
              ))}
            </div>
          )}

          {(profileNotesText || adminRemarksText || rejectionReasonText || holdReasonText || didNotJoinReasonText) && (
            <div className="p-2.5 rounded-lg bg-white border border-slate-200/70 text-[11px] text-slate-700 space-y-1">
              {profileNotesText && (
                <div>
                  <strong className="text-slate-800">Profile Notes:</strong> {profileNotesText}
                </div>
              )}
              {adminRemarksText && (
                <div>
                  <strong className="text-slate-800">Remarks:</strong> {adminRemarksText}
                </div>
              )}
              {rejectionReasonText && (
                <div className="text-rose-700">
                  <strong>Rejection Reason:</strong> {rejectionReasonText}
                </div>
              )}
              {holdReasonText && (
                <div className="text-amber-700">
                  <strong>Hold Reason:</strong> {holdReasonText}
                </div>
              )}
              {didNotJoinReasonText && (
                <div className="text-rose-700">
                  <strong>Did Not Join Note:</strong> {didNotJoinReasonText}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-200/80 space-y-2.5 text-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 font-bold text-blue-950">
              <FileText size={14} className="text-blue-600" />
              <span>Resume / CV &amp; Uploaded Documents ({candidateDocs.length})</span>
            </div>
          </div>

          {candidateDocs.length === 0 ? (
            <div className="p-3 rounded-lg bg-white border border-dashed border-slate-300 text-slate-500 text-[11px]">
              No Resume / CV or supporting documents attached to this candidate record.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {candidateDocs.map((doc, dIdx) => (
                <div
                  key={dIdx}
                  className="p-2.5 rounded-xl bg-white border border-blue-100 flex items-center justify-between gap-2"
                >
                  <div className="min-w-0">
                    <div className="font-bold text-slate-900 text-[11.5px] truncate">{doc.name || doc.docType}</div>
                    <div className="text-[10px] text-slate-500 truncate">{doc.fileName || "Uploaded file"}</div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => openUploadedDocument(doc)}
                      className="px-2 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-[10.5px] inline-flex items-center gap-1 cursor-pointer"
                      title="Open document in new tab"
                    >
                      <ExternalLink size={11} />
                      <span>View</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => downloadUploadedDocument(doc)}
                      className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[10.5px] inline-flex items-center gap-1 cursor-pointer"
                      title="Download document"
                    >
                      <Download size={11} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {refundLocked && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <AlertTriangle size={16} className="text-rose-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-rose-950 text-xs">
                  Processing Frozen — Refund Claim ({refundStatus || "Pending Admin Approval"})
                </h4>
                <p className="text-[11px] text-rose-800 mt-0.5">
                  {refundStatus === "Pending Admin Approval"
                    ? "Stage updates, interviews, and payment progression are paused until Admin reviews and responds to this refund request."
                    : "Admin has processed this refund claim. Stage updates remain locked on this project; reassign this candidate to a new project if applicable."}
                </p>
              </div>
            </div>
            {isRefundReassignable && openReassignModal && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  openReassignModal(candidate);
                }}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shrink-0 flex items-center gap-1.5 shadow-2xs cursor-pointer"
              >
                <RotateCcw size={12} />
                <span>Reassign Candidate</span>
              </button>
            )}
          </div>
        )}

        {currentStage === "Rejected" && !refundLocked && (
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
          <div className="p-3.5 rounded-xl bg-indigo-50/60 border border-indigo-100 space-y-2">
            <label className="block text-slate-900 font-bold">Update Recruitment Stage *</label>
            <select
              value={candidateUpdateForm.stage}
              onChange={(e) => setCandidateUpdateForm({ ...candidateUpdateForm, stage: e.target.value })}
              disabled={refundLocked}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-600 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
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
              disabled={refundLocked}
              placeholder="Add evaluation remarks or stage notes..."
              className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed"
            />
          </div>

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
                    disabled={refundLocked}
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-900 text-xs cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
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
                    disabled={refundLocked}
                    placeholder="e.g. VISA-REF-001"
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-900 text-xs disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                </div>
              </div>
              <div>
                <label className="block text-slate-600 mb-1">Flight Booking & Departure Details</label>
                <input
                  type="text"
                  value={candidateUpdateForm.flightDetails}
                  onChange={(e) => setCandidateUpdateForm({ ...candidateUpdateForm, flightDetails: e.target.value })}
                  disabled={refundLocked}
                  placeholder="e.g. Emirates EK-513 (DEL -> DXB)"
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-900 text-xs disabled:opacity-60 disabled:cursor-not-allowed"
                />
              </div>
            </div>
          )}

          <div className="pt-2 flex justify-between items-center border-t border-slate-100">
            {!refundLocked && !isOnHoldStage && !isPostSelectionStage && currentStage !== "Rejected" ? (
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
                disabled={actionLoading || refundLocked}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-xs transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
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

