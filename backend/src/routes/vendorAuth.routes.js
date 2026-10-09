import express from "express";
import { vendorRegister, vendorLogin, getVendorMe } from "../controllers/vendorAuth.controller.js";
import { verifyToken } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/register", vendorRegister);
router.post("/login", vendorLogin);
router.get("/me", verifyToken, getVendorMe);

export default router;
