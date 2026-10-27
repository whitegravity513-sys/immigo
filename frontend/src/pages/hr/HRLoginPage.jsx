import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  Shield,
  Users,
  Calendar,
  UserCheck,
  FileText,
  CheckCircle2,
  Info,
} from "lucide-react";
import hrOfficeBg from "../../assets/hr-portal-office-bg.jpg";
import { adminLogin } from "../../services/authService.js";
import { useAuth } from "../../context/AuthContext.jsx";
import AuthErrorMessage from "../../components/auth/AuthErrorMessage.jsx";
import ForgotPasswordOtpModal from "../../components/auth/ForgotPasswordOtpModal.jsx";
import AuthHeader from "../../components/auth/AuthHeader.jsx";

const HR_DUMMY_CREDENTIALS = [
  {
    role: "HR Manager",
    email: "hr@immigo.com",
    password: "hr123456",
    note: "Workforce & Leaves",
    color: "bg-blue-50 border-blue-200 text-blue-900",
  },
  {
    role: "HR Executive",
    email: "hrexec@immigo.com",
    password: "hr123456",
    note: "Attendance & Records",
    color: "bg-indigo-50 border-indigo-200 text-indigo-900",
  },
];

export default function HRLoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [keepSignedIn, setKeepSignedIn] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [forgotModal, setForgotModal] = useState(false);
  const [resetSuccessNotice, setResetSuccessNotice] = useState(false);
  const [showCredentials, setShowCredentials] = useState(false);

  useEffect(() => {
    if (!error) return;
    const timer = setTimeout(() => setError(""), 6000);
    return () => clearTimeout(timer);
  }, [error]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const cleanId = identifier.trim();
      const hrEmail = cleanId.toLowerCase() === "hr" ? "hr@immigo.com" : cleanId;

      const data = await adminLogin(hrEmail, password);
      const token = data?.accessToken || data?.token;

      if (token) {
        const rawRole = (data.admin?.role || "").toUpperCase().replace(/[\s_-]/g, "");
        const resolvedRole = rawRole === "SUPERADMIN" ? "SUPER_ADMIN" : "HR";
        const adminData = { ...(data.admin || {}), role: resolvedRole };
        if (data.admin?.permissions) {
          localStorage.setItem(
            "user_permissions",
            JSON.stringify(data.admin.permissions)
          );
        }
        login(token, adminData, resolvedRole);

        navigate("/hr/dashboard", { replace: true });
      } else {
        setError("HR authentication failed. Please verify credentials.");
      }
    } catch (err) {
      console.error("HR login error:", err);
      if (err?.code === "ERR_NETWORK" || !err?.response) {
        setError("Connecting to live server. Please retry in a moment.");
      } else {
        setError(
          err.response?.data?.message || "Invalid HR credentials. Please try again."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResetSuccess = () => {
    setForgotModal(false);
    setResetSuccessNotice(true);
    setTimeout(() => setResetSuccessNotice(false), 8000);
  };

  return (
    <div className="h-screen w-screen max-h-screen overflow-hidden relative flex flex-col justify-between font-sans select-none bg-slate-900">
      {/* Background Image - Bright, Warm & Crisp Office Sunset Scene */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat pointer-events-none"
        style={{ backgroundImage: `url(${hrOfficeBg})` }}
      />
      {/* Gentle light scrim purely for text legibility, zero blue overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/25 via-black/5 to-transparent pointer-events-none" />

      {/* Fixed Official ImmiGo AuthHeader */}
      <div className="fixed top-0 inset-x-0 z-30">
        <AuthHeader
          portalBadge="HR Portal"
          rightBadge={
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-blue-900/50 backdrop-blur-md border border-blue-700/60 text-white shadow-xs">
              <ShieldCheck size={14} className="text-cyan-400 shrink-0" />
              <div className="text-left leading-tight hidden xs:block">
                <p className="text-[11px] font-bold text-white">Secure Access</p>
                <p className="text-[9px] text-cyan-200">Your data is safe with us</p>
              </div>
            </div>
          }
        />
      </div>

      {/* Main Content: Hero on Left, Compact Floating Card on Right - Strictly Between Header & Footer */}
      <main className="relative z-10 w-full flex-1 flex items-center justify-center px-4 sm:px-8 lg:px-14 xl:px-16 pt-[52px] pb-[38px] max-w-7xl mx-auto overflow-hidden">
        <div className="w-full flex flex-col lg:flex-row items-center justify-between gap-6 lg:gap-10">
          
          {/* Left Hero Section */}
          <div className="w-full lg:w-[55%] text-left">
            {/* HR Portal Team Badge from Reference Mockup */}
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-xl bg-blue-600/35 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shadow-md shadow-blue-900/40 shrink-0">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                  <circle cx="8" cy="7" r="2.5" />
                  <circle cx="16" cy="7" r="2.5" />
                  <path d="M4 17c0-2.2 2-4 4.5-4s4.5 1.8 4.5 4v1H4v-1z" />
                  <path d="M12.5 17c.3-.8.9-1.5 1.7-2 .6-.4 1.4-.6 2.3-.6 2.5 0 4.5 1.8 4.5 4v1h-8.5v-1z" />
                </svg>
              </div>
              <div>
                <div className="flex items-center gap-1.5 leading-none">
                  <span className="text-white font-extrabold text-sm sm:text-base tracking-tight">
                    HR <span className="text-sky-400">Portal</span>
                  </span>
                </div>
                <p className="text-[8px] text-slate-300 font-medium tracking-wider uppercase mt-0.5">
                  People &bull; Process &bull; Progress
                </p>
              </div>
            </div>

            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-sky-400 drop-shadow-sm mb-1 inline-block">
              WELCOME TO HR PORTAL
            </span>

            <h1 className="text-2xl sm:text-3xl lg:text-[34px] font-extrabold tracking-tight leading-[1.1] text-white">
              Better People. <br />
              <span className="text-sky-400">Stronger Teams.</span>
            </h1>

            <p className="text-xs text-slate-200/90 max-w-md mt-2 mb-4 leading-relaxed font-normal">
              Streamline your HR operations, manage your team and build a better workplace &mdash; all in one place.
            </p>

            {/* 4 Feature Circles in 1 single row */}
            <div className="grid grid-cols-4 gap-2 sm:gap-3 max-w-lg">
              <div className="flex flex-col items-center text-center group cursor-default">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-blue-600/25 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shadow-md shadow-blue-900/30 transition-transform group-hover:scale-105">
                  <Users size={16} className="text-sky-300" />
                </div>
                <span className="text-[10px] font-semibold text-white/90 mt-1.5 leading-tight">
                  Employee<br />Management
                </span>
              </div>

              <div className="flex flex-col items-center text-center group cursor-default">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-blue-600/25 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shadow-md shadow-blue-900/30 transition-transform group-hover:scale-105">
                  <Calendar size={16} className="text-sky-300" />
                </div>
                <span className="text-[10px] font-semibold text-white/90 mt-1.5 leading-tight">
                  Attendance<br />&amp; Leave
                </span>
              </div>

              <div className="flex flex-col items-center text-center group cursor-default">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-blue-600/25 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shadow-md shadow-blue-900/30 transition-transform group-hover:scale-105">
                  <UserCheck size={16} className="text-sky-300" />
                </div>
                <span className="text-[10px] font-semibold text-white/90 mt-1.5 leading-tight">
                  Recruitment<br />&amp; Hiring
                </span>
              </div>

              <div className="flex flex-col items-center text-center group cursor-default">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-blue-600/25 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shadow-md shadow-blue-900/30 transition-transform group-hover:scale-105">
                  <FileText size={16} className="text-sky-300" />
                </div>
                <span className="text-[10px] font-semibold text-white/90 mt-1.5 leading-tight">
                  Reports<br />&amp; Analytics
                </span>
              </div>
            </div>

            {/* Subtle Handwritten Motto */}
            <div className="mt-4 hidden sm:block">
              <span className="text-xs text-sky-200/60 italic font-serif tracking-wide border-b border-sky-400/20 pb-0.5">
                &ldquo;Great People Build Great Companies&rdquo;
              </span>
            </div>
          </div>

          {/* Right Compact Login Card */}
          <div className="w-full lg:w-[45%] flex items-center justify-center lg:justify-end">
            <div className="w-full max-w-[390px] bg-white rounded-[26px] sm:rounded-[30px] shadow-[0_20px_50px_rgba(0,0,0,0.35)] border border-white/90 p-4 sm:p-5 text-left relative overflow-hidden backdrop-blur-md">
              {/* Soft decorative background circles */}
              <div className="absolute -top-10 -left-10 w-28 h-28 bg-blue-100/60 rounded-full blur-2xl pointer-events-none" />
              <div className="absolute -top-10 -right-10 w-28 h-28 bg-sky-100/60 rounded-full blur-2xl pointer-events-none" />

              {/* Centered Team Icon */}
              <div className="relative z-10 text-center">
                <div className="w-9 h-9 mx-auto rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#1d4ed8] shadow-xs">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                    <circle cx="8" cy="7" r="2.5" />
                    <circle cx="16" cy="7" r="2.5" />
                    <path d="M4 17c0-2.2 2-4 4.5-4s4.5 1.8 4.5 4v1H4v-1z" />
                    <path d="M12.5 17c.3-.8.9-1.5 1.7-2 .6-.4 1.4-.6 2.3-.6 2.5 0 4.5 1.8 4.5 4v1h-8.5v-1z" />
                  </svg>
                </div>
                <h2 className="text-xl font-extrabold text-[#0f2744] tracking-tight mt-1.5">
                  HR Portal
                </h2>
                <p className="text-[11px] text-slate-500 font-medium mb-2.5">
                  Sign in to your account
                </p>
              </div>

              {resetSuccessNotice && (
                <div className="mb-2.5 p-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-semibold flex items-center gap-1.5 animate-in fade-in">
                  <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                  <span>Password reset successfully! Please log in with your new password.</span>
                </div>
              )}

              <AuthErrorMessage msg={error} />

              {/* Login Form with Compact Inputs */}
              <form onSubmit={handleSubmit} className="space-y-2.5 relative z-10" autoComplete="off">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail
                      size={14}
                      className="absolute left-3 top-2.5 text-slate-400 pointer-events-none"
                    />
                    <input
                      type="text"
                      required
                      autoFocus
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder="Enter your email or username"
                      className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 hover:border-slate-300 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#1e3a6a] focus:ring-2 focus:ring-blue-500/10 font-medium transition-all shadow-2xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <Lock
                      size={14}
                      className="absolute left-3 top-2.5 text-slate-400 pointer-events-none"
                    />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="w-full pl-9 pr-9 py-2 bg-white border border-slate-200 hover:border-slate-300 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#1e3a6a] focus:ring-2 focus:ring-blue-500/10 font-medium transition-all shadow-2xs"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                    >
                      {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] pt-0">
                  <label className="flex items-center gap-1.5 cursor-pointer text-slate-600 font-medium select-none">
                    <input
                      type="checkbox"
                      checked={keepSignedIn}
                      onChange={(e) => setKeepSignedIn(e.target.checked)}
                      className="w-3.5 h-3.5 rounded text-[#1e3a6a] focus:ring-blue-500 border-slate-300 accent-[#1e3a6a] cursor-pointer"
                    />
                    <span>Remember me</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setForgotModal(true)}
                    className="text-[#1e3a6a] hover:underline font-semibold cursor-pointer bg-transparent border-none p-0 text-[11px]"
                  >
                    Forgot password?
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 px-4 rounded-xl text-white font-bold text-xs bg-[#1e3a6a] hover:bg-[#162d54] shadow-md shadow-blue-950/20 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-1.5 mt-2 disabled:opacity-60"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <ArrowRight size={14} />
                      <span>Sign In</span>
                    </>
                  )}
                </button>
              </form>

              {/* Divider: OR */}
              <div className="flex items-center my-2.5">
                <div className="flex-1 border-t border-slate-200" />
                <span className="px-2.5 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                  OR
                </span>
                <div className="flex-1 border-t border-slate-200" />
              </div>

              {/* Security / Authorized User Notice Box */}
              <div className="bg-blue-50/70 border border-blue-100 rounded-xl p-2.5 flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-white border border-blue-200 flex items-center justify-center text-blue-600 shrink-0 shadow-2xs">
                  <ShieldCheck size={14} />
                </div>
                <div className="text-left leading-tight">
                  <p className="text-[10px] font-bold text-slate-800">
                    Only authorized users can access this portal.
                  </p>
                  <p className="text-[9px] text-slate-500 mt-0.5">
                    Your activity is secure and monitored.
                  </p>
                </div>
              </div>

              {/* Demo Credentials Helper (Collapsible) */}
              <div className="mt-2 border-t border-slate-100 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCredentials(!showCredentials)}
                  className="w-full flex items-center justify-center gap-1.5 py-1.5 px-2.5 bg-slate-50 hover:bg-blue-50/60 border border-dashed border-slate-300 rounded-lg text-[10px] font-bold text-slate-700 hover:text-blue-800 transition-all cursor-pointer"
                >
                  <Info size={12} className="text-blue-600" />
                  <span>{showCredentials ? "Hide" : "Show"} Demo Credentials (HR Staff)</span>
                </button>

                {showCredentials && (
                  <div className="mt-2 space-y-1.5">
                    {HR_DUMMY_CREDENTIALS.map((cred) => (
                      <div
                        key={cred.email}
                        onClick={() => {
                          setIdentifier(cred.email);
                          setPassword(cred.password);
                        }}
                        className={`p-2 rounded-lg border ${cred.color} cursor-pointer hover:shadow-xs transition-all`}
                        title="Click to auto-fill"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-1">
                              <p className="text-[10px] font-bold">{cred.role}</p>
                              <span className="text-[8px] text-blue-600 font-medium">
                                (Click to fill)
                              </span>
                            </div>
                            <p className="text-[9px] font-mono opacity-80">Email: {cred.email}</p>
                            <p className="text-[9px] font-mono opacity-70">Password: {cred.password}</p>
                          </div>
                          <span className="text-[8px] font-bold uppercase tracking-wider bg-white/70 px-1.5 py-0.5 rounded-full shrink-0 shadow-2xs">
                            {cred.note}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Fixed ImmiGo Official Navy Blue Footer */}
      <footer className="fixed bottom-0 inset-x-0 z-30 px-6 py-2 text-center border-t border-blue-900/80 bg-gradient-to-r from-blue-950 via-blue-900 to-indigo-950 text-blue-100 text-[11px] font-medium shadow-md">
        <span>&copy; {new Date().getFullYear()} ImmiGo Global Enterprise</span>
        <span className="mx-2 text-cyan-400">&bull;</span>
        <span className="font-semibold text-cyan-300 tracking-wide">Designed by White Gravity Web Solutions</span>
      </footer>

      {/* Forgot Password Modal */}
      <ForgotPasswordOtpModal
        isOpen={forgotModal}
        onClose={() => setForgotModal(false)}
        role="hr"
        initialEmail="hr@immigo.com"
        onSuccess={handleResetSuccess}
      />
    </div>
  );
}
