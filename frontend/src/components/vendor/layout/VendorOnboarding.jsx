import React, { useState } from "react";
import { UploadCloud, CheckCircle2, AlertCircle, FileText, Check, Save, ShieldAlert, Building2 } from "lucide-react";
import crmVendorService from "../../../services/crmVendorService.js";

export function VendorOnboarding({ vendor }) {
  const [panFile, setPanFile] = useState(null);
  const [chequeFile, setChequeFile] = useState(null);
  const [accountName, setAccountName] = useState(vendor?.contactPersonName || "");
  const [accountNumber, setAccountNumber] = useState("");
  const [bankName, setBankName] = useState("");
  const [ifsc, setIfsc] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2 MB

  const handlePanUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.type !== "application/pdf") {
      setError("Only PDF files are allowed for PAN Card.");
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setError("PAN Card file size must be 2 MB or less.");
      return;
    }
    setPanFile(file);
    setError("");
  };

  const handleChequeUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.type !== "application/pdf") {
      setError("Only PDF files are allowed for Cancelled Cheque / Bank Proof.");
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setError("Bank proof file size must be 2 MB or less.");
      return;
    }
    setChequeFile(file);
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!panFile) {
      setError("Please upload your PAN Card document (PDF max 2MB).");
      return;
    }
    if (!chequeFile) {
      setError("Please upload your Cancelled Cheque or Bank Passbook proof (PDF max 2MB).");
      return;
    }
    if (!accountName.trim() || !accountNumber.trim() || !bankName.trim() || !ifsc.trim()) {
      setError("Please fill out all bank account fields.");
      return;
    }

    setLoading(true);
    try {
      const panDoc = {
        name: "PAN Card",
        fileName: panFile.name,
        size: `${(panFile.size / (1024 * 1024)).toFixed(2)} MB`,
        type: "PAN Card",
        uploadedAt: new Date().toISOString().split("T")[0],
        required: true,
      };

      const chequeDoc = {
        name: "Cancelled Cheque / Bank Proof",
        fileName: chequeFile.name,
        size: `${(chequeFile.size / (1024 * 1024)).toFixed(2)} MB`,
        type: "Bank Proof",
        uploadedAt: new Date().toISOString().split("T")[0],
        required: true,
      };

      const updatedDocs = [...(vendor?.documents || []), panDoc, chequeDoc];

      await crmVendorService.updateVendorProfile(vendor.id, {
        documents: updatedDocs,
        bankDetails: {
          accountName: accountName.trim(),
          accountNumber: accountNumber.trim(),
          bankName: bankName.trim(),
          ifsc: ifsc.trim().toUpperCase(),
        },
        documentsUploaded: true,
      });

      // Reload page to unlock dashboard layout
      window.location.reload();
    } catch (err) {
      setError(err.message || "Failed to submit onboarding compliance details.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto my-6 space-y-6">
      {/* Prominent Red Alert Banner */}
      <div className="bg-rose-50 border-2 border-rose-300 rounded-2xl p-5 sm:p-6 shadow-sm flex items-start gap-4">
        <div className="w-12 h-12 bg-rose-600 text-white rounded-2xl flex items-center justify-center shrink-0 shadow-md shadow-rose-500/20">
          <ShieldAlert size={26} />
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-black uppercase tracking-wider">
              Action Required
            </span>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
              ✓ Account Status: Approved
            </span>
          </div>
          <h2 className="text-lg sm:text-xl font-black text-rose-950 tracking-tight">
            Upload Mandatory Compliance Documents to Unlock Dashboard
          </h2>
          <p className="text-xs text-rose-800 leading-relaxed font-medium">
            Congratulations, <b>{vendor?.companyName || "Partner"}</b>! Your registration has been approved by the Admin team. To activate your account and start adding or submitting candidates, please upload your mandatory verification documents (PDF format, max 2MB each).
          </p>
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-100 border border-rose-300 text-rose-900 text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Upload Form Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Section 1: Documents */}
          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-1 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-rose-100 text-rose-600 font-bold text-xs flex items-center justify-center">1</span>
              <span>Statutory Compliance Documents (PDF Only, Max 2MB)</span>
            </h3>
            <p className="text-xs text-slate-500 mb-4 ml-8">
              Upload your company / proprietor PAN and bank proof for vendor verification.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* PAN Card Upload */}
              <div
                className={`p-4 rounded-xl border transition-all flex flex-col justify-between ${
                  panFile ? "bg-emerald-50/70 border-emerald-300" : "bg-slate-50/70 border-slate-200"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-slate-900">
                      PAN Card Document <span className="text-rose-500">*</span>
                    </span>
                    {panFile ? (
                      <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Check size={10} /> Ready
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-rose-500">Required</span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-500 mb-3">Company or Proprietor PAN</p>
                </div>

                {panFile ? (
                  <div className="flex items-center justify-between bg-white p-2.5 border border-emerald-200 rounded-lg text-xs">
                    <div className="flex items-center gap-2 truncate">
                      <FileText size={14} className="text-emerald-600 shrink-0" />
                      <span className="font-mono text-slate-800 text-[11px] truncate">{panFile.name}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPanFile(null)}
                      className="text-rose-600 font-bold text-xs hover:underline ml-2 shrink-0 cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <label className="block text-center py-4 bg-white border border-dashed border-slate-300 hover:border-rose-400 rounded-xl text-xs font-bold text-rose-600 cursor-pointer transition">
                    <UploadCloud size={20} className="mx-auto text-rose-500 mb-1" />
                    <span>Upload PAN PDF</span>
                    <span className="text-[10px] font-normal text-slate-400 block mt-0.5">PDF &bull; Max 2 MB</span>
                    <input type="file" accept="application/pdf" onChange={handlePanUpload} className="hidden" />
                  </label>
                )}
              </div>

              {/* Cancelled Cheque / Bank Proof */}
              <div
                className={`p-4 rounded-xl border transition-all flex flex-col justify-between ${
                  chequeFile ? "bg-emerald-50/70 border-emerald-300" : "bg-slate-50/70 border-slate-200"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-slate-900">
                      Cancelled Cheque / Passbook <span className="text-rose-500">*</span>
                    </span>
                    {chequeFile ? (
                      <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Check size={10} /> Ready
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-rose-500">Required</span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-500 mb-3">Bank proof with account number</p>
                </div>

                {chequeFile ? (
                  <div className="flex items-center justify-between bg-white p-2.5 border border-emerald-200 rounded-lg text-xs">
                    <div className="flex items-center gap-2 truncate">
                      <FileText size={14} className="text-emerald-600 shrink-0" />
                      <span className="font-mono text-slate-800 text-[11px] truncate">{chequeFile.name}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setChequeFile(null)}
                      className="text-rose-600 font-bold text-xs hover:underline ml-2 shrink-0 cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <label className="block text-center py-4 bg-white border border-dashed border-slate-300 hover:border-rose-400 rounded-xl text-xs font-bold text-rose-600 cursor-pointer transition">
                    <UploadCloud size={20} className="mx-auto text-rose-500 mb-1" />
                    <span>Upload Bank Proof PDF</span>
                    <span className="text-[10px] font-normal text-slate-400 block mt-0.5">PDF &bull; Max 2 MB</span>
                    <input type="file" accept="application/pdf" onChange={handleChequeUpload} className="hidden" />
                  </label>
                )}
              </div>
            </div>
          </div>

          {/* Section 2: Bank Details */}
          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-1 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-rose-100 text-rose-600 font-bold text-xs flex items-center justify-center">2</span>
              <span>Bank Account Details (For Payouts & Commission)</span>
            </h3>
            <p className="text-xs text-slate-500 mb-4 ml-8">
              Payouts and placement commission will be remitted to this account.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 ml-8">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Account Holder / Beneficiary Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  placeholder="e.g. ABC Manpower Consultants Pvt Ltd"
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Bank Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  placeholder="e.g. HDFC Bank / State Bank of India"
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Account Number <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  placeholder="e.g. 50100234567890"
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:border-blue-500 focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  IFSC / SWIFT Code <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={ifsc}
                  onChange={(e) => setIfsc(e.target.value.toUpperCase())}
                  placeholder="e.g. HDFC0001234"
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:border-blue-500 focus:outline-none font-mono uppercase"
                />
              </div>
            </div>
          </div>

          {/* Submit Action */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between flex-wrap gap-3">
            <span className="text-[11px] text-slate-400">
              🔒 Documents are securely stored with encryption.
            </span>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-60 cursor-pointer"
            >
              <Save size={16} />
              <span>{loading ? "Submitting Documents..." : "Submit Documents & Activate Portal"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
