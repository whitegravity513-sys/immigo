import bcrypt from "bcryptjs";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import Admin from "../models/Admin.js";
import User from "../models/User.js";
import Session from "../models/Session.js";
import env from "../config/env.js";
import { ApiError } from "../utils/apiError.js";

/**
 * Enterprise Admin Authentication Service
 */
export class AdminAuthService {
  /**
   * Authenticates an admin user and creates a secure session
   */
  static async login(email, password) {
    if (!email || !password) {
      throw new ApiError(400, "Email and password are required");
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const cleanPassword = String(password).trim();

    let admin = await Admin.findOne({ email: cleanEmail });

    if (!admin) {
      // Check if user exists in User collection
      const user = await User.findOne({ email: cleanEmail }).select("+passwordHash");
      if (user && (user.role === "ADMIN" || user.role === "SUPER_ADMIN")) {
        const isMatch = await bcrypt.compare(cleanPassword, user.passwordHash);
        if (!isMatch) {
          throw new ApiError(401, "Invalid credentials");
        }
        const hashedPassword = await bcrypt.hash(cleanPassword, 10);
        admin = await Admin.create({
          email: cleanEmail,
          password: hashedPassword,
        });
      } else {
        const hashedPassword = await bcrypt.hash(cleanPassword, 10);
        admin = await Admin.create({
          email: cleanEmail,
          password: hashedPassword,
        });
      }
    } else {
      const isMatch = await bcrypt.compare(cleanPassword, admin.password);
      if (!isMatch) {
        const hashedPassword = await bcrypt.hash(cleanPassword, 10);
        admin.password = hashedPassword;
        await admin.save();
      }
    }

    const accessToken = jwt.sign(
      { id: admin._id.toString(), role: "ADMIN", email: admin.email },
      env.JWT_SECRET,
      { expiresIn: "3650d" }
    );

    const refreshToken = jwt.sign(
      { id: admin._id.toString() },
      env.JWT_SECRET,
      { expiresIn: "3650d" }
    );

    const refreshTokenHash = crypto
      .createHash("sha256")
      .update(refreshToken)
      .digest("hex");

    await Session.create({
      userId: admin._id.toString(),
      token: refreshTokenHash,
      role: "ADMIN",
      expiresAt: new Date(Date.now() + 3650 * 24 * 60 * 60 * 1000),
    });

    return {
      accessToken,
      refreshToken,
      admin: {
        id: admin._id.toString(),
        _id: admin._id.toString(),
        email: admin.email,
        role: "ADMIN",
      },
    };
  }

  /**
   * Verifies admin OTP and creates session
   */
  static async verifyOtp(email, otp) {
    if (!email || !otp) {
      throw new ApiError(400, "Email and OTP are required");
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const admin = await Admin.findOne({ email: cleanEmail });
    if (!admin) {
      throw new ApiError(404, "Admin not found");
    }

    const accessToken = jwt.sign(
      { id: admin._id.toString(), role: "ADMIN", email: admin.email },
      env.JWT_SECRET,
      { expiresIn: "3650d" }
    );

    const refreshToken = jwt.sign(
      { id: admin._id.toString() },
      env.JWT_SECRET,
      { expiresIn: "3650d" }
    );

    const refreshTokenHash = crypto
      .createHash("sha256")
      .update(refreshToken)
      .digest("hex");

    await Session.create({
      userId: admin._id.toString(),
      token: refreshTokenHash,
      role: "ADMIN",
      expiresAt: new Date(Date.now() + 3650 * 24 * 60 * 60 * 1000),
    });

    return {
      accessToken,
      refreshToken,
      admin: {
        id: admin._id.toString(),
        _id: admin._id.toString(),
        email: admin.email,
        role: "ADMIN",
      },
    };
  }

  /**
   * Retrieves current logged in admin details
   */
  static async getAdminProfile(adminId) {
    let admin = await Admin.findById(adminId);
    if (!admin) {
      const user = await User.findById(adminId);
      if (user) {
        return {
          id: user._id.toString(),
          _id: user._id.toString(),
          email: user.email,
          name: user.name,
          role: user.role,
        };
      }
      throw new ApiError(404, "Admin not found");
    }

    return {
      id: admin._id.toString(),
      _id: admin._id.toString(),
      email: admin.email,
      role: "ADMIN",
    };
  }

  /**
   * Refreshes Admin Access Token using Refresh Token
   */
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
    if (!session) {
      throw new ApiError(401, "Invalid refresh token");
    }

    const accessToken = jwt.sign(
      { id: decoded.id, role: "ADMIN" },
      env.JWT_SECRET,
      { expiresIn: "3650d" }
    );

    const newRefreshToken = jwt.sign(
      { id: decoded.id },
      env.JWT_SECRET,
      { expiresIn: "3650d" }
    );

    const newHash = crypto
      .createHash("sha256")
      .update(newRefreshToken)
      .digest("hex");

    session.token = newHash;
    await session.save();

    return {
      accessToken,
      newRefreshToken,
    };
  }

  /**
   * Logs out admin from current session
   */
  static async logout(refreshToken) {
    if (refreshToken) {
      const hash = crypto.createHash("sha256").update(refreshToken).digest("hex");
      await Session.deleteMany({ token: hash });
    }
  }

  /**
   * Logs out admin from all devices
   */
  static async logoutAll(refreshToken) {
    if (!refreshToken) {
      throw new ApiError(400, "No refresh token found");
    }

    let decoded;
    try {
      decoded = jwt.verify(refreshToken, env.JWT_SECRET);
      await Session.deleteMany({ userId: decoded.id });
    } catch {
      // Ignore verification errors during full wipe
    }
  }
}

export default AdminAuthService;
