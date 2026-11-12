import jwt from "jsonwebtoken";
import { getJwtVerificationSecrets } from "../config/env.js";
import User from "../models/User.js";
import Admin from "../models/Admin.js";
import Vendor from "../models/Vendor.js";
import AuditLog from "../models/AuditLog.js";
import { ROLES } from "../constants/roles.js";
import { ROLE_DEFAULT_PERMISSIONS } from "../constants/permissions.js";
import PermissionService from "../services/permission.service.js";
import { extractToken } from "./auth.middleware.js";

const userAuthCache = new Map();
const USER_CACHE_TTL_MS = 30 * 1000;

export const invalidateUserAuthCache = (userId) => {
  if (userId) {
    userAuthCache.delete(String(userId));
  } else {
    userAuthCache.clear();
  }
};

export const authenticateRBAC = async (req, res, next) => {
  const token = extractToken(req);
  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Authentication token missing or invalid. Please sign in.",
    });
  }

  let decoded = null;
  for (const secret of getJwtVerificationSecrets()) {
    try {
      decoded = jwt.verify(token, secret);
      break;
    } catch {}
  }

  if (!decoded) {
    return res.status(401).json({
      success: false,
      message: "Your session token has expired or is invalid. Please sign in again.",
    });
  }

  const userId = String(decoded.id || decoded.sub || decoded._id || "").trim();
  if (!userId) {
    return res.status(401).json({
      success: false,
      message: "Malformed token credentials.",
    });
  }

  let user = null;
  const cachedUserEntry = userAuthCache.get(String(userId));
  if (cachedUserEntry && Date.now() - cachedUserEntry.ts < USER_CACHE_TTL_MS) {
    user = cachedUserEntry.user;
  } else {
    user = await User.findById(userId);
    if (user) {
      userAuthCache.set(String(userId), { user, ts: Date.now() });
    }
  }

  if (!user && (decoded.email || decoded.role === "ADMIN")) {
    const adminDoc = await Admin.findById(userId);
    if (adminDoc) {
      user = await User.findOne({ email: adminDoc.email.toLowerCase() });
      if (!user) {
        user = await User.create({
          name: adminDoc.email.split("@")[0] || "Admin",
          email: adminDoc.email.toLowerCase(),
          passwordHash: adminDoc.password,
          role: adminDoc.role || decoded.role || ROLES.ADMIN,
          isActive: true,
          isEmailVerified: true,
        });
      }
    }
  }

  if (!user && (decoded.role === "vendor" || decoded.role === "VENDOR" || decoded.vendorId)) {
    const vendorDoc = await Vendor.findOne({
      $or: [
        { _id: userId.match(/^[0-9a-fA-F]{24}$/) ? userId : null },
        { vendorId: decoded.vendorId || userId },
      ],
    });
    if (vendorDoc) {
      req.user = vendorDoc;
      req.userId = vendorDoc._id.toString();
      req.userRole = ROLES.VENDOR;
      req.isVendor = true;
      req.vendorId = vendorDoc.vendorId;
      req.vendorName = vendorDoc.companyName;
      req.userPermissions = ROLE_DEFAULT_PERMISSIONS.VENDOR || [];
      req.isSuperAdmin = false;
      return next();
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

  if (
    decoded.tokenVersion !== undefined &&
    Number(decoded.tokenVersion) !== Number(user.tokenVersion || 0)
  ) {
    invalidateUserAuthCache(userId);
    return res.status(401).json({
      success: false,
      message: "Session invalidated due to password or security update. Please sign in again.",
    });
  }

  const resolved = await PermissionService.resolveUserPermissions(user);

  req.user = user;
  req.userId = user._id.toString();
  req.userPermissions = resolved.permissions;
  req.isSuperAdmin = resolved.isSuperAdmin;
  req.userRole = user.role;
  req.hrType = user.hrType || "";
  req.assignedVendors = Array.isArray(user.assignedVendors) ? user.assignedVendors : [];

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

export const requireVendorAccess = (paramName = "vendorId") => {
  return (req, res, next) => {
    if (req.isSuperAdmin || req.userRole === ROLES.SUPER_ADMIN || req.userRole === ROLES.ADMIN) {
      return next();
    }

    const targetVendor = req.params[paramName] || req.query[paramName] || req.body[paramName];

    if (req.userRole === ROLES.VENDOR || req.isVendor) {
      if (!targetVendor || String(targetVendor) === String(req.vendorId)) {
        return next();
      }
      return res.status(403).json({
        success: false,
        message: "Forbidden: You are only authorized to access your own vendor data.",
      });
    }

    if (req.userRole === ROLES.HR || req.userRole === ROLES.VENDOR_HR || req.hrType === "VENDOR_HR") {
      if (!targetVendor) return next();
      const assigned = req.assignedVendors || [];
      const hasAssignment = assigned.some(
        (v) => String(v).toLowerCase() === String(targetVendor).toLowerCase()
      );
      if (hasAssignment) {
        return next();
      }
      return res.status(403).json({
        success: false,
        message: "Forbidden: You are not assigned to this vendor.",
      });
    }

    return res.status(403).json({
      success: false,
      message: "Forbidden: Access restricted.",
    });
  };
};

export const blockEmployeeHR = (req, res, next) => {
  const roleNorm = String(req.userRole || req.user?.role || "")
    .toUpperCase()
    .replace(/[\s_-]/g, "");
  const hrTypeNorm = String(req.hrType || req.user?.hrType || "")
    .toUpperCase()
    .replace(/[\s_-]/g, "");
  if (
    !req.isSuperAdmin &&
    (roleNorm === "EMPLOYEEHR" || (roleNorm === "HR" && hrTypeNorm !== "VENDORHR"))
  ) {
    return res.status(403).json({
      success: false,
      message: "Forbidden: Employee HR cannot access Vendor CRM or recruitment resources.",
    });
  }
  return next();
};

export const blockVendorHR = (req, res, next) => {
  const roleNorm = String(req.userRole || req.user?.role || "")
    .toUpperCase()
    .replace(/[\s_-]/g, "");
  const hrTypeNorm = String(req.hrType || req.user?.hrType || "")
    .toUpperCase()
    .replace(/[\s_-]/g, "");
  if (
    !req.isSuperAdmin &&
    (roleNorm === "VENDORHR" || (roleNorm === "HR" && hrTypeNorm === "VENDORHR"))
  ) {
    return res.status(403).json({
      success: false,
      message: "Forbidden: Vendor HR cannot access internal employee, attendance, or leave resources.",
    });
  }
  return next();
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
    const ipAddress = req.ip || req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "";
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
  blockEmployeeHR,
  blockVendorHR,
  logAudit,
};
