import express from "express";
import Razorpay from "razorpay";
import crypto from "crypto";
import env from "../config/env.js";
import { paymentLimiter } from "../middleware/rateLimit.middleware.js";
import ActivityService from "../services/activity.service.js";

const router = express.Router();

const keyId = env.RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID;
const keySecret = env.RAZORPAY_KEY_SECRET || process.env.RAZORPAY_KEY_SECRET;

const razorpay = keyId && keySecret ? new Razorpay({ key_id: keyId, key_secret: keySecret }) : null;

router.post("/create-order", paymentLimiter, async (req, res) => {
  try {
    let { amount, receipt, notes } = req.body;

    if (typeof amount === "string") {
      amount = parseFloat(amount.replace(/[^0-9.]/g, ""));
    }
    amount = Number(amount);

    if (!amount || isNaN(amount) || amount <= 0 || amount > 100000000) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment amount. Amount must be a positive number.",
      });
    }

    if (!razorpay) {
      return res.status(503).json({
        success: false,
        message: "Payment gateway is currently unavailable. Please contact administration.",
      });
    }

    const cleanReceipt = typeof receipt === "string" ? receipt.slice(0, 40) : `rcpt_${Date.now()}`;
    const options = {
      amount: Math.round(amount * 100),
      currency: "INR",
      receipt: cleanReceipt,
      notes: typeof notes === "object" && notes !== null ? notes : {},
    };

    const order = await razorpay.orders.create(options);

    if (!order) {
      return res.status(500).json({ success: false, message: "Failed to initialize payment gateway order." });
    }

    return res.status(200).json({ success: true, order });
  } catch (error) {
    console.error("Payment Order Creation Error:", error.message);
    return res.status(500).json({
      success: false,
      message: "An error occurred while generating payment order.",
    });
  }
});

router.post("/verify-payment", paymentLimiter, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: "Missing mandatory payment verification parameters.",
      });
    }

    if (
      typeof razorpay_order_id !== "string" ||
      typeof razorpay_payment_id !== "string" ||
      typeof razorpay_signature !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message: "Malformed payment verification payload.",
      });
    }

    if (!keySecret) {
      return res.status(503).json({
        success: false,
        message: "Payment verification configuration error.",
      });
    }

    const payload = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac("sha256", keySecret)
      .update(payload)
      .digest("hex");

    const expectedBuffer = Buffer.from(expectedSignature, "utf8");
    const receivedBuffer = Buffer.from(razorpay_signature, "utf8");

    const isAuthentic =
      expectedBuffer.length === receivedBuffer.length &&
      crypto.timingSafeEqual(expectedBuffer, receivedBuffer);

    if (!isAuthentic) {
      return res.status(400).json({
        success: false,
        message: "Payment signature mismatch. Transaction failed authenticity check.",
      });
    }

    try {
      await ActivityService.log({
        userType: "SYSTEM",
        action: "PAYMENT_GATEWAY_VERIFIED",
        title: "Online Payment Verified",
        description: `Payment ${razorpay_payment_id} for Order ${razorpay_order_id} verified successfully via secure HMAC SHA-256.`,
        entityType: "Payment",
        entityId: razorpay_payment_id,
        status: "Completed",
        visibility: "ADMIN",
        metadata: { orderId: razorpay_order_id, paymentId: razorpay_payment_id },
      });
    } catch {}

    return res.status(200).json({
      success: true,
      message: "Payment verified successfully and authenticated.",
    });
  } catch (error) {
    console.error("Payment Verification Error:", error.message);
    return res.status(500).json({
      success: false,
      message: "An internal error occurred during payment verification.",
    });
  }
});

export default router;
