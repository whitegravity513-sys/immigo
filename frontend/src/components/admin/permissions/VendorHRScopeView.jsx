import React from "react";
import { ShieldCheck, Briefcase, AlertTriangle, Edit2, Trash2, CheckCircle2, UserCheck, Layers, Calendar, Lock } from "lucide-react";

export default function VendorHRScopeView({
  selectedAdminData,
  availableVendors,
  onOpenEditModal,
  onOpenDeleteModal,
}) {
  return (
    <div className="space-y-3.5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              {selectedAdminData.name}
            </h2>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider bg-cyan-100 text-cyan-900 border border-cyan-200">
              Vendor HR
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
              Fixed Agency Scope
            </span>
            {!selectedAdminData.isActive && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider bg-rose-100 text-rose-800 border border-rose-200">
                Disabled
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-500 font-medium mt-0.5">
            {selectedAdminData.email} &bull; Scope:{" "}
            <strong className="text-cyan-700 font-bold">
              {selectedAdminData.assignedVendors?.length || 0} Vendor Agencies Assigned
            </strong>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onOpenEditModal(selectedAdminData)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-cyan-600 hover:bg-cyan-700 text-white shadow-xs cursor-pointer transition-all"
          >
            <Edit2 size={12} />
            <span>Edit Agency Assignment</span>
          </button>

          <button
            type="button"
            onClick={() => onOpenDeleteModal(selectedAdminData)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 cursor-pointer"
            title="Delete Account"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      <div className="p-3 rounded-xl bg-cyan-50/80 border border-cyan-200 text-cyan-950 text-xs flex items-start gap-2.5">
        <ShieldCheck size={18} className="text-cyan-700 shrink-0 mt-0.5" />
        <div className="space-y-0.5 leading-relaxed">
          <strong className="font-bold text-cyan-900">
            Vendor HR Policy: Fixed Role Scope (No Custom Role Needed)
          </strong>
          <p className="text-cyan-800 text-[11px]">
            Vendor HR accounts are pre-configured by the system with fixed capabilities. Direct role and permission matrix checkboxes are disabled to guarantee multi-vendor data isolation. Capabilities are strictly bounded to candidates submitted under their assigned recruitment agency.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200/90 p-3.5 space-y-2.5 shadow-2xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-cyan-100 text-cyan-800">
              <Briefcase size={14} />
            </div>
            <div>
              <h3 className="font-bold text-xs text-slate-900">
                Assigned Recruitment Agencies ({selectedAdminData.assignedVendors?.length || 0})
              </h3>
              <p className="text-[10px] text-slate-500">
                This Vendor HR can manage candidate pipelines and attend interviews for these agencies only:
              </p>
            </div>
          </div>
        </div>

        {!selectedAdminData.assignedVendors || selectedAdminData.assignedVendors.length === 0 ? (
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs text-center space-y-2">
            <AlertTriangle size={20} className="text-amber-600 mx-auto" />
            <p className="font-bold">No Vendor Agency Currently Assigned</p>
            <p className="text-[11px] text-amber-700 max-w-md mx-auto">
              This Vendor HR account has not been linked to any recruitment agency yet. Assign an agency to authorize candidate pipeline visibility.
            </p>
            <button
              type="button"
              onClick={() => onOpenEditModal(selectedAdminData)}
              className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs cursor-pointer shadow-xs"
            >
              Assign Vendor Agency Now
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-1">
            {selectedAdminData.assignedVendors.map((vId) => {
              const vendorObj = availableVendors.find(
                (v) => (v.vendorId || v.id) === vId
              );
              return (
                <div
                  key={vId}
                  className="p-3 rounded-xl border border-cyan-200 bg-cyan-50/40 space-y-1.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h4 className="font-bold text-xs text-slate-900 truncate">
                        {vendorObj?.companyName || `Vendor ${vId}`}
                      </h4>
                      <span className="text-[10px] font-mono text-cyan-800 bg-cyan-100 px-1.5 py-0.2 rounded font-semibold">
                        ID: {vId}
                      </span>
                    </div>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 uppercase">
                      {vendorObj?.status || "Active Agency"}
                    </span>
                  </div>

                  <div className="text-[10.5px] text-slate-600 space-y-0.5 pt-1 border-t border-cyan-100">
                    {vendorObj?.contactPersonName && (
                      <div>Contact: <strong>{vendorObj.contactPersonName}</strong></div>
                    )}
                    {vendorObj?.email && (
                      <div className="text-slate-500 truncate">Email: {vendorObj.email}</div>
                    )}
                    {vendorObj?.phone && (
                      <div className="text-slate-500">Phone: {vendorObj.phone}</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl border border-slate-200/90 p-3.5 space-y-2.5 shadow-2xs">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-blue-100 text-blue-800">
            <CheckCircle2 size={14} />
          </div>
          <div>
            <h3 className="font-bold text-xs text-slate-900">
              Pre-Configured System Capabilities (Automatically Active)
            </h3>
            <p className="text-[10px] text-slate-500">
              These features are automatically enabled for Vendor HR without custom role configuration:
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-xs">
          <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/60 space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 flex items-center gap-1.5">
                <UserCheck size={13} className="text-blue-600" />
                Candidate Submissions
              </span>
              <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                Active
              </span>
            </div>
            <p className="text-[10px] text-slate-500 leading-tight">
              Register applicants, upload passports, trade certificates, and resumes under assigned agency.
            </p>
          </div>

          <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/60 space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 flex items-center gap-1.5">
                <Layers size={13} className="text-indigo-600" />
                Live Stage Tracker
              </span>
              <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                Active
              </span>
            </div>
            <p className="text-[10px] text-slate-500 leading-tight">
              Monitor real-time pipeline: Applied, Screening, L1/L2 Interview, Selected, Offer Letter & Visa.
            </p>
          </div>

          <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/60 space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 flex items-center gap-1.5">
                <Calendar size={13} className="text-purple-600" />
                Interview Schedules
              </span>
              <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                Active
              </span>
            </div>
            <p className="text-[10px] text-slate-500 leading-tight">
              View scheduled interview dates and join video conferencing sessions with agency candidates.
            </p>
          </div>

          <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/60 space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 flex items-center gap-1.5">
                <Lock size={13} className="text-cyan-700" />
                Multi-Tenant Isolation
              </span>
              <span className="text-[9px] font-bold text-cyan-800 bg-cyan-50 px-1.5 py-0.2 rounded border border-cyan-200">
                Enforced
              </span>
            </div>
            <p className="text-[10px] text-slate-500 leading-tight">
              Strict database isolation: blocked from viewing other vendors, workforce employee records, or finance.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
