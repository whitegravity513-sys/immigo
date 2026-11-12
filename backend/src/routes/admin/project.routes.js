import express from "express";
import {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
} from "../../controllers/project.controller.js";
import { authenticateRBAC, requireRoles } from "../../middleware/rbac.middleware.js";
import {
  validateCreateProject,
  validateUpdateProject,
} from "../../validators/project.validator.js";

const router = express.Router();

const requireAdminAccess = [authenticateRBAC, requireRoles("SUPER_ADMIN", "ADMIN")];

router.post("/projects", ...requireAdminAccess, validateCreateProject, createProject);
router.get("/projects", ...requireAdminAccess, getProjects);
router.get("/projects/:id", ...requireAdminAccess, getProjectById);
router.put("/projects/:id", ...requireAdminAccess, validateUpdateProject, updateProject);
router.delete("/projects/:id", ...requireAdminAccess, deleteProject);

export default router;
