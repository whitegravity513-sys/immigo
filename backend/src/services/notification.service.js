import Notification from "../models/Notification.js";
import mongoose from "mongoose";

/**
 * Enterprise Notification Service for Real-time HRMS & Admin Events
 */
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

  /**
   * Fetch admin-targeted notifications
   */
  static async getNotifications(limit = 30) {
    const query = {
      $or: [
        { targetRole: { $in: ["ADMIN", "ALL"] } },
        { targetRole: { $exists: false } },
      ],
    };

    const [notifications, unreadCount] = await Promise.all([
      Notification.find(query)
        .populate("employeeId", "name employeeId designation")
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean(),
      Notification.countDocuments({ ...query, read: false }),
    ]);

    return {
      unreadCount,
      notifications: notifications.map((n) => ({
        id: n._id.toString(),
        _id: n._id.toString(),
        type: n.type,
        title: n.title,
        message: n.message,
        read: n.read,
        employeeName: n.employeeName || n.employeeId?.name || "Employee",
        employeeCode: n.employeeId?.employeeId || "",
        createdAt: n.createdAt,
        metadata: n.metadata,
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

  /**
   * Fetch employee-targeted notifications
   */
  static async getEmployeeNotifications(employeeId, limit = 30) {
    const empObjId = new mongoose.Types.ObjectId(employeeId.toString());

    const filter = {
      $or: [
        {
          targetRole: { $in: ["EMPLOYEE", "ALL"] },
          targetType: "ALL",
        },
        {
          targetRole: { $in: ["EMPLOYEE", "ALL"] },
          targetType: "SPECIFIC",
          targetEmployeeId: empObjId,
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

  /**
   * Mark single notification as read for an employee
   */
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

  /**
   * Mark all notifications as read for an employee
   */
  static async markAllAsReadForEmployee(employeeId) {
    const empObjId = new mongoose.Types.ObjectId(employeeId.toString());

    // Mark specific notifications as read
    await Notification.updateMany(
      {
        targetRole: { $in: ["EMPLOYEE", "ALL"] },
        targetType: "SPECIFIC",
        targetEmployeeId: empObjId,
        read: false,
      },
      { read: true }
    );

    // Add employee to readBy for ALL notifications
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

    return { success: true };
  }
}

export default NotificationService;
