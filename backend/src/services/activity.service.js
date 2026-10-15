import ActivityLog from "../models/ActivityLog.js";
import { logger } from "../utils/logger.js";

export class ActivityService {
  /**
   * Log an activity into MongoDB
   */
  static async log({
    userType = "ADMIN",
    userId = "",
    userName = "System Admin",
    action,
    title,
    description = "",
    entityType = "System",
    entityId = "",
    entityName = "",
    status = "",
    visibility = "ADMIN",
    metadata = {},
  }) {
    try {
      const activity = await ActivityLog.create({
        userType,
        userId: String(userId || ""),
        userName: userName || "System Admin",
        action,
        title,
        description,
        entityType,
        entityId: String(entityId || ""),
        entityName,
        status,
        visibility,
        metadata,
      });
      return activity;
    } catch (err) {
      logger.warn(`Failed to log activity [${action}]: ${err.message}`);
      return null;
    }
  }

  /**
   * Get activities for Admin (System-wide)
   */
  static async getAdminActivities({ page = 1, limit = 20, entityType, search } = {}) {
    const query = {};
    if (entityType && entityType !== "ALL") {
      query.entityType = entityType;
    }
    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), "i");
      query.$or = [
        { title: regex },
        { description: regex },
        { userName: regex },
        { entityName: regex },
        { action: regex },
      ];
    }

    const skip = (Math.max(1, Number(page)) - 1) * Number(limit);
    const total = await ActivityLog.countDocuments(query);
    const activities = await ActivityLog.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean();

    return {
      activities: activities.map((a) => ({
        ...a,
        id: a._id.toString(),
      })),
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit)) || 1,
    };
  }

  /**
   * Get activities for an Employee (their own & public employee activities only)
   */
  static async getEmployeeActivities(employeeId, { page = 1, limit = 15 } = {}) {
    const query = {
      $or: [
        { userId: String(employeeId), visibility: { $in: ["EMPLOYEE", "ALL"] } },
        { visibility: "ALL" },
        { entityType: "Employee", entityId: String(employeeId) },
      ],
    };

    const skip = (Math.max(1, Number(page)) - 1) * Number(limit);
    const total = await ActivityLog.countDocuments(query);
    const activities = await ActivityLog.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean();

    return {
      activities: activities.map((a) => ({
        ...a,
        id: a._id.toString(),
      })),
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit)) || 1,
    };
  }
}

export default ActivityService;
