import jwt from "jsonwebtoken";
import env from "../config/env.js";
import { User } from "../models/User.js";
import Admin from "../models/Admin.js";
import Employee from "../models/Employee.js";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { verifyAccessToken } from "../utils/jwt.js";

/**
 * Enterprise Token Extractor
 */
export const extractToken = (req) => {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.split(" ")[1];
  }
  if (req.cookies?.accessToken) {
    return req.cookies.accessToken;
  }
  return null;
};

/**
 * Standard token verification helper
 */
export const verifyToken = (req, res, next) => {
  const token = extractToken(req);
  if (!token) {
    return res.status(401).json({ success: false, message: "No authentication token provided" });
  }

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ success: false, message: "Invalid or expired token" });
  }
};

/**
 * Admin Authentication Middleware
 */
export const verifyAdmin = (req, res, next) => {
  verifyToken(req, res, async () => {
    if (!req.user || (req.user.role !== "ADMIN" && req.user.role !== "SUPER_ADMIN")) {
      return res.status(403).json({ success: false, message: "Access forbidden. Admin role required." });
    }
    next();
  });
};

/**
 * Employee Authentication Middleware
 */
export const verifyEmployee = (req, res, next) => {
  verifyToken(req, res, async () => {
    const role = (req.user?.role || "").toLowerCase();
    if (!req.user || (role !== "employee" && role !== "admin" && role !== "super_admin")) {
      return res.status(403).json({ success: false, message: "Access forbidden. Employee role required." });
    }

    try {
      if (role === "employee") {
        const employee = await Employee.findById(req.user.id || req.user._id);
        if (!employee || employee.status === "inactive") {
          return res.status(403).json({ success: false, message: "Access forbidden. Account deactivated." });
        }
        req.employee = employee;
      }
      next();
    } catch (err) {
      return res.status(500).json({ success: false, message: "Internal server error validating employee" });
    }
  });
};

/**
 * Vista Core Enterprise User Authentication Middleware (Token Version / Session check)
 */
export const authenticate = asyncHandler(async (req, res, next) => {
  const token = extractToken(req);

  if (!token) {
    throw new ApiError(401, "Authentication token is missing or malformed");
  }

  let decoded;
  try {
    decoded = verifyAccessToken(token);
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      throw new ApiError(401, "Access token has expired. Please refresh your session.");
    }
    throw new ApiError(401, "Invalid access token");
  }

  const user = await User.findById(decoded.sub || decoded.id);

  if (!user || !user.isActive) {
    throw new ApiError(401, "User is no longer active or does not exist");
  }

  // Token version check (for immediate global logout invalidation)
  if (decoded.tokenVersion !== undefined && user.tokenVersion !== decoded.tokenVersion) {
    throw new ApiError(401, "Session has been invalidated. Please login again.");
  }

  req.user = user;
  next();
});

/**
 * RBAC: Role-based Authorization Middleware
 */
export const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      throw new ApiError(
        403,
        `Forbidden: Access restricted to [${allowedRoles.join(", ")}] roles only`
      );
    }
    next();
  };
};

export default {
  verifyToken,
  verifyAdmin,
  verifyEmployee,
  authenticate,
  authorizeRoles,
};