import express from "express";
import crypto from "crypto";
import { verifyToken } from "../middleware/auth.middleware.js";
import {
  issueRealtimeTicket,
  consumeRealtimeTicket,
  addRealtimeClient,
} from "../services/realtime.service.js";

const router = express.Router();

router.post("/ticket", verifyToken, async (req, res) => {
  try {
    const ticket = await issueRealtimeTicket(req.user);
    if (!ticket) {
      return res.status(403).json({
        success: false,
        message: "Account is inactive or unauthorized for live updates.",
      });
    }
    return res.status(200).json({ success: true, ticket });
  } catch {
    return res.status(500).json({
      success: false,
      message: "Failed to create realtime stream ticket.",
    });
  }
});

router.get("/stream", (req, res) => {
  const entry = consumeRealtimeTicket(req.query?.ticket);
  if (!entry) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired realtime stream ticket.",
    });
  }

  res.status(200);
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  if (typeof res.flushHeaders === "function") {
    res.flushHeaders();
  }

  const client = {
    id: crypto.randomBytes(8).toString("hex"),
    res,
    userId: entry.userId,
    roleNorm: entry.roleNorm,
    vendorId: entry.vendorId,
    candidateId: entry.candidateId,
    assignedVendors: entry.assignedVendors,
  };

  const removeClient = addRealtimeClient(client);
  res.write(`event: connected\ndata: ${JSON.stringify({ ok: true, ts: Date.now() })}\n\n`);

  req.on("close", removeClient);
  res.on("close", removeClient);
});

export default router;
