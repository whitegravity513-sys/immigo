import express from "express";
import { getHRActivities } from "../../controllers/v1/hrActivity.controller.js";
import { authenticateRBAC, requireRoles, blockEmployeeHR } from "../../middleware/rbac.middleware.js";

const router = express.Router();

router.use(authenticateRBAC, requireRoles("SUPER_ADMIN", "ADMIN", "HR", "VENDOR_HR"), blockEmployeeHR);

router.get("/", getHRActivities);

export default router;
