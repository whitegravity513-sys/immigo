import React, { useState, useEffect, useMemo } from "react";
import {
  Shield,
  ShieldCheck,
  Users,
  Search,
  Check,
  X,
  Save,
  RotateCcw,
  CheckCheck,
  AlertTriangle,
  UserPlus,
  Trash2,
  Edit2,
  Lock,
  ChevronRight,
  ChevronDown,
  Building2,
  FolderKanban,
  Briefcase,
  UserCheck,
  CreditCard,
  BarChart3,
  CheckSquare,
  Square,
  CheckCircle2,
  Info,
  Layers,
  Calendar,
  ExternalLink,
} from "lucide-react";
import AdminMasterLayout from "../../../components/admin/layout/AdminMasterLayout.jsx";
import permissionService from "../../../services/permissionService.js";
import crmVendorService from "../../../services/crmVendorService.js";
import { usePermissions } from "../../../context/PermissionContext.jsx";
import { useAuth } from "../../../context/AuthContext.jsx";
import DeleteConfirmModal from "../../../components/common/DeleteConfirmModal.jsx";

const MANAGEMENT_GROUPS = [
  {
    id: "hr",
    title: "HR Management",
    desc: "Workforce directory, attendance monitoring, leave administration, and meetings",
    icon: Users,
    color: "text-blue-600 bg-blue-50 border-blue-200",
    headerBg: "hover:bg-blue-50/50",
    forRoles: ["ADMIN", "HR"],
    subsections: [
      {
        id: "employees",
        name: "Workforce & Employee Directory",
        desc: "Staff profiles, onboarding records, employee IDs, and designations",
        actions: [
          { key: "employees.view", label: "View Directory", desc: "View all employee profiles" },
          { key: "employees.create", label: "Register Staff", desc: "Add new employee record" },
          { key: "employees.update", label: "Edit Profiles", desc: "Update employee details" },
          { key: "employees.delete", label: "Delete Staff", desc: "Remove staff records", isDanger: true },
          { key: "employees.export", label: "Export Records", desc: "Download Excel/CSV staff list" },
        ],
      },
      {
        id: "attendance",
        name: "Daily Attendance & Turnout",
        desc: "Live daily check-ins, clock-in times, work hours, and attendance adjustments",
        actions: [
          { key: "attendance.view", label: "View Attendance", desc: "Monitor daily attendance registers" },
          { key: "attendance.create", label: "Record Entry", desc: "Create manual clock-in/out entry" },
          { key: "attendance.update", label: "Edit Timesheets", desc: "Adjust shift timings & remarks" },
          { key: "attendance.export", label: "Export Logs", desc: "Download monthly turnout logs" },
        ],
      },
      {
        id: "leaves",
        name: "Leave Requests & Approvals",
        desc: "Employee leave applications, approvals, rejections, and annual leave balances",
        actions: [
          { key: "leaves.view", label: "View Requests", desc: "See incoming leave applications" },
          { key: "leaves.create", label: "Apply Leave", desc: "Submit leave request on behalf" },
          { key: "leaves.update", label: "Edit Balance", desc: "Adjust leave days and types" },
          { key: "leaves.approve", label: "Approve / Reject", desc: "Grant or decline leave requests", isHighlight: true },
          { key: "leaves.export", label: "Export Balances", desc: "Download annual leave ledger" },
        ],
      },
      {
        id: "meetings",
        name: "Company Calendar & Meetings",
        desc: "Internal meetings, candidate interviews, appointments, and conferencing",
        actions: [
          { key: "meetings.view", label: "View Calendar", desc: "Browse appointments & meeting schedule" },
          { key: "meetings.create", label: "Schedule Event", desc: "Create new meetings and invitations" },
          { key: "meetings.update", label: "Edit Events", desc: "Reschedule or modify meetings" },
          { key: "meetings.delete", label: "Cancel Meeting", desc: "Remove scheduled appointments", isDanger: true },
        ],
      },
    ],
  },
  {
    id: "clients",
    title: "Client Management",
    desc: "International employer companies, contracts, demand quotas, and client ledgers",
    icon: Building2,
    color: "text-purple-600 bg-purple-50 border-purple-200",
    headerBg: "hover:bg-purple-50/50",
    forRoles: ["ADMIN"],
    subsections: [
      {
        id: "clients",
        name: "Overseas Client Companies",
        desc: "Foreign employer profiles, contact persons, company registration, and country agreements",
        actions: [
          { key: "clients.view", label: "View Clients", desc: "Browse international client accounts" },
          { key: "clients.create", label: "Onboard Client", desc: "Register new foreign enterprise client" },
          { key: "clients.update", label: "Edit Client Details", desc: "Update agreements and contacts" },
          { key: "clients.delete", label: "Delete Client", desc: "Remove client record", isDanger: true },
          { key: "clients.export", label: "Export Client List", desc: "Download client accounts summary" },
        ],
      },
    ],
  },
  {
    id: "projects",
    title: "Project Management",
    desc: "Overseas recruitment projects, trade quotas, demand letters, and deployment schedules",
    icon: FolderKanban,
    color: "text-sky-600 bg-sky-50 border-sky-200",
    headerBg: "hover:bg-sky-50/50",
    forRoles: ["ADMIN"],
    subsections: [
      {
        id: "projects",
        name: "Manpower Deployment Projects",
        desc: "Client recruitment projects, vacancy targets, demand numbers, and timelines",
        actions: [
          { key: "projects.view", label: "View Projects", desc: "Browse active client recruitment demands" },
          { key: "projects.create", label: "Create Project", desc: "Launch new recruitment demand project" },
          { key: "projects.update", label: "Edit Milestones", desc: "Update target dates and vacancies" },
          { key: "projects.delete", label: "Delete Project", desc: "Archive or delete recruitment project", isDanger: true },
          { key: "projects.export", label: "Export Projects", desc: "Download project summary reports" },
        ],
      },
    ],
  },
  {
    id: "vendors",
    title: "Vendor Management",
    desc: "Sub-agencies, partner MOUs, candidate submissions, commission, and disbursements",
    icon: Briefcase,
    color: "text-emerald-600 bg-emerald-50 border-emerald-200",
    headerBg: "hover:bg-emerald-50/50",
    forRoles: ["ADMIN"],
    subsections: [
      {
        id: "vendors",
        name: "Recruitment Vendors & Agencies",
        desc: "Vendor partner accounts, MOU documentation, candidate submissions, and commissions",
        actions: [
          { key: "vendors.view", label: "View Vendors", desc: "Browse partner agency network" },
          { key: "vendors.create", label: "Register Vendor", desc: "Onboard new recruitment agency" },
          { key: "vendors.update", label: "Edit Vendor Info", desc: "Update agreement terms and status" },
          { key: "vendors.delete", label: "Delete Vendor", desc: "Remove vendor partner", isDanger: true },
          { key: "vendors.approve", label: "Approve MOU & Payouts", desc: "Verify contracts and commission payouts", isHighlight: true },
          { key: "vendors.export", label: "Export Vendors", desc: "Download vendor performance data" },
        ],
      },
    ],
  },
  {
    id: "candidates",
    title: "Candidate Management",
    desc: "Applicant screening, trade document verification, interviews, selection, and deployment",
    icon: UserCheck,
    color: "text-amber-600 bg-amber-50 border-amber-200",
    headerBg: "hover:bg-amber-50/50",
    forRoles: ["ADMIN", "HR"],
    subsections: [
      {
        id: "candidates",
        name: "Candidates & Recruitment Pipeline",
        desc: "New registrations, passports, trade test documents, interviews, and selected status",
        actions: [
          { key: "candidates.view", label: "View Candidates", desc: "Search and browse all candidate profiles" },
          { key: "candidates.create", label: "Register Candidate", desc: "Add new applicant registration" },
          { key: "candidates.update", label: "Edit Profile & Trades", desc: "Update skills, passport, and contact info" },
          { key: "candidates.delete", label: "Delete Candidate", desc: "Remove candidate profile", isDanger: true },
          { key: "candidates.approve", label: "Verify Docs & Selection", desc: "Approve documents & final selection", isHighlight: true },
          { key: "candidates.export", label: "Export Candidates", desc: "Download candidate records" },
        ],
      },
    ],
  },
  {
    id: "finance",
    title: "Finance & Invoicing",
    desc: "Billing invoices, client payment receipts, vendor commissions, and ledger entries",
    icon: CreditCard,
    color: "text-indigo-600 bg-indigo-50 border-indigo-200",
    headerBg: "hover:bg-indigo-50/50",
    forRoles: ["ADMIN"],
    subsections: [
      {
        id: "finance",
        name: "Corporate Billing & Ledger",
        desc: "Invoicing foreign clients, recording milestone payments, and expense ledgers",
        actions: [
          { key: "finance.view", label: "View Financials", desc: "Browse client receipts and invoices" },
          { key: "finance.create", label: "Generate Invoice", desc: "Create client billing invoices" },
          { key: "finance.update", label: "Record Payment", desc: "Confirm client receipts and ledgers" },
          { key: "finance.delete", label: "Void Invoices", desc: "Cancel erroneous billing entries", isDanger: true },
          { key: "finance.export", label: "Export Financials", desc: "Download tax & ledger records" },
        ],
      },
    ],
  },
  {
    id: "reports",
    title: "Reports & Analytics",
    desc: "Executive analytics, deployment trends, attendance registers, and compliance logs",
    icon: BarChart3,
    color: "text-rose-600 bg-rose-50 border-rose-200",
    headerBg: "hover:bg-rose-50/50",
    forRoles: ["ADMIN"],
    subsections: [
      {
        id: "reports",
        name: "Analytics & Executive Reports",
        desc: "Monthly workforce turnout, overseas hiring numbers, and audit reports",
        actions: [
          { key: "reports.view", label: "View Analytics", desc: "Browse business intelligence dashboards" },
          { key: "reports.export", label: "Export Reports", desc: "Download executive Excel/PDF summaries" },
        ],
      },
    ],
  },
];

export function PermissionManagementPage() {
  const { reloadPermissions } = usePermissions();
  const { isSuperAdmin } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [admins, setAdmins] = useState([]);
  const [selectedAdminId, setSelectedAdminId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");

  useEffect(() => {
    if (!isSuperAdmin) {
      setRoleFilter("EMPLOYEE_HR");
    }
  }, [isSuperAdmin]);

  const [selectedAdminData, setSelectedAdminData] = useState(null);
  const [effectivePermissions, setEffectivePermissions] = useState([]);
  const [initialPermissions, setInitialPermissions] = useState([]);

  const [expandedGroups, setExpandedGroups] = useState({
    hr: true,
    clients: false,
    projects: false,
    vendors: false,
    candidates: false,
    finance: false,
    reports: false,
  });

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isConfirmSaveOpen, setIsConfirmSaveOpen] = useState(false);
  const [adminToDelete, setAdminToDelete] = useState(null);
  const [deletingAdmin, setDeletingAdmin] = useState(false);
  const [availableVendors, setAvailableVendors] = useState([]);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "HR",
    hrType: "EMPLOYEE_HR",
    assignedVendors: [],
    notes: "",
  });

  const [editFormData, setEditFormData] = useState({
    id: "",
    name: "",
    email: "",
    role: "HR",
    hrType: "EMPLOYEE_HR",
    assignedVendors: [],
    isActive: true,
  });

  const [notice, setNotice] = useState(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [res, vendorList] = await Promise.all([
        permissionService.getAdmins(),
        crmVendorService.getVendors().catch(() => []),
      ]);

      if (Array.isArray(vendorList)) {
        setAvailableVendors(vendorList);
      }

      if (res?.success) {
        const adminList = res.admins || [];
        const accessibleList = isSuperAdmin
          ? adminList
          : adminList.filter((a) => a.role === "HR");
        setAdmins(accessibleList);

        const firstAdmin = isSuperAdmin
          ? (accessibleList.find((a) => a.role === "ADMIN") || accessibleList.find((a) => a.role !== "SUPER_ADMIN") || accessibleList[0])
          : (accessibleList.find((a) => a.role === "HR") || accessibleList[0]);

        if (firstAdmin) {
          selectAdmin(firstAdmin.id || firstAdmin._id);
        }
      }
    } catch (err) {
      console.error("Failed to load RBAC data:", err);
      showNotice("Failed to load administrator and staff accounts.", "error");
    } finally {
      setLoading(false);
    }
  };

  const selectAdmin = async (adminId) => {
    if (!adminId) return;
    try {
      setSelectedAdminId(adminId);
      const res = await permissionService.getAdminById(adminId);
      if (res?.success) {
        setSelectedAdminData(res.admin);
        const perms = res.admin.effectivePermissions || [];
        setEffectivePermissions(perms);
        setInitialPermissions([...perms]);
      }
    } catch (err) {
      console.error("Failed to fetch admin permissions:", err);
      showNotice("Failed to fetch permissions for the selected account.", "error");
    }
  };

  const showNotice = (message, type = "success") => {
    setNotice({ message, type });
    setTimeout(() => setNotice(null), 5000);
  };

  const toggleGroup = (groupId) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

  const setAllGroups = (isOpen) => {
    const updated = {};
    MANAGEMENT_GROUPS.forEach((g) => {
      updated[g.id] = isOpen;
    });
    setExpandedGroups(updated);
  };

  const isSelectedAdmin =
    selectedAdminData?.role === "ADMIN" || selectedAdminData?.role === "SUPER_ADMIN";
  const isSelectedVendorHR =
    selectedAdminData?.role === "HR" && selectedAdminData?.hrType === "VENDOR_HR";
  const isSelectedEmployeeHR =
    selectedAdminData?.role === "HR" && selectedAdminData?.hrType !== "VENDOR_HR";

  const handleFilterClick = (filterKey) => {
    setRoleFilter(filterKey);
    const matching = admins.filter((adm) => {
      if (!isSuperAdmin && adm.role !== "HR") return false;
      const isVendor = adm.role === "HR" && adm.hrType === "VENDOR_HR";
      const isEmp = adm.role === "HR" && adm.hrType !== "VENDOR_HR";
      const isAdm = adm.role === "ADMIN" || adm.role === "SUPER_ADMIN";

      if (filterKey === "ALL") return true;
      if (filterKey === "ADMIN") return isAdm;
      if (filterKey === "EMPLOYEE_HR") return isEmp;
      if (filterKey === "VENDOR_HR") return isVendor;
      return true;
    });

    if (matching.length > 0) {
      const alreadySelected = matching.some(
        (m) => (m.id || m._id) === selectedAdminId
      );
      if (!alreadySelected) {
        selectAdmin(matching[0].id || matching[0]._id);
      }
    }
  };

  const filteredAdmins = useMemo(() => {
    return admins.filter((adm) => {
      if (!isSuperAdmin && adm.role !== "HR") return false;

      const matchesSearch =
        adm.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        adm.email?.toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchesSearch) return false;

      const isVendor = adm.role === "HR" && adm.hrType === "VENDOR_HR";
      const isEmp = adm.role === "HR" && adm.hrType !== "VENDOR_HR";
      const isAdm = adm.role === "ADMIN" || adm.role === "SUPER_ADMIN";

      if (roleFilter === "ALL") return true;
      if (roleFilter === "ADMIN") return isAdm;
      if (roleFilter === "EMPLOYEE_HR") return isEmp;
      if (roleFilter === "VENDOR_HR") return isVendor;

      return true;
    });
  }, [admins, searchTerm, roleFilter, isSuperAdmin]);

  const visibleGroups = useMemo(() => {
    if (!selectedAdminData) return MANAGEMENT_GROUPS;

    // Vendor HR: fixed agency scope, no custom permission groups
    if (isSelectedVendorHR) {
      return [];
    }

    // Employee HR: strictly workforce & employee operations
    if (isSelectedEmployeeHR) {
      return MANAGEMENT_GROUPS.filter((g) => g.id === "hr");
    }

    // Admin / Super Admin: show all management modules
    return MANAGEMENT_GROUPS;
  }, [selectedAdminData, isSelectedVendorHR, isSelectedEmployeeHR]);

  const allCurrentKeys = useMemo(() => {
    return visibleGroups.flatMap((g) =>
      g.subsections.flatMap((s) => s.actions.map((a) => a.key))
    );
  }, [visibleGroups]);

  const isPermissionChecked = (permKey) => {
    if (!effectivePermissions) return false;
    if (effectivePermissions.includes("*")) return true;
    return effectivePermissions.includes(permKey);
  };

  const togglePermission = (permKey) => {
    if (selectedAdminData?.isSuperAdmin) return;

    setEffectivePermissions((prev) => {
      const exists = prev.includes(permKey);
      if (exists) {
        return prev.filter((k) => k !== permKey && k !== "*");
      } else {
        return [...prev.filter((k) => k !== "*"), permKey];
      }
    });
  };

  const selectAllInGroup = (group) => {
    if (selectedAdminData?.isSuperAdmin) return;
    const groupKeys = group.subsections.flatMap((s) => s.actions.map((a) => a.key));
    setEffectivePermissions((prev) => Array.from(new Set([...prev, ...groupKeys])));
  };

  const clearAllInGroup = (group) => {
    if (selectedAdminData?.isSuperAdmin) return;
    const groupKeys = new Set(group.subsections.flatMap((s) => s.actions.map((a) => a.key)));
    setEffectivePermissions((prev) => prev.filter((k) => !groupKeys.has(k)));
  };

  const handleSelectAllGlobal = () => {
    if (selectedAdminData?.isSuperAdmin) return;
    setEffectivePermissions(allCurrentKeys);
  };

  const handleClearAllGlobal = () => {
    if (selectedAdminData?.isSuperAdmin) return;
    setEffectivePermissions([]);
  };

  const changesDiff = useMemo(() => {
    const isWildcard = initialPermissions.includes("*");
    const currentSet = new Set(effectivePermissions);
    const initialSet = new Set(isWildcard ? allCurrentKeys : initialPermissions);

    const added = [...currentSet].filter((x) => !initialSet.has(x) && x !== "*");
    const removed = [...initialSet].filter((x) => !currentSet.has(x) && x !== "*");

    return {
      hasChanges: added.length > 0 || removed.length > 0,
      added,
      removed,
    };
  }, [effectivePermissions, initialPermissions, allCurrentKeys]);

  const handleSaveChanges = async () => {
    if (!selectedAdminId) return;

    try {
      setSaving(true);
      const res = await permissionService.updateAdminPermissions(selectedAdminId, {
        permissions: effectivePermissions,
        notes: `Updated permissions via RBAC console`,
      });

      if (res?.success) {
        setInitialPermissions([...effectivePermissions]);
        setIsConfirmSaveOpen(false);
        showNotice(`Permissions updated for ${selectedAdminData?.name || "administrator"}.`);

        setAdmins((prev) =>
          prev.map((adm) => {
            if (adm.id === selectedAdminId || adm._id === selectedAdminId) {
              return {
                ...adm,
                permissionCount: effectivePermissions.length,
              };
            }
            return adm;
          })
        );

        await reloadPermissions();
      } else {
        showNotice(res?.message || "Failed to update permissions.", "error");
      }
    } catch (err) {
      console.error("Save permissions error:", err);
      showNotice(err?.response?.data?.message || "Failed to save permissions.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleOpenCreateModal = () => {
    let initialRole = "EMPLOYEE_HR";
    if (roleFilter === "ADMIN" && isSuperAdmin) {
      initialRole = "ADMIN";
    } else if (roleFilter === "VENDOR_HR") {
      initialRole = "VENDOR_HR";
    }
    setFormData({
      name: "",
      email: "",
      password: "",
      role: initialRole,
      hrType: initialRole === "ADMIN" ? "" : initialRole,
      assignedVendors: [],
      notes: "",
    });
    setIsCreateModalOpen(true);
  };

  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const isVendorHR = formData.role === "VENDOR_HR";
      const isEmpHR = formData.role === "EMPLOYEE_HR";
      const payload = {
        ...formData,
        role: isVendorHR || isEmpHR ? "HR" : formData.role,
        hrType: isVendorHR ? "VENDOR_HR" : isEmpHR ? "EMPLOYEE_HR" : "",
        assignedVendors: isVendorHR ? formData.assignedVendors : [],
      };
      const res = await permissionService.createAdmin(payload);
      if (res?.success) {
        showNotice(`Account for ${formData.name} created successfully.`);
        setIsCreateModalOpen(false);
        setFormData({
          name: "",
          email: "",
          password: "",
          role: "EMPLOYEE_HR",
          hrType: "EMPLOYEE_HR",
          assignedVendors: [],
          notes: "",
        });
        await loadInitialData();
      } else {
        showNotice(res?.message || "Failed to create account.", "error");
      }
    } catch (err) {
      console.error("Create account error:", err);
      showNotice(err?.response?.data?.message || "Failed to create account.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleEditAdmin = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const isVendorHR = editFormData.role === "VENDOR_HR" || editFormData.hrType === "VENDOR_HR";
      const isEmpHR = editFormData.role === "EMPLOYEE_HR" || editFormData.hrType === "EMPLOYEE_HR";
      const payload = {
        ...editFormData,
        role: isVendorHR || isEmpHR ? "HR" : editFormData.role,
        hrType: isVendorHR ? "VENDOR_HR" : isEmpHR ? "EMPLOYEE_HR" : "",
        assignedVendors: isVendorHR ? editFormData.assignedVendors : [],
      };
      const res = await permissionService.updateAdminDetails(editFormData.id, payload);
      if (res?.success) {
        showNotice("Account details updated successfully.");
        setIsEditModalOpen(false);
        await loadInitialData();
        if (selectedAdminId === editFormData.id) {
          selectAdmin(editFormData.id);
        }
      } else {
        showNotice(res?.message || "Failed to update account.", "error");
      }
    } catch (err) {
      console.error("Update account error:", err);
      showNotice(err?.response?.data?.message || "Failed to update account.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAdmin = async () => {
    if (!adminToDelete) return;
    try {
      setDeletingAdmin(true);
      const adminId = adminToDelete.id || adminToDelete._id;
      const res = await permissionService.deleteAdmin(adminId);
      if (res?.success) {
        showNotice(`Account for ${adminToDelete.name} has been deleted.`);
        setAdminToDelete(null);
        await loadInitialData();
      } else {
        showNotice(res?.message || "Failed to delete account.", "error");
      }
    } catch (err) {
      console.error("Delete account error:", err);
      showNotice(err?.response?.data?.message || "Failed to delete account.", "error");
    } finally {
      setDeletingAdmin(false);
    }
  };

  return (
    <AdminMasterLayout
      title="Access Control & Permissions"
      subtitle="Click each management category to expand sub-sections and configure permissions."
      breadcrumbs={[
        { label: "Admin", path: "/admin/dashboard" },
        { label: "Security & RBAC" },
        { label: "Permissions" },
      ]}
    >
      <div className="space-y-3.5 max-w-7xl mx-auto pb-8 min-h-[calc(100vh-80px)]">
        {/* Notice alert */}
        {notice && (
          <div
            className={`p-2.5 rounded-xl flex items-center justify-between text-xs font-semibold animate-in fade-in duration-200 border ${
              notice.type === "error"
                ? "bg-rose-50 text-rose-800 border-rose-200"
                : "bg-emerald-50 text-emerald-800 border-emerald-200"
            }`}
          >
            <div className="flex items-center gap-2">
              {notice.type === "error" ? (
                <AlertTriangle size={15} className="text-rose-600 shrink-0" />
              ) : (
                <CheckCheck size={15} className="text-emerald-600 shrink-0" />
              )}
              <span>{notice.message}</span>
            </div>
            <button
              onClick={() => setNotice(null)}
              className="text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* COMPACT TOP HEADER */}
        <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 rounded-2xl p-3 sm:p-4 text-white shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-blue-600/30 border border-blue-400/30 flex items-center justify-center shrink-0">
              <Shield size={16} className="text-cyan-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-extrabold tracking-tight">
                  Role-Based Access Control (RBAC) Console
                </h1>
                <span className="text-[10px] font-bold px-2 py-0.2 rounded-full uppercase tracking-wider bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 shrink-0">
                  {isSuperAdmin ? "Super Admin" : "Admin Console"}
                </span>
              </div>
              <p className="text-blue-200/80 text-[11px] leading-snug truncate max-w-xl">
                Configure module-wise capabilities for Admins across HR, Clients, Projects, Vendors & Candidates.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            {/* Quick Metrics */}
            <div className="hidden md:flex items-center gap-2 text-[11px] font-medium text-blue-200/90 bg-white/10 px-3 py-1 rounded-xl border border-white/10">
              <span>Admins: <strong className="text-white font-bold">{admins.filter((a) => a.role === "ADMIN" || a.role === "SUPER_ADMIN").length}</strong></span>
              <span className="text-white/30">&bull;</span>
              <span>Employee HR: <strong className="text-white font-bold">{admins.filter((a) => a.role === "HR" && a.hrType !== "VENDOR_HR").length}</strong></span>
              <span className="text-white/30">&bull;</span>
              <span>Vendor HR: <strong className="text-white font-bold">{admins.filter((a) => a.role === "HR" && a.hrType === "VENDOR_HR").length}</strong></span>
            </div>

            <button
              type="button"
              onClick={handleOpenCreateModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-xs transition-all cursor-pointer hover:scale-101"
            >
              <UserPlus size={13} />
              <span>Create Account</span>
            </button>
          </div>
        </div>

        {/* MAIN SPLIT LAYOUT */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-start">
          {/* LEFT COLUMN: ACCOUNT SELECTOR */}
          <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-3 sm:p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                <Users size={14} className="text-blue-600" />
                <span>Account Directory</span>
              </h3>
              <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                {filteredAdmins.length} Accounts
              </span>
            </div>

            {/* Search and Role Filter */}
            <div className="space-y-1.5">
              <div className="relative">
                <Search size={13} className="absolute left-2.5 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by name or email..."
                  className="w-full pl-8 pr-2.5 py-1.5 text-xs rounded-lg bg-slate-50 border border-slate-200 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-blue-600 transition-all"
                />
              </div>

              {/* 3-Role Segmentation Filter Pills */}
              <div className="flex items-center gap-1 overflow-x-auto pb-0.5 text-[10px]">
                {[
                  { key: "ALL", label: `All (${admins.length})` },
                  ...(isSuperAdmin
                    ? [
                        {
                          key: "ADMIN",
                          label: `Admin (${
                            admins.filter((a) => a.role === "ADMIN" || a.role === "SUPER_ADMIN").length
                          })`,
                        },
                      ]
                    : []),
                  {
                    key: "EMPLOYEE_HR",
                    label: `Employee HR (${
                      admins.filter((a) => a.role === "HR" && a.hrType !== "VENDOR_HR").length
                    })`,
                  },
                  {
                    key: "VENDOR_HR",
                    label: `Vendor HR (${
                      admins.filter((a) => a.role === "HR" && a.hrType === "VENDOR_HR").length
                    })`,
                  },
                ].map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => handleFilterClick(item.key)}
                    className={`px-2 py-1 rounded-md font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                      roleFilter === item.key
                        ? "bg-blue-600 text-white shadow-2xs"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Account Card List */}
            <div className="space-y-1.5 max-h-[540px] overflow-y-auto custom-scrollbar pr-0.5">
              {filteredAdmins.length === 0 ? (
                <div className="text-center py-6 text-slate-400 text-xs">
                  No accounts found matching filter.
                </div>
              ) : (
                filteredAdmins.map((adm) => {
                  const isSelected = selectedAdminId === adm.id || selectedAdminId === adm._id;
                  const isSuper = adm.role === "SUPER_ADMIN";
                  const isVendor = adm.role === "HR" && adm.hrType === "VENDOR_HR";
                  const isEmployee = adm.role === "HR" && adm.hrType !== "VENDOR_HR";

                  return (
                    <div
                      key={adm.id || adm._id}
                      onClick={() => selectAdmin(adm.id || adm._id)}
                      className={`p-2.5 rounded-xl border transition-all cursor-pointer relative ${
                        isSelected
                          ? "bg-blue-50/80 border-blue-400 shadow-2xs ring-1 ring-blue-500/20"
                          : "bg-white hover:bg-slate-50/80 border-slate-200/80"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-1.5">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-xs text-slate-900 truncate">
                              {adm.name}
                            </span>
                            {!adm.isActive && (
                              <span className="text-[9px] bg-rose-100 text-rose-700 px-1 py-0.2 rounded font-bold">
                                Disabled
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-500 truncate mt-0.5">
                            {adm.email}
                          </div>
                          {isVendor && (
                            <div className="text-[9.5px] text-cyan-700 font-semibold truncate mt-0.5">
                              {Array.isArray(adm.assignedVendors) && adm.assignedVendors.length > 0
                                ? `${adm.assignedVendors.length} Agencies Linked`
                                : "No Agency Linked"}
                            </div>
                          )}
                        </div>

                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wider shrink-0 ${
                            isSuper
                              ? "bg-amber-100 text-amber-800 border border-amber-300"
                              : isVendor
                              ? "bg-cyan-100 text-cyan-800 border border-cyan-200"
                              : isEmployee
                              ? "bg-purple-100 text-purple-800 border border-purple-200"
                              : "bg-blue-100 text-blue-800 border border-blue-200"
                          }`}
                        >
                          {isSuper
                            ? "Super Admin"
                            : isVendor
                            ? "Vendor HR"
                            : isEmployee
                            ? "Employee HR"
                            : "Admin"}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2 pt-1.5 border-t border-slate-100">
                        {isVendor ? (
                          <span className="flex items-center gap-1 font-semibold text-cyan-700">
                            <Briefcase size={10} className="text-cyan-600" />
                            <span>Agency Scoped (Fixed Role)</span>
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 font-medium">
                            <Lock size={10} className="text-blue-500" />
                            <span>{adm.permissionCount} Perms Active</span>
                          </span>
                        )}

                        <div className="flex items-center gap-1">
                          {!isSuper && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                const isVendorRole = adm.role === "HR" && adm.hrType === "VENDOR_HR";
                                const isEmpRole = adm.role === "HR" && adm.hrType !== "VENDOR_HR";
                                setEditFormData({
                                  id: adm.id || adm._id,
                                  name: adm.name,
                                  email: adm.email,
                                  role: isVendorRole ? "VENDOR_HR" : isEmpRole ? "EMPLOYEE_HR" : adm.role,
                                  hrType: adm.hrType || (adm.role === "HR" ? "EMPLOYEE_HR" : ""),
                                  assignedVendors: adm.assignedVendors || [],
                                  isActive: adm.isActive !== false,
                                });
                                setIsEditModalOpen(true);
                              }}
                              className="p-1 hover:text-blue-600 hover:bg-blue-100 rounded text-slate-400 cursor-pointer"
                              title="Edit Account"
                            >
                              <Edit2 size={11} />
                            </button>
                          )}
                          {!isSuper && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setAdminToDelete(adm);
                              }}
                              className="p-1 hover:text-rose-600 hover:bg-rose-100 rounded text-slate-400 cursor-pointer"
                              title="Delete Account"
                            >
                              <Trash2 size={11} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: ACCORDION MANAGEMENT PERMISSIONS OR VENDOR HR VIEW */}
          <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-3.5 sm:p-4 space-y-3">
            {selectedAdminData ? (
              isSelectedVendorHR ? (
                /* DEDICATED VENDOR HR AGENCY & SCOPE VIEW (NO ROLE CHECKBOXES) */
                <div className="space-y-3.5">
                  {/* Account Details & Action Bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/80">
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-base font-bold text-slate-900 tracking-tight">
                          {selectedAdminData.name}
                        </h2>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider bg-cyan-100 text-cyan-900 border border-cyan-200">
                          Vendor HR
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
                          Fixed Agency Scope
                        </span>
                        {!selectedAdminData.isActive && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider bg-rose-100 text-rose-800 border border-rose-200">
                            Disabled
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                        {selectedAdminData.email} &bull; Scope:{" "}
                        <strong className="text-cyan-700 font-bold">
                          {selectedAdminData.assignedVendors?.length || 0} Vendor Agencies Assigned
                        </strong>
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setEditFormData({
                            id: selectedAdminData.id || selectedAdminData._id,
                            name: selectedAdminData.name,
                            email: selectedAdminData.email,
                            role: "VENDOR_HR",
                            hrType: "VENDOR_HR",
                            assignedVendors: selectedAdminData.assignedVendors || [],
                            isActive: selectedAdminData.isActive !== false,
                          });
                          setIsEditModalOpen(true);
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-cyan-600 hover:bg-cyan-700 text-white shadow-xs cursor-pointer transition-all"
                      >
                        <Edit2 size={12} />
                        <span>Edit Agency Assignment</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setAdminToDelete(selectedAdminData)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 cursor-pointer"
                        title="Delete Account"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  {/* Policy Alert Banner */}
                  <div className="p-3 rounded-xl bg-cyan-50/80 border border-cyan-200 text-cyan-950 text-xs flex items-start gap-2.5">
                    <ShieldCheck size={18} className="text-cyan-700 shrink-0 mt-0.5" />
                    <div className="space-y-0.5 leading-relaxed">
                      <strong className="font-bold text-cyan-900">
                        Vendor HR Policy: Fixed Role Scope (No Custom Role Needed)
                      </strong>
                      <p className="text-cyan-800 text-[11px]">
                        Vendor HR accounts are pre-configured by the system with fixed capabilities. Direct role and permission matrix checkboxes are disabled to guarantee multi-vendor data isolation. Capabilities are strictly bounded to candidates submitted under their assigned recruitment agency.
                      </p>
                    </div>
                  </div>

                  {/* Assigned Vendor Agencies List */}
                  <div className="bg-white rounded-xl border border-slate-200/90 p-3.5 space-y-2.5 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-cyan-100 text-cyan-800">
                          <Briefcase size={14} />
                        </div>
                        <div>
                          <h3 className="font-bold text-xs text-slate-900">
                            Assigned Recruitment Agencies ({selectedAdminData.assignedVendors?.length || 0})
                          </h3>
                          <p className="text-[10px] text-slate-500">
                            This Vendor HR can manage candidate pipelines and attend interviews for these agencies only:
                          </p>
                        </div>
                      </div>
                    </div>

                    {(!selectedAdminData.assignedVendors || selectedAdminData.assignedVendors.length === 0) ? (
                      <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs text-center space-y-2">
                        <AlertTriangle size={20} className="text-amber-600 mx-auto" />
                        <p className="font-bold">No Vendor Agency Currently Assigned</p>
                        <p className="text-[11px] text-amber-700 max-w-md mx-auto">
                          This Vendor HR account has not been linked to any recruitment agency yet. Assign an agency to authorize candidate pipeline visibility.
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            setEditFormData({
                              id: selectedAdminData.id || selectedAdminData._id,
                              name: selectedAdminData.name,
                              email: selectedAdminData.email,
                              role: "VENDOR_HR",
                              hrType: "VENDOR_HR",
                              assignedVendors: [],
                              isActive: selectedAdminData.isActive !== false,
                            });
                            setIsEditModalOpen(true);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs cursor-pointer shadow-xs"
                        >
                          Assign Vendor Agency Now
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-1">
                        {selectedAdminData.assignedVendors.map((vId) => {
                          const vendorObj = availableVendors.find(
                            (v) => (v.vendorId || v.id) === vId
                          );
                          return (
                            <div
                              key={vId}
                              className="p-3 rounded-xl border border-cyan-200 bg-cyan-50/40 space-y-1.5"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                  <h4 className="font-bold text-xs text-slate-900 truncate">
                                    {vendorObj?.companyName || `Vendor ${vId}`}
                                  </h4>
                                  <span className="text-[10px] font-mono text-cyan-800 bg-cyan-100 px-1.5 py-0.2 rounded font-semibold">
                                    ID: {vId}
                                  </span>
                                </div>
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 uppercase">
                                  {vendorObj?.status || "Active Agency"}
                                </span>
                              </div>

                              <div className="text-[10.5px] text-slate-600 space-y-0.5 pt-1 border-t border-cyan-100">
                                {vendorObj?.contactPersonName && (
                                  <div>Contact: <strong>{vendorObj.contactPersonName}</strong></div>
                                )}
                                {vendorObj?.email && (
                                  <div className="text-slate-500 truncate">Email: {vendorObj.email}</div>
                                )}
                                {vendorObj?.phone && (
                                  <div className="text-slate-500">Phone: {vendorObj.phone}</div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Pre-Configured Capabilities */}
                  <div className="bg-white rounded-xl border border-slate-200/90 p-3.5 space-y-2.5 shadow-2xs">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-blue-100 text-blue-800">
                        <CheckCircle2 size={14} />
                      </div>
                      <div>
                        <h3 className="font-bold text-xs text-slate-900">
                          Pre-Configured System Capabilities (Automatically Active)
                        </h3>
                        <p className="text-[10px] text-slate-500">
                          These features are automatically enabled for Vendor HR without custom role configuration:
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-xs">
                      <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/60 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900 flex items-center gap-1.5">
                            <UserCheck size={13} className="text-blue-600" />
                            Candidate Submissions
                          </span>
                          <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                            Active
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 leading-tight">
                          Register applicants, upload passports, trade certificates, and resumes under assigned agency.
                        </p>
                      </div>

                      <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/60 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900 flex items-center gap-1.5">
                            <Layers size={13} className="text-indigo-600" />
                            Live Stage Tracker
                          </span>
                          <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                            Active
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 leading-tight">
                          Monitor real-time pipeline: Applied, Screening, L1/L2 Interview, Selected, Offer Letter & Visa.
                        </p>
                      </div>

                      <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/60 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900 flex items-center gap-1.5">
                            <Calendar size={13} className="text-purple-600" />
                            Interview Schedules
                          </span>
                          <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                            Active
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 leading-tight">
                          View scheduled interview dates and join video conferencing sessions with agency candidates.
                        </p>
                      </div>

                      <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/60 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900 flex items-center gap-1.5">
                            <Lock size={13} className="text-cyan-700" />
                            Multi-Tenant Isolation
                          </span>
                          <span className="text-[9px] font-bold text-cyan-800 bg-cyan-50 px-1.5 py-0.2 rounded border border-cyan-200">
                            Enforced
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 leading-tight">
                          Strict database isolation: blocked from viewing other vendors, workforce employee records, or finance.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* ACCORDION PERMISSIONS VIEW FOR ADMIN & EMPLOYEE HR */
                <div>
                  {/* Account Details & Save Bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/80">
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-base font-bold text-slate-900 tracking-tight">
                          {selectedAdminData.name}
                        </h2>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                            selectedAdminData.isSuperAdmin
                              ? "bg-amber-100 text-amber-900 border border-amber-300"
                              : isSelectedEmployeeHR
                              ? "bg-purple-100 text-purple-900 border border-purple-200"
                              : "bg-blue-100 text-blue-900 border border-blue-200"
                          }`}
                        >
                          {selectedAdminData.isSuperAdmin
                            ? "Super Admin"
                            : isSelectedEmployeeHR
                            ? "Employee HR"
                            : "Admin"}
                        </span>
                        {!selectedAdminData.isActive && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider bg-rose-100 text-rose-800 border border-rose-200">
                            Disabled
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                        {selectedAdminData.email} &bull; Granted Capabilities:{" "}
                        <strong className="text-blue-600 font-bold">
                          {selectedAdminData.isSuperAdmin
                            ? "All Access (Wildcard *)"
                            : isSelectedEmployeeHR
                            ? `${effectivePermissions.length} / ${allCurrentKeys.length} Employee HR Permissions`
                            : `${effectivePermissions.length} / ${allCurrentKeys.length} Permissions`}
                        </strong>
                      </p>
                    </div>

                    {/* Save / Reset Buttons */}
                    <div className="flex items-center gap-2">
                      {changesDiff.hasChanges && !selectedAdminData.isSuperAdmin && (
                        <button
                          type="button"
                          onClick={() => setEffectivePermissions([...initialPermissions])}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 border border-slate-200 cursor-pointer"
                        >
                          <RotateCcw size={12} />
                          <span>Reset</span>
                        </button>
                      )}

                      {!selectedAdminData.isSuperAdmin && (
                        <button
                          type="button"
                          onClick={() => setIsConfirmSaveOpen(true)}
                          disabled={!changesDiff.hasChanges || saving}
                          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                            changesDiff.hasChanges
                              ? "bg-blue-600 hover:bg-blue-700 text-white shadow-xs cursor-pointer"
                              : "bg-slate-100 text-slate-400 cursor-not-allowed"
                          }`}
                        >
                          <Save size={13} />
                          <span>{saving ? "Saving..." : "Save Changes"}</span>
                          {changesDiff.hasChanges && (
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Super Admin Notice */}
                  {selectedAdminData.isSuperAdmin && (
                    <div className="mt-2.5 p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2.5">
                      <ShieldCheck size={16} className="text-amber-600 shrink-0" />
                      <div>
                        <strong>Super Administrator:</strong> Full system access is active. All
                        modules & sub-sections are automatically authorized.
                      </div>
                    </div>
                  )}

                  {/* Employee HR Informational Scope Note */}
                  {isSelectedEmployeeHR && (
                    <div className="mt-2.5 p-2.5 rounded-xl bg-purple-50/80 border border-purple-200 text-purple-900 text-xs flex items-center gap-2.5">
                      <Users size={16} className="text-purple-600 shrink-0" />
                      <div>
                        <strong>Employee HR Scope:</strong> Configured exclusively for workforce operations — employee profiles, daily attendance registers, leave approvals, and internal staff meetings.
                      </div>
                    </div>
                  )}

                  {/* Admin Informational Scope Note */}
                  {isSelectedAdmin && !selectedAdminData.isSuperAdmin && (
                    <div className="mt-2.5 p-2.5 rounded-xl bg-blue-50/80 border border-blue-200 text-blue-900 text-xs flex items-center gap-2.5">
                      <Shield size={16} className="text-blue-600 shrink-0" />
                      <div>
                        <strong>Administrator Scope:</strong> Full operational access across all 7 management modules (HR, Clients, Projects, Vendors, Candidates, Finance, and Reports).
                      </div>
                    </div>
                  )}

                  {/* Global Controls & Accordion Toggle Bar */}
                  {!selectedAdminData.isSuperAdmin && (
                    <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 p-2 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-500 font-bold text-[10px] uppercase tracking-wider">
                          Quick Expand:
                        </span>
                        <button
                          type="button"
                          onClick={() => setAllGroups(true)}
                          className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700 hover:text-blue-600 font-semibold text-[11px] cursor-pointer shadow-2xs"
                        >
                          Expand All
                        </button>
                        <button
                          type="button"
                          onClick={() => setAllGroups(false)}
                          className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700 hover:text-blue-600 font-semibold text-[11px] cursor-pointer shadow-2xs"
                        >
                          Collapse All
                        </button>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={handleSelectAllGlobal}
                          className="px-2.5 py-1 rounded-md bg-blue-100 hover:bg-blue-200 text-blue-800 font-bold text-[11px] cursor-pointer"
                        >
                          {isSelectedEmployeeHR ? "Select All HR Modules" : "Select All Modules"}
                        </button>
                        <button
                          type="button"
                          onClick={handleClearAllGlobal}
                          className="px-2.5 py-1 rounded-md bg-rose-100 hover:bg-rose-200 text-rose-800 font-bold text-[11px] cursor-pointer"
                        >
                          Clear All
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Changes Pending Bar */}
                  {changesDiff.hasChanges && !selectedAdminData.isSuperAdmin && (
                    <div className="mt-2 p-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <AlertTriangle size={13} className="text-amber-600 shrink-0" />
                        <span>
                          Pending changes: <strong>+{changesDiff.added.length}</strong> granted,{" "}
                          <strong>-{changesDiff.removed.length}</strong> revoked. Click &apos;Save Changes&apos; to commit.
                        </span>
                      </div>
                    </div>
                  )}

                  {/* ACCORDION MANAGEMENT GROUPS LIST */}
                  <div className="mt-3 space-y-2.5">
                    {visibleGroups.map((group) => {
                      const GroupIcon = group.icon;
                      const isOpen = Boolean(expandedGroups[group.id]);

                      const groupAllKeys = group.subsections.flatMap((s) =>
                        s.actions.map((a) => a.key)
                      );
                      const grantedInGroup = groupAllKeys.filter((k) =>
                        isPermissionChecked(k)
                      ).length;
                      const isAllGranted =
                        groupAllKeys.length > 0 && grantedInGroup === groupAllKeys.length;

                      return (
                        <div
                          key={group.id}
                          className="border border-slate-200 rounded-xl overflow-hidden transition-all duration-150 shadow-2xs bg-white"
                        >
                          {/* ACCORDION HEADER (Click to expand/collapse) */}
                          <div
                            onClick={() => toggleGroup(group.id)}
                            className={`px-3 py-2.5 flex items-center justify-between gap-3 cursor-pointer select-none transition-colors ${
                              isOpen ? "bg-slate-50 border-b border-slate-200" : group.headerBg
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="text-slate-400 group-hover:text-slate-600 transition-transform">
                                {isOpen ? (
                                  <ChevronDown size={16} className="text-blue-600" />
                                ) : (
                                  <ChevronRight size={16} />
                                )}
                              </div>

                              <span className={`p-1.5 rounded-lg border ${group.color}`}>
                                <GroupIcon size={14} />
                              </span>

                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-xs text-slate-900">
                                    {group.title}
                                  </span>
                                  <span className="text-[10px] text-slate-400 font-normal hidden sm:inline truncate">
                                    &bull; {group.desc}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Right: Granted Count Badge + Quick Module Selector */}
                            <div
                              className="flex items-center gap-2 shrink-0"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                                  isAllGranted
                                    ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                                    : grantedInGroup > 0
                                    ? "bg-blue-100 text-blue-800 border border-blue-200"
                                    : "bg-slate-100 text-slate-500"
                                }`}
                              >
                                {grantedInGroup} / {groupAllKeys.length} Granted
                              </span>

                              {!selectedAdminData.isSuperAdmin && (
                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => selectAllInGroup(group)}
                                    className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 cursor-pointer"
                                    title="Grant all in this section"
                                  >
                                    Select All
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => clearAllInGroup(group)}
                                    className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600 hover:bg-slate-200 cursor-pointer"
                                    title="Clear all in this section"
                                  >
                                    Clear
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* ACCORDION CONTENT (SUBSECTIONS & GRANULAR CAPABILITIES) */}
                          {isOpen && (
                            <div className="p-3 bg-slate-50/40 space-y-3 animate-in fade-in duration-150">
                              {group.subsections.map((sub) => (
                                <div
                                  key={sub.id}
                                  className="bg-white rounded-lg border border-slate-200/80 p-3 space-y-2"
                                >
                                  {/* Subsection Header */}
                                  <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                                    <div>
                                      <h4 className="font-bold text-xs text-slate-900">
                                        {sub.name}
                                      </h4>
                                      <p className="text-[10px] text-slate-400">
                                        {sub.desc}
                                      </p>
                                    </div>
                                  </div>

                                  {/* Granular Action Switches / Checkboxes */}
                                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 pt-1">
                                    {sub.actions.map((act) => {
                                      const checked = isPermissionChecked(act.key);
                                      const disabled = selectedAdminData.isSuperAdmin;

                                      return (
                                        <label
                                          key={act.key}
                                          onClick={(e) => {
                                            if (disabled) return;
                                            e.preventDefault();
                                            togglePermission(act.key);
                                          }}
                                          className={`flex items-start gap-2 p-2 rounded-lg border text-left transition-all select-none ${
                                            disabled
                                              ? "opacity-60 bg-slate-50 border-slate-200 cursor-default"
                                              : checked
                                              ? "bg-blue-50/70 border-blue-300 ring-1 ring-blue-500/20 cursor-pointer shadow-2xs"
                                              : "bg-white border-slate-200/80 hover:border-slate-300 cursor-pointer"
                                          }`}
                                        >
                                          <div className="mt-0.5 shrink-0">
                                            {checked ? (
                                              <CheckSquare
                                                size={15}
                                                className="text-blue-600"
                                              />
                                            ) : (
                                              <Square
                                                size={15}
                                                className="text-slate-300 hover:text-slate-400"
                                              />
                                            )}
                                          </div>

                                          <div className="min-w-0">
                                            <div className="flex items-center gap-1">
                                              <span
                                                className={`text-xs font-bold leading-tight truncate ${
                                                  checked ? "text-blue-900" : "text-slate-800"
                                                }`}
                                              >
                                                {act.label}
                                              </span>
                                              {act.isDanger && (
                                                <span className="text-[8px] bg-rose-100 text-rose-700 px-1 py-0.2 rounded font-bold uppercase">
                                                  Delete
                                                </span>
                                              )}
                                              {act.isHighlight && (
                                                <span className="text-[8px] bg-emerald-100 text-emerald-700 px-1 py-0.2 rounded font-bold uppercase">
                                                  Approval
                                                </span>
                                              )}
                                            </div>
                                            <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">
                                              {act.desc}
                                            </p>
                                          </div>
                                        </label>
                                      );
                                    })}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )
            ) : (
              <div className="text-center py-12 text-slate-400 text-xs">
                Select an account from the left directory to inspect and assign permissions.
              </div>
            )}
          </div>
        </div>

        {/* MODAL: CREATE ADMIN OR HR ACCOUNT */}
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-2xs">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 max-w-md w-full shadow-2xl space-y-3.5 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto custom-scrollbar">
              <div className="flex items-center justify-between border-b pb-2.5">
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                  <UserPlus size={16} className="text-blue-600" />
                  <span>Create Staff Account</span>
                </h3>
                <button
                  onClick={() => setIsCreateModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleCreateAdmin} className="space-y-3 text-xs">
                {/* 3 Account Types Selection */}
                <div>
                  <label className="block text-slate-800 font-bold mb-1.5">
                    Select Account Type *
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {/* Admin */}
                    {isSuperAdmin && (
                      <button
                        type="button"
                        onClick={() =>
                          setFormData({
                            ...formData,
                            role: "ADMIN",
                            hrType: "",
                            assignedVendors: [],
                          })
                        }
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                          formData.role === "ADMIN"
                            ? "bg-blue-50 border-blue-500 ring-2 ring-blue-500/20 text-blue-900"
                            : "bg-white border-slate-200 hover:bg-slate-50 text-slate-700"
                        }`}
                      >
                        <div className="flex items-center gap-1 font-bold text-xs mb-1">
                          <Shield size={13} className="text-blue-600" />
                          <span>Admin</span>
                        </div>
                        <p className="text-[9.5px] text-slate-500 line-clamp-2 leading-tight">
                          Full admin with all 7 module permissions.
                        </p>
                      </button>
                    )}

                    {/* Employee HR */}
                    <button
                      type="button"
                      onClick={() =>
                        setFormData({
                          ...formData,
                          role: "EMPLOYEE_HR",
                          hrType: "EMPLOYEE_HR",
                          assignedVendors: [],
                        })
                      }
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                        formData.role === "EMPLOYEE_HR"
                          ? "bg-purple-50 border-purple-500 ring-2 ring-purple-500/20 text-purple-900"
                          : "bg-white border-slate-200 hover:bg-slate-50 text-slate-700"
                      }`}
                    >
                      <div className="flex items-center gap-1 font-bold text-xs mb-1">
                        <Users size={13} className="text-purple-600" />
                        <span>Employee HR</span>
                      </div>
                      <p className="text-[9.5px] text-slate-500 line-clamp-2 leading-tight">
                        Workforce directory, attendance & leaves only.
                      </p>
                    </button>

                    {/* Vendor HR */}
                    <button
                      type="button"
                      onClick={() =>
                        setFormData({
                          ...formData,
                          role: "VENDOR_HR",
                          hrType: "VENDOR_HR",
                        })
                      }
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                        formData.role === "VENDOR_HR"
                          ? "bg-cyan-50 border-cyan-500 ring-2 ring-cyan-500/20 text-cyan-900"
                          : "bg-white border-slate-200 hover:bg-slate-50 text-slate-700"
                      }`}
                    >
                      <div className="flex items-center gap-1 font-bold text-xs mb-1">
                        <Briefcase size={13} className="text-cyan-600" />
                        <span>Vendor HR</span>
                      </div>
                      <p className="text-[9.5px] text-slate-500 line-clamp-2 leading-tight">
                        Agency recruitment HR. Fixed role scope (No custom role).
                      </p>
                    </button>
                  </div>
                </div>

                {/* If Vendor HR: Info Banner & Vendor Agency Selection */}
                {formData.role === "VENDOR_HR" && (
                  <div className="p-3 rounded-xl bg-cyan-50/80 border border-cyan-200 space-y-2">
                    <div className="flex items-start gap-1.5">
                      <Info size={14} className="text-cyan-700 shrink-0 mt-0.5" />
                      <p className="text-[11px] text-cyan-900 font-medium leading-relaxed">
                        <strong>No Role Setup Required:</strong> Vendor HR accounts are created with fixed, automated recruitment permissions scoped strictly to the selected agency.
                      </p>
                    </div>

                    <div>
                      <label className="block text-slate-800 font-bold mb-1 text-[11px]">
                        Assign Vendor Agency (Select Agency) *
                      </label>
                      <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar bg-white rounded-lg border border-slate-200 p-2">
                        {availableVendors.length === 0 ? (
                          <div className="text-[11px] text-slate-400 italic">No vendors found in system.</div>
                        ) : (
                          availableVendors.map((vnd) => {
                            const vId = vnd.vendorId || vnd.id;
                            const isChecked = (formData.assignedVendors || []).includes(vId);
                            return (
                              <label
                                key={vId}
                                className={`flex items-center gap-2 p-1.5 rounded-md hover:bg-slate-50 text-slate-800 cursor-pointer text-xs border ${
                                  isChecked ? "bg-cyan-50/50 border-cyan-300" : "border-transparent"
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={(e) => {
                                    const curr = formData.assignedVendors || [];
                                    if (e.target.checked) {
                                      setFormData({ ...formData, assignedVendors: [...curr, vId] });
                                    } else {
                                      setFormData({
                                        ...formData,
                                        assignedVendors: curr.filter((id) => id !== vId),
                                      });
                                    }
                                  }}
                                  className="rounded text-cyan-600"
                                />
                                <div className="min-w-0 flex-1">
                                  <div className="font-bold text-slate-900 truncate">
                                    {vnd.companyName}
                                  </div>
                                  <span className="text-[9.5px] text-slate-500 font-mono">ID: {vId}</span>
                                </div>
                              </label>
                            );
                          })
                        )}
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Rahul Sharma"
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 focus:outline-hidden focus:ring-1 focus:ring-blue-600 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Email / Gmail Address *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="e.g. rahul@immigo.com"
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 focus:outline-hidden focus:ring-1 focus:ring-blue-600 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Password *</label>
                  <input
                    type="password"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Minimum 6 characters"
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 focus:outline-hidden focus:ring-1 focus:ring-blue-600 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Notes / Department (Optional)</label>
                  <input
                    type="text"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="e.g. Operations Desk"
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 focus:outline-hidden focus:ring-1 focus:ring-blue-600 text-xs"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2.5 border-t">
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="px-3 py-1.5 rounded-lg text-slate-600 hover:bg-slate-100 font-semibold cursor-pointer text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving || (formData.role === "VENDOR_HR" && (formData.assignedVendors || []).length === 0)}
                    className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold cursor-pointer text-xs shadow-xs disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {saving
                      ? "Creating..."
                      : formData.role === "VENDOR_HR"
                      ? "Create Vendor HR"
                      : formData.role === "EMPLOYEE_HR"
                      ? "Create Employee HR"
                      : "Create Admin"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: EDIT ACCOUNT DETAILS */}
        {isEditModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-2xs">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 max-w-md w-full shadow-2xl space-y-3.5 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto custom-scrollbar">
              <div className="flex items-center justify-between border-b pb-2.5">
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                  <Edit2 size={15} className="text-blue-600" />
                  <span>Edit Account Details</span>
                </h3>
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleEditAdmin} className="space-y-3 text-xs">
                {/* 3 Account Types Selection */}
                <div>
                  <label className="block text-slate-800 font-bold mb-1.5">
                    Account Type *
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {/* Admin */}
                    {isSuperAdmin && (
                      <button
                        type="button"
                        onClick={() =>
                          setEditFormData({
                            ...editFormData,
                            role: "ADMIN",
                            hrType: "",
                          })
                        }
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                          editFormData.role === "ADMIN"
                            ? "bg-blue-50 border-blue-500 ring-2 ring-blue-500/20 text-blue-900"
                            : "bg-white border-slate-200 hover:bg-slate-50 text-slate-700"
                        }`}
                      >
                        <div className="flex items-center gap-1 font-bold text-xs mb-1">
                          <Shield size={13} className="text-blue-600" />
                          <span>Admin</span>
                        </div>
                        <p className="text-[9.5px] text-slate-500 line-clamp-2 leading-tight">
                          Full admin with all 7 module permissions.
                        </p>
                      </button>
                    )}

                    {/* Employee HR */}
                    <button
                      type="button"
                      onClick={() =>
                        setEditFormData({
                          ...editFormData,
                          role: "EMPLOYEE_HR",
                          hrType: "EMPLOYEE_HR",
                        })
                      }
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                        editFormData.role === "EMPLOYEE_HR" || (editFormData.role === "HR" && editFormData.hrType !== "VENDOR_HR")
                          ? "bg-purple-50 border-purple-500 ring-2 ring-purple-500/20 text-purple-900"
                          : "bg-white border-slate-200 hover:bg-slate-50 text-slate-700"
                      }`}
                    >
                      <div className="flex items-center gap-1 font-bold text-xs mb-1">
                        <Users size={13} className="text-purple-600" />
                        <span>Employee HR</span>
                      </div>
                      <p className="text-[9.5px] text-slate-500 line-clamp-2 leading-tight">
                        Workforce directory, attendance & leaves only.
                      </p>
                    </button>

                    {/* Vendor HR */}
                    <button
                      type="button"
                      onClick={() =>
                        setEditFormData({
                          ...editFormData,
                          role: "VENDOR_HR",
                          hrType: "VENDOR_HR",
                        })
                      }
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                        editFormData.role === "VENDOR_HR" || (editFormData.role === "HR" && editFormData.hrType === "VENDOR_HR")
                          ? "bg-cyan-50 border-cyan-500 ring-2 ring-cyan-500/20 text-cyan-900"
                          : "bg-white border-slate-200 hover:bg-slate-50 text-slate-700"
                      }`}
                    >
                      <div className="flex items-center gap-1 font-bold text-xs mb-1">
                        <Briefcase size={13} className="text-cyan-600" />
                        <span>Vendor HR</span>
                      </div>
                      <p className="text-[9.5px] text-slate-500 line-clamp-2 leading-tight">
                        Agency recruitment HR. Fixed role scope.
                      </p>
                    </button>
                  </div>
                </div>

                {/* If Vendor HR, show Vendor Assignment checklist */}
                {(editFormData.role === "VENDOR_HR" || editFormData.hrType === "VENDOR_HR") && (
                  <div className="p-3 rounded-xl bg-cyan-50/80 border border-cyan-200 space-y-2">
                    <div className="flex items-start gap-1.5">
                      <Info size={14} className="text-cyan-700 shrink-0 mt-0.5" />
                      <p className="text-[11px] text-cyan-900 font-medium leading-relaxed">
                        <strong>Fixed Role:</strong> Permissions are pre-assigned and restricted to candidates belonging to the selected vendor agencies.
                      </p>
                    </div>

                    <div>
                      <label className="block text-slate-800 font-bold mb-1 text-[11px]">
                        Assign Recruitment Agencies *
                      </label>
                      <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar bg-white rounded-lg border border-slate-200 p-2">
                        {availableVendors.length === 0 ? (
                          <div className="text-[11px] text-slate-400 italic">No vendors found.</div>
                        ) : (
                          availableVendors.map((vnd) => {
                            const vId = vnd.vendorId || vnd.id;
                            const isChecked = (editFormData.assignedVendors || []).includes(vId);
                            return (
                              <label
                                key={vId}
                                className={`flex items-center gap-2 p-1.5 rounded-md hover:bg-slate-50 text-slate-800 cursor-pointer text-xs border ${
                                  isChecked ? "bg-cyan-50/50 border-cyan-300" : "border-transparent"
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={(e) => {
                                    const curr = editFormData.assignedVendors || [];
                                    if (e.target.checked) {
                                      setEditFormData({ ...editFormData, assignedVendors: [...curr, vId] });
                                    } else {
                                      setEditFormData({
                                        ...editFormData,
                                        assignedVendors: curr.filter((id) => id !== vId),
                                      });
                                    }
                                  }}
                                  className="rounded text-cyan-600"
                                />
                                <div className="min-w-0 flex-1">
                                  <div className="font-bold text-slate-900 truncate">
                                    {vnd.companyName}
                                  </div>
                                  <span className="text-[9.5px] text-slate-500 font-mono">ID: {vId}</span>
                                </div>
                              </label>
                            );
                          })
                        )}
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={editFormData.name}
                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={editFormData.email}
                    onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs"
                  />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={editFormData.isActive}
                    onChange={(e) => setEditFormData({ ...editFormData, isActive: e.target.checked })}
                    className="rounded text-blue-600 w-3.5 h-3.5"
                  />
                  <label htmlFor="isActive" className="text-slate-700 font-semibold cursor-pointer">
                    Account is Active
                  </label>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2.5 border-t">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="px-3 py-1.5 rounded-lg text-slate-600 hover:bg-slate-100 font-semibold cursor-pointer text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold cursor-pointer text-xs shadow-xs"
                  >
                    {saving ? "Saving..." : "Update Details"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: CONFIRM SAVE PERMISSIONS */}
        {isConfirmSaveOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-2xs">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 max-w-sm w-full shadow-2xl space-y-3 animate-in fade-in zoom-in-95">
              <div className="flex items-center gap-2 text-blue-600">
                <ShieldCheck size={20} />
                <h3 className="font-bold text-slate-900 text-sm">Confirm Permission Update</h3>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                You are updating access rights for{" "}
                <strong className="text-slate-900">{selectedAdminData?.name}</strong>.
              </p>

              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1 text-xs">
                <div className="text-emerald-700 font-medium">
                  + {changesDiff.added.length} newly granted capabilities
                </div>
                <div className="text-rose-700 font-medium">
                  - {changesDiff.removed.length} revoked capabilities
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setIsConfirmSaveOpen(false)}
                  className="px-3 py-1.5 rounded-lg text-slate-600 hover:bg-slate-100 font-semibold cursor-pointer text-xs"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveChanges}
                  disabled={saving}
                  className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold cursor-pointer text-xs"
                >
                  {saving ? "Saving..." : "Confirm & Apply"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL: DELETE CONFIRMATION */}
        {adminToDelete && (
          <DeleteConfirmModal
            isOpen={Boolean(adminToDelete)}
            onClose={() => setAdminToDelete(null)}
            onConfirm={handleDeleteAdmin}
            title={`Delete ${adminToDelete?.name}`}
            message={`Are you sure you want to permanently delete the account for ${adminToDelete?.name} (${adminToDelete?.email})? This action cannot be reversed.`}
            loading={deletingAdmin}
          />
        )}
      </div>
    </AdminMasterLayout>
  );
}

export default PermissionManagementPage;
