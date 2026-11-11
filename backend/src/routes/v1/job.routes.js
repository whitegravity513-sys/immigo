import express from "express";
import {
  createJob,
  getJobs,
  getJobById,
  updateJob,
} from "../../controllers/v1/job.controller.js";
import { authenticateRBAC, requireRoles, blockEmployeeHR } from "../../middleware/rbac.middleware.js";

const router = express.Router();

router.use(authenticateRBAC, blockEmployeeHR);

router.post("/", requireRoles("SUPER_ADMIN", "ADMIN"), createJob);
router.get("/", requireRoles("SUPER_ADMIN", "ADMIN", "HR", "VENDOR_HR"), getJobs);
router.get("/:id", requireRoles("SUPER_ADMIN", "ADMIN", "HR", "VENDOR_HR"), getJobById);
router.put("/:id", requireRoles("SUPER_ADMIN", "ADMIN"), updateJob);

export default router;
