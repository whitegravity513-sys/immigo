import jwt from "jsonwebtoken";
import env from "../config/env.js";
import User from "../models/User.js";
import Admin from "../models/Admin.js";
import AuditLog from "../models/AuditLog.js";
import { ROLES } from "../constants/roles.js";
import PermissionService from "../services/permission.service.js";
import { extractToken } from "./auth.middleware.js";

export const authenticateRBAC = async (req, res, next) => {
  const token = extractToken(req);
  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Authentication token missing or invalid. Please sign in.",
    });
  }

  let decoded = null;
  try {
    decoded = jwt.verify(token, env.JWT_SECRET);
  } catch {
    try {
      decoded = jwt.verify(
        token,
        process.env.JWT_ACCESS_SECRET || "default_access_secret_change_in_production"
      );
    } catch {
      return res.status(401).json({
        success: false,
        message: "Your session token has expired or is invalid. Please sign in again.",
      });
    }
  }

  const userId = decoded.id || decoded.sub || decoded._id;
  if (!userId) {
    return res.status(401).json({
      success: false,
      message: "Malformed token credentials.",
    });
  }

  let user = await User.findById(userId);

  if (!user && (decoded.email || decoded.role === "ADMIN")) {
    const adminDoc = await Admin.findById(userId);
    if (adminDoc) {
      user = await User.findOne({ email: adminDoc.email.toLowerCase() });
      if (!user) {
        user = await User.create({
          name: adminDoc.email.split("@")[0] || "Admin",
          email: adminDoc.email.toLowerCase(),
          passwordHash: adminDoc.password,
          role: ROLES.ADMIN,
          isActive: true,
          isEmailVerified: true,
        });
      }
    }
  }

  if (!user) {
    return res.status(401).json({
      success: false,
      message: "User account not found or has been removed.",
    });
  }

  if (user.isActive === false) {
    return res.status(403).json({
      success: false,
      message: "Your account is deactivated. Please contact your Super Administrator.",
      accountStatus: "INACTIVE",
    });
  }

  const resolved = await PermissionService.resolveUserPermissions(user);

  req.user = user;
  req.userId = user._id.toString();
  req.userPermissions = resolved.permissions;
  req.isSuperAdmin = resolved.isSuperAdmin;
  req.userRole = user.role;

  next();
};

export const requirePermission = (requiredPermission, options = { mode: "all" }) => {
  return async (req, res, next) => {
    if (!req.user || !req.userPermissions) {
      return authenticateRBAC(req, res, () => {
        checkPermissionLogic(req, res, next, requiredPermission, options);
      });
    }

    checkPermissionLogic(req, res, next, requiredPermission, options);
  };
};

const checkPermissionLogic = (req, res, next, requiredPermission, options) => {
  if (req.isSuperAdmin || req.userRole === ROLES.SUPER_ADMIN || req.userPermissions?.includes("*")) {
    return next();
  }

  const perms = req.userPermissions || [];

  if (Array.isArray(requiredPermission)) {
    const hasAccess =
      options.mode === "any"
        ? requiredPermission.some((p) => perms.includes(p))
        : requiredPermission.every((p) => perms.includes(p));

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: You do not have permission to perform this action. Required: [${requiredPermission.join(
          ", "
        )}]`,
        requiredPermissions: requiredPermission,
        effectiveRole: req.userRole,
      });
    }
  } else if (typeof requiredPermission === "string") {
    if (!perms.includes(requiredPermission)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: You do not have permission [${requiredPermission}] to perform this action.`,
        requiredPermission,
        effectiveRole: req.userRole,
      });
    }
  }

  next();
};

export const requireSuperAdmin = (req, res, next) => {
  if (!req.user || !req.userPermissions) {
    return authenticateRBAC(req, res, () => {
      if (req.isSuperAdmin || req.userRole === ROLES.SUPER_ADMIN) {
        return next();
      }
      return res.status(403).json({
        success: false,
        message: "Forbidden: Super Administrator privileges required.",
      });
    });
  }

  if (req.isSuperAdmin || req.userRole === ROLES.SUPER_ADMIN) {
    return next();
  }

  return res.status(403).json({
    success: false,
    message: "Forbidden: Super Administrator privileges required.",
  });
};

export const requireRoles = (...allowedRoles) => {
  const normalized = allowedRoles.map((r) => r.toUpperCase().replace(/[\s_-]/g, ""));

  return (req, res, next) => {
    if (!req.user) {
      return authenticateRBAC(req, res, () => {
        const userRole = (req.userRole || req.user?.role || "").toUpperCase().replace(/[\s_-]/g, "");
        if (req.isSuperAdmin || normalized.includes(userRole)) {
          return next();
        }
        return res.status(403).json({
          success: false,
          message: `Forbidden: Access restricted to [${allowedRoles.join(", ")}] roles.`,
        });
      });
    }

    const userRole = (req.userRole || req.user?.role || "").toUpperCase().replace(/[\s_-]/g, "");
    if (req.isSuperAdmin || normalized.includes(userRole)) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: `Forbidden: Access restricted to [${allowedRoles.join(", ")}] roles.`,
    });
  };
};

export const logAudit = async ({
  req,
  action,
  targetResource,
  targetId,
  targetName = "",
  description = "",
  changes = null,
  status = "SUCCESS",
}) => {
  try {
    const ipAddress = req.ip || req.headers["x-forwarded-for"] || req.connection?.remoteAddress || "";
    const userAgent = req.headers["user-agent"] || "";

    await AuditLog.create({
      userId: req.user?._id?.toString() || req.userId || "system",
      userEmail: req.user?.email || "system",
      userName: req.user?.name || "System",
      role: req.userRole || req.user?.role || "ADMIN",
      action,
      targetResource,
      targetId: targetId ? String(targetId) : null,
      targetName,
      description,
      changes,
      ipAddress,
      userAgent,
      status,
    });
  } catch (err) {
    console.error("Failed to write audit log:", err);
  }
};

export default {
  authenticateRBAC,
  requirePermission,
  requireSuperAdmin,
  requireRoles,
  logAudit,
};
