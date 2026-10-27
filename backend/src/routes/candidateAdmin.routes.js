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
import { requirePermission } from "../middleware/rbac.middleware.js";

const router = express.Router();

router.get("/stats", requirePermission("candidates.view"), getCandidateStats);
router.get("/list", requirePermission("candidates.view"), getCandidates);
router.get("/applications/list", requirePermission("candidates.view"), getCandidateApplications);
router.patch("/applications/:id/status", requirePermission("candidates.update"), updateApplicationStatus);
router.post("/applications/:id/schedule-interview", requirePermission("candidates.update"), scheduleCandidateInterview);

router.get("/applications/:id/milestones", requirePermission("candidates.view"), getApplicationMilestones);
router.put("/applications/:id/milestones", requirePermission("candidates.update"), updateApplicationMilestones);
router.patch("/applications/:id/milestones/:milestoneId/stages/:stageId", requirePermission("candidates.update"), updateStageStatus);
router.post("/applications/:id/milestones/:milestoneId/record-payment", requirePermission("finance.create"), recordApplicationPayment);

router.get("/:id", requirePermission("candidates.view"), getCandidateById);
router.delete("/:id", requirePermission("candidates.delete"), deleteCandidate);
router.post("/:id/approve", requirePermission("candidates.approve"), approveCandidateRegistration);
router.post("/:id/reject", requirePermission("candidates.approve"), rejectCandidateRegistration);
router.put("/:id/remarks", requirePermission("candidates.update"), updateCandidateInternalRemarks);
router.post("/:id/documents/:docId/verify", requirePermission("candidates.approve"), verifyCandidateDocument);
router.post("/:id/documents/:docId/reject", requirePermission("candidates.approve"), rejectCandidateDocument);

export default router;
