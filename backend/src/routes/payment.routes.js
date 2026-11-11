import express from "express";
import { verifyToken } from "../middleware/auth.middleware.js";
import { paymentLimiter } from "../middleware/rateLimit.middleware.js";
import ActivityService from "../services/activity.service.js";
import {
  getRazorpayKeyId,
  createGatewayOrder,
  verifyAndFetchRazorpayPayment,
} from "../services/razorpayVerification.service.js";

const router = express.Router();

router.get("/config", verifyToken, (req, res) => {
  const keyId = getRazorpayKeyId();
  return res.status(200).json({
    success: true,
    keyId,
    configured: Boolean(keyId),
  });
});

router.post("/create-order", verifyToken, paymentLimiter, async (req, res) => {
  try {
    const { amount, receipt, notes, applicationId, milestoneId } = req.body || {};
    const appId = applicationId || notes?.appId || notes?.applicationId || "";
    const msId = milestoneId || notes?.milestoneId || "";

    const { order, keyId } = await createGatewayOrder({
      amount,
      receipt,
      notes,
      applicationId: appId,
      milestoneId: msId,
      actorId: req.user?.vendorId || req.user?.candidateId || req.user?.id || req.user?._id || "",
      actorRole: req.user?.role || "",
      reqUser: req.user,
    });

    return res.status(200).json({ success: true, order, keyId });
  } catch (error) {
    const status = error.statusCode || 500;
    return res.status(status).json({
      success: false,
      message: error.message || "An error occurred while generating payment order.",
    });
  }
});

router.post("/verify-payment", verifyToken, paymentLimiter, async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      applicationId,
      milestoneId,
    } = req.body || {};

    const { verifiedAmountInr } = await verifyAndFetchRazorpayPayment({
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      signature: razorpay_signature,
      applicationId: applicationId || "",
      milestoneId: milestoneId || "",
      actorId: req.user?.vendorId || req.user?.candidateId || req.user?.id || req.user?._id || "",
      actorRole: req.user?.role || "",
      consume: false,
    });

    try {
      await ActivityService.log({
        userType: "SYSTEM",
        action: "PAYMENT_GATEWAY_VERIFIED",
        title: "Online Payment Verified",
        description: `Payment ${razorpay_payment_id} for Order ${razorpay_order_id} verified successfully via Razorpay gateway.`,
        entityType: "Payment",
        entityId: razorpay_payment_id,
        status: "Completed",
        visibility: "ADMIN",
        metadata: {
          orderId: razorpay_order_id,
          paymentId: razorpay_payment_id,
          verifiedAmountInr,
        },
      });
    } catch {}

    return res.status(200).json({
      success: true,
      verifiedAmountInr,
      message: "Payment verified successfully and authenticated.",
    });
  } catch (error) {
    const status = error.statusCode || 500;
    return res.status(status).json({
      success: false,
      message: error.message || "An internal error occurred during payment verification.",
    });
  }
});

export default router;
