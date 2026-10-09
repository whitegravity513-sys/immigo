import express from "express";
import {
  vendorRegister,
  vendorLogin,
  getVendorMe,
  uploadVendorDocuments,
  signVendorMou,
  updateVendorProfile,
} from "../controllers/vendorAuth.controller.js";
import { verifyToken } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/register", vendorRegister);
router.post("/login", vendorLogin);
router.get("/me", verifyToken, getVendorMe);
router.post("/upload-documents", verifyToken, uploadVendorDocuments);
router.post("/sign-mou", verifyToken, signVendorMou);
router.put("/profile", verifyToken, updateVendorProfile);

export default router;
