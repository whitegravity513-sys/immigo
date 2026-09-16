import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import {
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  CheckCircle,
  AlertCircle,
  User
} from "lucide-react";
import "../../AuthPages.css";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000/api";

function EmployeeLogin({ onLoginSuccess }) {
  const navigate = useNavigate();

  // Form states
  const [employeeId, setEmployeeId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Common UI states
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Clear alerts after timeout
  useEffect(() => {
    if (errorMsg) {
      const t = setTimeout(() => setErrorMsg(""), 6000);
      return () => clearTimeout(t);
    }
  }, [errorMsg]);

  useEffect(() => {
    if (successMsg) {
      const t = setTimeout(() => setSuccessMsg(""), 6000);
      return () => clearTimeout(t);
    }
  }, [successMsg]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");
    try {
      const res = await axios.post(`${API_BASE}/auth/employee/login`, {
        employeeId: employeeId.trim(),
        password,
      });
      const data = res.data;
      
      setSuccessMsg("Welcome back! Login successful.");
      if (onLoginSuccess) {
        onLoginSuccess(data.token, { ...data.employee, role: "employee" }, "employee");
      }
      navigate("/employee/dashboard");
    } catch (err) {
      setErrorMsg(err.response?.data?.message || "Invalid Employee ID or password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 relative overflow-hidden font-sans">
      
      {/* Background Decor */}
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* Grid Pattern */}
      <div 
        className="absolute inset-0 opacity-[0.02] pointer-events-none"
        style={{ backgroundImage: `radial-gradient(#000 1px, transparent 1px)`, backgroundSize: `24px 24px` }}
      ></div>

      <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200/80 shadow-2xl p-8 relative z-10 flex flex-col">
        
        {/* Brand Header */}
        <div className="flex items-center justify-center gap-2 mb-8 font-sans font-bold text-slate-800 text-lg">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-white font-black text-sm shadow-xs">
            V
          </div>
          <span>VESTA HRMS</span>
        </div>

        {/* User Avatar Graphic */}
        <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-4 relative">
          <User size={32} className="text-emerald-600" />
          <div className="absolute -bottom-1 -right-1 bg-emerald-600 text-white p-1 rounded-lg border-2 border-white shadow-xs">
            <ShieldCheck size={12} />
          </div>
        </div>

        <h2 className="text-2xl font-extrabold text-slate-800 text-center mb-1">Employee <span className="text-emerald-600 font-black">Login</span></h2>
        <p className="text-slate-500 text-sm text-center mb-6">
          Enter your assigned credentials to access your dashboard.
        </p>

        <div className="space-y-4">
          {errorMsg && (
            <div className="flex items-center gap-2 p-4 bg-rose-50 border border-rose-100 text-rose-700 rounded-2xl text-sm font-medium">
              <AlertCircle size={16} className="shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
          {successMsg && (
            <div className="flex items-center gap-2 p-4 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-2xl text-sm font-medium">
              <CheckCircle size={16} className="shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                Employee ID
              </label>
              <div className="relative flex items-center">
                <User size={18} className="absolute left-3.5 text-slate-400" />
                <input
                  type="text"
                  className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 rounded-xl pl-10 pr-4 py-3 text-slate-800 placeholder-slate-400 text-sm font-medium transition-all outline-none"
                  placeholder="e.g. VESTA-001"
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  required
                  autoComplete="username"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                Password
              </label>
              <div className="relative flex items-center">
                <Lock size={18} className="absolute left-3.5 text-slate-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 rounded-xl pl-10 pr-10 py-3 text-slate-800 placeholder-slate-400 text-sm font-medium transition-all outline-none"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="absolute right-3.5 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs mt-1">
              <label className="flex items-center gap-2 text-slate-600 cursor-pointer font-medium hover:text-slate-800 transition-colors">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500/20 cursor-pointer transition-colors"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span>Remember me</span>
              </label>
              <span className="text-slate-500 hover:text-emerald-600 font-medium transition-colors cursor-pointer">
                Forgot password?
              </span>
            </div>

            <button 
              type="submit" 
              className="w-full mt-2 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-emerald-600/20 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col items-center gap-2 text-center">
            <Link
              to="/admin/login"
              className="text-xs font-semibold text-slate-500 hover:text-emerald-600 transition-colors"
            >
              Are you an Administrator? <span className="underline decoration-slate-300 underline-offset-2">Admin Portal</span>
            </Link>
            <span className="text-[10px] font-medium text-slate-400 mt-2">
              © {new Date().getFullYear()} VESTA Solutions Inc. All rights reserved.
            </span>
          </div>

        </div>
      </div>
    </div>
  );
}

export default EmployeeLogin;
