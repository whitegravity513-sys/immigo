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
import { verifyToken } from "../middleware/auth.middleware.js";
import { authLimiter, otpLimiter } from "../middleware/rateLimit.middleware.js";

const router = express.Router();

router.post("/register", vendorRegister);
router.post("/login", authLimiter, vendorLogin);
router.post("/forgot-password", otpLimiter, vendorForgotPassword);
router.post("/reset-password", authLimiter, vendorResetPassword);
router.get("/me", verifyToken, getVendorMe);
router.post("/upload-documents", verifyToken, uploadVendorDocuments);
router.post("/sign-mou", verifyToken, signVendorMou);
router.put("/profile", verifyToken, updateVendorProfile);

export default router;
