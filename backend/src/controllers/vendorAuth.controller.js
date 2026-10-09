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

  // Notify Admin of new vendor registration
  try {
    const Notification = (await import("../models/Notification.js")).default;
    await Notification.create({
      type: "VENDOR_REGISTERED",
      title: `New Vendor Registered: ${newVendor.companyName}`,
      message: `${newVendor.companyName} (${newVendor.vendorId}) has registered as a recruitment agency partner. Documents review pending.`,
      targetRole: "ADMIN",
      targetType: "ALL",
      metadata: { vendorId: newVendor._id, vendorCode: newVendor.vendorId },
    });
  } catch (err) {
    console.error("Failed to notify admin of vendor registration:", err.message);
  }

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
  const vendorId = req.user.id || req.user._id;
  const vendor = await Vendor.findById(vendorId);
  
  if (!vendor) {
    throw new ApiError(404, "Vendor not found");
  }
  
  return res.status(200).json({
    vendor,
  });
});

export const uploadVendorDocuments = asyncHandler(async (req, res) => {
  const vendorId = req.user.id || req.user._id;
  const { documents, bankDetails } = req.body;

  const vendor = await Vendor.findById(vendorId);
  if (!vendor) {
    throw new ApiError(404, "Vendor not found");
  }

  if (Array.isArray(documents) && documents.length > 0) {
    vendor.documents = documents;
    vendor.documentsUploaded = true;
  }
  if (bankDetails) {
    vendor.bankDetails = bankDetails;
  }

  vendor.status = "Under Review";
  vendor.onboardingStage = "DOCS_SUBMITTED";
  await vendor.save();

  // Create Notification for Admin
  try {
    const Notification = (await import("../models/Notification.js")).default;
    await Notification.create({
      type: "DOCUMENT_UPLOAD",
      title: `Vendor Documents Submitted: ${vendor.companyName}`,
      message: `${vendor.companyName} (${vendor.vendorId}) has uploaded compliance documents for review.`,
      targetRole: "ADMIN",
      targetType: "ALL",
      metadata: { vendorId: vendor._id, vendorCode: vendor.vendorId },
    });
  } catch (err) {
    console.error("Failed to create admin notification:", err.message);
  }

  return res.status(200).json({
    message: "Documents submitted successfully for Admin review",
    vendor,
  });
});

export const signVendorMou = asyncHandler(async (req, res) => {
  const vendorId = req.user.id || req.user._id;
  const { signatoryName, designation, signatureData, signedFileUrl } = req.body;

  const vendor = await Vendor.findById(vendorId);
  if (!vendor) {
    throw new ApiError(404, "Vendor not found");
  }

  vendor.mouSigned = true;
  vendor.mouStatus = "Signed";
  vendor.status = "Pending MOU Approval";
  vendor.onboardingStage = "MOU_SIGNED";
  vendor.signedMou = {
    signatoryName: signatoryName || vendor.contactPersonName,
    designation: designation || "Authorized Signatory",
    signatureData: signatureData || "Digitally Signed",
    signedFileUrl: signedFileUrl || "",
    signedAt: new Date(),
  };

  await vendor.save();

  // Create Notification for Admin
  try {
    const Notification = (await import("../models/Notification.js")).default;
    await Notification.create({
      type: "DOCUMENT_UPDATE",
      title: `MOU Signed: ${vendor.companyName}`,
      message: `${vendor.companyName} (${vendor.vendorId}) has digitally signed and submitted the MOU. Vendor dashboard is active.`,
      targetRole: "ADMIN",
      targetType: "ALL",
      metadata: { vendorId: vendor._id, vendorCode: vendor.vendorId },
    });
  } catch (err) {
    console.error("Failed to create admin notification:", err.message);
  }

  return res.status(200).json({
    message: "MOU agreement signed successfully. Account fully activated!",
    vendor,
  });
});

export const updateVendorProfile = asyncHandler(async (req, res) => {
  const vendorId = req.user.id || req.user._id;
  const vendor = await Vendor.findByIdAndUpdate(vendorId, req.body, { new: true, runValidators: true });
  if (!vendor) {
    throw new ApiError(404, "Vendor not found");
  }

  // Create Notification for Admin
  try {
    const Notification = (await import("../models/Notification.js")).default;
    await Notification.create({
      type: "VENDOR_UPDATED",
      title: `Vendor Profile Updated: ${vendor.companyName}`,
      message: `${vendor.companyName} (${vendor.vendorId}) updated their company profile details.`,
      targetRole: "ADMIN",
      targetType: "ALL",
      metadata: { vendorId: vendor._id, vendorCode: vendor.vendorId },
    });
  } catch (err) {
    console.error("Admin notification error:", err.message);
  }

  return res.status(200).json({
    message: "Profile updated successfully",
    vendor,
  });
});

export default {
  vendorRegister,
  vendorLogin,
  getVendorMe,
  uploadVendorDocuments,
  signVendorMou,
  updateVendorProfile,
};
