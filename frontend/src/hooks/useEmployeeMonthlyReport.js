import { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import { getEmployeeList, getEmployeeMonthlyReport } from "../services/employeeService";

export const useEmployeeMonthlyReport = (token) => {
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [employees, setEmployees] = useState([]);
  const [monthlyData, setMonthlyData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    if (errorMsg) {
      const timer = setTimeout(() => setErrorMsg(""), 6000);
      return () => clearTimeout(timer);
    }
  }, [errorMsg]);

  useEffect(() => {
    if (successMsg) {
      const timer = setTimeout(() => setSuccessMsg(""), 6000);
      return () => clearTimeout(timer);
    }
  }, [successMsg]);

  const fetchEmployees = async () => {
    try {
      const data = await getEmployeeList(token);
      setEmployees(data.filter((emp) => emp.status !== "inactive"));
    } catch (err) {
      setErrorMsg("Failed to load employees");
    }
  };

  const fetchMonthlyReport = async () => {
    if (!selectedEmployee) {
      setErrorMsg("Please select an employee");
      return;
    }

    setLoading(true);
    try {
      const month = selectedMonth.getMonth() + 1;
      const year = selectedMonth.getFullYear();

      const data = await getEmployeeMonthlyReport(selectedEmployee._id, month, year, token);
      setMonthlyData(data);
      setSuccessMsg("Report loaded successfully!");
    } catch (err) {
      setErrorMsg(err.response?.data?.message || "Failed to load monthly report");
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (date) => {
    if (!date) return "-";
    return new Date(date).toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-IN");
  };

  const downloadReport = () => {
    if (!monthlyData) return;

    // 1. Summary Sheet
    const summaryRows = [
      { Metric: "Employee ID", Value: monthlyData.employee.employeeId },
      { Metric: "Name", Value: monthlyData.employee.name },
      { Metric: "Email", Value: monthlyData.employee.email },
      { Metric: "Designation", Value: monthlyData.employee.designation },
      { Metric: "Report Month", Value: `${monthlyData.month}/${monthlyData.year}` },
      { Metric: "", Value: "" },
      { Metric: "Total Working Days", Value: monthlyData.summary?.totalWorkingDays ?? 0 },
      { Metric: "Present Days", Value: monthlyData.summary?.presentDays ?? 0 },
      { Metric: "Half Days", Value: monthlyData.summary?.halfDays ?? 0 },
      { Metric: "Absent Days", Value: monthlyData.summary?.absentDays ?? 0 },
      { Metric: "Leave Days", Value: monthlyData.summary?.totalLeaveDays ?? 0 },
      { Metric: "Total Work Hours", Value: monthlyData.summary?.totalWorkHours ?? "0h 0m" },
      { Metric: "Total Break Hours", Value: monthlyData.summary?.totalBreakHours ?? "0h 0m" },
      { Metric: "Average Work Hours / Day", Value: monthlyData.summary?.averageWorkHoursPerDay ?? "0h 0m" }
    ];

    // 2. Daily Attendance Sheet
    const dailyRows = (monthlyData.dailyRecords || []).map((record, idx) => {
      const wSec = record.workSeconds || record.totalWorkSeconds || 0;
      const bSec = record.breakSeconds || record.totalBreakSeconds || 0;
      const workHours = Math.floor(wSec / 3600) + "h " + String(Math.floor((wSec % 3600) / 60)).padStart(2, "0") + "m";
      const breakHours = Math.floor(bSec / 3600) + "h " + String(Math.floor((bSec % 3600) / 60)).padStart(2, "0") + "m";

      return {
        "S.No": idx + 1,
        Date: record.date,
        Day: record.dayOfWeek || "",
        Status: record.status || "",
        "Check-In": formatTime(record.checkInTime),
        "Check-Out": formatTime(record.checkOutTime),
        "Work Hours": workHours,
        "Break Hours": breakHours,
        Notes: record.checkOutNote || record.holidayTitle || ""
      };
    });

    // 3. Leaves Sheet
    const leaveRows = (monthlyData.leaves || []).map((leave, idx) => ({
      "S.No": idx + 1,
      "Leave Type": leave.leaveType || "",
      "Start Date": formatDate(leave.startDate),
      "End Date": formatDate(leave.endDate),
      "Total Days": leave.totalDays || 0,
      Reason: leave.reason || "",
      Status: leave.status || ""
    }));

    const workbook = XLSX.utils.book_new();

    const summarySheet = XLSX.utils.json_to_sheet(summaryRows);
    summarySheet["!cols"] = [{ wch: 26 }, { wch: 30 }];
    XLSX.utils.book_append_sheet(workbook, summarySheet, "Summary");

    const dailySheet = XLSX.utils.json_to_sheet(dailyRows);
    dailySheet["!cols"] = [
      { wch: 6 }, { wch: 14 }, { wch: 8 }, { wch: 14 },
      { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 35 }
    ];
    XLSX.utils.book_append_sheet(workbook, dailySheet, "Daily Attendance");

    if (leaveRows.length > 0) {
      const leaveSheet = XLSX.utils.json_to_sheet(leaveRows);
      leaveSheet["!cols"] = [
        { wch: 6 }, { wch: 18 }, { wch: 14 }, { wch: 14 },
        { wch: 12 }, { wch: 35 }, { wch: 14 }
      ];
      XLSX.utils.book_append_sheet(workbook, leaveSheet, "Leaves");
    }

    const filename = `Employee_Monthly_Report_${selectedEmployee.employeeId}_${selectedMonth.getFullYear()}-${String(selectedMonth.getMonth() + 1).padStart(2, "0")}.xlsx`;
    XLSX.writeFile(workbook, filename);
  };

  const filteredEmployees = employees.filter(
    (emp) =>
      emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.employeeId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return {
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
  };
};
