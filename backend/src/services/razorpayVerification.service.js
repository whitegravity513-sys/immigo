import Razorpay from "razorpay";
import crypto from "crypto";
import mongoose from "mongoose";
import env from "../config/env.js";
import PaymentTransaction from "../models/PaymentTransaction.js";
import CandidateApplication from "../models/CandidateApplication.js";
import CrmCandidateApplication from "../models/CrmCandidateApplication.js";
import Candidate from "../models/Candidate.js";
import { ApiError } from "../utils/apiError.js";
import { checkApplicationRefundLock } from "../utils/refundLock.js";
import {
  findProjectAcrossSources,
  fetchAllMergedProjects,
  resolveProjectMilestonesData,
} from "../utils/projectResolver.js";

export const getRazorpayKeyId = () =>
  String(env.RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID || "").trim();

export const getRazorpayKeySecret = () =>
  String(env.RAZORPAY_KEY_SECRET || process.env.RAZORPAY_KEY_SECRET || "").trim();

export const getRazorpayInstance = () => {
  const keyId = getRazorpayKeyId();
  const keySecret = getRazorpayKeySecret();
  if (!keyId || !keySecret) return null;
  return new Razorpay({ key_id: keyId, key_secret: keySecret });
};

const buildAppQuery = (applicationId) => {
  const s = String(applicationId || "").trim();
  if (!s) return null;
  const or = [{ applicationId: s }, { id: s }];
  if (/^[0-9a-fA-F]{24}$/.test(s)) {
    or.push({ _id: new mongoose.Types.ObjectId(s) });
  }
  return { $or: or };
};

export const verifyActorOwnershipForApplication = async (app, reqUser) => {
  if (!app || !reqUser) {
    throw new ApiError(403, "Forbidden: Authentication required for this application.");
  }
  const roleUpper = String(reqUser.role || "")
    .toUpperCase()
    .replace(/[\s_-]/g, "");
  const hrTypeUpper = String(reqUser.hrType || "")
    .toUpperCase()
    .replace(/[\s_-]/g, "");

  if (["ADMIN", "SUPERADMIN", "VENDORHR"].includes(roleUpper) || (roleUpper === "HR" && hrTypeUpper === "VENDORHR")) {
    return;
  }

  if (roleUpper === "EMPLOYEEHR" || roleUpper === "HR") {
    throw new ApiError(403, "Forbidden: Employee HR is not authorized for candidate application payments.");
  }

  if (roleUpper === "VENDOR" || reqUser.vendorId) {
    const allowedIds = new Set(
      [reqUser.vendorId, reqUser.id, reqUser._id]
        .filter(Boolean)
        .map((v) => String(v).trim())
    );
    if (!app.vendorId || !allowedIds.has(String(app.vendorId).trim())) {
      throw new ApiError(403, "Forbidden: You are not authorized for this vendor application.");
    }
    return;
  }

  if (roleUpper === "CANDIDATE") {
    const reqCandIds = new Set(
      [reqUser.candidateId, reqUser.id, reqUser._id]
        .filter(Boolean)
        .map((v) => String(v).trim())
    );
    const cand = await Candidate.findOne({
      $or: [
        ...(reqUser.id && /^[0-9a-fA-F]{24}$/.test(String(reqUser.id))
          ? [{ _id: reqUser.id }]
          : []),
        ...(reqUser.candidateId ? [{ candidateId: String(reqUser.candidateId) }] : []),
        ...(reqUser.email ? [{ email: String(reqUser.email).trim().toLowerCase() }] : []),
      ],
    })
      .select("candidateId _id")
      .lean();
    if (cand?.candidateId) reqCandIds.add(String(cand.candidateId));
    if (cand?._id) reqCandIds.add(cand._id.toString());

    if (!reqCandIds.has(String(app.candidateId || "").trim())) {
      throw new ApiError(403, "Forbidden: You are not authorized for this candidate application.");
    }
    return;
  }

  throw new ApiError(403, "Forbidden: Unauthorized role for this application payment.");
};

export const resolveAuthoritativeMilestone = async ({ applicationId, milestoneId, reqUser }) => {
  const q = buildAppQuery(applicationId);
  if (!q) {
    throw new ApiError(400, "Invalid application identifier.");
  }

  const [directApp, crmApp] = await Promise.all([
    CandidateApplication.findOne(q).lean(),
    CrmCandidateApplication.findOne(q).lean(),
  ]);

  const app =
    Array.isArray(directApp?.processMilestones) && directApp.processMilestones.length > 0
      ? directApp
      : Array.isArray(crmApp?.processMilestones) && crmApp.processMilestones.length > 0
      ? crmApp
      : directApp || crmApp;

  if (!app) {
    throw new ApiError(404, "Application not found.");
  }

  await verifyActorOwnershipForApplication(app, reqUser);

  const lockState = await checkApplicationRefundLock(app);
  if (lockState.locked) {
    throw new ApiError(
      409,
      `Action locked: candidate has an active refund claim (${lockState.refundStatus || "Pending Admin Approval"}).`
    );
  }

  let milestones = Array.isArray(app.processMilestones) ? app.processMilestones : [];
  if (milestones.length === 0 && (app.projectId || app.projectName)) {
    let matchedProj = app.projectId ? await findProjectAcrossSources(app.projectId) : null;
    if (!matchedProj && app.projectName) {
      const merged = await fetchAllMergedProjects().catch(() => []);
      const targetName = String(app.projectName).trim().toLowerCase();
      matchedProj = merged.find((p) => String(p.projectName || "").trim().toLowerCase() === targetName) || null;
    }
    if (matchedProj) {
      const resolved = resolveProjectMilestonesData(matchedProj, [], Boolean(app.milestonesOverridden));
      milestones = resolved.processMilestones || [];
    }
  }

  const milestone = milestones.find((m) => String(m?.id || "") === String(milestoneId || ""));
  if (!milestone) {
    throw new ApiError(404, "Milestone not found.");
  }

  if (milestone.paymentStatus === "Approved") {
    throw new ApiError(400, "Milestone payment has already been approved.");
  }

  const amountInr = Number(milestone.paymentAmount ?? milestone.amount ?? 0);
  if (Number.isNaN(amountInr) || amountInr <= 0 || amountInr > 100000000) {
    throw new ApiError(400, "Milestone payment amount must be a positive number.");
  }

  return { app, milestone, amountInr };
};

export const createGatewayOrder = async ({
  amount,
  receipt,
  notes,
  applicationId = "",
  milestoneId = "",
  actorId = "",
  actorRole = "",
  reqUser = null,
}) => {
  const razorpay = getRazorpayInstance();
  const keyId = getRazorpayKeyId();
  if (!razorpay || !keyId) {
    throw new ApiError(503, "Payment gateway is currently unavailable. Please contact administration.");
  }

  let resolvedAppId = String(applicationId || "").trim();
  const resolvedMilestoneId = String(milestoneId || "").trim();

  if (!resolvedAppId || !resolvedMilestoneId) {
    throw new ApiError(400, "Application ID and milestone ID are required to initialize payment.");
  }

  const resolved = await resolveAuthoritativeMilestone({
    applicationId: resolvedAppId,
    milestoneId: resolvedMilestoneId,
    reqUser,
  });
  const authoritativeAmount = resolved.amountInr;
  resolvedAppId = resolved.app.applicationId || resolved.app.id || resolvedAppId;

  const cleanReceipt =
    typeof receipt === "string" && receipt.trim()
      ? receipt.trim().slice(0, 40)
      : `rcpt_${Date.now()}`;
  const amountPaise = Math.round(authoritativeAmount * 100);
  const safeNotes = typeof notes === "object" && notes !== null ? { ...notes } : {};
  if (resolvedAppId) safeNotes.applicationId = resolvedAppId;
  if (resolvedMilestoneId) safeNotes.milestoneId = resolvedMilestoneId;

  const order = await razorpay.orders.create({
    amount: amountPaise,
    currency: "INR",
    receipt: cleanReceipt,
    notes: safeNotes,
  });

  if (!order || !order.id) {
    throw new ApiError(500, "Failed to initialize payment gateway order.");
  }

  const transaction = await PaymentTransaction.create({
    orderId: order.id,
    amount: authoritativeAmount,
    amountPaise: order.amount || amountPaise,
    currency: order.currency || "INR",
    status: "created",
    applicationId: resolvedAppId,
    milestoneId: resolvedMilestoneId,
    actorId: String(actorId || ""),
    actorRole: String(actorRole || ""),
    receipt: cleanReceipt,
  });

  return { order, keyId, transaction };
};

export const verifyRazorpayHmac = (orderId, paymentId, signature) => {
  const keySecret = getRazorpayKeySecret();
  if (!keySecret) {
    throw new ApiError(503, "Payment verification configuration error.");
  }

  if (
    typeof orderId !== "string" ||
    typeof paymentId !== "string" ||
    typeof signature !== "string" ||
    !orderId.trim() ||
    !paymentId.trim() ||
    !signature.trim()
  ) {
    throw new ApiError(400, "Malformed payment verification payload.");
  }

  const payload = `${orderId.trim()}|${paymentId.trim()}`;
  const expectedSignature = crypto
    .createHmac("sha256", keySecret)
    .update(payload)
    .digest("hex");

  const expectedBuffer = Buffer.from(expectedSignature, "utf8");
  const receivedBuffer = Buffer.from(signature.trim(), "utf8");

  const isAuthentic =
    expectedBuffer.length === receivedBuffer.length &&
    crypto.timingSafeEqual(expectedBuffer, receivedBuffer);

  if (!isAuthentic) {
    throw new ApiError(400, "Payment signature mismatch. Transaction failed authenticity check.");
  }
};

export const verifyAndFetchRazorpayPayment = async ({
  orderId,
  paymentId,
  signature,
  expectedAmountInr = 0,
  applicationId = "",
  milestoneId = "",
  actorId = "",
  actorRole = "",
  consume = false,
}) => {
  const cleanOrderId = String(orderId || "").trim();
  const cleanPaymentId = String(paymentId || "").trim();
  const cleanSignature = String(signature || "").trim();
  const cleanAppId = String(applicationId || "").trim();
  const cleanMilestoneId = String(milestoneId || "").trim();

  if (!cleanOrderId || !cleanPaymentId || !cleanSignature) {
    throw new ApiError(400, "Missing mandatory payment verification parameters.");
  }

  verifyRazorpayHmac(cleanOrderId, cleanPaymentId, cleanSignature);

  const [existingByOrder, existingByPayment] = await Promise.all([
    PaymentTransaction.findOne({ orderId: cleanOrderId }),
    PaymentTransaction.findOne({ paymentId: cleanPaymentId }),
  ]);

  if (existingByPayment && existingByPayment.orderId !== cleanOrderId) {
    throw new ApiError(409, "Payment ID is bound to a different order.");
  }

  if (existingByPayment?.status === "consumed" || existingByOrder?.status === "consumed") {
    throw new ApiError(409, "This payment has already been consumed.");
  }

  const txnRecord = existingByOrder || existingByPayment;
  const isPrivilegedActor = ["ADMIN", "SUPERADMIN", "VENDORHR"].includes(
    String(actorRole || "")
      .toUpperCase()
      .replace(/[\s_-]/g, "")
  );
  if (txnRecord) {
    if (txnRecord.applicationId && cleanAppId && txnRecord.applicationId !== cleanAppId) {
      throw new ApiError(403, "Payment order belongs to a different application.");
    }
    if (txnRecord.milestoneId && cleanMilestoneId && txnRecord.milestoneId !== cleanMilestoneId) {
      throw new ApiError(403, "Payment order belongs to a different milestone.");
    }
    if (
      txnRecord.actorId &&
      actorId &&
      !isPrivilegedActor &&
      String(txnRecord.actorId) !== String(actorId)
    ) {
      throw new ApiError(403, "Payment order belongs to a different account.");
    }
  }

  const expectedPaise =
    Number(expectedAmountInr) > 0 ? Math.round(Number(expectedAmountInr) * 100) : 0;

  if (txnRecord && expectedPaise > 0 && Number(txnRecord.amountPaise || 0) < expectedPaise) {
    throw new ApiError(400, "Order amount is less than required milestone fee.");
  }

  const razorpay = getRazorpayInstance();
  if (!razorpay) {
    throw new ApiError(503, "Payment verification configuration error.");
  }

  let gatewayPayment;
  try {
    gatewayPayment = await razorpay.payments.fetch(cleanPaymentId);
  } catch (err) {
    throw new ApiError(
      400,
      err?.error?.description || err?.message || "Failed to verify payment with payment gateway."
    );
  }

  if (!gatewayPayment || !gatewayPayment.id) {
    throw new ApiError(400, "Payment record not found on gateway.");
  }

  if (gatewayPayment.order_id && String(gatewayPayment.order_id) !== cleanOrderId) {
    throw new ApiError(400, "Gateway payment order ID does not match.");
  }

  if (!txnRecord && gatewayPayment.notes) {
    const noteAppId = String(gatewayPayment.notes.applicationId || gatewayPayment.notes.appId || "").trim();
    const noteMilestoneId = String(gatewayPayment.notes.milestoneId || "").trim();
    if (noteAppId && cleanAppId && noteAppId !== cleanAppId) {
      throw new ApiError(403, "Gateway payment belongs to a different application.");
    }
    if (noteMilestoneId && cleanMilestoneId && noteMilestoneId !== cleanMilestoneId) {
      throw new ApiError(403, "Gateway payment belongs to a different milestone.");
    }
  }

  if (String(gatewayPayment.currency || "").toUpperCase() !== "INR") {
    throw new ApiError(400, "Unsupported payment currency.");
  }

  const paidPaise = Number(gatewayPayment.amount || 0);
  if (paidPaise <= 0 || (expectedPaise > 0 && paidPaise < expectedPaise)) {
    throw new ApiError(400, "Gateway payment amount is less than required milestone fee.");
  }

  if (gatewayPayment.status === "authorized" && !gatewayPayment.captured) {
    try {
      gatewayPayment = await razorpay.payments.capture(cleanPaymentId, paidPaise, "INR");
    } catch (capErr) {
      throw new ApiError(
        400,
        capErr?.error?.description || capErr?.message || "Failed to capture authorized payment."
      );
    }
  }

  if (gatewayPayment.status !== "captured" && gatewayPayment.captured !== true) {
    throw new ApiError(
      400,
      `Payment is in "${gatewayPayment.status || "unverified"}" state and has not been captured.`
    );
  }

  const verifiedAmountInr = paidPaise / 100;
  const targetStatus = consume ? "consumed" : "verified";
  const now = new Date();

  let updatedTxn = null;
  try {
    if (txnRecord) {
      updatedTxn = await PaymentTransaction.findOneAndUpdate(
        {
          _id: txnRecord._id,
          status: { $ne: "consumed" },
        },
        {
          $set: {
            paymentId: cleanPaymentId,
            signature: cleanSignature,
            status: targetStatus,
            amount: verifiedAmountInr,
            amountPaise: paidPaise,
            verifiedAt: txnRecord.verifiedAt || now,
            ...(consume ? { consumedAt: now } : {}),
            ...(cleanAppId ? { applicationId: cleanAppId } : {}),
            ...(cleanMilestoneId ? { milestoneId: cleanMilestoneId } : {}),
            ...(actorId && !txnRecord.actorId ? { actorId: String(actorId) } : {}),
            ...(actorRole && !txnRecord.actorRole ? { actorRole: String(actorRole) } : {}),
            gatewayPayload: {
              id: gatewayPayment.id,
              order_id: gatewayPayment.order_id,
              amount: gatewayPayment.amount,
              currency: gatewayPayment.currency,
              status: gatewayPayment.status,
              method: gatewayPayment.method || "",
            },
          },
        },
        { returnDocument: "after" }
      );
      if (!updatedTxn) {
        throw new ApiError(409, "This payment has already been consumed.");
      }
    } else {
      updatedTxn = await PaymentTransaction.create({
        orderId: cleanOrderId,
        paymentId: cleanPaymentId,
        signature: cleanSignature,
        amount: verifiedAmountInr,
        amountPaise: paidPaise,
        currency: String(gatewayPayment.currency || "INR").toUpperCase(),
        status: targetStatus,
        applicationId: cleanAppId,
        milestoneId: cleanMilestoneId,
        actorId: String(actorId || ""),
        actorRole: String(actorRole || ""),
        verifiedAt: now,
        consumedAt: consume ? now : null,
        gatewayPayload: {
          id: gatewayPayment.id,
          order_id: gatewayPayment.order_id,
          amount: gatewayPayment.amount,
          currency: gatewayPayment.currency,
          status: gatewayPayment.status,
          method: gatewayPayment.method || "",
        },
      });
    }
  } catch (dbErr) {
    if (dbErr?.code === 11000) {
      throw new ApiError(409, "This payment transaction has already been processed.");
    }
    throw dbErr;
  }

  return {
    transaction: updatedTxn,
    payment: gatewayPayment,
    verifiedAmountInr,
  };
};

