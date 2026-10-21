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
} from "../controllers/candidateAuth.controller.js";
import { verifyToken, verifyCandidate } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/register", registerCandidate);
router.post("/login", loginCandidate);
router.get("/projects", getPublicAvailableProjects);

router.get("/me", verifyToken, getCandidateProfile);
router.put("/profile", verifyCandidate, updateCandidateProfile);
router.post("/upload-document", verifyCandidate, uploadCandidateDocument);
router.post("/apply", verifyCandidate, applyForProject);
router.get("/my-applications", verifyCandidate, getMyApplications);

export default router;
