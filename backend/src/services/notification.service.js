import Notification from "../models/Notification.js";
import Employee from "../models/Employee.js";
import mongoose from "mongoose";

export class NotificationService {
  static async createNotification({
    type,
    title,
    message,
    employeeId = null,
    employeeName = "",
    targetRole = "ADMIN",
    targetType = "ALL",
    targetEmployeeId = null,
    metadata = {},
  }) {
    try {
      const notification = await Notification.create({
        type,
        title,
        message,
        employeeId: employeeId || null,
        employeeName: employeeName || "",
        targetRole,
        targetType,
        targetEmployeeId: targetEmployeeId || null,
        read: false,
        readBy: [],
        metadata,
      });
      return notification;
    } catch (err) {
      console.error("Error creating notification:", err);
      return null;
    }
  }

  static async getNotifications(limit = 30) {
    const query = {
      $or: [
        { targetRole: { $in: ["ADMIN", "ALL"] } },
        { targetRole: { $exists: false } },
      ],
    };

    let notifications = [];
    let unreadCount = 0;

    try {
      [notifications, unreadCount] = await Promise.all([
        Notification.find(query)
          .populate("employeeId", "name employeeId designation")
          .sort({ createdAt: -1 })
          .limit(limit)
          .lean(),
        Notification.countDocuments({ ...query, read: false }),
      ]);
    } catch (err) {
      console.error("Error fetching notifications with populate, trying fallback:", err);
      try {
        [notifications, unreadCount] = await Promise.all([
          Notification.find(query)
            .sort({ createdAt: -1 })
            .limit(limit)
            .lean(),
          Notification.countDocuments({ ...query, read: false }),
        ]);
      } catch (innerErr) {
        console.error("Error fetching notifications fallback failed:", innerErr);
        notifications = [];
        unreadCount = 0;
      }
    }

    return {
      unreadCount,
      notifications: (notifications || []).map((n) => ({
        id: n._id ? n._id.toString() : "",
        _id: n._id ? n._id.toString() : "",
        type: n.type,
        title: n.title,
        message: n.message,
        read: Boolean(n.read),
        employeeName: n.employeeName || n.employeeId?.name || "Employee",
        employeeCode: n.employeeId?.employeeId || "",
        createdAt: n.createdAt,
        metadata: n.metadata || {},
      })),
    };
  }

  static async markAsRead(id) {
    const notification = await Notification.findByIdAndUpdate(
      id,
      { read: true },
      { new: true }
    );
    return notification;
  }

  static async markAllAsRead() {
    await Notification.updateMany({ read: false }, { read: true });
    return { success: true };
  }

  static async clearAll() {
    await Notification.deleteMany({
      $or: [
        { targetRole: { $in: ["ADMIN", "ALL"] } },
        { targetRole: { $exists: false } },
      ],
    });
    return { success: true };
  }

  static async deleteNotification(id) {
    await Notification.findByIdAndDelete(id);
    return { success: true };
  }

  static async getEmployeeNotifications(employeeId, limit = 30) {
    const empObjId = employeeId && mongoose.Types.ObjectId.isValid(employeeId)
      ? new mongoose.Types.ObjectId(employeeId.toString())
      : null;

    const filter = {
      ...(empObjId ? { deletedBy: { $ne: empObjId } } : {}),
      $or: [
        {
          targetRole: { $in: ["EMPLOYEE", "ALL"] },
          targetType: "ALL",
        },
        {
          targetRole: { $in: ["EMPLOYEE", "ALL"] },
          $or: [
            ...(empObjId ? [{ targetEmployeeId: empObjId }] : []),
            { targetEmployeeId: employeeId },
            ...(empObjId ? [{ employeeId: empObjId }] : []),
            { employeeId },
          ],
        },
      ],
    };

    const notifications = await Notification.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    let unreadCount = 0;
    const formatted = notifications.map((n) => {
      const isAll = n.targetType === "ALL";
      const isRead = isAll
        ? Array.isArray(n.readBy) && n.readBy.some((id) => id.toString() === employeeId.toString())
        : Boolean(n.read);

      if (!isRead) unreadCount++;

      return {
        id: n._id.toString(),
        _id: n._id.toString(),
        type: n.type,
        title: n.title,
        message: n.message,
        read: isRead,
        targetType: n.targetType,
        createdAt: n.createdAt,
        metadata: n.metadata || {},
      };
    });

    return {
      unreadCount,
      notifications: formatted,
    };
  }

  static async markAsReadForEmployee(notificationId, employeeId) {
    const notification = await Notification.findById(notificationId);
    if (!notification) return null;

    if (notification.targetType === "ALL") {
      await Notification.findByIdAndUpdate(notificationId, {
        $addToSet: { readBy: new mongoose.Types.ObjectId(employeeId.toString()) },
      });
    } else {
      await Notification.findByIdAndUpdate(notificationId, { read: true });
    }

    return { success: true };
  }

  static async markAllAsReadForEmployee(employeeId) {
    const empObjId = employeeId && mongoose.Types.ObjectId.isValid(employeeId)
      ? new mongoose.Types.ObjectId(employeeId.toString())
      : null;

    await Notification.updateMany(
      {
        $or: [
          ...(empObjId ? [{ targetEmployeeId: empObjId }] : []),
          { targetEmployeeId: employeeId },
          ...(empObjId ? [{ employeeId: empObjId }] : []),
          { employeeId },
        ],
        read: false,
      },
      { $set: { read: true } }
    );

    if (empObjId) {
      await Notification.updateMany(
        {
          targetRole: { $in: ["EMPLOYEE", "ALL"] },
          targetType: "ALL",
          readBy: { $ne: empObjId },
        },
        {
          $addToSet: { readBy: empObjId },
        }
      );
    }

    return { success: true };
  }

  static async deleteEmployeeNotification(notificationId, employeeId) {
    const empObjId = employeeId && mongoose.Types.ObjectId.isValid(employeeId)
      ? new mongoose.Types.ObjectId(employeeId.toString())
      : null;

    const notif = await Notification.findById(notificationId);
    if (!notif) return { success: true };

    if (notif.targetType === "ALL") {
      if (empObjId) {
        await Notification.findByIdAndUpdate(notificationId, {
          $addToSet: { deletedBy: empObjId },
        });
      }
    } else {
      await Notification.findByIdAndDelete(notificationId);
    }
    return { success: true };
  }

  static async clearAllForEmployee(employeeId) {
    const empObjId = employeeId && mongoose.Types.ObjectId.isValid(employeeId)
      ? new mongoose.Types.ObjectId(employeeId.toString())
      : null;

    if (empObjId) {
      await Notification.updateMany(
        {
          $or: [
            { targetType: "ALL" },
            { targetRole: "ALL" },
          ],
          deletedBy: { $ne: empObjId },
        },
        {
          $addToSet: { deletedBy: empObjId },
        }
      );
    }

    await Notification.deleteMany({
      $or: [
        ...(empObjId ? [{ targetEmployeeId: empObjId }] : []),
        { targetEmployeeId: employeeId },
        ...(empObjId ? [{ employeeId: empObjId }] : []),
        { employeeId },
      ],
    });

    return { success: true };
  }
}

export default NotificationService;
