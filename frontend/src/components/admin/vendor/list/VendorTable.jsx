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
      <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        <p className="text-xs font-semibold text-slate-500">Loading vendors...</p>
      </div>
    );
  }

  if (vendors.length === 0) {
    return (
      <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
        <Building2 className="w-10 h-10 text-slate-300 mx-auto mb-2" />
        <h3 className="text-sm font-bold text-slate-800">No vendors found</h3>
        <p className="text-xs text-slate-500 mt-1">No agencies matched your filter selection.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
      <div className="overflow-x-auto min-h-[340px] pb-16">
        <table className="w-full text-left text-xs sm:text-sm">
          <thead className="bg-slate-50/90 text-slate-600 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200">
            <tr>
              <th className="py-3.5 px-4 sm:px-5">Vendor ID</th>
              <th className="py-3.5 px-4">Agency / Vendor Name</th>
              <th className="py-3.5 px-4">Contact Person</th>
              <th className="py-3.5 px-4">Location</th>
              <th className="py-3.5 px-4 text-center">MOU Status</th>
              <th className="py-3.5 px-4">Status</th>
              <th className="py-3.5 px-4 text-center">Action</th>
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
                  className="hover:bg-blue-50/40 transition cursor-pointer group"
                >
                  <td className="py-4 px-4 sm:px-5 font-mono font-bold text-blue-700">{v.id}</td>

                  <td className="py-4 px-4">
                    <div className="font-extrabold text-slate-900 group-hover:text-blue-600 transition text-sm">
                      {v.companyName}
                    </div>
                    <div className="text-[11px] text-slate-400 font-medium">
                      {v.officialEmail || v.phone || "Verified Partner"}
                    </div>
                  </td>

                  <td className="py-4 px-4 text-slate-700 font-semibold">
                    <div>{v.contactPersonName || "N/A"}</div>
                    {v.contactPersonPhone && (
                      <div className="text-[11px] text-slate-400 font-normal">{v.contactPersonPhone}</div>
                    )}
                  </td>

                  <td className="py-4 px-4 text-slate-700 font-medium text-xs">
                    {[v.city, v.state].filter(Boolean).join(", ") || "India"}
                  </td>

                  <td className="py-4 px-4 text-center">
                    {v.mouSigned || v.mouStatus === "Approved" || v.mouStatus === "Signed" ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        Executed
                      </span>
                    ) : v.mouStatus === "Sent" || v.status === "MOU Pending" ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
                        MOU Sent
                      </span>
                    ) : v.status === "Pending MOU Approval" ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
                        Signed (Pending)
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                        Pending
                      </span>
                    )}
                  </td>

                  <td className="py-4 px-4">
                    <VendorStatusBadge status={v.status} />
                  </td>

                  <td className="py-4 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                    <div className="relative inline-flex items-center justify-center">
                      <button
                        type="button"
                        onClick={() => setOpenMenuId(isMenuOpen ? null : v.id)}
                        className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                          isMenuOpen
                            ? "bg-blue-100 text-blue-700 font-bold shadow-xs"
                            : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                        }`}
                        title="Actions"
                      >
                        <MoreVertical size={16} />
                      </button>

                      {isMenuOpen && (
                        <>
                          <div
                            className="fixed inset-0 z-40"
                            onClick={() => setOpenMenuId(null)}
                          />
                          <div
                            className={`absolute right-0 ${
                              isNearBottom ? "bottom-full mb-1.5" : "top-full mt-1.5"
                            } w-48 bg-white rounded-xl shadow-2xl border border-gray-200 py-1.5 z-50 text-xs text-left divide-y divide-gray-100`}
                          >
                            <div className="py-1">
                              <button
                                type="button"
                                onClick={() => {
                                  setOpenMenuId(null);
                                  onSelectVendor(v);
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-slate-700 hover:bg-blue-50 hover:text-blue-700 text-left transition-colors cursor-pointer font-medium"
                              >
                                <Eye size={14} className="text-slate-400" />
                                <span>View Profile</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setOpenMenuId(null);
                                  onEditVendor(v);
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-slate-700 hover:bg-blue-50 hover:text-blue-700 text-left transition-colors cursor-pointer font-medium"
                              >
                                <Edit size={14} className="text-slate-400" />
                                <span>Edit Vendor</span>
                              </button>
                              {(v.status === "Approved" || v.status === "Suspended") && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setOpenMenuId(null);
                                    onToggleSuspend(v.id);
                                  }}
                                  className="w-full flex items-center gap-2 px-3 py-2 text-slate-700 hover:bg-amber-50 hover:text-amber-700 text-left transition-colors cursor-pointer font-medium"
                                >
                                  <Ban size={14} className="text-amber-500" />
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
                                  className="w-full flex items-center gap-2 px-3 py-2 text-emerald-700 hover:bg-emerald-50 text-left transition-colors cursor-pointer font-medium"
                                >
                                  <CheckCircle2 size={14} className="text-emerald-600" />
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
                                  className="w-full flex items-center gap-2 px-3 py-2 text-rose-600 hover:bg-rose-50 text-left transition-colors cursor-pointer font-medium"
                                >
                                  <XCircle size={14} className="text-rose-500" />
                                  <span>Reject Registration</span>
                                </button>
                              )}
                            </div>
                            <div className="py-1">
                              <button
                                type="button"
                                onClick={() => {
                                  setOpenMenuId(null);
                                  onDeleteVendor(v);
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-rose-600 hover:bg-rose-50 text-left transition-colors cursor-pointer font-semibold"
                              >
                                <Trash2 size={14} />
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
