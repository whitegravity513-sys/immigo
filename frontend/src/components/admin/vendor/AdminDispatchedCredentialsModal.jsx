import React from "react";
import { CheckCircle2, Check, Copy } from "lucide-react";

export function AdminDispatchedCredentialsModal({
  dispatchedVendor,
  onClose,
  copiedLink,
  copyVendorLoginUrl,
}) {
  if (!dispatchedVendor) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 text-center space-y-5 relative animate-in fade-in zoom-in duration-200">
        <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
          <CheckCircle2 size={36} />
        </div>

        <div className="space-y-1">
          <h3 className="text-xl font-black text-slate-900 tracking-tight">
            Vendor Account Created & Credentials Dispatched! 🎉
          </h3>
          <p className="text-xs text-slate-500 font-medium max-w-md mx-auto">
            Login ID, Password, and direct portal access link have been dispatched to:
          </p>
          <p className="text-sm font-extrabold text-blue-700 underline">
            {dispatchedVendor.email}
          </p>
        </div>

        {}
        <div className="bg-slate-50/90 rounded-2xl border border-slate-200 p-4 text-left text-xs space-y-3">
          <div className="flex justify-between items-center border-b border-slate-200 pb-2">
            <span className="text-slate-500 font-semibold">Agency Name:</span>
            <span className="font-bold text-slate-900">{dispatchedVendor.companyName}</span>
          </div>

          <div className="flex justify-between items-center border-b border-slate-200 pb-2">
            <span className="text-slate-500 font-semibold">Vendor ID:</span>
            <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
              {dispatchedVendor.id}
            </span>
          </div>

          <div className="flex justify-between items-center border-b border-slate-200 pb-2">
            <span className="text-slate-500 font-semibold">Login Password:</span>
            <span className="font-mono font-bold text-slate-900 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
              {dispatchedVendor.password || "Password@123"}
            </span>
          </div>

          <div>
            <span className="text-slate-500 font-semibold block mb-1">Vendor Portal URL:</span>
            <div className="flex items-center gap-2 bg-white p-2 rounded-xl border border-slate-200">
              <span className="font-mono text-[11px] text-slate-700 truncate flex-1">
                {dispatchedVendor.loginUrl || `${window.location.origin}/vendor/login`}
              </span>
              <button
                type="button"
                onClick={() =>
                  copyVendorLoginUrl(
                    dispatchedVendor.loginUrl || `${window.location.origin}/vendor/login`
                  )
                }
                className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold text-[10px] transition cursor-pointer flex items-center gap-1 shrink-0"
              >
                {copiedLink ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                <span>{copiedLink ? "Copied!" : "Copy URL"}</span>
              </button>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-md transition cursor-pointer"
        >
          Done & View Vendor List
        </button>
      </div>
    </div>
  );
}
