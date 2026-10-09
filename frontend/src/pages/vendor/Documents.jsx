import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  FileText,
  Download,
  Upload,
  Search,
  CheckCircle2,
  FileCheck,
  ShieldCheck,
  Building2,
  ExternalLink,
  Plus,
  Eye,
  Clock,
  Printer,
  Sparkles,
  Calendar,
  PenTool,
} from "lucide-react";
import crmVendorService from "../../services/crmVendorService";
import DocumentViewerFullPage from "../../components/vendor/DocumentViewerFullPage.jsx";
import MouFullPageView from "../../components/vendor/MouFullPageView.jsx";

export default function Documents() {
  const [vendor, setVendor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("mou"); // "mou" or "company"
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [newDocName, setNewDocName] = useState("");
  const [newDocType, setNewDocType] = useState("Statutory License");
  const [companyDocs, setCompanyDocs] = useState([]);
  const [previewingDoc, setPreviewingDoc] = useState(null);
  const [viewingMou, setViewingMou] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const curVendor = crmVendorService.getCurrentVendor();
      setVendor(curVendor);
      setCompanyDocs(curVendor?.documents || []);
    } catch (err) {
      console.error("Failed to load documents:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadCompanyDoc = async (e) => {
    e.preventDefault();
    if (!newDocName) return;

    const doc = {
      name: newDocName,
      fileName: `${newDocName.toLowerCase().replace(/\s+/g, "_")}.pdf`,
      size: "1.2 MB",
      type: newDocType,
      uploadedAt: new Date().toISOString().split("T")[0],
      status: "Submitted",
    };

    const updated = [doc, ...companyDocs];
    setCompanyDocs(updated);
    try {
      await crmVendorService.updateVendorProfile(vendor?.id, { documents: updated });
    } catch (err) {
      console.error("Doc update err:", err);
    }
    setShowUploadModal(false);
    setNewDocName("");
  };

  const handleDownloadDoc = (doc) => {
    if (doc?.fileUrl && doc.fileUrl.startsWith("data:")) {
      const a = document.createElement("a");
      a.href = doc.fileUrl;
      a.download = doc.fileName || `${doc.name || "document"}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      return;
    }
    const content = `OFFICIAL STATUTORY DOCUMENT\n==========================\nDocument: ${doc?.name || doc?.type}\nFile Name: ${doc?.fileName || "document.pdf"}\nAgency: ${vendor?.companyName || "Vendor"}\nUploaded: ${doc?.uploadedAt || new Date().toISOString().split("T")[0]}\nStatus: ${doc?.status || "Uploaded"}`;
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = doc?.fileName || `${doc?.name || "document"}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadMou = () => {
    const mou = vendor?.mouDocument || {};
    const text = `MEMORANDUM OF UNDERSTANDING (MOU)\nBETWEEN: VISTA OVERSEAS RECRUITMENT SOLUTIONS & ${vendor?.companyName || "VENDOR"}\nAgreement Ref: ${mou.refNumber || `MOU-${vendor?.id || "VND"}`}\nStatus: ${vendor?.status || "Signed"}\nSigned Date: ${mou.signedAt || mou.signatureDate || new Date().toLocaleDateString()}\nSignatory: ${mou.signatoryName || vendor?.contactPersonName || "Authorized Representative"}\nDesignation: ${mou.signatoryDesignation || "Director / Authorized Signatory"}\nCommission: ${mou.commissionRate || "Standard Agreement"}\nValidity: ${mou.validityYears || "1 Year"}\nTerms: All candidate placements shall strictly adhere to MEA and GCC bilateral labor agreements.`;
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Executed_MOU_${vendor?.companyName?.replace(/\s+/g, "_") || "Vendor"}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (viewingMou) {
    return (
      <div className="space-y-6">
        <MouFullPageView
          mode="preview"
          vendor={vendor}
          onBack={() => setViewingMou(false)}
        />
      </div>
    );
  }

  if (previewingDoc) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        <DocumentViewerFullPage
          doc={previewingDoc}
          vendor={vendor}
          onBack={() => setPreviewingDoc(null)}
        />
      </div>
    );
  }

  const isMouSigned = vendor?.mouSigned || vendor?.status === "Pending MOU Approval" || vendor?.status === "Approved" || vendor?.mouStatus === "Signed" || vendor?.mouStatus === "Approved";
  const mouData = vendor?.mouDocument || {};

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1">
            <FileText className="w-4 h-4" />
            <span>Legal & Statutory Repository</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Documents & Executed MOU
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Access your executed agency partnership MOU, compliance records, and statutory licenses.
          </p>
        </div>

        <button
          onClick={() => setShowUploadModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition self-start sm:self-auto cursor-pointer"
        >
          <Upload className="w-4 h-4" />
          <span>Upload Statutory Document</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab("mou")}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer flex items-center gap-2 ${
            activeTab === "mou"
              ? "bg-slate-900 text-white shadow-xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <FileCheck className="w-4 h-4" />
          <span>Executed MOU Agreement</span>
          {isMouSigned && (
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
          )}
        </button>

        <button
          onClick={() => setActiveTab("company")}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer flex items-center gap-2 ${
            activeTab === "company"
              ? "bg-slate-900 text-white shadow-xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Statutory Licenses & Compliance ({companyDocs.length})</span>
        </button>
      </div>

      {activeTab === "mou" ? (
        /* Executed MOU Agreement View */
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
            {/* Top Banner */}
            <div className="p-6 bg-gradient-to-r from-blue-950 via-blue-900 to-indigo-950 text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 flex-wrap mb-1.5">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-200 border border-blue-400/30">
                    Ref: {mouData.refNumber || `MOU-${vendor?.id || "VND"}`}
                  </span>
                  {vendor?.status === "Approved" ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                      <CheckCircle2 size={11} className="text-emerald-400" />
                      Approved & Counter-Signed
                    </span>
                  ) : isMouSigned ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-400/30">
                      <Clock size={11} className="text-amber-400" />
                      Signed &bull; Pending Admin Approval (Full Access Unlocked)
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-400/30">
                      Pending Signature
                    </span>
                  )}
                </div>
                <h3 className="text-lg sm:text-xl font-black tracking-tight">
                  Manpower Supply Partnership Memorandum of Understanding
                </h3>
                <p className="text-xs text-blue-200 mt-1 max-w-2xl leading-relaxed">
                  Legally binding overseas recruitment agreement executed between Vista Overseas Operations and {vendor?.companyName || "Vendor Agency Partner"}.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setViewingMou(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
                >
                  <Eye size={14} />
                  <span>Preview Executed MOU</span>
                </button>
                <button
                  type="button"
                  onClick={handleDownloadMou}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition-colors cursor-pointer border border-white/20"
                >
                  <Download size={14} />
                  <span>Download MOU</span>
                </button>
              </div>
            </div>

            {/* Agreement Metadata Summary */}
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 bg-slate-50/60 border-b border-slate-200/80">
              <div className="p-3.5 rounded-xl bg-white border border-slate-200/80">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Authorized Signatory</span>
                <span className="text-xs font-bold text-slate-900 mt-1 block">
                  {mouData.signatoryName || vendor?.contactPersonName || "Vendor Director"}
                </span>
                <span className="text-[11px] text-slate-500 mt-0.5 block truncate">
                  {mouData.signatoryDesignation || "Managing Director / Partner"}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-white border border-slate-200/80">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Execution Date</span>
                <span className="text-xs font-bold text-slate-900 mt-1 block">
                  {mouData.signedAt ? new Date(mouData.signedAt).toLocaleDateString() : (mouData.signatureDate || new Date().toLocaleDateString())}
                </span>
                <span className="text-[11px] text-slate-500 mt-0.5 block">
                  Validity: {mouData.validityYears || "1 Year (Renewable)"}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-white border border-slate-200/80">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Commission Structure</span>
                <span className="text-xs font-bold text-slate-900 mt-1 block">
                  {mouData.commissionRate || "Standard Agency Rate"}
                </span>
                <span className="text-[11px] text-slate-500 mt-0.5 block">
                  Terms: {mouData.paymentTerms || "30 Days post deployment"}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-white border border-slate-200/80">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Digital Signature</span>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-xs font-bold text-emerald-700 font-mono">
                    VERIFIED & TIMESTAMPED
                  </span>
                </div>
                <span className="text-[10px] font-mono text-slate-400 block mt-0.5 truncate">
                  SHA256: {vendor?.id || "VND"}-MOU-EXEC
                </span>
              </div>
            </div>

            {/* Quick Agreement Highlights */}
            <div className="p-6 space-y-4">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Operative Clauses & Mandate Summary
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-1">
                  <span className="font-bold text-slate-800 flex items-center gap-1.5">
                    <CheckCircle2 size={13} className="text-blue-600" />
                    Manpower Supply Mandate
                  </span>
                  <p className="text-slate-600 text-[11px] leading-relaxed">
                    Sourcing, trade verification, and pre-screening of candidates for Middle East & global deployment in civil, MEP, and industrial trades.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-1">
                  <span className="font-bold text-slate-800 flex items-center gap-1.5">
                    <CheckCircle2 size={13} className="text-blue-600" />
                    Zero Fee & Ethical Recruitment
                  </span>
                  <p className="text-slate-600 text-[11px] leading-relaxed">
                    Strict adherence to the Employer-Pays principle and Indian Ministry of External Affairs regulations. No illegal levies on worker candidates.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Statutory Licenses View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {companyDocs.map((doc, idx) => (
            <div
              key={idx}
              className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 flex flex-col justify-between hover:shadow-sm transition"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <FileCheck className="w-5 h-5" />
                  </div>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <ShieldCheck className="w-3 h-3 text-emerald-500" />
                    Verified
                  </span>
                </div>

                <h4 className="font-bold text-slate-900 text-sm">{doc.name}</h4>
                <p className="text-xs text-slate-500 font-mono mt-0.5">{doc.fileName}</p>
                <div className="mt-3 flex items-center gap-2 text-xs text-slate-400">
                  <span>{doc.type || "Statutory Document"}</span>
                  <span>•</span>
                  <span>{doc.size || "1.5 MB"}</span>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">Status: {doc.status || "Verified"}</span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setPreviewingDoc(doc)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Preview</span>
                  </button>
                  <button
                    onClick={() => handleDownloadDoc(doc)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 text-xs font-semibold transition cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Upload Statutory Document</h3>
            <p className="text-xs text-slate-500 mb-4">
              Add government agency licenses, incorporation certificates or GST/tax documents.
            </p>

            <form onSubmit={handleUploadCompanyDoc} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Document Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. MEA Recruiting License"
                  value={newDocName}
                  onChange={(e) => setNewDocName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Document Type
                </label>
                <select
                  value={newDocType}
                  onChange={(e) => setNewDocType(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="Statutory License">Statutory License / MEA Certificate</option>
                  <option value="Incorporation">Incorporation Certificate</option>
                  <option value="Tax Registration">Tax Registration / PAN / GST</option>
                  <option value="Bank Attestation">Bank Solvency / Attestation</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
                >
                  Save & Upload
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
