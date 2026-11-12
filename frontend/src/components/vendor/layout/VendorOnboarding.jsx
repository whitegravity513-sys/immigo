import { useState, useEffect, useCallback, useRef } from "react";
import {
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  FileText,
  Check,
  Clock,
  ExternalLink,
  PenTool,
  ArrowRight,
  RefreshCw,
  Eye,
  Download,
  Printer,
  XCircle,
} from "lucide-react";
import crmVendorService from "../../../services/crmVendorService.js";
import MouFullPageView from "../MouFullPageView.jsx";
import DocumentViewerFullPage from "../DocumentViewerFullPage.jsx";
import { useAuth } from "../../../context/useAuth.js";
import { downloadUploadedDocument, printUploadedDocument } from "../../../utils/printDocument.js";

const readFileAsDataURL = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error(`Failed to read ${file?.name || "file"}.`));
    reader.readAsDataURL(file);
  });

const isVendorRejected = (v) =>
  Boolean(
    ["Rejected", "Registration Rejected", "MOU Rejected"].includes(v?.status) ||
      v?.mouStatus === "Rejected"
  );

const isVendorCorrectionRequired = (v) =>
  Boolean(
    v?.mouStatus === "Correction Required" ||
      v?.status === "MOU Correction Required"
  );

const isVendorMouApproved = (v) =>
  Boolean(
    !isVendorRejected(v) &&
      (v?.status === "Approved" ||
        v?.status === "Active" ||
        v?.mouStatus === "Approved" ||
        v?.onboardingStage === "COMPLETED" ||
        v?.onboardingStage === "ACTIVE")
  );

const isVendorMouUnderReview = (v) =>
  Boolean(
    !isVendorRejected(v) &&
      !isVendorMouApproved(v) &&
      !isVendorCorrectionRequired(v) &&
      (v?.mouSigned ||
        v?.mouStatus === "Signed" ||
        v?.mouStatus === "Under Review" ||
        v?.status === "Pending MOU Approval" ||
        v?.status === "MOU Under Review" ||
        v?.onboardingStage === "MOU_SIGNED" ||
        v?.onboardingStage === "MOU_UNDER_REVIEW")
  );

const getInitialStep = (v) => {
  if (isVendorRejected(v) || isVendorMouApproved(v) || isVendorMouUnderReview(v)) {
    return 4;
  }
  if (
    v?.mouStatus === "Sent" ||
    isVendorCorrectionRequired(v) ||
    v?.status === "MOU Pending" ||
    v?.onboardingStage === "MOU_SENT"
  ) {
    return 3;
  }
  if (v?.status === "Documents Correction Required") {
    return 1;
  }
  if (
    v?.status === "Documents Under Review" ||
    v?.status === "Under Review" ||
    v?.documentsUploaded ||
    (Array.isArray(v?.documents) && v.documents.length > 0) ||
    v?.onboardingStage === "DOCS_SUBMITTED"
  ) {
    return 2;
  }
  return 1;
};

export function VendorOnboarding({ vendor, onVendorUpdate }) {
  const { updateUser } = useAuth();

  const [currentStep, setCurrentStep] = useState(() => getInitialStep(vendor));
  const currentStepRef = useRef(currentStep);
  useEffect(() => {
    currentStepRef.current = currentStep;
  }, [currentStep]);
  const [viewMouFullPage, setViewMouFullPage] = useState(false);
  const [previewingDoc, setPreviewingDoc] = useState(null);

  const docsSignature = JSON.stringify((vendor?.documents || []).map((d) => [d?.name, d?.fileName, d?.status]));

  useEffect(() => {
    const next = getInitialStep(vendor);
    const timer = setTimeout(() => {
      setCurrentStep(next);
    }, 0);
    return () => clearTimeout(timer);
  }, [vendor, docsSignature]);

  const [incorpFile, setIncorpFile] = useState(null);
  const [gstFile, setGstFile] = useState(null);
  const [panFile, setPanFile] = useState(null);
  const [chequeFile, setChequeFile] = useState(null);

  const [accountName, setAccountName] = useState(vendor?.contactPersonName || vendor?.companyName || "");
  const [accountNumber, setAccountNumber] = useState(vendor?.bankDetails?.accountNumber || "");
  const [bankName, setBankName] = useState(vendor?.bankDetails?.bankName || "");
  const [ifsc, setIfsc] = useState(vendor?.bankDetails?.ifsc || "");

  const [signatoryName, setSignatoryName] = useState(vendor?.contactPersonName || "");
  const [designation, setDesignation] = useState("Managing Director");
  const [signatureText, setSignatureText] = useState(vendor?.contactPersonName || "");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [mouSignMethod, setMouSignMethod] = useState(() =>
    isVendorCorrectionRequired(vendor) &&
    (vendor?.mouSignMethod === "upload" || vendor?.mouSignMethod === "DOWNLOAD_SIGN_UPLOAD")
      ? "upload"
      : "digital"
  );
  const [uploadedMouFile, setUploadedMouFile] = useState(null);

  const [loading, setLoading] = useState(false);
  const [checkingApproval, setCheckingApproval] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const vendorRejected = isVendorRejected(vendor);
  const mouCorrectionRequired = isVendorCorrectionRequired(vendor);
  const mouApproved = isVendorMouApproved(vendor);
  const mouUnderReview = isVendorMouUnderReview(vendor);
  const hasMouRecord = Boolean(
    vendor?.mouStatus === "Rejected" ||
      vendor?.signedMou?.signedAt ||
      vendor?.mouDocument?.sentAt ||
      mouApproved ||
      mouUnderReview ||
      currentStep === 3 ||
      currentStep === 4
  );

  useEffect(() => {
    if (
      mouCorrectionRequired &&
      (vendor?.mouSignMethod === "upload" || vendor?.mouSignMethod === "DOWNLOAD_SIGN_UPLOAD")
    ) {
      const timer = setTimeout(() => {
        setMouSignMethod("upload");
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [mouCorrectionRequired, vendor?.mouSignMethod]);

  const handleCheckApproval = useCallback(async (silent = false) => {
    if (!silent) setCheckingApproval(true);
    try {
      const fresh = await crmVendorService.getVendorMe();
      if (fresh) {
        if (onVendorUpdate) onVendorUpdate(fresh);
        updateUser(fresh);
        const nextStep = getInitialStep(fresh);
        if (nextStep !== currentStepRef.current) {
          setCurrentStep(nextStep);
          if (nextStep === 3) {
            setSuccessMsg("Admin has approved your compliance documents and sent the MOU agreement! Please review and submit signed MOU.");
          } else if (nextStep === 4 && isVendorMouApproved(fresh)) {
            setSuccessMsg("MOU approved by Admin! Account is now Verified & Active.");
          }
        }
      }
    } catch (e) {
      console.warn("Check approval failed:", e);
    } finally {
      if (!silent) setCheckingApproval(false);
    }
  }, [onVendorUpdate, updateUser]);

  useEffect(() => {
    if (vendorRejected) return;
    if (currentStep === 2 || (currentStep === 4 && !mouApproved)) {
      const interval = setInterval(() => {
        handleCheckApproval(true);
      }, 3500);
      return () => clearInterval(interval);
    }
  }, [currentStep, mouApproved, vendorRejected, handleCheckApproval]);

  const MAX_FILE_SIZE = 5 * 1024 * 1024; 

  const validateAndSetFile = (file, setter, label) => {
    if (!file) return;
    if (file.size > MAX_FILE_SIZE) {
      setError(`${label} file size must be 5 MB or less.`);
      return;
    }
    setter(file);
    setError("");
  };

  const handleMouFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_FILE_SIZE) {
      setError("Signed MOU file size must be 5 MB or less.");
      return;
    }
    try {
      const fileUrl = await readFileAsDataURL(file);
      setUploadedMouFile({
        name: file.name,
        size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
        fileUrl,
        mimeType: file.type,
      });
      setError("");
    } catch (err) {
      setError(err.message || "Failed to read signed MOU file.");
    }
  };

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
        const fileUrl = await readFileAsDataURL(incorpFile);
        documents.push({
          name: "Certificate of Incorporation / Business License",
          fileName: incorpFile.name,
          fileUrl,
          mimeType: incorpFile.type,
          size: `${(incorpFile.size / (1024 * 1024)).toFixed(2)} MB`,
          type: "Incorporation",
          uploadedAt: today,
          status: "Pending",
        });
      }
      if (gstFile) {
        const fileUrl = await readFileAsDataURL(gstFile);
        documents.push({
          name: "GSTIN / Tax Certificate",
          fileName: gstFile.name,
          fileUrl,
          mimeType: gstFile.type,
          size: `${(gstFile.size / (1024 * 1024)).toFixed(2)} MB`,
          type: "Tax ID",
          uploadedAt: today,
          status: "Pending",
        });
      }
      if (panFile) {
        const fileUrl = await readFileAsDataURL(panFile);
        documents.push({
          name: "Company / Authorized PAN Card",
          fileName: panFile.name,
          fileUrl,
          mimeType: panFile.type,
          size: `${(panFile.size / (1024 * 1024)).toFixed(2)} MB`,
          type: "PAN Card",
          uploadedAt: today,
          status: "Pending",
        });
      }
      if (chequeFile) {
        const fileUrl = await readFileAsDataURL(chequeFile);
        documents.push({
          name: "Cancelled Cheque / Bank Proof",
          fileName: chequeFile.name,
          fileUrl,
          mimeType: chequeFile.type,
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

      const updatedVendor = await crmVendorService.uploadVendorDocuments(documents, bankDetails);
      const syncedVendor = {
        ...(vendor || {}),
        ...(updatedVendor || {}),
        documentsUploaded: true,
        documents:
          Array.isArray(updatedVendor?.documents) && updatedVendor.documents.length > 0
            ? updatedVendor.documents
            : documents,
      };
      updateUser(syncedVendor);
      if (onVendorUpdate) {
        onVendorUpdate(syncedVendor);
      }

      setSuccessMsg("Documents uploaded successfully! All vendor portal sections are now unlocked.");
      setCurrentStep(2);
    } catch (err) {
      setError(err.message || "Failed to submit documents. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleMouSignSubmit = async (e) => {
    e.preventDefault();
    if (!signatoryName.trim()) {
      setError("Please enter the Authorized Signatory Full Name.");
      return;
    }
    if (mouSignMethod === "upload" && !uploadedMouFile?.fileUrl) {
      setError("Please upload your signed & stamped MOU copy.");
      return;
    }
    if (!agreedToTerms) {
      setError("You must confirm and accept the MOU agreement terms.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const updated = await crmVendorService.signVendorMou({
        signatoryName: signatoryName.trim(),
        designation: designation.trim(),
        signatureData:
          mouSignMethod === "upload"
            ? uploadedMouFile.name
            : signatureText.trim() || signatoryName.trim(),
        signedFileUrl: mouSignMethod === "upload" ? uploadedMouFile.fileUrl : "",
        signedFileName: mouSignMethod === "upload" ? uploadedMouFile.name : "",
        signMethod: mouSignMethod,
      });

      updateUser(updated);
      if (onVendorUpdate) {
        onVendorUpdate(updated);
      }
      setSuccessMsg("Signed MOU submitted! Status is now Pending Admin Approval.");
      setCurrentStep(4);
    } catch (err) {
      setError(err.message || "Failed to submit signed MOU.");
    } finally {
      setLoading(false);
    }
  };

  const stepsList = [
    { num: 1, label: "Account Registered", done: !vendorRejected },
    { num: 2, label: "Compliance Documents", done: !vendorRejected && currentStep >= 2 },
    { num: 3, label: "Admin Verification & MOU", done: !vendorRejected && currentStep >= 3 },
    { num: 4, label: "MOU Execution & Approval", done: mouApproved },
  ];

  if (viewMouFullPage && (hasMouRecord || currentStep === 3 || currentStep === 4)) {
    return (
      <MouFullPageView
        mode={!vendorRejected && currentStep === 3 ? "sign" : "preview"}
        vendor={vendor}
        onBack={() => setViewMouFullPage(false)}
        onSuccess={async () => {
          setViewMouFullPage(false);
          const fresh = await crmVendorService.getVendorMe();
          if (fresh) {
            updateUser(fresh);
            if (onVendorUpdate) onVendorUpdate(fresh);
            setCurrentStep(getInitialStep(fresh));
          }
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
      <div className="bg-white rounded-xl border border-slate-200/90 p-3 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 uppercase tracking-wider">
              Vendor Onboarding & Verification
            </span>
            <span className="text-xs font-mono text-slate-500 font-bold">
              ID: {vendor?.id || vendor?.vendorId || "VND-PENDING"}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight break-words">
            {vendor?.companyName || "Recruitment Agency"}
          </h1>
          <p className="text-xs text-slate-500 break-all">
            Registered Email: <span className="font-semibold text-slate-700">{vendor?.email}</span>
          </p>
        </div>

        <div className="shrink-0 flex flex-wrap items-center gap-2 sm:gap-3">
          {vendorRejected ? (
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-rose-50 text-rose-800 border border-rose-200">
              <XCircle size={14} className="text-rose-600" />
              {vendor?.mouStatus === "Rejected" ? "MOU Rejected" : vendor?.status || "Rejected"}
            </span>
          ) : (
            <>
              {!vendorRejected && currentStep === 1 && (
                <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                  Documents Pending Upload
                </span>
              )}
              {!vendorRejected && currentStep === 2 && (
                <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200">
                  <Clock size={14} className="text-blue-600 animate-spin" />
                  Documents Under Admin Review
                </span>
              )}
              {currentStep === 3 && (
                <span
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold border ${
                    mouCorrectionRequired
                      ? "bg-orange-50 text-orange-800 border-orange-200"
                      : "bg-purple-50 text-purple-800 border-purple-200"
                  }`}
                >
                  <PenTool size={14} className={mouCorrectionRequired ? "text-orange-600" : "text-purple-600"} />
                  {mouCorrectionRequired ? "MOU Re-upload Required" : "MOU Issued • Signature Required"}
                </span>
              )}
              {currentStep === 4 && mouApproved && (
                <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                  <CheckCircle2 size={14} className="text-emerald-600" />
                  Verified &amp; Approved
                </span>
              )}
              {currentStep === 4 && !mouApproved && mouUnderReview && (
                <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                  <Clock size={14} className="text-amber-600" />
                  MOU Submitted &bull; Pending Admin Approval
                </span>
              )}
            </>
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

      <div className="bg-white rounded-xl border border-slate-200/90 p-3 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {stepsList.map((s) => (
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
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
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

      {!vendorRejected && currentStep === 1 && (
        <form onSubmit={handleDocsSubmit} className="bg-white rounded-xl border border-slate-200/90 p-4 sm:p-8 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <UploadCloud className="w-5 h-5 text-blue-600" />
              <span>Step 2: Upload Compliance Documents</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Please upload clear statutory documents (PDF, JPG, or PNG up to 5MB) and your bank details for payment settlements. Once submitted, Admin will review and issue your MOU.
            </p>
          </div>

          {Array.isArray(vendor?.documents) && vendor.documents.length > 0 && (
            <div className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/50 space-y-2">
              <p className="text-xs font-bold text-amber-900">
                Previously Uploaded Documents ({vendor.documents.length})
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {vendor.documents.map((doc, idx) => (
                  <div
                    key={doc.id || idx}
                    className="p-2.5 rounded-lg bg-white border border-amber-200/80 flex items-center justify-between gap-2 text-xs"
                  >
                    <div className="min-w-0">
                      <p className="font-bold text-slate-900 truncate">{doc.name}</p>
                      <p className="text-[10px] font-mono text-slate-500 truncate">{doc.fileName}</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => setPreviewingDoc(doc)}
                        className="p-1 rounded border border-slate-200 hover:bg-slate-50 text-slate-700 cursor-pointer"
                        title="Preview"
                      >
                        <Eye size={12} />
                      </button>
                      <button
                        type="button"
                        onClick={() => printUploadedDocument(doc)}
                        disabled={!doc.fileUrl}
                        className="p-1 rounded border border-slate-200 hover:bg-slate-50 disabled:opacity-40 text-slate-700 cursor-pointer"
                        title="Print"
                      >
                        <Printer size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

          <div className="pt-4 border-t border-slate-100 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
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

      {!vendorRejected && currentStep === 2 && (
        <div className="bg-white rounded-xl border border-slate-200/90 p-4 sm:p-8 shadow-xs text-center space-y-6">
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center mx-auto border border-blue-200">
            <Clock size={32} className="animate-pulse" />
          </div>

          <div className="space-y-1.5 max-w-md mx-auto">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
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

          {Array.isArray(vendor?.documents) && vendor.documents.length > 0 && (
            <div className="max-w-2xl mx-auto text-left space-y-2.5 pt-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Submitted Compliance Documents ({vendor.documents.length})
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {vendor.documents.map((doc, idx) => (
                  <div
                    key={doc.id || idx}
                    className="p-3 rounded-xl border border-slate-200 bg-slate-50/70 flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 truncate">{doc.name}</p>
                      <p className="text-[10px] font-mono text-slate-500 truncate">
                        {doc.fileName} &bull; {doc.size || "—"}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => setPreviewingDoc(doc)}
                        className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 cursor-pointer"
                        title="Preview document"
                      >
                        <Eye size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => printUploadedDocument(doc)}
                        disabled={!doc.fileUrl}
                        className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 text-slate-700 cursor-pointer"
                        title="Print document"
                      >
                        <Printer size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => downloadUploadedDocument(doc)}
                        disabled={!doc.fileUrl}
                        className="p-1.5 rounded-lg bg-blue-50 border border-blue-200 hover:bg-blue-100 disabled:opacity-40 text-blue-700 cursor-pointer"
                        title="Download document"
                      >
                        <Download size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="pt-2 flex items-center justify-center gap-3">
            <button
              onClick={() => handleCheckApproval(false)}
              disabled={checkingApproval}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow transition cursor-pointer flex items-center gap-2"
            >
              <RefreshCw size={14} className={checkingApproval ? "animate-spin" : ""} />
              <span>{checkingApproval ? "Checking with Admin..." : "Check for Admin Approval"}</span>
            </button>
          </div>
        </div>
      )}

      {!vendorRejected && currentStep === 3 && (
        <div className="bg-white rounded-xl border border-slate-200/90 p-4 sm:p-8 shadow-xs space-y-6">
          <div
            className={`p-4 border rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
              mouCorrectionRequired
                ? "bg-orange-50 border-orange-200 text-orange-950"
                : "bg-emerald-50 border-emerald-200 text-emerald-950"
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`p-2 text-white rounded-xl ${
                  mouCorrectionRequired ? "bg-orange-600" : "bg-emerald-600"
                }`}
              >
                {mouCorrectionRequired ? <AlertCircle size={20} /> : <CheckCircle2 size={20} />}
              </div>
              <div>
                <h3 className="text-sm font-bold">
                  {mouCorrectionRequired
                    ? "MOU Re-upload Requested by Admin"
                    : "Documents Approved by Admin!"}
                </h3>
                <p
                  className={`text-xs ${
                    mouCorrectionRequired ? "text-orange-800" : "text-emerald-800"
                  }`}
                >
                  {mouCorrectionRequired
                    ? vendor?.adminRemarks || "Please upload a fresh clear copy of your signed & stamped MOU."
                    : "Your compliance documents have been verified. The official MOU has been issued."}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setViewMouFullPage(true)}
              className={`px-4 py-2 text-white font-bold text-xs rounded-xl shadow transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
                mouCorrectionRequired
                  ? "bg-orange-600 hover:bg-orange-700"
                  : "bg-emerald-600 hover:bg-emerald-700"
              }`}
            >
              <FileText size={14} />
              <span>Review MOU Document</span>
            </button>
          </div>

          <form onSubmit={handleMouSignSubmit} className="space-y-5 border-t border-slate-100 pt-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  <PenTool className="w-5 h-5 text-indigo-600" />
                  <span>Submit Signed Partnership MOU</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Digitally sign online or download, sign &amp; upload your signed MOU copy for Admin approval.
                </p>
              </div>
              <div className="inline-flex rounded-xl bg-slate-100 p-1 shrink-0 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setMouSignMethod("digital")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    mouSignMethod === "digital"
                      ? "bg-white text-indigo-700 shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Digitally Sign
                </button>
                <button
                  type="button"
                  onClick={() => setMouSignMethod("upload")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    mouSignMethod === "upload"
                      ? "bg-white text-indigo-700 shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Download &amp; Upload Signed
                </button>
              </div>
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

            {mouSignMethod === "digital" ? (
              <div className="p-4 rounded-xl border border-indigo-200 bg-indigo-50/40 space-y-2">
                <label className="text-xs font-bold text-indigo-950 block">Digital Signature Stamp</label>
                <div className="p-4 bg-white rounded-lg border border-indigo-200 text-center">
                  <p className="font-serif italic text-2xl text-indigo-900 font-bold tracking-wide">
                    {signatureText || signatoryName || "Your Signature"}
                  </p>
                  <p className="text-[10px] text-slate-400 font-mono mt-1">
                    Tied to {vendor?.email} &bull; {new Date().toLocaleDateString("en-IN")}
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
            ) : (
              <div className="p-4 rounded-xl border border-indigo-200 bg-indigo-50/40 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-indigo-100">
                  <span className="text-xs font-bold text-indigo-950">
                    Step 1: Open &amp; Download the official MOU PDF, then sign/stamp and upload below.
                  </span>
                  <button
                    type="button"
                    onClick={() => setViewMouFullPage(true)}
                    className="px-3 py-1.5 rounded-lg bg-blue-900 hover:bg-blue-950 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shrink-0 self-start sm:self-auto"
                  >
                    <FileText size={13} />
                    <span>Open &amp; Download MOU</span>
                  </button>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    Step 2: Upload Signed MOU Copy (PDF, JPG, PNG up to 5MB) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg"
                    onChange={handleMouFileChange}
                    className="w-full text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-indigo-100 file:text-indigo-700 hover:file:bg-indigo-200 cursor-pointer"
                  />
                  {uploadedMouFile && (
                    <p className="text-[11px] text-emerald-700 font-bold flex items-center gap-1 mt-1.5">
                      <Check size={13} /> {uploadedMouFile.name} ({uploadedMouFile.size})
                    </p>
                  )}
                </div>
              </div>
            )}

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

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
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
                    <span>Submitting MOU...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={16} />
                    <span>Submit Signed MOU for Admin Approval</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {vendorRejected && (
        <div className="bg-white rounded-xl border border-rose-200 p-4 sm:p-8 shadow-xs text-center space-y-5">
          <div className="w-16 h-16 rounded-3xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center mx-auto">
            <XCircle size={32} />
          </div>
          <div className="space-y-1.5 max-w-md mx-auto">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              {vendor?.mouStatus === "Rejected" ? "MOU Rejected by Admin" : "Vendor Application Rejected"}
            </h2>
            <p className="text-xs text-rose-700 font-medium">
              {vendor?.rejectionReason || "Your vendor application / MOU was rejected by Admin."}
            </p>
          </div>
          {hasMouRecord && (
            <div className="pt-2 flex items-center justify-center gap-3 flex-wrap">
              <button
                type="button"
                onClick={() => setViewMouFullPage(true)}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow transition cursor-pointer flex items-center gap-2"
              >
                <FileText size={14} />
                <span>View MOU Record</span>
              </button>
            </div>
          )}
        </div>
      )}

      {!vendorRejected && currentStep === 4 && (
        <div className="bg-white rounded-xl border border-slate-200/90 p-4 sm:p-8 shadow-xs text-center space-y-5">
          <div
            className={`w-16 h-16 rounded-3xl flex items-center justify-center mx-auto border ${
              mouApproved
                ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                : "bg-amber-50 text-amber-600 border-amber-200"
            }`}
          >
            {mouApproved ? <CheckCircle2 size={32} /> : <Clock size={32} className="animate-pulse" />}
          </div>
          <div className="space-y-1.5 max-w-md mx-auto">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              {mouApproved ? "MOU Verified & Partnership Active" : "Signed MOU Submitted — Pending Admin Approval"}
            </h2>
            <p className="text-xs text-slate-500">
              {mouApproved
                ? "Your Memorandum of Understanding has been verified and counter-signed by Admin."
                : "Your signed MOU has been sent to Admin for verification. It will display as Verified once Admin approves it."}
            </p>
          </div>
          <div className="pt-2 flex items-center justify-center gap-3 flex-wrap">
            <button
              type="button"
              onClick={() => setViewMouFullPage(true)}
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow transition cursor-pointer flex items-center gap-2"
            >
              <FileText size={14} />
              <span>View Submitted MOU</span>
            </button>
            {!mouApproved && (
              <button
                type="button"
                onClick={() => handleCheckApproval(false)}
                disabled={checkingApproval}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow transition cursor-pointer flex items-center gap-2"
              >
                <RefreshCw size={14} className={checkingApproval ? "animate-spin" : ""} />
                <span>{checkingApproval ? "Checking..." : "Check Admin Approval"}</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default VendorOnboarding;
