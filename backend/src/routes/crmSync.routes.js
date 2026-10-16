import express from "express";
import {
  getClients,
  saveClient,
  deleteClient,
  addOrUpdateProject,
  deleteProject,
  getAvailableProjects,
  getApplications,
  submitApplication,
  updateApplicationStatus,
  getNotifications,
  createNotification,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  clearAllNotifications,
  getCandidates,
  saveCandidate,
} from "../controllers/crm/index.js";

const router = express.Router();

// Clients
router.get("/clients", getClients);
router.post("/clients", saveClient);
router.delete("/clients/:id", deleteClient);

// Projects
router.get("/projects", getAvailableProjects);
router.post("/projects", addOrUpdateProject);
router.delete("/clients/:clientId/projects/:projectId", deleteProject);
router.delete("/projects/:projectId", deleteProject);

// Applications
router.get("/applications", getApplications);
router.post("/applications", submitApplication);
router.put("/applications/:id", updateApplicationStatus);

// Notifications
router.get("/notifications", getNotifications);
router.post("/notifications", createNotification);
router.put("/notifications/:id/read", markNotificationRead);
router.put("/notifications/read-all", markAllNotificationsRead);
router.delete("/notifications/:id", deleteNotification);
router.delete("/notifications", clearAllNotifications);

// Candidates
router.get("/candidates", getCandidates);
router.post("/candidates", saveCandidate);

export default router;
