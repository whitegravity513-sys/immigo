import React from "react";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { useAdminLogin } from "../../hooks/useAdminLogin";

function AdminLogin({ onLoginSuccess }) {
  const {
    email,
    setEmail,
    password,
    setPassword,
    showPassword,
    setShowPassword,
    rememberMe,
    setRememberMe,
    loading,
    errorMsg,
    successMsg,
    handleCredentialsSubmit
  } = useAdminLogin(onLoginSuccess);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 relative overflow-hidden font-sans">
  
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl"></div>

    
      <div className="absolute top-4 right-4 opacity-50 hidden md:block">
        <svg width="60" height="60" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="5" cy="5" r="2" fill="#cbd5e1" />
          <circle cx="20" cy="5" r="2" fill="#cbd5e1" />
          <circle cx="35" cy="5" r="2" fill="#cbd5e1" />
          <circle cx="50" cy="5" r="2" fill="#cbd5e1" />
          <circle cx="5" cy="20" r="2" fill="#cbd5e1" />
          <circle cx="20" cy="20" r="2" fill="#cbd5e1" />
          <circle cx="35" cy="20" r="2" fill="#cbd5e1" />
          <circle cx="50" cy="20" r="2" fill="#cbd5e1" />
          <circle cx="5" cy="35" r="2" fill="#cbd5e1" />
          <circle cx="20" cy="35" r="2" fill="#cbd5e1" />
          <circle cx="35" cy="35" r="2" fill="#cbd5e1" />
          <circle cx="50" cy="35" r="2" fill="#cbd5e1" />
          <circle cx="5" cy="50" r="2" fill="#cbd5e1" />
          <circle cx="20" cy="50" r="2" fill="#cbd5e1" />
          <circle cx="35" cy="50" r="2" fill="#cbd5e1" />
          <circle cx="50" cy="50" r="2" fill="#cbd5e1" />
        </svg>
      </div>

      <div className="absolute bottom-4 left-4 opacity-40 hidden md:block">
        <svg width="120" height="150" viewBox="0 0 120 150" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M60 90C45 60 40 40 50 10C55 40 70 60 60 90Z" fill="#10B981" />
          <path d="M60 90C30 75 20 60 10 35C30 50 45 70 60 90Z" fill="#059669" />
          <path d="M60 90C90 75 100 60 110 35C90 50 75 70 60 90Z" fill="#34D399" />
          <path d="M40 90H80L72 140H48L40 90Z" fill="#e2e8f0" />
          <ellipse cx="60" cy="90" rx="20" ry="4" fill="#cbd5e1" />
        </svg>
      </div>

      <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200/80 shadow-2xl p-8 relative overflow-hidden z-10">
        <div className="flex flex-col">
          <div className="flex items-center justify-center gap-2 mb-8 font-sans font-bold text-slate-800 text-lg">
            <svg width="36" height="36" viewBox="0 0 128 128" fill="none" xmlns="http://www.w3.org/2000/svg" >
                <g stroke="#16A34A" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" ><line x1="64" y1="12" x2="64" y2="116"/> <line x1="12" y1="64" x2="116" y2="64"/> <path d="M42 24 A32 32 0 0 1 86 24"/> <path d="M104 42 A32 32 0 0 1 104 86"/> <path d="M86 104 A32 32 0 0 1 42 104"/> <path d="M24 86 A32 32 0 0 1 24 42"/> </g>
            </svg>
            <span>VESTA CRM</span>
          </div>

          <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4 relative">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 12C14.7614 12 17 9.76142 17 7C17 4.23858 14.7614 2 12 2C9.23858 2 7 4.23858 7 7C7 9.76142 9.23858 12 12 12Z" fill="#128a46"/>
              <path d="M12 14C7.58 14 4 17.58 4 22H20C20 17.58 16.42 14 12 14Z" fill="#73dc8d"/>
            </svg>
            <div className="absolute -bottom-1 -right-1 bg-green-600 text-white p-1 rounded-lg border-2 border-white shadow-xs">
              <ShieldCheck size={12} />
            </div>
          </div>

          <h2 className="text-2xl font-extrabold text-slate-800 text-center mb-1">Admin <span className="text-green-600 font-black">Login</span></h2>
          <p className="text-slate-500 text-sm text-center mb-6">
            Welcome back! Please login to continue to the admin dashboard.
          </p>

          <div className="space-y-4">
            {errorMsg && (
              <div className="flex items-center gap-2 p-4 bg-rose-50 border border-rose-100 text-rose-700 rounded-2xl text-sm">
                <AlertCircle size={16} className="shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}
            {successMsg && (
              <div className="flex items-center gap-2 p-4 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-2xl text-sm">
                <CheckCircle2 size={16} className="shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            <form onSubmit={handleCredentialsSubmit} className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Email Address</label>
                <div className="relative flex items-center">
                  <Mail className="absolute left-4 text-slate-400" size={16} />
                  <input
                    type="email"
                    className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-2xl pl-11 pr-4 py-3 text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-blue-500 focus:bg-white transition-all text-sm"
                    placeholder="Enter your email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Password</label>
                <div className="relative flex items-center">
                  <Lock className="absolute left-4 text-slate-400" size={16} />
                  <input
                    type={showPassword ? "text" : "password"}
                    className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-2xl pl-11 pr-11 py-3 text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-blue-500 focus:bg-white transition-all text-sm"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <div 
                    className="absolute right-4 text-slate-400 hover:text-slate-600 cursor-pointer"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                  <input
                    type="checkbox"
                    className="rounded-sm border-slate-300 text-blue-600 focus:ring-blue-500"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  Remember me
                </label>
              </div>

              <button type="submit" className="w-full py-3.5 bg-green-600 hover:bg-green-700 active:bg-blue-800 text-white font-semibold rounded-2xl shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed text-sm" disabled={loading}>
                {loading ? "Validating..." : "Login to Dashboard"}
                <ArrowRight size={16} />
              </button>
            </form>

            <div className="flex items-center gap-4 my-6">
              <div className="flex-1 h-px bg-slate-200"></div>
              <div className="flex items-center gap-1.5 text-[10px] text-slate-400 uppercase tracking-widest font-bold">
                <ShieldCheck size={12} className="text-slate-400" />
                <span>Secure Admin Access</span>
              </div>
              <div className="flex-1 h-px bg-slate-200"></div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-green-50/70 border border-blue-100 rounded-2xl text-[11px] text-green-700 font-medium">
              <ShieldCheck size={18} className="shrink-0 text-green-600 mt-0.5" />
              <span>Only authorized administrators can access the admin panel.</span>
            </div>
          </div>

          <div className="text-center text-[11px] text-slate-400 mt-8">
            © 2026 VESTA CRM. All rights reserved.
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminLogin;
