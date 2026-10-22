import React, { useState, useEffect } from "react";
import HrLayout from "../../components/hr/layout/HrLayout.jsx";
import employeeService from "../../services/employeeService.js";
import apiClient from "../../services/apiClient.js";
import HrEditEmployeeModal from "../../components/hr/modals/HrEditEmployeeModal.jsx";
import DeleteConfirmModal from "../../components/common/DeleteConfirmModal.jsx";
import {
  HrStatsCards,
  HrRecentEmployeesTable,
  HrPendingDocsList,
  HrLeaveRequestsList,
  HrRecentActivityList,
} from "../../components/hr/dashboard/index.js";

export function HRDashboard() {
  const [loading, setLoading] = useState(true);

  const [hrStats, setHrStats] = useState({
    totalEmployees: 248,
    newThisMonth: 18,
    pendingOnboarding: 6,
    pendingDocuments: 12,
    presentToday: 182,
    onLeaveToday: 9,
    leaveRequests: 5,
    departments: 8,
  });

  const [editingEmployee, setEditingEmployee] = useState(null);
  const [savingEmployee, setSavingEmployee] = useState(false);
  const [deleteTargetEmployee, setDeleteTargetEmployee] = useState(null);
  const [deletingEmployee, setDeletingEmployee] = useState(false);

  const [recentEmployees, setRecentEmployees] = useState([
    {
      id: "emp-1",
      name: "Rajesh Kumar",
      employeeId: "WG-EMP-1048",
      department: "Engineering",
      designation: "Civil Project Engineer",
      joiningDate: "15 Sep 2026",
      status: "Active",
    },
    {
      id: "emp-2",
      name: "Rahul Verma",
      employeeId: "WG-EMP-1049",
      department: "Operations",
      designation: "Site Supervisor",
      joiningDate: "18 Sep 2026",
      status: "Active",
    },
    {
      id: "emp-3",
      name: "Suresh Pillai",
      employeeId: "WG-EMP-1050",
      department: "Safety & Quality",
      designation: "HSE Inspector",
      joiningDate: "20 Sep 2026",
      status: "Active",
    },
    {
      id: "emp-4",
      name: "Amit Sharma",
      employeeId: "WG-EMP-1051",
      department: "Human Resources",
      designation: "Recruitment Specialist",
      joiningDate: "22 Sep 2026",
      status: "Probation",
    },
    {
      id: "emp-5",
      name: "Vikram Chauhan",
      employeeId: "WG-EMP-1052",
      department: "Logistics",
      designation: "Fleet Coordinator",
      joiningDate: "25 Sep 2026",
      status: "Active",
    },
  ]);

  const [pendingDocs, setPendingDocs] = useState([
    {
      id: "doc-1",
      employee: "Rahul Verma (WG-EMP-1049)",
      document: "Passport Copy & UAE Visa Stamp",
      status: "Pending Verification",
      submittedDate: "26 Sep 2026",
    },
    {
      id: "doc-2",
      employee: "Suresh Pillai (WG-EMP-1050)",
      document: "OSHA / NEBOSH Certification",
      status: "Pending HR Review",
      submittedDate: "25 Sep 2026",
    },
    {
      id: "doc-3",
      employee: "Amit Sharma (WG-EMP-1051)",
      document: "Degree Attestation & Police Clearance",
      status: "Pending Verification",
      submittedDate: "24 Sep 2026",
    },
    {
      id: "doc-4",
      employee: "Amit Kumar (WG-EMP-1045)",
      document: "Medical Fitness Certificate",
      status: "Pending Approval",
      submittedDate: "23 Sep 2026",
    },
  ]);

  const [leaveRequests, setLeaveRequests] = useState([
    {
      id: "lv-1",
      employee: "Deepak Patel (WG-EMP-1032)",
      leaveType: "Annual Leave",
      from: "05 Oct 2026",
      to: "20 Oct 2026",
      status: "Pending",
    },
    {
      id: "lv-2",
      employee: "Vikas Sharma (WG-EMP-1028)",
      leaveType: "Sick Leave",
      from: "28 Sep 2026",
      to: "30 Sep 2026",
      status: "Pending",
    },
    {
      id: "lv-3",
      employee: "Karan Verma (WG-EMP-1041)",
      leaveType: "Emergency Leave",
      from: "01 Oct 2026",
      to: "04 Oct 2026",
      status: "Pending",
    },
    {
      id: "lv-4",
      employee: "Aarti Sharma (WG-EMP-1049)",
      leaveType: "Work From Home (WFH)",
      from: "15 Oct 2026",
      to: "17 Oct 2026",
      status: "Pending",
    },
  ]);

  const [recentHrActivity] = useState([
    {
      id: "hact-1",
      title: "New Employee Onboarded",
      desc: "Vikram Chauhan added to Logistics team with ID WG-EMP-1052",
      time: "2 hours ago",
    },
    {
      id: "hact-2",
      title: "Leave Approved",
      desc: "Manoj Singh approved for 4 days Casual Leave",
      time: "4 hours ago",
    },
    {
      id: "hact-3",
      title: "Biometric Punch Exception Resolved",
      desc: "Morning attendance shift adjusted for Engineering Dept (8 staff)",
      time: "6 hours ago",
    },
    {
      id: "hact-4",
      title: "Document Verified",
      desc: "Passport copy approved for Rajesh Kumar (WG-EMP-1048)",
      time: "Yesterday",
    },
  ]);

  useEffect(() => {
    loadLiveHrData();
  }, []);

  const loadLiveHrData = async () => {
    try {
      const [empRes, attRes, leavesRes] = await Promise.allSettled([
        employeeService.getEmployees(),
        apiClient.get("/admin/attendance"),
        apiClient.get("/admin/leaves"),
      ]);

      if (empRes.status === "fulfilled") {
        const empList = empRes.value?.employees || (Array.isArray(empRes.value) ? empRes.value : []);
        if (empList.length > 0) {
          setHrStats((prev) => ({
            ...prev,
            totalEmployees: empList.length,
          }));

          const mapped = empList.slice(0, 5).map((e) => ({
            id: e._id || e.id,
            name: e.name || "Employee",
            employeeId: e.employeeId || "WG-EMP",
            department: e.department || "Operations",
            designation: e.designation || "Staff",
            joiningDate: e.joiningDate
              ? new Date(e.joiningDate).toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })
              : "Recent",
            status: e.status || "Active",
          }));
          if (mapped.length > 0) {
            setRecentEmployees(mapped);
          }
        }
      }

      if (attRes.status === "fulfilled" && Array.isArray(attRes.value?.data)) {
        const att = attRes.value.data;
        const present = att.filter((r) => r.status === "Active" || r.status === "Present" || r.status === "Checked Out").length;
        const onLeave = att.filter((r) => r.status === "Leave" || r.status === "On Leave").length;
        if (present > 0 || onLeave > 0) {
          setHrStats((prev) => ({
            ...prev,
            presentToday: present || prev.presentToday,
            onLeaveToday: onLeave || prev.onLeaveToday,
          }));
        }
      }

      if (leavesRes.status === "fulfilled") {
        const leaves = Array.isArray(leavesRes.value?.data?.leaves)
          ? leavesRes.value.data.leaves
          : Array.isArray(leavesRes.value?.data)
          ? leavesRes.value.data
          : [];
        const pending = leaves.filter((l) => l.status === "Pending");
        if (pending.length > 0) {
          setHrStats((prev) => ({ ...prev, leaveRequests: pending.length }));
          setLeaveRequests(
            pending.slice(0, 4).map((l) => ({
              id: l._id || l.id,
              employee: l.employeeName || l.employee?.name || "Staff Member",
              leaveType: l.leaveType || "Leave",
              from: l.startDate ? new Date(l.startDate).toLocaleDateString("en-GB") : "Upcoming",
              to: l.endDate ? new Date(l.endDate).toLocaleDateString("en-GB") : "Upcoming",
              status: "Pending",
            }))
          );
        }
      }
    } catch (err) {
      console.error("Live HR data error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveAction = (id) => {
    setLeaveRequests((prev) => prev.filter((item) => item.id !== id));
    setHrStats((prev) => ({ ...prev, leaveRequests: Math.max(0, prev.leaveRequests - 1) }));
  };

  const handleSaveEmployee = async (formData) => {
    setSavingEmployee(true);
    try {
      const empId = formData.id || formData._id;
      await employeeService.updateEmployee(empId, formData);
      setRecentEmployees((prev) =>
        prev.map((e) =>
          e.id === empId
            ? {
                ...e,
                name: formData.name,
                department: formData.department,
                designation: formData.designation,
                status: formData.status,
              }
            : e
        )
      );
      setEditingEmployee(null);
      alert("Employee details updated successfully!");
    } catch (err) {
      alert(err.response?.data?.message || err.message || "Failed to update employee.");
    } finally {
      setSavingEmployee(false);
    }
  };

  const handleDeleteEmployee = async () => {
    if (!deleteTargetEmployee) return;
    setDeletingEmployee(true);
    try {
      const empId = deleteTargetEmployee.id || deleteTargetEmployee._id;
      await employeeService.deleteEmployee(empId);
      setRecentEmployees((prev) => prev.filter((e) => e.id !== empId));
      setHrStats((prev) => ({
        ...prev,
        totalEmployees: Math.max(0, prev.totalEmployees - 1),
      }));
      setDeleteTargetEmployee(null);
      alert("Employee record deleted successfully.");
    } catch (err) {
      alert(err.response?.data?.message || err.message || "Failed to delete employee.");
    } finally {
      setDeletingEmployee(false);
    }
  };

  const hrCards = [
    { title: "Total Employees", value: hrStats.totalEmployees, sub: "Registered Staff", to: "/admin/dashboard/employees" },
    { title: "New This Month", value: `+${hrStats.newThisMonth}`, sub: "Onboarded", to: "/admin/dashboard/workforce" },
    { title: "Pending Onboarding", value: hrStats.pendingOnboarding, sub: "In-progress docs", to: "/admin/dashboard/workforce" },
    { title: "Pending Documents", value: hrStats.pendingDocuments, sub: "Awaiting HR review", to: "/admin/dashboard/workforce" },
    { title: "Present Today", value: hrStats.presentToday, sub: `${Math.round((hrStats.presentToday / (hrStats.totalEmployees || 1)) * 100)}% Turnout`, to: "/admin/dashboard/attendance-all" },
    { title: "On Leave Today", value: hrStats.onLeaveToday, sub: "Approved Absences", to: "/admin/dashboard/leaves" },
    { title: "Leave Requests", value: hrStats.leaveRequests, sub: "Pending Action", to: "/admin/dashboard/leaves" },
    { title: "Departments", value: hrStats.departments, sub: "Active Divisions", to: "/admin/dashboard/workforce" },
  ];

  return (
    <HrLayout
      title="HR Dashboard"
      subtitle="Workforce directory, attendance monitoring, and leave administration."
      breadcrumbs={[
        { label: "Admin", path: "/admin/dashboard" },
        { label: "HR", path: "/hr/dashboard" },
        { label: "Dashboard" },
      ]}
    >
      <div className="space-y-6">
        <HrStatsCards hrCards={hrCards} />

        <HrRecentEmployeesTable
          recentEmployees={recentEmployees}
          onEditEmployee={(emp) => setEditingEmployee(emp)}
          onDeleteEmployee={(emp) => setDeleteTargetEmployee(emp)}
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <HrPendingDocsList pendingDocs={pendingDocs} />
          <HrLeaveRequestsList
            leaveRequests={leaveRequests}
            onLeaveAction={handleLeaveAction}
          />
        </div>

        <HrRecentActivityList recentHrActivity={recentHrActivity} />

        <HrEditEmployeeModal
          isOpen={Boolean(editingEmployee)}
          onClose={() => setEditingEmployee(null)}
          employee={editingEmployee}
          onSave={handleSaveEmployee}
          saving={savingEmployee}
        />

        <DeleteConfirmModal
          isOpen={Boolean(deleteTargetEmployee)}
          onClose={() => setDeleteTargetEmployee(null)}
          onConfirm={handleDeleteEmployee}
          title="Delete Employee Record"
          message="Are you sure you want to permanently delete this employee? All payroll, attendance logs, and profile records associated with this employee will be deleted."
          itemName={deleteTargetEmployee ? `${deleteTargetEmployee.name} (${deleteTargetEmployee.employeeId || deleteTargetEmployee.id})` : ""}
          loading={deletingEmployee}
          confirmText="Delete Employee"
        />
      </div>
    </HrLayout>
  );
}

export default HRDashboard;
