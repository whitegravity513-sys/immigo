
export const PERMISSION_ACTIONS = {
  VIEW: "view",
  CREATE: "create",
  UPDATE: "update",
  DELETE: "delete",
  EXPORT: "export",
  APPROVE: "approve",
};

export const MODULES = [
  {
    id: "employees",
    name: "Employees & Workforce",
    category: "Operations",
    description: "Manage employee directory, profiles, onboarding documents, and designations.",
    actions: ["view", "create", "update", "delete", "export"],
  },
  {
    id: "candidates",
    name: "Candidates & Recruitment",
    category: "Recruitment",
    description: "Job applications, applicant screening, document verification, and milestone tracking.",
    actions: ["view", "create", "update", "delete", "export", "approve"],
  },
  {
    id: "vendors",
    name: "Vendors & Partners",
    category: "External",
    description: "Recruitment vendors, MOU contracts, candidate submissions, and commission ledgers.",
    actions: ["view", "create", "update", "delete", "export", "approve"],
  },
  {
    id: "clients",
    name: "Overseas Clients",
    category: "CRM",
    description: "Overseas employer companies, international contracts, and business contacts.",
    actions: ["view", "create", "update", "delete", "export"],
  },
  {
    id: "projects",
    name: "Client Projects",
    category: "CRM",
    description: "Manpower recruitment projects, demand letters, and deployment timelines.",
    actions: ["view", "create", "update", "delete", "export"],
  },
  {
    id: "attendance",
    name: "Attendance Management",
    category: "HR Operations",
    description: "Employee daily check-ins, biometric logs, manual attendance adjustments, and turnout.",
    actions: ["view", "create", "update", "delete", "export"],
  },
  {
    id: "leaves",
    name: "Leave Administration",
    category: "HR Operations",
    description: "Employee leave requests, approvals, rejections, and annual leave balances.",
    actions: ["view", "create", "update", "delete", "export", "approve"],
  },
  {
    id: "meetings",
    name: "Meetings & Interviews",
    category: "Operations",
    description: "Calendar appointments, applicant interviews, client meetings, and conferencing.",
    actions: ["view", "create", "update", "delete", "export"],
  },
  {
    id: "finance",
    name: "Finance & Invoicing",
    category: "Finance",
    description: "Client payment receipts, billing invoices, vendor disbursements, and expense records.",
    actions: ["view", "create", "update", "delete", "export"],
  },
  {
    id: "reports",
    name: "Analytics & Reports",
    category: "Management",
    description: "Workforce turnout reports, monthly analytics, hiring pipelines, and audit summaries.",
    actions: ["view", "export"],
  },
  {
    id: "permissions",
    name: "Permission & Admin Management",
    category: "Security",
    description: "Admin account creation, role assignments, dynamic permission matrix, and access security.",
    actions: ["view", "create", "update", "delete"],
  },
  {
    id: "settings",
    name: "System Settings",
    category: "Administration",
    description: "Enterprise settings, company profile, audit logs, and security policies.",
    actions: ["view", "update"],
  },
];

export const ALL_PERMISSIONS = MODULES.flatMap((mod) =>
  mod.actions.map((act) => `${mod.id}.${act}`)
);

export const ROLE_DEFAULT_PERMISSIONS = {
  SUPER_ADMIN: ["*"],

  ADMIN: [
    "employees.view",
    "employees.create",
    "employees.update",
    "employees.export",
    "candidates.view",
    "candidates.create",
    "candidates.update",
    "candidates.export",
    "candidates.approve",
    "vendors.view",
    "vendors.create",
    "vendors.update",
    "vendors.export",
    "clients.view",
    "clients.create",
    "clients.update",
    "clients.export",
    "projects.view",
    "projects.create",
    "projects.update",
    "projects.export",
    "attendance.view",
    "attendance.create",
    "attendance.update",
    "attendance.export",
    "leaves.view",
    "leaves.create",
    "leaves.update",
    "leaves.approve",
    "leaves.export",
    "meetings.view",
    "meetings.create",
    "meetings.update",
    "meetings.delete",
    "meetings.export",
    "finance.view",
    "finance.export",
    "reports.view",
    "reports.export",
    "settings.view",
  ],

  HR: [
    "employees.view",
    "employees.create",
    "employees.update",
    "employees.export",
    "attendance.view",
    "attendance.create",
    "attendance.update",
    "attendance.export",
    "leaves.view",
    "leaves.create",
    "leaves.update",
    "leaves.approve",
    "leaves.export",
    "candidates.view",
    "candidates.update",
    "meetings.view",
    "meetings.create",
    "meetings.update",
    "reports.view",
    "reports.export",
  ],

  EMPLOYEE: [
    "attendance.view",
    "leaves.view",
    "leaves.create",
    "meetings.view",
  ],

  USER: [],
};

export const isValidPermission = (permKey) => {
  if (permKey === "*") return true;
  return ALL_PERMISSIONS.includes(permKey);
};

export default {
  MODULES,
  ALL_PERMISSIONS,
  PERMISSION_ACTIONS,
  ROLE_DEFAULT_PERMISSIONS,
  isValidPermission,
};
