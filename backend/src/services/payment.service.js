import ProjectPayment from "../models/ProjectPayment.js";
import { ApiError } from "../utils/apiError.js";

/**
 * Enterprise Project Payment Management Service
 */
export class PaymentService {
  static formatPayment(payment) {
    if (!payment) return null;
    const projObj = payment.projectId;
    return {
      ...(payment.toObject ? payment.toObject() : payment),
      id: payment._id?.toString() || payment.id,
      _id: payment._id?.toString() || payment.id,
      project: projObj
        ? {
            ...(projObj.toObject ? projObj.toObject() : projObj),
            id: projObj._id?.toString() || projObj.toString(),
            _id: projObj._id?.toString() || projObj.toString(),
            projectName: projObj.title,
            totalAmount: projObj.budget,
          }
        : null,
    };
  }

  static async createProjectPayment(data) {
    const {
      projectId,
      project,
      amount,
      note,
      description,
      paymentDate,
      date,
      paymentMode,
      tdsDeducted,
      igst,
      cgst,
      sgst,
    } = data;

    const finalProjectId = projectId || project;
    if (!finalProjectId || amount === undefined || amount === "") {
      throw new ApiError(400, "Project ID and Amount are required.");
    }

    const finalNote = note || description || "";
    const finalDate = paymentDate || date;

    const payment = await ProjectPayment.create({
      projectId: finalProjectId,
      amount: Number(amount) || 0,
      note: finalNote,
      paymentDate: finalDate ? new Date(finalDate) : new Date(),
      paymentMode: paymentMode || "Bank Transfer",
      tdsDeducted: Number(tdsDeducted) || 0,
      igst: igst || "",
      cgst: cgst || "",
      sgst: sgst || "",
    });

    await payment.populate("projectId");
    return this.formatPayment(payment);
  }

  static async getAllProjectPayments() {
    const payments = await ProjectPayment.find().populate("projectId").sort({ createdAt: -1 }).lean();
    return payments.map((p) => this.formatPayment(p));
  }

  static async getPaymentsByProject(projectId) {
    const payments = await ProjectPayment.find({ projectId })
      .populate("projectId")
      .sort({ createdAt: -1 })
      .lean();
    return payments.map((p) => this.formatPayment(p));
  }

  static async updateProjectPayment(id, data) {
    const {
      amount,
      note,
      description,
      paymentDate,
      date,
      paymentMode,
      tdsDeducted,
      igst,
      cgst,
      sgst,
    } = data;

    const payment = await ProjectPayment.findById(id);
    if (!payment) {
      throw new ApiError(404, "Payment not found.");
    }

    if (amount !== undefined) payment.amount = Number(amount);
    if (note !== undefined || description !== undefined) {
      payment.note = note !== undefined ? note : description;
    }
    if (paymentDate !== undefined || date !== undefined) {
      payment.paymentDate = new Date(paymentDate || date);
    }
    if (paymentMode !== undefined) payment.paymentMode = paymentMode;
    if (tdsDeducted !== undefined) payment.tdsDeducted = Number(tdsDeducted);
    if (igst !== undefined) payment.igst = igst;
    if (cgst !== undefined) payment.cgst = cgst;
    if (sgst !== undefined) payment.sgst = sgst;

    await payment.save();
    await payment.populate("projectId");
    return this.formatPayment(payment);
  }

  static async deleteProjectPayment(id) {
    const payment = await ProjectPayment.findByIdAndDelete(id);
    if (!payment) {
      throw new ApiError(404, "Payment not found.");
    }
    return payment;
  }
}

export default PaymentService;
