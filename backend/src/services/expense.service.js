import mongoose from "mongoose";
import ExpenseCategory from "../models/ExpenseCategory.js";
import Expense from "../models/Expense.js";
import Employee from "../models/Employee.js";
import Client from "../models/Client.js";
import { ApiError } from "../utils/apiError.js";
import NotificationService from "./notification.service.js";
import { saveBase64File } from "../utils/fileStorage.js";

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
      name: expense.title || expense.name || "",
      title: expense.title || expense.name || "",
      type: (expense.status === "Pending" ? "Claim" : "Expense"),
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
    if (employeeId) {
      if (mongoose.Types.ObjectId.isValid(employeeId)) {
        query.$or = [
          { employeeId: new mongoose.Types.ObjectId(employeeId) },
          { employeeId: employeeId.toString() },
        ];
      } else {
        query.employeeId = employeeId;
      }
    }
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
      category,
      categoryName,
      clientId,
      receipt,
      remarks,
      notes,
    } = data;

    let targetCategoryId = categoryId;
    const customCategoryText = (
      categoryName ||
      category ||
      (typeof categoryId === "string" && !mongoose.Types.ObjectId.isValid(categoryId) ? categoryId : "")
    ).trim();

    if (customCategoryText) {
      let catDoc = await ExpenseCategory.findOne({
        name: { $regex: new RegExp(`^${customCategoryText}$`, "i") },
      });
      if (!catDoc) {
        catDoc = await ExpenseCategory.create({ name: customCategoryText });
      }
      targetCategoryId = catDoc._id;
    }

    if (!targetCategoryId) {
      // Default to General category if none provided
      let defaultCat = await ExpenseCategory.findOne({ name: "General" });
      if (!defaultCat) {
        defaultCat = await ExpenseCategory.create({ name: "General" });
      }
      targetCategoryId = defaultCat._id;
    }

    const finalTitle = (title || data.name || description || "General Expense").trim();
    if (!finalTitle || amount === undefined || amount === null || amount === "") {
      throw new ApiError(400, "Title / Name and amount are required.");
    }

    const isEmployee = userRole === "employee";
    const status = isEmployee ? "Pending" : (data.status || "Approved");

    // Automatically store base64 receipts to disk for zero DB bloat
    const storedReceipt = receipt ? saveBase64File(receipt, "receipts", "receipt") : "";

    let finalEmployeeId = null;
    if (isEmployee) {
      const rawId = userId || data.employeeId || null;
      finalEmployeeId = rawId && mongoose.Types.ObjectId.isValid(rawId) ? new mongoose.Types.ObjectId(rawId) : rawId;
    } else if (data.employeeId && data.employeeId !== "all" && data.employeeId !== "") {
      finalEmployeeId = mongoose.Types.ObjectId.isValid(data.employeeId) ? new mongoose.Types.ObjectId(data.employeeId) : data.employeeId;
    }

    const expense = await Expense.create({
      title: finalTitle,
      description: (description || data.name || finalTitle).trim(),
      amount: parseFloat(amount),
      date: date ? new Date(date) : new Date(),
      categoryId: targetCategoryId,
      employeeId: finalEmployeeId,
      clientId: clientId || null,
      receipt: storedReceipt,
      remarks: remarks ? remarks.trim() : "",
      notes: notes ? notes.trim() : "",
      status,
    });

    await expense.populate(["categoryId", "employeeId", "clientId"]);

    // Send Live Admin Notification when employee submits an expense
    if (isEmployee) {
      try {
        const empName = expense.employeeId?.name
          ? (typeof expense.employeeId.name === "string"
              ? expense.employeeId.name
              : `${expense.employeeId.name.first || ""} ${expense.employeeId.name.last || ""}`.trim())
          : "An employee";

        await NotificationService.createNotification({
          type: "EXPENSE_CLAIM",
          title: "New Expense Claim Submitted",
          message: `${empName} submitted an expense claim of ₹${Number(expense.amount || 0).toLocaleString("en-IN")} for "${expense.title}".`,
          targetRole: "ADMIN",
          targetType: "ALL",
          metadata: {
            expenseId: expense._id?.toString(),
            employeeId: finalEmployeeId?.toString(),
            amount: expense.amount,
            title: expense.title,
          },
        });
      } catch (notifErr) {
        console.error("Failed to notify admin of new expense claim:", notifErr);
      }
    }

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

    // Trigger Employee Live Notification
    try {
      if (expense.employeeId) {
        const empId = expense.employeeId._id || expense.employeeId;
        await NotificationService.createNotification({
          type: "EXPENSE_UPDATE",
          title: `Expense Claim ${status}`,
          message: `Your expense "${expense.title}" for ₹${Number(expense.amount || 0).toLocaleString("en-IN")} has been ${status.toLowerCase()}.${adminRemark ? ` Remark: "${adminRemark}"` : ""}`,
          targetRole: "EMPLOYEE",
          targetType: "SPECIFIC",
          targetEmployeeId: empId,
          metadata: { expenseId: expense._id, status, adminRemark, amount: expense.amount },
        });
      }
    } catch (e) {
      console.error("Failed to notify employee of expense review:", e);
    }

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

  static async deleteEmployeeExpense(id, employeeId) {
    const expense = await Expense.findById(id);
    if (!expense) {
      throw new ApiError(404, "Expense claim not found.");
    }
    const empIdStr = (employeeId?._id || employeeId || "").toString();
    const ownerIdStr = (expense.employeeId?._id || expense.employeeId || "").toString();
    if (ownerIdStr && empIdStr && ownerIdStr !== empIdStr) {
      throw new ApiError(403, "You can only delete your own expense claims.");
    }
    await Expense.findByIdAndDelete(id);
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
