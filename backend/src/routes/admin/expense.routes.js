import express from "express";
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getExpenses,
  createExpense,
  reviewExpense,
  getClientExpenses,
  updateExpense,
  deleteExpense,
} from "../../controllers/expense.controller.js";
import { authenticateRBAC, requireRoles } from "../../middleware/rbac.middleware.js";

const router = express.Router();

const requireAdminAccess = [authenticateRBAC, requireRoles("SUPER_ADMIN", "ADMIN")];

router.get("/expense-categories", ...requireAdminAccess, getCategories);
router.post("/expense-categories", ...requireAdminAccess, createCategory);
router.put("/expense-categories/:id", ...requireAdminAccess, updateCategory);
router.delete("/expense-categories/:id", ...requireAdminAccess, deleteCategory);

router.get("/expenses", ...requireAdminAccess, getExpenses);
router.post("/expenses", ...requireAdminAccess, createExpense);
router.put("/expenses/:id/review", ...requireAdminAccess, reviewExpense);
router.patch("/expenses/:id/review", ...requireAdminAccess, reviewExpense);
router.get("/expenses/client/:clientId", ...requireAdminAccess, getClientExpenses);
router.put("/expenses/:id", ...requireAdminAccess, updateExpense);
router.delete("/expenses/:id", ...requireAdminAccess, deleteExpense);

export default router;
