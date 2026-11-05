import express from "express";
import {
  submitCandidate,
  updateCandidateStage,
  scheduleInterview,
  recordInterviewFeedback,
  getApplications,
  getInterviews,
} from "../../controllers/v1/recruitment.controller.js";
import { authenticateRBAC } from "../../middleware/rbac.middleware.js";

const router = express.Router();

router.use(authenticateRBAC);

router.post("/candidates", submitCandidate);
router.put("/applications/:id/stage", updateCandidateStage);
router.post("/interviews", scheduleInterview);
router.put("/interviews/:id/feedback", recordInterviewFeedback);
router.get("/applications", getApplications);
router.get("/interviews", getInterviews);

export default router;
