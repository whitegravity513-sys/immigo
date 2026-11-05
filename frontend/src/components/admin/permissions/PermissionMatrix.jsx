import React from "react";
import {
  Shield,
  ShieldCheck,
  Users,
  AlertTriangle,
  RotateCcw,
  Save,
  ChevronDown,
  ChevronRight,
  CheckSquare,
  Square,
} from "lucide-react";

export default function PermissionMatrix({
  selectedAdminData,
  visibleGroups,
  expandedGroups,
  toggleGroup,
  setAllGroups,
  isPermissionChecked,
  togglePermission,
  selectAllInGroup,
  clearAllInGroup,
  handleSelectAllGlobal,
  handleClearAllGlobal,
  effectivePermissions,
  initialPermissions,
  setEffectivePermissions,
  changesDiff,
  allCurrentKeys,
  isSuperAdmin,
  isSelectedAdmin,
  isSelectedEmployeeHR,
  saving,
  onOpenConfirmSave,
}) {
  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              {selectedAdminData.name}
            </h2>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                selectedAdminData.isSuperAdmin
                  ? "bg-amber-100 text-amber-900 border border-amber-300"
                  : isSelectedEmployeeHR
                  ? "bg-purple-100 text-purple-900 border border-purple-200"
                  : "bg-blue-100 text-blue-900 border border-blue-200"
              }`}
            >
              {selectedAdminData.isSuperAdmin
                ? "Super Admin"
                : isSelectedEmployeeHR
                ? "Employee HR"
                : "Admin"}
            </span>
            {!selectedAdminData.isActive && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider bg-rose-100 text-rose-800 border border-rose-200">
                Disabled
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-500 font-medium mt-0.5">
            {selectedAdminData.email} &bull; Granted Capabilities:{" "}
            <strong className="text-blue-600 font-bold">
              {selectedAdminData.isSuperAdmin
                ? "All Access (Wildcard *)"
                : isSelectedEmployeeHR
                ? `${effectivePermissions.length} / ${allCurrentKeys.length} Employee HR Permissions`
                : `${effectivePermissions.length} / ${allCurrentKeys.length} Permissions`}
            </strong>
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isSuperAdmin && changesDiff.hasChanges && !selectedAdminData.isSuperAdmin && (
            <button
              type="button"
              onClick={() => setEffectivePermissions([...initialPermissions])}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 border border-slate-200 cursor-pointer"
            >
              <RotateCcw size={12} />
              <span>Reset</span>
            </button>
          )}

          {isSuperAdmin && !selectedAdminData.isSuperAdmin && (
            <button
              type="button"
              onClick={onOpenConfirmSave}
              disabled={!changesDiff.hasChanges || saving}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                changesDiff.hasChanges
                  ? "bg-blue-600 hover:bg-blue-700 text-white shadow-xs cursor-pointer"
                  : "bg-slate-100 text-slate-400 cursor-not-allowed"
              }`}
            >
              <Save size={13} />
              <span>{saving ? "Saving..." : "Save Changes"}</span>
              {changesDiff.hasChanges && (
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              )}
            </button>
          )}
        </div>
      </div>

      {selectedAdminData.isSuperAdmin && (
        <div className="mt-2.5 p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2.5">
          <ShieldCheck size={16} className="text-amber-600 shrink-0" />
          <div>
            <strong>Super Administrator:</strong> Full system access is active. All
            modules & sub-sections are automatically authorized.
          </div>
        </div>
      )}

      {isSelectedEmployeeHR && (
        <div className="mt-2.5 p-2.5 rounded-xl bg-purple-50/80 border border-purple-200 text-purple-900 text-xs flex items-center gap-2.5">
          <Users size={16} className="text-purple-600 shrink-0" />
          <div>
            <strong>Employee HR Scope:</strong> Configured exclusively for workforce operations — employee profiles, daily attendance registers, leave approvals, and internal staff meetings.
          </div>
        </div>
      )}

      {isSelectedAdmin && !selectedAdminData.isSuperAdmin && (
        <div className="mt-2.5 p-2.5 rounded-xl bg-blue-50/80 border border-blue-200 text-blue-900 text-xs flex items-center gap-2.5">
          <Shield size={16} className="text-blue-600 shrink-0" />
          <div>
            <strong>Administrator Scope:</strong> Full operational access across all 7 management modules (HR, Clients, Projects, Vendors, Candidates, Finance, and Reports).
          </div>
        </div>
      )}

      {isSuperAdmin && !selectedAdminData.isSuperAdmin && (
        <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 p-2 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-bold text-[10px] uppercase tracking-wider">
              Quick Expand:
            </span>
            <button
              type="button"
              onClick={() => setAllGroups(true)}
              className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700 hover:text-blue-600 font-semibold text-[11px] cursor-pointer shadow-2xs"
            >
              Expand All
            </button>
            <button
              type="button"
              onClick={() => setAllGroups(false)}
              className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700 hover:text-blue-600 font-semibold text-[11px] cursor-pointer shadow-2xs"
            >
              Collapse All
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleSelectAllGlobal}
              className="px-2.5 py-1 rounded-md bg-blue-100 hover:bg-blue-200 text-blue-800 font-bold text-[11px] cursor-pointer"
            >
              {isSelectedEmployeeHR ? "Select All HR Modules" : "Select All Modules"}
            </button>
            <button
              type="button"
              onClick={handleClearAllGlobal}
              className="px-2.5 py-1 rounded-md bg-rose-100 hover:bg-rose-200 text-rose-800 font-bold text-[11px] cursor-pointer"
            >
              Clear All
            </button>
          </div>
        </div>
      )}

      {changesDiff.hasChanges && !selectedAdminData.isSuperAdmin && (
        <div className="mt-2 p-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <AlertTriangle size={13} className="text-amber-600 shrink-0" />
            <span>
              Pending changes: <strong>+{changesDiff.added.length}</strong> granted,{" "}
              <strong>-{changesDiff.removed.length}</strong> revoked. Click &apos;Save Changes&apos; to commit.
            </span>
          </div>
        </div>
      )}

      <div className="mt-3 space-y-2.5">
        {visibleGroups.map((group) => {
          const GroupIcon = group.icon;
          const isOpen = Boolean(expandedGroups[group.id]);

          const groupAllKeys = group.subsections.flatMap((s) =>
            s.actions.map((a) => a.key)
          );
          const grantedInGroup = groupAllKeys.filter((k) =>
            isPermissionChecked(k)
          ).length;
          const isAllGranted =
            groupAllKeys.length > 0 && grantedInGroup === groupAllKeys.length;

          return (
            <div
              key={group.id}
              className="border border-slate-200 rounded-xl overflow-hidden transition-all duration-150 shadow-2xs bg-white"
            >
              <div
                onClick={() => toggleGroup(group.id)}
                className={`px-3 py-2.5 flex items-center justify-between gap-3 cursor-pointer select-none transition-colors ${
                  isOpen ? "bg-slate-50 border-b border-slate-200" : group.headerBg
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="text-slate-400 group-hover:text-slate-600 transition-transform">
                    {isOpen ? (
                      <ChevronDown size={16} className="text-blue-600" />
                    ) : (
                      <ChevronRight size={16} />
                    )}
                  </div>

                  <span className={`p-1.5 rounded-lg border ${group.color}`}>
                    <GroupIcon size={14} />
                  </span>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-slate-900">
                        {group.title}
                      </span>
                      <span className="text-[10px] text-slate-400 font-normal hidden sm:inline truncate">
                        &bull; {group.desc}
                      </span>
                    </div>
                  </div>
                </div>

                <div
                  className="flex items-center gap-2 shrink-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                      isAllGranted
                        ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                        : grantedInGroup > 0
                        ? "bg-blue-100 text-blue-800 border border-blue-200"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {grantedInGroup} / {groupAllKeys.length} Granted
                  </span>

                  {!selectedAdminData.isSuperAdmin && (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => selectAllInGroup(group)}
                        className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 cursor-pointer"
                        title="Grant all in this section"
                      >
                        Select All
                      </button>
                      <button
                        type="button"
                        onClick={() => clearAllInGroup(group)}
                        className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600 hover:bg-slate-200 cursor-pointer"
                        title="Clear all in this section"
                      >
                        Clear
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {isOpen && (
                <div className="p-3 bg-slate-50/40 space-y-3 animate-in fade-in duration-150">
                  {group.subsections.map((sub) => (
                    <div
                      key={sub.id}
                      className="bg-white rounded-lg border border-slate-200/80 p-3 space-y-2"
                    >
                      <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                        <div>
                          <h4 className="font-bold text-xs text-slate-900">
                            {sub.name}
                          </h4>
                          <p className="text-[10px] text-slate-400">
                            {sub.desc}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 pt-1">
                        {sub.actions.map((act) => {
                          const checked = isPermissionChecked(act.key);
                          const disabled = selectedAdminData.isSuperAdmin || !isSuperAdmin;

                          return (
                            <label
                              key={act.key}
                              onClick={(e) => {
                                if (disabled) return;
                                e.preventDefault();
                                togglePermission(act.key);
                              }}
                              className={`flex items-start gap-2 p-2 rounded-lg border text-left transition-all select-none ${
                                disabled
                                  ? "opacity-60 bg-slate-50 border-slate-200 cursor-default"
                                  : checked
                                  ? "bg-blue-50/70 border-blue-300 ring-1 ring-blue-500/20 cursor-pointer shadow-2xs"
                                  : "bg-white border-slate-200/80 hover:border-slate-300 cursor-pointer"
                              }`}
                            >
                              <div className="mt-0.5 shrink-0">
                                {checked ? (
                                  <CheckSquare
                                    size={15}
                                    className="text-blue-600"
                                  />
                                ) : (
                                  <Square
                                    size={15}
                                    className="text-slate-300 hover:text-slate-400"
                                  />
                                )}
                              </div>

                              <div className="min-w-0">
                                <div className="flex items-center gap-1">
                                  <span
                                    className={`text-xs font-bold leading-tight truncate ${
                                      checked ? "text-blue-900" : "text-slate-800"
                                    }`}
                                  >
                                    {act.label}
                                  </span>
                                  {act.isDanger && (
                                    <span className="text-[8px] bg-rose-100 text-rose-700 px-1 py-0.2 rounded font-bold uppercase">
                                      Delete
                                    </span>
                                  )}
                                  {act.isHighlight && (
                                    <span className="text-[8px] bg-emerald-100 text-emerald-700 px-1 py-0.2 rounded font-bold uppercase">
                                      Approval
                                    </span>
                                  )}
                                </div>
                                <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">
                                  {act.desc}
                                </p>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
