import React from "react";
import { Link } from "react-router-dom";
import { Plus, ArrowRight } from "lucide-react";

export default function OverseasDemandCard({ totalRequiredManpower }) {
  return (
    <div className="p-3 sm:p-3.5 bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 rounded-lg text-white shadow-xs relative overflow-hidden flex flex-col justify-between">
      <div className="absolute -right-6 -bottom-6 w-28 h-28 bg-indigo-500/10 rounded-full blur-2xl"></div>
      <div>
        <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider block">
          Overseas Manpower Demand
        </span>
        <div className="flex items-baseline gap-2 mt-1 mb-3">
          <span className="text-2xl font-bold text-white">{totalRequiredManpower}</span>
          <span className="text-[11px] text-slate-300 font-medium">Active Open Positions</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-1.5 pt-2 border-t border-white/10 text-xs font-bold">
        <Link
          to="/client/clients/new"
          className="flex items-center justify-between px-2 py-1.5 rounded-md bg-white/10 hover:bg-white/20 transition-colors text-white text-xs"
        >
          <span>+ Client</span>
          <Plus size={12} />
        </Link>
        <Link
          to="/client/projects/new"
          className="flex items-center justify-between px-2 py-1.5 rounded-md bg-white/10 hover:bg-white/20 transition-colors text-white text-xs"
        >
          <span>+ Project</span>
          <Plus size={12} />
        </Link>
        <Link
          to="/admin/vendor"
          className="flex items-center justify-between px-2 py-1.5 rounded-md bg-white/10 hover:bg-white/20 transition-colors text-white text-xs"
        >
          <span>Vendors</span>
          <ArrowRight size={12} />
        </Link>
        <Link
          to="/client/ledger"
          className="flex items-center justify-between px-2 py-1.5 rounded-md bg-white/10 hover:bg-white/20 transition-colors text-white text-xs"
        >
          <span>Ledger</span>
          <ArrowRight size={12} />
        </Link>
      </div>
    </div>
  );
}
