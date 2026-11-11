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
import { authenticateRBAC, requireRoles, blockEmployeeHR } from "../../middleware/rbac.middleware.js";

const router = express.Router();

router.use(authenticateRBAC, blockEmployeeHR);

router.post("/vendor", requireRoles("SUPER_ADMIN", "ADMIN"), assignVendorToProject);
router.post("/vendor-multi-projects", requireRoles("SUPER_ADMIN", "ADMIN"), assignVendorToMultipleProjects);
router.post("/project-multi-vendors", requireRoles("SUPER_ADMIN", "ADMIN"), assignMultipleVendorsToOneProject);
router.post("/remove-vendor", requireRoles("SUPER_ADMIN", "ADMIN"), removeVendorFromProject);
router.post("/vendor-hr", requireRoles("SUPER_ADMIN", "ADMIN"), assignVendorHRToProject);
router.post("/batch-hr", requireRoles("SUPER_ADMIN", "ADMIN"), batchAssignHRToProjectsAndVendors);
router.post("/remove", requireRoles("SUPER_ADMIN", "ADMIN"), removeAssignmentById);
router.delete("/:id", requireRoles("SUPER_ADMIN", "ADMIN"), removeAssignmentById);
router.get("/", requireRoles("SUPER_ADMIN", "ADMIN", "HR", "VENDOR_HR"), getProjectAssignments);

export default router;
