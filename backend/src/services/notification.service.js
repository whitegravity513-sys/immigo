import Notification from "../models/Notification.js";
import mongoose from "mongoose";

const isConfiguredSuperAdminEmail = (email) => {
  if (!email) return false;
  const clean = String(email).trim().toLowerCase();
  const candidates = [
    process.env.SUPER_ADMIN_EMAIL,
    process.env.SUPERADMIN_EMAIL,
    "admin@vista.com",
  ]
    .filter(Boolean)
    .map((e) => String(e).trim().toLowerCase());
  return candidates.includes(clean);
};

export const resolveActorInfo = (actor) => {
  if (!actor) return { actorId: null, actorRole: null };
  const rawId = actor.id || actor._id || actor.userId || actor.employeeId || actor.vendorId;
  const actorId = rawId ? String(rawId) : null;
  const rawRole = String(actor.role || "").toUpperCase();
  const isSuper =
    actor.isSuperAdmin === true ||
    rawRole === "SUPER_ADMIN" ||
    isConfiguredSuperAdminEmail(actor.email);

  if (isSuper) return { actorId, actorRole: "SUPER_ADMIN" };
  if (rawRole === "ADMIN") return { actorId, actorRole: "ADMIN" };
  if (rawRole === "HR") {
    const hrType = String(actor.hrType || "").toUpperCase();
    return { actorId, actorRole: hrType === "VENDOR_HR" ? "VENDOR_HR" : "EMPLOYEE_HR" };
  }
  if (rawRole === "VENDOR_HR" || rawRole === "EMPLOYEE_HR") {
    return { actorId, actorRole: rawRole };
  }
  if (rawRole === "VENDOR") return { actorId, actorRole: "VENDOR" };
  if (rawRole === "EMPLOYEE") return { actorId, actorRole: "EMPLOYEE" };
  if (rawRole === "CANDIDATE") return { actorId, actorRole: "CANDIDATE" };
  return { actorId, actorRole: rawRole || null };
};

const parseTimeToMinutes = (timeStr) => {
  if (!timeStr) return null;
  const raw = String(timeStr).trim();
  const match = raw.match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)?$/i);
  if (!match) return null;
  let hours = parseInt(match[1], 10);
  const mins = parseInt(match[2], 10);
  const meridiem = (match[3] || "").toUpperCase();
  if (meridiem === "PM" && hours < 12) hours += 12;
  if (meridiem === "AM" && hours === 12) hours = 0;
  return hours * 60 + mins;
};

const getIstNowParts = () => {
  const now = new Date();
  const dateStr = now.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
  const timeStr = now.toLocaleTimeString("en-GB", {
    timeZone: "Asia/Kolkata",
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
  });
  const [hh, mm] = timeStr.split(":").map((v) => parseInt(v, 10));
  return { dateStr, minutes: (hh || 0) * 60 + (mm || 0) };
};

export const isExpiredMeetingNotification = (n) => {
  if (!n) return false;
  const typeUpper = String(n.type || "").toUpperCase();
  if (typeUpper !== "MEETING" && typeUpper !== "MEETING_REMINDER") return false;
  const dateStr = n.metadata?.date ? String(n.metadata.date).trim().slice(0, 10) : "";
  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;

  const { dateStr: todayIst, minutes: nowMinutes } = getIstNowParts();
  if (dateStr < todayIst) return true;
  if (dateStr > todayIst) return false;

  const endMins = parseTimeToMinutes(n.metadata?.endTime);
  if (endMins !== null) return nowMinutes >= endMins;

  const startMins = parseTimeToMinutes(n.metadata?.startTime);
  if (startMins !== null) return nowMinutes >= startMins + 60;

  return false;
};

const buildStaffVisibilityQuery = (options = {}) => {
  const isSuperAdmin = Boolean(options.isSuperAdmin);
  const role = String(options.role || "ADMIN").toUpperCase();
  const hrType = String(options.hrType || "").toUpperCase();
  const userId = options.userId ? String(options.userId) : null;
  const assignedVendors = Array.isArray(options.assignedVendors)
    ? options.assignedVendors.map((v) => String(v))
    : [];

  const selfExclusion = userId ? [{ actorId: { $ne: userId } }] : [];

  if (isSuperAdmin || role === "SUPER_ADMIN") {
    return {
      $and: [
        ...selfExclusion,
        { targetRole: { $nin: ["EMPLOYEE", "VENDOR", "CANDIDATE"] } },
        {
          $or: [
            { targetRole: "SUPER_ADMIN" },
            { targetRoles: "SUPER_ADMIN" },
            {
              targetRole: { $in: ["ADMIN", "ALL"] },
              $or: [
                { targetRoles: { $exists: false } },
                { targetRoles: { $size: 0 } },
                { targetRoles: "SUPER_ADMIN" },
              ],
            },
            { targetRole: { $exists: false } },
          ],
        },
      ],
    };
  }

  if (role === "ADMIN") {
    return {
      $and: [
        ...selfExclusion,
        { actorRole: { $ne: "ADMIN" } },
        { targetRole: { $nin: ["EMPLOYEE", "VENDOR", "CANDIDATE", "SUPER_ADMIN"] } },
        {
          $or: [
            { targetRoles: "ADMIN" },
            {
              targetRole: { $in: ["ADMIN", "ALL"] },
              $or: [
                { targetRoles: { $exists: false } },
                { targetRoles: { $size: 0 } },
                { targetRoles: "ADMIN" },
              ],
            },
            { targetRole: { $exists: false } },
          ],
        },
      ],
    };
  }

  if (role === "VENDOR_HR" || (role === "HR" && hrType === "VENDOR_HR")) {
    const vendorScope = assignedVendors.length > 0
      ? [
        { targetVendorId: { $in: assignedVendors } },
        { "metadata.vendorId": { $in: assignedVendors } },
        ...(userId ? [{ targetUserId: userId }] : []),
      ]
      : userId
        ? [{ targetUserId: userId }]
        : [{ targetRole: "VENDOR_HR" }];

    return {
      $and: [
        ...selfExclusion,
        { moduleScope: { $in: ["VENDOR", "CANDIDATE", "MEETING"] } },
        {
          $or: [
            { targetRole: "VENDOR_HR" },
            { targetRoles: "VENDOR_HR" },
            { targetRoles: "HR" },
            {
              targetRole: { $in: ["ADMIN", "HR"] },
              moduleScope: { $in: ["VENDOR", "CANDIDATE"] },
              "metadata.splitForRoles": { $ne: true },
            },
            ...(userId ? [{ targetUserId: userId }] : []),
          ],
        },
        { $or: vendorScope },
        ...(userId
          ? [
            {
              $or: [
                { targetType: { $ne: "SPECIFIC" } },
                { targetUserId: null },
                { targetUserId: { $exists: false } },
                { targetUserId: userId },
              ],
            },
          ]
          : []),
      ],
    };
  }

  if (role === "EMPLOYEE_HR" || role === "HR") {
    return {
      $and: [
        ...selfExclusion,
        { moduleScope: { $in: ["WORKFORCE", "ANNOUNCEMENT", "HOLIDAY", "MEETING"] } },
        { targetRole: { $nin: ["EMPLOYEE", "VENDOR", "CANDIDATE", "SUPER_ADMIN", "VENDOR_HR"] } },
        {
          $or: [
            { targetRole: { $in: ["EMPLOYEE_HR", "HR"] } },
            { targetRoles: { $in: ["EMPLOYEE_HR", "HR"] } },
            {
              targetRole: "ALL",
              moduleScope: { $in: ["ANNOUNCEMENT", "HOLIDAY", "MEETING"] },
            },
            {
              targetRole: { $in: ["ADMIN", "ALL"] },
              actorRole: { $nin: ["ADMIN", "SUPER_ADMIN"] },
            },
            ...(userId ? [{ targetUserId: userId }] : []),
          ],
        },
      ],
    };
  }

  if (role === "VENDOR") {
    return {
      $and: [
        ...selfExclusion,
        {
          $or: [
            { targetRole: "VENDOR" },
            { targetRoles: "VENDOR" },
            {
              targetRole: "ALL",
              moduleScope: { $in: ["ANNOUNCEMENT", "HOLIDAY", "MEETING"] },
            },
          ],
        },
        ...(userId
          ? [
            {
              $or: [
                { targetType: "ALL" },
                { targetUserId: userId },
                { targetVendorId: userId },
              ],
            },
          ]
          : []),
      ],
    };
  }

  if (role === "CANDIDATE") {
    return {
      $and: [
        ...selfExclusion,
        {
          $or: [{ targetRole: "CANDIDATE" }, { targetRoles: "CANDIDATE" }],
        },
        ...(userId
          ? [{ $or: [{ targetType: "ALL" }, { targetUserId: userId }] }]
          : []),
      ],
    };
  }

  return {
    $and: [
      ...selfExclusion,
      { targetRole: { $in: ["ADMIN", "ALL"] } },
    ],
  };
};

export class NotificationService {
  static async createNotification({
    type,
    title,
    message,
    employeeId = null,
    employeeName = "",
    targetRole = "ADMIN",
    targetRoles = [],
    targetType = "ALL",
    targetEmployeeId = null,
    targetUserId = null,
    targetVendorId = null,
    actor = null,
    actorId = null,
    actorRole = null,
    moduleScope = "GENERAL",
    metadata = {},
  }) {
    try {
      const resolvedActor = actor ? resolveActorInfo(actor) : { actorId: null, actorRole: null };
      const finalActorId = actorId ? String(actorId) : resolvedActor.actorId;
      const finalActorRole = actorRole || resolvedActor.actorRole;

      const normalizedRoles =
        Array.isArray(targetRoles) && targetRoles.length > 0
          ? Array.from(new Set(targetRoles.map((r) => String(r).toUpperCase())))
          : targetRole
            ? [String(targetRole).toUpperCase()]
            : [];

      const notification = await Notification.create({
        type,
        title,
        message,
        employeeId: employeeId || null,
        employeeName: employeeName || "",
        targetRole,
        targetRoles: normalizedRoles,
        targetType,
        targetEmployeeId: targetEmployeeId || null,
        targetUserId: targetUserId ? String(targetUserId) : null,
        targetVendorId: targetVendorId ? String(targetVendorId) : null,
        actorId: finalActorId,
        actorRole: finalActorRole,
        moduleScope: moduleScope || "GENERAL",
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

  static async notifyStaffAction({
    actor,
    type,
    title,
    message,
    moduleScope = "GENERAL",
    targetEmployeeId = null,
    targetVendorId = null,
    targetCandidateId = null,
    employeeId = null,
    employeeName = "",
    metadata = {},
  }) {
    const { actorId, actorRole } = resolveActorInfo(actor);
    const created = [];

    if (targetEmployeeId) {
      const empNotif = await this.createNotification({
        type,
        title,
        message,
        employeeId: employeeId || targetEmployeeId,
        employeeName,
        targetRole: "EMPLOYEE",
        targetRoles: ["EMPLOYEE"],
        targetType: "SPECIFIC",
        targetEmployeeId,
        actorId,
        actorRole,
        moduleScope: "WORKFORCE",
        metadata,
      });
      if (empNotif) created.push(empNotif);
    }

    if (targetVendorId) {
      const vendorNotif = await this.createNotification({
        type,
        title,
        message,
        targetRole: "VENDOR",
        targetRoles: ["VENDOR"],
        targetType: "SPECIFIC",
        targetVendorId: String(targetVendorId),
        targetUserId: String(targetVendorId),
        actorId,
        actorRole,
        moduleScope: "VENDOR",
        metadata: { ...metadata, vendorId: String(targetVendorId) },
      });
      if (vendorNotif) created.push(vendorNotif);
    }

    if (targetCandidateId) {
      const candNotif = await this.createNotification({
        type,
        title,
        message,
        targetRole: "CANDIDATE",
        targetRoles: ["CANDIDATE"],
        targetType: "SPECIFIC",
        targetUserId: String(targetCandidateId),
        actorId,
        actorRole,
        moduleScope: "CANDIDATE",
        metadata: { ...metadata, candidateId: String(targetCandidateId) },
      });
      if (candNotif) created.push(candNotif);
    }

    if (actorRole === "ADMIN") {
      const superNotif = await this.createNotification({
        type,
        title,
        message,
        employeeId: employeeId || targetEmployeeId || null,
        employeeName,
        targetRole: "SUPER_ADMIN",
        targetRoles: ["SUPER_ADMIN"],
        targetType: "ALL",
        targetVendorId: targetVendorId ? String(targetVendorId) : null,
        actorId,
        actorRole,
        moduleScope,
        metadata: targetVendorId ? { ...metadata, vendorId: String(targetVendorId) } : metadata,
      });
      if (superNotif) created.push(superNotif);
    } else if (actorRole === "SUPER_ADMIN") {
      const adminNotif = await this.createNotification({
        type,
        title,
        message,
        employeeId: employeeId || targetEmployeeId || null,
        employeeName,
        targetRole: "ADMIN",
        targetRoles: ["ADMIN"],
        targetType: "ALL",
        targetVendorId: targetVendorId ? String(targetVendorId) : null,
        actorId,
        actorRole,
        moduleScope,
        metadata: targetVendorId ? { ...metadata, vendorId: String(targetVendorId) } : metadata,
      });
      if (adminNotif) created.push(adminNotif);
    } else if (actorRole === "EMPLOYEE_HR" || actorRole === "VENDOR_HR") {
      const oversightNotif = await this.createNotification({
        type,
        title,
        message,
        employeeId: employeeId || targetEmployeeId || null,
        employeeName,
        targetRole: "ADMIN",
        targetRoles: ["SUPER_ADMIN", "ADMIN"],
        targetType: "ALL",
        targetVendorId: targetVendorId ? String(targetVendorId) : null,
        actorId,
        actorRole,
        moduleScope: actorRole === "VENDOR_HR" ? "VENDOR" : "WORKFORCE",
        metadata: targetVendorId ? { ...metadata, vendorId: String(targetVendorId) } : metadata,
      });
      if (oversightNotif) created.push(oversightNotif);
    }

    return created;
  }

  static async getNotifications(limit = 30, options = {}) {
    const query = buildStaffVisibilityQuery(options);

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

    const activeNotifications = (notifications || []).filter(
      (n) => !isExpiredMeetingNotification(n)
    );
    const expiredUnreadCount = (notifications || []).filter(
      (n) => isExpiredMeetingNotification(n) && !n.read
    ).length;

    return {
      unreadCount: Math.max(0, unreadCount - expiredUnreadCount),
      notifications: activeNotifications.map((n) => ({
        id: n._id ? n._id.toString() : "",
        _id: n._id ? n._id.toString() : "",
        type: n.type,
        title: n.title,
        message: n.message,
        read: Boolean(n.read),
        targetRole: n.targetRole,
        targetRoles: n.targetRoles || [],
        targetType: n.targetType || "ALL",
        targetUserId: n.targetUserId || null,
        targetVendorId: n.targetVendorId || null,
        link: n.metadata?.link || "",
        actorId: n.actorId || null,
        actorRole: n.actorRole || null,
        moduleScope: n.moduleScope || "GENERAL",
        employeeId:
          n.metadata?.employeeId ||
          (n.employeeId?._id ? n.employeeId._id.toString() : typeof n.employeeId === "string" ? n.employeeId : ""),
        employeeName: n.employeeName || n.employeeId?.name || "System",
        employeeCode: n.employeeId?.employeeId || "",
        createdAt: n.createdAt,
        metadata: n.metadata || {},
      })),
    };
  }

  static async markAsRead(id, options = null) {
    if (!id) return null;
    if (options && !options.isSuperAdmin) {
      const visibilityQuery = buildStaffVisibilityQuery(options);
      const idFilter = mongoose.Types.ObjectId.isValid(String(id))
        ? { _id: new mongoose.Types.ObjectId(String(id)) }
        : { notificationId: String(id) };
      return await Notification.findOneAndUpdate(
        { $and: [visibilityQuery, idFilter] },
        { read: true },
        { returnDocument: "after" }
      );
    }
    const notification = await Notification.findByIdAndUpdate(
      id,
      { read: true },
      { returnDocument: "after" }
    );
    return notification;
  }

  static async markAllAsRead(options = {}) {
    const query = buildStaffVisibilityQuery(options);
    await Notification.updateMany(
      {
        ...query,
        read: false,
      },
      { read: true }
    );
    return { success: true };
  }

  static async clearAll(options = {}) {
    const query = buildStaffVisibilityQuery(options);
    const isVendorHrRole =
      String(options?.role || "").toUpperCase() === "VENDOR_HR" ||
      String(options?.hrType || "").toUpperCase() === "VENDOR_HR";
    const deleteFilter = isVendorHrRole
      ? {
        $and: [
          query,
          {
            $or: [
              { targetRole: "VENDOR_HR" },
              { targetRoles: "VENDOR_HR" },
              ...(options?.userId ? [{ targetUserId: String(options.userId) }] : []),
            ],
          },
        ],
      }
      : query;
    await Notification.deleteMany(deleteFilter);
    return { success: true };
  }

  static async deleteNotification(id, options = null) {
    if (!id) return { success: true };
    const sId = String(id);
    const isMongoId = mongoose.Types.ObjectId.isValid(sId);

    const filterOr = [
      { notificationId: sId },
      { id: sId },
      { "metadata.id": sId },
      { "metadata.notificationId": sId },
    ];
    if (isMongoId) {
      filterOr.push({ _id: new mongoose.Types.ObjectId(sId) });
    }

    const visibilityQuery =
      options && !options.isSuperAdmin ? buildStaffVisibilityQuery(options) : null;

    try {
      const deleteQuery = visibilityQuery
        ? { $and: [visibilityQuery, { $or: filterOr }] }
        : { $or: filterOr };
      await Notification.deleteMany(deleteQuery);
    } catch (e) {
      console.warn("Notification delete warning:", e?.message);
    }

    try {
      const CrmNotification = mongoose.models.CrmNotification || mongoose.model("CrmNotification");
      if (CrmNotification) {
        const crmConds = [{ notificationId: sId }, { id: sId }];
        if (isMongoId) crmConds.push({ _id: new mongoose.Types.ObjectId(sId) });
        const crmDeleteQuery =
          options && !options.isSuperAdmin
            ? {
                $and: [
                  { $or: crmConds },
                  ...(String(options?.hrType || "").toUpperCase() === "VENDOR_HR"
                    ? [
                        {
                          recipientRole: { $in: ["VENDOR_HR", "HR"] },
                          ...(Array.isArray(options?.assignedVendors)
                            ? { vendorId: { $in: options.assignedVendors } }
                            : {}),
                        },
                      ]
                    : [
                        {
                          recipientRole: { $ne: "SUPER_ADMIN" },
                        },
                      ]),
                ],
              }
            : { $or: crmConds };
        await CrmNotification.deleteMany(crmDeleteQuery);
      }
    } catch { }

    return { success: true };
  }

  static async getEmployeeNotifications(employeeId, limit = 30) {
    const empStr = employeeId ? String(employeeId) : "";
    const empObjId = empStr && mongoose.Types.ObjectId.isValid(empStr)
      ? new mongoose.Types.ObjectId(empStr)
      : null;

    const filter = {
      ...(empStr ? { actorId: { $ne: empStr } } : {}),
      ...(empObjId ? { deletedBy: { $ne: empObjId } } : {}),
      $or: [
        {
          targetRole: { $in: ["EMPLOYEE", "ALL"] },
          targetType: "ALL",
          moduleScope: { $nin: ["VENDOR", "CANDIDATE"] },
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

    const activeNotifications = (notifications || []).filter(
      (n) => !isExpiredMeetingNotification(n)
    );

    let unreadCount = 0;
    const formatted = activeNotifications.map((n) => {
      const isAll = n.targetType === "ALL";
      const isRead = isAll
        ? Array.isArray(n.readBy) && n.readBy.some((id) => id.toString() === empStr)
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
