import express from "express";
import {
  getLeaves,
  updateLeaveStatus,
} from "../../controllers/adminLeave.controller.js";
import { verifyAdmin } from "../../middleware/auth.middleware.js";

const router = express.Router();

router.get("/leaves", verifyAdmin, getLeaves);
router.put("/leaves/:id", verifyAdmin, updateLeaveStatus);

export default router;
