import express from "express";
import { employeeLogin } from "../controllers/employeeAuth.controller.js";
import { authLimiter } from "../middleware/rateLimit.middleware.js";

const router = express.Router();

router.post("/login", authLimiter, employeeLogin);

export default router;
