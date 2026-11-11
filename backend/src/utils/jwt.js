import jwt from "jsonwebtoken";
import env, { getJwtVerificationSecrets } from "../config/env.js";

export const generateAccessToken = (user) => {
  return jwt.sign(
    {
      sub: user._id.toString(),
      email: user.email,
      role: user.role,
      tokenVersion: user.tokenVersion || 0,
    },
    env.JWT_ACCESS_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRES || "30d",
    }
  );
};

export const generateRefreshToken = (user) => {
  return jwt.sign(
    {
      sub: user._id.toString(),
      tokenVersion: user.tokenVersion || 0,
    },
    env.JWT_REFRESH_SECRET,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRES || "30d",
    }
  );
};

export const verifyAccessToken = (token) => {
  let lastError = null;
  for (const secret of getJwtVerificationSecrets()) {
    try {
      return jwt.verify(token, secret);
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError || new Error("Invalid access token");
};

export const verifyRefreshToken = (token) => {
  const secrets = Array.from(
    new Set([env.JWT_REFRESH_SECRET, env.JWT_SECRET].filter(Boolean))
  );
  let lastError = null;
  for (const secret of secrets) {
    try {
      return jwt.verify(token, secret);
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError || new Error("Invalid refresh token");
};

export default {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
};
