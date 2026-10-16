import React, { useState } from "react";
import { Building2, MoreVertical, Eye, Edit, Ban, CheckCircle2, XCircle, Trash2 } from "lucide-react";
import VendorStatusBadge from "./VendorStatusBadge.jsx";

export default function VendorTable({
  loading,
  vendors = [],
  onSelectVendor,
  onEditVendor,
  onDeleteVendor,
  onToggleSuspend,
  onApproveRegistration,
  onOpenRejectModal,
}) {
  const [openMenuId, setOpenMenuId] = useState(null);

  if (loading) {
    return (
      <div className="p-8 text-center bg-white rounded-xl border border-slate-200">
        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        <p className="text-xs font-semibold text-slate-500">Loading vendors...</p>
      </div>
    );
  }

  if (vendors.length === 0) {
    return (
      <div className="p-8 text-center bg-white rounded-xl border border-slate-200">
        <Building2 className="w-8 h-8 text-slate-300 mx-auto mb-2" />
        <h3 className="text-xs font-bold text-slate-800">No vendors found</h3>
        <p className="text-[11px] text-slate-400 mt-0.5">No agencies matched your filter selection.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
      <div className="overflow-x-auto min-h-[260px] pb-8">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-slate-50/90 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
            <tr>
              <th className="py-2 px-3">Vendor ID</th>
              <th className="py-2 px-3">Agency / Vendor Name</th>
              <th className="py-2 px-3">Contact Person</th>
              <th className="py-2 px-3">Location</th>
              <th className="py-2 px-3 text-center">MOU Status</th>
              <th className="py-2 px-3">Status</th>
              <th className="py-2 px-3 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {vendors.map((v, idx) => {
              const isNearBottom = vendors.length > 4 && idx >= vendors.length - 2;
              const isMenuOpen = openMenuId === v.id;

              return (
                <tr
                  key={v.id}
                  onClick={() => onSelectVendor(v)}
                  className="hover:bg-blue-50/30 transition-colors cursor-pointer group"
                >
                  <td className="py-1.5 px-3 font-mono font-bold text-blue-700 text-xs">{v.id}</td>

                  <td className="py-1.5 px-3">
                    <div className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors text-xs leading-tight">
                      {v.companyName}
                    </div>
                    <div className="text-[10px] text-slate-400 font-medium leading-none mt-0.5">
                      {v.officialEmail || v.phone || "Verified Partner"}
                    </div>
                  </td>

                  <td className="py-1.5 px-3 text-slate-700">
                    <div className="font-semibold text-xs leading-tight">{v.contactPersonName || "N/A"}</div>
                    {v.contactPersonPhone && (
                      <div className="text-[10px] text-slate-400 leading-none mt-0.5">{v.contactPersonPhone}</div>
                    )}
                  </td>

                  <td className="py-1.5 px-3 text-slate-600 text-[11px]">
                    {[v.city, v.state].filter(Boolean).join(", ") || "India"}
                  </td>

                  <td className="py-1.5 px-3 text-center">
                    {v.mouSigned || v.mouStatus === "Approved" || v.mouStatus === "Signed" ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        Executed
                      </span>
                    ) : v.mouStatus === "Sent" || v.status === "MOU Pending" ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
                        MOU Sent
                      </span>
                    ) : v.status === "Pending MOU Approval" ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
                        Signed (Pending)
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                        Pending
                      </span>
                    )}
                  </td>

                  <td className="py-1.5 px-3">
                    <VendorStatusBadge status={v.status} />
                  </td>

                  <td className="py-1.5 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                    <div className="relative inline-flex items-center justify-center">
                      <button
                        type="button"
                        onClick={() => setOpenMenuId(isMenuOpen ? null : v.id)}
                        className={`w-6 h-6 rounded-md flex items-center justify-center transition-all cursor-pointer ${
                          isMenuOpen
                            ? "bg-blue-100 text-blue-700 font-bold shadow-2xs"
                            : "text-slate-400 hover:text-slate-800 hover:bg-slate-100"
                        }`}
                        title="Actions"
                      >
                        <MoreVertical size={13} />
                      </button>

                      {isMenuOpen && (
                        <>
                          <div
                            className="fixed inset-0 z-40"
                            onClick={() => setOpenMenuId(null)}
                          />
                          <div
                            className={`absolute right-0 ${
                              isNearBottom ? "bottom-full mb-1" : "top-full mt-1"
                            } w-44 bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-50 text-xs text-left divide-y divide-gray-100`}
                          >
                            <div className="py-0.5">
                              <button
                                type="button"
                                onClick={() => {
                                  setOpenMenuId(null);
                                  onSelectVendor(v);
                                }}
                                className="w-full flex items-center gap-1.5 px-2.5 py-1.5 text-slate-700 hover:bg-blue-50 hover:text-blue-700 text-left transition-colors cursor-pointer text-[11px] font-medium"
                              >
                                <Eye size={12} className="text-slate-400" />
                                <span>View Profile</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setOpenMenuId(null);
                                  onEditVendor(v);
                                }}
                                className="w-full flex items-center gap-1.5 px-2.5 py-1.5 text-slate-700 hover:bg-blue-50 hover:text-blue-700 text-left transition-colors cursor-pointer text-[11px] font-medium"
                              >
                                <Edit size={12} className="text-slate-400" />
                                <span>Edit Vendor</span>
                              </button>
                              {(v.status === "Approved" || v.status === "Suspended") && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setOpenMenuId(null);
                                    onToggleSuspend(v.id);
                                  }}
                                  className="w-full flex items-center gap-1.5 px-2.5 py-1.5 text-slate-700 hover:bg-amber-50 hover:text-amber-700 text-left transition-colors cursor-pointer text-[11px] font-medium"
                                >
                                  <Ban size={12} className="text-amber-500" />
                                  <span>{v.status === "Suspended" ? "Activate Vendor" : "Suspend Vendor"}</span>
                                </button>
                              )}
                              {["Pending", "Registration Pending", "Registration On Hold", "Under Review", "Pending Verification"].includes(
                                v.status
                              ) && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setOpenMenuId(null);
                                    onApproveRegistration(v.id);
                                  }}
                                  className="w-full flex items-center gap-1.5 px-2.5 py-1.5 text-emerald-700 hover:bg-emerald-50 text-left transition-colors cursor-pointer text-[11px] font-medium"
                                >
                                  <CheckCircle2 size={12} className="text-emerald-600" />
                                  <span>Verify Registration</span>
                                </button>
                              )}
                              {["Pending", "Under Review", "Pending Verification"].includes(v.status) && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setOpenMenuId(null);
                                    onOpenRejectModal(v);
                                  }}
                                  className="w-full flex items-center gap-1.5 px-2.5 py-1.5 text-rose-600 hover:bg-rose-50 text-left transition-colors cursor-pointer text-[11px] font-medium"
                                >
                                  <XCircle size={12} className="text-rose-500" />
                                  <span>Reject Registration</span>
                                </button>
                              )}
                            </div>
                            <div className="py-0.5">
                              <button
                                type="button"
                                onClick={() => {
                                  setOpenMenuId(null);
                                  onDeleteVendor(v);
                                }}
                                className="w-full flex items-center gap-1.5 px-2.5 py-1.5 text-rose-600 hover:bg-rose-50 text-left transition-colors cursor-pointer text-[11px] font-semibold"
                              >
                                <Trash2 size={12} />
                                <span>Delete Vendor</span>
                              </button>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
