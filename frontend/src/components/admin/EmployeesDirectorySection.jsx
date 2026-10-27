import React, { useState } from "react";
import { Edit, UserMinus, UserCheck, Trash2 } from "lucide-react";
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
    <div className="space-y-6 text-left">
      <div className="flex flex-wrap justify-between items-center gap-3">
        <div>
          <h3 className="text-xl font-bold text-slate-800 tracking-tight">Enterprise Workforce Directory</h3>
          <p className="text-xs text-slate-500 font-medium">
            Manage employee profiles, contact details, designations, departments, and documents
          </p>
        </div>
        <div className="px-3.5 py-1.5 bg-blue-50 border border-blue-200 rounded-xl text-xs font-bold text-blue-700 shadow-2xs">
          Total Employees: <span className="font-bold text-blue-900">{employees.length}</span>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[850px]">
            <thead>
              <tr className="bg-slate-50/60 border-b border-slate-100">
                {[
                  "Employee ID",
                  "Employee Name",
                  "Department",
                  "Designation / Role",
                  "Status",
                  "Joining Date",
                  "Actions",
                ].map((h) => (
                  <th
                    key={h}
                    className="px-3 py-2 text-slate-500 font-bold uppercase text-[10px] tracking-wider whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
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

                return (
                  <tr
                    key={emp._id}
                    className="hover:bg-slate-50/50 transition-colors border-b border-slate-100 last:border-0"
                  >
                    <td className="px-3 py-1.5 text-xs whitespace-nowrap">
                      <EmployeeIdBadge
                        id={emp.employeeId}
                        onClick={() => openEmployeeDetail(emp._id, "employees")}
                        title="Click to view employee profile details"
                      />
                    </td>
                    <td className="px-3 py-1.5">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-xl ${emp.profileImage ? "bg-white" : "bg-blue-50 border border-blue-200 text-blue-600"} font-bold text-xs flex items-center justify-center shrink-0 overflow-hidden shadow-2xs`}>
                          {emp.profileImage ? (
                            <img src={emp.profileImage} alt={safeName} className="w-full h-full object-cover" />
                          ) : (
                            safeName.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div>
                          <button
                            className="font-bold text-slate-900 hover:text-blue-600 hover:underline cursor-pointer text-left block text-sm"
                            onClick={() => openEmployeeDetail(emp._id, "employees")}
                          >
                            {safeName}
                          </button>
                          <span className="text-[11px] text-slate-600 font-medium block">{emp.email}</span>
                          {emp.personalEmail && (
                            <span className="text-[10px] text-slate-400 block font-normal truncate max-w-[200px]" title={`Personal: ${emp.personalEmail}`}>
                              Personal: {emp.personalEmail}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-1.5 text-xs font-bold text-slate-700 whitespace-nowrap">
                      <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 border border-slate-200">
                        {emp.department || "General"}
                      </span>
                    </td>
                    <td className="px-3 py-1.5 text-xs font-semibold text-slate-700 whitespace-nowrap">
                      <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 font-bold">
                        {emp.designation || emp.role || "Employee"}
                      </span>
                    </td>
                    <td className="px-3 py-1.5 text-xs whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-1 text-xs font-bold uppercase rounded-lg border ${statusColor}`}>
                        {emp.status || "active"}
                      </span>
                    </td>
                    <td className="px-3 py-1.5 text-xs font-semibold text-slate-600 whitespace-nowrap">
                      {formatDate(emp.joiningDate)}
                    </td>
                    <td className="px-3 py-1.5 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <button
                          className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-xl text-xs flex items-center gap-1 cursor-pointer transition-colors"
                          onClick={() => openEmployeeDetail(emp._id, "employees")}
                          title="View Profile & Documents"
                        >
                          Profile & Docs
                        </button>
                        <button
                          className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs flex items-center gap-1 cursor-pointer transition-colors"
                          onClick={() => handleEditClick(emp)}
                          title="Edit Profile"
                        >
                          <Edit size={12} /> Edit
                        </button>
                        {emp.status === "inactive" ? (
                          <button
                            type="button"
                            className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 font-bold rounded-xl text-xs flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                            onClick={() => handleDeactivateEmployee(emp._id, emp.status)}
                            title="Make Employee Active (Allow attendance & portal login)"
                          >
                            <UserCheck size={13} className="text-emerald-600" />
                            <span>Make Active</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 font-bold rounded-xl text-xs flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                            onClick={() => handleDeactivateEmployee(emp._id, emp.status)}
                            title="Make Employee Inactive (Block attendance & portal login)"
                          >
                            <UserMinus size={13} className="text-rose-600" />
                            <span>Make Inactive</span>
                          </button>
                        )}
                        <button
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                          onClick={() => setDeleteTarget(emp)}
                          title="Delete Employee Permanently"
                        >
                          <Trash2 size={14} />
                        </button>
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
