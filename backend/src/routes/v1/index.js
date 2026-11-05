import express from "express";
import vendorManagementRoutes from "./vendorManagement.routes.js";
import projectAssignmentRoutes from "./projectAssignment.routes.js";
import vendorPaymentRoutes from "./vendorPayment.routes.js";
import recruitmentRoutes from "./recruitment.routes.js";
import jobRoutes from "./job.routes.js";
import hrActivityRoutes from "./hrActivity.routes.js";
import vendorHRRoutes from "./vendorHR.routes.js";

const v1Router = express.Router();

v1Router.use("/vendors", vendorManagementRoutes);
v1Router.use("/assignments", projectAssignmentRoutes);
v1Router.use("/vendor-payments", vendorPaymentRoutes);
v1Router.use("/recruitment", recruitmentRoutes);
v1Router.use("/jobs", jobRoutes);
v1Router.use("/hr-activities", hrActivityRoutes);
v1Router.use("/vendor-hr", vendorHRRoutes);

export default v1Router;
