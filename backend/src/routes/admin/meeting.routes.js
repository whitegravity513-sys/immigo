import express from "express";
import {
  createMeeting,
  getAdminMeetings,
  getMeetingCalendarStats,
  updateMeeting,
  rescheduleMeeting,
  cancelMeeting,
  deleteMeeting,
  sendBroadcastNotification,
} from "../../controllers/meeting.controller.js";
import { requirePermission } from "../../middleware/rbac.middleware.js";

const router = express.Router();

router.get("/meetings/calendar-stats", requirePermission("meetings.view"), getMeetingCalendarStats);
router.post("/meetings", requirePermission("meetings.create"), createMeeting);
router.get("/meetings", requirePermission("meetings.view"), getAdminMeetings);
router.put("/meetings/:id/reschedule", requirePermission("meetings.update"), rescheduleMeeting);
router.put("/meetings/:id/cancel", requirePermission("meetings.update"), cancelMeeting);
router.put("/meetings/:id", requirePermission("meetings.update"), updateMeeting);
router.delete("/meetings/:id", requirePermission("meetings.delete"), deleteMeeting);
router.post("/notifications/broadcast", requirePermission("settings.update"), sendBroadcastNotification);

export default router;
