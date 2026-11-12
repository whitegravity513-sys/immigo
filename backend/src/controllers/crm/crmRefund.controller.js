import mongoose from "mongoose";
import CrmRefund from "../../models/CrmRefund.js";
import CrmCandidateApplication from "../../models/CrmCandidateApplication.js";
import CandidateApplication from "../../models/CandidateApplication.js";
import CrmNotification from "../../models/CrmNotification.js";
import Vendor from "../../models/Vendor.js";
import NotificationService, { resolveActorInfo } from "../../services/notification.service.js";
import { emitRealtimeEvent } from "../../services/realtime.service.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { fetchAllMergedProjects, resolveProjectMilestonesData } from "../../utils/projectResolver.js";
import { ACTIVE_REFUND_LOCK_STATUSES } from "../../utils/refundLock.js";
import { resolveVendorHrScope } from "../../utils/vendorHrScope.js";

const isHexObjectId = (val) => typeof val === "string" && /^[0-9a-fA-F]{24}$/.test(val.trim());

const buildIdQuery = (fieldNames, idVal) => {
  const s = String(idVal || "").trim();
  if (!s) return null;
  const or = fieldNames.map((f) => ({ [f]: s }));
  if (isHexObjectId(s)) {
    or.push({ _id: new mongoose.Types.ObjectId(s) });
  }
  return { $or: or };
};

const computePaidFromMilestones = (milestones = []) =>
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

const findMatchingApplication = async ({ applicationId, candidateId, projectName }) => {
  if (applicationId) {
    const q = buildIdQuery(["applicationId", "id"], applicationId);
    if (q) {
      const crm = await CrmCandidateApplication.findOne(q).lean();
      if (crm) return crm;
      const direct = await CandidateApplication.findOne(q).lean();
      if (direct) return direct;
    }
  }
  if (candidateId) {
    const filter = { candidateId: String(candidateId) };
    if (projectName) filter.projectName = String(projectName);
    const crm = await CrmCandidateApplication.findOne(filter).sort({ updatedAt: -1 }).lean();
    if (crm) return crm;
    const direct = await CandidateApplication.findOne(filter).sort({ updatedAt: -1 }).lean();
    if (direct) return direct;
  }
  return null;
};

const resolvePaidAmountForApplication = (app, mergedProjects = []) => {
  if (!app) return 0;
  const projectObj = (mergedProjects || []).find(
    (p) =>
      (app.projectId &&
        ((Array.isArray(p.rawIdCandidates) && p.rawIdCandidates.includes(String(app.projectId))) ||
          String(p.projectId || p.id || "") === String(app.projectId))) ||
      (app.projectName &&
        p.projectName &&
        String(p.projectName).trim().toLowerCase() === String(app.projectName).trim().toLowerCase())
  );

  const rawMilestones =
    Array.isArray(app.processMilestones) && app.processMilestones.length > 0
      ? app.processMilestones
      : Array.isArray(app.paymentPlan?.milestones)
      ? app.paymentPlan.milestones
      : [];

  let milestones = rawMilestones;
  if (projectObj) {
    const resolved = resolveProjectMilestonesData(
      projectObj,
      rawMilestones,
      Boolean(app.milestonesOverridden)
    );
    if (Array.isArray(resolved?.processMilestones) && resolved.processMilestones.length > 0) {
      milestones = resolved.processMilestones;
    }
  }

  const paidSum = computePaidFromMilestones(milestones);
  if (paidSum > 0) return paidSum;
  return Number(app.totalPaid || app.paidAmount || 0);
};

const mirrorRefundOntoApplication = async ({
  applicationId,
  candidateId,
  refundStatus,
  refundAmount,
  refundReason,
  refundDate,
  remarks,
  paymentRef,
  markDidNotJoin = false,
  didNotJoinReason = "",
}) => {
  const refundDetails = {
    amount: Number(refundAmount) || 0,
    status: refundStatus,
    reason: refundReason || "",
    date: refundDate || new Date().toISOString().split("T")[0],
    remarks: remarks || "",
    paymentRef: paymentRef || "",
  };

  const setFields = {
    refundStatus,
    refundDetails,
    updatedAt: new Date(),
  };

  if (markDidNotJoin) {
    setFields.status = "Did Not Join";
    setFields.didNotJoinReason = didNotJoinReason || refundReason || "";
  }

  const q = applicationId
    ? buildIdQuery(["applicationId", "id"], applicationId)
    : candidateId
    ? { candidateId: String(candidateId) }
    : null;

  if (!q) return;
  await Promise.allSettled([
    CrmCandidateApplication.updateMany(q, { $set: setFields }),
    CandidateApplication.updateMany(q, { $set: setFields }),
  ]);
};

const resolveVendorIdentifiers = async (vendorId) => {
  const s = String(vendorId || "").trim();
  if (!s) return [];
  const ids = new Set([s]);
  try {
    const q = buildIdQuery(["vendorId"], s);
    if (q) {
      const v = await Vendor.findOne(q).select("vendorId _id").lean();
      if (v?.vendorId) ids.add(String(v.vendorId));
      if (v?._id) ids.add(v._id.toString());
    }
  } catch {}
  return Array.from(ids);
};

export const getRefunds = asyncHandler(async (req, res) => {
  const { vendorId } = req.query;
  const scope = await resolveVendorHrScope(req.user);
  const filter = {};
  let appFilter = {};
  if (req.isVendor) {
    const vendorIds = await resolveVendorIdentifiers(req.vendorId || req.userId);
    const vMatch = vendorIds.length > 1 ? { $in: vendorIds } : vendorIds[0] || "";
    filter.vendorId = vMatch;
    appFilter = { vendorId: vMatch };
  } else if (scope.isVendorHR) {
    if (vendorId && !scope.expandedVendorIds.includes(String(vendorId))) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: You are not assigned to this vendor.",
      });
    }
    if (vendorId) {
      const vendorIds = await resolveVendorIdentifiers(vendorId);
      const vMatch = vendorIds.length > 1 ? { $in: vendorIds } : String(vendorId);
      filter.vendorId = vMatch;
      appFilter = { vendorId: vMatch };
    } else {
      const scopeOr = [
        ...(scope.expandedVendorIds.length > 0
          ? [{ vendorId: { $in: scope.expandedVendorIds } }]
          : []),
        ...(scope.assignedProjectIds.length > 0
          ? [{ projectId: { $in: scope.assignedProjectIds } }]
          : []),
      ];
      if (scopeOr.length === 0) {
        filter._id = null;
        appFilter._id = null;
      } else {
        filter.$or = scopeOr;
        appFilter = { $or: scopeOr };
      }
    }
  } else if (vendorId) {
    const vendorIds = await resolveVendorIdentifiers(vendorId);
    const vMatch = vendorIds.length > 1 ? { $in: vendorIds } : String(vendorId);
    filter.vendorId = vMatch;
    appFilter = { vendorId: vMatch };
  }

  const [refunds, crmApps, directApps, mergedProjects] = await Promise.all([
    CrmRefund.find(filter).sort({ createdAt: -1 }).lean(),
    CrmCandidateApplication.find(appFilter).lean(),
    CandidateApplication.find(appFilter).lean(),
    fetchAllMergedProjects().catch(() => []),
  ]);

  const allApps = [...(crmApps || []), ...(directApps || [])];

  const formatted = (refunds || []).map((r) => {
    const matchedApp = allApps.find(
      (a) =>
        (r.applicationId &&
          (String(a.applicationId || "") === String(r.applicationId) ||
            String(a._id || "") === String(r.applicationId) ||
            String(a.id || "") === String(r.applicationId))) ||
        (r.candidateId &&
          String(a.candidateId || "") === String(r.candidateId) &&
          (!r.projectName ||
            String(a.projectName || "").trim().toLowerCase() ===
              String(r.projectName || "").trim().toLowerCase()))
    );

    const appMatchesRefundProject =
      !r.reassigned &&
      Boolean(matchedApp) &&
      (!r.projectId ||
        !matchedApp.projectId ||
        String(r.projectId) === String(matchedApp.projectId)) &&
      (!r.projectName ||
        !matchedApp.projectName ||
        String(r.projectName).trim().toLowerCase() ===
          String(matchedApp.projectName).trim().toLowerCase());

    const computedPaid =
      appMatchesRefundProject && matchedApp
        ? resolvePaidAmountForApplication(matchedApp, mergedProjects)
        : 0;
    const finalTotalPaid = computedPaid > 0 ? computedPaid : Number(r.totalPaid || 0);
    let finalRefundAmt = Number(r.refundAmount || 0);
    if (
      finalRefundAmt === 0 &&
      finalTotalPaid > 0 &&
      r.refundStatus !== "Rejected" &&
      r.refundStatus !== "No Refund"
    ) {
      finalRefundAmt = finalTotalPaid;
    }

    return {
      ...r,
      id: r.refundId || r._id.toString(),
      _id: r._id ? r._id.toString() : "",
      vendorName: r.vendorName || matchedApp?.vendorName || "Vendor Partner",
      clientName: r.clientName || (appMatchesRefundProject ? matchedApp?.clientName : "") || "",
      projectName: r.projectName || (appMatchesRefundProject ? matchedApp?.projectName : "") || "Overseas Project",
      position: r.position || (appMatchesRefundProject ? matchedApp?.position : "") || "",
      totalPaid: finalTotalPaid,
      refundAmount: finalRefundAmt,
      reassigned: Boolean(r.reassigned),
      reassignedProjectId: r.reassignedProjectId || "",
      reassignedProjectName: r.reassignedProjectName || "",
      reassignedPosition: r.reassignedPosition || "",
      reassignedAt: r.reassignedAt || null,
      appProjectMismatch: Boolean(matchedApp && !appMatchesRefundProject),
      appStatus: appMatchesRefundProject ? matchedApp?.status || "" : "",
      isLocked: ACTIVE_REFUND_LOCK_STATUSES.has(String(r.refundStatus || "").trim()),
    };
  });

  return res.status(200).json({ success: true, refunds: formatted });
});

export const createRefund = asyncHandler(async (req, res) => {
  const body = req.body || {};
  const applicationId = String(body.applicationId || "").trim();
  const candidateId = String(body.candidateId || "").trim();
  const candidateName = String(body.candidateName || "Candidate").trim();
  const reason = String(body.reason || body.refundReason || "").trim();
  const requestedBy = req.isVendor ? "Vendor" : String(body.requestedBy || "Vendor").trim();
  const markDidNotJoin = req.isVendor ? false : Boolean(body.markDidNotJoin);

  if (!applicationId) {
    return res.status(400).json({ success: false, message: "Application ID is required." });
  }
  if (!reason) {
    return res.status(400).json({ success: false, message: "Refund reason is required." });
  }

  const [matchedApp, mergedProjects] = await Promise.all([
    findMatchingApplication({
      applicationId,
      candidateId,
      projectName: body.projectName,
    }),
    fetchAllMergedProjects().catch(() => []),
  ]);

  if (req.isVendor) {
    if (!matchedApp) {
      return res.status(404).json({
        success: false,
        message: "Candidate application not found.",
      });
    }
    const allowedVendorIds = new Set(await resolveVendorIdentifiers(req.vendorId || req.userId));
    if (req.vendorId) allowedVendorIds.add(String(req.vendorId));
    if (req.userId) allowedVendorIds.add(String(req.userId));
    if (!matchedApp.vendorId || !allowedVendorIds.has(String(matchedApp.vendorId).trim())) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: You cannot raise a refund for another vendor's candidate application.",
      });
    }
  }

  const appIdCandidates = Array.from(
    new Set(
      [applicationId, matchedApp?.applicationId, matchedApp?.id]
        .map((v) => String(v || "").trim())
        .filter(Boolean)
    )
  );

  const existingActive = await CrmRefund.findOne({
    applicationId: appIdCandidates.length > 1 ? { $in: appIdCandidates } : applicationId,
    reassigned: { $ne: true },
    refundStatus: { $nin: ["Rejected", "No Refund"] },
  }).lean();

  if (existingActive && !markDidNotJoin) {
    return res.status(400).json({
      success: false,
      message: "An active refund request already exists for this candidate application.",
    });
  }

  const resolvedPaid = matchedApp ? resolvePaidAmountForApplication(matchedApp, mergedProjects) : 0;
  const totalPaid =
    req.isVendor && matchedApp
      ? resolvedPaid
      : Number(body.totalPaid) > 0
      ? Number(body.totalPaid)
      : resolvedPaid > 0
      ? resolvedPaid
      : 0;

  const refundStatus = req.isVendor
    ? "Pending Admin Approval"
    : body.refundStatus ||
      (requestedBy === "Admin"
        ? totalPaid > 0
          ? "Refund Pending"
          : "No Refund"
        : "Pending Admin Approval");

  const refundAmount = req.isVendor
    ? totalPaid
    : body.refundAmount !== undefined && body.refundAmount !== null && !Number.isNaN(Number(body.refundAmount))
    ? Number(body.refundAmount)
    : totalPaid;

  const vendorId = req.isVendor
    ? String(req.vendorId || matchedApp?.vendorId || req.userId || "").trim()
    : String(body.vendorId || matchedApp?.vendorId || "").trim();
  const vendorName = req.isVendor
    ? String(req.vendorName || matchedApp?.vendorName || body.vendorName || "Vendor Partner").trim()
    : String(body.vendorName || matchedApp?.vendorName || "Vendor Partner").trim();
  const projectId = String(body.projectId || matchedApp?.projectId || "").trim();
  const projectName = String(body.projectName || matchedApp?.projectName || "Overseas Project").trim();
  const clientName = String(body.clientName || matchedApp?.clientName || "").trim();
  const position = String(body.position || matchedApp?.position || "").trim();
  const refundDate = body.refundDate || new Date().toISOString().split("T")[0];
  const refundId = body.refundId || body.id || `RFD-${Date.now().toString().slice(-6)}`;

  const created = await CrmRefund.create({
    refundId,
    applicationId: matchedApp?.applicationId || applicationId,
    candidateId: candidateId || matchedApp?.candidateId || "",
    candidateName: candidateName || matchedApp?.candidateName || "Candidate",
    vendorId,
    vendorName,
    projectId,
    projectName,
    clientName,
    position,
    totalPaid,
    refundAmount,
    refundReason: reason,
    refundDocument: String(body.documentPath || body.refundDocument || ""),
    refundDocumentData: String(body.documentData || body.refundDocumentData || ""),
    refundStatus,
    refundDate,
    paymentRef: req.isVendor ? "" : String(body.paymentRef || ""),
    remarks: String(body.remarks || ""),
    requestedBy: req.isVendor ? "Vendor" : requestedBy,
    processedBy: req.isVendor ? "" : String(body.processedBy || ""),
  });

  await mirrorRefundOntoApplication({
    applicationId: created.applicationId,
    candidateId: created.candidateId,
    refundStatus,
    refundAmount,
    refundReason: reason,
    refundDate,
    remarks: body.remarks || "",
    paymentRef: body.paymentRef || "",
    markDidNotJoin,
    didNotJoinReason: body.didNotJoinReason || reason,
  });

  let createdNotificationId = null;
  let createdSaNotificationId = null;
  let createdVhrNotificationId = null;
  try {
    const actorMeta = req.user
      ? resolveActorInfo(req.user)
      : { actorId: vendorId || null, actorRole: requestedBy === "Admin" ? "ADMIN" : "VENDOR" };

    if (requestedBy !== "Admin") {
      const rand = Math.floor(Math.random() * 1000);
      const ts = Date.now();
      createdNotificationId = `notif-rfd-adm-${ts}-${rand}`;
      createdSaNotificationId = `notif-rfd-sa-${ts}-${rand}`;
      createdVhrNotificationId = `notif-rfd-vhr-${ts}-${rand}`;
      const msgText = `${vendorName} submitted a refund request for ${created.candidateName} (${projectName}) — Paid ₹${Number(totalPaid).toLocaleString()}. Reason: ${reason}`;

      const results = await Promise.allSettled([
        CrmNotification.create({
          notificationId: createdNotificationId,
          recipientRole: "ADMIN",
          actorId: vendorId || actorMeta.actorId || null,
          actorRole: "VENDOR",
          vendorId: vendorId || null,
          candidateId: created.candidateId || null,
          applicationId: created.applicationId,
          title: "New Refund Request",
          message: msgText,
          type: "warning",
          link: "/admin/vendor/refunds",
          metadata: {
            notificationId: createdNotificationId,
            refundId,
            applicationId: created.applicationId,
            candidateId: created.candidateId || null,
            vendorId: vendorId || null,
            link: "/admin/vendor/refunds",
            splitForSuperAdmin: true,
            splitForRoles: true,
          },
        }),
        CrmNotification.create({
          notificationId: createdSaNotificationId,
          recipientRole: "SUPER_ADMIN",
          actorId: vendorId || actorMeta.actorId || null,
          actorRole: "VENDOR",
          vendorId: vendorId || null,
          candidateId: created.candidateId || null,
          applicationId: created.applicationId,
          title: "New Refund Request",
          message: msgText,
          type: "warning",
          link: "/admin/vendor/refunds",
          metadata: {
            notificationId: createdSaNotificationId,
            refundId,
            applicationId: created.applicationId,
            candidateId: created.candidateId || null,
            vendorId: vendorId || null,
            link: "/admin/vendor/refunds",
            splitForRoles: true,
          },
        }),
        CrmNotification.create({
          notificationId: createdVhrNotificationId,
          recipientRole: "VENDOR_HR",
          actorId: vendorId || actorMeta.actorId || null,
          actorRole: "VENDOR",
          vendorId: vendorId || null,
          candidateId: created.candidateId || null,
          applicationId: created.applicationId,
          title: "New Refund Request",
          message: `${vendorName} raised a refund request for ${created.candidateName} — Paid ₹${Number(totalPaid).toLocaleString()}. Payment & processing locked until Admin review.`,
          type: "warning",
          link: "/vendor-hr/dashboard?view=refunds",
          metadata: {
            notificationId: createdVhrNotificationId,
            refundId,
            applicationId: created.applicationId,
            candidateId: created.candidateId || null,
            vendorId: vendorId || null,
            link: "/vendor-hr/dashboard?view=refunds",
            splitForRoles: true,
          },
        }),
        NotificationService.createNotification({
          type: "PAYMENT_PENDING",
          title: "New Refund Request",
          message: msgText,
          targetRole: "ADMIN",
          targetRoles: ["ADMIN"],
          targetType: "ALL",
          targetVendorId: vendorId || null,
          actorId: vendorId || actorMeta.actorId || null,
          actorRole: "VENDOR",
          moduleScope: "VENDOR",
          metadata: {
            notificationId: createdNotificationId,
            refundId,
            applicationId: created.applicationId,
            candidateId: created.candidateId || null,
            vendorId: vendorId || null,
            link: "/admin/vendor/refunds",
            splitForRoles: true,
          },
        }),
        NotificationService.createNotification({
          type: "PAYMENT_PENDING",
          title: "New Refund Request",
          message: msgText,
          targetRole: "SUPER_ADMIN",
          targetRoles: ["SUPER_ADMIN"],
          targetType: "ALL",
          targetVendorId: vendorId || null,
          actorId: vendorId || actorMeta.actorId || null,
          actorRole: "VENDOR",
          moduleScope: "VENDOR",
          metadata: {
            notificationId: createdSaNotificationId,
            refundId,
            applicationId: created.applicationId,
            candidateId: created.candidateId || null,
            vendorId: vendorId || null,
            link: "/admin/vendor/refunds",
            splitForRoles: true,
          },
        }),
        NotificationService.createNotification({
          type: "PAYMENT_PENDING",
          title: "New Refund Request",
          message: `${vendorName} raised a refund request for ${created.candidateName} — Paid ₹${Number(totalPaid).toLocaleString()}. Payment & processing locked until Admin review.`,
          targetRole: "VENDOR_HR",
          targetRoles: ["VENDOR_HR"],
          targetType: "ALL",
          targetVendorId: vendorId || null,
          actorId: vendorId || actorMeta.actorId || null,
          actorRole: "VENDOR",
          moduleScope: "VENDOR",
          metadata: {
            notificationId: createdVhrNotificationId,
            refundId,
            applicationId: created.applicationId,
            candidateId: created.candidateId || null,
            vendorId: vendorId || null,
            link: "/vendor-hr/dashboard?view=refunds",
            splitForRoles: true,
          },
        }),
      ]);

      results.forEach((r) => {
        if (r.status === "rejected") {
          console.warn("Refund notification dispatch warning:", r.reason?.message || r.reason);
        }
      });
    } else if (vendorId) {
      const ts = Date.now();
      const rand = Math.floor(Math.random() * 100);
      createdNotificationId = `notif-vrfd-${ts}-${rand}`;
      createdVhrNotificationId = `notif-vhr-rfd-${ts}-${rand}`;
      await Promise.allSettled([
        CrmNotification.create({
          notificationId: createdNotificationId,
          recipientRole: "VENDOR",
          actorId: actorMeta.actorId || null,
          actorRole: actorMeta.actorRole || "ADMIN",
          vendorId,
          candidateId: created.candidateId || null,
          applicationId: created.applicationId,
          title: "Refund Record Initiated",
          message: `Admin initiated a refund record (${refundStatus}) for ${created.candidateName} (${projectName}).`,
          type: "info",
          link: "/vendor/refunds",
          metadata: { splitForRoles: true, refundId, link: "/vendor/refunds" },
        }),
        CrmNotification.create({
          notificationId: createdVhrNotificationId,
          recipientRole: "VENDOR_HR",
          actorId: actorMeta.actorId || null,
          actorRole: actorMeta.actorRole || "ADMIN",
          vendorId,
          candidateId: created.candidateId || null,
          applicationId: created.applicationId,
          title: "Refund Record Initiated",
          message: `Refund record (${refundStatus}) initiated for ${created.candidateName} (${vendorName}).`,
          type: "info",
          link: "/vendor-hr/dashboard?view=refunds",
          metadata: { splitForRoles: true, refundId, link: "/vendor-hr/dashboard?view=refunds" },
        }),
      ]);
    }
  } catch (notifErr) {
    console.warn("Refund notification dispatch error:", notifErr?.message || notifErr);
  }

  emitRealtimeEvent({
    events: [
      "immigo:refund-update",
      "immigo:application-update",
      "immigo:dashboard-update",
      "immigo:vendor-hr-refresh",
      "immigo:notification-update",
      "immigo:admin-notification",
      "immigo:vendor-notification",
    ],
    roles: ["SUPER_ADMIN", "ADMIN", "VENDOR_HR", "VENDOR"],
    vendorId: created.vendorId || null,
    detail: { refundId: created.refundId, applicationId: created.applicationId },
  });

  return res.status(201).json({
    success: true,
    refund: { ...created.toObject(), id: created.refundId || created._id.toString() },
    notificationId: createdNotificationId,
    saNotificationId: createdSaNotificationId,
    vhrNotificationId: createdVhrNotificationId,
  });
});

const ALLOWED_REFUND_STATUSES = new Set([
  "Pending Admin Approval",
  "Refund Pending",
  "Partially Refunded",
  "Fully Refunded",
  "No Refund",
  "Rejected",
]);

export const updateRefund = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const body = req.body || {};

  if (
    body.refundStatus !== undefined &&
    !ALLOWED_REFUND_STATUSES.has(String(body.refundStatus || "").trim())
  ) {
    return res.status(400).json({
      success: false,
      message: "Invalid refund status value.",
    });
  }
  if (
    body.refundAmount !== undefined &&
    body.refundAmount !== null &&
    (Number.isNaN(Number(body.refundAmount)) || Number(body.refundAmount) < 0)
  ) {
    return res.status(400).json({
      success: false,
      message: "Refund amount cannot be negative.",
    });
  }
  if (
    body.totalPaid !== undefined &&
    body.totalPaid !== null &&
    (Number.isNaN(Number(body.totalPaid)) || Number(body.totalPaid) < 0)
  ) {
    return res.status(400).json({
      success: false,
      message: "Total paid amount cannot be negative.",
    });
  }

  const query = buildIdQuery(["refundId", "id"], id);
  if (!query) {
    return res.status(400).json({ success: false, message: "Invalid refund identifier." });
  }

  const doc = await CrmRefund.findOne(query);
  if (!doc) {
    return res.status(404).json({ success: false, message: "Refund record not found." });
  }

  const prevStatus = doc.refundStatus;
  const prevAmount = Number(doc.refundAmount || 0);
  const prevRef = String(doc.paymentRef || "");
  if (body.refundStatus !== undefined) doc.refundStatus = body.refundStatus;
  if (body.paymentRef !== undefined) doc.paymentRef = body.paymentRef;
  if (body.refundReason !== undefined) doc.refundReason = body.refundReason;
  if (body.remarks !== undefined) doc.remarks = body.remarks;
  if (body.processedBy !== undefined) doc.processedBy = body.processedBy;
  if (body.refundAmount !== undefined && body.refundAmount !== null && !Number.isNaN(Number(body.refundAmount))) {
    doc.refundAmount = Number(body.refundAmount);
  }
  if (body.totalPaid !== undefined && body.totalPaid !== null && !Number.isNaN(Number(body.totalPaid)) && Number(body.totalPaid) >= 0) {
    doc.totalPaid = Number(body.totalPaid);
  }
  doc.refundDate = body.refundDate || new Date().toISOString().split("T")[0];
  await doc.save();

  await mirrorRefundOntoApplication({
    applicationId: doc.applicationId,
    candidateId: doc.candidateId,
    refundStatus: doc.refundStatus,
    refundAmount: doc.refundAmount,
    refundReason: doc.refundReason,
    refundDate: doc.refundDate,
    remarks: doc.remarks,
    paymentRef: doc.paymentRef,
  });

  const statusChanged = Boolean(doc.refundStatus && doc.refundStatus !== prevStatus);
  const refChanged = Boolean(doc.paymentRef && String(doc.paymentRef) !== prevRef);
  const amountChanged = Number(doc.refundAmount || 0) !== prevAmount;

  if (doc.vendorId && (statusChanged || refChanged || amountChanged)) {
    try {
      const actorMeta = req.user
        ? resolveActorInfo(req.user)
        : { actorId: null, actorRole: "ADMIN" };
      const statusType =
        doc.refundStatus === "Rejected"
          ? "error"
          : doc.refundStatus === "Fully Refunded" || doc.refundStatus === "Partially Refunded"
          ? "success"
          : "info";

      const showAmount =
        doc.refundStatus !== "Rejected" &&
        doc.refundStatus !== "No Refund" &&
        Number(doc.refundAmount) > 0;
      const amtText = showAmount ? ` (₹${Number(doc.refundAmount).toLocaleString()})` : "";
      const refText =
        doc.refundStatus !== "Rejected" && doc.paymentRef
          ? ` • Payment Ref: ${doc.paymentRef}`
          : "";
      const ts = Date.now();
      const rand = Math.floor(Math.random() * 100);
      const updMsg = `Refund claim for ${doc.candidateName} (${doc.projectName || "Project"}) is now ${doc.refundStatus}${amtText}${refText}.`;

      await Promise.allSettled([
        CrmNotification.create({
          notificationId: `notif-rfd-upd-${ts}-${rand}`,
          recipientRole: "VENDOR",
          actorId: actorMeta.actorId || null,
          actorRole: actorMeta.actorRole || "ADMIN",
          vendorId: String(doc.vendorId),
          candidateId: doc.candidateId || null,
          applicationId: doc.applicationId,
          title: `Refund Status: ${doc.refundStatus}`,
          message: updMsg,
          type: statusType,
          link: "/vendor/refunds",
          metadata: { splitForRoles: true, refundId: doc.refundId || doc._id.toString(), link: "/vendor/refunds" },
        }),
        CrmNotification.create({
          notificationId: `notif-vhr-rfd-upd-${ts}-${rand}`,
          recipientRole: "VENDOR_HR",
          actorId: actorMeta.actorId || null,
          actorRole: actorMeta.actorRole || "ADMIN",
          vendorId: String(doc.vendorId),
          candidateId: doc.candidateId || null,
          applicationId: doc.applicationId,
          title: `Refund Status: ${doc.refundStatus}`,
          message: `Refund claim for ${doc.candidateName} (${doc.vendorName || "Vendor"}) is now ${doc.refundStatus}${amtText}${refText}.`,
          type: statusType,
          link: "/vendor-hr/dashboard?view=refunds",
          metadata: { splitForRoles: true, refundId: doc.refundId || doc._id.toString(), link: "/vendor-hr/dashboard?view=refunds" },
        }),
        NotificationService.createNotification({
          type: "PAYMENT_APPROVED",
          title: `Refund Status: ${doc.refundStatus}`,
          message: `Refund claim for ${doc.candidateName} (${doc.vendorName || "Vendor"}) is now ${doc.refundStatus}${amtText}${refText}.`,
          targetRole: "VENDOR_HR",
          targetRoles: ["VENDOR_HR"],
          targetType: "ALL",
          targetVendorId: String(doc.vendorId),
          actorId: actorMeta.actorId || null,
          actorRole: actorMeta.actorRole || "ADMIN",
          moduleScope: "VENDOR",
          metadata: {
            refundId: doc.refundId || doc._id.toString(),
            applicationId: doc.applicationId,
            candidateId: doc.candidateId || null,
            vendorId: String(doc.vendorId),
            link: "/vendor-hr/dashboard?view=refunds",
            splitForRoles: true,
          },
        }),
      ]);
    } catch (notifErr) {
      console.warn("Vendor refund update notification error:", notifErr?.message || notifErr);
    }
  }

  emitRealtimeEvent({
    events: [
      "immigo:refund-update",
      "immigo:application-update",
      "immigo:dashboard-update",
      "immigo:vendor-hr-refresh",
      "immigo:notification-update",
      "immigo:admin-notification",
      "immigo:vendor-notification",
    ],
    roles: ["SUPER_ADMIN", "ADMIN", "VENDOR_HR", "VENDOR"],
    vendorId: doc.vendorId ? String(doc.vendorId) : null,
    detail: { refundId: doc.refundId || doc._id.toString(), applicationId: doc.applicationId },
  });

  return res.status(200).json({
    success: true,
    refund: { ...doc.toObject(), id: doc.refundId || doc._id.toString() },
  });
});

