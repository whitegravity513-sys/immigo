import express from "express";
import adminAuthRoutes from "./adminAuth.routes.js";
import adminRoutes from "./admin.routes.js";
import employeeAuthRoutes from "./employeeAuth.routes.js";
import employeeRoutes from "./employee.routes.js";
import authRoutes from "./auth.routes.js";
import paymentRoutes from "./payment.routes.js";
import { authLimiter } from "../middleware/rateLimit.middleware.js";

const apiRouter = express.Router();

apiRouter.use("/auth/admin", adminAuthRoutes);
apiRouter.use("/admin", adminRoutes);

apiRouter.use("/auth/employee", employeeAuthRoutes);
apiRouter.use("/employee", employeeRoutes);

apiRouter.use("/auth", authRoutes);
apiRouter.use("/payments", paymentRoutes);

export default apiRouter;
