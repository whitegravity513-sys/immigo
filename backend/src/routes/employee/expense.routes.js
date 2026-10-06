import express from "express";
import {
  getMyExpenses,
  submitMyExpense,
  deleteMyExpense,
  getCategories,
} from "../../controllers/expense.controller.js";
import { getClients } from "../../controllers/client.controller.js";
import { verifyEmployee } from "../../middleware/auth.middleware.js";

const router = express.Router();

router.get("/expenses", verifyEmployee, getMyExpenses);
router.post("/expenses", verifyEmployee, submitMyExpense);
router.delete("/expenses/:id", verifyEmployee, deleteMyExpense);
router.get("/expense-categories", verifyEmployee, getCategories);
router.get("/clients", verifyEmployee, getClients);

export default router;
