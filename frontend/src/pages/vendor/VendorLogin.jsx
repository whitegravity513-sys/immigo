import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  Globe,
  Users,
  ShieldCheck,
  Zap,
  Headphones,
  Star,
  MapPin,
  Smile,
  Calendar,
  Lock,
  Mail,
  ArrowRight,
  AlertCircle,
  Eye,
  EyeOff,
  CheckCircle2,
  X,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext.jsx";
import crmVendorService from "../../services/crmVendorService.js";
import { ImmiGoLogo } from "../../components/common/ImmiGoLogo.jsx";
import heroTravelerBg from "../../assets/immigo-hero-traveler-bg.jpg";

export function VendorLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [emailOrId, setEmailOrId] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSent, setForgotSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!emailOrId.trim()) {
      setError("Please enter your registered Email address.");
      return;
    }

    if (emailOrId.includes("@") && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailOrId.trim())) {
      setError("Please enter a valid email address (e.g. vendor@domain.com).");
      return;
    }

    if (!password) {
      setError("Please enter your password.");
      return;
    }

    setLoading(true);
    try {
      const res = await crmVendorService.loginVendor(emailOrId, password);
      login(res.token, { ...res.vendor, role: "vendor" }, "vendor");

      const from = location.state?.from?.pathname || "/vendor/dashboard";
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || "Failed to authenticate vendor.");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = (email, pwd) => {
    setEmailOrId(email);
    setPassword(pwd);
    setError("");
  };

  const handleForgotSubmit = (e) => {
    e.preventDefault();
    if (!forgotEmail) return;
    setForgotSent(true);
    setTimeout(() => {
      setShowForgotModal(false);
      setForgotSent(false);
      setForgotEmail("");
    }, 2000);
  };

  return (
    <div className="min-h-screen w-full relative flex flex-col justify-between overflow-x-hidden font-sans select-none bg-slate-100">
      {/* Background Airport Image with crisp contrast overlay */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat pointer-events-none opacity-90"
        style={{ backgroundImage: `url(${heroTravelerBg})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-white/95 via-white/80 to-blue-900/30 pointer-events-none" />

      {/* Top Header Bar */}
      <header className="relative z-20 w-full px-6 sm:px-10 lg:px-14 py-3.5 flex items-center justify-between border-b border-blue-800/80 bg-gradient-to-r from-blue-950 via-blue-900 to-indigo-950 text-white shadow-md">
        <div className="flex items-center gap-3">
          <ImmiGoLogo size="sm" theme="light" />
          <span className="hidden sm:inline-block text-xs font-semibold text-indigo-200/80 pl-3 border-l border-indigo-800/60">
            Global Talent. Global Opportunities.
          </span>
        </div>

        <div className="flex items-center gap-5 text-xs font-semibold text-slate-200">
          <span className="hidden md:flex items-center gap-1.5 hover:text-blue-400 transition cursor-pointer">
            <Globe size={14} className="text-blue-400" /> Work Abroad
          </span>
          <span className="hidden md:inline text-slate-700">|</span>
          <span className="hidden md:flex items-center gap-1.5 hover:text-blue-400 transition cursor-pointer">
            <Users size={14} className="text-blue-400" /> Recruit Talent
          </span>
          <span className="hidden md:inline text-slate-700">|</span>
          <span className="hidden sm:flex items-center gap-1.5 hover:text-blue-400 transition cursor-pointer">
            <ShieldCheck size={14} className="text-blue-400" /> Build the Future
          </span>
        </div>
      </header>

      {/* Main Body Grid: Hero Content Left + Vendor Login Card Right */}
      <main className="relative z-10 w-full flex-1 flex flex-col lg:flex-row items-center justify-between px-4 sm:px-8 lg:px-14 xl:px-16 py-6 sm:py-10 gap-6 lg:gap-8 max-w-7xl mx-auto">
        {/* Left Hero Content */}
        <div className="w-full lg:w-[54%] flex flex-col justify-between space-y-4 sm:space-y-6 text-left">
          <div className="space-y-3 sm:space-y-4">
            {/* Top Pill Badge */}
            <div className="inline-flex items-center gap-1.5 sm:gap-2 bg-blue-50/90 border border-blue-200 px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-bold text-blue-700 shadow-2xs">
              <Users size={13} className="text-blue-600 shrink-0" />
              <span className="uppercase tracking-wider text-[10px] sm:text-[11px]">INTERNATIONAL HIRING & WORKFORCE SOLUTIONS</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-2xl sm:text-4xl lg:text-[50px] font-black text-slate-900 leading-[1.15] tracking-tight">
              Supplying Skilled Talent<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600">
                Across Foreign Borders
              </span>
            </h1>

            {/* Description */}
            <p className="text-xs sm:text-sm text-slate-700 font-semibold max-w-xl leading-relaxed">
              Connecting global businesses with verified talent for a stronger, more skilled tomorrow. Fast. Secure. Borderless.
            </p>

            {/* MOBILE ONLY: Login Card right after Description! */}
            <div className="block lg:hidden w-full my-3">
              <div className="w-full max-w-[440px] bg-white rounded-2xl border border-slate-200/90 p-5 text-left shadow-lg relative mx-auto">
                <div className="flex items-center justify-between mb-4">
                  <ImmiGoLogo size="sm" />
                  <span className="px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-[10px] font-black uppercase tracking-wider">
                    Vendor Portal
                  </span>
                </div>

                <div className="mb-4 space-y-0.5">
                  <h2 className="text-xl font-black text-slate-900 tracking-tight">Welcome back</h2>
                  <p className="text-xs text-slate-500 font-medium">
                    Sign in to manage candidates and manpower submissions.
                  </p>
                </div>

                {error && (
                  <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-start gap-2">
                    <AlertCircle size={16} className="shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Registered Email Address
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        required
                        value={emailOrId}
                        onChange={(e) => setEmailOrId(e.target.value)}
                        placeholder="vendor@example.com"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white font-medium transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your password"
                        className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white font-medium transition"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-1"
                      >
                        {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-0.5">
                    <label className="flex items-center gap-2 text-slate-600 cursor-pointer font-medium">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                      />
                      <span>Remember me</span>
                    </label>

                    <button
                      type="button"
                      onClick={() => setShowForgotModal(true)}
                      className="font-bold text-blue-600 hover:text-blue-700 cursor-pointer hover:underline"
                    >
                      Forgot Password?
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all duration-150 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-70 mt-1"
                  >
                    {loading ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>Sign In to Vendor Portal</span>
                        <ArrowRight size={15} />
                      </>
                    )}
                  </button>

                  <div className="text-center pt-2.5 border-t border-slate-100 text-xs text-slate-500">
                    <span>Don't have a vendor account? </span>
                    <Link
                      to="/vendor/register"
                      className="font-bold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1 hover:underline"
                    >
                      <span>Register Agency</span>
                      <ArrowRight size={12} />
                    </Link>
                  </div>
                </form>
              </div>
            </div>

            {/* 4 Feature Pills Row */}
            <div className="flex flex-wrap items-center gap-2 pt-1 sm:pt-2 max-w-xl">
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl bg-purple-50/90 border border-purple-200 text-[11px] sm:text-xs font-bold text-purple-900 shadow-2xs">
                <span className="p-1 rounded-lg bg-purple-100 text-purple-700 shrink-0">
                  <Users size={13} />
                </span>
                <span>Global Talent Access</span>
              </div>

              <div className="flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl bg-blue-50/90 border border-blue-200 text-[11px] sm:text-xs font-bold text-blue-900 shadow-2xs">
                <span className="p-1 rounded-lg bg-blue-100 text-blue-700 shrink-0">
                  <ShieldCheck size={13} />
                </span>
                <span>Trusted & Compliant Process</span>
              </div>

              <div className="flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl bg-purple-50/90 border border-purple-200 text-[11px] sm:text-xs font-bold text-purple-900 shadow-2xs">
                <span className="p-1 rounded-lg bg-purple-100 text-purple-700 shrink-0">
                  <Zap size={13} />
                </span>
                <span>Fast-Track Visa</span>
              </div>

              <div className="flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl bg-blue-50/90 border border-blue-200 text-[11px] sm:text-xs font-bold text-blue-900 shadow-2xs">
                <span className="p-1 rounded-lg bg-blue-100 text-blue-700 shrink-0">
                  <Headphones size={13} />
                </span>
                <span>End-to-End Support</span>
              </div>
            </div>

            {/* Bottom Statistics Card */}
            <div className="bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200/90 shadow-sm p-3 sm:p-4 grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-4 max-w-xl mt-3 sm:mt-4">
              <div className="flex items-center gap-2 sm:gap-2.5">
                <div className="p-1.5 sm:p-2 rounded-xl bg-blue-50 text-blue-600 shrink-0">
                  <Globe size={16} />
                </div>
                <div>
                  <span className="text-sm sm:text-base font-black text-slate-900 leading-none block">15,000+</span>
                  <span className="text-[9px] sm:text-[10px] text-slate-500 font-semibold mt-0.5 block">Global Candidates</span>
                </div>
              </div>

              <div className="flex items-center gap-2 sm:gap-2.5">
                <div className="p-1.5 sm:p-2 rounded-xl bg-blue-50 text-blue-600 shrink-0">
                  <MapPin size={16} />
                </div>
                <div>
                  <span className="text-sm sm:text-base font-black text-slate-900 leading-none block">50+</span>
                  <span className="text-[9px] sm:text-[10px] text-slate-500 font-semibold mt-0.5 block">Countries</span>
                </div>
              </div>

              <div className="flex items-center gap-2 sm:gap-2.5">
                <div className="p-1.5 sm:p-2 rounded-xl bg-blue-50 text-blue-600 shrink-0">
                  <Smile size={16} />
                </div>
                <div>
                  <span className="text-sm sm:text-base font-black text-slate-900 leading-none block">98.8%</span>
                  <span className="text-[9px] sm:text-[10px] text-slate-500 font-semibold mt-0.5 block">Client Satisfaction</span>
                </div>
              </div>

              <div className="flex items-center gap-2 sm:gap-2.5">
                <div className="p-1.5 sm:p-2 rounded-xl bg-blue-50 text-blue-600 shrink-0">
                  <Star size={16} />
                </div>
                <div>
                  <span className="text-sm sm:text-base font-black text-slate-900 leading-none block">10+</span>
                  <span className="text-[9px] sm:text-[10px] text-slate-500 font-semibold mt-0.5 block">Years of Excellence</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Floating Vendor Login Card (DESKTOP ONLY) */}
        <div className="hidden lg:flex w-full lg:w-[44%] items-center justify-center lg:justify-end">
          <div className="w-full max-w-[440px] bg-white rounded-[28px] shadow-[0_20px_50px_rgba(0,0,0,0.12)] border border-slate-200/90 p-6 sm:p-8 text-left relative">
            {/* Top Logo & Vendor Portal Pill Badge */}
            <div className="flex items-center justify-between mb-5">
              <ImmiGoLogo size="sm" />
              <span className="px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-[10px] font-black uppercase tracking-wider">
                Vendor Portal
              </span>
            </div>

            {/* Title & Subtitle */}
            <div className="mb-6 space-y-1">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Welcome back</h2>
              <p className="text-xs text-slate-500 font-medium">
                Sign in to manage candidates and manpower submissions.
              </p>
            </div>

            {/* Alert / Error Message */}
            {error && (
              <div className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-start gap-2 animate-shake">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Registered Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={emailOrId}
                    onChange={(e) => setEmailOrId(e.target.value)}
                    placeholder="vendor@example.com"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white font-medium transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white font-medium transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-1"
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {/* Remember me & Forgot Password */}
              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center gap-2 text-slate-600 cursor-pointer font-medium">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                  />
                  <span>Remember me</span>
                </label>

                <button
                  type="button"
                  onClick={() => setShowForgotModal(true)}
                  className="font-bold text-blue-600 hover:text-blue-700 cursor-pointer hover:underline"
                >
                  Forgot Password?
                </button>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all duration-150 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-70 mt-2"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Sign In to Vendor Portal</span>
                    <ArrowRight size={15} />
                  </>
                )}
              </button>

              {/* Register Link */}
              <div className="text-center pt-3 border-t border-slate-100 text-xs text-slate-500">
                <span>Don't have a vendor account? </span>
                <Link
                  to="/vendor/register"
                  className="font-bold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1 hover:underline"
                >
                  <span>Register Agency</span>
                  <ArrowRight size={12} />
                </Link>
              </div>

              {/* Demo Account Fill Helper */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                <span>Demo Account:</span>
                <button
                  type="button"
                  onClick={() => handleQuickDemo("vendor@abcmanpower.com", "Password@123")}
                  className="font-bold text-slate-600 hover:text-blue-600 underline cursor-pointer"
                >
                  Fill ABC Manpower Demo
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>

      {/* Bottom Footer */}
      <footer className="relative z-20 w-full px-6 py-3 text-center border-t border-blue-800/80 bg-gradient-to-r from-blue-950 via-blue-900 to-indigo-950 text-[11px] text-blue-100 font-medium">
        <span>&copy; {new Date().getFullYear()} immiGo</span>
        <span className="mx-2 text-indigo-400/60">&bull;</span>
        <span className="font-bold text-white">Designed by White Gravity Web Solutions</span>
      </footer>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">Reset Vendor Password</h3>
              <button
                type="button"
                onClick={() => setShowForgotModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X size={18} />
              </button>
            </div>

            {forgotSent ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-bold text-center space-y-1">
                <CheckCircle2 size={24} className="mx-auto text-emerald-600 mb-1" />
                <p>Password reset link sent to your registered email!</p>
              </div>
            ) : (
              <form onSubmit={handleForgotSubmit} className="space-y-3">
                <p className="text-xs text-slate-500">
                  Enter your registered vendor email address below to receive password recovery instructions.
                </p>
                <input
                  type="email"
                  required
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="vendor@company.com"
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600"
                />
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(false)}
                    className="px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-bold shadow-2xs hover:bg-blue-700"
                  >
                    Send Reset Link
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default VendorLogin;
