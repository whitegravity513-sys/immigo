import express from "express";
import {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
} from "../../controllers/project.controller.js";
import { verifyAdmin } from "../../middleware/auth.middleware.js";
import {
  validateCreateProject,
  validateUpdateProject,
} from "../../validators/project.validator.js";

const router = express.Router();

router.post("/projects", verifyAdmin, validateCreateProject, createProject);
router.get("/projects", verifyAdmin, getProjects);
router.get("/projects/:id", verifyAdmin, getProjectById);
router.put("/projects/:id", verifyAdmin, validateUpdateProject, updateProject);
router.delete("/projects/:id", verifyAdmin, deleteProject);

export default router;
