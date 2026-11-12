import express from "express";
import {
  createClient,
  getClients,
  getClientById,
  updateClient,
  deleteClient,
} from "../../controllers/client.controller.js";
import { authenticateRBAC, requireRoles } from "../../middleware/rbac.middleware.js";
import {
  validateCreateClient,
  validateUpdateClient,
} from "../../validators/client.validator.js";

const router = express.Router();

const requireAdminAccess = [authenticateRBAC, requireRoles("SUPER_ADMIN", "ADMIN")];

router.post("/clients", ...requireAdminAccess, validateCreateClient, createClient);
router.get("/clients", ...requireAdminAccess, getClients);
router.get("/clients/:id", ...requireAdminAccess, getClientById);
router.put("/clients/:id", ...requireAdminAccess, validateUpdateClient, updateClient);
router.delete("/clients/:id", ...requireAdminAccess, deleteClient);

export default router;
