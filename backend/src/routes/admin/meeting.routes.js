import express from "express";
import {
  createMeeting,
  getAdminMeetings,
  updateMeeting,
  deleteMeeting,
  sendBroadcastNotification,
} from "../../controllers/meeting.controller.js";
import { verifyAdmin } from "../../middleware/auth.middleware.js";
import { validateCreateMeeting } from "../../validators/meeting.validator.js";

const router = express.Router();

router.post("/meetings", verifyAdmin, validateCreateMeeting, createMeeting);
router.get("/meetings", verifyAdmin, getAdminMeetings);
router.put("/meetings/:id", verifyAdmin, updateMeeting);
router.delete("/meetings/:id", verifyAdmin, deleteMeeting);
router.post("/notifications/broadcast", verifyAdmin, sendBroadcastNotification);

export default router;
