import React from "react";
import { Link } from "react-router-dom";
import { Users, ArrowRight, Edit2, Trash2 } from "lucide-react";

export default function HrRecentEmployeesTable({
  recentEmployees,
  onEditEmployee,
  onDeleteEmployee,
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200/90 shadow-2xs overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users size={16} className="text-blue-600" />
          <h2 className="text-xs sm:text-sm font-bold text-gray-900">Recent Employees</h2>
        </div>
        <Link
          to="/admin/dashboard/employees"
          className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-md transition-colors"
        >
          <span>View All Directory</span>
          <ArrowRight size={11} />
        </Link>
      </div>

      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-left text-xs border-collapse min-w-[550px]">
          <thead>
            <tr className="bg-gray-50/70 border-b border-gray-100 text-gray-400 font-bold uppercase tracking-wider text-[10px]">
              <th className="py-1.5 px-3">Employee Name</th>
              <th className="py-1.5 px-2.5">Employee ID</th>
              <th className="py-1.5 px-2.5">Department</th>
              <th className="py-1.5 px-2.5">Designation</th>
              <th className="py-1.5 px-2.5">Joining Date</th>
              <th className="py-1.5 px-2.5">Status</th>
              <th className="py-1.5 px-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {recentEmployees.map((emp) => (
              <tr key={emp.id} className="hover:bg-blue-50/30 transition-colors">
                <td className="py-1.5 px-3 font-bold text-gray-900 text-xs">
                  {emp.name}
                </td>
                <td className="py-1.5 px-2.5 text-xs font-mono font-bold text-blue-600">
                  {emp.employeeId}
                </td>
                <td className="py-1.5 px-2.5 text-xs text-gray-600">
                  {emp.department}
                </td>
                <td className="py-1.5 px-2.5 text-xs text-gray-600">
                  {emp.designation}
                </td>
                <td className="py-1.5 px-2.5 text-xs text-gray-500">
                  {emp.joiningDate}
                </td>
                <td className="py-1.5 px-2.5 text-xs">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {emp.status}
                  </span>
                </td>
                <td className="py-1.5 px-3 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      type="button"
                      onClick={() => onEditEmployee(emp)}
                      className="px-2.5 py-1 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md font-bold text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
                      title="Edit Employee Profile"
                    >
                      <Edit2 size={11} />
                      <span>Edit</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteEmployee(emp)}
                      className="px-2.5 py-1 text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-md font-bold text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
                      title="Delete Employee Record"
                    >
                      <Trash2 size={11} />
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
