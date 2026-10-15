import React from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, ShieldCheck, ArrowRight } from "lucide-react";

export function VendorRegisterSuccess({ vendorName, email }) {
  return (
    <div className="text-center py-6 space-y-4">
      <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-200 shadow-xs">
        <CheckCircle2 size={30} />
      </div>

      <div className="space-y-1">
        <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
          Registration Submitted
        </span>
        <h2 className="text-xl font-bold text-slate-900">
          Application Received
        </h2>
        <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
          Thank you, <strong className="text-slate-900">{vendorName}</strong>. Your agency profile has been submitted for review. Upon verification, your portal access confirmation will be sent to <strong className="text-slate-900">{email}</strong>.
        </p>
      </div>

      <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-left text-xs text-slate-700 max-w-md mx-auto space-y-1.5">
        <div className="flex items-center gap-1.5 text-slate-900 font-semibold">
          <ShieldCheck size={14} className="text-blue-600" />
          <span>Next Steps</span>
        </div>
        <p className="text-[11px] text-slate-600 leading-normal">
          Our administrative compliance team will verify your agency credentials. Passwords are never sent via plain email. Once approved, use your registered credentials to sign in and upload your compliance documents.
        </p>
      </div>

      <div className="pt-2">
        <Link
          to="/login"
          className="inline-flex items-center gap-1.5 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs transition"
        >
          <span>Go to Login</span>
          <ArrowRight size={13} />
        </Link>
      </div>
    </div>
  );
}

export default VendorRegisterSuccess;
