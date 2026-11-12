import { useState, useEffect } from "react";
import { Edit2, X, Shield, Users, Briefcase, Info, Eye, EyeOff, KeyRound } from "lucide-react";

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
  const [showPassword, setShowPassword] = useState(true);

  useEffect(() => {
    if (isOpen) {
      const t = setTimeout(() => {
        setShowPassword(true);
      }, 0);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end pl-4 sm:pl-10 bg-slate-900/50 backdrop-blur-2xs"
      onClick={onClose}
    >
      <div
        className="h-[100dvh] w-full max-w-md bg-white border-l border-slate-200 shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-2 px-4 sm:px-5 py-3.5 sm:py-4 border-b border-slate-200 bg-slate-50/70 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-blue-600/10 text-blue-600 flex items-center justify-center shrink-0">
              <Edit2 size={16} />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-slate-900 text-sm truncate">Edit Staff Account</h3>
              <p className="text-[11px] text-slate-500">Update profile, role, or login password</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/70 transition-colors cursor-pointer shrink-0"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="flex-1 flex flex-col justify-between overflow-y-auto custom-scrollbar">
          <div className="p-4 sm:p-5 space-y-3.5 text-xs">
            <div>
              <label className="block text-slate-800 font-bold mb-1.5">
                Account Role *
              </label>
              <div className={`grid ${isSuperAdmin ? "grid-cols-1 sm:grid-cols-3" : "grid-cols-1 sm:grid-cols-2"} gap-2`}>
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
                  <div className="max-h-40 overflow-y-auto divide-y divide-slate-100 custom-scrollbar bg-white rounded-lg border border-slate-200">
                    {availableVendors.length === 0 ? (
                      <div className="text-[11px] text-slate-400 italic p-2.5">No vendors found.</div>
                    ) : (
                      availableVendors.map((vnd) => {
                        const vId = String(vnd.vendorId || vnd.id || vnd._id || "");
                        const isChecked = (editFormData.assignedVendors || []).includes(vId);
                        return (
                          <label
                            key={vId}
                            className={`flex items-center justify-between gap-2.5 px-3 py-2 text-slate-800 cursor-pointer text-xs transition-colors ${
                              isChecked ? "bg-cyan-50/70" : "hover:bg-slate-50"
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
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
                                className="rounded text-cyan-600 shrink-0"
                              />
                              <span className="font-semibold text-slate-900 truncate">
                                {vnd.companyName}
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-500 font-mono shrink-0">
                              {vId}
                            </span>
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
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Email Address (Login ID) *</label>
              <input
                type="email"
                required
                value={editFormData.email}
                onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-slate-700 font-bold flex items-center gap-1">
                  <KeyRound size={12} className="text-blue-600" />
                  <span>Login Password</span>
                </label>
                <span className="text-[10px] text-slate-500 font-medium">
                  {editFormData.password ? "Current / Editable" : "Set new password"}
                </span>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  minLength={6}
                  placeholder={editFormData.password ? "Current password" : "Enter new password (min 6 chars)"}
                  value={editFormData.password || ""}
                  onChange={(e) => setEditFormData({ ...editFormData, password: e.target.value })}
                  className="w-full pl-3 pr-9 py-2 rounded-lg border border-slate-200 bg-slate-50/70 font-mono text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              <p className="text-[10px] text-slate-500 mt-1">
                Editing the password will update credentials and email the new password to the user.
              </p>
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
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2 px-5 py-3.5 border-t border-slate-200 bg-slate-50/80 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-lg text-slate-600 hover:bg-slate-200/70 font-semibold cursor-pointer text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold cursor-pointer text-xs shadow-xs disabled:opacity-60"
            >
              {saving ? "Saving..." : "Update Details"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
