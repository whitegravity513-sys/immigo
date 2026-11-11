import appConfig from "../config/appConfig.js";

const VALID_EMP_VIEWS = new Set([
  "home",
  "tracker",
  "calendar",
  "checkinout",
  "breaks",
  "leaves",
  "apply-leave",
  "leave-history",
  "announcements",
  "profile-docs",
  "profile",
  "expenses",
  "meetings",
]);

const VALID_CANDIDATE_TABS = new Set([
  "overview",
  "profile",
  "documents",
  "jobs",
  "applications",
  "processing",
]);

function normalizeRawLink(
  rawLink,
  { isVendor, isEmployee, isCandidate, isVendorHr, isEmployeeHr, portalBase, candidateId, vendorId }
) {
  if (!rawLink || typeof rawLink !== "string") return "";
  let link = rawLink.trim();
  if (!link) return "";

  if (link === "/admin/vendors/submissions") {
    link = "/admin/vendor/submissions";
  } else if (link.startsWith("/admin/vendors/submissions?")) {
    link = link.replace("/admin/vendors/submissions", "/admin/vendor/submissions");
  }

  if (link === "/vendor/candidates/selected") {
    link = "/vendor/selected";
  }

  if (link === "/admin/vendor/candidates" && candidateId) {
    link = `/admin/vendor/candidates?candidateId=${encodeURIComponent(candidateId)}`;
  }

  if (link === "/admin/vendor/vendors" && vendorId) {
    link = `/admin/vendor/vendors?vendorId=${encodeURIComponent(vendorId)}`;
  }

  if (appConfig.FEATURE_FLAGS?.HIDE_CANDIDATE_MODULE && link.startsWith("/admin/candidates/milestones-manage")) {
    link = link.replace("/admin/candidates/milestones-manage", "/admin/vendor/milestones-manage");
  }

  if (isVendor) {
    if (!link.startsWith("/vendor/") && !link.startsWith("/invoice/")) return "";
    if (link === "/vendor/dashboard") return "";
    return link;
  }

  if (isEmployee) {
    if (!link.startsWith("/employee/")) return "";
    if (link === "/employee/dashboard") return "";
    return link;
  }

  if (isCandidate) {
    if (!link.startsWith("/candidate/") && !link.startsWith("/invoice/")) return "";
    if (link === "/candidate/dashboard") return "";
    return link;
  }

  if (isVendorHr) {
    if (link === "/admin/vendor/refunds") return "/vendor-hr/dashboard?view=refunds";
    if (link === "/admin/meetings" || link === "/hr/meetings" || link.startsWith("/hr/meetings")) {
      return "/vendor-hr/dashboard?view=meetings";
    }
    if (link.startsWith("/vendor-hr/") || link.startsWith("/hr/vendor-dashboard")) {
      return link;
    }
    return "";
  }

  if (isEmployeeHr) {
    if (link === "/admin/meetings") return "/hr/meetings";
    if (link.startsWith("/admin/dashboard/")) {
      return link.replace("/admin/dashboard", portalBase || "/hr/dashboard");
    }
    if (link.startsWith("/hr/")) return link;
    return "";
  }

  if (link.startsWith("/vendor/") || link.startsWith("/employee/") || link.startsWith("/candidate/")) {
    return "";
  }

  return link;
}

export function resolveNotificationLink(notification, roleContext = {}) {
  const n = notification || {};
  const roleUpper = String(roleContext.role || "").toUpperCase();
  const isVendor = Boolean(roleContext.isVendor || roleUpper === "VENDOR");
  const isEmployee = Boolean(roleContext.isEmployee || roleUpper === "EMPLOYEE");
  const isCandidate = Boolean(roleContext.isCandidate || roleUpper === "CANDIDATE");
  const isVendorHr = roleUpper === "VENDOR_HR";
  const isEmployeeHr = roleUpper === "EMPLOYEE_HR" || roleUpper === "HR";
  const portalBase = roleContext.portalBase || (isEmployeeHr || isVendorHr ? "/hr/dashboard" : "/admin/dashboard");

  const typeUpper = String(n.type || "").toUpperCase();
  const scopeUpper = String(n.moduleScope || "").toUpperCase();
  const meta = n.metadata || {};
  const text = `${typeUpper} ${scopeUpper} ${n.title || ""} ${n.message || ""}`.toLowerCase();

  const vendorId = String(n.vendorId || n.targetVendorId || meta.vendorCode || meta.vendorId || "").trim();
  const candidateId = String(n.candidateId || meta.candidateId || "").trim();
  const appId = String(n.applicationId || meta.applicationId || meta.appId || "").trim();
  const empId = String(n.employeeId || n.employeeCode || meta.employeeId || meta.empId || "").trim();
  const projectId = String(n.projectId || meta.projectId || "").trim();

  const rawLink = String(n.link || n.metadata?.link || "").trim();
  const safeRawLink = normalizeRawLink(rawLink, {
    isVendor,
    isEmployee,
    isCandidate,
    isVendorHr,
    isEmployeeHr,
    portalBase,
    candidateId,
    vendorId,
  });

  if (safeRawLink) {
    return safeRawLink;
  }

  if (isVendor) {
    if (text.includes("mou") || text.includes("memorandum") || text.includes("signature") || text.includes("signed copy")) {
      return "/vendor/documents?openMou=1";
    }
    if (text.includes("document") || text.includes("compliance") || text.includes("credential") || text.includes("kyc")) {
      return "/vendor/documents?tab=company";
    }
    if (scopeUpper === "MEETING" || typeUpper.startsWith("MEETING") || text.includes("meeting") || text.includes("conference")) {
      return "/vendor/meetings";
    }
    if (text.includes("refund")) {
      return "/vendor/refunds";
    }
    if (text.includes("payment") || text.includes("invoice") || text.includes("receipt") || text.includes("disbursement")) {
      return appId ? `/vendor/payments/${encodeURIComponent(appId)}` : "/vendor/payments";
    }
    if (text.includes("milestone") || text.includes("visa") || text.includes("processing")) {
      return appId ? `/vendor/processing/${encodeURIComponent(appId)}` : "/vendor/processing";
    }
    if (text.includes("selected")) {
      return "/vendor/selected";
    }
    if (text.includes("rejected")) {
      return "/vendor/rejected";
    }
    if (text.includes("project") && !text.includes("candidate")) {
      return projectId ? `/vendor/projects/${encodeURIComponent(projectId)}` : "/vendor/projects";
    }
    if (candidateId) {
      return `/vendor/candidates/${encodeURIComponent(candidateId)}`;
    }
    if (text.includes("submission") || text.includes("application") || text.includes("shortlist") || text.includes("interview")) {
      return "/vendor/applications";
    }
    if (text.includes("candidate")) {
      return "/vendor/candidates";
    }
    return "/vendor/dashboard";
  }

  if (isEmployee) {
    if (scopeUpper === "MEETING" || typeUpper.startsWith("MEETING") || text.includes("meeting") || text.includes("interview")) {
      return "/employee/dashboard?view=meetings";
    }
    if (typeUpper.includes("LEAVE") || text.includes("leave")) {
      return "/employee/dashboard?view=leaves";
    }
    if (typeUpper.includes("EXPENSE") || text.includes("expense") || text.includes("reimbursement")) {
      return "/employee/dashboard?view=expenses";
    }
    if (typeUpper.includes("DOCUMENT") || text.includes("document") || text.includes("kyc") || text.includes("profile")) {
      return "/employee/dashboard?view=profile-docs";
    }
    if (typeUpper.includes("ANNOUNCEMENT") || typeUpper.includes("HOLIDAY") || text.includes("announcement") || text.includes("holiday")) {
      return "/employee/dashboard?view=announcements";
    }
    if (typeUpper.includes("ATTENDANCE") || text.includes("attendance") || text.includes("check-in") || text.includes("checkout")) {
      return "/employee/dashboard?view=calendar";
    }
    return "/employee/dashboard";
  }

  if (isCandidate) {
    if (typeUpper.includes("MEETING") || text.includes("interview") || text.includes("application") || text.includes("shortlist") || text.includes("rejected")) {
      return "/candidate/dashboard?tab=applications";
    }
    if (text.includes("milestone") || text.includes("payment") || text.includes("fee") || text.includes("selected") || text.includes("receipt") || text.includes("visa")) {
      return "/candidate/dashboard?tab=processing";
    }
    if (text.includes("document") || text.includes("verification") || text.includes("re-upload") || text.includes("passport")) {
      return "/candidate/dashboard?tab=documents";
    }
    if (text.includes("job") || text.includes("project") || text.includes("opening")) {
      return "/candidate/dashboard?tab=jobs";
    }
    if (text.includes("profile")) {
      return "/candidate/dashboard?tab=profile";
    }
    return "/candidate/dashboard";
  }

  if (isVendorHr) {
    if (scopeUpper === "MEETING" || typeUpper.startsWith("MEETING") || text.includes("meeting")) {
      return "/vendor-hr/dashboard?view=meetings";
    }
    if (text.includes("refund")) {
      return "/vendor-hr/dashboard?view=refunds";
    }
    if (text.includes("selected") || text.includes("visa") || text.includes("milestone")) {
      return "/vendor-hr/dashboard?view=milestones";
    }
    if (text.includes("interview")) {
      return "/vendor-hr/dashboard?view=interviews";
    }
    if (text.includes("shortlist")) {
      return "/vendor-hr/dashboard?view=shortlisted";
    }
    if (text.includes("rejected")) {
      return "/vendor-hr/dashboard?view=rejected";
    }
    if (text.includes("project") || text.includes("assigned")) {
      return "/vendor-hr/dashboard?view=projects";
    }
    if (text.includes("candidate") || text.includes("submission") || text.includes("vendor")) {
      return "/vendor-hr/dashboard?view=candidates";
    }
    return "/vendor-hr/dashboard";
  }

  if (isEmployeeHr) {
    if (scopeUpper === "MEETING" || typeUpper.startsWith("MEETING") || text.includes("meeting")) {
      return "/hr/meetings";
    }
    if ((typeUpper === "DOCUMENT_UPLOAD" || typeUpper === "DOCUMENT_UPDATE") && empId) {
      return `${portalBase}/employee/${encodeURIComponent(empId)}?tab=documents`;
    }
    if (empId) {
      return `${portalBase}/employee/${encodeURIComponent(empId)}`;
    }
    if (typeUpper.includes("LEAVE") || text.includes("leave")) {
      return `${portalBase}/leaves`;
    }
    if (typeUpper.includes("EXPENSE") || text.includes("expense")) {
      return `${portalBase}/expenses`;
    }
    if (typeUpper.includes("ANNOUNCEMENT") || typeUpper.includes("HOLIDAY") || text.includes("announcement") || text.includes("holiday")) {
      return `${portalBase}/announcements`;
    }
    if (typeUpper.includes("ATTENDANCE") || text.includes("attendance")) {
      return `${portalBase}/attendance-all`;
    }
    return portalBase;
  }

  if (scopeUpper === "MEETING" || typeUpper.startsWith("MEETING") || text.includes("meeting")) {
    return "/admin/meetings";
  }
  if (typeUpper === "VENDOR_REGISTERED" || text.includes("new vendor") || text.includes("vendor registration")) {
    return vendorId
      ? `/admin/vendor/vendors?vendorId=${encodeURIComponent(vendorId)}`
      : "/admin/vendor/vendors?tab=registered";
  }
  if (text.includes("mou") && !text.includes("candidate")) {
    return vendorId
      ? `/admin/vendor/vendors?vendorId=${encodeURIComponent(vendorId)}&view=mou`
      : "/admin/vendor/vendors?tab=mou";
  }
  if ((typeUpper === "DOCUMENT_UPLOAD" || typeUpper === "DOCUMENT_UPDATE" || text.includes("compliance document")) && vendorId && !candidateId && !empId) {
    return `/admin/vendor/vendors?vendorId=${encodeURIComponent(vendorId)}&view=docs`;
  }
  if (text.includes("refund")) {
    return "/admin/vendor/refunds";
  }
  if (text.includes("payment") || text.includes("payout") || text.includes("receipt") || text.includes("invoice")) {
    return appId ? `/admin/vendor/payments/${encodeURIComponent(appId)}` : "/admin/vendor/payments";
  }
  if (text.includes("milestone") || appId) {
    return appId ? `/admin/vendor/milestones-manage?appId=${encodeURIComponent(appId)}` : "/admin/vendor/milestones";
  }
  if (text.includes("submission")) {
    return "/admin/vendor/submissions";
  }
  if (text.includes("selected")) {
    return "/admin/vendor/selected";
  }
  if (text.includes("rejected")) {
    return "/admin/vendor/rejected";
  }
  if (candidateId) {
    return `/admin/vendor/candidates?candidateId=${encodeURIComponent(candidateId)}`;
  }
  if (text.includes("candidate")) {
    return "/admin/vendor/candidates";
  }
  if (vendorId) {
    return `/admin/vendor/vendors?vendorId=${encodeURIComponent(vendorId)}`;
  }
  if ((typeUpper === "DOCUMENT_UPLOAD" || typeUpper === "DOCUMENT_UPDATE") && empId) {
    return `${portalBase}/employee/${encodeURIComponent(empId)}?tab=documents`;
  }
  if (empId) {
    return `${portalBase}/employee/${encodeURIComponent(empId)}`;
  }
  if (typeUpper.includes("LEAVE") || text.includes("leave")) {
    return `${portalBase}/leaves`;
  }
  if (typeUpper.includes("EXPENSE") || text.includes("expense")) {
    return `${portalBase}/expenses`;
  }
  if (typeUpper.includes("ANNOUNCEMENT") || typeUpper.includes("HOLIDAY") || text.includes("announcement") || text.includes("holiday")) {
    return `${portalBase}/announcements`;
  }
  if (text.includes("permission") || text.includes("role") || text.includes("staff account")) {
    return "/admin/permissions";
  }
  if (projectId || (text.includes("project") && !text.includes("vendor"))) {
    return projectId ? `/projects/${encodeURIComponent(projectId)}` : "/projects";
  }

  return "/admin/vendor/vendors";
}

export function extractEmployeeViewFromLink(link) {
  if (!link || typeof link !== "string") return "";
  try {
    const qIdx = link.indexOf("?");
    if (qIdx === -1) return "";
    const params = new URLSearchParams(link.slice(qIdx + 1));
    const v = params.get("view") || params.get("tab") || "";
    return VALID_EMP_VIEWS.has(v) ? v : "";
  } catch {
    return "";
  }
}

export function extractCandidateTabFromLink(link) {
  if (!link || typeof link !== "string") return "";
  try {
    const qIdx = link.indexOf("?");
    if (qIdx === -1) return "";
    const params = new URLSearchParams(link.slice(qIdx + 1));
    const t = params.get("tab") || "";
    return VALID_CANDIDATE_TABS.has(t) ? t : "";
  } catch {
    return "";
  }
}
