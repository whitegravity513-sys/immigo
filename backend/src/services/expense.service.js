import mongoose from "mongoose";
import ExpenseCategory from "../models/ExpenseCategory.js";
import Expense from "../models/Expense.js";
import Employee from "../models/Employee.js";
import Client from "../models/Client.js";
import { ApiError } from "../utils/apiError.js";
import NotificationService from "./notification.service.js";
import { saveBase64File } from "../utils/fileStorage.js";

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
      clientName: data.clientName || "",
      projectId: data.projectId || "",
      projectName: data.projectName || "",
      categoryName: customCategoryText || data.categoryName || "General",
      paidTo: data.paidTo || "",
      paymentMethod: data.paymentMethod || data.paymentMode || "Bank Transfer",
      paymentMode: data.paymentMethod || data.paymentMode || "Bank Transfer",
      transactionReference: data.transactionReference || data.transactionRef || "",
      transactionRef: data.transactionReference || data.transactionRef || "",
      recordedBy: data.recordedBy || (userRole === "admin" ? "Admin" : "Employee"),
      receipt: storedReceipt,
      proofUrl: data.proofUrl || (receipt && !receipt.startsWith("data:") ? receipt : ""),
      remarks: remarks ? remarks.trim() : "",
      notes: notes ? notes.trim() : "",
      status,
      paidAt: status === "Paid" ? new Date() : null,
      auditTrail: [
        {
          action: "EXPENSE_CREATED",
          previousValues: {},
          updatedValues: {
            title: finalTitle,
            amount: parseFloat(amount),
            status,
            paidTo: data.paidTo || "",
            paymentMethod: data.paymentMethod || "Bank Transfer",
          },
          updatedBy: data.recordedBy || "Admin",
          date: new Date(),
          note: `Expense of ₹${parseFloat(amount).toLocaleString()} recorded with status ${status}`,
        },
      ],
    });

    await expense.populate(["categoryId", "employeeId"]);

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

  static async reviewExpense(id, { status, adminRemark, adminId, paymentMode, transactionRef, paymentNote }) {
    const cleanId = String(id || "").replace(/^virtual-/, "").trim();
    if (!cleanId || !mongoose.Types.ObjectId.isValid(cleanId)) {
      throw new ApiError(400, "Invalid expense ID provided.");
    }
    const validStatuses = ["Approved", "Rejected", "Pending", "Paid"];
    const normalizedStatus = validStatuses.find(s => s.toLowerCase() === (status || "").toLowerCase()) || status;
    if (!validStatuses.includes(normalizedStatus)) {
      throw new ApiError(400, "Invalid status. Use 'Approved', 'Rejected', 'Pending', or 'Paid'.");
    }

    const validAdminId = adminId && mongoose.Types.ObjectId.isValid(adminId) ? new mongoose.Types.ObjectId(adminId) : null;
    const updateData = {
      status: normalizedStatus,
      reviewedBy: validAdminId,
      reviewedAt: new Date(),
    };
    if (adminRemark !== undefined) {
      updateData.adminRemark = adminRemark.trim();
    }
    if (normalizedStatus === "Paid") {
      updateData.paidAt = new Date();
      updateData.paidBy = validAdminId;
      if (paymentMode) updateData.paymentMode = paymentMode.trim();
      if (transactionRef) updateData.transactionRef = transactionRef.trim();
      if (paymentNote) updateData.paymentNote = paymentNote.trim();
    }

    const expense = await Expense.findByIdAndUpdate(
      cleanId,
      { $set: updateData },
      { new: true, runValidators: false }
    ).populate(["categoryId", "employeeId", "clientId"]);

    if (!expense) {
      throw new ApiError(404, "Expense not found.");
    }

    try {
      if (expense.employeeId) {
        const empId = expense.employeeId._id || expense.employeeId;
        const msg = status === "Paid"
          ? `Your approved expense "${expense.title}" of ₹${Number(expense.amount || 0).toLocaleString("en-IN")} has been PAID/REIMBURSED via ${expense.paymentMode || "Bank Transfer"}${expense.transactionRef ? ` (Ref: ${expense.transactionRef})` : ""}.`
          : `Your expense "${expense.title}" for ₹${Number(expense.amount || 0).toLocaleString("en-IN")} has been ${status.toLowerCase()}.${adminRemark ? ` Remark: "${adminRemark}"` : ""}`;

        await NotificationService.createNotification({
          type: "EXPENSE_UPDATE",
          title: `Expense Claim ${status}`,
          message: msg,
          targetRole: "EMPLOYEE",
          targetType: "SPECIFIC",
          targetEmployeeId: empId,
          metadata: {
            expenseId: expense._id,
            status,
            adminRemark,
            amount: expense.amount,
            paidAt: expense.paidAt,
            transactionRef: expense.transactionRef,
          },
        });
      }
    } catch (e) {
      console.error("Failed to notify employee of expense review:", e);
    }

    return this.formatExpense(expense);
  }

  static async updateExpense(id, data, user = {}) {
    const {
      title,
      description,
      amount,
      date,
      categoryId,
      categoryName,
      clientId,
      clientName,
      projectId,
      projectName,
      paidTo,
      paymentMethod,
      transactionReference,
      receipt,
      proofUrl,
      remarks,
      notes,
      status,
      adminRemark,
    } = data;

    const expense = await Expense.findById(id);
    if (!expense) {
      throw new ApiError(404, "Expense not found.");
    }

    const previousValues = {
      title: expense.title,
      amount: expense.amount,
      status: expense.status,
      paidTo: expense.paidTo,
      paymentMethod: expense.paymentMethod,
      transactionReference: expense.transactionReference,
      remarks: expense.remarks,
    };

    const updatedValues = {};

    if (title && title.trim() !== expense.title) {
      updatedValues.title = title.trim();
      expense.title = title.trim();
    }
    if (description !== undefined && description.trim() !== expense.description) {
      updatedValues.description = description.trim();
      expense.description = description.trim();
    }
    if (amount !== undefined && parseFloat(amount) !== expense.amount) {
      updatedValues.amount = parseFloat(amount);
      expense.amount = parseFloat(amount);
    }
    if (date) {
      expense.date = new Date(date);
      updatedValues.date = expense.date;
    }
    if (categoryId) expense.categoryId = categoryId;
    if (categoryName) {
      expense.categoryName = categoryName;
      updatedValues.categoryName = categoryName;
    }
    if (clientId !== undefined) expense.clientId = clientId || null;
    if (clientName) expense.clientName = clientName;
    if (projectId !== undefined) expense.projectId = projectId;
    if (projectName !== undefined) expense.projectName = projectName;
    if (paidTo !== undefined) {
      updatedValues.paidTo = paidTo;
      expense.paidTo = paidTo;
    }
    if (paymentMethod !== undefined) {
      updatedValues.paymentMethod = paymentMethod;
      expense.paymentMethod = paymentMethod;
      expense.paymentMode = paymentMethod;
    }
    if (transactionReference !== undefined) {
      updatedValues.transactionReference = transactionReference;
      expense.transactionReference = transactionReference;
      expense.transactionRef = transactionReference;
    }
    if (receipt !== undefined) expense.receipt = receipt;
    if (proofUrl !== undefined) expense.proofUrl = proofUrl;
    if (remarks !== undefined) {
      updatedValues.remarks = remarks;
      expense.remarks = remarks;
    }
    if (notes !== undefined) expense.notes = notes;
    if (status && status !== expense.status) {
      updatedValues.status = status;
      expense.status = status;
      if (status === "Paid" && !expense.paidAt) {
        expense.paidAt = new Date();
      }
    }
    if (adminRemark !== undefined) expense.adminRemark = adminRemark;

    const updaterName = user.name || user.email || data.updatedBy || "Admin";

    if (Object.keys(updatedValues).length > 0) {
      expense.auditTrail.push({
        action: "EXPENSE_UPDATED",
        previousValues,
        updatedValues,
        updatedBy: updaterName,
        date: new Date(),
        note: `Updated: ${Object.keys(updatedValues).join(", ")}`,
      });
    }

    await expense.save();
    await expense.populate(["categoryId", "employeeId"]);
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

  static async getClientExpenseHistory(clientId) {
    if (!clientId) {
      throw new ApiError(400, "Client ID is required");
    }

    const clientQuery = [{ clientId: String(clientId) }];
    if (typeof clientId === "string" && /^[0-9a-fA-F]{24}$/.test(clientId)) {
      clientQuery.push({ clientId: new mongoose.Types.ObjectId(clientId) });
      clientQuery.push({ clientId: clientId });
    }

    const expenses = await Expense.find({ $or: clientQuery })
      .populate("categoryId", "name")
      .populate("employeeId", "name employeeId")
      .sort({ date: -1, createdAt: -1 })
      .lean();

    const totalExpensesRecorded = expenses.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
    const totalExpensesPaid = expenses
      .filter((e) => e.status === "Paid")
      .reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
    const pendingExpenses = expenses
      .filter((e) => e.status === "Pending" || e.status === "Approved")
      .reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);

    return {
      clientId,
      totalCount: expenses.length,
      totalAmount: totalExpensesRecorded,
      totalExpensesRecorded,
      totalExpensesPaid,
      pendingExpenses,
      approvedAmount: totalExpensesPaid,
      expenses: expenses.map((e) => this.formatExpense(e)),
    };
  }
}

export default ExpenseService;
