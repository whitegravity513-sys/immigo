import { useState, useEffect } from "react";
import {
  Mail,
  Lock,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  X,
  ArrowRight,
  RefreshCw,
  ShieldCheck,
  Eye,
  EyeOff,
} from "lucide-react";
import {
  adminForgotPassword,
  adminResetPassword,
  vendorForgotPassword,
  vendorResetPassword,
} from "../../services/authService.js";

export default function ForgotPasswordOtpModal({
  isOpen,
  onClose,
  role = "admin", 
  initialEmail = "",
  onSuccess,
}) {
  const [step, setStep] = useState(1); 
  const [email, setEmail] = useState(initialEmail);
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [infoMsg, setInfoMsg] = useState("");
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setEmail(initialEmail || "");
      setOtp("");
      setNewPassword("");
      setConfirmPassword("");
      setError("");
      setInfoMsg("");
      setCooldown(0);
    }
  }, [isOpen, initialEmail]);

  useEffect(() => {
    let timer;
    if (cooldown > 0) {
      timer = setInterval(() => setCooldown((prev) => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  if (!isOpen) return null;

  const isVendor = role === "vendor";
  const portalName = isVendor ? "Vendor Partner" : "Administrator";

  const handleSendOtp = async (e) => {
    if (e) e.preventDefault();
    setError("");
    setInfoMsg("");

    const cleanInput = email.trim();
    if (!cleanInput) {
      setError(isVendor ? "Please enter your registered email or Vendor ID." : "Please enter your administrator email address.");
      return;
    }

    setLoading(true);
    try {
      let res;
      if (isVendor) {
        res = await vendorForgotPassword(cleanInput);
        if (res.email) setEmail(res.email);
      } else {
        res = await adminForgotPassword(cleanInput);
        if (res.email) setEmail(res.email);
      }

      setInfoMsg(res.message || "A 6-digit OTP code has been sent from abhishekyadav36219@gmail.com.");
      setStep(2);
      setCooldown(60);
    } catch (err) {
      console.error("Forgot password request failed:", err);
      setError(err.response?.data?.message || err.message || "Failed to send verification OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError("");

    const cleanOtp = otp.trim();
    if (!cleanOtp || cleanOtp.length < 4) {
      setError("Please enter the 6-digit OTP code sent to your email.");
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      setError("New password must be at least 6 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("New password and confirm password do not match.");
      return;
    }

    setLoading(true);
    try {
      let res;
      if (isVendor) {
        res = await vendorResetPassword(email, cleanOtp, newPassword);
      } else {
        res = await adminResetPassword(email, cleanOtp, newPassword);
      }

      setStep(3);
      if (onSuccess) {
        onSuccess(email);
      }
    } catch (err) {
      console.error("Reset password failed:", err);
      setError(err.response?.data?.message || err.message || "Failed to reset password. Please check the OTP code.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs select-none">
      <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-200 text-left relative animate-in fade-in zoom-in-95 duration-200">
        {}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
        >
          <X size={18} />
        </button>

        {}
        {step === 1 && (
          <div>
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
              <KeyRound size={24} />
            </div>

            <div className="space-y-1 mb-5">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-black uppercase tracking-wider">
                {portalName} Recovery
              </div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight">Forgot Password?</h3>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                Enter your {isVendor ? "registered email or Vendor ID" : "administrator email"}. We will send a secure 6-digit OTP code from <strong className="text-slate-700">abhishekyadav36219@gmail.com</strong>.
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-start gap-2">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  {isVendor ? "Registered Email or Vendor ID" : "Administrator Email"}
                </label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3.5 top-3 text-slate-400 pointer-events-none" />
                  <input
                    type={isVendor ? "text" : "email"}
                    required
                    autoFocus
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={isVendor ? "e.g. vendor@company.com or VND-1234" : "e.g. admin@vista.com"}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none transition font-medium"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Send Verification OTP</span>
                    <ArrowRight size={15} />
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {}
        {step === 2 && (
          <div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
              <ShieldCheck size={24} />
            </div>

            <div className="space-y-1 mb-5">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase tracking-wider">
                OTP Verification
              </span>
              <h3 className="text-xl font-black text-slate-900 tracking-tight">Enter OTP Code</h3>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                6-digit OTP code sent to <strong className="text-slate-800">{email}</strong> via <strong className="text-blue-600">abhishekyadav36219@gmail.com</strong>.
              </p>
            </div>

            {infoMsg && (
              <div className="mb-3 p-2.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 text-xs font-medium">
                {infoMsg}
              </div>
            )}

            {error && (
              <div className="mb-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-start gap-2">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleResetPassword} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  6-Digit OTP Code
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  autoFocus
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  placeholder="&bull; &bull; &bull; &bull; &bull; &bull;"
                  className="w-full text-center tracking-[8px] font-mono text-lg font-black py-2 bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 rounded-xl text-slate-900 focus:outline-none transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  New Password
                </label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3.5 top-3 text-slate-400 pointer-events-none" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter at least 6 characters"
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none transition font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer p-0.5"
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Confirm New Password
                </label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3.5 top-3 text-slate-400 pointer-events-none" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-type new password"
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none transition font-medium"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-slate-500 hover:text-slate-700 cursor-pointer font-medium hover:underline"
                >
                  Change Email
                </button>

                <button
                  type="button"
                  disabled={cooldown > 0 || loading}
                  onClick={handleSendOtp}
                  className="inline-flex items-center gap-1 text-blue-600 font-bold hover:text-blue-700 disabled:opacity-50 cursor-pointer"
                >
                  <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
                  {cooldown > 0 ? `Resend OTP in ${cooldown}s` : "Resend OTP"}
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer mt-2"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Update Password & Save</span>
                    <CheckCircle2 size={15} />
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {}
        {step === 3 && (
          <div className="text-center py-4 space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 size={36} />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-xl font-black text-slate-900 tracking-tight">Password Reset Complete!</h3>
              <p className="text-xs text-slate-600 max-w-xs mx-auto leading-relaxed">
                Your password has been successfully updated in the database. You can now log into your account using your new credentials.
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition cursor-pointer"
            >
              Sign In Now
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
