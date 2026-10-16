import CrmNotification from "../../models/CrmNotification.js";
import Notification from "../../models/Notification.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

export const getNotifications = asyncHandler(async (req, res) => {
  const { role, vendorId } = req.query;
  const filter = {};

  if (role) {
    if (role.toUpperCase() === "ADMIN") {
      filter.$or = [
        { recipientRole: { $in: ["ADMIN", "ALL"] } },
        { recipientRole: { $exists: false } },
        { recipientRole: null },
      ];
    } else if (role.toUpperCase() === "VENDOR") {
      const roleConditions = [
        { recipientRole: { $in: ["VENDOR", "ALL"] } },
        { recipientRole: { $exists: false } },
        { recipientRole: null },
      ];
      if (vendorId) {
        filter.$and = [
          { $or: roleConditions },
          {
            $or: [
              { vendorId: String(vendorId) },
              { vendorId: null },
              { vendorId: { $exists: false } },
              { recipientRole: "ALL" },
            ],
          },
        ];
      } else {
        filter.$or = roleConditions;
      }
    }
  }

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

  const created = await CrmNotification.create({
    ...notifData,
    notificationId: notifId,
  });

  if (notifData.recipientRole === "ADMIN" || notifData.recipientRole === "ALL") {
    try {
      await Notification.create({
        type: notifData.type || "SYSTEM",
        title: notifData.title || "Vendor Update",
        message: notifData.message,
        targetRole: "ADMIN",
        targetType: "ALL",
        read: false,
      });
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
  const { role, vendorId } = req.query;
  const filter = {};
  if (role) {
    if (role.toUpperCase() === "ADMIN") {
      filter.$or = [
        { recipientRole: { $in: ["ADMIN", "ALL"] } },
        { recipientRole: { $exists: false } },
        { recipientRole: null },
      ];
    } else if (role.toUpperCase() === "VENDOR") {
      if (vendorId) {
        filter.$or = [
          { vendorId: String(vendorId) },
          { vendorId: null },
          { vendorId: { $exists: false } },
          { recipientRole: "ALL" },
        ];
      } else {
        filter.$or = [
          { recipientRole: { $in: ["VENDOR", "ALL"] } },
          { recipientRole: { $exists: false } },
          { recipientRole: null },
        ];
      }
    }
  }
  await CrmNotification.updateMany(filter, { $set: { read: true } });
  return res.status(200).json({ success: true });
});

export const deleteNotification = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const isMongoId = Boolean(id && /^[0-9a-fA-F]{24}$/.test(id));
  const conds = [{ notificationId: id }, { id: id }];
  if (isMongoId) conds.push({ _id: id });
  await CrmNotification.deleteMany({ $or: conds });
  return res.status(200).json({ success: true, message: "Notification deleted successfully" });
});

export const clearAllNotifications = asyncHandler(async (req, res) => {
  const { role, vendorId } = req.query;
  const filter = {};
  if (role) {
    if (role.toUpperCase() === "ADMIN") {
      filter.$or = [
        { recipientRole: { $in: ["ADMIN", "ALL"] } },
        { recipientRole: { $exists: false } },
        { recipientRole: null },
      ];
    } else if (role.toUpperCase() === "VENDOR") {
      if (vendorId) {
        filter.$or = [
          { vendorId: String(vendorId) },
          { recipientRole: "VENDOR" },
          { vendorId: null },
          { vendorId: { $exists: false } },
        ];
      } else {
        filter.$or = [
          { recipientRole: { $in: ["VENDOR", "ALL"] } },
          { recipientRole: { $exists: false } },
          { recipientRole: null },
        ];
      }
    }
  }
  await CrmNotification.deleteMany(filter);
  return res.status(200).json({ success: true, message: "Notifications cleared successfully" });
});
