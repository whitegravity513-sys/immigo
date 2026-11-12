import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Edit,
  Trash2,
  FileText,
  Ban,
  CheckCircle2,
  Clock,
  XCircle,
  Send,
  Users,
  Mail,
  Phone,
  MapPin,
  FileCheck,
  Eye,
  Download,
  ExternalLink,
  Printer,
  RefreshCw,
} from "lucide-react";
import VendorStatusBadge from "../list/VendorStatusBadge.jsx";
import { printUploadedDocument } from "../../../../utils/printDocument.js";

export default function VendorDetailView({
  selectedVendor,
  onBack,
  onEditVendor,
  onDeleteVendor,
  onToggleSuspend,
  onApproveRegistration,
  onHoldRegistration,
  onOpenRejectModal,
  onApproveDocsAndSendMou,
  onRequestDocCorrection,
  onShowViewMouPage,
  onApproveMouAndActivate,
  onRequestMouCorrection,
  onPreviewDoc,
  onDownloadDoc,
}) {
  const vId = selectedVendor.id || selectedVendor.vendorId || selectedVendor._id;
  const hasUploadedDocs = Boolean(
    selectedVendor.documentsUploaded ||
      (Array.isArray(selectedVendor.documents) && selectedVendor.documents.length > 0)
  );
  const isRejected = Boolean(
    ["Rejected", "Registration Rejected", "MOU Rejected"].includes(selectedVendor.status) ||
      selectedVendor.mouStatus === "Rejected"
  );
  const isRegPending = Boolean(
    ["Registration Pending", "Pending", "Registration On Hold"].includes(selectedVendor.status)
  );
  const isBlockedStatus = Boolean(
    isRegPending || isRejected || selectedVendor.status === "Suspended"
  );
  const isCorrectionRequired = Boolean(
    selectedVendor.mouStatus === "Correction Required" ||
      selectedVendor.status === "MOU Correction Required"
  );
  const isMouApproved = Boolean(
    !isRejected &&
      (selectedVendor.status === "Approved" ||
        selectedVendor.status === "Active" ||
        selectedVendor.mouStatus === "Approved" ||
        selectedVendor.onboardingStage === "COMPLETED" ||
        selectedVendor.onboardingStage === "ACTIVE")
  );
  const isMouUnderReview = Boolean(
    !isRejected &&
      !isMouApproved &&
      !isCorrectionRequired &&
      (selectedVendor.status === "Pending MOU Approval" ||
        selectedVendor.status === "MOU Under Review" ||
        selectedVendor.mouStatus === "Under Review" ||
        selectedVendor.mouSigned ||
        selectedVendor.mouStatus === "Signed" ||
        selectedVendor.onboardingStage === "MOU_UNDER_REVIEW" ||
        selectedVendor.onboardingStage === "MOU_SIGNED" ||
        Boolean(selectedVendor.signedMou?.signedAt))
  );
  const isMouPendingSign = Boolean(
    !isRejected &&
      !isMouApproved &&
      !isMouUnderReview &&
      (selectedVendor.mouStatus === "Sent" ||
        isCorrectionRequired ||
        selectedVendor.status === "MOU Pending" ||
        selectedVendor.onboardingStage === "MOU_SENT")
  );
  const isMouAssigned = isMouApproved || isMouUnderReview || isMouPendingSign;
  const canAssignMou = Boolean(hasUploadedDocs && !isMouAssigned && !isBlockedStatus);
  const uploadedMouUrl = selectedVendor.signedMouDocUrl || selectedVendor.signedMou?.signedFileUrl || "";
  const isUploadSubmission = Boolean(
    selectedVendor.mouSignMethod === "upload" ||
      selectedVendor.mouSignMethod === "DOWNLOAD_SIGN_UPLOAD" ||
      (selectedVendor.mouSignMethod !== "digital" &&
        selectedVendor.mouSignMethod !== "DIGITAL_ACKNOWLEDGEMENT" &&
        uploadedMouUrl)
  );
  const joinedDateRaw = selectedVendor.registeredAt || selectedVendor.createdAt;
  const joinedDateLabel = joinedDateRaw
    ? new Date(joinedDateRaw).toLocaleDateString("en-IN")
    : "N/A";

  return (
    <div className="space-y-3 w-full max-w-full overflow-hidden font-sans antialiased text-slate-800">
      <div className="flex flex-wrap items-center justify-between gap-2 bg-white p-2.5 sm:p-3 rounded-lg border border-slate-200/90 shadow-2xs">
        <button
          onClick={onBack}
          type="button"
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition shadow-xs cursor-pointer"
        >
          <ArrowLeft size={14} />
          <span>Back to All Vendors</span>
        </button>

        <div className="flex items-center gap-2">
          <Link
            to={`/admin/vendor/${selectedVendor.id || selectedVendor.vendorId}`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-xs"
          >
            <span>Full Workspace</span>
            <ExternalLink size={13} />
          </Link>
          <span className="text-[11px] font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
            {selectedVendor.id || selectedVendor.vendorId}
          </span>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-slate-200/90 p-3.5 sm:p-4 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
            <div className={`w-10 h-10 rounded-lg ${selectedVendor.logo || selectedVendor.profileImage ? "bg-white" : "bg-blue-50 border border-blue-200 text-blue-600"} flex items-center justify-center font-bold text-sm shadow-xs shrink-0 overflow-hidden`}>
              {selectedVendor.logo || selectedVendor.profileImage ? (
                <img src={selectedVendor.logo || selectedVendor.profileImage} alt="" className="w-full h-full object-cover" />
              ) : (
                selectedVendor.companyName?.substring(0, 2).toUpperCase() || "VN"
              )}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                  {selectedVendor.companyName}
                </h1>
                <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded">
                  {selectedVendor.id || selectedVendor.vendorId}
                </span>
                <VendorStatusBadge status={selectedVendor.status} />
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-2 flex-wrap font-medium">
                <span>Reg No: {selectedVendor.registrationNumber || "N/A"}</span>
                <span>•</span>
                <span>Joined: {joinedDateLabel}</span>
                <span>•</span>
                <span>Type: {selectedVendor.businessType || "Manpower Agency"}</span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 shrink-0 self-start sm:self-center">
            <button
              type="button"
              onClick={() => onEditVendor(selectedVendor)}
              className="px-2.5 py-1.5 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs shadow-2xs transition flex items-center gap-1.5 cursor-pointer"
            >
              <Edit size={13} className="text-slate-500" />
              <span>Edit</span>
            </button>

            {(selectedVendor.status === "Active" ||
              selectedVendor.status === "Approved" ||
              selectedVendor.status === "Suspended") && (
              <button
                type="button"
                onClick={() => onToggleSuspend(vId)}
                className={`px-2.5 py-1.5 rounded-md border text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  selectedVendor.status === "Suspended"
                    ? "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100"
                    : "bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100"
                }`}
              >
                <Ban size={13} />
                <span>{selectedVendor.status === "Suspended" ? "Activate" : "Suspend"}</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => onDeleteVendor(selectedVendor)}
              className="px-2.5 py-1.5 rounded-md border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs shadow-2xs transition flex items-center gap-1.5 cursor-pointer"
            >
              <Trash2 size={13} />
              <span>Delete</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 text-xs font-medium">
          <div className="p-2 sm:p-2.5 bg-slate-50/80 rounded-lg border border-slate-200/80 flex items-center gap-2">
            <Users size={15} className="text-blue-600 shrink-0" />
            <div className="min-w-0">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Contact Person</span>
              <span className="font-bold text-slate-900 truncate block">{selectedVendor.contactPersonName || "N/A"}</span>
            </div>
          </div>

          <div className="p-2 sm:p-2.5 bg-slate-50/80 rounded-lg border border-slate-200/80 flex items-center gap-2">
            <Mail size={15} className="text-indigo-600 shrink-0" />
            <div className="min-w-0">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Email Address</span>
              <span className="font-bold text-slate-900 truncate block">
                {selectedVendor.contactPersonEmail || selectedVendor.email}
              </span>
            </div>
          </div>

          <div className="p-2 sm:p-2.5 bg-slate-50/80 rounded-lg border border-slate-200/80 flex items-center gap-2">
            <Phone size={15} className="text-emerald-600 shrink-0" />
            <div className="min-w-0">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Mobile Phone</span>
              <span className="font-bold text-slate-900 truncate block">
                {selectedVendor.contactPersonPhone || selectedVendor.phone || "N/A"}
              </span>
            </div>
          </div>

          <div className="p-2 sm:p-2.5 bg-slate-50/80 rounded-lg border border-slate-200/80 flex items-center gap-2">
            <MapPin size={15} className="text-rose-600 shrink-0" />
            <div className="min-w-0">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Location</span>
              <span className="font-bold text-slate-900 truncate block">
                {selectedVendor.city
                  ? `${selectedVendor.city}, ${selectedVendor.state}`
                  : selectedVendor.country || "India"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {isRejected ? (
        <div className="bg-rose-50 rounded-lg border border-rose-200 p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-start gap-2">
            <XCircle size={16} className="text-rose-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-rose-900">Vendor Rejected</span>
              <p className="text-[11px] text-rose-700 mt-0.5">
                {selectedVendor.rejectionReason || "Application rejected by Admin."}
              </p>
            </div>
          </div>
          {isMouAssigned && (
            <button
              type="button"
              onClick={onShowViewMouPage}
              className="px-2.5 py-1.5 rounded-md border border-rose-300 bg-white hover:bg-rose-100 text-rose-800 font-bold text-xs cursor-pointer shrink-0 self-start sm:self-center"
            >
              View MOU Record
            </button>
          )}
        </div>
      ) : isRegPending ? (
        <div className="bg-amber-50/70 rounded-lg border border-amber-200 p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
          <div>
            <span className="font-bold text-slate-900">Registration Review</span>
            <p className="text-[11px] text-slate-600 mt-0.5">
              Approve registration so the vendor can log in and upload compliance documents.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap shrink-0">
            <button
              type="button"
              onClick={() => onApproveRegistration(vId)}
              className="px-3 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              <CheckCircle2 size={13} />
              <span>Approve</span>
            </button>
            <button
              type="button"
              onClick={() => onHoldRegistration(vId)}
              className="px-3 py-1.5 rounded-md bg-white border border-amber-300 text-amber-800 hover:bg-amber-100 font-bold text-xs cursor-pointer flex items-center gap-1.5"
            >
              <Clock size={13} />
              <span>Hold</span>
            </button>
            <button
              type="button"
              onClick={onOpenRejectModal}
              className="px-3 py-1.5 rounded-md bg-white border border-rose-200 text-rose-700 hover:bg-rose-50 font-bold text-xs cursor-pointer flex items-center gap-1.5"
            >
              <XCircle size={13} />
              <span>Reject</span>
            </button>
          </div>
        </div>
      ) : canAssignMou ? (
        <div className="bg-blue-50/70 rounded-lg border border-blue-200 p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
          <div>
            <span className="font-bold text-slate-900">Documents Pending Verification</span>
            <p className="text-[11px] text-slate-600 mt-0.5">
              Review statutory documents below, then verify to issue the official MOU.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap shrink-0">
            <button
              type="button"
              onClick={() => onApproveDocsAndSendMou(vId)}
              className="px-3 py-1.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              <Send size={13} />
              <span>Verify Docs &amp; Assign MOU</span>
            </button>
            <button
              type="button"
              onClick={() => onRequestDocCorrection(vId)}
              className="px-3 py-1.5 rounded-md bg-white border border-orange-200 text-orange-700 hover:bg-orange-50 font-bold text-xs cursor-pointer flex items-center gap-1.5"
            >
              <Clock size={13} />
              <span>Correction</span>
            </button>
            <button
              type="button"
              onClick={onOpenRejectModal}
              className="px-3 py-1.5 rounded-md bg-white border border-rose-200 text-rose-700 hover:bg-rose-50 font-bold text-xs cursor-pointer flex items-center gap-1.5"
            >
              <XCircle size={13} />
              <span>Reject</span>
            </button>
          </div>
        </div>
      ) : !hasUploadedDocs && !isMouAssigned && !isBlockedStatus ? (
        <div className="bg-slate-50 rounded-lg border border-slate-200 p-3 flex items-center gap-2 text-xs text-slate-600">
          <Clock size={15} className="text-slate-400 shrink-0" />
          <span>Waiting for vendor to upload statutory compliance documents.</span>
        </div>
      ) : isMouPendingSign ? (
        <div className="bg-white rounded-lg border border-slate-200/90 p-3 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-slate-900">MOU Agreement</span>
              {isCorrectionRequired ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-100 text-orange-800">
                  Re-upload Requested
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800">
                  Awaiting Vendor Sign / Upload
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {isCorrectionRequired
                ? selectedVendor.adminRemarks || "Waiting for vendor to re-upload the signed MOU copy."
                : "Vendor can either digitally sign online or upload a signed copy."}
            </p>
          </div>
          <button
            type="button"
            onClick={onShowViewMouPage}
            className="px-3 py-1.5 rounded-md border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs cursor-pointer flex items-center gap-1.5 shrink-0 self-start sm:self-center"
          >
            <FileText size={13} />
            <span>Preview MOU</span>
          </button>
        </div>
      ) : isMouUnderReview ? (
        <div className="bg-amber-50/60 rounded-lg border border-amber-200 p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-slate-900">MOU Approval</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  isUploadSubmission
                    ? "bg-blue-100 text-blue-800"
                    : "bg-indigo-100 text-indigo-800"
                }`}
              >
                {isUploadSubmission ? "Uploaded Signed Copy" : "Digitally Signed"}
              </span>
            </div>
            <p className="text-[11px] text-slate-600 mt-0.5">
              Signatory: <strong>{selectedVendor.signedMou?.signatoryName || selectedVendor.contactPersonName || "N/A"}</strong>
              {selectedVendor.signedMou?.signedAt
                ? ` • Submitted on ${new Date(selectedVendor.signedMou.signedAt).toLocaleDateString("en-IN")}`
                : ""}
            </p>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap shrink-0">
            {isUploadSubmission && uploadedMouUrl && (
              <button
                type="button"
                onClick={() =>
                  onPreviewDoc({
                    name: `Signed MOU Copy - ${selectedVendor.companyName}`,
                    fileName: selectedVendor.signedMou?.signatureData || "Signed_MOU.pdf",
                    fileUrl: uploadedMouUrl,
                    type: "Signed MOU",
                    status: "Pending Approval",
                  })
                }
                className="px-2.5 py-1.5 rounded-md border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs cursor-pointer flex items-center gap-1"
              >
                <Eye size={13} />
                <span>View File</span>
              </button>
            )}
            <button
              type="button"
              onClick={onShowViewMouPage}
              className="px-2.5 py-1.5 rounded-md border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs cursor-pointer flex items-center gap-1"
            >
              <FileText size={13} />
              <span>Review MOU</span>
            </button>
            <button
              type="button"
              onClick={() => onApproveMouAndActivate(vId)}
              className="px-3 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs cursor-pointer flex items-center gap-1"
            >
              <CheckCircle2 size={13} />
              <span>Approve</span>
            </button>
            {isUploadSubmission && (
              <>
                <button
                  type="button"
                  onClick={() => onRequestMouCorrection(vId)}
                  className="px-3 py-1.5 rounded-md border border-amber-300 bg-white hover:bg-amber-100 text-amber-800 font-bold text-xs cursor-pointer flex items-center gap-1"
                >
                  <RefreshCw size={13} />
                  <span>Re-upload</span>
                </button>
                <button
                  type="button"
                  onClick={onOpenRejectModal}
                  className="px-3 py-1.5 rounded-md border border-rose-200 bg-white hover:bg-rose-50 text-rose-700 font-bold text-xs cursor-pointer flex items-center gap-1"
                >
                  <XCircle size={13} />
                  <span>Reject</span>
                </button>
              </>
            )}
          </div>
        </div>
      ) : isMouApproved ? (
        <div className="bg-emerald-50/60 rounded-lg border border-emerald-200 p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-slate-900">MOU Partnership</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                Verified &amp; Approved
              </span>
              <span className="text-[11px] text-slate-500 font-medium">
                ({isUploadSubmission ? "Uploaded Copy" : "Digitally Signed"})
              </span>
            </div>
            <p className="text-[11px] text-slate-600 mt-0.5">
              Signatory: <strong>{selectedVendor.signedMou?.signatoryName || selectedVendor.contactPersonName || "N/A"}</strong>
              {selectedVendor.signedMou?.signedAt
                ? ` • Approved ${new Date(selectedVendor.signedMou.signedAt).toLocaleDateString("en-IN")}`
                : ""}
            </p>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap shrink-0">
            {uploadedMouUrl && (
              <button
                type="button"
                onClick={() =>
                  onPreviewDoc({
                    name: `Signed MOU Copy - ${selectedVendor.companyName}`,
                    fileName: selectedVendor.signedMou?.signatureData || "Signed_MOU.pdf",
                    fileUrl: uploadedMouUrl,
                    type: "Signed MOU",
                    status: "Verified",
                  })
                }
                className="px-2.5 py-1.5 rounded-md border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs cursor-pointer flex items-center gap-1"
              >
                <Eye size={13} />
                <span>Signed Copy</span>
              </button>
            )}
            <button
              type="button"
              onClick={onShowViewMouPage}
              className="px-3 py-1.5 rounded-md bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs cursor-pointer flex items-center gap-1"
            >
              <FileText size={13} />
              <span>View MOU</span>
            </button>
          </div>
        </div>
      ) : null}

      <div className="bg-white rounded-lg border border-slate-200/90 shadow-2xs overflow-hidden space-y-3.5 p-3.5 sm:p-4">
        <div className="border-b border-slate-100 pb-2.5">
          <h2 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-1.5">
            <FileCheck className="w-4 h-4 text-blue-600" />
            <span>Vendor Compliance & Statutory Documents</span>
          </h2>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Statutory registration, tax licenses, and banking verification documents submitted by this agency.
          </p>
        </div>

        {!selectedVendor.documents || selectedVendor.documents.length === 0 ? (
          <div className="p-6 text-center bg-slate-50 rounded-lg border border-slate-200">
            <FileText className="w-6 h-6 text-slate-300 mx-auto mb-1.5" />
            <p className="text-xs font-bold text-slate-700">No documents uploaded yet by this vendor.</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Documents will appear here once the vendor uploads their incorporation, PAN, or GST certificates.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {selectedVendor.documents.map((doc, idx) => {
              const isDocVerified = Boolean(
                doc.status === "Verified" ||
                  (selectedVendor.documentVerified && (!doc.status || doc.status === "Pending" || doc.status === "Submitted"))
              );
              const isDocRejected =
                doc.status === "Rejected" || doc.status === "Correction Required";
              const docLabel = isDocVerified
                ? "Verified"
                : isDocRejected
                ? doc.status
                : doc.status && doc.status !== "Pending"
                ? doc.status
                : "Pending Verification";

              return (
                <div
                  key={idx}
                  className="p-2.5 sm:p-3 rounded-lg border border-slate-200 bg-slate-50/50 flex flex-col gap-2.5"
                >
                  <div className="flex items-start gap-2.5 min-w-0">
                    <div className="p-1.5 bg-blue-100 text-blue-700 rounded-md shrink-0">
                      <FileText size={15} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs font-bold text-slate-900 truncate">{doc.name || doc.type || "Document"}</h4>
                      <p className="text-[10px] text-slate-500 font-mono truncate">{doc.fileName || "document"}</p>
                      <span
                        className={`inline-block mt-1 text-[9px] font-bold px-1.5 py-0.5 rounded ${
                          isDocVerified
                            ? "bg-emerald-100 text-emerald-800"
                            : isDocRejected
                            ? "bg-rose-100 text-rose-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {docLabel}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-end gap-1 pt-2 border-t border-slate-200/70">
                    <button
                      type="button"
                      onClick={() => onPreviewDoc(doc)}
                      className="px-2 py-1 rounded-md border border-slate-300 hover:bg-slate-100 text-slate-700 text-[11px] font-bold transition flex items-center gap-1 cursor-pointer"
                    >
                      <Eye size={12} />
                      <span>Preview</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => printUploadedDocument(doc)}
                      disabled={!doc.fileUrl}
                      className="px-2 py-1 rounded-md border border-slate-300 hover:bg-slate-100 disabled:opacity-40 text-slate-700 text-[11px] font-bold transition flex items-center gap-1 cursor-pointer"
                      title="Print Document"
                    >
                      <Printer size={12} />
                      <span>Print</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onDownloadDoc(doc)}
                      disabled={!doc.fileUrl}
                      className="px-2 py-1 rounded-md bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 disabled:opacity-40 text-[11px] font-bold transition flex items-center gap-1 cursor-pointer"
                    >
                      <Download size={12} />
                      <span>Download</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {selectedVendor.bankDetails &&
          (selectedVendor.bankDetails.accountNumber || selectedVendor.bankDetails.bankName) && (
            <div className="pt-3 border-t border-slate-100">
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-2">
                Bank Settlement Account
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-xs">
                <div className="p-2 sm:p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Account Name</span>
                  <span className="font-bold text-slate-900 truncate block">{selectedVendor.bankDetails.accountName || "N/A"}</span>
                </div>
                <div className="p-2 sm:p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Bank Name</span>
                  <span className="font-bold text-slate-900 truncate block">{selectedVendor.bankDetails.bankName || "N/A"}</span>
                </div>
                <div className="p-2 sm:p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Account Number</span>
                  <span className="font-bold text-slate-900 font-mono truncate block">
                    {selectedVendor.bankDetails.accountNumber || "N/A"}
                  </span>
                </div>
                <div className="p-2 sm:p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">IFSC Code</span>
                  <span className="font-bold text-slate-900 font-mono truncate block">
                    {selectedVendor.bankDetails.ifsc || "N/A"}
                  </span>
                </div>
              </div>
            </div>
          )}
      </div>
    </div>
  );
}
