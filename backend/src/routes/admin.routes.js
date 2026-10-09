import express from "express";
import employeeRoutes from "./admin/employee.routes.js";
import attendanceRoutes from "./admin/attendance.routes.js";
import leaveRoutes from "./admin/leave.routes.js";
import announcementRoutes from "./admin/announcement.routes.js";
import expenseRoutes from "./admin/expense.routes.js";
import clientRoutes from "./admin/client.routes.js";
import projectRoutes from "./admin/project.routes.js";
import invoiceRoutes from "./admin/invoice.routes.js";
import paymentRoutes from "./admin/payment.routes.js";
import renewalRoutes from "./admin/renewal.routes.js";
import meetingRoutes from "./admin/meeting.routes.js";
import notificationRoutes from "./admin/notification.routes.js";
import vendorRoutes from "./admin/vendor.routes.js";

const router = express.Router();

router.use(employeeRoutes);
router.use(attendanceRoutes);
router.use(leaveRoutes);
router.use(announcementRoutes);
router.use(expenseRoutes);
router.use(clientRoutes);
router.use(projectRoutes);
router.use(invoiceRoutes);
router.use(paymentRoutes);
router.use(renewalRoutes);
router.use(meetingRoutes);
router.use(notificationRoutes);
router.use(vendorRoutes);

export default router;
