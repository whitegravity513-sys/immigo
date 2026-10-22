import React from "react";
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
} from "lucide-react";
import VendorStatusBadge from "../list/VendorStatusBadge.jsx";

export default function VendorDetailView({
  selectedVendor,
  onBack,
  onEditVendor,
  onDeleteVendor,
  onShowDocsPage,
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
  return (
    <div className="space-y-3.5 w-full max-w-full overflow-hidden font-sans antialiased text-slate-800">
      <div className="flex items-center justify-between bg-white p-2.5 sm:p-3 rounded-lg border border-slate-200/90 shadow-2xs">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition shadow-xs cursor-pointer"
        >
          <ArrowLeft size={14} />
          <span>Back to All Vendors</span>
        </button>

        <span className="text-[11px] font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
          Vendor Dossier • {selectedVendor.id}
        </span>
      </div>

      <div className="bg-white rounded-lg border border-slate-200/90 p-3.5 sm:p-4 shadow-2xs space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-start sm:items-center gap-3">
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
                  {selectedVendor.id}
                </span>
                <VendorStatusBadge status={selectedVendor.status} />
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-2 flex-wrap font-medium">
                <span>Reg No: {selectedVendor.registrationNumber || "N/A"}</span>
                <span>•</span>
                <span>
                  Est Date:{" "}
                  {selectedVendor.registeredAt
                    ? new Date(selectedVendor.registeredAt).toLocaleDateString("en-IN")
                    : "12 Sep 2026"}
                </span>
                <span>•</span>
                <span>Type: {selectedVendor.businessType || "Manpower Agency"}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap self-start lg:self-center">
            <button
              onClick={() => onEditVendor(selectedVendor)}
              className="px-2.5 py-1.5 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs shadow-2xs transition flex items-center gap-1.5 cursor-pointer"
            >
              <Edit size={13} className="text-slate-500" />
              <span>Edit Vendor</span>
            </button>

            <button
              onClick={() => onDeleteVendor(selectedVendor)}
              className="px-2.5 py-1.5 rounded-md border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs shadow-2xs transition flex items-center gap-1.5 cursor-pointer"
            >
              <Trash2 size={13} />
              <span>Delete</span>
            </button>

            <button
              onClick={onShowDocsPage}
              className="px-2.5 py-1.5 rounded-md border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs transition flex items-center gap-1.5 cursor-pointer"
            >
              <FileText size={13} className="text-blue-600" />
              <span>View Statutory Documents</span>
            </button>

            {(selectedVendor.status === "Active" ||
              selectedVendor.status === "Approved" ||
              selectedVendor.status === "Suspended") && (
              <button
                type="button"
                onClick={() => onToggleSuspend(selectedVendor.id)}
                className={`px-2.5 py-1.5 rounded-md border text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  selectedVendor.status === "Suspended"
                    ? "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100"
                    : "bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100"
                }`}
                title={selectedVendor.status === "Suspended" ? "Activate Verified Vendor" : "Suspend Verified Vendor"}
              >
                <Ban size={13} />
                <span>{selectedVendor.status === "Suspended" ? "Activate Vendor" : "Suspend Vendor"}</span>
              </button>
            )}

            {(selectedVendor.status === "Registration Pending" ||
              selectedVendor.status === "Pending" ||
              selectedVendor.status === "Registration On Hold") && (
              <>
                <button
                  type="button"
                  onClick={() => onApproveRegistration(selectedVendor.id)}
                  className="px-2.5 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs cursor-pointer flex items-center gap-1.5"
                  title="Approve Registration and send portal credentials email"
                >
                  <CheckCircle2 size={13} />
                  <span>Approve Registration</span>
                </button>
                <button
                  type="button"
                  onClick={() => onHoldRegistration(selectedVendor.id)}
                  className="px-2.5 py-1.5 rounded-md bg-amber-50 border border-amber-200 text-amber-800 hover:bg-amber-100 font-bold text-xs cursor-pointer flex items-center gap-1.5"
                  title="Put registration on hold with remark"
                >
                  <Clock size={13} />
                  <span>Hold</span>
                </button>
                <button
                  type="button"
                  onClick={onOpenRejectModal}
                  className="px-2.5 py-1.5 rounded-md bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 font-bold text-xs cursor-pointer flex items-center gap-1.5"
                  title="Reject Vendor Registration"
                >
                  <XCircle size={13} />
                  <span>Reject</span>
                </button>
              </>
            )}

            {(selectedVendor.status === "Documents Pending" ||
              selectedVendor.status === "Documents Under Review" ||
              selectedVendor.status === "Under Review" ||
              selectedVendor.status === "Documents Correction Required") && (
              <>
                <button
                  type="button"
                  onClick={() => onApproveDocsAndSendMou(selectedVendor.id)}
                  className="px-2.5 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs cursor-pointer flex items-center gap-1.5"
                  title="Approve uploaded documents and auto-populate MOU agreement"
                >
                  <Send size={13} />
                  <span>Approve Docs & Generate MOU</span>
                </button>
                <button
                  type="button"
                  onClick={() => onRequestDocCorrection(selectedVendor.id)}
                  className="px-2.5 py-1.5 rounded-md bg-orange-50 border border-orange-200 text-orange-700 hover:bg-orange-100 font-bold text-xs cursor-pointer flex items-center gap-1.5"
                  title="Request corrections on documents"
                >
                  <Clock size={13} />
                  <span>Request Correction</span>
                </button>
                <button
                  type="button"
                  onClick={onOpenRejectModal}
                  className="px-2.5 py-1.5 rounded-md bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 font-bold text-xs cursor-pointer flex items-center gap-1.5"
                >
                  <XCircle size={13} />
                  <span>Reject</span>
                </button>
              </>
            )}

            {(selectedVendor.status === "MOU Pending" ||
              selectedVendor.status === "MOU Under Review" ||
              selectedVendor.status === "Pending MOU Approval" ||
              selectedVendor.status === "MOU Correction Required") && (
              <>
                <button
                  onClick={onShowViewMouPage}
                  className="px-2.5 py-1.5 rounded-md bg-purple-50 border border-purple-200 text-purple-700 hover:bg-purple-100 font-bold text-xs cursor-pointer flex items-center gap-1.5"
                >
                  <FileText size={13} />
                  <span>Review MOU Agreement</span>
                </button>
                <button
                  onClick={() => onApproveMouAndActivate(selectedVendor.id)}
                  className="px-2.5 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs cursor-pointer flex items-center gap-1.5"
                  title="Approve signed MOU and activate vendor dashboard"
                >
                  <CheckCircle2 size={13} />
                  <span>Approve MOU & Activate</span>
                </button>
                <button
                  type="button"
                  onClick={() => onRequestMouCorrection(selectedVendor.id)}
                  className="px-2.5 py-1.5 rounded-md bg-orange-50 border border-orange-200 text-orange-700 hover:bg-orange-100 font-bold text-xs cursor-pointer flex items-center gap-1.5"
                  title="Request corrections on MOU"
                >
                  <Clock size={13} />
                  <span>Request MOU Correction</span>
                </button>
                <button
                  type="button"
                  onClick={onOpenRejectModal}
                  className="px-2.5 py-1.5 rounded-md bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 font-bold text-xs cursor-pointer flex items-center gap-1.5"
                >
                  <XCircle size={13} />
                  <span>Reject</span>
                </button>
              </>
            )}
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

      <div className="bg-white rounded-lg border border-slate-200/90 shadow-2xs overflow-hidden space-y-3.5 p-3.5 sm:p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-slate-100 pb-2.5">
          <div>
            <h2 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <FileCheck className="w-4 h-4 text-blue-600" />
              <span>Vendor Compliance & Statutory Documents</span>
            </h2>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Statutory registration, tax licenses, and banking verification documents submitted by this agency.
            </p>
          </div>
          <button
            onClick={onShowViewMouPage}
            className="px-2.5 py-1.5 rounded-md bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer self-start sm:self-auto"
          >
            <FileText size={13} />
            <span>Preview Official MOU</span>
          </button>
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
            {selectedVendor.documents.map((doc, idx) => (
              <div
                key={idx}
                className="p-2.5 sm:p-3 rounded-lg border border-slate-200 bg-slate-50/50 flex items-start justify-between gap-2"
              >
                <div className="flex items-start gap-2.5 min-w-0">
                  <div className="p-1.5 bg-blue-100 text-blue-700 rounded-md shrink-0">
                    <FileText size={15} />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-slate-900 truncate">{doc.name || doc.type || "Document"}</h4>
                    <p className="text-[10px] text-slate-500 font-mono truncate">{doc.fileName || "document.pdf"}</p>
                    <span className="inline-block mt-1 text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800">
                      {doc.status || "Uploaded"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0 self-center">
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
                    onClick={() => onDownloadDoc(doc)}
                    className="px-2 py-1 rounded-md bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 text-[11px] font-bold transition flex items-center gap-1 cursor-pointer"
                  >
                    <Download size={12} />
                    <span>Download</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {selectedVendor.bankDetails &&
          (selectedVendor.bankDetails.accountNumber || selectedVendor.bankDetails.bankName) && (
            <div className="pt-3 border-t border-slate-100">
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-2">
                Bank Settlement Account
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
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

        <div className="pt-3 border-t border-slate-100">
          <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-2">
            MOU Partnership Agreement Status
          </h3>
          <div className="p-2.5 sm:p-3 rounded-lg border border-slate-200 bg-slate-50/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-bold text-slate-900">
                  MOU Ref: MOU-VND-{selectedVendor.id || "001"}-2026
                </span>
                {selectedVendor.mouSigned ||
                selectedVendor.mouStatus === "Approved" ||
                selectedVendor.mouStatus === "Signed" ? (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                    Digitally Executed
                  </span>
                ) : selectedVendor.mouStatus === "Sent" || selectedVendor.status === "MOU Pending" ? (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800">
                    Issued • Awaiting Signature
                  </span>
                ) : (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                    Pending Verification
                  </span>
                )}
              </div>
              <p className="text-slate-500 text-[11px]">
                {selectedVendor.signedMou?.signedAt
                  ? `Signed by ${selectedVendor.signedMou.signatoryName || selectedVendor.contactPersonName} (${selectedVendor.signedMou.designation || "Signatory"}) on ${new Date(selectedVendor.signedMou.signedAt).toLocaleDateString("en-IN")}`
                  : "Official recruitment partnership agreement between ImmiGo Overseas and this vendor agency."}
              </p>
            </div>

            <button
              type="button"
              onClick={onShowViewMouPage}
              className="px-2.5 py-1 rounded-md bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition cursor-pointer self-start sm:self-auto shrink-0"
            >
              View Agreement
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
