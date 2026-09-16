import bcrypt from "bcryptjs";

const SALT_ROUNDS = Number(process.env.BCRYPT_ROUNDS || 12);

export const hashPassword = async (password) => {
  if (!password) throw new Error("Password is required for hashing");
  return bcrypt.hash(password, SALT_ROUNDS);
};

export const comparePassword = async (plainPassword, hashedPassword) => {
  if (!plainPassword || !hashedPassword) return false;
  return bcrypt.compare(plainPassword, hashedPassword);
};

export default {
  hashPassword,
  comparePassword,
};