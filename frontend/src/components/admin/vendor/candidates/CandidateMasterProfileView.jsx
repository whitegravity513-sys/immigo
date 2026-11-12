import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Building2,
  Paperclip,
  CheckCircle2,
  FileText,
  XCircle,
  Clock,
  Eye,
  Download,
  Users,
  AlertTriangle,
  Video,
  UserCheck,
  ChevronRight,
  Sliders,
  Plus,
  Printer,
  RotateCcw,
} from "lucide-react";
import ConfigureMilestonesModal from "../ConfigureMilestonesModal.jsx";
import DateInput from "../../../common/DateInput.jsx";
import { printUploadedDocument } from "../../../../utils/printDocument.js";
import crmVendorService from "../../../../services/crmVendorService.js";
import {
  isAppRefundLocked,
  getAppRefundStatus,
  REASSIGN_ELIGIBLE_REFUND_STATUSES,
} from "../../../../services/refundService.js";

export default function CandidateMasterProfileView({
  selectedCandidate,
  onBack,
  overallStatus,
  vendorName,
  statusBadgeClass,
  submissionHistory = [],
  refunds = [],
  onAcceptAllCandidateDocs,
  onPreviewDoc,
  onDownloadDoc,
  onAcceptDocument,
  onConfirmInlineReject,
  inlineRejectIdx,
  setInlineRejectIdx,
  inlineRejectReason,
  setInlineRejectReason,
  onHold,
  onShortlist,
  onOpenInterviewModal,
  onSelect,
  onOpenRejectApp,
  actionLoading,
  configureMilestonesModal,
  setConfigureMilestonesModal,
  onSavedMilestones,
  interviewModal,
  setInterviewModal,
  interviewForm,
  setInterviewForm,
  onScheduleInterview,
  interviewLoading,
  rejectAppModal,
  setRejectAppModal,
  rejectReason,
  setRejectReason,
  onConfirmRejectApp,
  rejectLoading,
}) {
  const candDocs = selectedCandidate.documents || [];
  const allDocsVerified =
    candDocs.length > 0 &&
    candDocs.every((d) => (d.status || "").toLowerCase() === "verified");

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans antialiased text-slate-800 pb-16">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition shadow-2xs cursor-pointer"
        >
          <ArrowLeft size={16} className="text-blue-600" />
          <span>Back to All Candidates</span>
        </button>
        <span className="text-xs font-mono font-bold text-slate-400">
          Candidate Master Profile • {selectedCandidate.id}
        </span>
      </div>

      <div className="bg-white rounded-xl border border-slate-200/90 p-4 sm:p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="flex items-center gap-4">
            <div className={`w-16 h-16 rounded-2xl ${selectedCandidate.photo ? "bg-white" : "bg-blue-50 border border-blue-200 text-blue-600"} font-bold text-xl flex items-center justify-center shadow-md overflow-hidden shrink-0`}>
              {selectedCandidate.photo ? (
                <img
                  src={selectedCandidate.photo}
                  alt={selectedCandidate.fullName}
                  className="w-full h-full object-cover"
                />
              ) : (
                selectedCandidate.fullName?.slice(0, 2).toUpperCase()
              )}
            </div>
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                  {selectedCandidate.fullName}
                </h1>
                <span className="font-mono text-xs font-bold px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg">
                  {selectedCandidate.id}
                </span>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold shadow-2xs ${statusBadgeClass(
                    overallStatus
                  )}`}
                >
                  {overallStatus}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 font-semibold flex items-center gap-3 flex-wrap">
                <span>
                  Trade: <strong className="text-blue-700">{selectedCandidate.currentPosition}</strong>
                </span>
                <span>•</span>
                <span>
                  Experience: <strong className="text-slate-800">{selectedCandidate.experienceYears} Years</strong>
                </span>
                <span>•</span>
                <span>
                  Destination: <strong className="text-indigo-700">{selectedCandidate.preferredCountry}</strong>
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-3 py-2 bg-blue-50 text-blue-800 text-xs font-bold rounded-xl border border-blue-200">
              {submissionHistory.length} Project Application{submissionHistory.length !== 1 ? "s" : ""}
            </span>
          </div>
        </div>

        <div className="p-4 bg-slate-50/90 rounded-xl border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <Building2 size={22} className="text-blue-600 shrink-0" />
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Source Vendor Partner</span>
              <span className="font-bold text-slate-900 text-sm">{vendorName}</span>
              <span className="font-mono text-slate-500 text-[11px] block">
                Vendor ID: {selectedCandidate.vendorId}
              </span>
            </div>
          </div>
          <div className="text-xs text-slate-600 font-medium">
            <span>Sourced Date: </span>
            <strong className="text-slate-800">
              {selectedCandidate.createdAt
                ? new Date(selectedCandidate.createdAt).toLocaleDateString("en-IN")
                : "—"}
            </strong>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-5 rounded-xl bg-white border border-slate-200 space-y-3 shadow-2xs">
            <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider border-b border-slate-100 pb-2">
              Personal Information
            </h3>
            <div className="flex justify-between">
              <span className="text-slate-400">Date of Birth:</span>
              <span className="font-bold text-slate-900">{selectedCandidate.dob || "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Gender / Nationality:</span>
              <span className="font-bold text-slate-900">
                {selectedCandidate.gender || "—"} • {selectedCandidate.nationality || "—"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Mobile Phone:</span>
              <span className="font-bold text-slate-900">{selectedCandidate.phone}</span>
            </div>
            <div className="flex flex-wrap justify-between gap-2">
              <span className="text-slate-400">Email Address:</span>
              <span className="font-bold text-slate-900 break-all">{selectedCandidate.email}</span>
            </div>
            <div className="flex flex-wrap justify-between gap-2">
              <span className="text-slate-400">Full Address:</span>
              <span className="font-semibold text-slate-800 text-right">{selectedCandidate.address}</span>
            </div>
          </div>

          <div className="p-5 rounded-xl bg-white border border-slate-200 space-y-3 shadow-2xs">
            <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider border-b border-slate-100 pb-2">
              Trade & Skill Information
            </h3>
            <div className="flex justify-between">
              <span className="text-slate-400">Trade Position:</span>
              <span className="font-bold text-blue-700 text-sm">
                {selectedCandidate.currentPosition}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Total Experience:</span>
              <span className="font-bold text-slate-900">{selectedCandidate.experienceYears} Years</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Qualification:</span>
              <span className="font-bold text-slate-900">{selectedCandidate.qualification}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Previous Employer:</span>
              <span className="font-semibold text-slate-800">{selectedCandidate.previousCompany || "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Preferred Destination:</span>
              <span className="font-bold text-indigo-700">{selectedCandidate.preferredCountry}</span>
            </div>
            <div className="pt-1">
              <span className="text-slate-400 block mb-1 font-semibold">Technical Skills:</span>
              <div className="flex flex-wrap gap-1.5">
                {(selectedCandidate.skills || []).map((sk, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 bg-slate-100 text-slate-800 rounded font-semibold text-[11px]"
                  >
                    {sk}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200/90 p-4 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Paperclip size={18} className="text-blue-600" />
              <span>Candidate Verification Documents Vault</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">
              Inspect identity documents, passport, resume & skill certificates submitted by vendor.
            </p>
          </div>

          {candDocs.length > 0 &&
            (allDocsVerified ? (
              <span className="px-3.5 py-1.5 rounded-xl bg-emerald-100 text-emerald-800 font-bold text-xs border border-emerald-200 flex items-center gap-1.5 shadow-2xs">
                <CheckCircle2 size={14} className="text-emerald-600" />
                <span>All Documents Verified</span>
              </span>
            ) : (
              <button
                onClick={onAcceptAllCandidateDocs}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-2xs transition flex items-center gap-1.5 cursor-pointer"
              >
                <CheckCircle2 size={14} />
                <span>Verify & Accept All</span>
              </button>
            ))}
        </div>

        {candDocs.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300 space-y-2">
            <div className="w-12 h-12 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center mx-auto">
              <FileText size={24} />
            </div>
            <h4 className="font-bold text-slate-800 text-sm">No Documents Uploaded</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              The sourcing vendor has not submitted any documents for this candidate yet.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            {candDocs.map((doc, idx) => {
              const docStatus = doc.status || "Pending Review";
              const isVerified = docStatus === "Verified";
              const isRejected = docStatus === "Rejected";

              return (
                <div
                  key={idx}
                  className={`p-4 rounded-xl border transition space-y-3 ${
                    isVerified
                      ? "border-emerald-200 bg-emerald-50/30"
                      : isRejected
                      ? "border-rose-200 bg-rose-50/30"
                      : "border-slate-200 bg-slate-50/70"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold shrink-0">
                        <FileText size={18} />
                      </div>
                      <div>
                        <span className="font-bold text-slate-900 block text-xs">{doc.name}</span>
                        <span className="text-[10px] text-slate-400 font-mono block">
                          {doc.fileName} • {doc.size || "—"}
                        </span>
                      </div>
                    </div>

                    {isVerified ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 shrink-0 flex items-center gap-1">
                        <CheckCircle2 size={12} className="text-emerald-600" /> Verified
                      </span>
                    ) : isRejected ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200 shrink-0 flex items-center gap-1">
                        <XCircle size={12} className="text-rose-600" /> Rejected
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 shrink-0 flex items-center gap-1">
                        <Clock size={12} className="text-amber-600" /> Pending
                      </span>
                    )}
                  </div>

                  {isRejected && doc.remarks && (
                    <div className="p-2.5 rounded-xl bg-rose-100/80 border border-rose-200 text-rose-900 font-semibold text-[11px]">
                      <strong>Rejection Remark:</strong> {doc.remarks}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2.5 border-t border-slate-200/80 text-[11px] gap-2 flex-wrap">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => onPreviewDoc(doc)}
                        className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 cursor-pointer flex items-center gap-1.5 transition shadow-2xs"
                      >
                        <Eye size={13} className="text-blue-600" />
                        <span>View Document</span>
                      </button>
                      <button
                        type="button"
                        disabled={!doc.fileUrl}
                        onClick={() => printUploadedDocument(doc)}
                        className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 disabled:opacity-40 cursor-pointer flex items-center gap-1 transition"
                        title="Print Document"
                      >
                        <Printer size={13} />
                        <span>Print</span>
                      </button>
                      <button
                        type="button"
                        disabled={!doc.fileUrl}
                        onClick={() => onDownloadDoc(doc)}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-700 font-bold cursor-pointer flex items-center gap-1 transition"
                      >
                        <Download size={13} />
                        <span>Download</span>
                      </button>
                    </div>

                    {isVerified ? (
                      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-100 text-emerald-800 font-bold text-xs border border-emerald-200 shadow-2xs">
                        <CheckCircle2 size={14} className="text-emerald-600" />
                        <span>Verified</span>
                      </div>
                    ) : isRejected ? (
                      <div className="flex items-center gap-1.5">
                        <span className="px-2.5 py-1 rounded-lg bg-rose-100 text-rose-800 font-bold text-[11px] border border-rose-200">
                          Rejected
                        </span>
                        <button
                          type="button"
                          onClick={() => onAcceptDocument(idx)}
                          className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] cursor-pointer shadow-2xs transition"
                        >
                          Accept Now
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => onAcceptDocument(idx)}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] cursor-pointer shadow-2xs transition flex items-center gap-1"
                        >
                          <CheckCircle2 size={12} />
                          <span>Accept</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setInlineRejectIdx(inlineRejectIdx === idx ? null : idx);
                            setInlineRejectReason("");
                          }}
                          className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px] cursor-pointer shadow-2xs transition flex items-center gap-1"
                        >
                          <XCircle size={12} />
                          <span>Reject</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {inlineRejectIdx === idx && (
                    <div className="mt-2.5 p-3 rounded-xl bg-rose-50 border border-rose-200 space-y-2 animate-fadeIn">
                      <label className="text-[11px] font-bold text-rose-900 block">
                        Specify Rejection Reason for {doc.name}:
                      </label>
                      <input
                        type="text"
                        value={inlineRejectReason}
                        onChange={(e) => setInlineRejectReason(e.target.value)}
                        placeholder="e.g. Expired validity, blurred image, name mismatch..."
                        className="w-full px-3 py-1.5 rounded-lg border border-rose-300 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-rose-500 font-medium"
                      />
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setInlineRejectIdx(null)}
                          className="px-2.5 py-1 rounded-lg text-slate-600 text-[11px] font-bold hover:bg-slate-200/60 cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => onConfirmInlineReject(idx)}
                          className="px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold cursor-pointer shadow-2xs"
                        >
                          Confirm Reject
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl border border-slate-200/90 p-4 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <h2 className="text-base font-bold text-slate-900">
            Project Applications ({submissionHistory.length})
          </h2>
          <span className="text-xs font-bold text-blue-800 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
            Admin Review Panel
          </span>
        </div>

        {submissionHistory.length === 0 ? (
          <div className="p-8 bg-slate-50 rounded-2xl text-slate-500 italic text-center text-xs border border-dashed border-slate-300">
            <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p>No project applications found. Vendor has not submitted this candidate to any project yet.</p>
          </div>
        ) : (
          <div className="space-y-4 text-xs">
            {submissionHistory.map((sub) => {
              const subId = sub.id || sub.applicationId || sub._id;
              const postSelectionStatuses = [
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
              ];
              const subStatus = String(sub.status || sub.recruitmentStage || "").trim();
              const isSelected = postSelectionStatuses.includes(subStatus);
              const isInterview =
                subStatus === "Interview" ||
                subStatus === "Interview Scheduled" ||
                subStatus.toLowerCase().includes("interview");
              const isRejected = subStatus === "Rejected";
              const isShortlisted = subStatus === "Shortlisted";
              const isOnHold = subStatus === "On Hold";
              const subRefundStatus = getAppRefundStatus(sub, refunds);
              const subRefundLocked = isAppRefundLocked(sub, refunds);
              const canReassignSub = REASSIGN_ELIGIBLE_REFUND_STATUSES.has(subRefundStatus);
              const resolvedSubMilestones = !sub.milestonesOverridden
                ? crmVendorService.syncAppMilestonesWithProject(sub) ||
                  sub.processMilestones ||
                  sub.paymentPlan?.milestones ||
                  []
                : sub.processMilestones?.length > 0
                ? sub.processMilestones
                : sub.paymentPlan?.milestones || [];
              const resolvedTotal = resolvedSubMilestones.reduce(
                (sum, ms) => sum + Number(ms.paymentAmount ?? ms.amount ?? 0),
                0
              );

              return (
                <div
                  key={subId}
                  className={`rounded-xl border transition overflow-hidden ${
                    isSelected
                      ? "bg-emerald-50/50 border-emerald-200"
                      : isShortlisted
                      ? "bg-indigo-50/50 border-indigo-200"
                      : isInterview
                      ? "bg-purple-50/50 border-purple-200"
                      : isRejected
                      ? "bg-rose-50/50 border-rose-200"
                      : isOnHold
                      ? "bg-amber-50/50 border-amber-200"
                      : "bg-slate-50 border-slate-200"
                  }`}
                >
                  <div className="p-5">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div className="flex-1">
                        <span className="font-mono text-[10px] font-bold text-slate-400 block">{subId}</span>
                        <h4 className="font-bold text-slate-900 text-base mt-0.5">{sub.projectName}</h4>
                        <p className="text-xs text-slate-600 mt-1 font-semibold">
                          Client: <strong className="text-slate-900">{sub.clientName}</strong>
                          {" • "}Position: {sub.position}
                          {sub.country ? ` (${sub.country})` : ""}
                        </p>
                        <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                          Submitted: {sub.submittedAt ? String(sub.submittedAt).split("T")[0] : "—"}
                        </p>

                        {isRejected && sub.rejectionReason && (
                          <div className="mt-2.5 p-2.5 rounded-xl bg-rose-100/80 border border-rose-200 text-rose-900 font-semibold text-xs flex items-center gap-2">
                            <AlertTriangle size={15} className="text-rose-600 shrink-0" />
                            <span>Rejection Reason: {sub.rejectionReason}</span>
                          </div>
                        )}

                        {isOnHold && sub.holdReason && (
                          <div className="mt-2.5 p-2.5 rounded-xl bg-amber-100/80 border border-amber-200 text-amber-900 font-semibold text-xs flex items-center gap-2">
                            <Clock size={15} className="text-amber-600 shrink-0" />
                            <span>Hold Note: {sub.holdReason}</span>
                          </div>
                        )}

                        {isInterview && sub.interviewDetails && (
                          <div className="mt-2.5 p-2.5 rounded-xl bg-purple-100/70 border border-purple-200 text-purple-900 font-semibold text-xs space-y-1">
                            <div className="flex items-center gap-2">
                              <Video size={13} className="text-purple-600 shrink-0" />
                              <span className="font-bold">Interview Scheduled:</span>
                              <span>
                                {sub.interviewDetails.dateTime
                                  ? new Date(sub.interviewDetails.dateTime).toLocaleString("en-IN")
                                  : "—"}
                              </span>
                            </div>
                            {sub.interviewDetails.meetingUrl && (
                              <div>
                                <a
                                  href={sub.interviewDetails.meetingUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-purple-700 underline font-bold"
                                >
                                  🔗 Join Meeting
                                </a>
                              </div>
                            )}
                            {sub.interviewDetails.notes && (
                              <div className="text-purple-700">Notes: {sub.interviewDetails.notes}</div>
                            )}
                          </div>
                        )}
                      </div>

                      <span
                        className={`px-4 py-1.5 rounded-full text-xs font-bold shadow-2xs self-start ${statusBadgeClass(
                          subStatus
                        )}`}
                      >
                        {subStatus || "Submitted"}
                      </span>
                    </div>

                    {subRefundLocked && (
                      <div className="mt-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-start gap-2.5">
                          <AlertTriangle size={16} className="text-rose-600 shrink-0 mt-0.5" />
                          <div className="text-xs space-y-0.5">
                            <div className="font-bold text-rose-950">
                              Payment &amp; Processing Frozen — Refund Claim ({subRefundStatus || "Pending Admin Approval"})
                            </div>
                            <p className="text-[11px] text-rose-800">
                              {subRefundStatus === "Pending Admin Approval"
                                ? "All milestone payments, receipts, stage progression, and selection actions are paused until Admin reviews and responds to this refund request."
                                : "Admin has processed this refund claim. Processing on this project remains closed; reassign this candidate to another project if applicable."}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 flex-wrap">
                          <Link
                            to="/admin/vendor/refunds"
                            className="px-3 py-1.5 rounded-lg bg-white border border-rose-300 hover:bg-rose-100 text-rose-800 font-bold text-[11px] transition"
                          >
                            Review in Refunds
                          </Link>
                          {canReassignSub && (
                            <Link
                              to={`/admin/vendor/reassign?appId=${subId}`}
                              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] transition inline-flex items-center gap-1"
                            >
                              <RotateCcw size={11} />
                              <span>Reassign Candidate</span>
                            </Link>
                          )}
                        </div>
                      </div>
                    )}

                    {!subRefundLocked && !isSelected && !isRejected && (
                      <div className="mt-4 pt-4 border-t border-slate-200/60">
                        {!isShortlisted && !isInterview && !isOnHold && (
                          <div className="space-y-1.5">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                              Screening Decision:
                            </span>
                            <div className="flex items-center gap-2 flex-wrap">
                              <button
                                type="button"
                                onClick={() => (onShortlist ? onShortlist(sub) : onHold(sub))}
                                disabled={actionLoading === subId + "_shortlist"}
                                className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] flex items-center gap-1.5 cursor-pointer transition shadow-2xs disabled:opacity-50"
                              >
                                <CheckCircle2 size={13} />
                                <span>{actionLoading === subId + "_shortlist" ? "Shortlisting..." : "Shortlist Candidate"}</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => onOpenRejectApp(sub)}
                                className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-[11px] flex items-center gap-1.5 cursor-pointer transition shadow-2xs"
                              >
                                <XCircle size={13} />
                                <span>Reject</span>
                              </button>
                            </div>
                          </div>
                        )}

                        {isOnHold && !isShortlisted && !isInterview && (
                          <div className="space-y-1.5">
                            <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block">
                              On Hold — Final Outcome Decision:
                            </span>
                            <div className="flex items-center gap-2 flex-wrap">
                              <button
                                type="button"
                                onClick={() => onSelect(sub)}
                                disabled={actionLoading === subId + "_select"}
                                className="px-3.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-[11px] flex items-center gap-1.5 cursor-pointer transition shadow-2xs disabled:opacity-50"
                              >
                                <UserCheck size={13} />
                                <span>{actionLoading === subId + "_select" ? "Selecting..." : "Select Candidate"}</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => onOpenRejectApp(sub)}
                                className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-[11px] flex items-center gap-1.5 cursor-pointer transition shadow-2xs"
                              >
                                <XCircle size={13} />
                                <span>Reject</span>
                              </button>
                            </div>
                          </div>
                        )}

                        {isShortlisted && !isInterview && (
                          <div className="space-y-1.5">
                            <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider block">
                              Shortlist Cleared:
                            </span>
                            <div className="flex items-center gap-2 flex-wrap">
                              <button
                                type="button"
                                onClick={() => onOpenInterviewModal(sub)}
                                className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] flex items-center gap-1.5 cursor-pointer transition shadow-2xs"
                              >
                                <Video size={13} />
                                <span>Schedule Interview</span>
                              </button>
                            </div>
                          </div>
                        )}

                        {isInterview && (
                          <div className="space-y-1.5">
                            <span className="text-[10px] font-bold text-purple-700 uppercase tracking-wider block">
                              Interview Evaluation:
                            </span>
                            <div className="flex items-center gap-2 flex-wrap">
                              <button
                                type="button"
                                onClick={() => onSelect(sub)}
                                disabled={actionLoading === subId + "_select"}
                                className="px-3.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-[11px] flex items-center gap-1.5 cursor-pointer transition shadow-2xs disabled:opacity-50"
                              >
                                <UserCheck size={13} />
                                <span>{actionLoading === subId + "_select" ? "Selecting..." : "Select Candidate 🎉"}</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => onOpenRejectApp(sub)}
                                className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-[11px] flex items-center gap-1.5 cursor-pointer transition shadow-2xs"
                              >
                                <XCircle size={13} />
                                <span>Reject</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => onHold && onHold(sub)}
                                disabled={actionLoading === subId + "_hold"}
                                className="px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 font-bold text-[11px] flex items-center gap-1.5 cursor-pointer transition shadow-2xs disabled:opacity-50"
                              >
                                <Clock size={13} />
                                <span>{actionLoading === subId + "_hold" ? "Holding..." : "Hold"}</span>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {isSelected && (
                      <div className="mt-4 pt-4 border-t border-emerald-200/60 space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-emerald-50/80 rounded-xl border border-emerald-200">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-200 text-emerald-900 border border-emerald-300">
                                ✓ Candidate Selected
                              </span>
                              <span className="text-xs text-emerald-800 font-bold">
                                Active in Deployment Processing Roster
                              </span>
                            </div>
                            <p className="text-[10.5px] text-emerald-700 mt-0.5">
                              Milestone payments & sub-stages processing can be monitored and updated directly below or via dedicated steppers.
                            </p>
                          </div>
                          {!subRefundLocked && (
                            <div className="flex flex-wrap items-center gap-2 shrink-0">
                              <Link
                                to={`/admin/vendor/processing?appId=${subId}`}
                                className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-2xs transition inline-flex items-center gap-1.5"
                                title="Open Full 8-Stage Processing Stepper"
                              >
                                <Clock size={13} />
                                <span>Processing Stepper</span>
                              </Link>
                              <Link
                                to={`/admin/vendor/milestones-manage?appId=${subId}`}
                                className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-2xs transition inline-flex items-center gap-1.5"
                                title="Configure Milestones & Verify Documents"
                              >
                                <Sliders size={13} />
                                <span>Manage Milestones</span>
                              </Link>
                            </div>
                          )}
                        </div>

                        {resolvedSubMilestones.length > 0 ? (
                          <div>
                            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                              <p className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                                Payment Milestones — Total: ₹{resolvedTotal.toLocaleString("en-IN")}
                              </p>
                              {!subRefundLocked && (
                                <div className="flex flex-wrap items-center gap-1.5">
                                  <button
                                    onClick={() => setConfigureMilestonesModal({ application: sub })}
                                    className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[10px] font-bold flex items-center gap-1 cursor-pointer transition border border-indigo-200 shadow-2xs"
                                  >
                                    <Sliders size={11} />
                                    <span>Configure Plan</span>
                                  </button>
                                  <button
                                    onClick={() => setConfigureMilestonesModal({ application: sub })}
                                    className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold flex items-center gap-1 cursor-pointer transition shadow-2xs"
                                  >
                                    <Plus size={11} />
                                    <span>Add Milestone</span>
                                  </button>
                                </div>
                              )}
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {resolvedSubMilestones.map((ms, mi) => {
                                const isPaid =
                                  ms.paymentStatus === "Approved" ||
                                  ms.status === "Paid" ||
                                  ms.status === "Completed";
                                const isSub =
                                  ms.paymentStatus === "Submitted" ||
                                  ms.paymentStatus === "Pending Verification" ||
                                  ms.status === "Submitted";
                                const isDue =
                                  !isPaid &&
                                  !isSub &&
                                  (ms.status === "Due" ||
                                    ms.paymentStatus === "Due" ||
                                    ms.paymentStatus === "Payment Required");
                                const msName = ms.milestoneName || ms.name;
                                const msAmount = Number(ms.paymentAmount ?? ms.amount ?? 0);
                                const msStatusLabel = isPaid
                                  ? "Paid"
                                  : isSub
                                  ? "Submitted"
                                  : ms.paymentStatus || ms.status || "Pending";

                                return (
                                  <button
                                    key={mi}
                                    type="button"
                                    disabled={subRefundLocked}
                                    onClick={() => {
                                      if (!subRefundLocked) {
                                        setConfigureMilestonesModal({ application: sub });
                                      }
                                    }}
                                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition flex items-center gap-1.5 ${
                                      subRefundLocked ? "opacity-75 cursor-not-allowed" : "cursor-pointer hover:shadow-xs"
                                    } ${
                                      isPaid
                                        ? "bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100"
                                        : isSub
                                        ? "bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100"
                                        : isDue
                                        ? "bg-blue-50 border-blue-200 text-blue-800 hover:bg-blue-100"
                                        : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                                    }`}
                                  >
                                    <span>
                                      {msName} — ₹{msAmount.toLocaleString("en-IN")} [{msStatusLabel}]
                                    </span>
                                    <Sliders size={10} className="text-slate-400" />
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        ) : !subRefundLocked ? (
                          <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-blue-50/70 rounded-xl border border-blue-200">
                            <div>
                              <p className="text-xs font-bold text-blue-900">Payment Milestones & Processing Stages</p>
                              <p className="text-[10px] text-blue-700">
                                Configure fee milestones and customize individual stage steps for this candidate.
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => setConfigureMilestonesModal({ application: sub })}
                              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs transition"
                            >
                              <Sliders size={12} />
                              <span>Configure Milestones & Stages</span>
                            </button>
                          </div>
                        ) : null}

                        {(() => {
                          const displayStages =
                            Array.isArray(sub.processing?.stages) && sub.processing.stages.length > 0
                              ? sub.processing.stages
                              : resolvedSubMilestones.flatMap((m) => m.stages || []);
                          if (displayStages.length === 0) return null;
                          return (
                            <div className="pt-2 border-t border-slate-100">
                              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                                <p className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                                  Processing Stages
                                </p>
                                {!subRefundLocked && (
                                  <Link
                                    to={`/admin/vendor/milestones-manage?appId=${subId}`}
                                    className="text-[10px] font-bold text-indigo-700 hover:text-indigo-900 hover:underline"
                                  >
                                    Update Stages →
                                  </Link>
                                )}
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {displayStages.map((stg, i) => {
                                  const stgNorm = String(stg.status || "").toLowerCase();
                                  const isStgCompleted = stgNorm === "completed";
                                  const isStgInProgress = stgNorm === "in progress" || stgNorm === "in_progress";
                                  return (
                                    <div
                                      key={stg.id || i}
                                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold ${
                                        isStgCompleted
                                          ? "bg-emerald-100 text-emerald-800"
                                          : isStgInProgress
                                          ? "bg-blue-100 text-blue-800"
                                          : "bg-slate-100 text-slate-500"
                                      }`}
                                    >
                                      {isStgCompleted ? (
                                        <CheckCircle2 size={11} />
                                      ) : isStgInProgress ? (
                                        <ChevronRight size={11} />
                                      ) : (
                                        <Clock size={11} />
                                      )}
                                      <span>{stg.name}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    )}

                    {isRejected && (
                      <div className="mt-4 pt-4 border-t border-rose-200/60">
                        <p className="text-[11px] text-slate-500 italic">
                          Candidate returned to vendor pool. Vendor can re-submit this candidate to another project.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {interviewModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full my-auto max-h-[90vh] overflow-y-auto p-4 sm:p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold text-purple-600 uppercase tracking-wider block">
                  Interview Scheduling
                </span>
                <h3 className="text-base font-bold text-slate-900">Schedule Interview</h3>
              </div>
              <button
                onClick={() => setInterviewModal(null)}
                className="text-slate-400 hover:text-slate-600 font-bold cursor-pointer text-lg"
              >
                ✕
              </button>
            </div>

            <div className="p-3 bg-purple-50/60 rounded-xl border border-purple-200 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Candidate:</span>
                <span className="font-bold">{interviewModal.application.candidateName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Project:</span>
                <span className="font-bold">{interviewModal.application.projectName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Position:</span>
                <span className="font-bold text-purple-700">{interviewModal.application.position}</span>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Interview Date & Time *</label>
                <DateInput
                  includeTime
                  value={interviewForm.dateTime}
                  onChange={(e) => setInterviewForm({ ...interviewForm, dateTime: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:border-purple-600 focus:outline-none bg-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Meeting URL</label>
                <input
                  type="url"
                  value={interviewForm.meetingUrl}
                  onChange={(e) => setInterviewForm({ ...interviewForm, meetingUrl: e.target.value })}
                  placeholder="https://zoom.us/j/..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:border-purple-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Interview Notes (Optional)</label>
                <textarea
                  rows={2}
                  value={interviewForm.notes}
                  onChange={(e) => setInterviewForm({ ...interviewForm, notes: e.target.value })}
                  placeholder="Additional instructions for vendor/candidate..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:border-purple-600 focus:outline-none resize-none"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2 pt-1 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setInterviewModal(null)}
                className="py-2 px-4 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onScheduleInterview}
                disabled={interviewLoading}
                className="py-2 px-5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
              >
                <Video size={13} />
                <span>{interviewLoading ? "Scheduling..." : "Confirm & Schedule"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {rejectAppModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full my-auto max-h-[90vh] overflow-y-auto p-4 sm:p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wider block">
                  Reject Application
                </span>
                <h3 className="text-base font-bold text-slate-900">Reject Candidate from Project</h3>
              </div>
              <button
                onClick={() => setRejectAppModal(null)}
                className="text-slate-400 hover:text-slate-600 font-bold cursor-pointer text-lg"
              >
                ✕
              </button>
            </div>

            <div className="p-3 bg-rose-50/60 rounded-xl border border-rose-200 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Candidate:</span>
                <span className="font-bold">{rejectAppModal.application.candidateName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Project:</span>
                <span className="font-bold">{rejectAppModal.application.projectName}</span>
              </div>
            </div>

            <p className="text-xs text-slate-500">
              Candidate will be returned to vendor pool and vendor can re-submit to other projects.
            </p>

            <div>
              <label className="block font-bold text-slate-700 mb-1 text-xs">Rejection Reason *</label>
              <textarea
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Did not meet specific client requirements, skills mismatch, etc."
                className="w-full p-3 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
              />
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2 pt-1 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setRejectAppModal(null)}
                className="py-2 px-4 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onConfirmRejectApp}
                disabled={rejectLoading}
                className="py-2 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
              >
                <XCircle size={13} />
                <span>{rejectLoading ? "Rejecting..." : "Confirm Rejection"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfigureMilestonesModal
        isOpen={Boolean(configureMilestonesModal)}
        onClose={() => setConfigureMilestonesModal(null)}
        application={configureMilestonesModal?.application}
        onSaved={onSavedMilestones}
      />
    </div>
  );
}
