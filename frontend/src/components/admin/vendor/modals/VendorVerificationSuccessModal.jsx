import React from "react";
import { CheckCircle2, FileCheck, Mail, ShieldCheck, ArrowRight } from "lucide-react";

export default function VendorVerificationSuccessModal({ modalState, onClose, onVerifyDocuments }) {
  if (!modalState?.open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-emerald-100 text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-100">
          <CheckCircle2 size={32} />
        </div>

        <div>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 mb-2">
            Registration Verified
          </span>
          <h3 className="text-lg font-bold text-slate-900">
            Vendor Verified Successfully
          </h3>
          <p className="text-xs font-semibold text-blue-700 mt-1">
            {modalState.vendorName} ({modalState.vendorId})
          </p>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-left space-y-2 text-xs text-slate-700">
          <div className="flex items-start gap-2">
            <FileCheck size={16} className="text-emerald-600 shrink-0 mt-0.5" />
            <p>
              Status updated to <strong>Documents Pending</strong>. You can now proceed to review and verify compliance documents for this vendor.
            </p>
          </div>
          <div className="flex items-start gap-2">
            <Mail size={16} className="text-blue-600 shrink-0 mt-0.5" />
            <p>
              Portal access link has been dispatched to <strong>{modalState.email || "registered email"}</strong>.
            </p>
          </div>
          <div className="flex items-start gap-2 text-slate-500 text-[11px] bg-white p-2 rounded-lg border border-slate-200">
            <ShieldCheck size={14} className="text-slate-400 shrink-0 mt-0.5" />
            <span>Security Notice: Passwords are not sent via email. Vendor will log in or set password using the portal link.</span>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition cursor-pointer"
          >
            Close
          </button>
          <button
            type="button"
            onClick={() => onVerifyDocuments(modalState.vendorId)}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
          >
            <span>Verify Documents</span>
            <ArrowRight size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}
