import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Vendor from "../models/Vendor.js";
import env from "../config/env.js";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const vendorRegister = asyncHandler(async (req, res) => {
  const { email, password, companyName } = req.body;

  if (!email || !password || !companyName) {
    throw new ApiError(400, "Email, password, and companyName are required");
  }

  const existingVendor = await Vendor.findOne({ email: email.toLowerCase() });
  if (existingVendor) {
    throw new ApiError(400, "This email is already registered as a vendor. Please sign in.");
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const vendorId = `VND-${Math.floor(1000 + Math.random() * 9000)}`;

  const newVendor = await Vendor.create({
    ...req.body,
    vendorId,
    email: email.toLowerCase(),
    password: hashedPassword,
    status: "Pending", // Admin will approve it later
  });

  const token = jwt.sign(
    {
      id: newVendor._id.toString(),
      vendorId: newVendor.vendorId,
      companyName: newVendor.companyName,
      role: "vendor",
    },
    env.JWT_SECRET,
    { expiresIn: "7d" }
  );

  return res.status(201).json({
    message: "Vendor registered successfully",
    token,
    vendor: newVendor,
  });
});

export const vendorLogin = asyncHandler(async (req, res) => {
  const { emailOrId, password } = req.body;
  const identifier = String(emailOrId || "").trim().toLowerCase();

  if (!identifier || !password) {
    throw new ApiError(400, "Email/Vendor ID and password are required");
  }

  const vendor = await Vendor.findOne({
    $or: [{ email: identifier }, { vendorId: identifier.toUpperCase() }],
  });

  if (!vendor) {
    throw new ApiError(401, "Invalid Vendor ID/Email or Password.");
  }

  if (vendor.status === "Rejected") {
    throw new ApiError(403, `Your vendor account application was Rejected by Admin. Reason: ${vendor.rejectionReason || "Verification criteria not met."}`);
  }

  if (vendor.status === "Suspended") {
    throw new ApiError(403, "Your vendor account has been temporarily Suspended. Please contact Admin.");
  }

  // Also support plaintext login for existing hardcoded ones if needed, but normally use bcrypt
  const isMatch = await bcrypt.compare(password, vendor.password);
  
  if (!isMatch) {
    throw new ApiError(401, "Invalid Vendor ID/Email or Password.");
  }

  const token = jwt.sign(
    {
      id: vendor._id.toString(),
      vendorId: vendor.vendorId,
      companyName: vendor.companyName,
      role: "vendor",
    },
    env.JWT_SECRET,
    { expiresIn: "7d" }
  );

  return res.status(200).json({
    message: "Vendor logged in successfully",
    token,
    vendor,
  });
});

export const getVendorMe = asyncHandler(async (req, res) => {
  const vendorId = req.user.id;
  const vendor = await Vendor.findById(vendorId);
  
  if (!vendor) {
    throw new ApiError(404, "Vendor not found");
  }
  
  return res.status(200).json({
    vendor
  });
});

export default {
  vendorRegister,
  vendorLogin,
  getVendorMe
};
