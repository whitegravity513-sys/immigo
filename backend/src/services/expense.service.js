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
    const empObj = expense.employeeId;
    const clientObj = expense.clientId;

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
      employee: empObj
        ? {
            ...(empObj.toObject ? empObj.toObject() : empObj),
            id: empObj._id?.toString() || empObj.toString(),
            _id: empObj._id?.toString() || empObj.toString(),
          }
        : null,
      client: clientObj
        ? {
            ...(clientObj.toObject ? clientObj.toObject() : clientObj),
            id: clientObj._id?.toString() || clientObj.toString(),
            _id: clientObj._id?.toString() || clientObj.toString(),
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
    const { categoryId, clientId, employeeId, status, startDate, endDate } = filters;
    const query = {};

    if (categoryId) query.categoryId = categoryId;
    if (clientId) query.clientId = clientId;
    if (employeeId) query.employeeId = employeeId;
    if (status) query.status = status;
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(new Date(endDate).setHours(23, 59, 59, 999)),
      };
    }

    const expenses = await Expense.find(query)
      .populate("categoryId", "name")
      .populate("employeeId", "name employeeId email designation")
      .populate("clientId", "name company email phone")
      .sort({ date: -1, createdAt: -1 })
      .lean();

    return expenses.map((e) => this.formatExpense(e));
  }

  static async createExpense(data, userRole = "admin", userId = null) {
    const {
      title,
      description,
      amount,
      date,
      categoryId,
      clientId,
      receipt,
      remarks,
      notes,
    } = data;

    const finalTitle = title ? title.trim() : (description ? description.trim() : "");
    if (!finalTitle || amount === undefined || amount === null || !categoryId) {
      throw new ApiError(400, "Title / Description, amount, and category are required.");
    }

    const isEmployee = userRole === "employee";
    const status = isEmployee ? "Pending" : (data.status || "Approved");

    const expense = await Expense.create({
      title: finalTitle,
      description: description ? description.trim() : finalTitle,
      amount: parseFloat(amount),
      date: date ? new Date(date) : new Date(),
      categoryId,
      employeeId: isEmployee ? userId : (data.employeeId || null),
      clientId: clientId || null,
      receipt: receipt || "",
      remarks: remarks ? remarks.trim() : "",
      notes: notes ? notes.trim() : "",
      status,
    });

    await expense.populate(["categoryId", "employeeId", "clientId"]);
    return this.formatExpense(expense);
  }

  static async reviewExpense(id, { status, adminRemark, adminId }) {
    if (!["Approved", "Rejected", "Pending"].includes(status)) {
      throw new ApiError(400, "Invalid status. Use 'Approved', 'Rejected', or 'Pending'.");
    }

    const expense = await Expense.findById(id);
    if (!expense) {
      throw new ApiError(404, "Expense not found.");
    }

    expense.status = status;
    if (adminRemark !== undefined) expense.adminRemark = adminRemark.trim();
    expense.reviewedBy = adminId || null;
    expense.reviewedAt = new Date();

    await expense.save();
    await expense.populate(["categoryId", "employeeId", "clientId"]);
    return this.formatExpense(expense);
  }

  static async updateExpense(id, data) {
    const {
      title,
      description,
      amount,
      date,
      categoryId,
      clientId,
      receipt,
      remarks,
      notes,
      status,
      adminRemark,
    } = data;

    const expense = await Expense.findById(id);
    if (!expense) {
      throw new ApiError(404, "Expense not found.");
    }

    if (title) expense.title = title.trim();
    if (description !== undefined) expense.description = description.trim();
    if (amount !== undefined) expense.amount = parseFloat(amount);
    if (date) expense.date = new Date(date);
    if (categoryId) expense.categoryId = categoryId;
    if (clientId !== undefined) expense.clientId = clientId || null;
    if (receipt !== undefined) expense.receipt = receipt;
    if (remarks !== undefined) expense.remarks = remarks;
    if (notes !== undefined) expense.notes = notes;
    if (status) expense.status = status;
    if (adminRemark !== undefined) expense.adminRemark = adminRemark;

    await expense.save();
    await expense.populate(["categoryId", "employeeId", "clientId"]);
    return this.formatExpense(expense);
  }

  static async deleteExpense(id) {
    const expense = await Expense.findByIdAndDelete(id);
    if (!expense) {
      throw new ApiError(404, "Expense not found.");
    }
    return expense;
  }

  // Track Expense history according to Client
  static async getClientExpenseHistory(clientId) {
    if (!clientId) {
      throw new ApiError(400, "Client ID is required");
    }

    const expenses = await Expense.find({ clientId })
      .populate("categoryId", "name")
      .populate("employeeId", "name employeeId")
      .sort({ date: -1 })
      .lean();

    const totalAmount = expenses.reduce((acc, curr) => acc + (curr.amount || 0), 0);
    const approvedAmount = expenses
      .filter((e) => e.status === "Approved")
      .reduce((acc, curr) => acc + (curr.amount || 0), 0);

    return {
      clientId,
      totalCount: expenses.length,
      totalAmount,
      approvedAmount,
      expenses: expenses.map((e) => this.formatExpense(e)),
    };
  }
}

export default ExpenseService;
