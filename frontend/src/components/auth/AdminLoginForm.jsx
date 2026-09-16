import React, { useState, useEffect } from "react";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import { adminLogin } from "../../services/authService";
import AuthInputField from "./AuthInputField";
import AuthSubmitButton from "./AuthSubmitButton";
import AuthErrorMessage from "./AuthErrorMessage";
import RememberForgotRow from "./RememberForgotRow";

/**
 * Dedicated Admin Authentication Form.
 * Handles validation, password visibility toggling, CapsLock detection, and error lifecycles.
 */
export default function AdminLoginForm({ onLoginSuccess, onSwitchToEmployee }) {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [capsLock, setCapsLock] = useState(false);

  useEffect(() => {
    if (!error) return;
    const t = setTimeout(() => setError(""), 5000);
    return () => clearTimeout(t);
  }, [error]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const data = await adminLogin(email.trim(), password);
      const token = data?.accessToken || data?.token;
      if (token && onLoginSuccess) {
        onLoginSuccess(token, { ...data.admin, role: "admin" }, "admin");
      } else {
        setError("Admin authentication failed. Please verify credentials.");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Invalid admin email or password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <AuthErrorMessage msg={error} />

      <AuthInputField
        id="admin-email"
        label="Admin Official Email"
        icon={<Mail size={16} />}
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="admin@company.com"
        required
        autoFocus
        autoComplete="email"
      />

      <AuthInputField
        id="admin-password"
        label="Password"
        icon={<Lock size={16} />}
        type={showPass ? "text" : "password"}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Enter secure password"
        required
        autoComplete="current-password"
        onCapsLockChange={setCapsLock}
        rightElement={
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setShowPass((p) => !p)}
            className="text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
            title={showPass ? "Hide password" : "Show password"}
          >
            {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        }
      />

      {capsLock && (
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-[11px] font-semibold">
          <span>⚠️</span>
          <span>Caps Lock is ON</span>
        </div>
      )}

      <RememberForgotRow />

      <AuthSubmitButton loading={loading} label="Sign In to Admin Portal" />

      <div className="pt-2 text-center">
        <p className="text-xs text-slate-500 font-medium">
          Not an Administrator?{" "}
          <button
            type="button"
            onClick={onSwitchToEmployee}
            className="text-blue-600 hover:text-blue-800 font-bold hover:underline cursor-pointer border-none bg-transparent"
          >
            Employee Sign In &rarr;
          </button>
        </p>
      </div>
    </form>
  );
}
