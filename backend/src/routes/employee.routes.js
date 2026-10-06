import express from "express";
import attendanceRoutes from "./employee/attendance.routes.js";
import profileRoutes from "./employee/profile.routes.js";
import expenseRoutes from "./employee/expense.routes.js";
import meetingRoutes from "./employee/meeting.routes.js";
import notificationRoutes from "./employee/notification.routes.js";
import worklogRoutes from "./employee/worklog.routes.js";

const router = express.Router();

router.use(attendanceRoutes);
router.use(profileRoutes);
router.use(expenseRoutes);
router.use(meetingRoutes);
router.use(notificationRoutes);
router.use(worklogRoutes);

export default router;
