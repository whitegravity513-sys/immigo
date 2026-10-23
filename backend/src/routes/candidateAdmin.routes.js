import express from "express";
import {
  getCandidateStats,
  getCandidates,
  getCandidateById,
  approveCandidateRegistration,
  rejectCandidateRegistration,
  updateCandidateInternalRemarks,
  verifyCandidateDocument,
  rejectCandidateDocument,
  getCandidateApplications,
  updateApplicationStatus,
  scheduleCandidateInterview,
  getApplicationMilestones,
  updateApplicationMilestones,
  updateStageStatus,
  recordApplicationPayment,
  deleteCandidate,
} from "../controllers/candidateAdmin.controller.js";
import { verifyAdmin } from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(verifyAdmin);

router.get("/stats", getCandidateStats);
router.get("/list", getCandidates);
router.get("/applications/list", getCandidateApplications);
router.patch("/applications/:id/status", updateApplicationStatus);
router.post("/applications/:id/schedule-interview", scheduleCandidateInterview);

router.get("/applications/:id/milestones", getApplicationMilestones);
router.put("/applications/:id/milestones", updateApplicationMilestones);
router.patch("/applications/:id/milestones/:milestoneId/stages/:stageId", updateStageStatus);
router.post("/applications/:id/milestones/:milestoneId/record-payment", recordApplicationPayment);

router.get("/:id", getCandidateById);
router.delete("/:id", deleteCandidate);
router.post("/:id/approve", approveCandidateRegistration);
router.post("/:id/reject", rejectCandidateRegistration);
router.put("/:id/remarks", updateCandidateInternalRemarks);
router.post("/:id/documents/:docId/verify", verifyCandidateDocument);
router.post("/:id/documents/:docId/reject", rejectCandidateDocument);

export default router;
