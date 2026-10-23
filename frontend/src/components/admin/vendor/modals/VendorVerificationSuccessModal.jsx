import React from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, FileCheck, Mail, ShieldCheck, ArrowRight, X, LayoutDashboard } from "lucide-react";

export default function VendorVerificationSuccessModal({ modalState, onClose, onVerifyDocuments }) {
  if (!modalState?.open) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity duration-300"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-over Right Side Drawer */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl border-l border-slate-200 flex flex-col justify-between transform transition-transform duration-300 ease-in-out animate-in slide-in-from-right">
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-900 text-white flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-300 flex items-center justify-center border border-blue-400/30">
                <CheckCircle2 size={18} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Vendor Verified Successfully</h3>
                <span className="text-[11px] text-blue-300 font-medium">Initial Registration Approved</span>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>

          {/* Drawer Body */}
          <div className="p-5 flex-1 overflow-y-auto space-y-4">
            <div className="p-3.5 bg-blue-50/70 border border-blue-100 rounded-xl space-y-1">
              <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider block">
                Agency Details
              </span>
              <h4 className="text-sm font-bold text-slate-900">{modalState.vendorName}</h4>
              <p className="text-xs text-slate-600 font-mono">ID: {modalState.vendorId}</p>
              <p className="text-xs text-slate-600">Email: {modalState.email || "Registered Vendor Email"}</p>
            </div>

            <div className="space-y-3 text-xs text-slate-700">
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200">
                <FileCheck size={16} className="text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-900 block mb-0.5">Stage 1 Completed: Registration Approved</strong>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Vendor status is updated to <strong>Documents Pending</strong>. The vendor will now sign in to their portal and submit statutory documents.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200">
                <Mail size={16} className="text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-900 block mb-0.5">Portal Notification Dispatched</strong>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Access link and onboarding confirmation have been sent to <strong>{modalState.email || "agency email"}</strong>.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200">
                <ShieldCheck size={16} className="text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-900 block mb-0.5">Next Verification Step</strong>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    This vendor will appear in your Document Verification queue <strong>only after they upload their documents</strong> from the vendor portal.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Controls */}
          <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
            <Link
              to="/admin/vendor/dashboard"
              onClick={onClose}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold transition shadow-2xs cursor-pointer"
            >
              <LayoutDashboard size={14} className="text-blue-600" />
              <span>Go to Dashboard</span>
            </Link>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
            >
              <span>Done</span>
              <ArrowRight size={13} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
