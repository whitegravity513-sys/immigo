import express from "express";
import Razorpay from "razorpay";
import crypto from "crypto";
import env from "../config/env.js";

const router = express.Router();

const razorpay = new Razorpay({
  key_id: env.RAZORPAY_KEY_ID || "rzp_test_TlPlO103C4S5Jl",
  key_secret: env.RAZORPAY_KEY_SECRET || "3YIHZJUGAUJ0jOIDn71TPTm6",
});

// Create Order
router.post("/create-order", async (req, res) => {
  try {
    let { amount, receipt } = req.body;
    
    if (typeof amount === "string") {
      amount = parseFloat(amount.replace(/[^0-9.]/g, ""));
    }
    amount = Number(amount);
    
    if (!amount || isNaN(amount) || amount <= 0) {
      return res.status(400).json({ success: false, message: "Valid amount is required (greater than 0)" });
    }

    const options = {
      amount: Math.round(amount * 100), // Convert to paise
      currency: "INR",
      receipt: receipt || `receipt_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);
    
    if (!order) {
      return res.status(500).json({ success: false, message: "Failed to create Razorpay order" });
    }

    res.json({ success: true, order });
  } catch (error) {
    console.error("Razorpay Create Order Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Verify Payment
router.post("/verify-payment", async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ success: false, message: "Invalid payment details" });
    }

    const secret = env.RAZORPAY_KEY_SECRET || "3YIHZJUGAUJ0jOIDn71TPTm6";

    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto.createHmac("sha256", secret).update(body.toString()).digest("hex");

    if (expectedSignature === razorpay_signature) {
      res.json({ success: true, message: "Payment verified successfully" });
    } else {
      res.status(400).json({ success: false, message: "Invalid signature" });
    }
  } catch (error) {
    console.error("Razorpay Verify Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
