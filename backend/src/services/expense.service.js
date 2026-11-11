import mongoose from "mongoose";
import ExpenseCategory from "../models/ExpenseCategory.js";
import Expense from "../models/Expense.js";
import Client from "../models/Client.js";
import CrmOverseasClient from "../models/CrmOverseasClient.js";
import { ApiError } from "../utils/apiError.js";
import NotificationService from "./notification.service.js";
import { saveBase64File } from "../utils/fileStorage.js";

export class ExpenseService {
  static async resolveClientInfo(clientId) {
    if (!clientId) return { allIds: [], canonicalId: null, clientName: "", clientObj: null };
    const rawStr = String(clientId._id || clientId.id || clientId).trim();
    if (!rawStr) return { allIds: [], canonicalId: null, clientName: "", clientObj: null };

    const allIds = new Set([rawStr]);
    const crmQuery = [{ clientId: rawStr }];
    if (mongoose.Types.ObjectId.isValid(rawStr)) {
      crmQuery.push({ _id: new mongoose.Types.ObjectId(rawStr) });
      allIds.add(new mongoose.Types.ObjectId(rawStr));
    }

    const crmClient = await CrmOverseasClient.findOne({ $or: crmQuery }).lean();
    if (crmClient) {
      if (crmClient._id) {
        allIds.add(String(crmClient._id));
        allIds.add(crmClient._id);
      }
      if (crmClient.clientId) allIds.add(String(crmClient.clientId));
      const canonicalId = crmClient.clientId || String(crmClient._id);
      const clientName = crmClient.companyName || crmClient.name || "";
      return {
        allIds: Array.from(allIds),
        canonicalId,
        clientName,
        clientObj: {
          _id: String(crmClient._id),
          id: canonicalId,
          clientId: canonicalId,
          name: clientName,
          companyName: clientName,
          company: clientName,
        },
      };
    }

    const adminQueries = [{ company: rawStr }, { clientId: rawStr }];
    if (mongoose.Types.ObjectId.isValid(rawStr)) {
      adminQueries.push({ _id: new mongoose.Types.ObjectId(rawStr) });
    }
    const adminClient = await Client.findOne({ $or: adminQueries }).lean();
    if (adminClient) {
      if (adminClient._id) {
        allIds.add(String(adminClient._id));
        allIds.add(adminClient._id);
      }
      if (adminClient.clientId) allIds.add(String(adminClient.clientId));
      if (adminClient.company) allIds.add(String(adminClient.company));
      const canonicalId = adminClient.clientId || String(adminClient._id);
      const clientName = adminClient.company || adminClient.name || "";
      return {
        allIds: Array.from(allIds),
        canonicalId,
        clientName,
        clientObj: {
          _id: String(adminClient._id),
          id: canonicalId,
          clientId: canonicalId,
          name: clientName,
          companyName: clientName,
          company: clientName,
        },
      };
    }

    return {
      allIds: Array.from(allIds),
      canonicalId: rawStr,
      clientName: "",
      clientObj: null,
    };
  }

  static formatCategory(category) {
    if (!category) return null;
    return {
      ...(category.toObject ? category.toObject() : category),
      id: category._id?.toString() || category.id,
      _id: category._id?.toString() || category.id,
    };
  }

  static formatExpense(expense, clientLookupMap = null) {
    if (!expense) return null;
    const catObj = expense.categoryId;
    const empObj = expense.employeeId;
    const rawClient = expense.clientId;
    const rawClientStr = rawClient
      ? String(rawClient._id || rawClient.id || rawClient).trim()
      : "";
    const lookedUpClient = rawClientStr && clientLookupMap ? clientLookupMap.get(rawClientStr) : null;
    const resolvedClientName =
      expense.clientName ||
      lookedUpClient?.clientName ||
      (typeof rawClient === "object" && rawClient ? rawClient.companyName || rawClient.company || rawClient.name || "" : "");

    const clientObj = lookedUpClient?.clientObj
      ? lookedUpClient.clientObj
      : typeof rawClient === "object" && rawClient !== null
      ? {
          ...(rawClient.toObject ? rawClient.toObject() : rawClient),
          id: rawClient.clientId || rawClient._id?.toString() || rawClientStr,
          _id: rawClient._id?.toString() || rawClientStr,
          name: resolvedClientName,
          companyName: resolvedClientName,
        }
      : rawClientStr
      ? {
          id: rawClientStr,
          _id: rawClientStr,
          name: resolvedClientName || "Client",
          companyName: resolvedClientName || "Client",
        }
      : null;

    return {
      ...(expense.toObject ? expense.toObject() : expense),
      id: expense._id?.toString() || expense.id,
      _id: expense._id?.toString() || expense.id,
      name: expense.title || expense.name || "",
      title: expense.title || expense.name || "",
      clientId: clientObj?.id || rawClientStr || null,
      clientName: resolvedClientName,
      type: expense.status === "Pending" ? "Claim" : "Expense",
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
      client: clientObj,
    };
  }

  static async buildClientLookupMap() {
    const map = new Map();
    const [crmClients, adminClients] = await Promise.all([
      CrmOverseasClient.find({}, { clientId: 1, companyName: 1 }).lean(),
      Client.find({}, { clientId: 1, company: 1, name: 1 }).lean(),
    ]);
    for (const c of crmClients) {
      const canonicalId = c.clientId || String(c._id);
      const clientName = c.companyName || "Client";
      const entry = {
        canonicalId,
        clientName,
        clientObj: { _id: String(c._id), id: canonicalId, clientId: canonicalId, name: clientName, companyName: clientName, company: clientName },
      };
      map.set(String(c._id), entry);
      if (c.clientId) map.set(String(c.clientId), entry);
    }
    for (const c of adminClients) {
      const canonicalId = c.clientId || String(c._id);
      const clientName = c.company || c.name || "Client";
      const entry = {
        canonicalId,
        clientName,
        clientObj: { _id: String(c._id), id: canonicalId, clientId: canonicalId, name: clientName, companyName: clientName, company: clientName },
      };
      if (!map.has(String(c._id))) map.set(String(c._id), entry);
      if (c.clientId && !map.has(String(c.clientId))) map.set(String(c.clientId), entry);
    }
    return map;
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
    if (clientId) {
      const resolved = await ExpenseService.resolveClientInfo(clientId);
      query.clientId = { $in: resolved.allIds };
    }
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

    const [expenses, clientLookupMap] = await Promise.all([
      Expense.find(query)
        .populate("categoryId", "name")
        .populate("employeeId", "name employeeId email designation")
        .sort({ date: -1, createdAt: -1 })
        .lean(),
      this.buildClientLookupMap(),
    ]);

    return expenses.map((e) => this.formatExpense(e, clientLookupMap));
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

    const resolvedClient = clientId ? await ExpenseService.resolveClientInfo(clientId) : { canonicalId: "", clientName: "" };

    const expense = await Expense.create({
      title: finalTitle,
      description: (description || data.name || finalTitle).trim(),
      amount: parseFloat(amount),
      date: date ? new Date(date) : new Date(),
      categoryId: targetCategoryId,
      employeeId: finalEmployeeId,
      clientId: resolvedClient.canonicalId || clientId || null,
      clientName: data.clientName || resolvedClient.clientName || "",
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
          targetRoles: ["SUPER_ADMIN", "ADMIN", "EMPLOYEE_HR"],
          targetType: "ALL",
          actorId: finalEmployeeId ? String(finalEmployeeId) : null,
          actorRole: "EMPLOYEE",
          moduleScope: "WORKFORCE",
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

    const clientLookupMap = await this.buildClientLookupMap();
    return this.formatExpense(expense, clientLookupMap);
  }

  static async reviewExpense(id, { status, adminRemark, adminId, actor = null, paymentMode, transactionRef, paymentNote }) {
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
    ).populate(["categoryId", "employeeId"]);

    if (!expense) {
      throw new ApiError(404, "Expense not found.");
    }

    try {
      if (expense.employeeId) {
        const empId = expense.employeeId._id || expense.employeeId;
        const msg = status === "Paid"
          ? `Your approved expense "${expense.title}" of ₹${Number(expense.amount || 0).toLocaleString("en-IN")} has been PAID/REIMBURSED via ${expense.paymentMode || "Bank Transfer"}${expense.transactionRef ? ` (Ref: ${expense.transactionRef})` : ""}.`
          : `Your expense "${expense.title}" for ₹${Number(expense.amount || 0).toLocaleString("en-IN")} has been ${status.toLowerCase()}.${adminRemark ? ` Remark: "${adminRemark}"` : ""}`;

        await NotificationService.notifyStaffAction({
          actor: actor || (adminId ? { id: adminId, role: "ADMIN" } : null),
          type: "EXPENSE_UPDATE",
          title: `Expense Claim ${status}`,
          message: msg,
          moduleScope: "WORKFORCE",
          targetEmployeeId: empId,
          employeeId: empId,
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

    const clientLookupMap = await this.buildClientLookupMap();
    return this.formatExpense(expense, clientLookupMap);
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
    const clientLookupMap = await this.buildClientLookupMap();
    return this.formatExpense(expense, clientLookupMap);
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

    const resolvedClient = await ExpenseService.resolveClientInfo(clientId);
    const [expenses, clientLookupMap] = await Promise.all([
      Expense.find({ clientId: { $in: resolvedClient.allIds } })
        .populate("categoryId", "name")
        .populate("employeeId", "name employeeId")
        .sort({ date: -1, createdAt: -1 })
        .lean(),
      this.buildClientLookupMap(),
    ]);

    const totalExpensesRecorded = expenses.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
    const totalExpensesPaid = expenses
      .filter((e) => e.status === "Paid")
      .reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
    const pendingExpenses = expenses
      .filter((e) => e.status === "Pending" || e.status === "Approved")
      .reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);

    return {
      clientId: resolvedClient.canonicalId || clientId,
      totalCount: expenses.length,
      totalAmount: totalExpensesRecorded,
      totalExpensesRecorded,
      totalExpensesPaid,
      pendingExpenses,
      approvedAmount: totalExpensesPaid,
      expenses: expenses.map((e) => this.formatExpense(e, clientLookupMap)),
    };
  }
}

export default ExpenseService;
