import express from "express";
import {
  getHolidays,
  createHoliday,
  updateHoliday,
  deleteHoliday,
} from "../../controllers/adminHoliday.controller.js";
import {
  getAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
} from "../../controllers/adminAnnouncement.controller.js";
import { authenticateRBAC, requireRoles, blockVendorHR } from "../../middleware/rbac.middleware.js";
import { validateCreateAnnouncement } from "../../validators/announcement.validator.js";

const router = express.Router();
const internalWorkforceGuard = [
  authenticateRBAC,
  blockVendorHR,
  requireRoles("SUPER_ADMIN", "ADMIN", "HR", "EMPLOYEE_HR"),
];

router.get("/holidays", ...internalWorkforceGuard, getHolidays);
router.post("/holidays", ...internalWorkforceGuard, createHoliday);
router.put("/holidays/:id", ...internalWorkforceGuard, updateHoliday);
router.delete("/holidays/:id", ...internalWorkforceGuard, deleteHoliday);

router.get("/announcements", ...internalWorkforceGuard, getAnnouncements);
router.post("/announcements", ...internalWorkforceGuard, validateCreateAnnouncement, createAnnouncement);
router.put("/announcements/:id", ...internalWorkforceGuard, updateAnnouncement);
router.delete("/announcements/:id", ...internalWorkforceGuard, deleteAnnouncement);

export default router;
