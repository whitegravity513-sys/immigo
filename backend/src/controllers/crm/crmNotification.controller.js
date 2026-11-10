import mongoose from "mongoose";
import CrmNotification from "../../models/CrmNotification.js";
import NotificationService, { resolveActorInfo } from "../../services/notification.service.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

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
          { recipientRole: { $in: ["SUPER_ADMIN", "ADMIN", "ALL"] } },
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
          { recipientRole: { $in: ["VENDOR_HR", "ADMIN", "ALL"] } },
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
  const { role, vendorId, userId, assignedVendors } = req.query;
  const rUpper = String(role || "").toUpperCase();
  if (rUpper === "EMPLOYEE_HR") {
    return res.status(200).json({ success: true, notifications: [] });
  }

  const filter = buildCrmNotifFilter({ role, vendorId, userId, assignedVendors });
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
  const notifData = req.body;
  const notifId = notifData.id || notifData.notificationId || `notif-${Date.now()}-${Math.floor(Math.random() * 100)}`;
  const reqActor = req.user ? resolveActorInfo(req.user) : { actorId: null, actorRole: null };
  const actorId = notifData.actorId ? String(notifData.actorId) : reqActor.actorId;
  const actorRole = notifData.actorRole || reqActor.actorRole;

  const created = await CrmNotification.create({
    ...notifData,
    actorId,
    actorRole,
    notificationId: notifId,
  });

  if (notifData.recipientRole === "ADMIN" || notifData.recipientRole === "ALL") {
    try {
      if (actorRole === "ADMIN" || actorRole === "SUPER_ADMIN" || actorRole === "VENDOR_HR") {
        await NotificationService.notifyStaffAction({
          actor: { id: actorId, role: actorRole },
          type: notifData.type || "SYSTEM",
          title: notifData.title || "Vendor Update",
          message: notifData.message,
          moduleScope: "VENDOR",
          targetVendorId: notifData.vendorId || null,
          metadata: { vendorId: notifData.vendorId || null, link: notifData.link || "" },
        });
      } else {
        await NotificationService.createNotification({
          type: notifData.type || "SYSTEM",
          title: notifData.title || "Vendor Update",
          message: notifData.message,
          targetRole: "ADMIN",
          targetRoles: ["SUPER_ADMIN", "ADMIN", "VENDOR_HR"],
          targetType: "ALL",
          targetVendorId: notifData.vendorId ? String(notifData.vendorId) : null,
          actorId,
          actorRole,
          moduleScope: "VENDOR",
          metadata: { vendorId: notifData.vendorId || null, link: notifData.link || "" },
        });
      }
    } catch {}
  }

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
  await CrmNotification.updateMany({ $or: conds }, { $set: { read: true } });
  return res.status(200).json({ success: true });
});

export const markAllNotificationsRead = asyncHandler(async (req, res) => {
  const { role, vendorId, userId, assignedVendors } = req.query;
  if (String(role || "").toUpperCase() === "EMPLOYEE_HR") {
    return res.status(200).json({ success: true });
  }
  const filter = buildCrmNotifFilter({ role, vendorId, userId, assignedVendors });
  await CrmNotification.updateMany(filter, { $set: { read: true } });
  return res.status(200).json({ success: true });
});

export const deleteNotification = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const isMongoId = Boolean(id && /^[0-9a-fA-F]{24}$/.test(id));
  const conds = [{ notificationId: id }, { id: id }];
  if (isMongoId) conds.push({ _id: id });
  await CrmNotification.deleteMany({ $or: conds });

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
      await Notification.deleteMany({ $or: notifConds });
    }
  } catch {}

  return res.status(200).json({ success: true, message: "Notification deleted successfully" });
});

export const clearAllNotifications = asyncHandler(async (req, res) => {
  const { role, vendorId, userId, assignedVendors } = req.query;
  if (String(role || "").toUpperCase() === "EMPLOYEE_HR") {
    return res.status(200).json({ success: true, message: "Notifications cleared successfully" });
  }
  const filter = buildCrmNotifFilter({ role, vendorId, userId, assignedVendors });
  await CrmNotification.deleteMany(filter);
  return res.status(200).json({ success: true, message: "Notifications cleared successfully" });
});
