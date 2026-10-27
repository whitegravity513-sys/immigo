import React from "react";
import { Link } from "react-router-dom";
import { Users, ArrowRight, Edit2, Trash2 } from "lucide-react";

export default function HrRecentEmployeesTable({
  recentEmployees,
  onEditEmployee,
  onDeleteEmployee,
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200/90 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Users size={18} className="text-blue-600" />
          <h2 className="text-sm font-bold text-gray-900">Recent Employees</h2>
        </div>
        <Link
          to="/admin/dashboard/employees"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors"
        >
          <span>View All Directory</span>
          <ArrowRight size={12} />
        </Link>
      </div>

      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-left text-xs border-collapse min-w-[600px]">
          <thead>
            <tr className="bg-gray-50/70 border-b border-gray-100 text-gray-400 font-bold uppercase tracking-wider text-[11px]">
              <th className="py-3.5 px-4">Employee Name</th>
              <th className="py-3.5 px-4">Employee ID</th>
              <th className="py-3.5 px-4">Department</th>
              <th className="py-3.5 px-4">Designation</th>
              <th className="py-3.5 px-4">Joining Date</th>
              <th className="py-3.5 px-4">Status</th>
              <th className="py-3.5 px-5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {recentEmployees.map((emp) => (
              <tr key={emp.id} className="hover:bg-blue-50/30 transition-colors">
                <td className="py-4 px-4 font-bold text-gray-900 text-sm">
                  {emp.name}
                </td>
                <td className="py-4 px-4 font-mono font-bold text-blue-600 text-xs">
                  {emp.employeeId}
                </td>
                <td className="py-4 px-4 text-xs text-gray-600">
                  {emp.department}
                </td>
                <td className="py-4 px-4 text-xs text-gray-600">
                  {emp.designation}
                </td>
                <td className="py-4 px-4 text-xs text-gray-500">
                  {emp.joiningDate}
                </td>
                <td className="py-4 px-4 text-xs">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold uppercase border ${
                    emp.status === "inactive"
                      ? "bg-rose-50 text-rose-700 border-rose-200"
                      : emp.status === "Probation"
                      ? "bg-amber-50 text-amber-700 border-amber-200"
                      : "bg-emerald-50 text-emerald-700 border-emerald-200"
                  }`}>
                    {emp.status || "active"}
                  </span>
                </td>
                <td className="py-4 px-5 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => onEditEmployee(emp)}
                      className="px-3 py-1.5 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                      title="Edit Employee Profile"
                    >
                      <Edit2 size={12} />
                      <span>Edit</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteEmployee(emp)}
                      className="px-3 py-1.5 text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                      title="Delete Employee Record"
                    >
                      <Trash2 size={12} />
                      <span>Delete</span>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
