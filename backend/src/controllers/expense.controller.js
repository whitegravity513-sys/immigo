import ExpenseService from "../services/expense.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";

/**
 * Enterprise Expense Management Controller
 */

// --- Expense Categories ---
export const getCategories = asyncHandler(async (req, res) => {
  const categories = await ExpenseService.getCategories();
  return res.status(200).json(categories);
});

export const createCategory = asyncHandler(async (req, res) => {
  const { name } = req.body;
  const category = await ExpenseService.createCategory(name);
  return res.status(201).json({
    message: "Category created successfully",
    category,
  });
});

export const updateCategory = asyncHandler(async (req, res) => {
  const { name } = req.body;
  const category = await ExpenseService.updateCategory(req.params.id, name);
  return res.status(200).json({
    message: "Category updated successfully",
    category,
  });
});

export const deleteCategory = asyncHandler(async (req, res) => {
  await ExpenseService.deleteCategory(req.params.id);
  return res.status(200).json({ message: "Category deleted successfully" });
});

// --- Expenses ---
export const getExpenses = asyncHandler(async (req, res) => {
  const { categoryId, startDate, endDate } = req.query;
  const expenses = await ExpenseService.getExpenses({ categoryId, startDate, endDate });
  return res.status(200).json(expenses);
});

export const createExpense = asyncHandler(async (req, res) => {
  const expense = await ExpenseService.createExpense(req.body);
  return res.status(201).json({
    message: "Expense created successfully",
    expense,
  });
});

export const updateExpense = asyncHandler(async (req, res) => {
  const expense = await ExpenseService.updateExpense(req.params.id, req.body);
  return res.status(200).json({
    message: "Expense updated successfully",
    expense,
  });
});

export const deleteExpense = asyncHandler(async (req, res) => {
  await ExpenseService.deleteExpense(req.params.id);
  return res.status(200).json({ message: "Expense deleted successfully" });
});

export default {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
};
