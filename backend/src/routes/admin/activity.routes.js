import express from "express";
import { getAdminActivities } from "../../controllers/activity.controller.js";
import { verifyAdmin } from "../../middleware/auth.middleware.js";

const router = express.Router();

router.get("/activities", verifyAdmin, getAdminActivities);

export default router;
