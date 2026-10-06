import express from "express";
import {
  getMyProfile,
  updateMyContact,
  updateMyPhoto,
  uploadMyDocument,
  deleteMyDocument,
} from "../../controllers/employee.controller.js";
import { verifyEmployee } from "../../middleware/auth.middleware.js";

const router = express.Router();

router.get("/profile", verifyEmployee, getMyProfile);
router.put("/profile", verifyEmployee, updateMyContact);
router.put("/profile/photo", verifyEmployee, updateMyPhoto);
router.post("/documents", verifyEmployee, uploadMyDocument);
router.delete("/documents/:docId", verifyEmployee, deleteMyDocument);

export default router;
