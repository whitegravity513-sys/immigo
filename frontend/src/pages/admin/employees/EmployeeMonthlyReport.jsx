import React from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import {
  Calendar,
  Coffee,
  CheckCircle,
  AlertCircle,
  ChevronLeft,
  Download,
  TrendingUp,
  Clock
} from "lucide-react";
import { useEmployeeMonthlyReport } from "../../../hooks/useEmployeeMonthlyReport";

// Custom DatePicker styles to fix visibility
const datePickerStyles = `
  .react-datepicker-wrapper {
    width: 100%;
  }
  .react-datepicker__input-container {
    width: 100%;
  }
  .react-datepicker {
    background-color: #ffffff !important;
    border: 1px solid #cbd5e1 !important;
    color: #000000 !important;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1) !important;
  }
  .react-datepicker__header {
    background-color: #3b82f6 !important;
    color: #ffffff !important;
    border-bottom: 1px solid #cbd5e1 !important;
  }
  .react-datepicker__month {
    color: #000000 !important;
  }
  .react-datepicker__month-year {
    color: #ffffff !important;
    font-weight: bold !important;
  }
  .react-datepicker__day {
    color: #000000 !important;
    background-color: #ffffff !important;
  }
  .react-datepicker__day:hover {
    background-color: #dbeafe !important;
    color: #000000 !important;
  }
  .react-datepicker__day--selected {
    background-color: #3b82f6 !important;
    color: #ffffff !important;
  }
  .react-datepicker__day-name {
    color: #000000 !important;
  }
  .react-datepicker__navigation {
    top: 10px !important;
  }
  .react-datepicker__navigation--previous,
  .react-datepicker__navigation--next {
    width: 28px !important;
    height: 28px !important;
    line-height: 28px !important;
    background-color: transparent !important;
    color: #ffffff !important;
  }
  .react-datepicker__navigation--previous:hover,
  .react-datepicker__navigation--next:hover {
    background-color: rgba(255, 255, 255, 0.1) !important;
  }
  .react-datepicker__day--outside-month {
    color: #cbd5e1 !important;
  }
  .react-datepicker__day--today {
    font-weight: bold !important;
    background-color: #fef08a !important;
    color: #000000 !important;
  }
`;

const styleSheet = document.createElement("style");
styleSheet.textContent = datePickerStyles;
if (document.head) {
  document.head.appendChild(styleSheet);
}

function EmployeeMonthlyReport({ token, onGoBack }) {
  const {
    selectedEmployee,
    setSelectedEmployee,
    selectedMonth,
    setSelectedMonth,
    monthlyData,
    loading,
    errorMsg,
    successMsg,
    searchTerm,
    setSearchTerm,
    filteredEmployees,
    fetchMonthlyReport,
    downloadReport,
    formatTime,
    formatDate
  } = useEmployeeMonthlyReport(token);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <button
          onClick={onGoBack}
          className="p-2 hover:bg-white rounded-lg transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-6 h-6 text-slate-600" />
        </button>
        <h1 className="text-3xl font-bold text-slate-900">Employee Monthly Report</h1>
      </div>

      {/* Messages */}
      {errorMsg && (
        <div className="mb-4 p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-3 text-rose-700">
          <AlertCircle className="w-5 h-5" />
          {errorMsg}
        </div>
      )}
      {successMsg && (
        <div className="mb-4 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3 text-emerald-700">
          <CheckCircle className="w-5 h-5" />
          {successMsg}
        </div>
      )}

      {/* Selection Section */}
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Employee Search */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Select Employee</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Search by name or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg bg-white text-black placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"     
              />
              {searchTerm && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-800 text-black rounded-lg shadow-lg max-h-48 overflow-y-auto z-10">
                  {filteredEmployees.map((emp) => (
                    <div
                      key={emp._id}
                      onClick={() => {
                        setSelectedEmployee(emp);
                        setSearchTerm("");
                      }}
                      className="px-4 py-2 hover:bg-blue-50 cursor-pointer border-b border-slate-800 last:border-b-0"
                    >
                      <div className="font-bold text-slate-900">{typeof emp?.name === 'string' ? emp.name : (emp?.name?.first ? `${emp.name.first} ${emp.name.last}` : String(emp?.name || ""))}</div>
                      <div className="text-sm text-slate-700">{emp.employeeId}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {selectedEmployee && (
              <div className="mt-2 p-3 bg-green-50 rounded-lg border border-green-200">
                <div className="font-bold text-green-900">{typeof selectedEmployee?.name === 'string' ? selectedEmployee.name : (selectedEmployee?.name?.first ? `${selectedEmployee.name.first} ${selectedEmployee.name.last}` : String(selectedEmployee?.name || ""))}</div>
                <div className="text-sm text-green-700">{selectedEmployee.employeeId}</div>
                {selectedEmployee.joiningDate && (
                  <div className="text-xs text-green-600 mt-1 font-semibold">
                    📅 Joined: {new Date(selectedEmployee.joiningDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Month Picker */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Select Month</label>
            <DatePicker
              selected={selectedMonth}
              onChange={(date) => setSelectedMonth(date)}
              dateFormat="MMMM yyyy"
              showMonthYearPicker
              minDate={selectedEmployee?.joiningDate ? new Date(selectedEmployee.joiningDate) : undefined}
              maxDate={new Date()}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg bg-white text-black focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            {selectedEmployee?.joiningDate && (
              <div className="text-xs text-slate-500 mt-1">
                Earliest: {new Date(selectedEmployee.joiningDate).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-end gap-2">
            <button
              onClick={fetchMonthlyReport}
              disabled={!selectedEmployee || loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <TrendingUp className="w-4 h-4" />
              {loading ? "Loading..." : "Generate Report"}
            </button>
            {monthlyData && (
              <button
                onClick={downloadReport}
                className="px-4 py-2 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                Download Excel (.xlsx)
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Report Section */}
      {monthlyData && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl shadow p-4 border-l-4 border-blue-500">
              <div className="text-sm text-slate-600 font-bold">Working Days</div>
              <div className="text-2xl font-bold text-slate-900">{monthlyData.summary?.totalWorkingDays ?? 0}</div>
            </div>
            <div className="bg-white rounded-xl shadow p-4 border-l-4 border-emerald-500">
              <div className="text-sm text-slate-600 font-bold">Present Days</div>
              <div className="text-2xl font-bold text-emerald-600">{monthlyData.summary?.presentDays ?? 0}</div>
            </div>
            <div className="bg-white rounded-xl shadow p-4 border-l-4 border-amber-500">
              <div className="text-sm text-slate-600 font-bold">Absent Days</div>
              <div className="text-2xl font-bold text-amber-600">{monthlyData.summary?.absentDays ?? 0}</div>
            </div>
            <div className="bg-white rounded-xl shadow p-4 border-l-4 border-purple-500">
              <div className="text-sm text-slate-600 font-bold">Total Work Hours</div>
              <div className="text-2xl font-bold text-purple-600">{monthlyData.summary?.totalWorkHours ?? "0h 0m"}</div>
            </div>
          </div>

          {/* Additional Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-cyan-50 to-cyan-100 rounded-xl p-4 border border-cyan-200">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-slate-600 font-bold mb-1">Half Days</div>
                  <div className="text-3xl font-bold text-cyan-700">{monthlyData.summary?.halfDays ?? 0}</div>
                </div>
                <Calendar className="w-8 h-8 text-cyan-400 opacity-50" />
              </div>
            </div>
            <div className="bg-gradient-to-br from-rose-50 to-rose-100 rounded-xl p-4 border border-rose-200">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-slate-600 font-bold mb-1">Leave Days</div>
                  <div className="text-3xl font-bold text-rose-700">{monthlyData.summary?.totalLeaveDays ?? 0}</div>
                </div>
                <CheckCircle className="w-8 h-8 text-rose-400 opacity-50" />
              </div>
            </div>
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4 border border-orange-200">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-slate-600 font-bold mb-1">Avg Work Hours/Day</div>
                  <div className="text-3xl font-bold text-orange-700">{monthlyData.summary?.averageWorkHoursPerDay ?? "0h 0m"}</div>
                </div>
                <Clock className="w-8 h-8 text-orange-400 opacity-50" />
              </div>
            </div>
          </div>

          {/* Daily Records Table */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-green-600 to-emerald-700 px-6 py-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Daily Attendance Details
                {monthlyData.employee?.joiningDate && (
                  <span className="ml-auto text-xs font-semibold text-green-100 bg-green-800/40 px-2 py-1 rounded-lg">
                    From Joining: {new Date(monthlyData.employee.joiningDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                )}
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="px-6 py-3 text-left text-xs font-bold text-slate-700 uppercase">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-slate-700 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-slate-700 uppercase">Check-In</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-slate-700 uppercase">Check-Out</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-slate-700 uppercase">Work Hours</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-slate-700 uppercase">Break</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-slate-700 uppercase">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {monthlyData.dailyRecords
                    .filter((r) => r.status !== "Before Joining")
                    .map((record, idx) => {
                    const workHours = Math.floor(record.workSeconds / 3600);
                    const workMinutes = Math.floor((record.workSeconds % 3600) / 60);
                    const breakHours = Math.floor(record.breakSeconds / 3600);
                    const breakMinutes = Math.floor((record.breakSeconds % 3600) / 60);

                    const statusColors = {
                      Present: "bg-emerald-50 text-emerald-700 border-emerald-200",
                      Active: "bg-blue-50 text-blue-700 border-blue-200",
                      "Checked Out": "bg-cyan-50 text-cyan-700 border-cyan-200",
                      Absent: "bg-rose-50 text-rose-700 border-rose-200",
                      "On Leave": "bg-amber-50 text-amber-700 border-amber-200",
                      "On Break": "bg-purple-50 text-purple-700 border-purple-200",
                      Weekend: "bg-slate-100 text-slate-500 border-slate-200",
                      "Weekly Off": "bg-slate-100 text-slate-500 border-slate-200",
                      Holiday: "bg-green-50 text-green-700 border-green-200",
                      Upcoming: "bg-sky-50 text-sky-600 border-sky-200",
                    };

                    return (
                      <tr
                        key={idx}
                        className="border-b border-slate-200 hover:bg-slate-50 transition-colors"
                      >
                        <td className="px-6 py-4 font-bold text-slate-900">{record.date}</td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-lg text-xs font-bold border ${statusColors[record.status] || "bg-slate-50 text-slate-700 border-slate-200"}`}>
                            {record.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-700">{formatTime(record.checkInTime)}</td>
                        <td className="px-6 py-4 text-slate-700">{formatTime(record.checkOutTime)}</td>
                        <td className="px-6 py-4 font-bold text-slate-900">
                          {String(workHours).padStart(2, "0")}:{String(workMinutes).padStart(2, "0")}
                        </td>
                        <td className="px-6 py-4 text-slate-700">
                          {String(breakHours).padStart(2, "0")}:{String(breakMinutes).padStart(2, "0")}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600 max-w-xs truncate">
                          {record.checkOutNote || "-"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Leaves Table */}
          {monthlyData.leaves.length > 0 && (
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-rose-600 to-rose-700 px-6 py-4">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Coffee className="w-5 h-5" />
                  Leaves in This Month
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="px-6 py-3 text-left text-xs font-bold text-slate-700 uppercase">Leave Type</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-slate-700 uppercase">Start Date</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-slate-700 uppercase">End Date</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-slate-700 uppercase">Days</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-slate-700 uppercase">Reason</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-slate-700 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {monthlyData.leaves.map((leave, idx) => (
                      <tr key={idx} className="border-b border-slate-200 hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 font-bold text-slate-900">{leave.leaveType}</td>
                        <td className="px-6 py-4 text-slate-700">{formatDate(leave.startDate)}</td>
                        <td className="px-6 py-4 text-slate-700">{formatDate(leave.endDate)}</td>
                        <td className="px-6 py-4 font-bold text-slate-900">{leave.totalDays}</td>
                        <td className="px-6 py-4 text-slate-700 max-w-xs truncate">{leave.reason}</td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-3 py-1 rounded-lg text-xs font-bold border ${
                              leave.status === "Approved"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : leave.status === "Pending"
                                ? "bg-amber-50 text-amber-700 border-amber-200"
                                : "bg-rose-50 text-rose-700 border-rose-200"
                            }`}
                          >
                            {leave.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default EmployeeMonthlyReport;
