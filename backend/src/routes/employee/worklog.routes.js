import express from "express";
import {
  saveTodayWorkLog,
  getTodayWorkLog,
  getMyWorkLogHistory,
} from "../../controllers/worklog.controller.js";
import { verifyEmployee } from "../../middleware/auth.middleware.js";

const router = express.Router();

router.get("/worklog/today", verifyEmployee, getTodayWorkLog);
router.post("/worklog", verifyEmployee, saveTodayWorkLog);
router.get("/worklog/history", verifyEmployee, getMyWorkLogHistory);

export default router;
