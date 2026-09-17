import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Shield,
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Globe,
  ShieldCheck,
  Users,
  Zap,
  Headphones,
  LogIn,
  ArrowRight,
  Smile,
  Star,
  ChevronDown,
  AlertCircle,
  Building,
} from "lucide-react";
import { ImmiGoLogo } from "../components/common/ImmiGoLogo.jsx";
import { adminLogin, employeeLogin } from "../services/authService.js";
import heroTravelerBg from "../assets/immigo-hero-traveler-bg.jpg";
import globePinIllustration from "../assets/immigo-globe-pin.jpg";

export default function UnifiedLogin({ onLoginSuccess }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const roleQuery = searchParams.get("role") || searchParams.get("tab");
  const [role, setRole] = useState(roleQuery === "admin" ? "admin" : "employee");

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [keepSignedIn, setKeepSignedIn] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [forgotModal, setForgotModal] = useState(false);

  // Sync role with query parameters
  useEffect(() => {
    if (roleQuery && (roleQuery === "admin" || roleQuery === "employee") && roleQuery !== role) {
      setRole(roleQuery);
    }
  }, [roleQuery, role]);

  const handleRoleChange = (newRole) => {
    setRole(newRole);
    setError("");
    setSearchParams({ role: newRole }, { replace: true });
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (role === "admin") {
        const data = await adminLogin(identifier.trim(), password);
        const token = data?.accessToken || data?.token;
        if (token && onLoginSuccess) {
          onLoginSuccess(token, { ...data.admin, role: "admin" }, "admin");
        } else {
          setError("Admin authentication failed. Please verify your credentials.");
        }
      } else {
        const data = await employeeLogin(identifier.trim(), password);
        const token = data?.token || data?.accessToken;
        if (token && onLoginSuccess) {
          onLoginSuccess(token, { ...data.employee, role: "employee" }, "employee");
        } else {
          setError("Employee authentication failed. Please verify your credentials.");
        }
      }
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          `Invalid ${role} credentials. Please check your username/password and try again.`
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full relative flex flex-col justify-between overflow-x-hidden font-sans select-none bg-slate-50">
      {/* 100% Razor-Sharp Ultra-HD Background without any milky or blurry filter */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat pointer-events-none"
        style={{ backgroundImage: `url(${heroTravelerBg})` }}
      />

      {/* Top Header Bar */}
      <header className="relative z-20 w-full px-6 sm:px-10 lg:px-14 py-3.5 flex items-center justify-between border-b border-slate-200/70 bg-white/80 backdrop-blur-md shadow-2xs">
        <div className="flex items-center gap-3">
          <ImmiGoLogo size="sm" />
          <span className="hidden sm:inline-block text-[11px] font-semibold text-slate-600 pl-3 border-l border-slate-300">
            Global Talent. Global Opportunities.
          </span>
        </div>

        {/* Center/Right Nav Links */}
        <div className="flex items-center gap-4 sm:gap-6 text-xs font-semibold text-slate-700">
          <div className="hidden md:flex items-center gap-5">
            <span className="flex items-center gap-1.5 hover:text-blue-600 transition cursor-pointer">
              <Globe size={14} className="text-[#1877f2]" /> Work Abroad
            </span>
            <span className="text-slate-300 font-light">|</span>
            <span className="flex items-center gap-1.5 hover:text-blue-600 transition cursor-pointer">
              <Users size={14} className="text-[#1877f2]" /> Recruit Talent
            </span>
            <span className="text-slate-300 font-light">|</span>
            <span className="flex items-center gap-1.5 hover:text-blue-600 transition cursor-pointer">
              <ShieldCheck size={14} className="text-[#1877f2]" /> Build the Future
            </span>
          </div>

          {/* Language Selector */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 shadow-2xs cursor-pointer">
            <Globe size={13} className="text-slate-500" />
            <span>English</span>
            <ChevronDown size={13} className="text-slate-400" />
          </div>
        </div>
      </header>

      {/* Hand-drawn motivational callout in clear view */}
      <div className="hidden xl:block absolute left-[43%] top-[22%] -rotate-6 select-none pointer-events-none z-10">
        <span className="font-serif italic font-bold text-xl text-[#1877f2] tracking-wide drop-shadow-sm block">
          Your Global<br />Career Starts Here
        </span>
        <svg width="52" height="26" viewBox="0 0 52 26" fill="none" className="text-[#1877f2] ml-6 mt-0.5">
          <path d="M4 22 C 20 24, 38 18, 46 4" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
          <path d="M40 4 L 46 4 L 46 10" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      {/* Main Content Area */}
      <main className="relative z-10 w-full flex-1 flex flex-col lg:flex-row items-center justify-between px-6 sm:px-10 lg:px-14 xl:px-18 py-6 sm:py-8 gap-8">
        
        {/* Left Hero Area with High Contrast & Crystal-Clear Readability */}
        <div className="w-full lg:w-[55%] flex flex-col justify-between text-left space-y-6">
          <div className="space-y-4">
            {/* Pill Badge */}
            <div className="inline-flex items-center gap-2 bg-white/95 backdrop-blur-md border border-blue-200/80 px-3.5 py-1.5 rounded-full text-xs font-bold text-blue-900 shadow-xs">
              <span className="w-2.5 h-2.5 rounded-full bg-[#1877f2] animate-pulse" />
              <span>International Hiring &amp; Workforce Solutions</span>
            </div>

            {/* Headline */}
            <h1 className="text-3xl sm:text-5xl lg:text-[50px] font-black text-slate-900 leading-[1.12] tracking-tight drop-shadow-xs">
              Supplying Skilled Talent<br />
              <span className="text-[#1877f2]">Across Foreign Borders</span>
            </h1>

            {/* Subtitle */}
            <p className="text-sm sm:text-base text-slate-700 font-semibold max-w-xl leading-relaxed drop-shadow-xs">
              Connecting global businesses with verified talent for a stronger, more skilled tomorrow.
              Fast. Secure. Borderless.
            </p>

            {/* 4 Feature Cards (2x2 Grid) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl pt-2">
              {/* Card 1 */}
              <div className="flex items-center gap-3 bg-white/95 backdrop-blur-md p-3 rounded-2xl border border-white/90 shadow-sm">
                <div className="w-9 h-9 rounded-full bg-[#1877f2] flex items-center justify-center text-white shrink-0 shadow-sm shadow-blue-500/30">
                  <Users size={17} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 leading-tight">
                    Global Talent Access
                  </h4>
                  <p className="text-[10px] text-slate-600 font-medium leading-tight mt-0.5">
                    Skilled professionals from around the world
                  </p>
                </div>
              </div>

              {/* Card 2 */}
              <div className="flex items-center gap-3 bg-white/95 backdrop-blur-md p-3 rounded-2xl border border-white/90 shadow-sm">
                <div className="w-9 h-9 rounded-full bg-[#0284c7] flex items-center justify-center text-white shrink-0 shadow-sm shadow-sky-500/30">
                  <ShieldCheck size={17} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 leading-tight">
                    Trusted &amp; Compliant
                  </h4>
                  <p className="text-[10px] text-slate-600 font-medium leading-tight mt-0.5">
                    Secure, transparent and globally compliant
                  </p>
                </div>
              </div>

              {/* Card 3 */}
              <div className="flex items-center gap-3 bg-white/95 backdrop-blur-md p-3 rounded-2xl border border-white/90 shadow-sm">
                <div className="w-9 h-9 rounded-full bg-[#2563eb] flex items-center justify-center text-white shrink-0 shadow-sm shadow-blue-600/30">
                  <Zap size={17} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 leading-tight">
                    Fast-Track Visa
                  </h4>
                  <p className="text-[10px] text-slate-600 font-medium leading-tight mt-0.5">
                    Verified documentation for quicker processing
                  </p>
                </div>
              </div>

              {/* Card 4 */}
              <div className="flex items-center gap-3 bg-white/95 backdrop-blur-md p-3 rounded-2xl border border-white/90 shadow-sm">
                <div className="w-9 h-9 rounded-full bg-[#1d4ed8] flex items-center justify-center text-white shrink-0 shadow-sm shadow-blue-700/30">
                  <Headphones size={17} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 leading-tight">
                    End-to-End Support
                  </h4>
                  <p className="text-[10px] text-slate-600 font-medium leading-tight mt-0.5">
                    From hiring to onboarding &amp; beyond
                  </p>
                </div>
              </div>
            </div>

            {/* Stat Counters Pill Container */}
            <div className="bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200/90 shadow-sm p-3.5 flex flex-wrap items-center justify-between gap-4 max-w-xl">
              <div className="flex items-center gap-2">
                <Globe size={18} className="text-[#1877f2]" />
                <div>
                  <div className="text-base font-black text-slate-900 leading-none">15,000+</div>
                  <div className="text-[10px] text-slate-600 font-medium mt-0.5">Global Workforce</div>
                </div>
              </div>

              <div className="hidden sm:block w-px h-7 bg-slate-200" />

              <div className="flex items-center gap-2">
                <Building size={18} className="text-[#1877f2]" />
                <div>
                  <div className="text-base font-black text-slate-900 leading-none">50+</div>
                  <div className="text-[10px] text-slate-600 font-medium mt-0.5">Countries</div>
                </div>
              </div>

              <div className="hidden sm:block w-px h-7 bg-slate-200" />

              <div className="flex items-center gap-2">
                <Smile size={18} className="text-[#1877f2]" />
                <div>
                  <div className="text-base font-black text-slate-900 leading-none">98.8%</div>
                  <div className="text-[10px] text-slate-600 font-medium mt-0.5">Client Satisfaction</div>
                </div>
              </div>

              <div className="hidden sm:block w-px h-7 bg-slate-200" />

              <div className="flex items-center gap-2">
                <Star size={18} className="text-[#1877f2]" />
                <div>
                  <div className="text-base font-black text-slate-900 leading-none">10+</div>
                  <div className="text-[10px] text-slate-600 font-medium mt-0.5">Years of Excellence</div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Trust Tagline */}
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-800 pt-2 drop-shadow-2xs">
            <ShieldCheck size={16} className="text-[#1877f2]" />
            <span>Your Global Recruitment Partner</span>
            <span className="text-slate-400">&bull;</span>
            <span>Skilled People</span>
            <span className="text-slate-400">&bull;</span>
            <span>Stronger Businesses</span>
            <span className="text-slate-400">&bull;</span>
            <span>A Global Future</span>
          </div>
        </div>

        {/* Right Column: Floating Login Card in ALL-BLUE Theme */}
        <div className="w-full lg:w-[44%] flex items-center justify-center lg:justify-end">
          <div className="w-full max-w-[430px] bg-white rounded-[32px] shadow-[0_25px_60px_rgba(0,0,0,0.12)] border border-slate-200/90 p-6 sm:p-8 text-left relative">
            
            {/* Top Brand Header inside Card with Globe Vector Badge */}
            <div className="flex items-center justify-between mb-5">
              <div>
                <ImmiGoLogo size="sm" />
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">
                  Access Your Global Workforce
                </p>
              </div>

              {/* Globe, Airplane in Orbit & Location Pin Illustration */}
              <div className="w-20 h-20 sm:w-24 sm:h-24 -mr-2 -mt-2 shrink-0 select-none pointer-events-none">
                <img
                  src={globePinIllustration}
                  alt="Global Workforce"
                  className="w-full h-full object-contain mix-blend-multiply"
                />
              </div>
            </div>

            {/* Portal Heading */}
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              {role === "admin" ? "Admin Portal" : "Employee Portal"}
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5 mb-4">
              Sign in to access your immiGo workspace
            </p>

            {/* Pill Role Switcher */}
            <div className="bg-[#f1f5f9] p-1 rounded-xl flex items-center mb-4 border border-slate-200/70">
              <button
                type="button"
                onClick={() => handleRoleChange("admin")}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  role === "admin"
                    ? "bg-[#1877f2] text-white shadow-sm shadow-blue-500/20"
                    : "text-slate-600 hover:text-slate-900 bg-transparent"
                }`}
              >
                <Shield size={14} /> Admin
              </button>
              <button
                type="button"
                onClick={() => handleRoleChange("employee")}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  role === "employee"
                    ? "bg-[#1877f2] text-white shadow-sm shadow-blue-500/20"
                    : "text-slate-600 hover:text-slate-900 bg-transparent"
                }`}
              >
                <User size={14} /> Employee
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-3.5 p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-xl flex items-center gap-2">
                <AlertCircle size={14} className="shrink-0 text-rose-600" />
                <span>{error}</span>
              </div>
            )}

            {/* Sign In Form */}
            <form onSubmit={handleLoginSubmit} className="space-y-3.5">
              {/* Field 1 */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {role === "admin" ? "Admin Official Email" : "Official Email or Employee ID"}
                </label>
                <div className="relative">
                  <Mail
                    size={16}
                    className="absolute left-3.5 top-3 text-slate-400 pointer-events-none"
                  />
                  <input
                    type="text"
                    required
                    autoFocus
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder={role === "admin" ? "admin@company.com" : "e.g. EMP001"}
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 hover:border-slate-300 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#1877f2] focus:ring-2 focus:ring-blue-500/10 transition-all font-medium"
                  />
                </div>
              </div>

              {/* Field 2 */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock
                    size={16}
                    className="absolute left-3.5 top-3 text-slate-400 pointer-events-none"
                  />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-200 hover:border-slate-300 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#1877f2] focus:ring-2 focus:ring-blue-500/10 transition-all font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                    title={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Keep me signed in & Forgot Password */}
              <div className="flex items-center justify-between text-xs pt-0.5">
                <label className="flex items-center gap-2 cursor-pointer text-slate-600 font-medium select-none">
                  <input
                    type="checkbox"
                    checked={keepSignedIn}
                    onChange={(e) => setKeepSignedIn(e.target.checked)}
                    className="w-4 h-4 rounded text-[#1877f2] focus:ring-blue-500 border-slate-300 accent-[#1877f2] cursor-pointer"
                  />
                  <span>Keep me signed in</span>
                </label>
                <button
                  type="button"
                  onClick={() => setForgotModal(true)}
                  className="text-[#1877f2] hover:underline font-semibold cursor-pointer"
                >
                  Forgot Password?
                </button>
              </div>

              {/* Main Submit Button in Royal Blue */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-[#1877f2] hover:bg-blue-700 active:scale-[0.99] text-white font-bold rounded-xl text-sm shadow-md shadow-blue-500/25 transition-all cursor-pointer flex items-center justify-center gap-2 mt-2 disabled:opacity-60"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <LogIn size={15} />
                    <span>Sign In</span>
                    <ArrowRight size={15} />
                  </>
                )}
              </button>
            </form>

            {/* OR Divider */}
            <div className="relative my-3.5 flex items-center justify-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <span className="relative bg-white px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                OR
              </span>
            </div>

            {/* Secondary Portal Access Outlined Button */}
            <div>
              <button
                type="button"
                onClick={() => handleRoleChange(role === "admin" ? "employee" : "admin")}
                className="w-full py-2.5 bg-white hover:bg-blue-50/60 text-[#1877f2] border border-blue-200/90 font-bold rounded-xl text-xs transition shadow-2xs flex items-center justify-center gap-2 cursor-pointer"
              >
                {role === "admin" ? (
                  <>
                    <User size={14} />
                    <span>Sign In to Employee Portal</span>
                  </>
                ) : (
                  <>
                    <Shield size={14} />
                    <span>Sign In to Management Access</span>
                  </>
                )}
              </button>
            </div>

            {/* Enterprise Security Bottom Pill */}
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-center gap-1.5 text-[10px] text-slate-500 font-medium text-center">
              <ShieldCheck size={13} className="text-[#1877f2] shrink-0" />
              <span>Enterprise Security &bull; ISO 27001 Certified &bull; Anti-Bribery Compliant</span>
            </div>
          </div>
        </div>
      </main>

      {/* Forgot Password Modal */}
      {forgotModal && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setForgotModal(false)}
        >
          <div
            className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#1877f2] flex items-center justify-center mx-auto shadow-xs">
              <Lock size={22} />
            </div>
            <h3 className="text-base font-black text-slate-800">Account Recovery</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Please contact your corporate administrator or IT operations team to initiate a password
              reset for your immiGo account.
            </p>
            <div className="bg-slate-50 p-3 rounded-xl text-xs text-slate-700 font-semibold border border-slate-200">
              Support Desk: <span className="text-[#1877f2]">admin@company.com</span>
            </div>
            <button
              onClick={() => setForgotModal(false)}
              className="w-full py-2.5 bg-[#1877f2] text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition cursor-pointer"
            >
              Back to Sign In
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
