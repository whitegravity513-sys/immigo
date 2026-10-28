import mongoose from "mongoose";
import User from "../models/User.js";
import Role from "../models/Role.js";
import Permission from "../models/Permission.js";
import UserPermission from "../models/UserPermission.js";
import AuditLog from "../models/AuditLog.js";
import { ROLES } from "../constants/roles.js";
import {
  MODULES,
  ALL_PERMISSIONS,
  ROLE_DEFAULT_PERMISSIONS,
} from "../constants/permissions.js";
import { ApiError } from "../utils/apiError.js";

const permissionCache = new Map();
const CACHE_TTL_MS = 60 * 1000; // 60 seconds

export class PermissionService {
  static invalidateUserCache(userId) {
    if (userId) {
      permissionCache.delete(String(userId));
    } else {
      permissionCache.clear();
    }
  }

  static async resolveUserPermissions(user) {
    if (!user) {
      return { isSuperAdmin: false, permissions: [], role: null };
    }

    const userIdStr = String(user._id || user.id || "");
    const cached = permissionCache.get(userIdStr);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return cached.result;
    }

    const normalizedRole = (user.role || "").toUpperCase().replace(/[\s_-]/g, "");

    if (normalizedRole === "SUPERADMIN" || user.role === ROLES.SUPER_ADMIN) {
      const result = {
        isSuperAdmin: true,
        permissions: ["*"],
        role: ROLES.SUPER_ADMIN,
      };
      if (userIdStr) permissionCache.set(userIdStr, { result, timestamp: Date.now() });
      return result;
    }

    let roleDefaults = ROLE_DEFAULT_PERMISSIONS[user.role] || [];
    let assigned = [];
    let denied = [];

    try {
      if (mongoose.connection?.readyState === 1) {
        const [roleDoc, userPerm] = await Promise.all([
          Role.findOne({ name: user.role }).lean(),
          UserPermission.findOne({ userId: user._id || user.id }).lean(),
        ]);

        if (roleDoc && Array.isArray(roleDoc.defaultPermissions) && roleDoc.defaultPermissions.length > 0) {
          roleDefaults = roleDoc.defaultPermissions;
        }

        if (userPerm) {
          assigned = userPerm.assignedPermissions || [];
          denied = userPerm.deniedPermissions || [];
        }
      }
    } catch {
    }

    const combined = new Set([...roleDefaults, ...assigned]);
    denied.forEach((perm) => combined.delete(perm));
    const finalPermissions = Array.from(combined);

    const result = {
      isSuperAdmin: false,
      permissions: finalPermissions,
      role: user.role,
    };

    if (userIdStr) {
      permissionCache.set(userIdStr, { result, timestamp: Date.now() });
    }

    return result;
  }

  static hasPermission(effectivePermissions = [], requiredPermission) {
    if (!requiredPermission) return true;
    if (effectivePermissions.includes("*")) return true;

    if (Array.isArray(requiredPermission)) {
      return requiredPermission.some((perm) => effectivePermissions.includes(perm));
    }

    return effectivePermissions.includes(requiredPermission);
  }

  static async updateAdminPermissions({
    targetAdminId,
    targetUser: passedTargetUser = null,
    newPermissions,
    deniedPermissions = [],
    actorUser,
    notes = "",
    ipAddress = "",
    userAgent = "",
  }) {
    if (!targetAdminId && !passedTargetUser) {
      throw new ApiError(400, "Target admin ID is required");
    }

    const actorRole = (actorUser?.role || "").toUpperCase().replace(/[\s_-]/g, "");

    if (actorRole !== "SUPERADMIN" && actorUser?.role !== ROLES.SUPER_ADMIN) {
      throw new ApiError(403, "Access denied: Only Super Admin can manage permissions");
    }

    const effectiveTargetId = targetAdminId || passedTargetUser?._id;

    if (String(actorUser?._id || actorUser?.id) === String(effectiveTargetId)) {
      throw new ApiError(403, "Privilege escalation protection: You cannot modify your own permissions");
    }

    let targetUser = passedTargetUser;
    if (!targetUser && mongoose.connection?.readyState === 1) {
      targetUser = await User.findById(effectiveTargetId);
    }

    if (!targetUser) {
      throw new ApiError(404, "Admin account not found");
    }

    const targetRole = (targetUser.role || "").toUpperCase().replace(/[\s_-]/g, "");

    if (targetRole === "SUPERADMIN" || targetUser.role === ROLES.SUPER_ADMIN) {
      throw new ApiError(400, "Super Admin permissions are immutable and cannot be restricted");
    }

    let existingRecord = await UserPermission.findOne({ userId: targetAdminId });
    const oldAssigned = existingRecord ? existingRecord.assignedPermissions || [] : [];
    const oldDenied = existingRecord ? existingRecord.deniedPermissions || [] : [];

    const cleanAssigned = Array.isArray(newPermissions)
      ? newPermissions.filter((p) => ALL_PERMISSIONS.includes(p))
      : [];

    const cleanDenied = Array.isArray(deniedPermissions)
      ? deniedPermissions.filter((p) => ALL_PERMISSIONS.includes(p))
      : [];

    if (!existingRecord) {
      existingRecord = new UserPermission({
        userId: targetAdminId,
        assignedPermissions: cleanAssigned,
        deniedPermissions: cleanDenied,
        assignedBy: actorUser._id || actorUser.id,
        notes,
      });
    } else {
      existingRecord.assignedPermissions = cleanAssigned;
      existingRecord.deniedPermissions = cleanDenied;
      existingRecord.assignedBy = actorUser._id || actorUser.id;
      if (notes) existingRecord.notes = notes;
    }

    await existingRecord.save();
    this.invalidateUserCache(targetAdminId);
    this.invalidateUserCache(effectiveTargetId);

    targetUser.tokenVersion = (targetUser.tokenVersion || 0) + 1;
    await targetUser.save();

    const added = cleanAssigned.filter((p) => !oldAssigned.includes(p));
    const removed = oldAssigned.filter((p) => !cleanAssigned.includes(p));

    await AuditLog.create({
      userId: actorUser._id?.toString() || actorUser.id?.toString() || "system",
      userEmail: actorUser.email || "superadmin@vista.com",
      userName: actorUser.name || "Super Admin",
      role: actorUser.role || ROLES.SUPER_ADMIN,
      action: "PERMISSION_UPDATE",
      targetResource: "ADMIN",
      targetId: targetUser._id.toString(),
      targetName: targetUser.name || targetUser.email,
      description: `Updated permissions for ${targetUser.name} (${targetUser.email}). Added: ${added.length}, Removed: ${removed.length}`,
      changes: {
        added,
        removed,
        totalPermissions: cleanAssigned.length,
      },
      ipAddress,
      userAgent,
      status: "SUCCESS",
    });

    const effective = await this.resolveUserPermissions(targetUser);

    return {
      adminId: targetAdminId,
      assignedPermissions: cleanAssigned,
      deniedPermissions: cleanDenied,
      effectivePermissions: effective.permissions,
      changes: { added, removed },
    };
  }

  static async seedPermissionsAndRoles() {
    for (const mod of MODULES) {
      for (const act of mod.actions) {
        const key = `${mod.id}.${act}`;
        const name = `${act.charAt(0).toUpperCase() + act.slice(1)} ${mod.name}`;
        await Permission.findOneAndUpdate(
          { key },
          {
            key,
            module: mod.id,
            action: act,
            name,
            description: `Allows user to ${act} records in ${mod.name}`,
          },
          { upsert: true, new: true }
        );
      }
    }

    const rolesToSync = [
      {
        name: ROLES.SUPER_ADMIN,
        label: "Super Administrator",
        description: "Full, unrestricted access across all organizational modules, settings, and permission controls.",
        isSystem: true,
        defaultPermissions: ["*"],
      },
      {
        name: ROLES.ADMIN,
        label: "Operations Administrator",
        description: "Standard administrative access to manage operations, workforce, clients, and recruitment.",
        isSystem: true,
        defaultPermissions: ROLE_DEFAULT_PERMISSIONS[ROLES.ADMIN],
      },
      {
        name: ROLES.HR,
        label: "Human Resources Manager",
        description: "Workforce directory, attendance monitoring, leave approvals, and recruitment support.",
        isSystem: true,
        defaultPermissions: ROLE_DEFAULT_PERMISSIONS[ROLES.HR],
      },
      {
        name: ROLES.EMPLOYEE,
        label: "Employee Staff",
        description: "Internal staff member portal with view rights to their attendance and leaves.",
        isSystem: true,
        defaultPermissions: ROLE_DEFAULT_PERMISSIONS[ROLES.EMPLOYEE],
      },
    ];

    for (const r of rolesToSync) {
      await Role.findOneAndUpdate(
        { name: r.name },
        r,
        { upsert: true, new: true }
      );
    }
  }
}

export default PermissionService;
