import express from "express";
import { getEmployeeActivities } from "../../controllers/activity.controller.js";
import { verifyToken } from "../../middleware/auth.middleware.js";

const router = express.Router();

router.get("/activities", verifyToken, getEmployeeActivities);

export default router;
