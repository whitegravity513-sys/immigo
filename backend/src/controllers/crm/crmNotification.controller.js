import mongoose from "mongoose";
import CrmNotification from "../../models/CrmNotification.js";
import NotificationService, { resolveActorInfo } from "../../services/notification.service.js";
import { emitRealtimeEvent } from "../../services/realtime.service.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

const resolveScopedNotifParams = (req, query = {}) => {
  if (req.isVendor) {
    return {
      role: "VENDOR",
      vendorId: req.vendorId || req.userId,
      userId: req.userId || req.vendorId,
      assignedVendors: [],
    };
  }
  const userRole = String(req.userRole || req.user?.role || "").toUpperCase();
  if (req.isSuperAdmin || userRole === "SUPER_ADMIN") {
    return {
      role: query.role || "SUPER_ADMIN",
      vendorId: query.vendorId || null,
      userId: req.userId || query.userId || null,
      assignedVendors: query.assignedVendors || [],
    };
  }
  if (userRole === "HR") {
    const derivedHrRole = req.hrType === "VENDOR_HR" ? "VENDOR_HR" : "EMPLOYEE_HR";
    return {
      role: derivedHrRole,
      vendorId: query.vendorId || null,
      userId: req.userId || null,
      assignedVendors: req.assignedVendors || [],
    };
  }
  if (userRole === "ADMIN") {
    return {
      role: query.role && String(query.role).toUpperCase() !== "SUPER_ADMIN" ? query.role : "ADMIN",
      vendorId: query.vendorId || null,
      userId: req.userId || query.userId || null,
      assignedVendors: query.assignedVendors || [],
    };
  }
  return {
    role: userRole,
    vendorId: null,
    userId: req.userId || null,
    assignedVendors: [],
  };
};

const getVendorAllowedSet = (req) =>
  Array.from(new Set([req.vendorId, req.userId].filter(Boolean).map((v) => String(v).trim())));

const buildCrmNotifFilter = ({ role, vendorId, userId, assignedVendors }) => {
  const filter = {};
  const andConditions = [];

  if (userId) {
    andConditions.push({ actorId: { $ne: String(userId) } });
  }

  if (role) {
    const r = String(role).toUpperCase();
    if (r === "SUPER_ADMIN") {
      andConditions.push({
        $or: [
          { recipientRole: { $in: ["SUPER_ADMIN", "ALL"] } },
          { recipientRole: "ADMIN", "metadata.splitForSuperAdmin": { $ne: true } },
          { recipientRole: { $exists: false } },
          { recipientRole: null },
        ],
      });
    } else if (r === "ADMIN") {
      andConditions.push({ actorRole: { $ne: "ADMIN" } });
      andConditions.push({
        $or: [
          { recipientRole: { $in: ["ADMIN", "ALL"] } },
          { recipientRole: { $exists: false } },
          { recipientRole: null },
        ],
      });
    } else if (r === "VENDOR_HR") {
      const vList = Array.isArray(assignedVendors)
        ? assignedVendors.map((v) => String(v))
        : typeof assignedVendors === "string" && assignedVendors
        ? assignedVendors.split(",").map((v) => v.trim()).filter(Boolean)
        : [];
      andConditions.push({
        $or: [
          { recipientRole: "VENDOR_HR" },
          { recipientRole: "ALL", "metadata.splitForRoles": { $ne: true } },
          { recipientRole: "ADMIN", "metadata.splitForRoles": { $ne: true } },
          { recipientRole: { $exists: false } },
          { recipientRole: null },
        ],
      });
      if (vList.length > 0) {
        andConditions.push({ vendorId: { $in: vList } });
      } else {
        andConditions.push({ recipientRole: "VENDOR_HR" });
      }
    } else if (r === "VENDOR") {
      const roleConditions = [
        { recipientRole: { $in: ["VENDOR", "ALL"] } },
        { recipientRole: { $exists: false } },
        { recipientRole: null },
      ];
      andConditions.push({ $or: roleConditions });
      if (vendorId) {
        andConditions.push({
          $or: [
            { vendorId: String(vendorId) },
            { vendorId: null },
            { vendorId: { $exists: false } },
            { recipientRole: "ALL" },
          ],
        });
      }
    }
  }

  if (andConditions.length > 0) {
    filter.$and = andConditions;
  }
  return filter;
};

export const getNotifications = asyncHandler(async (req, res) => {
  const scoped = resolveScopedNotifParams(req, req.query);
  const rUpper = String(scoped.role || "").toUpperCase();
  if (rUpper === "EMPLOYEE_HR") {
    return res.status(200).json({ success: true, notifications: [] });
  }

  const filter = buildCrmNotifFilter(scoped);
  const notifs = await CrmNotification.find(filter).sort({ createdAt: -1 }).limit(100).lean();
  const formatted = (notifs || []).map((n) => ({
    ...n,
    id: n.notificationId || (n._id ? n._id.toString() : ""),
    _id: n._id ? n._id.toString() : "",
    timestamp: n.createdAt || new Date().toISOString(),
    createdAt: n.createdAt || new Date().toISOString(),
    read: Boolean(n.read),
  }));

  return res.status(200).json({ success: true, notifications: formatted });
});

export const createNotification = asyncHandler(async (req, res) => {
  const notifData = { ...(req.body || {}) };
  delete notifData._id;
  delete notifData.__v;
  const title = String(notifData.title || "System Notification").trim();
  const message = String(notifData.message || "").trim();
  if (!message) {
    return res.status(400).json({ success: false, message: "Notification message is required." });
  }
  const notifId = notifData.id || notifData.notificationId || `notif-${Date.now()}-${Math.floor(Math.random() * 100)}`;
  const reqActor = req.user ? resolveActorInfo(req.user) : { actorId: null, actorRole: null };
  const actorId = reqActor.actorId ? String(reqActor.actorId) : notifData.actorId ? String(notifData.actorId) : null;
  const actorRole = reqActor.actorRole || (req.isVendor ? "VENDOR" : notifData.actorRole) || null;
  const effectiveVendorId = req.isVendor ? (req.vendorId || req.userId) : notifData.vendorId;
  const allowedVendorRecipients = new Set(["ADMIN", "SUPER_ADMIN", "VENDOR_HR", "VENDOR"]);
  const recipientRole = req.isVendor
    ? (allowedVendorRecipients.has(String(notifData.recipientRole || "").toUpperCase())
        ? String(notifData.recipientRole).toUpperCase()
        : "VENDOR")
    : notifData.recipientRole || "ALL";

  const created = await CrmNotification.create({
    ...notifData,
    title,
    message,
    recipientRole,
    vendorId: effectiveVendorId || null,
    actorId,
    actorRole,
    notificationId: notifId,
  });

  if (recipientRole === "ADMIN" || recipientRole === "ALL") {
    try {
      if (actorRole === "ADMIN" || actorRole === "SUPER_ADMIN" || actorRole === "VENDOR_HR") {
        await NotificationService.notifyStaffAction({
          actor: { id: actorId, role: actorRole },
          type: notifData.type || "SYSTEM",
          title: notifData.title || "Vendor Update",
          message: notifData.message,
          moduleScope: "VENDOR",
          targetVendorId: effectiveVendorId || null,
          metadata: { vendorId: effectiveVendorId || null, link: notifData.link || "" },
        });
      } else {
        await NotificationService.createNotification({
          type: notifData.type || "SYSTEM",
          title: notifData.title || "Vendor Update",
          message: notifData.message,
          targetRole: "ADMIN",
          targetRoles: ["SUPER_ADMIN", "ADMIN", "VENDOR_HR"],
          targetType: "ALL",
          targetVendorId: effectiveVendorId ? String(effectiveVendorId) : null,
          actorId,
          actorRole,
          moduleScope: "VENDOR",
          metadata: { vendorId: effectiveVendorId || null, link: notifData.link || "" },
        });
      }
    } catch {}
  }

  emitRealtimeEvent({
    events: [
      "immigo:notification-update",
      "immigo:admin-notification",
      "immigo:vendor-notification",
    ],
    roles: ["SUPER_ADMIN", "ADMIN", "VENDOR_HR", "VENDOR", "CANDIDATE"],
    vendorId: effectiveVendorId ? String(effectiveVendorId) : null,
    candidateId: notifData.candidateId ? String(notifData.candidateId) : null,
    detail: { notificationId: notifId },
  });

  return res.status(201).json({
    success: true,
    notification: { ...created.toObject(), id: created.notificationId || created._id.toString() },
  });
});

export const markNotificationRead = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const isMongoId = Boolean(id && /^[0-9a-fA-F]{24}$/.test(id));
  const conds = [{ notificationId: id }, { id: id }];
  if (isMongoId) conds.push({ _id: id });
  const query = { $or: conds };
  if (req.isVendor) {
    const allowedVendorIds = getVendorAllowedSet(req);
    query.$and = [
      {
        $or: [
          { vendorId: { $in: allowedVendorIds } },
          { vendorId: null, recipientRole: { $in: ["VENDOR", "ALL"] } },
        ],
      },
    ];
  }
  await CrmNotification.updateMany(query, { $set: { read: true } });
  return res.status(200).json({ success: true });
});

export const markAllNotificationsRead = asyncHandler(async (req, res) => {
  if (req.isVendor) {
    const allowedVendorIds = getVendorAllowedSet(req);
    await CrmNotification.updateMany(
      { recipientRole: "VENDOR", vendorId: { $in: allowedVendorIds } },
      { $set: { read: true } }
    );
    return res.status(200).json({ success: true });
  }
  const scoped = resolveScopedNotifParams(req, req.query);
  if (String(scoped.role || "").toUpperCase() === "EMPLOYEE_HR") {
    return res.status(200).json({ success: true });
  }
  const filter = buildCrmNotifFilter(scoped);
  await CrmNotification.updateMany(filter, { $set: { read: true } });
  return res.status(200).json({ success: true });
});

export const deleteNotification = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const isMongoId = Boolean(id && /^[0-9a-fA-F]{24}$/.test(id));
  const conds = [{ notificationId: id }, { id: id }];
  if (isMongoId) conds.push({ _id: id });
  const crmQuery = { $or: conds };
  if (req.isVendor) {
    const allowedVendorIds = getVendorAllowedSet(req);
    crmQuery.$and = [{ vendorId: { $in: allowedVendorIds } }];
  }
  await CrmNotification.deleteMany(crmQuery);

  try {
    const Notification = mongoose.models.Notification || mongoose.model("Notification");
    if (Notification) {
      const notifConds = [
        { notificationId: id },
        { id: id },
        { "metadata.id": id },
        { "metadata.notificationId": id },
      ];
      if (isMongoId) notifConds.push({ _id: new mongoose.Types.ObjectId(id) });
      const notifQuery = { $or: notifConds };
      if (req.isVendor) {
        const allowedVendorIds = getVendorAllowedSet(req);
        notifQuery.$and = [{ targetVendorId: { $in: allowedVendorIds } }];
      }
      await Notification.deleteMany(notifQuery);
    }
  } catch {}

  return res.status(200).json({ success: true, message: "Notification deleted successfully" });
});

export const clearAllNotifications = asyncHandler(async (req, res) => {
  if (req.isVendor) {
    const allowedVendorIds = getVendorAllowedSet(req);
    await CrmNotification.deleteMany({ vendorId: { $in: allowedVendorIds } });
    return res.status(200).json({ success: true, message: "Notifications cleared successfully" });
  }
  const scoped = resolveScopedNotifParams(req, req.query);
  if (String(scoped.role || "").toUpperCase() === "EMPLOYEE_HR") {
    return res.status(200).json({ success: true, message: "Notifications cleared successfully" });
  }
  const filter = buildCrmNotifFilter(scoped);
  await CrmNotification.deleteMany(filter);
  return res.status(200).json({ success: true, message: "Notifications cleared successfully" });
});
