import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import {
  FileText,
  Download,
  Upload,
  CheckCircle2,
  FileCheck,
  ShieldCheck,
  Building2,
  Eye,
  Clock,
  PenTool,
  AlertCircle,
  Printer,
  XCircle,
} from "lucide-react";
import crmVendorService from "../../services/crmVendorService";
import DocumentViewerFullPage from "../../components/vendor/DocumentViewerFullPage.jsx";
import MouFullPageView from "../../components/vendor/MouFullPageView.jsx";
import { downloadUploadedDocument, printUploadedDocument } from "../../utils/printDocument.js";

const isVendorMouAssigned = (v) =>
  Boolean(
    v &&
      (v.status === "Approved" ||
        v.status === "Active" ||
        v.mouStatus === "Approved" ||
        v.onboardingStage === "COMPLETED" ||
        v.onboardingStage === "ACTIVE" ||
        v.mouSigned ||
        v.mouStatus === "Signed" ||
        v.mouStatus === "Under Review" ||
        v.status === "Pending MOU Approval" ||
        v.status === "MOU Under Review" ||
        v.onboardingStage === "MOU_UNDER_REVIEW" ||
        v.onboardingStage === "MOU_SIGNED" ||
        Boolean(v.signedMou?.signedAt) ||
        v.mouStatus === "Sent" ||
        v.mouStatus === "Correction Required" ||
        v.mouStatus === "Rejected" ||
        v.status === "MOU Pending" ||
        v.status === "MOU Correction Required" ||
        v.status === "MOU Rejected" ||
        v.onboardingStage === "MOU_SENT")
  );

export default function Documents() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [vendor, setVendor] = useState(null);
  const [activeTab, setActiveTab] = useState("company");
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [newDocName, setNewDocName] = useState("");
  const [newDocType, setNewDocType] = useState("Statutory License");
  const [newDocFile, setNewDocFile] = useState(null);
  const [uploadError, setUploadError] = useState("");
  const [companyDocs, setCompanyDocs] = useState([]);
  const [previewingDoc, setPreviewingDoc] = useState(null);
  const [viewingMou, setViewingMou] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const curVendor = (await crmVendorService.getVendorMe()) || crmVendorService.getCurrentVendor();
      setVendor(curVendor);
      setCompanyDocs(curVendor?.documents || []);
      const tabParam = searchParams.get("tab");
      if (isVendorMouAssigned(curVendor)) {
        if (tabParam !== "company") {
          setActiveTab("mou");
        }
      } else {
        setActiveTab("company");
        setViewingMou(false);
      }
    } catch (err) {
      console.error("Failed to load documents:", err);
    }
  }, [searchParams]);

  useEffect(() => {
    const tabParam = searchParams.get("tab");
    const mouAllowed = isVendorMouAssigned(vendor);
    const shouldOpenMou = searchParams.get("openMou") === "1";
    const timer = setTimeout(() => {
      if (tabParam === "company") {
        setActiveTab("company");
      } else if (tabParam === "mou" && mouAllowed) {
        setActiveTab("mou");
      } else if (!mouAllowed) {
        setActiveTab("company");
      }
      if (shouldOpenMou) {
        if (mouAllowed) {
          setViewingMou(true);
          setActiveTab("mou");
        }
        const next = new URLSearchParams(searchParams);
        next.delete("openMou");
        setSearchParams(next, { replace: true });
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [searchParams, vendor, setSearchParams]);

  useEffect(() => {
    const initTimer = setTimeout(() => {
      loadData();
    }, 0);
    const syncVendor = () => {
      const curVendor = crmVendorService.getCurrentVendor();
      if (curVendor) {
        setVendor(curVendor);
        setCompanyDocs(curVendor?.documents || []);
      }
    };
    window.addEventListener("immigo:vendor-update", syncVendor);
    return () => {
      clearTimeout(initTimer);
      window.removeEventListener("immigo:vendor-update", syncVendor);
    };
  }, [loadData]);

  const handleFilePick = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setUploadError("Document file size must be 5 MB or less.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setNewDocFile({
        fileName: file.name,
        size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
        fileUrl: String(reader.result || ""),
        mimeType: file.type,
      });
      setUploadError("");
    };
    reader.onerror = () => {
      setUploadError(`Failed to read ${file.name}.`);
    };
    reader.readAsDataURL(file);
  };

  const handleUploadCompanyDoc = async (e) => {
    e.preventDefault();
    if (!newDocName.trim()) {
      setUploadError("Please provide a document title.");
      return;
    }
    if (!newDocFile?.fileUrl) {
      setUploadError("Please choose a document file (PDF, JPG, or PNG) to upload.");
      return;
    }

    const doc = {
      name: newDocName.trim(),
      fileName: newDocFile.fileName,
      size: newDocFile.size,
      fileUrl: newDocFile.fileUrl,
      mimeType: newDocFile.mimeType,
      type: newDocType,
      uploadedAt: new Date().toISOString().split("T")[0],
      status: "Pending Verification",
    };

    const previousDocs = companyDocs;
    const updated = [doc, ...companyDocs];
    setCompanyDocs(updated);
    try {
      await crmVendorService.updateVendorProfile(vendor?.id || vendor?.vendorId, { documents: updated });
      await loadData();
    } catch (err) {
      console.error("Doc update err:", err);
      setCompanyDocs(previousDocs);
      setUploadError(err.message || "Failed to upload document. Please try again.");
      return;
    }
    setShowUploadModal(false);
    setNewDocName("");
    setNewDocFile(null);
    setUploadError("");
  };

  const handleDownloadDoc = (doc) => {
    downloadUploadedDocument(doc);
  };

  const uploadedMouUrl = vendor?.signedMouDocUrl || vendor?.signedMou?.signedFileUrl || "";

  const isRejected = Boolean(
    ["Rejected", "Registration Rejected", "MOU Rejected"].includes(vendor?.status) ||
      vendor?.mouStatus === "Rejected"
  );
  const isCorrectionRequired = Boolean(
    vendor?.mouStatus === "Correction Required" ||
      vendor?.status === "MOU Correction Required"
  );
  const isMouApproved = Boolean(
    !isRejected &&
      (vendor?.status === "Approved" ||
        vendor?.status === "Active" ||
        vendor?.mouStatus === "Approved" ||
        vendor?.onboardingStage === "COMPLETED" ||
        vendor?.onboardingStage === "ACTIVE")
  );
  const isMouUnderReview = Boolean(
    !isRejected &&
      !isMouApproved &&
      !isCorrectionRequired &&
      (vendor?.mouSigned ||
        vendor?.mouStatus === "Signed" ||
        vendor?.mouStatus === "Under Review" ||
        vendor?.status === "Pending MOU Approval" ||
        vendor?.status === "MOU Under Review" ||
        vendor?.onboardingStage === "MOU_UNDER_REVIEW" ||
        vendor?.onboardingStage === "MOU_SIGNED" ||
        Boolean(vendor?.signedMou?.signedAt))
  );
  const isMouPendingSign = Boolean(
    !isRejected &&
      !isMouApproved &&
      !isMouUnderReview &&
      (vendor?.mouStatus === "Sent" ||
        isCorrectionRequired ||
        vendor?.status === "MOU Pending" ||
        vendor?.onboardingStage === "MOU_SENT")
  );
  const isMouAssigned =
    isMouPendingSign ||
    isMouUnderReview ||
    isMouApproved ||
    Boolean(isRejected && (vendor?.mouStatus === "Rejected" || vendor?.signedMou?.signedAt || vendor?.mouDocument?.sentAt));
  const canDownloadSubmittedCopy = Boolean(uploadedMouUrl && !isMouPendingSign && !isCorrectionRequired);

  const handleDownloadMou = () => {
    if (canDownloadSubmittedCopy) {
      downloadUploadedDocument({
        fileUrl: uploadedMouUrl,
        fileName:
          vendor?.signedMou?.signatureData && /\.[a-z0-9]{2,5}$/i.test(vendor.signedMou.signatureData)
            ? vendor.signedMou.signatureData
            : `Signed_MOU_${vendor?.companyName?.replace(/[^a-zA-Z0-9_-]/g, "_") || "Vendor"}`,
      });
      return;
    }
    setViewingMou(true);
  };
  const mouData = vendor?.mouDocument || {};

  if (viewingMou && isMouAssigned) {
    return (
      <div className="space-y-3">
        <MouFullPageView
          mode={isMouPendingSign ? "sign" : "preview"}
          vendor={vendor}
          onBack={() => setViewingMou(false)}
          onSuccess={async () => {
            setViewingMou(false);
            await loadData();
          }}
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

  return (
    <div className="p-2 sm:p-3 max-w-full w-full mx-auto space-y-3 font-sans text-slate-800">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1">
            <FileText className="w-4 h-4" />
            <span>Legal & Statutory Repository</span>
          </div>
          <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
            {isMouAssigned ? "Documents & Executed MOU" : "Statutory & Compliance Documents"}
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {isMouAssigned
              ? "Access your assigned agency partnership MOU, compliance records, and statutory licenses."
              : "Upload and manage your statutory compliance records and agency licenses."}
          </p>
        </div>

        <button
          onClick={() => setShowUploadModal(true)}
          className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-bold shadow-2xs transition self-start sm:self-auto cursor-pointer"
        >
          <Upload className="w-4 h-4" />
          <span>Upload Statutory Document</span>
        </button>
      </div>

      <div className="flex items-center gap-1.5 border-b border-slate-200 pb-1.5 overflow-x-auto max-w-full">
        {isMouAssigned && (
          <button
            onClick={() => setActiveTab("mou")}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition cursor-pointer flex items-center gap-2 whitespace-nowrap shrink-0 ${
              activeTab === "mou"
                ? "bg-slate-900 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <FileCheck className="w-4 h-4" />
            <span>MOU Agreement</span>
            {isMouApproved && (
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
            )}
            {isMouUnderReview && (
              <span className="w-2 h-2 rounded-full bg-amber-400" />
            )}
          </button>
        )}

        <button
          onClick={() => setActiveTab("company")}
          className={`px-3 py-1.5 rounded-md text-xs font-bold transition cursor-pointer flex items-center gap-2 whitespace-nowrap shrink-0 ${
            !isMouAssigned || activeTab === "company"
              ? "bg-slate-900 text-white shadow-xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Statutory Licenses & Compliance ({companyDocs.length})</span>
        </button>
      </div>

      {isMouAssigned && activeTab === "mou" ? (
        
        <div className="space-y-3">
          <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
            <div className="p-3 sm:p-3.5 bg-gradient-to-r from-blue-950 via-blue-900 to-indigo-950 text-white flex flex-col md:flex-row md:items-center justify-between gap-2.5">
              <div>
                <div className="flex items-center gap-2 flex-wrap mb-1.5">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-200 border border-blue-400/30">
                    Ref: {mouData.mouNumber || mouData.refNumber || `IMMI-MO-${String(vendor?.vendorId || vendor?.id || "001").slice(-3)}`}
                  </span>
                  {isRejected ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/25 text-rose-200 border border-rose-400/40">
                      <XCircle size={11} className="text-rose-300" />
                      MOU Rejected
                    </span>
                  ) : isMouApproved ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                      <CheckCircle2 size={11} className="text-emerald-400" />
                      Verified &amp; Approved MOU
                    </span>
                  ) : isCorrectionRequired ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-orange-500/25 text-orange-200 border border-orange-400/40">
                      <AlertCircle size={11} className="text-orange-300" />
                      MOU Re-upload Required
                    </span>
                  ) : isMouUnderReview ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-400/30">
                      <Clock size={11} className="text-amber-400" />
                      Submitted &bull; Pending Admin Approval
                    </span>
                  ) : isMouPendingSign ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/25 text-purple-200 border border-purple-400/40">
                      <PenTool size={11} className="text-purple-300" />
                      MOU Issued &bull; Signature or Upload Required
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-500/25 text-slate-200 border border-slate-400/30">
                      <Clock size={11} className="text-slate-300" />
                      Awaiting Admin Document Verification
                    </span>
                  )}
                </div>
                <h3 className="text-sm sm:text-base font-bold tracking-tight">
                  Manpower Supply Partnership Memorandum of Understanding
                </h3>
                <p className="text-xs text-blue-200 mt-1 max-w-2xl leading-relaxed">
                  {isRejected
                    ? vendor?.rejectionReason || "Your submitted MOU / partnership application was rejected by Admin."
                    : isCorrectionRequired
                    ? vendor?.adminRemarks || "Admin requested a fresh upload of your signed & stamped MOU copy."
                    : `Overseas recruitment partnership agreement between ImmiGo Overseas Operations and ${vendor?.companyName || "Vendor Agency Partner"}.`}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setViewingMou(true)}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-white font-bold text-xs shadow-xs transition-colors cursor-pointer ${
                    isCorrectionRequired
                      ? "bg-orange-600 hover:bg-orange-500"
                      : isMouPendingSign
                      ? "bg-emerald-600 hover:bg-emerald-500"
                      : "bg-blue-600 hover:bg-blue-500"
                  }`}
                >
                  {isMouPendingSign ? <PenTool size={14} /> : <Eye size={14} />}
                  <span>
                    {isCorrectionRequired
                      ? "Re-upload Signed MOU"
                      : isMouPendingSign
                      ? "Sign / Upload MOU"
                      : isMouApproved
                      ? "Preview Approved MOU"
                      : isMouUnderReview
                      ? "Preview Submitted MOU"
                      : "Preview MOU"}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={handleDownloadMou}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition-colors cursor-pointer border border-white/20"
                >
                  <Download size={14} />
                  <span>{canDownloadSubmittedCopy ? "Download Signed Copy" : "Download MOU PDF"}</span>
                </button>
                {canDownloadSubmittedCopy && (
                  <button
                    type="button"
                    onClick={() =>
                      printUploadedDocument({
                        fileUrl: uploadedMouUrl,
                        fileName:
                          vendor?.signedMou?.signatureData && /\.[a-z0-9]{2,5}$/i.test(vendor.signedMou.signatureData)
                            ? vendor.signedMou.signatureData
                            : `Signed_MOU_${vendor?.companyName || "Vendor"}`,
                      })
                    }
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition-colors cursor-pointer border border-white/20"
                  >
                    <Printer size={14} />
                    <span>Print Signed Copy</span>
                  </button>
                )}
              </div>
            </div>

            <div className="p-2.5 sm:p-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 bg-slate-50/60 border-b border-slate-200/80">
              <div className="p-2 rounded-md bg-white border border-slate-200/80">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Authorized Signatory</span>
                <span className="text-xs font-bold text-slate-900 mt-1 block">
                  {vendor?.signedMou?.signatoryName || mouData.signatoryName || vendor?.contactPersonName || "Vendor Director"}
                </span>
                <span className="text-[11px] text-slate-500 mt-0.5 block truncate">
                  {vendor?.signedMou?.designation || mouData.signatoryDesignation || "Authorized Signatory"}
                </span>
              </div>

              <div className="p-2 rounded-md bg-white border border-slate-200/80">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Submission Date</span>
                <span className="text-xs font-bold text-slate-900 mt-1 block">
                  {vendor?.signedMou?.signedAt
                    ? new Date(vendor.signedMou.signedAt).toLocaleDateString()
                    : mouData.sentAt
                    ? new Date(mouData.sentAt).toLocaleDateString()
                    : "Not Submitted"}
                </span>
                <span className="text-[11px] text-slate-500 mt-0.5 block">
                  Validity: {mouData.validityYears || "1 Year (Renewable)"}
                </span>
              </div>

              <div className="p-2 rounded-md bg-white border border-slate-200/80">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Commission Structure</span>
                <span className="text-xs font-bold text-slate-900 mt-1 block">
                  {mouData.commissionRate || "Standard Agency Rate"}
                </span>
                <span className="text-[11px] text-slate-500 mt-0.5 block">
                  Terms: {mouData.paymentTerms || "30 Days post deployment"}
                </span>
              </div>

              <div className="p-2 rounded-md bg-white border border-slate-200/80">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">MOU Verification Status</span>
                <div className="flex items-center gap-1.5 mt-1">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isRejected
                        ? "bg-rose-500"
                        : isMouApproved
                        ? "bg-emerald-500"
                        : isCorrectionRequired
                        ? "bg-orange-500"
                        : isMouUnderReview
                        ? "bg-amber-500"
                        : isMouPendingSign
                        ? "bg-purple-500"
                        : "bg-slate-400"
                    }`}
                  />
                  <span
                    className={`text-xs font-bold font-mono ${
                      isRejected
                        ? "text-rose-700"
                        : isMouApproved
                        ? "text-emerald-700"
                        : isCorrectionRequired
                        ? "text-orange-700"
                        : isMouUnderReview
                        ? "text-amber-700"
                        : isMouPendingSign
                        ? "text-purple-700"
                        : "text-slate-600"
                    }`}
                  >
                    {isRejected
                      ? "REJECTED"
                      : isMouApproved
                      ? "VERIFIED & APPROVED"
                      : isCorrectionRequired
                      ? "RE-UPLOAD REQUIRED"
                      : isMouUnderReview
                      ? "PENDING ADMIN APPROVAL"
                      : isMouPendingSign
                      ? "AWAITING SUBMISSION"
                      : "NOT ISSUED YET"}
                  </span>
                </div>
                <span className="text-[10px] font-mono text-slate-400 block mt-0.5 truncate">
                  Method: {vendor?.mouSignMethod === "upload" ? "Signed Copy Upload" : vendor?.mouSignMethod === "digital" ? "Digital Signature" : "Pending"}
                </span>
              </div>
            </div>

            <div className="p-3 space-y-2">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Operative Clauses & Mandate Summary
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="p-2.5 rounded-md border border-slate-200 bg-white space-y-0.5">
                  <span className="font-bold text-slate-800 flex items-center gap-1.5">
                    <CheckCircle2 size={13} className="text-blue-600" />
                    Manpower Supply Mandate
                  </span>
                  <p className="text-slate-600 text-[11px] leading-relaxed">
                    Sourcing, trade verification, and pre-screening of candidates for Middle East & global deployment in civil, MEP, and industrial trades.
                  </p>
                </div>

                <div className="p-2.5 rounded-md border border-slate-200 bg-white space-y-0.5">
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
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {companyDocs.length === 0 ? (
            <div className="col-span-full bg-white rounded-xl border border-slate-200/80 p-8 text-center text-xs text-slate-500">
              No statutory documents uploaded yet. Click &quot;Upload Statutory Document&quot; above to upload your real files.
            </div>
          ) : (
            companyDocs.map((doc, idx) => {
              const isDocVerified = Boolean(
                doc.status === "Verified" ||
                  (vendor?.documentVerified &&
                    (!doc.status || doc.status === "Pending" || doc.status === "Submitted"))
              );
              const isDocRejected =
                doc.status === "Rejected" || doc.status === "Correction Required";
              const docStatusLabel = isDocVerified
                ? "Verified"
                : isDocRejected
                ? doc.status
                : doc.status && doc.status !== "Pending"
                ? doc.status
                : "Pending Verification";

              return (
                <div
                  key={idx}
                  className="bg-white rounded-lg border border-slate-200/80 shadow-xs p-3 flex flex-col justify-between hover:shadow-sm transition"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                        <FileCheck className="w-5 h-5" />
                      </div>
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                          isDocVerified
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : isDocRejected
                            ? "bg-rose-50 text-rose-700 border-rose-200"
                            : "bg-amber-50 text-amber-700 border-amber-200"
                        }`}
                      >
                        {isDocVerified ? (
                          <ShieldCheck className="w-3 h-3 text-emerald-500" />
                        ) : isDocRejected ? (
                          <AlertCircle className="w-3 h-3 text-rose-500" />
                        ) : (
                          <Clock className="w-3 h-3 text-amber-500" />
                        )}
                        {docStatusLabel}
                      </span>
                    </div>

                    <h4 className="font-bold text-slate-900 text-sm">{doc.name}</h4>
                    <p className="text-xs text-slate-500 font-mono mt-0.5 truncate">{doc.fileName}</p>
                    <div className="mt-3 flex items-center gap-2 text-xs text-slate-400">
                      <span>{doc.type || "Statutory Document"}</span>
                      <span>&bull;</span>
                      <span>{doc.size || "—"}</span>
                    </div>
                  </div>

                  <div className="pt-4 mt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[11px] text-slate-500 font-medium">Status: {docStatusLabel}</span>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setPreviewingDoc(doc)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Preview</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => printUploadedDocument(doc)}
                        disabled={!doc.fileUrl}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-40 text-slate-700 text-xs font-semibold transition cursor-pointer"
                        title="Print Document"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Print</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDownloadDoc(doc)}
                        disabled={!doc.fileUrl}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 disabled:opacity-40 text-xs font-semibold transition cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {showUploadModal && (
        <div
          onClick={() => setShowUploadModal(false)}
          className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex justify-end"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white max-w-md w-full h-[100dvh] p-4 sm:p-6 shadow-2xl border-l border-slate-200 overflow-y-auto animate-in slide-in-from-right duration-200"
          >
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

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Attach File (PDF, JPG, PNG up to 5MB)
                </label>
                <input
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg"
                  required
                  onChange={handleFilePick}
                  className="w-full text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                />
                {newDocFile && (
                  <p className="text-[11px] text-emerald-700 font-semibold mt-1">
                    Selected: {newDocFile.fileName} ({newDocFile.size})
                  </p>
                )}
              </div>

              {uploadError && (
                <p className="text-xs text-rose-600 font-semibold">{uploadError}</p>
              )}

              <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
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
