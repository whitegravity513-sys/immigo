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
    customStartDate,
    setCustomStartDate,
    customEndDate,
    setCustomEndDate,
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

  const [useDateRange, setUseDateRange] = React.useState(false);

  const handleSetJoiningToToday = () => {
    if (!selectedEmployee?.joiningDate) return;
    const jDate = new Date(selectedEmployee.joiningDate);
    setUseDateRange(true);
    setCustomStartDate(jDate);
    setCustomEndDate(new Date());
  };

  const handleResetToMonth = () => {
    setUseDateRange(false);
    setCustomStartDate(null);
    setCustomEndDate(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      {}
      <div className="flex items-center gap-3 mb-8">
        <button
          onClick={onGoBack}
          className="p-2 hover:bg-white rounded-lg transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-6 h-6 text-slate-600" />
        </button>
        <h1 className="text-3xl font-bold text-slate-900">Employee Monthly & Salary Report</h1>
      </div>

      {}
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

      {}
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">1. Select Employee</label>
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
                        if (emp.joiningDate) {
                          setCustomStartDate(new Date(emp.joiningDate));
                          setCustomEndDate(new Date());
                        }
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
                  <div className="text-xs text-green-700 mt-1 font-semibold flex items-center justify-between">
                    <span>📅 Joined: {new Date(selectedEmployee.joiningDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    <button
                      type="button"
                      onClick={handleSetJoiningToToday}
                      className="ml-2 text-[11px] bg-green-700 text-white px-2 py-0.5 rounded hover:bg-green-800 cursor-pointer"
                    >
                      Use Joining Date
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-bold text-slate-700">2. Salary Calculation Period</label>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setUseDateRange(false)}
                  className={`text-[11px] px-2 py-0.5 rounded font-bold transition cursor-pointer ${!useDateRange ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
                >
                  By Month
                </button>
                <button
                  type="button"
                  onClick={() => setUseDateRange(true)}
                  className={`text-[11px] px-2 py-0.5 rounded font-bold transition cursor-pointer ${useDateRange ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
                >
                  Custom Dates
                </button>
              </div>
            </div>

            {!useDateRange ? (
              <div>
                <DatePicker
                  selected={selectedMonth}
                  onChange={(date) => {
                    setSelectedMonth(date);
                    setCustomStartDate(null);
                    setCustomEndDate(null);
                  }}
                  dateFormat="MMMM yyyy"
                  showMonthYearPicker
                  minDate={selectedEmployee?.joiningDate ? new Date(selectedEmployee.joiningDate) : undefined}
                  maxDate={new Date()}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg bg-white text-black focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <div className="flex items-center justify-between mt-1 text-xs text-slate-500">
                  <span>Calculates from 1st of month to today</span>
                  {selectedEmployee?.joiningDate && (
                    <button
                      type="button"
                      onClick={handleSetJoiningToToday}
                      className="text-blue-600 hover:underline font-bold cursor-pointer"
                    >
                      Calculate from Joining
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">From Date</label>
                  <DatePicker
                    selected={customStartDate}
                    onChange={(date) => setCustomStartDate(date)}
                    dateFormat="dd MMM yyyy"
                    placeholderText="Start Date"
                    maxDate={customEndDate || new Date()}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg bg-white text-black text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">To Date</label>
                  <DatePicker
                    selected={customEndDate}
                    onChange={(date) => setCustomEndDate(date)}
                    dateFormat="dd MMM yyyy"
                    placeholderText="End Date"
                    minDate={customStartDate || undefined}
                    maxDate={new Date()}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg bg-white text-black text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            )}
          </div>

          {}
          <div className="flex flex-col justify-end gap-2">
            <button
              onClick={() => fetchMonthlyReport()}
              disabled={!selectedEmployee || loading}
              className="w-full px-4 py-2.5 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm"
            >
              <TrendingUp className="w-4 h-4" />
              {loading ? "Calculating..." : "Generate Salary & Report"}
            </button>
            {monthlyData && (
              <button
                onClick={downloadReport}
                className="w-full px-4 py-2 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm text-xs"
              >
                <Download className="w-4 h-4" />
                Download Excel (.xlsx)
              </button>
            )}
          </div>
        </div>
      </div>

      {}
      {monthlyData && (
        <div className="space-y-6">
          {}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl shadow p-4 border-l-4 border-blue-500">
              <div className="text-sm text-slate-600 font-bold">Working Days</div>
              <div className="text-2xl font-bold text-slate-900 mt-0.5">{monthlyData.summary?.totalWorkingDays ?? 0} Days</div>
              <div className="text-[11px] text-slate-400 font-medium mt-1">
                Excludes weekends & declared holidays
              </div>
            </div>
            <div className="bg-white rounded-xl shadow p-4 border-l-4 border-emerald-500">
              <div className="text-sm text-slate-600 font-bold">Present Days</div>
              <div className="text-2xl font-bold text-emerald-600">{monthlyData.summary?.presentDays ?? 0}</div>
            </div>
            <div className="bg-white rounded-xl shadow p-4 border-l-4 border-amber-500">
              <div className="text-sm text-slate-600 font-bold">Absent Days</div>
              <div className="text-2xl font-bold text-amber-600">{monthlyData.summary?.absentDays ?? 0}</div>
            </div>
          </div>

          {}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          </div>

          {/* Salary Calculation Section */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Coffee className="w-5 h-5" />
                Salary Calculation
              </h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div>
                  <div className="text-sm text-slate-500 font-bold mb-1">Monthly Base Salary</div>
                  <div className="text-2xl font-black text-slate-800">
                    ₹{monthlyData.summary?.monthlySalary?.toLocaleString() ?? 0}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-slate-500 font-bold mb-1">Per Day Salary</div>
                  <div className="text-2xl font-black text-slate-800">
                    ₹{Math.round(monthlyData.summary?.perDaySalary ?? 0).toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-slate-500 font-bold mb-1">Total Paid Days</div>
                  <div className="text-2xl font-black text-blue-600">
                    {monthlyData.summary?.paidDays ?? 0}
                  </div>
                  <div className="text-[10px] text-slate-400 font-bold mt-1">
                    Present + Leaves + Holidays + Weekends in Period
                  </div>
                </div>
                <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-100">
                  <div className="text-sm text-emerald-600 font-bold mb-1">Final Payable Salary</div>
                  <div className="text-3xl font-black text-emerald-700">
                    ₹{monthlyData.summary?.earnedSalary?.toLocaleString() ?? 0}
                  </div>
                </div>
              </div>
              {monthlyData.calcStartDate && (
                <div className="mt-4 px-4 py-2.5 bg-blue-50/90 rounded-xl border border-blue-200 text-xs text-blue-900 flex items-center justify-between">
                  <span>📅 Calculation Window: <strong className="font-bold">{monthlyData.calcStartDate}</strong> to <strong className="font-bold">{monthlyData.calcEndDate}</strong></span>
                  <span>Evaluated Working Days: <strong className="font-bold">{monthlyData.summary?.totalWorkingDays ?? 0} Days</strong></span>
                </div>
              )}
            </div>
          </div>

          {/* Daily Attendance Details */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-green-600 to-emerald-700 px-6 py-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Daily Attendance Details (Past to Today)
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
                    <th className="px-5 py-3 text-left text-xs font-bold text-slate-700 uppercase">Date & Day</th>
                    <th className="px-5 py-3 text-left text-xs font-bold text-slate-700 uppercase">Status</th>
                    <th className="px-5 py-3 text-left text-xs font-bold text-slate-700 uppercase">Check-In</th>
                    <th className="px-5 py-3 text-left text-xs font-bold text-slate-700 uppercase">Check-Out</th>
                    <th className="px-5 py-3 text-left text-xs font-bold text-slate-700 uppercase">Work Hours</th>
                    <th className="px-5 py-3 text-left text-xs font-bold text-slate-700 uppercase">Break</th>
                    <th className="px-5 py-3 text-left text-xs font-bold text-slate-700 uppercase">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {monthlyData.dailyRecords
                    .filter((r) => r.status !== "Before Joining" && r.status !== "Upcoming")
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
                        <td className="px-5 py-3.5 font-bold text-slate-900 whitespace-nowrap">
                          {record.date} <span className="text-xs text-slate-400 font-semibold">({record.dayOfWeek})</span>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={`px-2.5 py-0.5 rounded-lg text-xs font-bold border ${statusColors[record.status] || "bg-slate-50 text-slate-700 border-slate-200"}`}>
                            {record.status}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-slate-700 text-xs font-semibold whitespace-nowrap">{formatTime(record.checkInTime)}</td>
                        <td className="px-5 py-3.5 text-slate-700 text-xs font-semibold whitespace-nowrap">{formatTime(record.checkOutTime)}</td>
                        <td className="px-5 py-3.5 font-bold text-slate-900 text-xs">
                          {String(workHours).padStart(2, "0")}:{String(workMinutes).padStart(2, "0")}
                        </td>
                        <td className="px-5 py-3.5 text-slate-600 text-xs">
                          {String(breakHours).padStart(2, "0")}:{String(breakMinutes).padStart(2, "0")}
                        </td>
                        <td className="px-5 py-3.5 text-xs text-slate-600 max-w-xs truncate">
                          {record.checkOutNote || "-"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {}
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
