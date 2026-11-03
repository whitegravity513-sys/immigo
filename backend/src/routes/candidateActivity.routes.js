import express from "express";
import {
  getCandidateActivityHistory,
  addCandidateProcessRemark,
  getCandidateProcessDetails,
} from "../controllers/candidateActivity.controller.js";
import { authenticateRBAC } from "../middleware/rbac.middleware.js";

const router = express.Router();

router.get("/candidates/:candidateId/activities", authenticateRBAC, getCandidateActivityHistory);
router.post("/candidates/:candidateId/remarks", authenticateRBAC, addCandidateProcessRemark);
router.get("/candidates/:candidateId/process-details", authenticateRBAC, getCandidateProcessDetails);

export default router;

