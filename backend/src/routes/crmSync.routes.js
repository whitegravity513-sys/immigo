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
  getRefunds,
  createRefund,
  updateRefund,
} from "../controllers/crm/index.js";
import { authenticateRBAC, requireRoles, blockEmployeeHR } from "../middleware/rbac.middleware.js";

const router = express.Router();

const CRM_READ_ACTORS = ["SUPER_ADMIN", "ADMIN", "HR", "VENDOR_HR", "VENDOR"];
const CRM_MANAGE_ACTORS = ["SUPER_ADMIN", "ADMIN", "HR", "VENDOR_HR"];

router.use(authenticateRBAC, blockEmployeeHR);

router.get("/clients", requireRoles(...CRM_READ_ACTORS), getClients);
router.post("/clients", requireRoles(...CRM_MANAGE_ACTORS), saveClient);
router.delete("/clients/:id", requireRoles(...CRM_MANAGE_ACTORS), deleteClient);

router.get("/projects", requireRoles(...CRM_READ_ACTORS), getAvailableProjects);
router.post("/projects", requireRoles(...CRM_MANAGE_ACTORS), addOrUpdateProject);
router.delete("/clients/:clientId/projects/:projectId", requireRoles(...CRM_MANAGE_ACTORS), deleteProject);
router.delete("/projects/:projectId", requireRoles(...CRM_MANAGE_ACTORS), deleteProject);

router.get("/applications", requireRoles(...CRM_READ_ACTORS), getApplications);
router.post("/applications", requireRoles(...CRM_READ_ACTORS), submitApplication);
router.put("/applications/:id", requireRoles(...CRM_READ_ACTORS), updateApplicationStatus);

router.get("/notifications", requireRoles(...CRM_READ_ACTORS), getNotifications);
router.post("/notifications", requireRoles(...CRM_READ_ACTORS), createNotification);
router.put("/notifications/read-all", requireRoles(...CRM_READ_ACTORS), markAllNotificationsRead);
router.put("/notifications/:id/read", requireRoles(...CRM_READ_ACTORS), markNotificationRead);
router.delete("/notifications/:id", requireRoles(...CRM_READ_ACTORS), deleteNotification);
router.delete("/notifications", requireRoles(...CRM_READ_ACTORS), clearAllNotifications);

router.get("/candidates", requireRoles(...CRM_READ_ACTORS), getCandidates);
router.post("/candidates", requireRoles(...CRM_READ_ACTORS), saveCandidate);

router.get("/refunds", requireRoles(...CRM_READ_ACTORS), getRefunds);
router.post("/refunds", requireRoles(...CRM_READ_ACTORS), createRefund);
router.put("/refunds/:id", requireRoles("SUPER_ADMIN", "ADMIN"), updateRefund);

export default router;
