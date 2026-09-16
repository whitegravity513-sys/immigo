 import React from "react";
import { Mail, ArrowRight, ShieldCheck, KeyRound } from "lucide-react";
import { useAdminOTP } from "../../hooks/useAdminOTP";

function AdminOTP({
  email,
  tempOtp: initialTempOtp,
  onVerifySuccess,
  onBack,
  onResend,
  errorMsg,
  setErrorMsg,
  successMsg,
  setSuccessMsg,
  loading,
  setLoading
}) {
  const {
    otpDigits,
    resendTimer,
    otpRefs,
    handleOtpChange,
    handleOtpKeyDown,
    handleOtpPaste,
    handleOtpVerifySubmit,
    handleResendClick,
    formatTimer
  } = useAdminOTP(email, onVerifySuccess, onResend, setErrorMsg, setSuccessMsg, setLoading);

  return (
    <>
      {/* Large Shield Check Icon */}
      <div className="w-20 h-20 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-green-50/50">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
  <div className="w-14 h-14 bg-green-600 rounded-full flex items-center justify-center">
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
      <path
        d="M12 22C12 22 20 18 20 12V5L12 2L4 5V12C4 18 12 22 12 22Z"
        stroke="white"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9 11L11 13L15 9"
        stroke="white"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  </div>
</div>
      </div>

      <div className="text-center mb-2">
        <span className="inline-block px-3 py-1 bg-slate-100 text-slate-600 text-[10px] font-bold rounded-full uppercase tracking-wider">Step 2 of 2</span>
      </div>
      
      <h2 className="text-2xl font-extrabold text-slate-800 text-center mb-1">Verify <span className="text-green-600 font-black">Admin OTP</span></h2>
      <p className="text-slate-500 text-sm text-center mb-6">
        Enter the 6-digit code sent to your registered email address.
      </p>

      <div className="space-y-4">
        {errorMsg && (
          <div className="flex items-center gap-2 p-4 bg-rose-50 border border-rose-100 text-rose-700 rounded-2xl text-sm">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            <span>{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="flex items-center gap-2 p-4 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-2xl text-sm">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            <span>{successMsg}</span>
          </div>
        )}


        <form onSubmit={handleOtpVerifySubmit} className="space-y-4">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block text-left">
            Enter 6-digit OTP
          </label>
          
          <div className="flex justify-between gap-2 my-2" onPaste={handleOtpPaste}>
            {otpDigits.map((digit, idx) => (
              <input
                key={idx}
                ref={otpRefs[idx]}
                type="text"
                maxLength="1"
                className={`w-12 h-12 text-center text-lg font-bold border-2 rounded-xl transition-all focus:outline-hidden focus:bg-white text-slate-800 ${digit ? "bg-white border-blue-500 ring-2 ring-blue-500/20" : "bg-slate-50 border-slate-200 focus:border-blue-500"}`}
                value={digit}
                onChange={(e) => handleOtpChange(idx, e.target.value)}
                onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                required
              />
            ))}
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
            <div className="flex items-center gap-1 shrink overflow-hidden text-ellipsis">
              <Mail size={14} className="text-slate-400 shrink-0" />
              <span className="truncate">
                Sent to <strong className="text-green-600">{email}</strong>
              </span>
            </div>
            <div className="shrink-0">
              {resendTimer > 0 ? (
                <span className="text-slate-400 font-medium">
                  Resend ({formatTimer(resendTimer)})
                </span>
              ) : (
                <button
                  type="button"
                  className="text-blue-600 hover:text-green-700 font-bold transition-colors cursor-pointer"
                  onClick={handleResendClick}
                  disabled={loading}
                >
                  Resend OTP
                </button>
              )}
            </div>
          </div>

          <button type="submit" className="w-full py-3.5 bg-green-600 hover:bg-green-700 active:bg-green-800 text-white font-semibold rounded-2xl shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed text-sm" disabled={loading}>
            <ShieldCheck size={16} />
            {loading ? "Verifying..." : "Verify & Continue"}
            <ArrowRight size={16} />
          </button>
        </form>

        <div className="flex items-center justify-center gap-1.5 text-xs text-slate-400 font-medium mt-6">
          <KeyRound size={14} />
          <span>This is a secure admin verification process</span>
        </div>
      </div>
    </>
  );
}

export default AdminOTP;
