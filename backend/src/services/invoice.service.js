import Invoice from "../models/Invoice.js";
import { ApiError } from "../utils/apiError.js";

export class InvoiceService {
  static formatInvoice(invoice) {
    if (!invoice) return null;
    const clientObj = invoice.clientId;
    return {
      ...(invoice.toObject ? invoice.toObject() : invoice),
      id: invoice._id?.toString() || invoice.id,
      _id: invoice._id?.toString() || invoice.id,
      client: clientObj
        ? {
            ...(clientObj.toObject ? clientObj.toObject() : clientObj),
            id: clientObj._id?.toString() || clientObj.toString(),
            _id: clientObj._id?.toString() || clientObj.toString(),
          }
        : null,
    };
  }

  static async createInvoice(data) {
    const {
      invoiceNo,
      clientId,
      client,
      amount,
      tax,
      totalAmount,
      status,
      dueDate,
      date,
      items,
      projectId,
      projectName,
      clientName,
      companyName,
      clientContact,
      clientEmail,
      supplyAddress,
      gstn,
      adminCompanyName,
      adminAddress,
      adminContact,
      adminEmail,
      adminGstn,
      igstRate,
      cgstRate,
      sgstRate,
      remark,
    } = data;

    const finalClientId = clientId || client;
    if (!finalClientId || !dueDate || !items) {
      throw new ApiError(400, "Client, Due Date, and Items are required.");
    }

    const parsedAmount = Number(amount || 0);
    const parsedTax = Number(tax || 0);
    const parsedTotal = Number(totalAmount || 0);
    const parsedIgst = Number(igstRate || 0);
    const parsedCgst = Number(cgstRate || 0);
    const parsedSgst = Number(sgstRate || 0);
    if (
      !Number.isFinite(parsedAmount) || parsedAmount < 0 ||
      !Number.isFinite(parsedTax) || parsedTax < 0 ||
      !Number.isFinite(parsedTotal) || parsedTotal < 0 ||
      !Number.isFinite(parsedIgst) || parsedIgst < 0 ||
      !Number.isFinite(parsedCgst) || parsedCgst < 0 ||
      !Number.isFinite(parsedSgst) || parsedSgst < 0
    ) {
      throw new ApiError(400, "Invoice amounts and tax rates must be valid non-negative numbers.");
    }

    const finalInvoiceNo = invoiceNo || `INV-${Date.now().toString().slice(-6)}`;
    const itemsStr = typeof items === "string" ? items : JSON.stringify(items);

    const invoice = await Invoice.create({
      invoiceNo: finalInvoiceNo,
      clientId: finalClientId,
      amount: parsedAmount,
      tax: parsedTax,
      totalAmount: parsedTotal,
      status: status || "Unpaid",
      paymentStatus: status || "Unpaid",
      dueDate: new Date(dueDate),
      date: date || "",
      items: itemsStr,
      projectId: projectId || "",
      projectName: projectName || "",
      clientName: clientName || "",
      companyName: companyName || "",
      clientContact: clientContact || "",
      clientEmail: clientEmail || "",
      supplyAddress: supplyAddress || "",
      gstn: gstn || "",
      adminCompanyName: adminCompanyName || "",
      adminAddress: adminAddress || "",
      adminContact: adminContact || "",
      adminEmail: adminEmail || "",
      adminGstn: adminGstn || "",
      igstRate: parsedIgst,
      cgstRate: parsedCgst,
      sgstRate: parsedSgst,
      remark: remark || "",
    });

    await invoice.populate("clientId");
    return this.formatInvoice(invoice);
  }

  static async getAllInvoices(projectId = null) {
    const query = projectId ? { projectId } : {};
    const invoices = await Invoice.find(query).populate("clientId").sort({ createdAt: -1 }).lean();
    return invoices.map((i) => this.formatInvoice(i));
  }

  static async getInvoiceById(id) {
    const invoice = await Invoice.findById(id).populate("clientId").lean();
    if (!invoice) {
      throw new ApiError(404, "Invoice not found.");
    }
    return this.formatInvoice(invoice);
  }

  static async updateInvoice(id, data) {
    const { amount, tax, totalAmount, status, dueDate, items } = data;

    const invoice = await Invoice.findById(id);
    if (!invoice) {
      throw new ApiError(404, "Invoice not found.");
    }

    if (amount !== undefined) {
      const parsedAmount = Number(amount);
      if (!Number.isFinite(parsedAmount) || parsedAmount < 0) {
        throw new ApiError(400, "Invoice amount must be a valid non-negative number.");
      }
      invoice.amount = parsedAmount;
    }
    if (tax !== undefined) {
      const parsedTax = Number(tax);
      if (!Number.isFinite(parsedTax) || parsedTax < 0) {
        throw new ApiError(400, "Tax must be a valid non-negative number.");
      }
      invoice.tax = parsedTax;
    }
    if (totalAmount !== undefined) {
      const parsedTotal = Number(totalAmount);
      if (!Number.isFinite(parsedTotal) || parsedTotal < 0) {
        throw new ApiError(400, "Total amount must be a valid non-negative number.");
      }
      invoice.totalAmount = parsedTotal;
    }
    if (status) {
      invoice.status = status;
      invoice.paymentStatus = status;
    }
    if (dueDate) invoice.dueDate = new Date(dueDate);
    if (items !== undefined) {
      invoice.items = typeof items === "string" ? items : JSON.stringify(items);
    }

    await invoice.save();
    await invoice.populate("clientId");
    return this.formatInvoice(invoice);
  }

  static async deleteInvoice(id) {
    const invoice = await Invoice.findByIdAndDelete(id);
    if (!invoice) {
      throw new ApiError(404, "Invoice not found.");
    }
    return invoice;
  }
}

export default InvoiceService;
