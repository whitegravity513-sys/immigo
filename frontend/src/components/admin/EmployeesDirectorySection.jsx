import React, { useState } from "react";
import { Edit, UserMinus, UserCheck, Trash2, MoreVertical, Eye } from "lucide-react";
import { EmployeeIdBadge } from "../common/ImmiGoLogo.jsx";
import DeleteConfirmModal from "../common/DeleteConfirmModal.jsx";
import employeeService from "../../services/employeeService.js";

export default function EmployeesDirectorySection({
  employees = [],
  handleOpenAddModal,
  openEmployeeDetail,
  formatDate,
  handleEditClick,
  handleDeactivateEmployee,
  onRefresh,
}) {
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [actionOpenId, setActionOpenId] = useState(null);

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await employeeService.deleteEmployee(deleteTarget._id || deleteTarget.id);
      setDeleteTarget(null);
      if (onRefresh) onRefresh();
      else window.location.reload();
    } catch (err) {
      alert(err.response?.data?.message || err.message || "Failed to delete employee.");
    } finally {
      setDeleting(false);
    }
  };
  return (
    <div className="space-y-3 text-left">
      <div className="flex flex-wrap justify-between items-center gap-2">
        <div>
          <h3 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">Workforce Directory</h3>
          <p className="text-[10px] sm:text-[11px] text-slate-500 font-medium">
            Manage employee profiles, contact details, designations, departments, and documents
          </p>
        </div>
        <div className="px-3 py-1 bg-blue-50 border border-blue-200 rounded-lg text-xs font-bold text-blue-700 shadow-2xs">
          Total Employees: <span className="font-bold text-blue-900">{employees.length}</span>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse table-auto sm:table-fixed">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                <th className="px-3 py-2 w-[16%]">Employee ID</th>
                <th className="px-3 py-2 w-[24%]">Employee Name</th>
                <th className="px-2.5 py-2 w-[15%]">Department</th>
                <th className="px-2.5 py-2 w-[15%]">Designation / Role</th>
                <th className="px-2.5 py-2 w-[12%]">Status</th>
                <th className="px-2.5 py-2 w-[12%]">Joining Date</th>
                <th className="px-2 py-2 w-[6%] text-center">Options</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {employees.map((emp) => {
                const safeName =
                  typeof emp?.name === "string"
                    ? emp.name
                    : emp?.name?.first
                    ? `${emp.name.first} ${emp.name.last}`
                    : String(emp?.name || "Employee");

                const statusColor =
                  emp.status === "inactive"
                    ? "bg-rose-50 text-rose-700 border-rose-200"
                    : emp.status === "probation"
                    ? "bg-amber-50 text-amber-700 border-amber-200"
                    : emp.status === "on_leave"
                    ? "bg-blue-50 text-blue-700 border-blue-200"
                    : "bg-emerald-50 text-emerald-700 border-emerald-200";

                const isMenuOpen = actionOpenId === emp._id;

                return (
                  <tr
                    key={emp._id}
                    className="hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="px-3 py-2 text-xs whitespace-nowrap">
                      <EmployeeIdBadge
                        id={emp.employeeId}
                        size="xs"
                        onClick={() => openEmployeeDetail(emp._id, "employees")}
                        title="Click to view employee profile details"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className={`w-7 h-7 rounded-lg ${emp.profileImage ? "bg-white" : "bg-blue-50 border border-blue-200 text-blue-600"} font-bold text-xs flex items-center justify-center shrink-0 overflow-hidden shadow-2xs`}>
                          {emp.profileImage ? (
                            <img src={emp.profileImage} alt={safeName} className="w-full h-full object-cover" />
                          ) : (
                            safeName.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div className="min-w-0">
                          <button
                            className="font-bold text-slate-900 hover:text-blue-600 hover:underline cursor-pointer text-left block text-xs truncate max-w-[130px] sm:max-w-none"
                            onClick={() => openEmployeeDetail(emp._id, "employees")}
                            title={safeName}
                          >
                            {safeName}
                          </button>
                          <span className="text-[10px] text-slate-500 font-medium block truncate max-w-[140px]">{emp.email}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-2.5 py-2 text-xs">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200 text-[11px] font-semibold truncate inline-block max-w-[110px]">
                        {emp.department || "General"}
                      </span>
                    </td>
                    <td className="px-2.5 py-2 text-xs">
                      <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 text-[11px] font-bold truncate inline-block max-w-[110px]">
                        {emp.designation || emp.role || "Employee"}
                      </span>
                    </td>
                    <td className="px-2.5 py-2 text-xs whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-bold uppercase rounded-md border ${statusColor}`}>
                        {emp.status || "active"}
                      </span>
                    </td>
                    <td className="px-2.5 py-2 text-[11px] font-medium text-slate-600 whitespace-nowrap">
                      {formatDate(emp.joiningDate)}
                    </td>
                    <td className="px-2 py-2 text-center whitespace-nowrap relative">
                      <div className="relative inline-block text-left">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActionOpenId(isMenuOpen ? null : emp._id);
                          }}
                          className={`p-1 rounded-md border transition-all cursor-pointer ${
                            isMenuOpen
                              ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                              : "bg-slate-50 hover:bg-slate-200/80 text-slate-600 border-slate-200"
                          }`}
                          title="Actions menu"
                        >
                          <MoreVertical size={13} />
                        </button>

                        {isMenuOpen && (
                          <>
                            <div
                              className="fixed inset-0 z-40 cursor-default"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActionOpenId(null);
                              }}
                            />
                            <div className="absolute right-0 bottom-full mb-1.5 w-44 bg-white rounded-xl shadow-xl border border-slate-200 py-1 z-50 text-xs font-semibold text-slate-700 text-left animate-in fade-in duration-100">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActionOpenId(null);
                                  openEmployeeDetail(emp._id, "employees");
                                }}
                                className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-blue-50 hover:text-blue-700 transition-colors cursor-pointer"
                              >
                                <Eye size={12} className="text-blue-600 shrink-0" />
                                <span>Profile & Docs</span>
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActionOpenId(null);
                                  handleEditClick(emp);
                                }}
                                className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer border-t border-slate-100"
                              >
                                <Edit size={12} className="text-slate-600 shrink-0" />
                                <span>Edit Employee</span>
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActionOpenId(null);
                                  handleDeactivateEmployee(emp._id, emp.status);
                                }}
                                className={`w-full flex items-center gap-2 px-3 py-1.5 transition-colors cursor-pointer border-t border-slate-100 ${
                                  emp.status === "inactive"
                                    ? "hover:bg-emerald-50 text-emerald-700"
                                    : "hover:bg-amber-50 text-amber-700"
                                }`}
                              >
                                {emp.status === "inactive" ? (
                                  <>
                                    <UserCheck size={12} className="text-emerald-600 shrink-0" />
                                    <span>Make Active</span>
                                  </>
                                ) : (
                                  <>
                                    <UserMinus size={12} className="text-amber-600 shrink-0" />
                                    <span>Make Inactive</span>
                                  </>
                                )}
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActionOpenId(null);
                                  setDeleteTarget(emp);
                                }}
                                className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-rose-50 text-rose-600 transition-colors cursor-pointer border-t border-slate-100"
                              >
                                <Trash2 size={12} className="text-rose-600 shrink-0" />
                                <span>Delete Employee</span>
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {employees.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400 font-semibold text-sm">
                    No registered employees in directory.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {}
      <DeleteConfirmModal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Employee Record"
        message="Are you sure you want to delete this employee from the workforce directory? This action cannot be reversed."
        itemName={deleteTarget ? `${deleteTarget.name} (${deleteTarget.employeeId})` : ""}
        loading={deleting}
        confirmText="Delete Employee"
      />
    </div>
  );
}
