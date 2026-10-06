import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Building2,
  FolderKanban,
  UserCheck,
  CheckCircle2,
  ArrowRight,
  MapPin,
  Users,
  Clock,
  Calendar,
  AlertCircle,
  Briefcase,
  Contact,
  FileText,
  Sparkles,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  IndianRupee,
  BarChart3,
} from "lucide-react";
import StatCard from "../../components/crm/ui/StatCard.jsx";
import StatusBadge from "../../components/crm/ui/StatusBadge.jsx";
import LoadingSkeleton from "../../components/crm/ui/LoadingSkeleton.jsx";
import crmClientService from "../../services/crmClientService.js";
import employeeService from "../../services/employeeService.js";
import apiClient from "../../services/apiClient.js";

export function Dashboard() {
  const [crmStats, setCrmStats] = useState(null);
  const [hrStats, setHrStats] = useState({
    totalEmployees: 0,
    presentCount: 0,
    activeCount: 0,
    onLeaveCount: 0,
    absentCount: 0,
    pendingLeavesCount: 0,
    todayAttendance: [],
    pendingLeavesList: [],
  });
  const [loading, setLoading] = useState(true);
  const [projectTab, setProjectTab] = useState("All"); // "All" or "Active"

  useEffect(() => {
    loadAllDashboardData();
  }, []);

  const loadAllDashboardData = async () => {
    setLoading(true);
    try {
      const [crmRes, empRes, attRes, leavesRes] = await Promise.allSettled([
        crmClientService.getDashboardStats(),
        employeeService.getEmployees(),
        apiClient.get("/admin/attendance"),
        apiClient.get("/admin/leaves"),
      ]);

      if (crmRes.status === "fulfilled") {
        setCrmStats(crmRes.value);
      }

      const employees =
        empRes.status === "fulfilled"
          ? empRes.value?.employees || (Array.isArray(empRes.value) ? empRes.value : [])
          : [];
      const attendanceList =
        attRes.status === "fulfilled"
          ? Array.isArray(attRes.value?.data)
            ? attRes.value.data
            : []
          : [];
      const leavesList =
        leavesRes.status === "fulfilled"
          ? Array.isArray(leavesRes.value?.data?.leaves)
            ? leavesRes.value.data.leaves
            : Array.isArray(leavesRes.value?.data)
            ? leavesRes.value.data
            : []
          : [];

      let presentCount = 0;
      let activeCount = 0;
      let onLeaveCount = 0;

      attendanceList.forEach((r) => {
        const isAct = r.status === "Active" || (r.checkInTime && !r.checkOutTime);
        const isPresent =
          isAct ||
          r.status === "Present" ||
          r.status === "On Break" ||
          r.status === "Checked Out" ||
          r.status === "Half Day";
        const isLeave = r.status === "Leave" || r.status === "On Leave";

        if (isAct) activeCount++;
        if (isPresent) presentCount++;
        if (isLeave) onLeaveCount++;
      });

      const totalEmployees = employees.length || attendanceList.length || 0;
      const absentCount = Math.max(0, totalEmployees - presentCount - onLeaveCount);
      const pendingLeaves = leavesList.filter((l) => l.status === "Pending");

      setHrStats({
        totalEmployees,
        presentCount,
        activeCount,
        onLeaveCount,
        absentCount,
        pendingLeavesCount: pendingLeaves.length,
        todayAttendance: attendanceList.slice(0, 4),
        pendingLeavesList: pendingLeaves.slice(0, 2),
      });
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (isoString) => {
    if (!isoString) return "";
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true });
    } catch {
      return "";
    }
  };

  const rawProjects = crmStats?.recentProjects || [];
  const filteredProjects =
    projectTab === "Active"
      ? rawProjects.filter((p) => (p.status || "Active").toLowerCase() === "active")
      : rawProjects;
  const displayedProjects = filteredProjects.slice(0, 4);
  const displayedClients = (crmStats?.recentClients || []).slice(0, 4);

  const attendancePercent = hrStats.totalEmployees
    ? Math.round((hrStats.presentCount / hrStats.totalEmployees) * 100)
    : 0;

  return (
    <div className="space-y-3.5 max-w-full">
      {/* Top Slim Header Bar: Executive Admin View */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-white px-4 py-3 rounded-xl border border-gray-200/90 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base sm:text-lg font-black text-gray-900 tracking-tight leading-tight">
              Admin Master Dashboard
            </h1>
            <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200/60">
              <ShieldCheck size={11} className="text-blue-600" />
              Executive Overview
            </span>
          </div>
          <p className="text-[11px] sm:text-xs text-gray-500 mt-0.5">
            Centralized operations hub: Foreign Client Deployments & Internal HR Workforce.
          </p>
        </div>

        {/* Quick Launch Buttons to Dedicated Sub-Portals (HR first, then Client) */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
          <Link
            to="/admin/dashboard/workforce"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors cursor-pointer"
            title="Open Dedicated HR Workforce Portal"
          >
            <Users size={13} className="text-blue-600" />
            <span>HR Portal</span>
          </Link>

          <Link
            to="/clients"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors cursor-pointer"
            title="Open Client Management CRM"
          >
            <Building2 size={13} className="text-blue-600" />
            <span>Client CRM</span>
          </Link>
        </div>
      </div>

      {/* 4 Pillars Switchboard Hub: HR first, then Client */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        {/* Pillar 1: HR & Workforce Portal */}
        <Link
          to="/admin/dashboard/workforce"
          className="group p-3 bg-white hover:bg-emerald-50/40 rounded-xl border border-gray-200/90 hover:border-emerald-300 shadow-2xs transition-all duration-150 block"
        >
          <div className="flex items-center justify-between gap-1 mb-1.5">
            <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100">
              <Users size={14} />
            </span>
            <span className="text-[10px] font-bold text-emerald-600 group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
              <span>Open HR</span>
              <ArrowRight size={10} />
            </span>
          </div>
          <h3 className="text-xs font-bold text-gray-900 leading-tight">
            HR & Workforce Portal
          </h3>
          <p className="text-[11px] font-semibold text-emerald-700 mt-1">
            {hrStats.totalEmployees} Staff • {hrStats.presentCount} Present Today
          </p>
          <p className="text-[10px] text-gray-400 mt-0.5 truncate">
            Biometric attendance, leaves & staff records
          </p>
        </Link>

        {/* Pillar 2: Client Management CRM */}
        <Link
          to="/clients"
          className="group p-3 bg-white hover:bg-blue-50/40 rounded-xl border border-gray-200/90 hover:border-blue-300 shadow-2xs transition-all duration-150 block"
        >
          <div className="flex items-center justify-between gap-1 mb-1.5">
            <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-blue-50 text-blue-600 border border-blue-100">
              <Building2 size={14} />
            </span>
            <span className="text-[10px] font-bold text-blue-600 group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
              <span>Open CRM</span>
              <ArrowRight size={10} />
            </span>
          </div>
          <h3 className="text-xs font-bold text-gray-900 leading-tight">
            Client Management CRM
          </h3>
          <p className="text-[11px] font-semibold text-blue-700 mt-1">
            {crmStats?.totalClients || 0} Clients • {crmStats?.activeProjects || 0} Active Sites
          </p>
          <p className="text-[10px] text-gray-400 mt-0.5 truncate">
            Foreign client contracts & project requirements
          </p>
        </Link>

        {/* Pillar 3: Vendor Network (Phase 2 Preview) */}
        <div className="p-3 bg-gray-50/70 rounded-xl border border-dashed border-gray-200 shadow-2xs block select-none">
          <div className="flex items-center justify-between gap-1 mb-1.5">
            <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-amber-50 text-amber-600 border border-amber-100">
              <Briefcase size={14} />
            </span>
            <span className="text-[9px] font-extrabold uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-100/80 text-amber-800">
              Phase 2
            </span>
          </div>
          <h3 className="text-xs font-bold text-gray-700 leading-tight">
            Vendor Management
          </h3>
          <p className="text-[11px] font-medium text-amber-700 mt-1">
            Coming Soon
          </p>
          <p className="text-[10px] text-gray-400 mt-0.5 truncate">
            Sub-contractors & sourcing partners
          </p>
        </div>

        {/* Pillar 4: Candidate Pipeline (Phase 2 Preview) */}
        <div className="p-3 bg-gray-50/70 rounded-xl border border-dashed border-gray-200 shadow-2xs block select-none">
          <div className="flex items-center justify-between gap-1 mb-1.5">
            <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100">
              <Contact size={14} />
            </span>
            <span className="text-[9px] font-extrabold uppercase tracking-wider px-1.5 py-0.5 rounded bg-indigo-100/80 text-indigo-800">
              Phase 2
            </span>
          </div>
          <h3 className="text-xs font-bold text-gray-700 leading-tight">
            Candidate Pipeline
          </h3>
          <p className="text-[11px] font-medium text-indigo-700 mt-1">
            Coming Soon
          </p>
          <p className="text-[10px] text-gray-400 mt-0.5 truncate">
            Passports, trade tests & visa clearance
          </p>
        </div>
      </div>

      {/* 5 Sleek Mixed KPI StatCards: HR first, then CRM */}
      {loading ? (
        <LoadingSkeleton type="stats" />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-3">
          <StatCard
            title="Total Staff"
            value={hrStats.totalEmployees}
            subtitle="Internal workforce"
            icon={Users}
            color="indigo"
            to="/admin/dashboard/employees"
            trend={{ value: "HR", label: "Directory" }}
          />

          <StatCard
            title="Present Today"
            value={hrStats.presentCount}
            subtitle={`${attendancePercent}% turnout today`}
            icon={UserCheck}
            color="emerald"
            to="/admin/dashboard/attendance-all"
            trend={{ value: `${hrStats.absentCount} absent`, label: "Today" }}
          />

          <StatCard
            title="Pending Leaves"
            value={hrStats.pendingLeavesCount}
            subtitle="Awaiting admin action"
            icon={FileText}
            color={hrStats.pendingLeavesCount > 0 ? "amber" : "blue"}
            to="/admin/dashboard/leaves"
            trend={{
              value: hrStats.pendingLeavesCount > 0 ? "Action Req" : "Clear",
              label: "Approvals",
            }}
          />

          <StatCard
            title="Total Clients"
            value={crmStats?.totalClients || 0}
            subtitle="Registered foreign firms"
            icon={Building2}
            color="blue"
            to="/clients"
            trend={{ value: "CRM", label: "Corporate" }}
          />

          <StatCard
            title="Active Projects"
            value={crmStats?.activeProjects || 0}
            subtitle="Open overseas sites"
            icon={CheckCircle2}
            color="emerald"
            to="/projects?status=Active"
            trend={{ value: `${crmStats?.totalProjects || 0} total`, label: "Deployment" }}
          />
        </div>
      )}

      {/* Side-by-Side Main Sections: Equal Space (50% HR / 50% CRM) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5 items-start">
        {/* ================= LEFT 50%: HR & Workforce Operations (HR) ================= */}
        <div className="space-y-3.5">
          {/* Card 1: Today's Team Attendance Snapshot */}
          <div className="bg-white rounded-xl border border-gray-200/90 shadow-2xs overflow-hidden flex flex-col">
            <div className="px-4 py-2.5 border-b border-gray-100 flex items-center justify-between flex-wrap gap-2 bg-gray-50/50">
              <div className="flex items-center gap-1.5">
                <Clock size={15} className="text-emerald-600" />
                <h2 className="text-xs sm:text-sm font-bold text-gray-900">Today's Staff Attendance</h2>
                <span className="text-[10px] text-gray-400 font-medium">
                  ({hrStats.totalEmployees} staff)
                </span>
              </div>
              <Link
                to="/admin/dashboard/attendance-all"
                className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-md transition-colors"
              >
                <span>Register</span>
                <ArrowRight size={11} />
              </Link>
            </div>

            <div className="p-3.5 space-y-3">
              {/* Mini Attendance Health Bar */}
              <div className="bg-gray-50/80 p-2.5 rounded-lg border border-gray-100 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-gray-700">Turnout: {attendancePercent}%</span>
                  <div className="flex items-center gap-3 text-[11px] font-semibold">
                    <span className="text-emerald-600 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                      {hrStats.presentCount} Present
                    </span>
                    <span className="text-rose-600 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" />
                      {hrStats.absentCount} Absent
                    </span>
                    <span className="text-purple-600 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-purple-500 inline-block" />
                      {hrStats.onLeaveCount} Leave
                    </span>
                  </div>
                </div>

                <div className="w-full h-2 rounded-full bg-gray-200 overflow-hidden flex">
                  <div
                    style={{
                      width: `${
                        hrStats.totalEmployees
                          ? (hrStats.presentCount / hrStats.totalEmployees) * 100
                          : 0
                      }%`,
                    }}
                    className="bg-emerald-500 transition-all duration-300"
                    title={`Present: ${hrStats.presentCount}`}
                  />
                  <div
                    style={{
                      width: `${
                        hrStats.totalEmployees
                          ? (hrStats.onLeaveCount / hrStats.totalEmployees) * 100
                          : 0
                      }%`,
                    }}
                    className="bg-purple-500 transition-all duration-300"
                    title={`On Leave: ${hrStats.onLeaveCount}`}
                  />
                  <div
                    style={{
                      width: `${
                        hrStats.totalEmployees
                          ? (hrStats.absentCount / hrStats.totalEmployees) * 100
                          : 0
                      }%`,
                    }}
                    className="bg-rose-400 transition-all duration-300"
                    title={`Absent: ${hrStats.absentCount}`}
                  />
                </div>
              </div>

              {/* Punch-in / Staff list preview */}
              <div className="divide-y divide-gray-100">
                {loading ? (
                  <LoadingSkeleton type="card" count={2} />
                ) : hrStats.todayAttendance.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-4">
                    No attendance records for today yet.
                  </p>
                ) : (
                  hrStats.todayAttendance.map((rec) => {
                    const empName =
                      rec.name ||
                      (typeof rec.employee?.name === "string"
                        ? rec.employee.name
                        : rec.employee?.name?.first
                        ? `${rec.employee.name.first} ${rec.employee.name.last || ""}`
                        : "Employee");
                    const empDept = rec.department || rec.employee?.department || "General";
                    const isAct = rec.status === "Active" || (rec.checkInTime && !rec.checkOutTime);
                    const isPresent =
                      isAct ||
                      rec.status === "Present" ||
                      rec.status === "Checked Out" ||
                      rec.status === "On Break";

                    return (
                      <div
                        key={rec.id || rec._id || Math.random()}
                        className="py-2 flex items-center justify-between gap-2 hover:bg-gray-50/60 rounded px-1 transition-colors"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-800 font-black text-xs flex items-center justify-center shrink-0">
                            {empName.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-gray-900 truncate">
                              {empName}
                            </p>
                            <p className="text-[10px] text-gray-400 truncate">
                              {empDept} • {rec.checkInTime ? `In: ${formatTime(rec.checkInTime)}` : "No punch"}
                            </p>
                          </div>
                        </div>

                        <div className="shrink-0">
                          {isAct ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              Active Now
                            </span>
                          ) : isPresent ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                              <CheckCircle2 size={10} className="text-blue-600" />
                              Present
                            </span>
                          ) : rec.status === "Leave" ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                              <Calendar size={10} className="text-purple-600" />
                              On Leave
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                              Absent
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Card 2: Pending Leave Requests & Approvals */}
          <div className="bg-white rounded-xl border border-gray-200/90 shadow-2xs overflow-hidden flex flex-col">
            <div className="px-4 py-2.5 border-b border-gray-100 flex items-center justify-between flex-wrap gap-2 bg-gray-50/50">
              <div className="flex items-center gap-1.5">
                <FileText size={15} className="text-amber-600" />
                <h2 className="text-xs sm:text-sm font-bold text-gray-900">Leave Approvals Queue</h2>
                {hrStats.pendingLeavesCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                    {hrStats.pendingLeavesCount} pending
                  </span>
                )}
              </div>
              <Link
                to="/admin/dashboard/leaves"
                className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 hover:text-amber-800 bg-amber-50 hover:bg-amber-100 px-2.5 py-1 rounded-md transition-colors"
              >
                <span>Review Leaves</span>
                <ArrowRight size={11} />
              </Link>
            </div>

            <div className="p-3">
              {hrStats.pendingLeavesList.length > 0 ? (
                <div className="space-y-2">
                  {hrStats.pendingLeavesList.map((lv) => (
                    <div
                      key={lv._id || lv.id}
                      className="p-2.5 rounded-lg border border-amber-200/80 bg-amber-50/40 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="min-w-0">
                        <span className="font-bold text-gray-900 block truncate">
                          {lv.employeeName || lv.employee?.name || "Employee"}
                        </span>
                        <span className="text-[10px] text-amber-800 block truncate">
                          {lv.leaveType || "Leave"} • {lv.totalDays || 1} day(s)
                        </span>
                      </div>
                      <Link
                        to="/admin/dashboard/leaves"
                        className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-amber-600 hover:bg-amber-700 text-white shrink-0 transition-colors shadow-2xs"
                      >
                        Action
                      </Link>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-3 px-2 text-center flex flex-col items-center justify-center text-gray-500">
                  <CheckCircle2 size={20} className="text-emerald-500 mb-1" />
                  <p className="text-xs font-bold text-gray-700">All Leave Requests Up to Date</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    No pending leave applications requiring approval.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Card 3: Direct HR Portal Quick Launch */}
          <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-3.5 rounded-xl shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold tracking-tight text-cyan-200">
                  HR & Workforce Command Center
                </h3>
                <p className="text-[10px] text-blue-200 mt-0.5">
                  Access deep employee profiles, biometric logs & monthly reports.
                </p>
              </div>
              <Link
                to="/admin/dashboard/workforce"
                className="px-3 py-1.5 rounded-lg bg-cyan-400 hover:bg-cyan-300 text-slate-900 text-xs font-bold inline-flex items-center gap-1 transition-colors shrink-0 shadow-xs"
              >
                <span>Full HR Hub</span>
                <ArrowRight size={12} />
              </Link>
            </div>

            {/* Quick module links */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 border-t border-blue-800/80 text-[11px]">
              <Link
                to="/admin/dashboard/attendance-all"
                className="flex items-center gap-1.5 p-1.5 rounded-lg bg-blue-950/50 hover:bg-blue-800/60 text-blue-200 hover:text-white transition-colors"
              >
                <Clock size={12} className="text-cyan-400 shrink-0" />
                <span className="truncate">Attendance</span>
              </Link>
              <Link
                to="/admin/dashboard/employees"
                className="flex items-center gap-1.5 p-1.5 rounded-lg bg-blue-950/50 hover:bg-blue-800/60 text-blue-200 hover:text-white transition-colors"
              >
                <Users size={12} className="text-cyan-400 shrink-0" />
                <span className="truncate">Directory</span>
              </Link>
              <Link
                to="/admin/dashboard/monthly-report"
                className="flex items-center gap-1.5 p-1.5 rounded-lg bg-blue-950/50 hover:bg-blue-800/60 text-blue-200 hover:text-white transition-colors"
              >
                <BarChart3 size={12} className="text-cyan-400 shrink-0" />
                <span className="truncate">Reports</span>
              </Link>
              <Link
                to="/admin/dashboard/expenses"
                className="flex items-center gap-1.5 p-1.5 rounded-lg bg-blue-950/50 hover:bg-blue-800/60 text-blue-200 hover:text-white transition-colors"
              >
                <IndianRupee size={12} className="text-cyan-400 shrink-0" />
                <span className="truncate">Expenses</span>
              </Link>
            </div>
          </div>
        </div>

        {/* ================= RIGHT 50%: Client & Project Operations (CRM) ================= */}
        <div className="space-y-3.5">
          {/* Recent Clients Card */}
          <div className="bg-white rounded-xl border border-gray-200/90 shadow-2xs overflow-hidden flex flex-col">
            <div className="px-4 py-2.5 border-b border-gray-100 flex items-center justify-between flex-wrap gap-2 bg-gray-50/50">
              <div className="flex items-center gap-1.5">
                <Building2 size={15} className="text-blue-600" />
                <h2 className="text-xs sm:text-sm font-bold text-gray-900">Recent Clients</h2>
                <span className="text-[10px] text-gray-400 font-medium">
                  ({crmStats?.totalClients || 0} total)
                </span>
              </div>
              <Link
                to="/clients"
                className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-md transition-colors"
              >
                <span>View All</span>
                <ArrowRight size={11} />
              </Link>
            </div>

            {loading ? (
              <div className="p-4">
                <LoadingSkeleton type="table" count={3} />
              </div>
            ) : (
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left text-xs border-collapse min-w-[440px]">
                  <thead>
                    <tr className="bg-gray-50/70 border-b border-gray-100 text-gray-400 font-bold uppercase tracking-wider text-[10px]">
                      <th className="py-2 px-3 sm:px-4">Client Company</th>
                      <th className="py-2 px-2.5">Country</th>
                      <th className="py-2 px-2 text-center">Projects</th>
                      <th className="py-2 px-2.5">Status</th>
                      <th className="py-2 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {displayedClients.map((client) => (
                      <tr key={client.id} className="hover:bg-blue-50/30 transition-colors">
                        <td className="py-2.5 px-3 sm:px-4">
                          <Link
                            to={`/clients/${client.id}`}
                            className="font-bold text-gray-900 hover:text-blue-600 block text-xs truncate max-w-[160px]"
                          >
                            {client.companyName}
                          </Link>
                          <span className="text-[10px] text-gray-400 block truncate">
                            {client.city}
                          </span>
                        </td>
                        <td className="py-2.5 px-2.5">
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-gray-100 text-gray-700 font-medium text-[10px]">
                            <MapPin size={10} className="text-gray-400 shrink-0" />
                            <span className="truncate max-w-[80px]">{client.country}</span>
                          </span>
                        </td>
                        <td className="py-2.5 px-2 text-center font-bold text-gray-700 text-xs">
                          {client.projectsCount}
                        </td>
                        <td className="py-2.5 px-2.5">
                          <StatusBadge status={client.status} size="sm" />
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <Link
                            to={`/clients/${client.id}`}
                            className="inline-flex items-center gap-0.5 px-2 py-0.5 text-[11px] font-semibold text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                          >
                            <span>View</span>
                            <ArrowRight size={11} />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Latest Deployment Projects Card */}
          <div className="bg-white rounded-xl border border-gray-200/90 shadow-2xs overflow-hidden flex flex-col">
            <div className="px-4 py-2.5 border-b border-gray-100 flex items-center justify-between flex-wrap gap-2 bg-gray-50/50">
              <div className="flex items-center gap-2">
                <FolderKanban size={15} className="text-indigo-600" />
                <h2 className="text-xs sm:text-sm font-bold text-gray-900">Latest Projects</h2>

                {/* Quick Tab Toggle */}
                <div className="inline-flex items-center bg-gray-100 p-0.5 rounded-md text-[10px] font-bold ml-1">
                  <button
                    type="button"
                    onClick={() => setProjectTab("All")}
                    className={`px-1.5 py-0.5 rounded cursor-pointer transition-all ${
                      projectTab === "All"
                        ? "bg-white text-indigo-700 shadow-2xs"
                        : "text-gray-500 hover:text-gray-800"
                    }`}
                  >
                    All ({crmStats?.totalProjects || 0})
                  </button>
                  <button
                    type="button"
                    onClick={() => setProjectTab("Active")}
                    className={`px-1.5 py-0.5 rounded cursor-pointer transition-all ${
                      projectTab === "Active"
                        ? "bg-white text-emerald-700 shadow-2xs"
                        : "text-gray-500 hover:text-gray-800"
                    }`}
                  >
                    Active ({crmStats?.activeProjects || 0})
                  </button>
                </div>
              </div>

              <Link
                to="/projects"
                className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-md transition-colors"
              >
                <span>See All</span>
                <ArrowRight size={11} />
              </Link>
            </div>

            {/* Project Items List */}
            <div className="p-3 divide-y divide-gray-100">
              {loading ? (
                <LoadingSkeleton type="card" count={3} />
              ) : displayedProjects.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-5">
                  No {projectTab === "Active" ? "active " : ""}projects available.
                </p>
              ) : (
                displayedProjects.map((proj) => (
                  <Link
                    key={proj.id}
                    to={`/clients/${proj.clientId}/projects/${proj.id}`}
                    className="py-2 px-2 hover:bg-indigo-50/40 rounded-lg transition-colors flex items-center justify-between gap-3 block group"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="font-mono text-[10px] font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.2 rounded border border-indigo-100 uppercase">
                          {proj.id}
                        </span>
                        <span className="text-[10px] text-gray-400 truncate">
                          {proj.projectType || "General"}
                        </span>
                        <span className="text-gray-300">•</span>
                        <span className="text-[10px] text-gray-500 truncate flex items-center gap-0.5">
                          <MapPin size={10} className="text-gray-400 shrink-0" />
                          <span>{proj.country}</span>
                        </span>
                      </div>

                      <h4 className="text-xs font-bold text-gray-900 group-hover:text-indigo-600 truncate transition-colors">
                        {proj.projectName}
                      </h4>

                      <p className="text-[10px] text-gray-400 truncate mt-0.5">
                        {proj.clientName}
                      </p>
                    </div>

                    <div className="flex items-center shrink-0">
                      <StatusBadge status={proj.status} size="sm" />
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
