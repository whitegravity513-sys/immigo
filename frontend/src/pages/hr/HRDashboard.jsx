import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  UserPlus,
  Clock,
  FileText,
  FileCheck,
  Building,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Calendar,
  ArrowRight,
  Search,
  Filter,
  Eye,
  Check,
  X,
  Edit2,
  Trash2,
} from "lucide-react";
import HrLayout from "../../components/hr/layout/HrLayout.jsx";
import employeeService from "../../services/employeeService.js";
import apiClient from "../../services/apiClient.js";
import EditEmployeeModal from "../../components/hr/modals/EditEmployeeModal.jsx";
import DeleteConfirmModal from "../../components/common/DeleteConfirmModal.jsx";

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
      name: "Mohammed Tariq",
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
      employee: "Mohammed Tariq (WG-EMP-1049)",
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
      employee: "Faizan Sheikh (WG-EMP-1045)",
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
      employee: "Bilal Hussain (WG-EMP-1028)",
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

  const [recentHrActivity, setRecentHrActivity] = useState([
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

  const handleLeaveAction = (id, action) => {
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
    { title: "Total Employees", value: hrStats.totalEmployees, sub: "Registered Staff", color: "blue", to: "/admin/dashboard/employees" },
    { title: "New This Month", value: `+${hrStats.newThisMonth}`, sub: "Onboarded", color: "emerald", to: "/admin/dashboard/workforce" },
    { title: "Pending Onboarding", value: hrStats.pendingOnboarding, sub: "In-progress docs", color: "amber", to: "/admin/dashboard/workforce" },
    { title: "Pending Documents", value: hrStats.pendingDocuments, sub: "Awaiting HR review", color: "rose", to: "/admin/dashboard/workforce" },
    { title: "Present Today", value: hrStats.presentToday, sub: `${Math.round((hrStats.presentToday / hrStats.totalEmployees) * 100)}% Turnout`, color: "emerald", to: "/admin/dashboard/attendance-all" },
    { title: "On Leave Today", value: hrStats.onLeaveToday, sub: "Approved Absences", color: "purple", to: "/admin/dashboard/leaves" },
    { title: "Leave Requests", value: hrStats.leaveRequests, sub: "Pending Action", color: "amber", to: "/admin/dashboard/leaves" },
    { title: "Departments", value: hrStats.departments, sub: "Active Divisions", color: "indigo", to: "/admin/dashboard/workforce" },
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
        {/* Top HR KPI Cards (8 Cards) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
          {hrCards.map((card) => (
            <Link
              key={card.title}
              to={card.to}
              className="p-3 bg-white rounded-xl border border-gray-200/90 shadow-2xs hover:border-blue-300 hover:shadow-xs transition-all duration-150 block text-left group"
            >
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 truncate">
                {card.title}
              </p>
              <p className="text-lg font-black text-gray-900 tracking-tight mt-1 leading-none group-hover:text-blue-600 transition-colors">
                {card.value}
              </p>
              <p className="text-[10px] text-gray-500 mt-1 truncate">
                {card.sub}
              </p>
            </Link>
          ))}
        </div>

        {/* Section 1: Recent Employees Table */}
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
                  <th className="py-2.5 px-4">Employee Name</th>
                  <th className="py-2.5 px-3">Employee ID</th>
                  <th className="py-2.5 px-3">Department</th>
                  <th className="py-2.5 px-3">Designation</th>
                  <th className="py-2.5 px-3">Joining Date</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentEmployees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-blue-50/30 transition-colors">
                    <td className="py-2.5 px-4 font-bold text-gray-900">
                      {emp.name}
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-blue-600">
                      {emp.employeeId}
                    </td>
                    <td className="py-2.5 px-3 text-gray-600">
                      {emp.department}
                    </td>
                    <td className="py-2.5 px-3 text-gray-600">
                      {emp.designation}
                    </td>
                    <td className="py-2.5 px-3 text-gray-500">
                      {emp.joiningDate}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {emp.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setEditingEmployee(emp)}
                          className="px-2.5 py-1 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md font-bold text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
                          title="Edit Employee Profile"
                        >
                          <Edit2 size={11} />
                          <span>Edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTargetEmployee(emp)}
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

        {/* Section 2: Two-column Split (Pending Documents & Leave Requests) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Pending Documents */}
          <div className="bg-white rounded-xl border border-gray-200/90 shadow-2xs overflow-hidden flex flex-col justify-between">
            <div>
              <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileCheck size={16} className="text-amber-600" />
                  <h2 className="text-xs sm:text-sm font-bold text-gray-900">Pending Documents</h2>
                </div>
                <span className="text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-full">
                  {pendingDocs.length} Pending
                </span>
              </div>

              <div className="p-3 divide-y divide-gray-100">
                {pendingDocs.map((doc) => (
                  <div key={doc.id} className="py-2.5 px-2 flex items-center justify-between gap-3 text-xs">
                    <div className="min-w-0">
                      <p className="font-bold text-gray-900 truncate">{doc.employee}</p>
                      <p className="text-[11px] text-gray-500 truncate mt-0.5">{doc.document}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">Submitted: {doc.submittedDate}</p>
                    </div>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 shrink-0">
                      {doc.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-3 bg-gray-50/70 border-t border-gray-100">
              <Link
                to="/admin/dashboard/workforce"
                className="w-full inline-flex items-center justify-center gap-1.5 py-1.5 text-xs font-bold text-blue-600 hover:text-blue-800"
              >
                <span>Open Document Verification Center</span>
                <ArrowRight size={12} />
              </Link>
            </div>
          </div>

          {/* Leave Requests */}
          <div className="bg-white rounded-xl border border-gray-200/90 shadow-2xs overflow-hidden flex flex-col justify-between">
            <div>
              <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText size={16} className="text-purple-600" />
                  <h2 className="text-xs sm:text-sm font-bold text-gray-900">Leave Requests</h2>
                </div>
                <Link
                  to="/admin/dashboard/leaves"
                  className="text-[11px] font-bold text-blue-600 hover:text-blue-800"
                >
                  Manage All
                </Link>
              </div>

              <div className="p-3 divide-y divide-gray-100">
                {leaveRequests.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-6">All leave applications reviewed.</p>
                ) : (
                  leaveRequests.map((lv) => (
                    <div key={lv.id} className="py-2.5 px-2 flex items-center justify-between gap-3 text-xs">
                      <div className="min-w-0">
                        <p className="font-bold text-gray-900 truncate">{lv.employee}</p>
                        <p className="text-[11px] text-purple-700 font-semibold truncate mt-0.5">
                          {lv.leaveType} ({lv.from} - {lv.to})
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleLeaveAction(lv.id, "Approved")}
                          className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-md cursor-pointer transition-colors"
                          title="Approve"
                        >
                          <Check size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleLeaveAction(lv.id, "Rejected")}
                          className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-md cursor-pointer transition-colors"
                          title="Reject"
                        >
                          <X size={13} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="p-3 bg-gray-50/70 border-t border-gray-100">
              <Link
                to="/admin/dashboard/leaves"
                className="w-full inline-flex items-center justify-center gap-1.5 py-1.5 text-xs font-bold text-purple-700 hover:text-purple-900"
              >
                <span>Open Leave Approvals Desk</span>
                <ArrowRight size={12} />
              </Link>
            </div>
          </div>
        </div>

        {/* Section 3: Recent HR Activity Feed */}
        <div className="bg-white rounded-xl border border-gray-200/90 shadow-2xs overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-xs sm:text-sm font-bold text-gray-900">Recent HR Activity</h2>
            <span className="text-[10px] text-gray-400">Chronological event log</span>
          </div>

          <div className="divide-y divide-gray-100">
            {recentHrActivity.map((act) => (
              <div key={act.id} className="px-4 py-3 flex items-center justify-between gap-3 text-xs hover:bg-gray-50/50 transition-colors">
                <div>
                  <p className="font-bold text-gray-900">{act.title}</p>
                  <p className="text-[11px] text-gray-500 mt-0.5">{act.desc}</p>
                </div>
                <span className="text-[10px] text-gray-400 shrink-0">{act.time}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Edit Employee Modal */}
        <EditEmployeeModal
          isOpen={Boolean(editingEmployee)}
          onClose={() => setEditingEmployee(null)}
          employee={editingEmployee}
          onSave={handleSaveEmployee}
          saving={savingEmployee}
        />

        {/* Delete Employee Confirmation Modal */}
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
