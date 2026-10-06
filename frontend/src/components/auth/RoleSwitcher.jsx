import React from "react";
import { Shield, User } from "lucide-react";

export default function RoleSwitcher({ role, onChange }) {
  return (
    <div className="bg-[#f1f5f9] p-1 rounded-xl flex items-center mb-4 border border-slate-200/70">
      <button
        type="button"
        onClick={() => onChange("admin")}
        className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
          role === "admin"
            ? "bg-[#1877f2] text-white shadow-sm shadow-blue-500/20 font-extrabold"
            : "text-slate-600 hover:text-slate-900 bg-transparent"
        }`}
      >
        <Shield size={15} /> Admin Portal
      </button>
      <button
        type="button"
        onClick={() => onChange("employee")}
        className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
          role === "employee"
            ? "bg-[#1877f2] text-white shadow-sm shadow-blue-500/20 font-extrabold"
            : "text-slate-600 hover:text-slate-900 bg-transparent"
        }`}
      >
        <User size={15} /> Employee Self-Service
      </button>
    </div>
  );
}
