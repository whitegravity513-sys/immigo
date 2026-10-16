import React from "react";
import {
  ArrowLeft,
  FileCheck,
  FileText,
  Paperclip,
  Eye,
  Download,
  Check,
  Clock,
  Edit,
  Trash2,
} from "lucide-react";
import VendorStatusBadge from "../list/VendorStatusBadge.jsx";

export default function VendorDocumentsVaultView({
  selectedVendor,
  onBack,
  onBackToAll,
  onEditVendor,
  onDeleteVendor,
  onPreviewDoc,
  onDownloadDoc,
  onApproveDocsAndSendMou,
}) {
  const vendorDocs = selectedVendor.documents || [];
  const isVerified = Boolean(
    selectedVendor.documentVerified ||
    selectedVendor.status === "Approved" ||
    selectedVendor.status === "Verified" ||
    selectedVendor.mouSigned ||
    selectedVendor.mouStatus === "Approved"
  );

  return (
    <div className="space-y-3.5 w-full max-w-full overflow-hidden font-sans antialiased text-slate-800">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-white p-2.5 sm:p-3 rounded-lg border border-slate-200/90 shadow-2xs">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition shadow-xs cursor-pointer"
          >
            <ArrowLeft size={16} />
            <span>Back to Vendor Profile</span>
          </button>

          <button
            onClick={onBackToAll}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition cursor-pointer"
          >
            <ArrowLeft size={16} className="text-blue-600" />
            <span>Back to All Vendors</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-lg">
            Statutory Vault • {selectedVendor.id}
          </span>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-slate-200/90 p-3.5 sm:p-4 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center font-black text-sm shadow-xs shrink-0">
              <FileCheck size={26} />
            </div>
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                  {selectedVendor.companyName}
                </h1>
                <VendorStatusBadge status={selectedVendor.status} />
              </div>
              <p className="text-xs text-slate-500 mt-1 font-medium">
                Official statutory credentials, registration certificates, tax compliance, and recruitment licenses.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => onEditVendor(selectedVendor)}
              className="w-8 h-8 rounded-xl bg-slate-50 hover:bg-blue-50 text-slate-600 hover:text-blue-600 border border-slate-200 hover:border-blue-200 transition-all flex items-center justify-center cursor-pointer shadow-2xs"
              title="Edit Vendor"
            >
              <Edit size={14} />
            </button>

            <button
              type="button"
              onClick={() => onDeleteVendor(selectedVendor)}
              className="w-8 h-8 rounded-xl bg-slate-50 hover:bg-rose-50 text-slate-600 hover:text-rose-600 border border-slate-200 hover:border-rose-200 transition-all flex items-center justify-center cursor-pointer shadow-2xs"
              title="Delete Vendor"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-semibold">
          <div className="p-2 sm:p-2.5 bg-slate-50 rounded-lg border border-slate-200/80">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Commercial Reg No</span>
            <span className="text-slate-900 font-bold">{selectedVendor.registrationNumber || "CR-887412"}</span>
          </div>
          <div className="p-2 sm:p-2.5 bg-slate-50 rounded-lg border border-slate-200/80">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Business Specialization</span>
            <span className="text-slate-900 font-bold">{selectedVendor.specialization || "Technical Trades & Manpower"}</span>
          </div>
          <div className="p-2 sm:p-2.5 bg-slate-50 rounded-lg border border-slate-200/80">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Contact Email</span>
            <span className="text-slate-900 font-bold truncate block">
              {selectedVendor.contactPersonEmail || selectedVendor.email}
            </span>
          </div>
          <div className="p-2 sm:p-2.5 bg-slate-50 rounded-lg border border-slate-200/80">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Registered Location</span>
            <span className="text-slate-900 font-bold">
              {selectedVendor.city ? `${selectedVendor.city}, ${selectedVendor.state}` : "India"}
            </span>
          </div>
        </div>
      </div>

      {isVerified && vendorDocs.length > 0 ? (
        <div className="bg-white rounded-lg border border-slate-200/90 shadow-2xs p-3.5 sm:p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Paperclip size={18} className="text-blue-600" />
              <span>Verified Agency Credentials ({vendorDocs.length})</span>
            </h2>
            <span className="text-xs text-slate-400 font-medium">Secure SSL Encrypted Document Repository</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {vendorDocs.map((doc, idx) => (
              <div
                key={idx}
                className="p-3 rounded-lg border border-slate-200 bg-slate-50/70 hover:bg-white transition shadow-2xs space-y-2.5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold shrink-0">
                      <FileText size={20} />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-slate-900 text-sm">{doc.name}</h3>
                      <span className="text-[11px] text-slate-500 font-mono block mt-0.5">
                        {doc.fileName} • {doc.size || "1.2 MB"}
                      </span>
                    </div>
                  </div>

                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 shrink-0">
                    Verified
                  </span>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-200/80 text-xs">
                  <span className="text-slate-500 font-medium text-[11px]">
                    Category: <strong className="text-slate-800">{doc.type || "Statutory"}</strong>
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onPreviewDoc(doc)}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs cursor-pointer transition flex items-center gap-1"
                    >
                      <Eye size={13} />
                      <span>Preview</span>
                    </button>

                    <button
                      onClick={() => onDownloadDoc(doc)}
                      className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs cursor-pointer transition flex items-center gap-1 shadow-2xs"
                    >
                      <Download size={13} />
                      <span>Download</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : vendorDocs.length > 0 && !isVerified ? (
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 flex-wrap gap-2">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Paperclip size={18} className="text-amber-600" />
              <span>Agency Credentials (Pending Verification) ({vendorDocs.length})</span>
            </h2>
            <div className="flex items-center gap-2">
              <span className="text-xs text-amber-700 font-bold bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                Pending Admin Verification
              </span>
              <button
                type="button"
                onClick={() => onApproveDocsAndSendMou(selectedVendor.id)}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-2xs flex items-center gap-1 cursor-pointer"
              >
                <Check size={13} />
                <span>Approve & Verify Credentials</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {vendorDocs.map((doc, idx) => (
              <div
                key={idx}
                className="p-3 rounded-lg border border-slate-200 bg-slate-50/70 hover:bg-white transition shadow-2xs space-y-2.5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold shrink-0">
                      <FileText size={20} />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-slate-900 text-sm">{doc.name}</h3>
                      <span className="text-[11px] text-slate-500 font-mono block mt-0.5">
                        {doc.fileName} • {doc.size || "1.2 MB"}
                      </span>
                    </div>
                  </div>

                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 shrink-0">
                    Pending Review
                  </span>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-200/80 text-xs">
                  <span className="text-slate-500 font-medium text-[11px]">
                    Category: <strong className="text-slate-800">{doc.type || "Statutory"}</strong>
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onPreviewDoc(doc)}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs cursor-pointer transition flex items-center gap-1"
                    >
                      <Eye size={13} />
                      <span>Preview</span>
                    </button>

                    <button
                      onClick={() => onDownloadDoc(doc)}
                      className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs cursor-pointer transition flex items-center gap-1 shadow-2xs"
                    >
                      <Download size={13} />
                      <span>Download</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-8 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mx-auto">
            <Clock size={24} />
          </div>
          <h3 className="text-base font-bold text-slate-800">
            Agency Credentials Under Verification
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Statutory agency credentials and compliance documents will appear in "Verified Agency Credentials" once submitted and approved by Admin.
          </p>
        </div>
      )}
    </div>
  );
}
