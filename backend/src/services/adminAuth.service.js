import bcrypt from "bcryptjs";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import Admin from "../models/Admin.js";
import User from "../models/User.js";
import Session from "../models/Session.js";
import env from "../config/env.js";
import { ROLES } from "../constants/roles.js";
import PermissionService from "./permission.service.js";
import { verifyOtp as verifyOtpCode } from "./otp.service.js";
import { OTP_PURPOSES } from "../models/Otp.js";
import { ApiError } from "../utils/apiError.js";
import { escapeRegex } from "../utils/regex.js";

const MAX_FAILED_LOGIN_ATTEMPTS = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000;

export class AdminAuthService {
  static async login(email, password) {
    if (!email || !password) {
      throw new ApiError(400, "Email/ID and password are required");
    }

    const rawIdentifier = String(email).trim();
    const cleanEmail = rawIdentifier.toLowerCase();
    const cleanPassword = String(password).trim();
    const isEmailIdentifier = rawIdentifier.includes("@");
    const superAdminConfigEmail = (env.SUPER_ADMIN_EMAIL || env.SUPERADMIN_EMAIL || "")
      .trim()
      .toLowerCase();

    const userLookupQuery = isEmailIdentifier
      ? { email: cleanEmail }
      : {
          $or: [
            { email: cleanEmail },
            { hrId: rawIdentifier.toUpperCase() },
            { hrId: { $regex: new RegExp(`^${escapeRegex(rawIdentifier)}$`, "i") } },
          ],
        };

    const [userDoc, adminDoc] = await Promise.all([
      User.findOne(userLookupQuery).select("+passwordHash"),
      isEmailIdentifier ? Admin.findOne({ email: cleanEmail }) : Promise.resolve(null),
    ]);

    let user = userDoc;
    let admin = adminDoc;

    if (!user && !admin) {
      if (
        isEmailIdentifier &&
        superAdminConfigEmail &&
        cleanEmail === superAdminConfigEmail &&
        env.SUPERADMIN_PASSWORD &&
        cleanPassword === String(env.SUPERADMIN_PASSWORD).trim()
      ) {
        const hashedPassword = await bcrypt.hash(cleanPassword, 10);
        user = await User.create({
          name: env.SUPERADMIN_NAME || "Super Administrator",
          email: cleanEmail,
          passwordHash: hashedPassword,
          role: ROLES.SUPER_ADMIN,
          isActive: true,
          isEmailVerified: true,
        });
        admin = await Admin.create({
          email: cleanEmail,
          password: hashedPassword,
        });
      } else {
        throw new ApiError(401, "Invalid credentials");
      }
    } else if (user) {
      const normalizedRole = String(user.role || "").toUpperCase();
      if (![ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.HR].includes(normalizedRole)) {
        throw new ApiError(403, "Use the dedicated portal login for your role.");
      }
      if (user.isActive === false) {
        throw new ApiError(403, "Your account has been deactivated. Please contact your administrator.");
      }
      if (typeof user.isLocked === "function" && user.isLocked()) {
        const remainingMins = Math.max(1, Math.ceil((new Date(user.lockedUntil).getTime() - Date.now()) / 60000));
        throw new ApiError(423, `Account temporarily locked due to multiple failed sign-in attempts. Please retry in ${remainingMins} minute(s).`);
      }

      const isMatch = user.passwordHash
        ? await bcrypt.compare(cleanPassword, user.passwordHash)
        : false;
      if (!isMatch) {
        const nextAttempts = (user.failedLoginAttempts || 0) + 1;
        user.failedLoginAttempts = nextAttempts;
        if (nextAttempts >= MAX_FAILED_LOGIN_ATTEMPTS) {
          user.lockedUntil = new Date(Date.now() + LOCK_DURATION_MS);
        }
        await user.save();
        throw new ApiError(401, "Invalid credentials");
      }

      if (superAdminConfigEmail && user.email === superAdminConfigEmail) {
        user.role = ROLES.SUPER_ADMIN;
      }

      user.failedLoginAttempts = 0;
      user.lockedUntil = null;
      user.lastLoginAt = new Date();
      await user.save();

      if (!admin && [ROLES.SUPER_ADMIN, ROLES.ADMIN].includes(user.role)) {
        admin = await Admin.create({
          email: user.email,
          password: user.passwordHash,
        });
      } else if (admin && [ROLES.SUPER_ADMIN, ROLES.ADMIN].includes(user.role) && admin.password !== user.passwordHash) {
        admin.password = user.passwordHash;
        await admin.save();
      }
    } else if (admin) {
      const isMatch = admin.password
        ? await bcrypt.compare(cleanPassword, admin.password)
        : false;
      if (!isMatch) {
        throw new ApiError(401, "Invalid credentials");
      }

      const isSuper = Boolean(superAdminConfigEmail && admin.email === superAdminConfigEmail);
      user = await User.create({
        name: isSuper ? env.SUPERADMIN_NAME || "Super Administrator" : "Administrator",
        email: admin.email,
        passwordHash: admin.password,
        role: isSuper ? ROLES.SUPER_ADMIN : ROLES.ADMIN,
        isActive: true,
        isEmailVerified: true,
      });
    }

    const resolved = await PermissionService.resolveUserPermissions(user);

    const targetId = (user?._id || admin?._id).toString();

    const accessToken = jwt.sign(
      {
        id: targetId,
        _id: targetId,
        sub: targetId,
        role: user.role,
        hrType: user.hrType || "",
        hrId: user.hrId || "",
        assignedVendors: user.assignedVendors || [],
        email: user.email,
        isSuperAdmin: resolved.isSuperAdmin,
        tokenVersion: user.tokenVersion || 0,
      },
      env.JWT_SECRET,
      { expiresIn: "30d" }
    );

    const refreshToken = jwt.sign(
      { id: targetId },
      env.JWT_SECRET,
      { expiresIn: "30d" }
    );

    const refreshTokenHash = crypto
      .createHash("sha256")
      .update(refreshToken)
      .digest("hex");

    await Session.create({
      userId: targetId,
      token: refreshTokenHash,
      role: user.role,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });

    return {
      accessToken,
      refreshToken,
      admin: {
        id: user._id.toString(),
        _id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        hrType: user.hrType || "",
        assignedVendors: user.assignedVendors || [],
        isSuperAdmin: resolved.isSuperAdmin,
        permissions: resolved.permissions,
      },
    };
  }

  static async verifyOtp(email, otp) {
    if (!email || !otp) {
      throw new ApiError(400, "Email and OTP are required");
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const superAdminConfigEmail = (env.SUPER_ADMIN_EMAIL || env.SUPERADMIN_EMAIL || "")
      .trim()
      .toLowerCase();

    await verifyOtpCode({
      email: cleanEmail,
      otp: String(otp).trim(),
      purpose: OTP_PURPOSES.LOGIN_2FA,
    });

    let user = await User.findOne({ email: cleanEmail });
    const admin = await Admin.findOne({ email: cleanEmail });

    if (!user && !admin) {
      throw new ApiError(404, "Admin not found");
    }

    if (user) {
      const normalizedRole = String(user.role || "").toUpperCase();
      if (![ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.HR].includes(normalizedRole)) {
        throw new ApiError(403, "Use the dedicated portal login for your role.");
      }
      if (user.isActive === false) {
        throw new ApiError(403, "Your account has been deactivated.");
      }
    }

    if (!user && admin) {
      const isSuper = Boolean(superAdminConfigEmail && admin.email === superAdminConfigEmail);
      user = await User.create({
        name: isSuper ? env.SUPERADMIN_NAME || "Super Administrator" : "Administrator",
        email: admin.email,
        passwordHash: admin.password,
        role: isSuper ? ROLES.SUPER_ADMIN : ROLES.ADMIN,
        isActive: true,
        isEmailVerified: true,
      });
    }

    const resolved = await PermissionService.resolveUserPermissions(user);
    const targetId = user._id.toString();

    const accessToken = jwt.sign(
      {
        id: targetId,
        _id: targetId,
        sub: targetId,
        role: user.role,
        hrType: user.hrType || "",
        hrId: user.hrId || "",
        assignedVendors: user.assignedVendors || [],
        email: user.email,
        isSuperAdmin: resolved.isSuperAdmin,
        tokenVersion: user.tokenVersion || 0,
      },
      env.JWT_SECRET,
      { expiresIn: "30d" }
    );

    const refreshToken = jwt.sign(
      { id: targetId },
      env.JWT_SECRET,
      { expiresIn: "30d" }
    );

    const refreshTokenHash = crypto
      .createHash("sha256")
      .update(refreshToken)
      .digest("hex");

    await Session.create({
      userId: targetId,
      token: refreshTokenHash,
      role: user.role,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });

    return {
      accessToken,
      refreshToken,
      admin: {
        id: user._id.toString(),
        _id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        hrType: user.hrType || "",
        assignedVendors: user.assignedVendors || [],
        isSuperAdmin: resolved.isSuperAdmin,
        permissions: resolved.permissions,
      },
    };
  }

  static async getAdminProfile(adminId) {
    let user = await User.findById(adminId);
    if (!user) {
      const admin = await Admin.findById(adminId);
      if (admin) {
        user = await User.findOne({ email: admin.email });
      }
    }

    if (!user) {
      throw new ApiError(404, "Admin not found");
    }

    const resolved = await PermissionService.resolveUserPermissions(user);

    return {
      id: user._id.toString(),
      _id: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
      hrType: user.hrType || "",
      assignedVendors: user.assignedVendors || [],
      isActive: user.isActive,
      isSuperAdmin: resolved.isSuperAdmin,
      permissions: resolved.permissions,
    };
  }

  static async refreshToken(refreshToken) {
    if (!refreshToken) {
      throw new ApiError(401, "Refresh token missing");
    }

    let decoded;
    try {
      decoded = jwt.verify(refreshToken, env.JWT_SECRET);
    } catch {
      throw new ApiError(403, "Invalid refresh token");
    }

    const refreshTokenHash = crypto
      .createHash("sha256")
      .update(refreshToken)
      .digest("hex");

    const session = await Session.findOne({ token: refreshTokenHash });
    if (!session || (session.expiresAt && session.expiresAt < new Date())) {
      if (session) await Session.deleteOne({ _id: session._id });
      throw new ApiError(401, "Invalid or expired refresh token");
    }

    const user = await User.findById(decoded.id);
    if (!user) {
      await Session.deleteOne({ _id: session._id });
      throw new ApiError(401, "Account not found");
    }
    if (user.isActive === false) {
      await Session.deleteOne({ _id: session._id });
      throw new ApiError(403, "Your account has been deactivated.");
    }

    const resolved = await PermissionService.resolveUserPermissions(user);
    const role = user.role || ROLES.ADMIN;

    const accessToken = jwt.sign(
      {
        id: decoded.id,
        _id: decoded.id,
        sub: decoded.id,
        role,
        hrType: user.hrType || "",
        hrId: user.hrId || "",
        assignedVendors: user.assignedVendors || [],
        email: user.email,
        isSuperAdmin: resolved.isSuperAdmin,
        tokenVersion: user.tokenVersion || 0,
      },
      env.JWT_SECRET,
      { expiresIn: "30d" }
    );

    const newRefreshToken = jwt.sign(
      { id: decoded.id },
      env.JWT_SECRET,
      { expiresIn: "30d" }
    );

    const newHash = crypto
      .createHash("sha256")
      .update(newRefreshToken)
      .digest("hex");

    session.token = newHash;
    session.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    await session.save();

    return {
      accessToken,
      newRefreshToken,
    };
  }

  static async logout(refreshToken) {
    if (refreshToken) {
      const hash = crypto.createHash("sha256").update(refreshToken).digest("hex");
      await Session.deleteMany({ token: hash });
    }
  }

  static async logoutAll(refreshToken, adminId = null) {
    if (adminId) {
      await Session.deleteMany({ userId: String(adminId) });
      return;
    }
    if (!refreshToken) {
      throw new ApiError(400, "No refresh token found");
    }

    try {
      const decoded = jwt.verify(refreshToken, env.JWT_SECRET);
      await Session.deleteMany({ userId: decoded.id });
    } catch {}
  }
}

export default AdminAuthService;
