import express from "express";
import { getHRActivities } from "../../controllers/v1/hrActivity.controller.js";
import { authenticateRBAC } from "../../middleware/rbac.middleware.js";

const router = express.Router();

router.use(authenticateRBAC);

router.get("/", getHRActivities);

export default router;
