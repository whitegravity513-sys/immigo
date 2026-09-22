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
  const { categoryId, clientId, employeeId, status, startDate, endDate } = req.query;
  const expenses = await ExpenseService.getExpenses({
    categoryId,
    clientId,
    employeeId,
    status,
    startDate,
    endDate,
  });
  return res.status(200).json(expenses);
});

export const createExpense = asyncHandler(async (req, res) => {
  const role = (req.user?.role || "").toLowerCase();
  const userRole = role === "employee" ? "employee" : "admin";
  const userId = req.employee?._id || req.admin?._id || req.user?.id || req.user?._id || null;

  const expense = await ExpenseService.createExpense(req.body, userRole, userId);
  return res.status(201).json({
    message: "Expense created successfully",
    expense,
  });
});

export const reviewExpense = asyncHandler(async (req, res) => {
  const { status, adminRemark } = req.body;
  const adminId = req.admin?._id || req.user?._id || null;

  const expense = await ExpenseService.reviewExpense(req.params.id, {
    status,
    adminRemark,
    adminId,
  });

  return res.status(200).json({
    message: `Expense claim ${status.toLowerCase()} successfully`,
    expense,
  });
});

export const getClientExpenses = asyncHandler(async (req, res) => {
  const result = await ExpenseService.getClientExpenseHistory(req.params.clientId);
  return res.status(200).json(result);
});

export const getMyExpenses = asyncHandler(async (req, res) => {
  const employeeId = req.employee?._id || req.user?.id || req.user?._id;
  const { categoryId, status, startDate, endDate } = req.query;
  const expenses = await ExpenseService.getExpenses({
    employeeId,
    categoryId,
    status,
    startDate,
    endDate,
  });
  return res.status(200).json(expenses);
});

export const submitMyExpense = asyncHandler(async (req, res) => {
  const employeeId = req.employee?._id || req.user?.id || req.user?._id;
  const expense = await ExpenseService.createExpense(req.body, "employee", employeeId);
  return res.status(201).json({
    message: "Expense submitted successfully for review",
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

export const deleteMyExpense = asyncHandler(async (req, res) => {
  const employeeId = req.employee?._id || req.user?.id || req.user?._id;
  await ExpenseService.deleteEmployeeExpense(req.params.id, employeeId);
  return res.status(200).json({ message: "Expense claim deleted successfully" });
});

export default {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getExpenses,
  createExpense,
  reviewExpense,
  getClientExpenses,
  getMyExpenses,
  submitMyExpense,
  deleteMyExpense,
  updateExpense,
  deleteExpense,
};
