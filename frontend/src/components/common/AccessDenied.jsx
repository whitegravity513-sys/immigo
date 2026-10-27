import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShieldAlert, ArrowLeft, Home, Lock, RefreshCw } from "lucide-react";
import { usePermissions } from "../../context/PermissionContext.jsx";

export function AccessDenied({
  title = "Access Restricted",
  message = "You do not possess the required organizational permissions to access this management module or action.",
  requiredPermission,
  requiredRole,
}) {
  const navigate = useNavigate();
  const { role, isSuperAdmin, reloadPermissions } = usePermissions();

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white rounded-3xl border border-slate-200/90 shadow-[0_20px_50px_rgba(0,0,0,0.08)] p-6 sm:p-8 text-center relative overflow-hidden">
        {/* Decorative background glow */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center">
          <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mb-5 shadow-xs">
            <ShieldAlert size={32} />
          </div>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase bg-rose-100/80 text-rose-800 border border-rose-200/60 mb-2">
            <Lock size={12} />
            HTTP 403 Forbidden
          </span>

          <h2 className="text-2xl font-bold text-slate-900 tracking-tight mt-1">
            {title}
          </h2>

          <p className="text-sm text-slate-600 font-normal mt-2 leading-relaxed max-w-md">
            {message}
          </p>

          {(requiredPermission || requiredRole) && (
            <div className="w-full my-5 p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-left text-xs space-y-1">
              {requiredPermission && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Required Permission:</span>
                  <code className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200 font-mono font-semibold">
                    {Array.isArray(requiredPermission) ? requiredPermission.join(", ") : requiredPermission}
                  </code>
                </div>
              )}
              {requiredRole && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Required Role:</span>
                  <span className="font-bold text-slate-800 uppercase tracking-wide">
                    {requiredRole}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                <span className="text-slate-500 font-medium">Your Current Role:</span>
                <span className="font-bold text-blue-700 uppercase tracking-wide">
                  {role || "Admin"}
                </span>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full mt-2">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="w-full sm:w-1/2 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold text-xs transition-colors cursor-pointer"
            >
              <ArrowLeft size={15} />
              <span>Go Back</span>
            </button>

            <Link
              to="/admin/dashboard"
              className="w-full sm:w-1/2 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-sm shadow-blue-500/25 transition-all cursor-pointer"
            >
              <Home size={15} />
              <span>Admin Dashboard</span>
            </Link>
          </div>

          <button
            type="button"
            onClick={reloadPermissions}
            className="mt-4 text-[11px] font-semibold text-slate-400 hover:text-blue-600 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RefreshCw size={11} />
            <span>Sync my permissions</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default AccessDenied;
