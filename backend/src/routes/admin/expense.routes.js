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
import { verifyAdmin } from "../../middleware/auth.middleware.js";

const router = express.Router();

router.get("/expense-categories", verifyAdmin, getCategories);
router.post("/expense-categories", verifyAdmin, createCategory);
router.put("/expense-categories/:id", verifyAdmin, updateCategory);
router.delete("/expense-categories/:id", verifyAdmin, deleteCategory);

router.get("/expenses", verifyAdmin, getExpenses);
router.post("/expenses", verifyAdmin, createExpense);
router.put("/expenses/:id/review", verifyAdmin, reviewExpense);
router.patch("/expenses/:id/review", verifyAdmin, reviewExpense);
router.get("/expenses/client/:clientId", verifyAdmin, getClientExpenses);
router.put("/expenses/:id", verifyAdmin, updateExpense);
router.delete("/expenses/:id", verifyAdmin, deleteExpense);

export default router;
