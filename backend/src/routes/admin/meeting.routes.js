import express from "express";
import {
  createMeeting,
  getAdminMeetings,
  updateMeeting,
  deleteMeeting,
  sendBroadcastNotification,
} from "../../controllers/meeting.controller.js";
import { requirePermission } from "../../middleware/rbac.middleware.js";
import { validateCreateMeeting } from "../../validators/meeting.validator.js";

const router = express.Router();

router.post("/meetings", requirePermission("meetings.create"), validateCreateMeeting, createMeeting);
router.get("/meetings", requirePermission("meetings.view"), getAdminMeetings);
router.put("/meetings/:id", requirePermission("meetings.update"), updateMeeting);
router.delete("/meetings/:id", requirePermission("meetings.delete"), deleteMeeting);
router.post("/notifications/broadcast", requirePermission("settings.update"), sendBroadcastNotification);

export default router;
