import express from "express";
import adminAuthRoutes from "./adminAuth.routes.js";
import adminRoutes from "./admin.routes.js";
import employeeAuthRoutes from "./employeeAuth.routes.js";
import employeeRoutes from "./employee.routes.js";
import authRoutes from "./auth.routes.js";
import vendorAuthRoutes from "./vendorAuth.routes.js";
import paymentRoutes from "./payment.routes.js";
import crmSyncRoutes from "./crmSync.routes.js";
import candidateAuthRoutes from "./candidateAuth.routes.js";
import candidateAdminRoutes from "./candidateAdmin.routes.js";
import adminManagementRoutes from "./adminManagement.routes.js";
import hrRoutes from "./hr.routes.js";
import candidateActivityRoutes from "./candidateActivity.routes.js";
import meetingRoutes from "./admin/meeting.routes.js";
import v1Router from "./v1/index.js";
import { authLimiter } from "../middleware/rateLimit.middleware.js";

const apiRouter = express.Router();

apiRouter.use("/v1", v1Router);
apiRouter.use(adminManagementRoutes);
apiRouter.use(candidateActivityRoutes);
apiRouter.use(meetingRoutes);
apiRouter.use("/hr", hrRoutes);

apiRouter.use("/auth/admin", adminAuthRoutes);
apiRouter.use("/admin", adminRoutes);

apiRouter.use("/auth/employee", employeeAuthRoutes);
apiRouter.use("/employee", employeeRoutes);

apiRouter.use("/auth", authRoutes);
apiRouter.use("/auth/vendor", vendorAuthRoutes);
apiRouter.use("/auth/candidate", candidateAuthRoutes);
apiRouter.use("/candidate", candidateAuthRoutes);
apiRouter.use("/admin/candidates", candidateAdminRoutes);
apiRouter.use("/payments", paymentRoutes);
apiRouter.use("/crm-sync", crmSyncRoutes);

export default apiRouter;


