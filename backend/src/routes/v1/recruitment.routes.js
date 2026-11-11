import express from "express";
import {
  submitCandidate,
  updateCandidateStage,
  scheduleInterview,
  recordInterviewFeedback,
  reassignCandidateApplication,
  getApplications,
  getInterviews,
} from "../../controllers/v1/recruitment.controller.js";
import { authenticateRBAC, requireRoles, blockEmployeeHR } from "../../middleware/rbac.middleware.js";

const router = express.Router();

router.use(authenticateRBAC, requireRoles("SUPER_ADMIN", "ADMIN", "HR", "VENDOR_HR"), blockEmployeeHR);

router.post("/candidates", submitCandidate);
router.put("/applications/:id/stage", updateCandidateStage);
router.post("/applications/:id/reassign", reassignCandidateApplication);
router.post("/interviews", scheduleInterview);
router.put("/interviews/:id/feedback", recordInterviewFeedback);
router.get("/applications", getApplications);
router.get("/interviews", getInterviews);

export default router;
