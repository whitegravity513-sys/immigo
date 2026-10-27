import express from "express";
import {
  getLeaves,
  updateLeaveStatus,
} from "../../controllers/adminLeave.controller.js";
import { requirePermission } from "../../middleware/rbac.middleware.js";

const router = express.Router();

router.get("/leaves", requirePermission("leaves.view"), getLeaves);
router.put("/leaves/:id", requirePermission("leaves.approve"), updateLeaveStatus);

export default router;
