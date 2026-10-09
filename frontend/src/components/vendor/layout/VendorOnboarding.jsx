import React, { useState, useEffect } from "react";
import {
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  FileText,
  Check,
  ShieldCheck,
  Building2,
  Clock,
  ExternalLink,
  PenTool,
  Lock,
  ArrowRight,
  RefreshCw,
  FileCheck,
} from "lucide-react";
import crmVendorService from "../../../services/crmVendorService.js";
import MouFullPageView from "../MouFullPageView.jsx";
import DocumentViewerFullPage from "../DocumentViewerFullPage.jsx";

export function VendorOnboarding({ vendor, onVendorUpdate }) {
  // Step Determination
  // 1 = Upload Docs, 2 = Under Review, 3 = MOU Sent / Sign MOU, 4 = Completed
  const getInitialStep = (v = vendor) => {
    if (v?.mouSigned || v?.status === "Approved") return 4;
    if (v?.mouStatus === "Sent" || v?.status === "MOU Pending" || v?.onboardingStage === "MOU_SENT") return 3;
    if (v?.status === "Under Review" || v?.documentsUploaded || v?.onboardingStage === "DOCS_SUBMITTED") return 2;
    return 1;
  };

  const [currentStep, setCurrentStep] = useState(getInitialStep());
  const [viewMouFullPage, setViewMouFullPage] = useState(false);
  const [previewingDoc, setPreviewingDoc] = useState(null);

  useEffect(() => {
    setCurrentStep(getInitialStep(vendor));
  }, [vendor?.status, vendor?.mouStatus, vendor?.onboardingStage, vendor?.mouSigned]);

  // Document Upload States
  const [incorpFile, setIncorpFile] = useState(null);
  const [gstFile, setGstFile] = useState(null);
  const [panFile, setPanFile] = useState(null);
  const [chequeFile, setChequeFile] = useState(null);

  // Bank Info States
  const [accountName, setAccountName] = useState(vendor?.contactPersonName || vendor?.companyName || "");
  const [accountNumber, setAccountNumber] = useState(vendor?.bankDetails?.accountNumber || "");
  const [bankName, setBankName] = useState(vendor?.bankDetails?.bankName || "");
  const [ifsc, setIfsc] = useState(vendor?.bankDetails?.ifsc || "");

  // Digital Sign States
  const [signatoryName, setSignatoryName] = useState(vendor?.contactPersonName || "");
  const [designation, setDesignation] = useState("Managing Director");
  const [signatureText, setSignatureText] = useState(vendor?.contactPersonName || "");
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

  const validateAndSetFile = (file, setter, label) => {
    if (!file) return;
    if (file.size > MAX_FILE_SIZE) {
      setError(`${label} file size must be 5 MB or less.`);
      return;
    }
    setter(file);
    setError("");
  };

  // Submit Uploaded Documents
  const handleDocsSubmit = async (e) => {
    e.preventDefault();
    if (!panFile && !incorpFile) {
      setError("Please upload at least your PAN Card and Business Registration/Incorporation document.");
      return;
    }
    if (!accountName.trim() || !accountNumber.trim() || !bankName.trim() || !ifsc.trim()) {
      setError("Please provide complete bank account settlement details.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const documents = [];
      const today = new Date().toISOString().split("T")[0];

      if (incorpFile) {
        documents.push({
          name: "Certificate of Incorporation / Business License",
          fileName: incorpFile.name,
          size: `${(incorpFile.size / (1024 * 1024)).toFixed(2)} MB`,
          type: "Incorporation",
          uploadedAt: today,
          status: "Pending",
        });
      }
      if (gstFile) {
        documents.push({
          name: "GSTIN / Tax Certificate",
          fileName: gstFile.name,
          size: `${(gstFile.size / (1024 * 1024)).toFixed(2)} MB`,
          type: "Tax ID",
          uploadedAt: today,
          status: "Pending",
        });
      }
      if (panFile) {
        documents.push({
          name: "Company / Authorized PAN Card",
          fileName: panFile.name,
          size: `${(panFile.size / (1024 * 1024)).toFixed(2)} MB`,
          type: "PAN Card",
          uploadedAt: today,
          status: "Pending",
        });
      }
      if (chequeFile) {
        documents.push({
          name: "Cancelled Cheque / Bank Proof",
          fileName: chequeFile.name,
          size: `${(chequeFile.size / (1024 * 1024)).toFixed(2)} MB`,
          type: "Bank Proof",
          uploadedAt: today,
          status: "Pending",
        });
      }

      const bankDetails = {
        accountName: accountName.trim(),
        accountNumber: accountNumber.trim(),
        bankName: bankName.trim(),
        ifsc: ifsc.trim().toUpperCase(),
      };

      await crmVendorService.uploadVendorDocuments(documents, bankDetails);

      setSuccessMsg("Documents uploaded successfully! Status updated to Under Review.");
      setCurrentStep(2);
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err) {
      setError(err.message || "Failed to submit documents. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Submit Digital MOU Signature
  const handleMouSignSubmit = async (e) => {
    e.preventDefault();
    if (!signatoryName.trim()) {
      setError("Please enter the Authorized Signatory Full Name.");
      return;
    }
    if (!agreedToTerms) {
      setError("You must confirm and accept the MOU agreement terms.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await crmVendorService.signVendorMou({
        signatoryName: signatoryName.trim(),
        designation: designation.trim(),
        signatureData: signatureText.trim() || signatoryName.trim(),
        signedFileUrl: "",
      });

      setSuccessMsg("MOU successfully executed! Your dashboard is now active.");
      setTimeout(() => {
        window.location.reload();
      }, 1200);
    } catch (err) {
      setError(err.message || "Failed to submit MOU signature.");
    } finally {
      setLoading(false);
    }
  };

  const stepsList = [
    { num: 1, label: "Account Registered", done: true },
    { num: 2, label: "Compliance Documents", done: currentStep >= 2 },
    { num: 3, label: "Admin Verification & MOU", done: currentStep >= 3 },
    { num: 4, label: "Digital MOU Execution", done: currentStep >= 4 },
  ];

  if (viewMouFullPage) {
    return (
      <MouFullPageView
        mode="sign"
        vendor={vendor}
        onBack={() => setViewMouFullPage(false)}
        onSuccess={() => {
          setViewMouFullPage(false);
          if (onVendorUpdate) {
            onVendorUpdate((prev) => ({
              ...prev,
              mouSigned: true,
              mouStatus: "Signed",
              status: "Approved",
              onboardingStage: "COMPLETED",
            }));
          }
          setTimeout(() => window.location.reload(), 1000);
        }}
      />
    );
  }

  if (previewingDoc) {
    return (
      <DocumentViewerFullPage
        doc={previewingDoc}
        vendor={vendor}
        onBack={() => setPreviewingDoc(null)}
      />
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 pb-12 animate-fadeIn">
      {/* Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 uppercase tracking-wider">
              Vendor Onboarding & Verification
            </span>
            <span className="text-xs font-mono text-slate-500 font-bold">
              ID: {vendor?.id || vendor?.vendorId || "VND-PENDING"}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            {vendor?.companyName || "Recruitment Agency"}
          </h1>
          <p className="text-xs text-slate-500">
            Registered Email: <span className="font-semibold text-slate-700">{vendor?.email}</span>
          </p>
        </div>

        {/* Live Status Badge */}
        <div className="shrink-0 flex items-center gap-3">
          {currentStep === 1 && (
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
              Documents Pending Upload
            </span>
          )}
          {currentStep === 2 && (
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200">
              <Clock size={14} className="text-blue-600 animate-spin" />
              Documents Under Admin Review
            </span>
          )}
          {currentStep === 3 && (
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-purple-50 text-purple-800 border border-purple-200">
              <PenTool size={14} className="text-purple-600" />
              MOU Issued &bull; Signature Required
            </span>
          )}
          {currentStep === 4 && (
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
              <CheckCircle2 size={14} className="text-emerald-600" />
              Fully Verified & Active
            </span>
          )}

          <button
            onClick={() => window.location.reload()}
            title="Refresh status"
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
          >
            <RefreshCw size={15} />
          </button>
        </div>
      </div>

      {/* 4-Step Visual Stepper */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {stepsList.map((s, idx) => (
            <div
              key={s.num}
              className={`p-3 rounded-xl border flex flex-col justify-between space-y-2 transition-all ${
                s.done
                  ? "bg-blue-50/60 border-blue-200 text-blue-900"
                  : currentStep === s.num
                  ? "bg-amber-50/60 border-amber-300 text-amber-900 ring-2 ring-amber-400/20"
                  : "bg-slate-50 border-slate-200 text-slate-400"
              }`}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black ${
                    s.done
                      ? "bg-blue-600 text-white"
                      : currentStep === s.num
                      ? "bg-amber-500 text-white animate-pulse"
                      : "bg-slate-200 text-slate-600"
                  }`}
                >
                  {s.done ? <Check size={14} className="stroke-[3]" /> : s.num}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider">
                  {s.done ? "Completed" : currentStep === s.num ? "Active" : "Upcoming"}
                </span>
              </div>
              <span className="text-xs font-bold leading-tight line-clamp-2">{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-semibold flex items-center gap-2">
          <AlertCircle size={16} className="text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {successMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* STEP 1: UPLOAD DOCUMENTS FORM */}
      {/* ---------------------------------------------------- */}
      {currentStep === 1 && (
        <form onSubmit={handleDocsSubmit} className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
              <UploadCloud className="w-5 h-5 text-blue-600" />
              <span>Step 2: Upload Compliance Documents</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Please upload clear statutory documents (PDF, JPG, or PNG up to 5MB) and your bank details for payment settlements. Once submitted, Admin will review and issue your MOU.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 1. Incorporation */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
              <label className="text-xs font-bold text-slate-800 block">
                Certificate of Incorporation / Trade License <span className="text-rose-500">*</span>
              </label>
              <input
                type="file"
                accept=".pdf,.png,.jpg,.jpeg"
                onChange={(e) => validateAndSetFile(e.target.files[0], setIncorpFile, "Incorporation")}
                className="w-full text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
              />
              {incorpFile && (
                <p className="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
                  <Check size={13} /> {incorpFile.name}
                </p>
              )}
            </div>

            {/* 2. GST */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
              <label className="text-xs font-bold text-slate-800 block">
                GSTIN / Tax Registration Certificate
              </label>
              <input
                type="file"
                accept=".pdf,.png,.jpg,.jpeg"
                onChange={(e) => validateAndSetFile(e.target.files[0], setGstFile, "GST")}
                className="w-full text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
              />
              {gstFile && (
                <p className="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
                  <Check size={13} /> {gstFile.name}
                </p>
              )}
            </div>

            {/* 3. PAN */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
              <label className="text-xs font-bold text-slate-800 block">
                Company PAN Card / Director ID <span className="text-rose-500">*</span>
              </label>
              <input
                type="file"
                accept=".pdf,.png,.jpg,.jpeg"
                onChange={(e) => validateAndSetFile(e.target.files[0], setPanFile, "PAN Card")}
                className="w-full text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
              />
              {panFile && (
                <p className="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
                  <Check size={13} /> {panFile.name}
                </p>
              )}
            </div>

            {/* 4. Bank Cheque */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
              <label className="text-xs font-bold text-slate-800 block">
                Cancelled Cheque / Bank Proof <span className="text-rose-500">*</span>
              </label>
              <input
                type="file"
                accept=".pdf,.png,.jpg,.jpeg"
                onChange={(e) => validateAndSetFile(e.target.files[0], setChequeFile, "Bank Proof")}
                className="w-full text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
              />
              {chequeFile && (
                <p className="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
                  <Check size={13} /> {chequeFile.name}
                </p>
              )}
            </div>
          </div>

          {/* Bank Settlement Info */}
          <div className="pt-4 border-t border-slate-100 space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-700">
              Agency Bank Settlement Account Details
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Beneficiary Account Name</label>
                <input
                  type="text"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  placeholder="e.g. Acme Overseas Pvt Ltd"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-blue-500"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Bank Name</label>
                <input
                  type="text"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  placeholder="e.g. HDFC Bank Ltd"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-blue-500"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Account Number</label>
                <input
                  type="text"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  placeholder="e.g. 50100234567890"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-blue-500"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">IFSC Code</label>
                <input
                  type="text"
                  value={ifsc}
                  onChange={(e) => setIfsc(e.target.value)}
                  placeholder="e.g. HDFC0001234"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-blue-500 uppercase"
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-4 flex items-center justify-end">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition cursor-pointer flex items-center gap-2"
            >
              {loading ? (
                <>
                  <RefreshCw size={15} className="animate-spin" />
                  <span>Uploading Documents...</span>
                </>
              ) : (
                <>
                  <span>Submit Documents for Admin Verification</span>
                  <ArrowRight size={15} />
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* ---------------------------------------------------- */}
      {/* STEP 2: UNDER REVIEW STATUS */}
      {/* ---------------------------------------------------- */}
      {currentStep === 2 && (
        <div className="bg-white rounded-2xl border border-slate-200/90 p-8 shadow-xs text-center space-y-6">
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center mx-auto border border-blue-200">
            <Clock size={32} className="animate-pulse" />
          </div>

          <div className="space-y-1.5 max-w-md mx-auto">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Documents Submitted & Under Review
            </h2>
            <p className="text-xs text-slate-500">
              Your compliance documents have been sent to Admin for statutory verification.
            </p>
          </div>

          <div className="p-4 bg-blue-50/60 border border-blue-200 rounded-2xl max-w-lg mx-auto text-left text-xs text-blue-950 space-y-2">
            <p>
              📋 <b>What happens next?</b> Admin will examine your company registration, PAN, and tax certificates.
            </p>
            <p>
              📜 Once verified, Admin will generate and dispatch the official <b>Memorandum of Understanding (MOU)</b>.
            </p>
            <p>
              ✍️ You will be able to review the MOU format and digitally sign it directly from this screen to unlock your candidates and project pool.
            </p>
          </div>

          <div className="pt-2 flex items-center justify-center gap-3">
            <button
              onClick={() => window.location.reload()}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow transition cursor-pointer flex items-center gap-2"
            >
              <RefreshCw size={14} />
              <span>Check for Admin Approval</span>
            </button>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* STEP 3: MOU SENT - DIGITAL SIGNATURE REQUIRED */}
      {/* ---------------------------------------------------- */}
      {currentStep === 3 && (
        <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-emerald-950">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-600 text-white rounded-xl">
                <CheckCircle2 size={20} />
              </div>
              <div>
                <h3 className="text-sm font-bold">Documents Approved by Admin!</h3>
                <p className="text-xs text-emerald-800">
                  Your compliance documents have been verified. The official MOU has been issued.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setViewMouFullPage(true)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow transition cursor-pointer flex items-center gap-1.5 shrink-0"
            >
              <FileText size={14} />
              <span>Review MOU Document</span>
            </button>
          </div>

          {/* Digital Signature Form */}
          <form onSubmit={handleMouSignSubmit} className="space-y-5 border-t border-slate-100 pt-5">
            <div>
              <h2 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
                <PenTool className="w-5 h-5 text-indigo-600" />
                <span>Execute Digital Signature</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Review the MOU above, provide your authorized signatory details below, and confirm agreement to unlock your full portal.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Authorized Signatory Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={signatoryName}
                  onChange={(e) => setSignatoryName(e.target.value)}
                  placeholder="Full Legal Name"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Designation / Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value)}
                  placeholder="e.g. Managing Director / Partner"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-indigo-500"
                />
              </div>
            </div>

            {/* Signature Stamp Preview */}
            <div className="p-4 rounded-xl border border-indigo-200 bg-indigo-50/40 space-y-2">
              <label className="text-xs font-bold text-indigo-950 block">Digital Signature Stamp</label>
              <div className="p-4 bg-white rounded-lg border border-indigo-200 text-center">
                <p className="font-serif italic text-2xl text-indigo-900 font-black tracking-wide">
                  {signatureText || signatoryName || "Your Signature"}
                </p>
                <p className="text-[10px] text-slate-400 font-mono mt-1">
                  Cryptographically tied to {vendor?.email} &bull; {new Date().toLocaleDateString("en-IN")}
                </p>
              </div>
              <input
                type="text"
                value={signatureText}
                onChange={(e) => setSignatureText(e.target.value)}
                placeholder="Type your signature text"
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200"
              />
            </div>

            {/* Terms Acceptance Checkbox */}
            <label className="flex items-start gap-2.5 p-3 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer text-xs text-slate-700 font-medium">
              <input
                type="checkbox"
                required
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              />
              <span>
                I hereby declare that I am the legally authorized representative of <b>{vendor?.companyName}</b> and agree to abide by all covenants and ethical recruitment guidelines stated in the Memorandum of Understanding (MOU).
              </span>
            </label>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => setViewMouFullPage(true)}
                className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
              >
                <ExternalLink size={13} />
                <span>View Full Agreement Text</span>
              </button>

              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs sm:text-sm rounded-xl shadow transition cursor-pointer flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <RefreshCw size={15} className="animate-spin" />
                    <span>Executing MOU...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={16} />
                    <span>Sign MOU & Activate Dashboard</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default VendorOnboarding;
