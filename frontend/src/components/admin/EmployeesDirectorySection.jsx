import React from "react";
import { Plus, Edit, UserMinus } from "lucide-react";
import { EmployeeIdBadge } from "../common/ImmiGoLogo.jsx";

export default function EmployeesDirectorySection({
  employees = [],
  handleOpenAddModal,
  openEmployeeDetail,
  formatDate,
  handleEditClick,
  handleDeactivateEmployee
}) {
  return (
    <div className="space-y-6 text-left">
      <div className="flex flex-wrap justify-between items-center gap-3">
        <div>
          <h3 className="text-xl font-black text-slate-800 tracking-tight">Enterprise Workforce Directory</h3>
          <p className="text-xs text-slate-500 font-medium">
            Manage employee profiles, contact details, designations, departments, documents, and leave balances
          </p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-sm shadow-blue-500/20 transition-all"
        >
          <Plus size={15} /> Add New Employee
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
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
                  "Leave Balance",
                  "Actions",
                ].map((h) => (
                  <th
                    key={h}
                    className="px-5 py-4 text-slate-500 font-bold uppercase text-[10px] tracking-wider whitespace-nowrap"
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
                    <td className="px-5 py-4 text-sm whitespace-nowrap">
                      <EmployeeIdBadge id={emp.employeeId} />
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white font-black text-xs flex items-center justify-center shrink-0 overflow-hidden shadow-2xs">
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
                          <span className="text-[11px] text-slate-400 block">{emp.email}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-xs font-bold text-slate-700 whitespace-nowrap">
                      <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 border border-slate-200">
                        {emp.department || "General"}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-xs font-semibold text-slate-700 whitespace-nowrap">
                      <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 font-bold">
                        {emp.designation || emp.role || "Employee"}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-xs whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-1 text-xs font-black uppercase rounded-lg border ${statusColor}`}>
                        {emp.status || "active"}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-xs font-semibold text-slate-600 whitespace-nowrap">
                      {formatDate(emp.joiningDate)}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-black text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
                          {emp.leaveBalance ?? 18} days
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
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
                        {emp.status !== "inactive" ? (
                          <button
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                            onClick={() => handleDeactivateEmployee(emp._id)}
                            title="Deactivate Employee"
                          >
                            <UserMinus size={14} />
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {employees.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-400 font-semibold text-sm">
                    No registered employees in directory.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
