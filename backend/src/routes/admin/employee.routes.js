import express from "express";
import {
  createEmployee,
  getNextEmployeeId,
  getEmployees,
  updateEmployee,
  deactivateEmployee,
  deleteEmployee,
  setLeaveBalance,
  uploadAdminDocument,
  deleteAdminDocument,
  reviewAdminDocument,
  getEmployeeHistory,
  getEmployeeMonthlyDetails,
  getEmployeeNote,
  getEmployeeLeaves,
} from "../../controllers/adminEmployee.controller.js";
import { requirePermission } from "../../middleware/rbac.middleware.js";

const router = express.Router();

router.post("/employee/create", requirePermission("employees.create"), createEmployee);
router.get("/employee/next-id", requirePermission("employees.view"), getNextEmployeeId);
router.get("/employee/list", requirePermission("employees.view"), getEmployees);
router.get("/employees", requirePermission("employees.view"), getEmployees);
router.put("/employee/update/:id", requirePermission("employees.update"), updateEmployee);
router.put("/employee/:id", requirePermission("employees.update"), updateEmployee);
router.delete("/employee/:id", requirePermission("employees.delete"), deleteEmployee);
router.put("/employee/deactivate/:id", requirePermission("employees.update"), deactivateEmployee);
router.put("/employee/:id/leave-balance", requirePermission("employees.update"), setLeaveBalance);
router.get("/employee/:id/history", requirePermission("employees.view"), getEmployeeHistory);
router.get("/employee/:employeeId/monthly", requirePermission("employees.view"), getEmployeeMonthlyDetails);
router.get("/employee/:id/note", requirePermission("employees.view"), getEmployeeNote);
router.get("/employee/:id/leaves", requirePermission("employees.view"), getEmployeeLeaves);
router.post("/employee/:id/documents", requirePermission("employees.update"), uploadAdminDocument);
router.put("/employee/:id/documents/:docId/review", requirePermission("employees.update"), reviewAdminDocument);
router.patch("/employee/:id/documents/:docId/review", requirePermission("employees.update"), reviewAdminDocument);
router.delete("/employee/:id/documents/:docId", requirePermission("employees.delete"), deleteAdminDocument);

export default router;
