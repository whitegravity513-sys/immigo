import { useState, useEffect, useRef } from "react";
import { Mail, Lock, Eye, EyeOff, LogIn, ArrowRight, Zap } from "lucide-react";
import { adminLogin } from "../../services/authService.js";
import { useAuth } from "../../context/AuthContext.jsx";
import AuthErrorMessage from "./AuthErrorMessage.jsx";
import RememberForgotRow from "./RememberForgotRow.jsx";

export default function AdminLoginForm({ onLoginSuccess, onForgotPassword, prefill }) {
  const { login } = useAuth();
  const [identifier, setIdentifier] = useState(prefill?.email || "");
  const [password, setPassword] = useState(prefill?.password || "");
  const [showPassword, setShowPassword] = useState(false);
  const [keepSignedIn, setKeepSignedIn] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const adminInputRef = useRef(null);
  const adminPassRef = useRef(null);

  useEffect(() => {
    if (prefill?.email !== undefined) {
      setIdentifier(prefill.email);
    }
    if (prefill?.password !== undefined) {
      setPassword(prefill.password);
    }
  }, [prefill]);

  useEffect(() => {
    if (!error) return;
    const timer = setTimeout(() => setError(""), 6000);
    return () => clearTimeout(timer);
  }, [error]);

  const handleAdminDemoLogin = async () => {
    setError("");
    setLoading(true);
    try {
      const data = await adminLogin("admin@immigo.com", "admin123");
      const token = data?.accessToken || data?.token;
      if (token) {
        const resolvedRole = "ADMIN";
        const adminData = { ...(data.admin || {}), role: resolvedRole };
        if (data.admin?.permissions) {
          localStorage.setItem("user_permissions", JSON.stringify(data.admin.permissions));
        }
        login(token, adminData, resolvedRole);
        if (onLoginSuccess) {
          onLoginSuccess(token, adminData, resolvedRole);
        }
      } else {
        setError("Admin authentication failed. Please verify credentials.");
      }
    } catch (err) {
      setError(err?.response?.data?.message || "Admin demo login failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleSuperAdminDemoLogin = async () => {
    setError("");
    setLoading(true);
    try {
      const data = await adminLogin("admin@vista.com", "12345");
      const token = data?.accessToken || data?.token;
      if (token) {
        const resolvedRole = "SUPER_ADMIN";
        const adminData = { ...(data.admin || {}), role: resolvedRole };
        if (data.admin?.permissions) {
          localStorage.setItem("user_permissions", JSON.stringify(data.admin.permissions));
        }
        login(token, adminData, resolvedRole);
        if (onLoginSuccess) {
          onLoginSuccess(token, adminData, resolvedRole);
        }
      } else {
        setError("Super Admin authentication failed. Please verify credentials.");
      }
    } catch (err) {
      setError(err?.response?.data?.message || "Super Admin demo login failed.");
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
      const adminEmail =
        cleanId.toLowerCase() === "admin" || cleanId.toLowerCase() === "superadmin"
          ? "admin@vista.com"
          : cleanId;

      const data = await adminLogin(adminEmail, password);
      const token = data?.accessToken || data?.token;

      if (token) {
        const emailLower = adminEmail.toLowerCase();
        let resolvedRole = "ADMIN";
        if (
          emailLower.includes("super") ||
          emailLower === "admin@vista.com" ||
          (data.admin?.role || "").toUpperCase().includes("SUPER")
        ) {
          resolvedRole = "SUPER_ADMIN";
        } else if (emailLower.includes("hr")) {
          resolvedRole = "HR";
        } else {
          resolvedRole = "ADMIN";
        }
        const adminData = { ...(data.admin || {}), role: resolvedRole };
        if (data.admin?.permissions) {
          localStorage.setItem("user_permissions", JSON.stringify(data.admin.permissions));
        }
        login(token, adminData, resolvedRole);
        if (onLoginSuccess) {
          onLoginSuccess(token, adminData, resolvedRole);
        }
      } else {
        setError("Admin authentication failed. Please verify your credentials.");
      }

    } catch (err) {
      console.error("Admin login error:", err);
      if (err?.code === "ERR_NETWORK" || !err?.response) {
        setError("Connecting to live server. Please retry in a moment.");
      } else {
        setError(err.response?.data?.message || "Invalid admin credentials. Please try again.");
      }
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
          Admin Official Email
        </label>
        <div className="relative">
          <Mail size={16} className="absolute left-3.5 top-3 text-slate-400 pointer-events-none" />
          <input
            ref={adminInputRef}
            type="text"
            required
            autoFocus
            value={identifier}
            onChange={(e) => {
              const val = e.target.value;
              if (val.toUpperCase().includes("VESTA")) {
                setIdentifier("");
                if (adminInputRef.current) adminInputRef.current.value = "";
                return;
              }
              setIdentifier(val);
            }}
            name="admin_system_email"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="none"
            spellCheck="false"
            placeholder="admin@immigo.com or 'admin'"
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
            ref={adminPassRef}
            type={showPassword ? "text" : "password"}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            name="admin_system_pass"
            autoComplete="new-password"
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
            <span>Sign In to Admin Portal</span>
            <ArrowRight size={14} className="ml-1" />
          </>
        )}
      </button>

      <div className="grid grid-cols-2 gap-2 pt-1">
        <button
          type="button"
          onClick={handleAdminDemoLogin}
          disabled={loading}
          className="py-2 px-2.5 rounded-xl border border-dashed border-blue-300 hover:border-blue-600 bg-blue-50/70 hover:bg-blue-100/80 text-blue-800 text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs active:scale-[0.99] disabled:opacity-60 truncate"
          title="Login as System Admin (admin@immigo.com)"
        >
          <Zap size={13} className="text-blue-600 fill-blue-600 shrink-0" />
          <span className="truncate">Demo Admin</span>
        </button>

        <button
          type="button"
          onClick={handleSuperAdminDemoLogin}
          disabled={loading}
          className="py-2 px-2.5 rounded-xl border border-dashed border-indigo-300 hover:border-indigo-600 bg-indigo-50/70 hover:bg-indigo-100/80 text-indigo-900 text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs active:scale-[0.99] disabled:opacity-60 truncate"
          title="Login as Super Admin (admin@vista.com)"
        >
          <Zap size={13} className="text-amber-500 fill-amber-500 shrink-0" />
          <span className="truncate">Demo Super Admin</span>
        </button>
      </div>
    </form>
  );
}
