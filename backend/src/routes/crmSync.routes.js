import express from "express";
import {
  getClients,
  saveClient,
  addOrUpdateProject,
  getAvailableProjects,
  getApplications,
  submitApplication,
  updateApplicationStatus,
  getNotifications,
  createNotification,
  getCandidates,
  saveCandidate,
} from "../controllers/crmSync.controller.js";

const router = express.Router();

router.get("/clients", getClients);
router.post("/clients", saveClient);
router.post("/projects", addOrUpdateProject);
router.get("/projects", getAvailableProjects);
router.get("/applications", getApplications);
router.post("/applications", submitApplication);
router.put("/applications/:id", updateApplicationStatus);
router.get("/notifications", getNotifications);
router.post("/notifications", createNotification);
router.get("/candidates", getCandidates);
router.post("/candidates", saveCandidate);

export default router;
