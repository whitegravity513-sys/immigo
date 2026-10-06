import express from "express";
import {
  createClient,
  getClients,
  getClientById,
  updateClient,
  deleteClient,
} from "../../controllers/client.controller.js";
import { verifyAdmin } from "../../middleware/auth.middleware.js";
import {
  validateCreateClient,
  validateUpdateClient,
} from "../../validators/client.validator.js";

const router = express.Router();

router.post("/clients", verifyAdmin, validateCreateClient, createClient);
router.get("/clients", verifyAdmin, getClients);
router.get("/clients/:id", verifyAdmin, getClientById);
router.put("/clients/:id", verifyAdmin, validateUpdateClient, updateClient);
router.delete("/clients/:id", verifyAdmin, deleteClient);

export default router;
