import { RefreshToken } from "../models/RefreshToken.js";
import { User } from "../models/User.js";
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from "../utils/jwt.js";
import { hashToken } from "../utils/crypto.js";
import { ApiError } from "../utils/apiError.js";

/**
 * Standard cookie configuration for refresh tokens
 */
export const getRefreshTokenCookieOptions = () => {
  const isProduction = process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: "/api/auth",
  };
};

/**
 * Create a new user session with access and refresh tokens
 */
export const createSession = async (user, req = {}) => {
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  const refreshTokenHash = hashToken(refreshToken);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const userAgent = req.headers ? req.headers["user-agent"] : null;
  const ipAddress = req.ip || req.connection?.remoteAddress || null;

  await RefreshToken.create({
    userId: user._id,
    tokenHash: refreshTokenHash,
    expiresAt,
    userAgent,
    ipAddress,
  });

  return {
    accessToken,
    refreshToken,
    expiresAt,
  };
};

/**
 * Refresh token rotation: verify, invalidate old token, issue new pair
 */
export const rotateRefreshToken = async (rawRefreshToken, req = {}) => {
  if (!rawRefreshToken) {
    throw new ApiError(401, "Refresh token is required");
  }

  let decoded;
  try {
    decoded = verifyRefreshToken(rawRefreshToken);
  } catch (error) {
    throw new ApiError(401, "Invalid or expired refresh token");
  }

  const tokenHash = hashToken(rawRefreshToken);
  const storedToken = await RefreshToken.findOne({
    tokenHash,
    revokedAt: null,
  });

  if (!storedToken) {
    throw new ApiError(401, "Refresh token not found or already revoked");
  }

  const user = await User.findById(decoded.sub);
  if (!user || !user.isActive) {
    throw new ApiError(401, "User account not active or no longer exists");
  }

  if (user.tokenVersion !== decoded.tokenVersion) {
    throw new ApiError(401, "Session invalidated due to security event");
  }

  // Revoke old token
  storedToken.revokedAt = new Date();
  await storedToken.save();

  // Create new session (token rotation)
  return createSession(user, req);
};

/**
 * Revoke specific refresh token on logout
 */
export const revokeRefreshToken = async (rawRefreshToken) => {
  if (!rawRefreshToken) return;
  const tokenHash = hashToken(rawRefreshToken);
  await RefreshToken.findOneAndUpdate(
    { tokenHash, revokedAt: null },
    { revokedAt: new Date() }
  );
};

/**
 * Revoke all sessions for a user (Logout from all devices / Password change)
 */
export const revokeAllSessions = async (userId) => {
  await User.findByIdAndUpdate(userId, {
    $inc: { tokenVersion: 1 },
  });

  await RefreshToken.updateMany(
    { userId, revokedAt: null },
    { revokedAt: new Date() }
  );
};

export default {
  getRefreshTokenCookieOptions,
  createSession,
  rotateRefreshToken,
  revokeRefreshToken,
  revokeAllSessions,
};
