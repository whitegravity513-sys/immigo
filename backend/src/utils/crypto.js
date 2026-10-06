import crypto from "crypto";

export const generateOtp = (length = 6) => {
  const min = Math.pow(10, length - 1);
  const max = Math.pow(10, length) - 1;
  return crypto.randomInt(min, max + 1).toString();
};

export const hashToken = (token) => {
  if (!token) return null;
  return crypto.createHash("sha256").update(String(token)).digest("hex");
};

export const generateRandomToken = (bytes = 32) => {
  return crypto.randomBytes(bytes).toString("hex");
};

export const timingSafeCompare = (a, b) => {
  if (typeof a !== "string" || typeof b !== "string") return false;
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
};

export default {
  generateOtp,
  hashToken,
  generateRandomToken,
  timingSafeCompare,
};