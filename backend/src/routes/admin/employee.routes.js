import express from "express";
import {
  createEmployee,
  getNextEmployeeId,
  getEmployees,
  updateEmployee,
  deactivateEmployee,
  setLeaveBalance,
  uploadAdminDocument,
  deleteAdminDocument,
  reviewAdminDocument,
  getEmployeeHistory,
  getEmployeeMonthlyDetails,
  getEmployeeNote,
  getEmployeeLeaves,
} from "../../controllers/adminEmployee.controller.js";
import { verifyAdmin } from "../../middleware/auth.middleware.js";

const router = express.Router();

router.post("/employee/create", verifyAdmin, createEmployee);
router.get("/employee/next-id", verifyAdmin, getNextEmployeeId);
router.get("/employee/list", verifyAdmin, getEmployees);
router.get("/employees", verifyAdmin, getEmployees);
router.put("/employee/update/:id", verifyAdmin, updateEmployee);
router.put("/employee/deactivate/:id", verifyAdmin, deactivateEmployee);
router.put("/employee/:id/leave-balance", verifyAdmin, setLeaveBalance);
router.get("/employee/:id/history", verifyAdmin, getEmployeeHistory);
router.get("/employee/:employeeId/monthly", verifyAdmin, getEmployeeMonthlyDetails);
router.get("/employee/:id/note", verifyAdmin, getEmployeeNote);
router.get("/employee/:id/leaves", verifyAdmin, getEmployeeLeaves);
router.post("/employee/:id/documents", verifyAdmin, uploadAdminDocument);
router.put("/employee/:id/documents/:docId/review", verifyAdmin, reviewAdminDocument);
router.patch("/employee/:id/documents/:docId/review", verifyAdmin, reviewAdminDocument);
router.delete("/employee/:id/documents/:docId", verifyAdmin, deleteAdminDocument);

export default router;
