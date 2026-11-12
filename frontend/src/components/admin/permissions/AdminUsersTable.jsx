import {
  Search,
  UserPlus,
  Briefcase,
  Lock,
  Edit2,
  Trash2,
} from "lucide-react";

export default function AdminUsersTable({
  adminsList,
  loading,
  searchQuery,
  setSearchQuery,
  selectedAdminId,
  onSelectAdmin,
  onOpenCreateModal,
  onOpenEditModal,
  onOpenDeleteModal,
  isSuperAdmin,
  canManageStaff = false,
}) {
  const filteredAdmins = adminsList.filter((adm) => {
    const q = searchQuery.toLowerCase();
    const nameMatch = adm.name?.toLowerCase().includes(q);
    const emailMatch = adm.email?.toLowerCase().includes(q);
    const roleMatch = (adm.role || "").toLowerCase().includes(q);
    const hrTypeMatch = (adm.hrType || "").toLowerCase().includes(q);
    return nameMatch || emailMatch || roleMatch || hrTypeMatch;
  });

  return (
    <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-3.5 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Staff & Administrators ({adminsList.length})
          </h2>
          <p className="text-[10px] text-slate-500">Select user to configure permissions</p>
        </div>

        {(isSuperAdmin || canManageStaff) && (
          <button
            type="button"
            onClick={onOpenCreateModal}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
            title="Create New Admin or HR"
          >
            <UserPlus size={13} />
            <span>Create Staff</span>
          </button>
        )}
      </div>

      <div className="relative">
        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search staff by name or email..."
          className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600"
        />
      </div>

      <div className="space-y-1.5 max-h-[420px] lg:max-h-[calc(100vh-280px)] overflow-y-auto pr-1 custom-scrollbar">
        {loading ? (
          <div className="text-center py-8 text-slate-400 text-xs">Loading administrators...</div>
        ) : filteredAdmins.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-xs">No accounts found.</div>
        ) : (
          filteredAdmins.map((adm) => {
            const isSelected = (adm.id || adm._id) === selectedAdminId;
            const isSuper = Boolean(adm.isSuperAdmin || adm.role === "SUPER_ADMIN");
            const isVendor = adm.role === "VENDOR_HR" || (adm.role === "HR" && adm.hrType === "VENDOR_HR");
            const isEmployee = adm.role === "EMPLOYEE_HR" || (adm.role === "HR" && adm.hrType !== "VENDOR_HR");

            return (
              <div
                key={adm.id || adm._id}
                onClick={() => onSelectAdmin(adm.id || adm._id)}
                className={`p-2.5 rounded-xl border transition-all cursor-pointer select-none ${
                  isSelected
                    ? "bg-blue-50/80 border-blue-500 ring-1 ring-blue-500/20 shadow-xs"
                    : "bg-white border-slate-200/80 hover:bg-slate-50/80 hover:border-slate-300"
                }`}
              >
                <div className="flex items-start justify-between gap-1.5">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-xs text-slate-900 truncate">{adm.name}</span>
                      {adm.hrId && (
                        <span className="text-[9px] font-mono bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-semibold shrink-0">
                          {adm.hrId}
                        </span>
                      )}
                      {adm.isActive === false && (
                        <span className="text-[8px] bg-rose-100 text-rose-700 px-1 py-0.2 rounded font-bold uppercase">
                          Disabled
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-500 truncate mt-0.5">{adm.email}</p>
                  </div>

                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wider shrink-0 ${
                      isSuper
                        ? "bg-amber-100 text-amber-800 border border-amber-300"
                        : isVendor
                        ? "bg-cyan-100 text-cyan-800 border border-cyan-200"
                        : isEmployee
                        ? "bg-purple-100 text-purple-800 border border-purple-200"
                        : "bg-blue-100 text-blue-800 border border-blue-200"
                    }`}
                  >
                    {isSuper ? "Super Admin" : isVendor ? "Vendor HR" : isEmployee ? "Employee HR" : "Admin"}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2 pt-1.5 border-t border-slate-100">
                  {isVendor ? (
                    <span className="flex items-center gap-1 font-semibold text-cyan-700">
                      <Briefcase size={10} className="text-cyan-600" />
                      <span>Agency Scoped (Fixed Role)</span>
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 font-medium">
                      <Lock size={10} className="text-blue-500" />
                      <span>{adm.permissionCount || 0} Perms Active</span>
                    </span>
                  )}

                  <div className="flex items-center gap-1">
                    {!isSuper && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenEditModal(adm);
                        }}
                        className="p-1 hover:text-blue-600 hover:bg-blue-100 rounded text-slate-400 cursor-pointer"
                        title="Edit Account"
                      >
                        <Edit2 size={11} />
                      </button>
                    )}
                    {!isSuper && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenDeleteModal(adm);
                        }}
                        className="p-1 hover:text-rose-600 hover:bg-rose-100 rounded text-slate-400 cursor-pointer"
                        title="Delete Account"
                      >
                        <Trash2 size={11} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

