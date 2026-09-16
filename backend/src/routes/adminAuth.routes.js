import express from "express";
import {
  adminLogin,
  verifyAdminOtp,
  getAdmin,
  refreshAdminToken,
  logoutAdmin,
  logoutAllAdmin,
} from "../controllers/adminAuth.controller.js";
import { verifyAdmin } from "../middleware/auth.middleware.js";
import { authLimiter, otpLimiter } from "../middleware/rateLimit.middleware.js";

const router = express.Router();

router.post("/login", authLimiter, adminLogin);
router.post("/verify-otp", otpLimiter, verifyAdminOtp);
router.get("/me", verifyAdmin, getAdmin);
router.post("/refresh-token", refreshAdminToken);
router.post("/logout", logoutAdmin);
router.post("/logout-all", verifyAdmin, logoutAllAdmin);

export default router;
