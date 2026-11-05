import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  Users,
  Calendar,
  BarChart3,
  ShieldCheck,
  ArrowRight,
  TrendingUp,
  Sparkles,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext.jsx";
import vendorHRService from "../../services/vendorHRService.js";
import { ImmiGoLogo } from "../../components/common/ImmiGoLogo.jsx";

export default function VendorHRLoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
      const res = await vendorHRService.login(email.trim(), password);
      const token = res?.data?.accessToken || res?.accessToken;
      const user = res?.data?.user || res?.user;

      if (token && user) {
        if (user.permissions) {
          localStorage.setItem("user_permissions", JSON.stringify(user.permissions));
        }
        login(token, user, "HR");
        navigate("/vendor-hr/dashboard", { replace: true });
      } else {
        setError("Login succeeded but session data was incomplete. Please try again.");
      }
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.message ||
        "Invalid credentials. Please verify your Vendor HR account.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-slate-950 font-sans antialiased text-slate-800">
      {/* MOBILE / TABLET TOP BRAND BAR (< lg only) */}
      <div className="lg:hidden w-full bg-[#080D1A] border-b border-slate-800/80 px-4 py-3.5 flex items-center justify-between">
        <ImmiGoLogo size="sm" theme="light" subtitle="Vendor HR Portal" />
        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-400/30">
          Vendor HR
        </span>
      </div>

      {/* LEFT SIDE: HERO & VALUE PROPOSITION (Desktop >= lg) */}
      <div className="hidden lg:flex relative w-1/2 xl:w-[48%] bg-[#080D1A] text-white p-8 xl:p-12 flex-col justify-between overflow-hidden min-h-screen max-h-screen">
        {/* Abstract glowing radial decorations */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-indigo-600/25 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-[480px] h-64 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 right-10 w-2 h-2 rounded-full bg-indigo-400/60 blur-xs" />
        <div className="absolute top-1/4 right-24 w-1.5 h-1.5 rounded-full bg-purple-400/60 blur-xs" />

        {/* Top Brand Logo with official ImmiGoLogo */}
        <div className="relative z-10 flex items-center justify-between">
          <ImmiGoLogo size="md" theme="light" subtitle="Overseas Manpower & Recruitment" showBadge badgeText="Official Portal" />
        </div>

        {/* Center Content */}
        <div className="relative z-10 my-auto py-6 max-w-lg space-y-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/15 border border-blue-400/30 text-blue-300 text-xs font-semibold mb-3">
              <Sparkles size={13} className="text-blue-400" />
              <span>International Workforce Operations</span>
            </div>
            <h1 className="text-3xl xl:text-4xl font-extrabold text-white tracking-tight leading-[1.2]">
              Your hiring journey <br />
              <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">
                starts right here
              </span>
            </h1>
            <p className="mt-3 text-slate-300 text-xs xl:text-sm leading-relaxed">
              Real-time candidate pipelines, interview workflows, document verification, and milestone updates in one unified workspace.
            </p>
          </div>

          {/* Feature List */}
          <div className="space-y-3.5">
            {[
              {
                icon: Users,
                title: "Track Candidates Across Stages",
                desc: "Real-time visibility from screening to visa processing and deployment.",
              },
              {
                icon: Calendar,
                title: "Schedule & Evaluate Interviews",
                desc: "Coordinate technical and client interview rounds seamlessly.",
              },
              {
                icon: BarChart3,
                title: "Monitor Hiring & Milestones",
                desc: "Live database sync on overseas trade targets and project quotas.",
              },
            ].map((f, idx) => {
              const Icon = f.icon;
              return (
                <div key={idx} className="flex items-start space-x-3 group">
                  <div className="w-9 h-9 rounded-xl bg-slate-900/90 border border-indigo-500/30 flex items-center justify-center shrink-0 shadow-md shadow-indigo-950/50">
                    <Icon className="w-4 h-4 text-indigo-400" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-white tracking-tight">{f.title}</h3>
                    <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">{f.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Floating Glassmorphic Progress Card */}
          <div className="inline-flex items-center space-x-4 px-4 py-3 rounded-xl bg-slate-900/70 backdrop-blur-xl border border-indigo-500/25 shadow-xl shadow-indigo-950/60">
            {/* Mini SVG Donut Chart */}
            <div className="relative w-11 h-11 flex items-center justify-center shrink-0">
              <svg className="w-11 h-11 -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-slate-800"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-cyan-400"
                  strokeDasharray="82, 100"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <span className="absolute text-[11px] font-extrabold text-white">82%</span>
            </div>

            <div>
              <div className="text-[10.5px] font-medium text-slate-400">Target Fulfillment Rate</div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs font-bold text-cyan-300">Live Synchronized</span>
                <span className="text-[10px] text-emerald-400 font-semibold flex items-center">
                  <TrendingUp size={11} className="mr-0.5" /> +14%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom subtle note */}
        <div className="relative z-10 text-[11px] text-slate-500 font-medium">
          IMMIGO Enterprise Global Recruitment Portal • Verified Vendor Network
        </div>
      </div>

      {/* RIGHT SIDE: CLEAN LOGIN CARD */}
      <div className="w-full lg:w-1/2 xl:w-[52%] bg-white flex items-center justify-center p-4 sm:p-8 xl:p-12 min-h-screen overflow-y-auto">
        <div className="w-full max-w-md my-auto py-4 space-y-5">
          {/* Official IMMIGO Logo & Header */}
          <div className="text-center space-y-2">
            <div className="flex justify-center mb-1">
              <ImmiGoLogo size="lg" theme="dark" subtitle="Vendor HR Portal" />
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight pt-1">
              Vendor HR Login
            </h2>
            <p className="text-xs text-slate-500">
              Sign in to access your recruitment pipeline and candidate allocations.
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-start space-x-2 animate-in fade-in">
              <span className="text-sm font-bold text-red-500 leading-none">!</span>
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form className="space-y-3.5" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Email Address
              </label>
              <div className="relative rounded-xl">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  className="block w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Password
              </label>
              <div className="relative rounded-xl">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="block w-full pl-10 pr-11 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password Row */}
            <div className="flex items-center justify-between text-xs pt-0.5">
              <label className="flex items-center space-x-2 text-slate-600 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500 cursor-pointer"
                />
                <span>Remember me</span>
              </label>

              <button
                type="button"
                onClick={() => alert("Please contact your Vendor Administrator or Super Admin to reset your credentials.")}
                className="font-medium text-blue-600 hover:text-blue-700 transition cursor-pointer"
              >
                Forgot password?
              </button>
            </div>

            {/* Submit Button */}
            <div className="pt-1.5">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 shadow-md shadow-blue-600/25 disabled:opacity-60 flex items-center justify-center space-x-2 transition cursor-pointer"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Sign in to workspace</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Divider */}
          <div className="relative my-3 text-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <span className="relative bg-white px-3 text-[11px] text-slate-400 font-medium">
              or
            </span>
          </div>

          {/* Security Badge Pill */}
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-center space-x-2 text-slate-600 text-xs font-medium">
            <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
            <span>Secure access for authorized Vendor HR only</span>
          </div>

          {/* Copyright Footer */}
          <div className="text-center pt-2">
            <p className="text-[11px] text-slate-400">
              © 2026 IMMIGO. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

