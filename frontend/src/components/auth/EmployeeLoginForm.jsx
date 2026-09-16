import React, { useState, useEffect } from "react";
import { Users, Lock, Eye, EyeOff } from "lucide-react";
import { employeeLogin } from "../../services/authService";
import AuthInputField from "./AuthInputField";
import AuthSubmitButton from "./AuthSubmitButton";
import AuthErrorMessage from "./AuthErrorMessage";
import RememberForgotRow from "./RememberForgotRow";

/**
 * Dedicated Employee Authentication Form.
 * Supports login via Email or unique Employee ID (e.g., EMP001).
 */
export default function EmployeeLoginForm({ onLoginSuccess, onSwitchToAdmin }) {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword]     = useState("");
  const [showPass, setShowPass]     = useState(false);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState("");
  const [capsLock, setCapsLock]     = useState(false);

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
      const data = await employeeLogin(identifier.trim(), password);
      const token = data?.token || data?.accessToken;
      if (token && onLoginSuccess) {
        onLoginSuccess(token, { ...data.employee, role: "employee" }, "employee");
      } else {
        setError("Employee authentication failed. Please verify your credentials.");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Invalid employee credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <AuthErrorMessage msg={error} />

      <AuthInputField
        id="employee-identifier"
        label="Official Email or Employee ID"
        icon={<Users size={16} />}
        type="text"
        value={identifier}
        onChange={(e) => setIdentifier(e.target.value)}
        placeholder="e.g. EMP001 or name@company.com"
        required
        autoFocus
        autoComplete="username"
      />

      <AuthInputField
        id="employee-password"
        label="Password"
        icon={<Lock size={16} />}
        type={showPass ? "text" : "password"}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Enter your employee password"
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

      <AuthSubmitButton loading={loading} label="Sign In to Employee Portal" />

      <div className="pt-2 text-center">
        <p className="text-xs text-slate-500 font-medium">
          Looking for Management Access?{" "}
          <button
            type="button"
            onClick={onSwitchToAdmin}
            className="text-blue-600 hover:text-blue-800 font-bold hover:underline cursor-pointer border-none bg-transparent"
          >
            Admin Sign In &rarr;
          </button>
        </p>
      </div>
    </form>
  );
}
