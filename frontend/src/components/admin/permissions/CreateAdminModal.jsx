import { useState } from "react";
import { UserPlus, X, Shield, Users, Briefcase, Info, Eye, EyeOff, Mail } from "lucide-react";

export default function CreateAdminModal({
  isOpen,
  onClose,
  formData,
  setFormData,
  onSubmit,
  creating,
  availableVendors,
  isSuperAdmin,
}) {
  const [showPassword, setShowPassword] = useState(false);

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
              <UserPlus size={16} />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-slate-900 text-sm truncate">Create Staff Account</h3>
              <p className="text-[11px] text-slate-500">Login ID & password will be sent to email</p>
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
                Select Account Type *
              </label>
              <div className={`grid ${isSuperAdmin ? "grid-cols-1 sm:grid-cols-3" : "grid-cols-1 sm:grid-cols-2"} gap-2`}>
                {isSuperAdmin && (
                  <button
                    type="button"
                    onClick={() =>
                      setFormData({
                        ...formData,
                        role: "ADMIN",
                        hrType: "",
                        assignedVendors: [],
                      })
                    }
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      formData.role === "ADMIN"
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
                    setFormData({
                      ...formData,
                      role: "EMPLOYEE_HR",
                      hrType: "EMPLOYEE_HR",
                      assignedVendors: [],
                    })
                  }
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    formData.role === "EMPLOYEE_HR"
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
                    setFormData({
                      ...formData,
                      role: "VENDOR_HR",
                      hrType: "VENDOR_HR",
                    })
                  }
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    formData.role === "VENDOR_HR"
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

            {formData.role === "VENDOR_HR" && (
              <div className="p-3 rounded-xl bg-cyan-50/80 border border-cyan-200 space-y-2">
                <div className="flex items-start gap-1.5">
                  <Info size={14} className="text-cyan-700 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-cyan-900 font-medium leading-relaxed">
                    <strong>Fixed Role:</strong> Permissions are automatically assigned. Candidates submitted by the selected agencies will be managed by this HR.
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
                        const isChecked = (formData.assignedVendors || []).includes(vId);
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
                                  const curr = formData.assignedVendors || [];
                                  if (e.target.checked) {
                                    setFormData({ ...formData, assignedVendors: [...curr, vId] });
                                  } else {
                                    setFormData({
                                      ...formData,
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
                placeholder="e.g. Rajesh Kumar"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Email Address (Login ID) *</label>
              <input
                type="email"
                required
                placeholder="e.g. rajesh@immigo.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Login Password *</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={6}
                  placeholder="Minimum 6 characters"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full pl-3 pr-9 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
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
            </div>

            <div className="p-2.5 rounded-lg bg-blue-50/70 border border-blue-200/80 flex items-center gap-2 text-[11px] text-blue-900">
              <Mail size={14} className="text-blue-600 shrink-0" />
              <span>Login ID and password will be sent directly to the entered email address.</span>
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
              disabled={creating}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold cursor-pointer text-xs shadow-xs disabled:opacity-60"
            >
              {creating ? "Creating..." : "Create Account"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
