import express from "express";
import {
  getHolidays,
  createHoliday,
  deleteHoliday,
} from "../../controllers/adminHoliday.controller.js";
import {
  getAnnouncements,
  createAnnouncement,
  deleteAnnouncement,
} from "../../controllers/adminAnnouncement.controller.js";
import { verifyAdmin } from "../../middleware/auth.middleware.js";
import { validateCreateAnnouncement } from "../../validators/announcement.validator.js";

const router = express.Router();

router.get("/holidays", verifyAdmin, getHolidays);
router.post("/holidays", verifyAdmin, createHoliday);
router.delete("/holidays/:id", verifyAdmin, deleteHoliday);

router.get("/announcements", verifyAdmin, getAnnouncements);
router.post("/announcements", verifyAdmin, validateCreateAnnouncement, createAnnouncement);
router.delete("/announcements/:id", verifyAdmin, deleteAnnouncement);

export default router;
