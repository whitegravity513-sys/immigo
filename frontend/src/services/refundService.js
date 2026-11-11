import { apiClient } from "./apiClient.js";

const REFUNDS_STORAGE_KEY = "immigo_crm_refunds_v3";
const APPLICATIONS_STORAGE_KEY = "immigo_crm_applications_v3";
const PROJECTS_STORAGE_KEY = "immigo_crm_projects_v3";
const ADMIN_NOTIFICATIONS_KEY = "immigo_crm_admin_notifications_v3";
const VENDOR_NOTIFICATIONS_KEY = "immigo_crm_vendor_notifications_v3";

export const ACTIVE_REFUND_LOCK_STATUSES = new Set([
  "Pending Admin Approval",
  "Refund Pending",
  "Partially Refunded",
  "Fully Refunded",
]);

export const REASSIGN_ELIGIBLE_REFUND_STATUSES = new Set([
  "Refund Pending",
  "Partially Refunded",
  "Fully Refunded",
  "No Refund",
]);

export const getAppRefundStatus = (app, refunds = null) => {
  if (!app) return "";
  const direct = String(app.refundStatus || app.refundDetails?.status || "").trim();
  const sourceRefunds = Array.isArray(refunds) ? refunds : loadData(REFUNDS_STORAGE_KEY, []);
  if (Array.isArray(sourceRefunds) && sourceRefunds.length > 0) {
    const appKeys = new Set([app.applicationId, app.id, app._id].filter(Boolean).map(String));
    const appCandId = String(app.candidateId || "").trim();
    const appProjId = String(app.projectId || "").trim();
    const appProj = String(app.projectName || "").trim().toLowerCase();
    const matched = sourceRefunds.find((r) => {
      if (!r || r.reassigned || r.appProjectMismatch) return false;
      const matchesApp = r.applicationId && appKeys.has(String(r.applicationId));
      const matchesCand =
        !matchesApp &&
        appCandId &&
        String(r.candidateId || "").trim() === appCandId &&
        ((appProjId && String(r.projectId || "").trim() === appProjId) ||
          (appProj && String(r.projectName || "").trim().toLowerCase() === appProj));
      if (!matchesApp && !matchesCand) return false;
      if (r.projectId && appProjId && String(r.projectId) !== appProjId) return false;
      if (r.projectName && appProj && String(r.projectName).trim().toLowerCase() !== appProj) return false;
      return true;
    });
    if (matched?.refundStatus) {
      return String(matched.refundStatus).trim();
    }
  }
  return direct;
};

export const isAppRefundLocked = (app, refunds = null) => {
  if (!app) return false;
  if (app.isRefundLocked === true) return true;
  const rStatus = getAppRefundStatus(app, refunds);
  if (!rStatus || rStatus === "Rejected") return false;
  if (ACTIVE_REFUND_LOCK_STATUSES.has(rStatus) || rStatus === "No Refund") return true;
  return true;
};

export const isRefundReassignEligible = (refundRecord) => {
  if (!refundRecord || refundRecord.reassigned || refundRecord.appProjectMismatch) return false;
  return REASSIGN_ELIGIBLE_REFUND_STATUSES.has(String(refundRecord.refundStatus || "").trim());
};


const loadData = (key, fallback = []) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

const saveData = (key, data, { silent = false } = {}) => {
  try {
    const serialized = JSON.stringify(data);
    if (localStorage.getItem(key) !== serialized) {
      localStorage.setItem(key, serialized);
    }
    if (!silent && typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("immigo:refund-update", { detail: data }));
      window.dispatchEvent(new CustomEvent("immigo:dashboard-update", { detail: data }));
    }
  } catch (e) {
    console.warn("Storage write failed:", e?.message || e);
  }
};

const sumPaidMilestones = (milestones = []) =>
  (Array.isArray(milestones) ? milestones : []).reduce((sum, m) => {
    if (
      m?.paymentStatus === "Approved" ||
      m?.paymentStatus === "Paid" ||
      m?.status === "Paid" ||
      m?.status === "Completed"
    ) {
      return sum + (Number(m.paymentAmount ?? m.amount) || 0);
    }
    return sum;
  }, 0);

const findAppInList = (apps, { applicationId, candidateId, candidateName, projectName }) =>
  (apps || []).find(
    (a) =>
      (applicationId &&
        [a.id, a.applicationId, a._id].some((k) => k && String(k) === String(applicationId))) ||
      (candidateId &&
        String(a.candidateId || "") === String(candidateId) &&
        (!projectName ||
          !a.projectName ||
          String(a.projectName).trim().toLowerCase() === String(projectName).trim().toLowerCase())) ||
      (candidateName &&
        a.candidateName &&
        String(a.candidateName).trim().toLowerCase() === String(candidateName).trim().toLowerCase() &&
        (!projectName ||
          !a.projectName ||
          String(a.projectName).trim().toLowerCase() === String(projectName).trim().toLowerCase()))
  );

const computePaidForApp = (app, projects = []) => {
  if (!app) return 0;
  const appMs = app.processMilestones?.length
    ? app.processMilestones
    : app.paymentPlan?.milestones || [];

  const matchedProj = (projects || []).find(
    (p) =>
      (app.projectId &&
        [p.id, p._id, p.projectId].some((k) => k && String(k) === String(app.projectId))) ||
      (app.projectName &&
        [p.projectName, p.title, p.name].some(
          (n) => n && String(n).trim().toLowerCase() === String(app.projectName).trim().toLowerCase()
        ))
  );

  const projMs =
    matchedProj?.paymentMilestones ||
    matchedProj?.paymentMilestoneConfig?.milestones ||
    matchedProj?.recruitmentConfig?.paymentMilestones ||
    [];

  let paidSum = 0;
  if (appMs.length > 0) {
    paidSum = appMs.reduce((sum, m, idx) => {
      const isPaid =
        m?.paymentStatus === "Approved" ||
        m?.paymentStatus === "Paid" ||
        m?.status === "Paid" ||
        m?.status === "Completed";
      if (!isPaid) return sum;
      let amt = Number(m.paymentAmount ?? m.amount ?? 0);
      if (amt <= 0 && !app.milestonesOverridden && projMs[idx]) {
        amt = Number(projMs[idx].paymentAmount ?? projMs[idx].amount ?? 0);
      }
      return sum + amt;
    }, 0);
  }

  if (paidSum > 0) return paidSum;
  return Number(app.totalPaid || app.paidAmount || 0);
};

const enrichRefundRecords = (refundList = [], vendorId = null) => {
  const apps = loadData(APPLICATIONS_STORAGE_KEY, []);
  const candidates = loadData("immigo_crm_candidates_v3", []);
  const vendors = loadData("immigo_crm_vendors_v3", []);
  const projects = loadData(PROJECTS_STORAGE_KEY, []);

  const enriched = (refundList || []).map((r) => {
    const app = findAppInList(apps, {
      applicationId: r.applicationId,
      candidateId: r.candidateId,
      candidateName: r.candidateName,
      projectName: r.projectName,
    });

    const cand = candidates.find(
      (c) =>
        (r.candidateId && String(c.id || c.candidateId) === String(r.candidateId)) ||
        (app?.candidateId && String(c.id || c.candidateId) === String(app.candidateId)) ||
        (c.fullName &&
          r.candidateName &&
          String(c.fullName).trim().toLowerCase() === String(r.candidateName).trim().toLowerCase()) ||
        (c.name &&
          r.candidateName &&
          String(c.name).trim().toLowerCase() === String(r.candidateName).trim().toLowerCase())
    );

    let vendorName = r.vendorName;
    if (!vendorName || vendorName === "Vendor" || vendorName === "Vendor Partner" || !vendorName.trim()) {
      const matchedVendor = vendors.find(
        (v) => String(v.id || v._id) === String(r.vendorId || app?.vendorId || cand?.vendorId || "")
      );
      vendorName =
        cand?.vendorName ||
        app?.vendorName ||
        matchedVendor?.companyName ||
        matchedVendor?.name ||
        "Vendor Partner";
    }

    const appMismatch = Boolean(
      r.reassigned ||
        r.appProjectMismatch ||
        !app ||
        (r.projectId && app.projectId && String(r.projectId) !== String(app.projectId)) ||
        (r.projectName &&
          app.projectName &&
          String(r.projectName).trim().toLowerCase() !== String(app.projectName).trim().toLowerCase())
    );

    let calculatedTotalPaid = !appMismatch ? computePaidForApp(app, projects) : Number(r.totalPaid || 0);

    if (!appMismatch && calculatedTotalPaid === 0 && cand && Array.isArray(cand.applications)) {
      let candPaidSum = 0;
      cand.applications.forEach((ca) => {
        const cMilestones = ca.processMilestones || ca.paymentPlan?.milestones || [];
        candPaidSum += sumPaidMilestones(cMilestones);
      });
      if (candPaidSum > 0) {
        calculatedTotalPaid = candPaidSum;
      }
    }

    if (calculatedTotalPaid === 0 && Number(r.totalPaid) > 0) {
      calculatedTotalPaid = Number(r.totalPaid);
    }

    let refundAmount = Number(r.refundAmount || 0);
    if (
      refundAmount === 0 &&
      calculatedTotalPaid > 0 &&
      r.refundStatus !== "Rejected" &&
      r.refundStatus !== "No Refund"
    ) {
      refundAmount = calculatedTotalPaid;
    }

    return {
      ...r,
      id: r.id || r.refundId || r._id,
      vendorId: r.vendorId || app?.vendorId || cand?.vendorId || "",
      vendorName,
      clientName: r.clientName || app?.clientName || "",
      projectName: r.projectName || app?.projectName || "Overseas Project",
      position: r.position || app?.position || "",
      totalPaid: calculatedTotalPaid,
      refundAmount,
    };
  });

  if (vendorId) {
    return enriched.filter((r) => !r.vendorId || String(r.vendorId) === String(vendorId));
  }
  return enriched;
};

const syncApplicationRefundLocal = ({ applicationId, candidateId, refundDetails, statusUpdate }) => {
  try {
    const apps = loadData(APPLICATIONS_STORAGE_KEY, []);
    const idx = apps.findIndex(
      (a) =>
        (applicationId &&
          [a.id, a.applicationId, a._id].some((k) => k && String(k) === String(applicationId))) ||
        (candidateId && String(a.candidateId || "") === String(candidateId))
    );
    if (idx !== -1) {
      if (statusUpdate) apps[idx].status = statusUpdate;
      apps[idx].refundStatus = refundDetails.status;
      apps[idx].refundDetails = refundDetails;
      localStorage.setItem(APPLICATIONS_STORAGE_KEY, JSON.stringify(apps));
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("immigo:application-update", { detail: apps }));
        window.dispatchEvent(new CustomEvent("immigo:dashboard-update", { detail: apps }));
      }
    }
  } catch (e) {
    console.warn("Local application refund sync skipped:", e?.message || e);
  }
};

const pushLocalVendorRefundNotification = (updatedRecord) => {
  try {
    const vNotifs = loadData(VENDOR_NOTIFICATIONS_KEY, []);
    const showAmt =
      updatedRecord.refundStatus !== "Rejected" &&
      updatedRecord.refundStatus !== "No Refund" &&
      Number(updatedRecord.refundAmount) > 0;
    const amtText = showAmt ? ` (₹${Number(updatedRecord.refundAmount).toLocaleString()})` : "";
    const refText =
      updatedRecord.refundStatus !== "Rejected" && updatedRecord.paymentRef
        ? ` • Ref: ${updatedRecord.paymentRef}`
        : "";
    const vNotif = {
      id: `notif-vrfd-${Date.now()}-${Math.floor(Math.random() * 100)}`,
      recipientRole: "VENDOR",
      vendorId: updatedRecord.vendorId || null,
      candidateId: updatedRecord.candidateId || null,
      title: `Refund Status: ${updatedRecord.refundStatus}`,
      message: `Refund claim for ${updatedRecord.candidateName} is now ${updatedRecord.refundStatus}${amtText}${refText}.`,
      type:
        updatedRecord.refundStatus === "Rejected"
          ? "error"
          : updatedRecord.refundStatus === "Fully Refunded" ||
            updatedRecord.refundStatus === "Partially Refunded"
          ? "success"
          : "info",
      link: "/vendor/refunds",
      read: false,
      timestamp: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };
    vNotifs.unshift(vNotif);
    localStorage.setItem(VENDOR_NOTIFICATIONS_KEY, JSON.stringify(vNotifs));

    const adminNotifs = loadData(ADMIN_NOTIFICATIONS_KEY, []);
    const vhrNotif = {
      id: `notif-vhrfd-${Date.now()}-${Math.floor(Math.random() * 100)}`,
      recipientRole: "VENDOR_HR",
      vendorId: updatedRecord.vendorId || null,
      candidateId: updatedRecord.candidateId || null,
      applicationId: updatedRecord.applicationId || null,
      title: `Refund ${updatedRecord.refundStatus}`,
      message: `Refund claim for ${updatedRecord.candidateName} is now ${updatedRecord.refundStatus}${amtText}${refText}.`,
      type: vNotif.type,
      link: "/vendor-hr/dashboard?view=refunds",
      metadata: {
        link: "/vendor-hr/dashboard?view=refunds",
        splitForRoles: true,
        refundId: updatedRecord.id || updatedRecord._id || "",
        vendorId: updatedRecord.vendorId || "",
      },
      read: false,
      timestamp: vNotif.timestamp,
      createdAt: vNotif.createdAt,
    };
    adminNotifs.unshift(vhrNotif);
    localStorage.setItem(ADMIN_NOTIFICATIONS_KEY, JSON.stringify(adminNotifs));

    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("immigo:notification-update", { detail: vNotifs }));
      window.dispatchEvent(new CustomEvent("immigo:vendor-notification", { detail: vNotif }));
      window.dispatchEvent(new CustomEvent("immigo:admin-notification", { detail: vhrNotif }));
    }
  } catch (e) {
    console.warn("Local vendor notification sync skipped:", e?.message || e);
  }
};

export const refundService = {
  isAppRefundLocked,
  isRefundReassignEligible,
  getAppRefundStatus,
  resolveApplicationPaidAmount: (app) => {
    const projects = loadData(PROJECTS_STORAGE_KEY, []);
    return computePaidForApp(app, projects);
  },

  getAllRefunds: async (vendorId = null) => {
    const localRefunds = loadData(REFUNDS_STORAGE_KEY, []);
    let mergedSource = localRefunds;

    try {
      const url = vendorId
        ? `/crm-sync/refunds?vendorId=${encodeURIComponent(vendorId)}`
        : "/crm-sync/refunds";
      const res = await apiClient.get(url);
      if (res.data?.success && Array.isArray(res.data.refunds)) {
        const serverRefunds = res.data.refunds;
        if (!vendorId) {
          mergedSource = serverRefunds;
          saveData(REFUNDS_STORAGE_KEY, serverRefunds, { silent: true });
        } else {
          const mapById = new Map();
          serverRefunds.forEach((sr) => mapById.set(String(sr.id || sr.refundId || sr._id), sr));
          const otherVendorCached = localRefunds.filter(
            (lr) => lr.vendorId && String(lr.vendorId) !== String(vendorId)
          );
          const combined = [...serverRefunds, ...otherVendorCached];
          saveData(REFUNDS_STORAGE_KEY, combined, { silent: true });
          mergedSource = Array.from(mapById.values());
        }
      }
    } catch (e) {
      console.warn("Using cached refunds:", e?.message || e);
    }

    const enriched = enrichRefundRecords(mergedSource, vendorId);
    if (!vendorId && mergedSource === localRefunds) {
      saveData(REFUNDS_STORAGE_KEY, enriched, { silent: true });
    }
    return enriched;
  },

  markCandidateDidNotJoin: async ({
    applicationId,
    reason,
    refundAmount,
    refundDate,
    remarks,
    processedBy = "Admin",
  }) => {
    const apps = loadData(APPLICATIONS_STORAGE_KEY, []);
    const app = findAppInList(apps, { applicationId });

    const payload = {
      applicationId,
      candidateId: app?.candidateId || "",
      candidateName: app?.candidateName || "Candidate",
      vendorId: app?.vendorId || "",
      vendorName: app?.vendorName || "Vendor Partner",
      projectId: app?.projectId || "",
      projectName: app?.projectName || "Project Requirement",
      clientName: app?.clientName || "",
      position: app?.position || "",
      totalPaid: Number(refundAmount) || 0,
      refundAmount: Number(refundAmount) || 0,
      reason,
      refundDate: refundDate || new Date().toISOString().split("T")[0],
      refundStatus: Number(refundAmount) > 0 ? "Refund Pending" : "No Refund",
      remarks: remarks || "",
      processedBy,
      requestedBy: "Admin",
      markDidNotJoin: true,
      didNotJoinReason: reason,
    };

    let createdRefund = null;
    try {
      const res = await apiClient.post("/crm-sync/refunds", payload);
      if (res.data?.success && res.data.refund) {
        createdRefund = res.data.refund;
      }
    } catch (err) {
      if (err?.response?.status >= 400 && err?.response?.status < 500) {
        throw new Error(err.response?.data?.message || "Failed to initiate refund record.", { cause: err });
      }
    }

    if (!createdRefund) {
      createdRefund = {
        id: `RFD-${Date.now().toString().slice(-6)}`,
        applicationId,
        candidateId: payload.candidateId || "CND-UNKNOWN",
        candidateName: payload.candidateName,
        vendorId: payload.vendorId || "VND-1001",
        vendorName: payload.vendorName,
        projectName: payload.projectName,
        clientName: payload.clientName,
        position: payload.position,
        totalPaid: payload.totalPaid,
        refundAmount: payload.refundAmount,
        refundReason: reason,
        refundStatus: payload.refundStatus,
        refundDate: payload.refundDate,
        processedBy,
        remarks: remarks || "",
      };
    }

    syncApplicationRefundLocal({
      applicationId,
      candidateId: createdRefund.candidateId,
      statusUpdate: "Did Not Join",
      refundDetails: {
        amount: Number(createdRefund.refundAmount) || 0,
        date: createdRefund.refundDate,
        status: createdRefund.refundStatus,
        remarks: remarks || "",
      },
    });

    const refunds = loadData(REFUNDS_STORAGE_KEY, []);
    const existingIdx = refunds.findIndex((r) => String(r.id) === String(createdRefund.id));
    if (existingIdx !== -1) {
      refunds[existingIdx] = createdRefund;
    } else {
      refunds.unshift(createdRefund);
    }
    saveData(REFUNDS_STORAGE_KEY, refunds);

    return createdRefund;
  },

  requestRefund: async ({
    applicationId,
    candidateId,
    candidateName,
    vendorId,
    vendorName,
    projectId = "",
    projectName,
    clientName = "",
    position = "",
    totalPaid: passedTotalPaid = null,
    reason,
    documentPath = "",
    documentData = "",
  }) => {
    const refunds = loadData(REFUNDS_STORAGE_KEY, []);
    const apps = loadData(APPLICATIONS_STORAGE_KEY, []);
    const projects = loadData(PROJECTS_STORAGE_KEY, []);

    const hasActiveLocal = refunds.some(
      (r) =>
        !r.reassigned &&
        !r.appProjectMismatch &&
        String(r.applicationId) === String(applicationId) &&
        r.refundStatus !== "Rejected" &&
        r.refundStatus !== "No Refund"
    );
    if (hasActiveLocal) {
      throw new Error("An active refund request already exists for this candidate application.");
    }

    const app = findAppInList(apps, {
      applicationId,
      candidateId,
      candidateName,
      projectName,
    });

    const calculatedTotalPaid =
      Number(passedTotalPaid) > 0
        ? Number(passedTotalPaid)
        : computePaidForApp(app, projects);

    const resolvedAppId = app?.id || app?.applicationId || applicationId;
    const resolvedCandId = app?.candidateId || candidateId || "";
    const resolvedCandName = candidateName || app?.candidateName || "Candidate";
    const resolvedVendorId = vendorId || app?.vendorId || "";
    const resolvedVendorName = vendorName || app?.vendorName || "Vendor Partner";
    const resolvedProjectName = projectName || app?.projectName || "Overseas Project";
    const resolvedClientName = clientName || app?.clientName || "";
    const resolvedPosition = position || app?.position || "";

    let createdRefund = null;
    let backendNotificationId = null;
    let backendSaNotificationId = null;

    try {
      const res = await apiClient.post("/crm-sync/refunds", {
        applicationId: resolvedAppId,
        candidateId: resolvedCandId,
        candidateName: resolvedCandName,
        vendorId: resolvedVendorId,
        vendorName: resolvedVendorName,
        projectId: projectId || app?.projectId || "",
        projectName: resolvedProjectName,
        clientName: resolvedClientName,
        position: resolvedPosition,
        totalPaid: calculatedTotalPaid,
        reason,
        documentPath,
        documentData,
        requestedBy: "Vendor",
      });
      if (res.data?.success && res.data.refund) {
        createdRefund = res.data.refund;
        backendNotificationId = res.data.notificationId || null;
        backendSaNotificationId = res.data.saNotificationId || null;
      }
    } catch (err) {
      if (err?.response?.status >= 400 && err?.response?.status < 500) {
        throw new Error(err.response?.data?.message || "Failed to submit refund request.", { cause: err });
      }
    }

    if (!createdRefund) {
      createdRefund = {
        id: `RFD-${Date.now().toString().slice(-6)}`,
        applicationId: resolvedAppId,
        candidateId: resolvedCandId,
        candidateName: resolvedCandName,
        vendorId: resolvedVendorId || "VND-1001",
        vendorName: resolvedVendorName,
        projectId: projectId || app?.projectId || "",
        projectName: resolvedProjectName,
        clientName: resolvedClientName,
        position: resolvedPosition,
        totalPaid: calculatedTotalPaid,
        refundAmount: calculatedTotalPaid,
        refundReason: reason,
        refundDocument: documentPath,
        refundDocumentData: documentData,
        refundStatus: "Pending Admin Approval",
        refundDate: new Date().toISOString().split("T")[0],
        requestedBy: "Vendor",
      };
    }

    const existingIdx = refunds.findIndex(
      (r) =>
        String(r.id) === String(createdRefund.id) ||
        (!r.reassigned && !r.appProjectMismatch && String(r.applicationId) === String(createdRefund.applicationId))
    );
    if (existingIdx !== -1) {
      refunds[existingIdx] = { ...refunds[existingIdx], ...createdRefund };
    } else {
      refunds.unshift(createdRefund);
    }
    saveData(REFUNDS_STORAGE_KEY, refunds);

    syncApplicationRefundLocal({
      applicationId: resolvedAppId,
      candidateId: resolvedCandId,
      refundDetails: {
        amount: Number(createdRefund.totalPaid || calculatedTotalPaid),
        status: createdRefund.refundStatus || "Pending Admin Approval",
        reason,
        date: createdRefund.refundDate || new Date().toISOString().split("T")[0],
      },
    });

    try {
      const nowIso = new Date().toISOString();
      const ts = Date.now();
      const admNotifId = backendNotificationId || `notif-rfd-adm-${ts}`;
      const saNotifId = backendSaNotificationId || `notif-rfd-sa-${ts}`;
      const vhrNotifId = `notif-rfd-vhr-${ts}`;
      const msgText = `${resolvedVendorName} submitted a refund request for ${resolvedCandName} (${resolvedProjectName}) — Paid ₹${Number(createdRefund.totalPaid || calculatedTotalPaid).toLocaleString()}. Reason: ${reason}`;
      const adminNotifs = loadData(ADMIN_NOTIFICATIONS_KEY, []);

      const admNotifItem = {
        id: admNotifId,
        notificationId: admNotifId,
        recipientRole: "ADMIN",
        actorId: resolvedVendorId || null,
        actorRole: "VENDOR",
        vendorId: resolvedVendorId || null,
        candidateId: resolvedCandId || null,
        applicationId: resolvedAppId,
        title: "New Refund Request",
        message: msgText,
        type: "warning",
        link: "/admin/vendor/refunds",
        metadata: { notificationId: admNotifId, link: "/admin/vendor/refunds", splitForSuperAdmin: true, splitForRoles: true },
        read: false,
        timestamp: nowIso,
        createdAt: nowIso,
      };
      const saNotifItem = {
        ...admNotifItem,
        id: saNotifId,
        notificationId: saNotifId,
        recipientRole: "SUPER_ADMIN",
        metadata: { notificationId: saNotifId, link: "/admin/vendor/refunds", splitForRoles: true },
      };
      const vhrNotifItem = {
        ...admNotifItem,
        id: vhrNotifId,
        notificationId: vhrNotifId,
        recipientRole: "VENDOR_HR",
        link: "/vendor-hr/dashboard?view=refunds",
        metadata: {
          notificationId: vhrNotifId,
          link: "/vendor-hr/dashboard?view=refunds",
          splitForRoles: true,
          vendorId: resolvedVendorId || "",
        },
      };

      [vhrNotifItem, saNotifItem, admNotifItem].forEach((item) => {
        if (!adminNotifs.some((n) => String(n.id || n.notificationId) === String(item.id))) {
          adminNotifs.unshift(item);
        }
      });
      localStorage.setItem(ADMIN_NOTIFICATIONS_KEY, JSON.stringify(adminNotifs));
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("immigo:admin-notification", { detail: admNotifItem }));
        window.dispatchEvent(new CustomEvent("immigo:notification-update", { detail: adminNotifs }));
      }
    } catch (e) {
      console.warn("Local admin notification sync skipped:", e?.message || e);
    }

    return createdRefund;
  },

  updateRefundStatus: async (
    refundId,
    status,
    paymentRef = "",
    refundAmount = null,
    totalPaid = null,
    remarks = null
  ) => {
    const payload = {
      refundStatus: status,
      refundDate: new Date().toISOString().split("T")[0],
    };
    if (paymentRef !== null && paymentRef !== undefined && paymentRef !== "") {
      payload.paymentRef = paymentRef;
    }
    if (refundAmount !== null && refundAmount !== undefined && !Number.isNaN(Number(refundAmount))) {
      payload.refundAmount = Number(refundAmount);
    }
    if (totalPaid !== null && totalPaid !== undefined && !Number.isNaN(Number(totalPaid)) && Number(totalPaid) >= 0) {
      payload.totalPaid = Number(totalPaid);
    }
    if (remarks !== null && remarks !== undefined) {
      payload.remarks = remarks;
    }

    let updatedRecord = null;
    try {
      const res = await apiClient.put(`/crm-sync/refunds/${encodeURIComponent(refundId)}`, payload);
      if (res.data?.success && res.data.refund) {
        updatedRecord = res.data.refund;
      }
    } catch (e) {
      console.warn("Backend refund status sync fallback:", e?.message || e);
    }

    const refunds = loadData(REFUNDS_STORAGE_KEY, []);
    const idx = refunds.findIndex((r) => String(r.id) === String(refundId) || String(r._id) === String(refundId));
    if (idx === -1 && !updatedRecord) {
      throw new Error("Refund record not found");
    }

    if (idx !== -1) {
      refunds[idx] = {
        ...refunds[idx],
        ...payload,
        ...(updatedRecord || {}),
        updatedAt: new Date().toISOString(),
      };
      updatedRecord = refunds[idx];
    } else if (updatedRecord) {
      refunds.unshift(updatedRecord);
    }
    saveData(REFUNDS_STORAGE_KEY, refunds);

    if (updatedRecord) {
      syncApplicationRefundLocal({
        applicationId: updatedRecord.applicationId,
        candidateId: updatedRecord.candidateId,
        refundDetails: {
          amount: Number(updatedRecord.refundAmount) || 0,
          status: updatedRecord.refundStatus,
          reason: updatedRecord.refundReason || "",
          date: updatedRecord.refundDate,
          paymentRef: updatedRecord.paymentRef || "",
        },
      });
      pushLocalVendorRefundNotification(updatedRecord);
    }

    return updatedRecord;
  },

  updateRefund: async (refundId, updates) => {
    let updatedRecord = null;
    try {
      const res = await apiClient.put(`/crm-sync/refunds/${encodeURIComponent(refundId)}`, updates);
      if (res.data?.success && res.data.refund) {
        updatedRecord = res.data.refund;
      }
    } catch (e) {
      console.warn("Backend refund update sync fallback:", e?.message || e);
    }

    const refunds = loadData(REFUNDS_STORAGE_KEY, []);
    const idx = refunds.findIndex((r) => String(r.id) === String(refundId) || String(r._id) === String(refundId));
    if (idx === -1 && !updatedRecord) {
      throw new Error("Refund record not found");
    }

    if (idx !== -1) {
      refunds[idx] = {
        ...refunds[idx],
        ...updates,
        ...(updatedRecord || {}),
        updatedAt: new Date().toISOString(),
      };
      updatedRecord = refunds[idx];
    } else if (updatedRecord) {
      refunds.unshift(updatedRecord);
    }
    saveData(REFUNDS_STORAGE_KEY, refunds);

    if (updatedRecord) {
      syncApplicationRefundLocal({
        applicationId: updatedRecord.applicationId,
        candidateId: updatedRecord.candidateId,
        refundDetails: {
          amount: Number(updatedRecord.refundAmount) || 0,
          status: updatedRecord.refundStatus,
          reason: updatedRecord.refundReason || "",
          date: updatedRecord.refundDate,
          paymentRef: updatedRecord.paymentRef || "",
        },
      });
      pushLocalVendorRefundNotification(updatedRecord);
    }

    return updatedRecord;
  },
};

export default refundService;
