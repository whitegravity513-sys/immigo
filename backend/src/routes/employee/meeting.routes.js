import express from "express";
import { getEmployeeMeetings } from "../../controllers/meeting.controller.js";
import { verifyEmployee } from "../../middleware/auth.middleware.js";

const router = express.Router();

router.get("/meetings", verifyEmployee, getEmployeeMeetings);

export default router;
