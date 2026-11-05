import React from "react";
import { Edit2, X, Shield, Users, Briefcase, Info } from "lucide-react";

export default function EditAdminModal({
  isOpen,
  onClose,
  editFormData,
  setEditFormData,
  onSubmit,
  saving,
  availableVendors,
  isSuperAdmin,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-2xs">
      <div className="bg-white rounded-2xl border border-slate-200 p-5 max-w-md w-full shadow-2xl space-y-3.5 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto custom-scrollbar">
        <div className="flex items-center justify-between border-b pb-2.5">
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
            <Edit2 size={16} className="text-blue-600" />
            <span>Edit Account Details</span>
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-3 text-xs">
          <div>
            <label className="block text-slate-800 font-bold mb-1.5">
              Account Role *
            </label>
            <div className="grid grid-cols-3 gap-2">
              {isSuperAdmin && (
                <button
                  type="button"
                  onClick={() =>
                    setEditFormData({
                      ...editFormData,
                      role: "ADMIN",
                      hrType: "",
                    })
                  }
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    editFormData.role === "ADMIN"
                      ? "bg-blue-50 border-blue-500 ring-2 ring-blue-500/20 text-blue-900"
                      : "bg-white border-slate-200 hover:bg-slate-50 text-slate-700"
                  }`}
                >
                  <div className="flex items-center gap-1 font-bold text-xs mb-1">
                    <Shield size={13} className="text-blue-600" />
                    <span>Admin</span>
                  </div>
                  <p className="text-[9.5px] text-slate-500 line-clamp-2 leading-tight">
                    Full admin with all 7 module permissions.
                  </p>
                </button>
              )}

              <button
                type="button"
                onClick={() =>
                  setEditFormData({
                    ...editFormData,
                    role: "EMPLOYEE_HR",
                    hrType: "EMPLOYEE_HR",
                  })
                }
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                  editFormData.role === "EMPLOYEE_HR" || (editFormData.role === "HR" && editFormData.hrType !== "VENDOR_HR")
                    ? "bg-purple-50 border-purple-500 ring-2 ring-purple-500/20 text-purple-900"
                    : "bg-white border-slate-200 hover:bg-slate-50 text-slate-700"
                }`}
              >
                <div className="flex items-center gap-1 font-bold text-xs mb-1">
                  <Users size={13} className="text-purple-600" />
                  <span>Employee HR</span>
                </div>
                <p className="text-[9.5px] text-slate-500 line-clamp-2 leading-tight">
                  Workforce directory, attendance & leaves only.
                </p>
              </button>

              <button
                type="button"
                onClick={() =>
                  setEditFormData({
                    ...editFormData,
                    role: "VENDOR_HR",
                    hrType: "VENDOR_HR",
                  })
                }
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                  editFormData.role === "VENDOR_HR" || (editFormData.role === "HR" && editFormData.hrType === "VENDOR_HR")
                    ? "bg-cyan-50 border-cyan-500 ring-2 ring-cyan-500/20 text-cyan-900"
                    : "bg-white border-slate-200 hover:bg-slate-50 text-slate-700"
                }`}
              >
                <div className="flex items-center gap-1 font-bold text-xs mb-1">
                  <Briefcase size={13} className="text-cyan-600" />
                  <span>Vendor HR</span>
                </div>
                <p className="text-[9.5px] text-slate-500 line-clamp-2 leading-tight">
                  Agency recruitment HR. Fixed role scope.
                </p>
              </button>
            </div>
          </div>

          {(editFormData.role === "VENDOR_HR" || editFormData.hrType === "VENDOR_HR") && (
            <div className="p-3 rounded-xl bg-cyan-50/80 border border-cyan-200 space-y-2">
              <div className="flex items-start gap-1.5">
                <Info size={14} className="text-cyan-700 shrink-0 mt-0.5" />
                <p className="text-[11px] text-cyan-900 font-medium leading-relaxed">
                  <strong>Fixed Role:</strong> Permissions are pre-assigned and restricted to candidates belonging to the selected vendor agencies.
                </p>
              </div>

              <div>
                <label className="block text-slate-800 font-bold mb-1 text-[11px]">
                  Assign Recruitment Agencies *
                </label>
                <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar bg-white rounded-lg border border-slate-200 p-2">
                  {availableVendors.length === 0 ? (
                    <div className="text-[11px] text-slate-400 italic">No vendors found.</div>
                  ) : (
                    availableVendors.map((vnd) => {
                      const vId = vnd.vendorId || vnd.id;
                      const isChecked = (editFormData.assignedVendors || []).includes(vId);
                      return (
                        <label
                          key={vId}
                          className={`flex items-center gap-2 p-1.5 rounded-md hover:bg-slate-50 text-slate-800 cursor-pointer text-xs border ${
                            isChecked ? "bg-cyan-50/50 border-cyan-300" : "border-transparent"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              const curr = editFormData.assignedVendors || [];
                              if (e.target.checked) {
                                setEditFormData({ ...editFormData, assignedVendors: [...curr, vId] });
                              } else {
                                setEditFormData({
                                  ...editFormData,
                                  assignedVendors: curr.filter((id) => id !== vId),
                                });
                              }
                            }}
                            className="rounded text-cyan-600"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="font-bold text-slate-900 truncate">
                              {vnd.companyName}
                            </div>
                            <span className="text-[9.5px] text-slate-500 font-mono">ID: {vId}</span>
                          </div>
                        </label>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="block text-slate-700 font-bold mb-1">Full Name *</label>
            <input
              type="text"
              required
              value={editFormData.name}
              onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1">Email Address *</label>
            <input
              type="email"
              required
              value={editFormData.email}
              onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs"
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="isActive"
              checked={editFormData.isActive}
              onChange={(e) => setEditFormData({ ...editFormData, isActive: e.target.checked })}
              className="rounded text-blue-600 w-3.5 h-3.5"
            />
            <label htmlFor="isActive" className="text-slate-700 font-semibold cursor-pointer">
              Account is Active
            </label>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2.5 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg text-slate-600 hover:bg-slate-100 font-semibold cursor-pointer text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold cursor-pointer text-xs shadow-xs"
            >
              {saving ? "Saving..." : "Update Details"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
