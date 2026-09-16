import express from "express";
import adminAuthRoutes from "./adminAuth.routes.js";
import adminRoutes from "./admin.routes.js";
import employeeAuthRoutes from "./employeeAuth.routes.js";
import employeeRoutes from "./employee.routes.js";
import authRoutes from "./auth.routes.js";
import { authLimiter } from "../middleware/rateLimit.middleware.js";

const apiRouter = express.Router();

// HRMS Admin Auth & Admin Endpoints
apiRouter.use("/auth/admin", adminAuthRoutes);
apiRouter.use("/admin", adminRoutes);

// HRMS Employee Auth & Employee Endpoints
apiRouter.use("/auth/employee", employeeAuthRoutes);
apiRouter.use("/employee", employeeRoutes);

// Core Enterprise Auth Endpoints
apiRouter.use("/auth", authRoutes);

export default apiRouter;
