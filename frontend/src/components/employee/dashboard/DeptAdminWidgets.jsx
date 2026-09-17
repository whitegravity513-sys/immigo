import React from "react";
import { ShieldCheck, HardDrive, CheckSquare, Wrench } from "lucide-react";

export default function DeptAdminWidgets() {
  const adminStats = [
    { label: "Asset Requests", value: "4", sub: "Laptops & IDs pending", color: "text-blue-600" },
    { label: "Facility Maintenance", value: "2", sub: "Work order active", color: "text-amber-600" },
    { label: "Policy Compliance", value: "98%", sub: "Audits completed", color: "text-emerald-600" },
    { label: "Access Approvals", value: "5", sub: "Portal permissions", color: "text-indigo-600" },
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
            <ShieldCheck size={18} />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900">Administration & Operations</h3>
            <p className="text-[11px] text-slate-500 font-medium">Internal logistics, assets & requests</p>
          </div>
        </div>
        <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
          HQ Operations
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {adminStats.map((item, idx) => (
          <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-100">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{item.label}</div>
            <div className={`text-xl font-black ${item.color} mt-1`}>{item.value}</div>
            <div className="text-[10px] text-slate-500 font-semibold mt-0.5">{item.sub}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
