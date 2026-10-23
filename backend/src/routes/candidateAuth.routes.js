import express from "express";
import {
  registerCandidate,
  loginCandidate,
  getCandidateProfile,
  updateCandidateProfile,
  uploadCandidateDocument,
  getPublicAvailableProjects,
  applyForProject,
  getMyApplications,
  getCandidateApplicationMilestones,
  submitCandidateMilestonePayment,
  getCandidateNotifications,
  markCandidateNotificationAsRead,
} from "../controllers/candidateAuth.controller.js";
import { verifyToken, verifyCandidate } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/register", registerCandidate);
router.post("/login", loginCandidate);
router.get("/projects", getPublicAvailableProjects);

router.get("/me", verifyToken, getCandidateProfile);
router.put("/profile", verifyCandidate, updateCandidateProfile);
router.post("/upload-document", verifyCandidate, uploadCandidateDocument);
router.post("/documents", verifyCandidate, uploadCandidateDocument);
router.get("/documents", verifyCandidate, getCandidateProfile);
router.post("/apply", verifyCandidate, applyForProject);
router.get("/my-applications", verifyCandidate, getMyApplications);

router.get("/applications/:id/milestones", verifyCandidate, getCandidateApplicationMilestones);
router.post("/applications/:id/pay-milestone", verifyCandidate, submitCandidateMilestonePayment);
router.get("/notifications", verifyCandidate, getCandidateNotifications);
router.patch("/notifications/:id/read", verifyCandidate, markCandidateNotificationAsRead);

export default router;
