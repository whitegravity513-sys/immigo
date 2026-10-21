import React, { useState, useEffect } from "react";
import { Briefcase, Lock, Eye, EyeOff, LogIn, ArrowRight, Zap } from "lucide-react";
import crmClientService from "../../services/crmClientService.js";
import { useAuth } from "../../context/AuthContext.jsx";
import AuthErrorMessage from "./AuthErrorMessage.jsx";
import RememberForgotRow from "./RememberForgotRow.jsx";

export default function ClientLoginForm({ onLoginSuccess, onForgotPassword }) {
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

  const handleDemoLogin = () => {
    setError("");
    setLoading(true);
    try {
      const token = `clt-token-${Date.now()}`;
      const clientPayload = {
        id: "CLT-1001",
        companyName: "Apex Global Infrastructure Group",
        email: "client@apexinfra.com",
        country: "UAE",
        role: "client",
      };
      login(token, clientPayload, "client");
      if (onLoginSuccess) {
        onLoginSuccess(token, clientPayload, "client");
      }
    } catch (err) {
      setError("Client demo login failed.");
    } finally {
      setLoading(false);
    }
  };



  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const cleanId = identifier.trim();
      const clientsData = JSON.parse(localStorage.getItem("crm_clients_data_v2") || "[]");
      const client = clientsData.find(
        (c) =>
          c.email?.toLowerCase() === cleanId.toLowerCase() ||
          c.id?.toLowerCase() === cleanId.toLowerCase()
      );

      const token = `clt-token-${Date.now()}`;
      const clientPayload = client || {
        id: "CLT-1001",
        companyName: "Apex Global Infrastructure Group",
        email: cleanId,
        country: "UAE",
        role: "client",
      };

      login(token, { ...clientPayload, role: "client" }, "client");
      if (onLoginSuccess) {
        onLoginSuccess(token, { ...clientPayload, role: "client" }, "client");
      }
    } catch (err) {
      console.error("Client login error:", err);
      setError(err.message || "Invalid client credentials. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3.5" autoComplete="off">
      {/* Hidden dummy inputs to trap browser autofill */}
      <input type="text" style={{ position: "absolute", opacity: 0, height: 0, width: 0, zIndex: -1 }} tabIndex="-1" autoComplete="off" />
      <input type="password" style={{ position: "absolute", opacity: 0, height: 0, width: 0, zIndex: -1 }} tabIndex="-1" autoComplete="off" />

      <AuthErrorMessage msg={error} />

      <div>
        <label className="block text-xs font-bold text-slate-700 mb-1">
          Client Company Email or Client ID
        </label>
        <div className="relative">
          <Briefcase size={16} className="absolute left-3.5 top-3 text-slate-400 pointer-events-none" />
          <input
            type="text"
            required
            autoFocus
            autoComplete="off"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            placeholder="e.g. client@apexinfra.com or CLT-1001"
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
            <span>Sign In to Client Portal</span>
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
          <span>1-Click Demo Login (Client)</span>
        </button>
      </div>
    </form>
  );
}
