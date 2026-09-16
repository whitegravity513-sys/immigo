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
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-3">
        <h3 className="text-lg font-black text-slate-800 tracking-tight">Workforce Directory</h3>
        <button onClick={handleOpenAddModal} className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-sm shadow-blue-500/20">
          <Plus size={14} /> Add New Employee
        </button>
      </div>
      <div className="bg-white rounded-2xl border border-slate-300 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr>
                {["Employee ID", "Name", "Email", "Role / Designation", "Status", "Joining Date", "Leaving Date", "Leave Balance", "Actions"].map(h => (
                  <th key={h} className="px-4 sm:px-6 py-4 text-slate-500 font-bold uppercase text-[10px] tracking-wider bg-slate-50/50 border-b border-slate-200">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {employees.map(emp => (
                <tr key={emp._id} className="hover:bg-slate-50/30 transition-colors border-b border-slate-200 last:border-0">
                  <td className="px-4 sm:px-6 py-4 text-sm">
                    <EmployeeIdBadge id={emp.employeeId} />
                  </td>
                  <td className="px-4 sm:px-6 py-4 text-sm">
                    <button className="font-bold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer text-left" onClick={() => openEmployeeDetail(emp._id, "employees")}>
                      {emp.name}
                    </button>
                  </td>
                  <td className="px-4 sm:px-6 py-4 text-sm text-slate-500">{emp.email}</td>
                  <td className="px-4 sm:px-6 py-4 text-sm">
                    <span className="inline-flex items-center px-2.5 py-0.5 bg-cyan-50 text-cyan-700 text-xs font-bold rounded-lg border border-cyan-200">
                      {emp.designation || emp.role || "Employee"}
                    </span>
                  </td>
                  <td className="px-4 sm:px-6 py-4 text-sm">
                    <span className={`inline-flex items-center px-2.5 py-0.5 text-xs font-bold rounded-lg border ${emp.status === "inactive" ? "bg-rose-50 text-rose-700 border-rose-200" : "bg-emerald-50 text-emerald-700 border-emerald-200"}`}>
                      {emp.status === "inactive" ? "Deactivated" : "Active"}
                    </span>
                  </td>
                  <td className="px-4 sm:px-6 py-4 text-sm text-slate-500">{formatDate(emp.joiningDate)}</td>
                  <td className="px-4 sm:px-6 py-4 text-sm">
                    {emp.leavingDate
                      ? <span className="text-xs font-bold text-rose-600 bg-rose-50 border border-rose-100 px-2 py-0.5 rounded-lg">{formatDate(emp.leavingDate)}</span>
                      : <span className="text-xs text-slate-500 italic">—</span>}
                  </td>
                  <td className="px-4 sm:px-6 py-4 text-sm">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs font-bold text-green-700">{emp.leaveBalance || 0} days</span>
                      <span className="text-[9px] text-slate-500">Next: {emp.nextMonthLeaves || 0}</span>
                    </div>
                  </td>
                  <td className="px-4 sm:px-6 py-4 text-sm">
                    <div className="flex items-center gap-2 flex-wrap">
                      <button className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-lg text-xs flex items-center gap-1 cursor-pointer" onClick={() => handleEditClick(emp)}>
                        <Edit size={12} /> Edit
                      </button>
                      {emp.status !== "inactive"
                        ? <button className="px-3 py-1.5 bg-rose-500 hover:bg-rose-600 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer" onClick={() => handleDeactivateEmployee(emp._id)}>
                          <UserMinus size={12} /> Deactivate
                        </button>
                        : <span className="text-xs text-slate-500 italic">Disabled</span>}
                    </div>
                  </td>
                </tr>
              ))}
              {employees.length === 0 && (
                <tr>
                  <td colSpan="9">
                    <div className="text-center py-12 text-slate-500 font-semibold text-sm">No registered employees in directory.</div>
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
