import express from "express";
import {
  createJob,
  getJobs,
  getJobById,
  updateJob,
} from "../../controllers/v1/job.controller.js";
import { authenticateRBAC } from "../../middleware/rbac.middleware.js";

const router = express.Router();

router.use(authenticateRBAC);

router.post("/", createJob);
router.get("/", getJobs);
router.get("/:id", getJobById);
router.put("/:id", updateJob);

export default router;
