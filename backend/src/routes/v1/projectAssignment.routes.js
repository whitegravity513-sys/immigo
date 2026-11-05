import express from "express";
import {
  assignVendorToProject,
  assignVendorToMultipleProjects,
  assignMultipleVendorsToOneProject,
  removeVendorFromProject,
  assignVendorHRToProject,
  batchAssignHRToProjectsAndVendors,
  removeAssignmentById,
  getProjectAssignments,
} from "../../controllers/v1/projectAssignment.controller.js";
import { authenticateRBAC } from "../../middleware/rbac.middleware.js";

const router = express.Router();

router.use(authenticateRBAC);

router.post("/vendor", assignVendorToProject);
router.post("/vendor-multi-projects", assignVendorToMultipleProjects);
router.post("/project-multi-vendors", assignMultipleVendorsToOneProject);
router.post("/remove-vendor", removeVendorFromProject);
router.post("/vendor-hr", assignVendorHRToProject);
router.post("/batch-hr", batchAssignHRToProjectsAndVendors);
router.post("/remove", removeAssignmentById);
router.delete("/:id", removeAssignmentById);
router.get("/", getProjectAssignments);

export default router;
