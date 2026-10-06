import { ShieldAlert, X } from "lucide-react";

export default function ForgotPasswordModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-sm w-full shadow-2xl border border-slate-200 text-left relative">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
        >
          <X size={18} />
        </button>

        <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#1877f2] flex items-center justify-center mb-4">
          <ShieldAlert size={24} />
        </div>

        <h3 className="text-lg font-black text-slate-900 tracking-tight">Forgot Password?</h3>
        <p className="text-xs text-slate-500 font-medium mt-1 leading-relaxed">
          For security and audit compliance, password resets are processed by system administrators.
        </p>

        <div className="mt-4 p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-700 space-y-1.5">
          <div className="font-bold text-slate-900">IT Helpdesk Contact:</div>
          <div>Email: <span className="font-semibold text-[#1877f2]">it-support@immigo.com</span></div>
          <div>Internal Extension: <span className="font-semibold text-slate-900">Ext. 4040</span></div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full mt-5 py-2.5 bg-[#1877f2] hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition cursor-pointer"
        >
          Got it
        </button>
      </div>
    </div>
  );
}
