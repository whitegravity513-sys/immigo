import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { ArrowLeft, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { useEmployeeDetail } from "../../../hooks/useEmployeeDetail";

function EmployeeDetail() {
  const navigate = useNavigate();
  const location = useLocation();
  // Extract employee ObjectId from URL: /admin/dashboard/employee/:id
  const id = location.pathname.split("/").pop();

  const {
    employee,
    note,
    leaves,
    noteDate,
    loading,
    error,
    handleDateChange
  } = useEmployeeDetail(id);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-xl font-medium text-slate-600">Loading employee details…</div>
      </div>
    );
  }

  if (error) {
    return <div className="p-6 text-red-600">{error}</div>;
  }

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      <button onClick={() => navigate(-1)} className="flex items-center text-slate-600 hover:text-slate-800 mb-4 cursor-pointer">
        <ArrowLeft size={16} className="mr-1" /> Back
      </button>

      {employee && (
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-800">{employee.name}</h1>
          <p className="text-sm text-slate-500">{employee.employeeId} • {employee.designation || "Employee"}</p>
          {employee.leavingDate && (
            <span className="mt-2 inline-block bg-rose-100 text-rose-800 text-xs px-2 py-0.5 rounded font-semibold">
              Left on {new Date(employee.leavingDate).toLocaleDateString()}
            </span>
          )}
        </div>
      )}

      {/* Daily Note */}
      <section className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-bold text-slate-700">Daily Checkout Note</h2>
          <DatePicker
            selected={noteDate}
            onChange={handleDateChange}
            placeholderText="Select date"
            dateFormat="dd/MM/yyyy"
            className="border border-slate-300 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            maxDate={new Date()}
          />
        </div>
        {note ? (
          <div className="space-y-1 bg-slate-50 p-4 rounded-lg border border-slate-100 mt-2">
            <p className="text-sm text-slate-700 font-medium">{note.checkOutNote}</p>
            <p className="text-xs font-bold text-slate-400 mt-2">
              Time: {new Date(note.checkOutTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </p>
          </div>
        ) : (
          <p className="text-sm text-slate-400 mt-2">No note for the selected day.</p>
        )}
      </section>

      {/* Leave History */}
      <section className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <h2 className="text-lg font-bold text-slate-700 mb-4">Leave History</h2>
        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="min-w-full table-auto text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-xs font-bold uppercase text-slate-600">Type</th>
                <th className="px-4 py-3 text-xs font-bold uppercase text-slate-600">Period</th>
                <th className="px-4 py-3 text-xs font-bold uppercase text-slate-600">Status</th>
                <th className="px-4 py-3 text-xs font-bold uppercase text-slate-600">Admin Remark</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {leaves.length > 0 ? (
                leaves.map((l) => (
                  <tr key={l._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3 text-sm font-semibold text-slate-800">{l.leaveType}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {new Date(l.startDate).toLocaleDateString()} – {new Date(l.endDate).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-sm font-bold">
                      {l.status === "Approved" ? (
                        <span className="inline-flex items-center gap-1.5 text-green-700 bg-green-50 px-2 py-1 rounded">
                          <CheckCircle size={14} /> Approved
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-rose-700 bg-rose-50 px-2 py-1 rounded">
                          <XCircle size={14} /> Rejected
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600 max-w-xs truncate">
                      {l.adminRemark || <span className="text-slate-400 italic">—</span>}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="p-6 text-center text-slate-400 text-sm">No leave records found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

export default EmployeeDetail;
