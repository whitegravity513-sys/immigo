import express from "express";
import {
  recordPayment,
  getPayments,
  getLedgerStats,
  reversePayment,
} from "../../controllers/clientPayment.controller.js";
import { verifyAdmin } from "../../middleware/auth.middleware.js";

const router = express.Router();

router.post("/client-payments", verifyAdmin, recordPayment);
router.get("/client-payments", verifyAdmin, getPayments);
router.get("/client-payments/stats", verifyAdmin, getLedgerStats);
router.post("/client-payments/:id/reverse", verifyAdmin, reversePayment);

export default router;
