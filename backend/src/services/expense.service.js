import ExpenseCategory from "../models/ExpenseCategory.js";
import Expense from "../models/Expense.js";
import { ApiError } from "../utils/apiError.js";

/**
 * Enterprise Expense Management Service
 */
export class ExpenseService {
  static formatCategory(category) {
    if (!category) return null;
    return {
      ...(category.toObject ? category.toObject() : category),
      id: category._id?.toString() || category.id,
      _id: category._id?.toString() || category.id,
    };
  }

  static formatExpense(expense) {
    if (!expense) return null;
    const catObj = expense.categoryId;
    return {
      ...(expense.toObject ? expense.toObject() : expense),
      id: expense._id?.toString() || expense.id,
      _id: expense._id?.toString() || expense.id,
      category: catObj
        ? {
            ...(catObj.toObject ? catObj.toObject() : catObj),
            id: catObj._id?.toString() || catObj.toString(),
            _id: catObj._id?.toString() || catObj.toString(),
          }
        : null,
    };
  }

  // --- Expense Categories ---
  static async getCategories() {
    const categories = await ExpenseCategory.find().sort({ createdAt: -1 }).lean();
    return categories.map((c) => this.formatCategory(c));
  }

  static async createCategory(name) {
    if (!name || !name.trim()) {
      throw new ApiError(400, "Category name is required.");
    }

    const cleanName = name.trim();
    const existing = await ExpenseCategory.findOne({ name: cleanName });
    if (existing) {
      throw new ApiError(400, "Category already exists.");
    }

    const category = await ExpenseCategory.create({ name: cleanName });
    return this.formatCategory(category);
  }

  static async updateCategory(id, name) {
    if (!name || !name.trim()) {
      throw new ApiError(400, "Category name is required.");
    }

    const category = await ExpenseCategory.findByIdAndUpdate(
      id,
      { name: name.trim() },
      { new: true }
    );
    if (!category) {
      throw new ApiError(404, "Category not found.");
    }
    return this.formatCategory(category);
  }

  static async deleteCategory(id) {
    const category = await ExpenseCategory.findByIdAndDelete(id);
    if (!category) {
      throw new ApiError(404, "Category not found.");
    }
    return category;
  }

  // --- Expenses ---
  static async getExpenses(filters = {}) {
    const { categoryId, startDate, endDate } = filters;
    const query = {};

    if (categoryId) query.categoryId = categoryId;
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(new Date(endDate).setHours(23, 59, 59, 999)),
      };
    }

    const expenses = await Expense.find(query).populate("categoryId").sort({ date: -1 }).lean();
    return expenses.map((e) => this.formatExpense(e));
  }

  static async createExpense(data) {
    const { title, amount, date, categoryId, receipt, notes } = data;
    if (!title || !amount || !categoryId) {
      throw new ApiError(400, "Title, amount, and category are required.");
    }

    const expense = await Expense.create({
      title: title.trim(),
      amount: parseFloat(amount),
      date: date ? new Date(date) : new Date(),
      categoryId,
      receipt: receipt || "",
      notes: notes || "",
    });

    await expense.populate("categoryId");
    return this.formatExpense(expense);
  }

  static async updateExpense(id, data) {
    const { title, amount, date, categoryId, receipt, notes } = data;

    const expense = await Expense.findById(id);
    if (!expense) {
      throw new ApiError(404, "Expense not found.");
    }

    if (title) expense.title = title.trim();
    if (amount !== undefined) expense.amount = parseFloat(amount);
    if (date) expense.date = new Date(date);
    if (categoryId) expense.categoryId = categoryId;
    if (receipt !== undefined) expense.receipt = receipt;
    if (notes !== undefined) expense.notes = notes;

    await expense.save();
    await expense.populate("categoryId");
    return this.formatExpense(expense);
  }

  static async deleteExpense(id) {
    const expense = await Expense.findByIdAndDelete(id);
    if (!expense) {
      throw new ApiError(404, "Expense not found.");
    }
    return expense;
  }
}

export default ExpenseService;
