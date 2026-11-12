import express from "express";
import {
  vendorRegister,
  vendorLogin,
  getVendorMe,
  uploadVendorDocuments,
  signVendorMou,
  updateVendorProfile,
  vendorForgotPassword,
  vendorResetPassword,
} from "../controllers/vendorAuth.controller.js";
import { verifyVendor } from "../middleware/auth.middleware.js";
import { authLimiter, otpLimiter } from "../middleware/rateLimit.middleware.js";

const router = express.Router();

router.post("/register", authLimiter, vendorRegister);
router.post("/login", authLimiter, vendorLogin);
router.post("/forgot-password", otpLimiter, vendorForgotPassword);
router.post("/reset-password", authLimiter, vendorResetPassword);
router.get("/me", verifyVendor, getVendorMe);
router.post("/upload-documents", verifyVendor, uploadVendorDocuments);
router.post("/sign-mou", verifyVendor, signVendorMou);
router.put("/profile", verifyVendor, updateVendorProfile);

export default router;
