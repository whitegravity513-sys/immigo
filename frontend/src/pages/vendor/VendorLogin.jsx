import React, { useState, useEffect, useRef } from "react";
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
  ArrowLeft,
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
import ForgotPasswordOtpModal from "../../components/auth/ForgotPasswordOtpModal.jsx";

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

    const emailInputRef = useRef(null);
  const passwordInputRef = useRef(null);

  useEffect(() => {
    setEmailOrId("");
    setPassword("");
    const clearBrowserAutofill = () => {
      if (emailInputRef.current) {
        const v = String(emailInputRef.current.value || "").trim();
        if (v.toUpperCase().includes("VESTA") || v.toUpperCase().includes("VISTA")) {
          emailInputRef.current.value = "";
          setEmailOrId("");
        }
      }
      if (passwordInputRef.current) {
        const p = String(passwordInputRef.current.value || "").trim();
        if (p.toLowerCase().includes("vesta") || p.toLowerCase().includes("vista") || (emailInputRef.current && !emailInputRef.current.value && p === "12345")) {
          passwordInputRef.current.value = "";
          setPassword("");
        }
      }
    };
    clearBrowserAutofill();
    const interval = setInterval(clearBrowserAutofill, 50);
    const stopTimer = setTimeout(() => clearInterval(interval), 2500);
    return () => {
      clearInterval(interval);
      clearTimeout(stopTimer);
    };
  }, []);

  const [showForgotModal, setShowForgotModal] = useState(false);

  
    const handleQuickFill = () => {
    setEmailOrId("vendor@immigo.com");
    setPassword("12345");
    setError("");
  };

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

  const handleDemoLogin = async () => {
    setError("");
    setLoading(true);
    try {
      const res = await crmVendorService.loginVendor("vendor@immigo.com", "12345");
      login(res.token, { ...res.vendor, role: "vendor" }, "vendor");
      const from = location.state?.from?.pathname || "/vendor/dashboard";
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || "Vendor demo login failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full relative flex flex-col justify-between overflow-x-hidden font-sans select-none bg-slate-100">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat pointer-events-none opacity-90"
        style={{ backgroundImage: `url(${heroTravelerBg})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-white/95 via-white/80 to-blue-900/30 pointer-events-none" />

      <header className="relative z-20 w-full px-6 sm:px-10 lg:px-14 py-3.5 flex items-center justify-between border-b border-blue-800/80 bg-gradient-to-r from-blue-950 via-blue-900 to-indigo-950 text-white shadow-md">
        <div className="flex items-center gap-3">
          <ImmiGoLogo size="sm" theme="light" />
          <span className="hidden sm:inline-block text-xs font-semibold text-indigo-200/80 pl-3 border-l border-indigo-800/60">
            Global Talent. Global Opportunities.
          </span>
        </div>

        <div className="flex items-center gap-4 text-xs font-semibold text-slate-200">
          <div className="hidden md:flex items-center gap-5">
            <span className="flex items-center gap-1.5 hover:text-blue-400 transition cursor-pointer">
              <Globe size={14} className="text-blue-400" /> Work Abroad
            </span>
            <span className="text-slate-700">|</span>
            <span className="flex items-center gap-1.5 hover:text-blue-400 transition cursor-pointer">
              <Users size={14} className="text-blue-400" /> Recruit Talent
            </span>
            <span className="text-slate-700">|</span>
            <span className="flex items-center gap-1.5 hover:text-blue-400 transition cursor-pointer">
              <ShieldCheck size={14} className="text-blue-400" /> Build the Future
            </span>
          </div>

          <Link
            to="/candidate/login"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-blue-500/20 hover:bg-blue-500/30 px-3 py-1.5 rounded-lg border border-blue-400/40 shadow-2xs transition-all cursor-pointer"
            title="Candidate Portal"
          >
            <Users size={13} className="text-blue-300" />
            <span>Candidate Sign In</span>
          </Link>

          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg border border-white/20 shadow-2xs transition-all cursor-pointer"
            title="Return to Main Website"
          >
            <ArrowLeft size={14} className="text-blue-300" />
            <span>Back to Home</span>
          </Link>
        </div>
      </header>

      <main className="relative z-10 w-full flex-1 flex flex-col lg:flex-row items-center justify-between px-4 sm:px-8 lg:px-14 xl:px-16 py-6 sm:py-10 gap-6 lg:gap-8 max-w-7xl mx-auto">
        <div className="w-full lg:w-[54%] flex flex-col justify-between space-y-4 sm:space-y-6 text-left">
          <div className="space-y-3 sm:space-y-4">
            <div className="inline-flex items-center gap-1.5 sm:gap-2 bg-blue-50/90 border border-blue-200 px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-bold text-blue-700 shadow-2xs">
              <Users size={13} className="text-blue-600 shrink-0" />
              <span className="uppercase tracking-wider text-[10px] sm:text-[11px]">INTERNATIONAL HIRING & WORKFORCE SOLUTIONS</span>
            </div>

            <h1 className="text-2xl sm:text-4xl lg:text-[46px] font-bold text-slate-900 leading-[1.18] tracking-tight">
              Supplying Skilled Talent<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600">
                Across Foreign Borders
              </span>
            </h1>

            <p className="text-xs sm:text-sm text-slate-700 font-semibold max-w-xl leading-relaxed">
              Connecting global businesses with verified talent for a stronger, more skilled tomorrow. Fast. Secure. Borderless.
            </p>

            <div className="block lg:hidden w-full my-3">
              <div className="w-full max-w-[440px] bg-white rounded-xl border border-slate-200/90 p-3 text-left shadow-lg relative mx-auto">
                <div className="flex items-center justify-between mb-4">
                  <ImmiGoLogo size="sm" />
                  <span className="px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-[10px] font-semibold uppercase tracking-wider">
                    Vendor Portal
                  </span>
                </div>

                <div className="mb-4 space-y-0.5">
                  <h2 className="text-xl font-bold text-slate-900 tracking-tight">Welcome back</h2>
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
                    ref={passwordInputRef}
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    name="vendor_portal_key"
                    autoComplete="new-password"
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

            <div className="bg-white/95 backdrop-blur-md rounded-xl border border-slate-200/90 shadow-sm p-3 sm:p-4 grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-4 max-w-xl mt-3 sm:mt-4">
              <div className="flex items-center gap-2 sm:gap-2.5">
                <div className="p-1.5 sm:p-2 rounded-xl bg-blue-50 text-blue-600 shrink-0">
                  <Globe size={16} />
                </div>
                <div>
                  <span className="text-sm sm:text-base font-bold text-slate-900 leading-none block">15,000+</span>
                  <span className="text-[9px] sm:text-[10px] text-slate-500 font-medium mt-0.5 block">Global Candidates</span>
                </div>
              </div>

              <div className="flex items-center gap-2 sm:gap-2.5">
                <div className="p-1.5 sm:p-2 rounded-xl bg-blue-50 text-blue-600 shrink-0">
                  <MapPin size={16} />
                </div>
                <div>
                  <span className="text-sm sm:text-base font-bold text-slate-900 leading-none block">50+</span>
                  <span className="text-[9px] sm:text-[10px] text-slate-500 font-medium mt-0.5 block">Countries</span>
                </div>
              </div>

              <div className="flex items-center gap-2 sm:gap-2.5">
                <div className="p-1.5 sm:p-2 rounded-xl bg-blue-50 text-blue-600 shrink-0">
                  <Smile size={16} />
                </div>
                <div>
                  <span className="text-sm sm:text-base font-bold text-slate-900 leading-none block">98.8%</span>
                  <span className="text-[9px] sm:text-[10px] text-slate-500 font-medium mt-0.5 block">Client Satisfaction</span>
                </div>
              </div>

              <div className="flex items-center gap-2 sm:gap-2.5">
                <div className="p-1.5 sm:p-2 rounded-xl bg-blue-50 text-blue-600 shrink-0">
                  <Star size={16} />
                </div>
                <div>
                  <span className="text-sm sm:text-base font-bold text-slate-900 leading-none block">10+</span>
                  <span className="text-[9px] sm:text-[10px] text-slate-500 font-medium mt-0.5 block">Years of Excellence</span>
                </div>
              </div>
            </div>

            {/* Candidate Portal Box - Positioned on the side outside the form */}
            <div className="mt-4 p-3.5 rounded-2xl bg-white/90 backdrop-blur-sm border border-slate-200/90 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 max-w-xl">
              <div>
                <span className="text-[11px] font-semibold text-slate-500 block">
                  Looking for overseas jobs as an individual candidate?
                </span>
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5 mt-0.5">
                  <Users size={13} className="text-blue-600" />
                  <span>Candidate Self-Service Portal</span>
                </span>
              </div>
              <Link
                to="/candidate/login"
                className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-bold border border-blue-200 transition-colors shrink-0"
              >
                <span>Sign In as Candidate</span>
                <ArrowRight size={12} />
              </Link>
            </div>
          </div>
        </div>

        <div className="hidden lg:flex w-full lg:w-[44%] items-center justify-center lg:justify-end">
          <div className="w-full max-w-[440px] bg-white rounded-[28px] shadow-[0_20px_50px_rgba(0,0,0,0.12)] border border-slate-200/90 p-6 sm:p-8 text-left relative">
            <div className="flex items-center justify-between mb-5">
              <ImmiGoLogo size="sm" />
              <span className="px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-[10px] font-semibold uppercase tracking-wider">
                Vendor Portal
              </span>
            </div>

            <div className="mb-6 space-y-1">
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Welcome back</h2>
              <p className="text-xs text-slate-500 font-medium">
                Sign in to manage candidates and manpower submissions.
              </p>
            </div>



            {error && (
              <div className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-start gap-2 animate-shake">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
              <input type="text" style={{ position: "absolute", opacity: 0, height: 0, width: 0, zIndex: -1 }} tabIndex="-1" autoComplete="off" />
              <input type="password" style={{ position: "absolute", opacity: 0, height: 0, width: 0, zIndex: -1 }} tabIndex="-1" autoComplete="off" />
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Registered Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    ref={emailInputRef}
                    type="search"
                    inputMode="email"
                    required
                    value={emailOrId}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val.toUpperCase().includes("VESTA")) {
                        setEmailOrId("");
                        if (emailInputRef.current) emailInputRef.current.value = "";
                        return;
                      }
                      setEmailOrId(val);
                    }}
                    name="vendor_auth_user_direct"
                    autoComplete="one-time-code"
                    autoCorrect="off"
                    autoCapitalize="none"
                    spellCheck="false"
                    placeholder="vendor@immigo.com"
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
                    ref={passwordInputRef}
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    name="vendor_auth_key_direct"
                    autoComplete="new-password"
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

              <div className="pt-1">
                <button
                  type="button"
                  onClick={handleDemoLogin}
                  disabled={loading}
                  className="w-full py-2.5 px-4 rounded-xl border border-dashed border-slate-300 hover:border-blue-500 bg-slate-50 hover:bg-blue-50/70 text-slate-700 hover:text-blue-700 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs active:scale-[0.99] disabled:opacity-60"
                >
                  <Zap size={14} className="text-amber-500 fill-amber-500" />
                  <span>1-Click Demo Login (Vendor)</span>
                </button>
              </div>

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
            </form>
          </div>
        </div>
      </main>

      <footer className="relative z-20 w-full px-6 py-3 text-center border-t border-blue-800/80 bg-gradient-to-r from-blue-950 via-blue-900 to-indigo-950 text-[11px] text-blue-100 font-medium">
        <span>&copy; {new Date().getFullYear()} immiGo</span>
        <span className="mx-2 text-indigo-400/60">&bull;</span>
        <span className="font-bold text-white">Designed by White Gravity Web Solutions</span>
      </footer>

      <ForgotPasswordOtpModal
        isOpen={showForgotModal}
        onClose={() => setShowForgotModal(false)}
        role="vendor"
        initialEmail={emailOrId}
        onSuccess={(verifiedEmail) => {
          setShowForgotModal(false);
          if (verifiedEmail) setEmailOrId(verifiedEmail);
        }}
      />
    </div>
  );
}

export default VendorLogin;
