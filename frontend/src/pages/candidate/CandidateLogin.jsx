import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ImmiGoLogo } from "../../components/common/ImmiGoLogo.jsx";
import { useAuth } from "../../context/useAuth.js";
import apiClient from "../../services/apiClient.js";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Building2,
  Clock,
  XCircle,
  ShieldCheck,
  Plane,
  FileCheck,
  CheckCircle2,
  Sparkles,
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
    <div className="min-h-screen w-full relative flex flex-col justify-between overflow-x-hidden font-sans bg-gradient-to-br from-[#f0f4f9] via-[#e8f0fe] to-[#edf3fa] text-slate-800">
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-300/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-96 h-96 bg-indigo-300/20 rounded-full blur-3xl pointer-events-none" />

      <header className="relative z-20 w-full px-4 sm:px-8 lg:px-12 py-3 flex items-center justify-between border-b border-blue-900/60 bg-gradient-to-r from-blue-950 via-blue-900 to-indigo-950 text-white shadow-xs shrink-0">
        <div className="flex items-center gap-3">
          <Link to="/" className="inline-block">
            <ImmiGoLogo size="sm" theme="light" />
          </Link>
          <span className="hidden sm:inline-block text-xs font-semibold text-blue-200 pl-3 border-l border-blue-800">
            Candidate Career & Deployment Portal
          </span>
        </div>

        <div className="flex items-center gap-3 text-xs font-semibold text-slate-200">
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-900/80 border border-blue-700/60 text-cyan-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Secure Candidate Gateway</span>
          </div>
          <span className="text-blue-800 hidden sm:inline">|</span>
          <Link
            to="/"
            className="flex items-center gap-1 text-blue-200 hover:text-white font-bold transition"
          >
            <ArrowLeft size={13} />
            <span>Back to Home</span>
          </Link>
        </div>
      </header>

      <main className="relative z-10 w-full flex-1 max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 py-8 flex flex-col lg:flex-row items-center justify-between gap-10">
        <div className="w-full lg:w-[54%] space-y-6 text-left">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-600/10 border border-blue-600/25 text-blue-700 text-xs font-bold shadow-2xs">
            <Sparkles size={13} className="text-blue-600" />
            <span>Global Manpower Supply & Deployment Network</span>
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Track Your International <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-700 via-indigo-600 to-cyan-600">
                Deployment & Visa Journey
              </span>
            </h1>
            <p className="text-sm text-slate-600 leading-relaxed max-w-xl">
              Access your verified overseas application file, monitor technical trade tests, review milestone processing, and check your flight mobilization schedule in real-time.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-2">
            <div className="p-4 rounded-2xl bg-white/90 backdrop-blur-xs border border-blue-200/80 shadow-xs hover:border-blue-400 hover:shadow-md transition space-y-2">
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <Plane className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-xs text-slate-900 leading-snug">
                Visa Allotment & Permits
              </h3>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Track employment visa references, entry permits, and passport attestation status.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white/90 backdrop-blur-xs border border-indigo-200/80 shadow-xs hover:border-indigo-400 hover:shadow-md transition space-y-2">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                <FileCheck className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-xs text-slate-900 leading-snug">
                Deployment Milestones
              </h3>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Step-by-step transparency from trade test verification to medical clearance.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white/90 backdrop-blur-xs border border-emerald-200/80 shadow-xs hover:border-emerald-400 hover:shadow-md transition space-y-2">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-xs text-slate-900 leading-snug">
                Accredited Sponsors
              </h3>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Direct integration with licensed recruitment agencies and authorized UAE & GCC employers.
              </p>
            </div>
          </div>

          <div className="pt-2 flex items-center gap-6 text-xs font-semibold text-slate-600 flex-wrap">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 size={14} className="text-emerald-600" />
              <span>10,000+ Specialists Deployed</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 size={14} className="text-blue-600" />
              <span>100% Verified Trade Testing</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 size={14} className="text-indigo-600" />
              <span>GCC Embassy Cleared</span>
            </div>
          </div>
        </div>

        <div className="w-full lg:w-[42%] flex justify-center">
          <div className="w-full max-w-[440px] bg-white rounded-3xl shadow-[0_20px_50px_rgba(20,50,90,0.12)] border border-slate-200/90 p-6 sm:p-8 text-left space-y-5">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                  Candidate Access
                </span>
                <span className="text-[11px] font-medium text-slate-400">Step 1 of 1</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                Sign In to Your File
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Enter your registered email and credentials to track your overseas deployment.
              </p>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-start gap-2 animate-in fade-in">
                <AlertCircle size={15} className="shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {statusNotice && (
              <div
                className={`p-3.5 rounded-xl border space-y-1 text-xs ${
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

            <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Registered Email Address *
                </label>
                <div className="relative">
                  <Mail
                    size={15}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                  />
                  <input
                    type="email"
                    required
                    autoFocus
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="candidate@example.com"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 bg-slate-50/50 focus:bg-white text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 font-medium transition outline-none"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700">
                    Password *
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-[11px] font-bold text-blue-600 hover:text-blue-800 cursor-pointer flex items-center gap-1"
                  >
                    {showPassword ? <EyeOff size={12} /> : <Eye size={12} />}
                    <span>{showPassword ? "Hide" : "Show"}</span>
                  </button>
                </div>
                <div className="relative">
                  <Lock
                    size={15}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                  />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 bg-slate-50/50 focus:bg-white text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 font-medium transition outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center text-xs text-slate-600 font-medium">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                  />
                  <span>Remember my login on this device</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-6 rounded-xl bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-800 hover:to-indigo-800 active:scale-[0.99] text-white font-bold text-xs sm:text-sm shadow-md shadow-blue-700/20 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Sign In to Candidate Portal</span>
                    <ArrowRight size={14} />
                  </>
                )}
              </button>

              <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-200/80 text-[11px] text-slate-600 space-y-0.5">
                <span className="font-bold text-blue-900 block">Candidate Account Provisioning:</span>
                <p className="leading-relaxed">
                  Candidate logins are generated directly by your sponsoring recruitment agency. If you do not have your credentials, contact your agency recruiter.
                </p>
              </div>

              <div className="pt-2 border-t border-slate-100 text-center">
                <span className="text-[11px] text-slate-400 block mb-1">
                  Recruitment Agency or Manpower Supplier?
                </span>
                <Link
                  to="/vendor/login"
                  className="inline-flex items-center justify-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-800 hover:underline"
                >
                  <Building2 size={13} />
                  <span>Vendor Agency Portal Sign In</span>
                  <ArrowRight size={12} />
                </Link>
              </div>
            </form>
          </div>
        </div>
      </main>

      <footer className="relative z-20 w-full px-6 py-2.5 text-center border-t border-blue-900/80 bg-gradient-to-r from-blue-950 via-blue-900 to-indigo-950 text-blue-100 text-[11px] font-medium shadow-md shrink-0">
        <span>&copy; {new Date().getFullYear()} ImmiGo Global Enterprise</span>
        <span className="mx-2 text-cyan-400">&bull;</span>
        <span className="font-semibold text-cyan-300 tracking-wide">Designed by White Gravity Web Solutions</span>
      </footer>
    </div>
  );
}
