import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ImmiGoLogo } from "../../components/common/ImmiGoLogo.jsx";
import AuthLandscapeBackground from "../../components/common/AuthLandscapeBackground.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import apiClient from "../../services/apiClient.js";
import employeeVectorHd from "../../assets/employee-vector-hd.jpg";
import {
  Mail,
  Eye,
  EyeOff,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Building2,
  Clock,
  XCircle,
  Key,
  Zap,
} from "lucide-react";

export default function CandidateLogin() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [statusNotice, setStatusNotice] = useState(null);

  const handleDemoLogin = async () => {
    setErrorMsg("");
    setStatusNotice(null);
    setLoading(true);
    try {
      const res = await apiClient.post("/auth/candidate/login", {
        email: "candidate@immigo.com",
        password: "Password@123",
      });
      if (res.data?.success) {
        login(res.data.token, res.data.candidate, "candidate");
        navigate("/candidate/dashboard");
      } else {
        setErrorMsg("Candidate demo login failed.");
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || "Demo login failed.");
    } finally {
      setLoading(false);
    }
  };



  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setStatusNotice(null);

    const cleanEmail = String(email || "").trim();
    if (!cleanEmail || !password) {
      setErrorMsg("Please enter both email and password.");
      return;
    }

    setLoading(true);
    try {
      const res = await apiClient.post("/auth/candidate/login", {
        email: cleanEmail,
        password,
      });

      if (res.data?.success) {
        login(res.data.token, res.data.candidate, "candidate");
        navigate("/candidate/dashboard");
      }
    } catch (err) {
      const data = err.response?.data;
      if (data?.accountStatus === "Pending Approval") {
        setStatusNotice({
          type: "pending",
          title: "Account Pending Approval",
          message:
            "Your registration has been submitted successfully and is currently under review by our administrative team. You will receive an email notification once your account is reviewed.",
        });
      } else if (data?.accountStatus === "Rejected") {
        setStatusNotice({
          type: "rejected",
          title: "Registration Not Approved",
          message:
            data.message ||
            "Your candidate registration was not approved. Please contact our support team if you believe this was in error.",
        });
      } else {
        setErrorMsg(data?.message || "Invalid email or password. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen max-h-screen w-full relative flex flex-col justify-between overflow-hidden font-sans select-none bg-[#daf0f9]">
      {/* Landscape SVG Background */}
      <AuthLandscapeBackground />

      {/* Top Header Bar */}
      <header className="relative z-20 w-full px-6 sm:px-12 py-3 flex items-center justify-between border-b border-sky-200/70 bg-white/70 backdrop-blur-md shrink-0 shadow-2xs">
        <div className="flex items-center gap-3">
          <Link to="/" className="inline-block">
            <ImmiGoLogo size="sm" />
          </Link>
          <span className="text-xs font-semibold text-slate-500 pl-3 border-l border-sky-200">
            Candidate Self-Service Portal
          </span>
        </div>

        <div className="flex items-center gap-3 text-xs font-semibold text-slate-600">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            <span>Job Seeker Portal</span>
          </div>
          <span className="text-slate-300">|</span>
          <Link
            to="/"
            className="flex items-center gap-1 text-slate-600 hover:text-slate-900 font-bold transition"
          >
            <ArrowLeft size={13} />
            <span>Back to Home</span>
          </Link>
        </div>
      </header>

      {/* Main Two-Column Container */}
      <main className="relative z-10 w-full flex-1 flex flex-col lg:flex-row items-center justify-between px-6 sm:px-10 lg:px-16 xl:px-24 py-2 min-h-0 overflow-hidden">
        {/* Left: Illustration Graphic */}
        <div className="hidden lg:flex w-full lg:w-[50%] xl:w-[52%] h-full items-center justify-center lg:justify-end select-none pointer-events-none pr-0 lg:pr-8 xl:pr-12">
          <div className="relative w-full max-w-[480px] xl:max-w-[560px] flex items-center justify-center">
            <img
              src={employeeVectorHd}
              alt="Candidate Career Portal"
              className="w-full max-h-[78vh] object-contain drop-shadow-[0_20px_45px_rgba(30,70,110,0.18)]"
            />
          </div>
        </div>

        {/* Right: Modern Form Card */}
        <div className="w-full lg:w-[50%] xl:w-[48%] h-full flex items-center justify-center lg:justify-start pl-0 lg:pl-8 xl:pl-12">
          <div className="w-full max-w-[430px] sm:max-w-[450px] bg-white rounded-[32px] sm:rounded-[36px] shadow-[0_25px_60px_rgba(20,60,100,0.14)] border border-white/90 p-7 sm:p-9 text-left relative">
            {/* Header */}
            <div className="mb-4 space-y-1">
              <h1 className="text-2xl sm:text-[28px] font-bold text-[#261b4d] tracking-tight leading-tight">
                Welcome To Family
              </h1>
              <p className="text-xs text-slate-400 font-medium leading-relaxed">
                Log in to check your application status & visa schedule.
              </p>
            </div>

            {/* Error Message */}
            {errorMsg && (
              <div className="mb-4 p-2.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-start gap-2 animate-in fade-in">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Status Notice (Pending / Rejected) */}
            {statusNotice && (
              <div
                className={`mb-4 p-3.5 rounded-2xl border space-y-1 text-xs ${
                  statusNotice.type === "pending"
                    ? "bg-amber-50 border-amber-200 text-amber-900"
                    : "bg-rose-50 border-rose-200 text-rose-900"
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold">
                  {statusNotice.type === "pending" ? (
                    <Clock size={15} className="text-amber-600 shrink-0" />
                  ) : (
                    <XCircle size={15} className="text-rose-600 shrink-0" />
                  )}
                  <span>{statusNotice.title}</span>
                </div>
                <p className="text-[11px] leading-relaxed opacity-90">
                  {statusNotice.message}
                </p>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-3.5" autoComplete="off">
              {/* Hidden dummy inputs to trap browser autofill */}
              <input type="text" style={{ position: "absolute", opacity: 0, height: 0, width: 0, zIndex: -1 }} tabIndex="-1" autoComplete="off" />
              <input type="password" style={{ position: "absolute", opacity: 0, height: 0, width: 0, zIndex: -1 }} tabIndex="-1" autoComplete="off" />
              {/* Email Address */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail
                    size={16}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"
                  />
                  <input
                    type="email"
                    required
                    autoFocus
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. rahul@example.com"
                    className="w-full pl-11 pr-4 py-3 rounded-full border border-slate-300 focus:border-[#3b2875] focus:ring-2 focus:ring-[#3b2875]/10 bg-white text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 font-medium transition outline-none shadow-2xs"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 cursor-pointer p-0.5"
                    title={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full pl-11 pr-4 py-3 rounded-full border border-slate-300 focus:border-[#3b2875] focus:ring-2 focus:ring-[#3b2875]/10 bg-white text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 font-medium transition outline-none shadow-2xs"
                  />
                </div>
              </div>

              {/* Remember Me */}
              <div className="flex items-center text-xs pt-0.5 px-1 text-slate-400 font-medium">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-3.5 h-3.5 rounded-full border-slate-300 text-[#3b2875] focus:ring-[#3b2875]"
                  />
                  <span>Remember me</span>
                </label>
              </div>

              {/* Login Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-6 rounded-full bg-[#3b2875] hover:bg-[#2d1e5d] active:scale-[0.99] text-white font-bold text-sm tracking-wide shadow-md shadow-indigo-950/20 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60 mt-2"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <span>Login</span>
                )}
              </button>

              <div className="pt-1">
                <button
                  type="button"
                  onClick={handleDemoLogin}
                  disabled={loading}
                  className="w-full py-2.5 px-4 rounded-full border border-dashed border-[#3b2875]/40 hover:border-[#3b2875] bg-purple-50/70 hover:bg-purple-100/70 text-[#3b2875] text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs active:scale-[0.99] disabled:opacity-60"
                >
                  <Zap size={14} className="text-amber-500 fill-amber-500" />
                  <span>1-Click Demo Login (Candidate)</span>
                </button>
              </div>

              {/* Registration Link */}
              <div className="pt-2 text-center text-xs text-slate-500">
                <span>New job seeker? </span>
                <Link
                  to="/register"
                  className="font-bold text-[#3b2875] hover:underline"
                >
                  Register here
                </Link>
              </div>

              {/* Vendor Agency Link */}
              <div className="pt-2 border-t border-dashed border-slate-200 text-center">
                <span className="text-[11px] text-slate-400 block mb-1">
                  Recruitment Agency or Manpower Vendor?
                </span>
                <Link
                  to="/vendor/login"
                  className="inline-flex items-center justify-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-800 hover:underline"
                >
                  <Building2 size={13} />
                  <span>Vendor Agency Login</span>
                  <ArrowRight size={12} />
                </Link>
              </div>
            </form>
          </div>
        </div>
      </main>

      {/* Navy Blue Footer */}
      <footer className="relative z-20 w-full px-6 py-2.5 text-center border-t border-blue-900/80 bg-gradient-to-r from-blue-950 via-blue-900 to-indigo-950 text-blue-100 text-[11px] font-medium shadow-md shrink-0">
        <span>&copy; {new Date().getFullYear()} ImmiGo Global Enterprise</span>
        <span className="mx-2 text-cyan-400">&bull;</span>
        <span className="font-semibold text-cyan-300 tracking-wide">Designed by White Gravity Web Solutions</span>
      </footer>
    </div>
  );
}
