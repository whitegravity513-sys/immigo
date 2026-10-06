import React, { useState, useEffect } from "react";
import { Building2, Lock, Eye, EyeOff, LogIn, ArrowRight } from "lucide-react";
import crmVendorService from "../../services/crmVendorService.js";
import { useAuth } from "../../context/AuthContext.jsx";
import AuthErrorMessage from "./AuthErrorMessage.jsx";
import RememberForgotRow from "./RememberForgotRow.jsx";

export default function VendorLoginForm({ onLoginSuccess, onForgotPassword }) {
  const { login } = useAuth();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [keepSignedIn, setKeepSignedIn] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!error) return;
    const timer = setTimeout(() => setError(""), 6000);
    return () => clearTimeout(timer);
  }, [error]);

  const handleQuickFill = () => {
    setIdentifier("vendor@abcmanpower.com");
    setPassword("Password@123");
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const cleanId = identifier.trim();
      const res = await crmVendorService.loginVendor(cleanId, password);
      const token = res.token || `vnd-token-${Date.now()}`;
      const vendorData = { ...(res.vendor || {}), role: "vendor" };

      login(token, vendorData, "vendor");
      if (onLoginSuccess) {
        onLoginSuccess(token, vendorData, "vendor");
      }
    } catch (err) {
      console.error("Vendor login error:", err);
      setError(err.message || "Invalid vendor credentials. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3.5">
      {/* Quick Fill Demo */}
      <div className="px-3 py-1.5 bg-blue-50/70 border border-blue-200/70 rounded-xl flex items-center justify-between text-[11px] text-blue-900">
        <span className="truncate mr-2">
          Demo Vendor: <span className="font-bold text-[#1877f2]">vendor@abcmanpower.com</span> &bull; Pass: <span className="font-mono font-bold">Password@123</span>
        </span>
        <button
          type="button"
          onClick={handleQuickFill}
          className="font-bold text-[#1877f2] hover:underline cursor-pointer ml-2 text-xs shrink-0"
        >
          Quick Fill
        </button>
      </div>

      <AuthErrorMessage msg={error} />

      <div>
        <label className="block text-xs font-bold text-slate-700 mb-1">
          Vendor Registered Email or Vendor ID
        </label>
        <div className="relative">
          <Building2 size={16} className="absolute left-3.5 top-3 text-slate-400 pointer-events-none" />
          <input
            type="text"
            required
            autoFocus
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            placeholder="e.g. vendor@abcmanpower.com or VND-1001"
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 hover:border-slate-300 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#1877f2] focus:ring-2 focus:ring-blue-500/10 transition-all font-medium"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-700 mb-1">
          Password
        </label>
        <div className="relative">
          <Lock size={16} className="absolute left-3.5 top-3 text-slate-400 pointer-events-none" />
          <input
            type={showPassword ? "text" : "password"}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter secure password"
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

      <RememberForgotRow
        keepSignedIn={keepSignedIn}
        setKeepSignedIn={setKeepSignedIn}
        onForgotPassword={onForgotPassword}
      />

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
            <span>Sign In to Vendor Portal</span>
            <ArrowRight size={15} />
          </>
        )}
      </button>
    </form>
  );
}
