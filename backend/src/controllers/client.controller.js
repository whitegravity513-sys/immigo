import ClientService from "../services/client.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";

/**
 * Enterprise Client Controller
 */
export const createClient = asyncHandler(async (req, res) => {
  const client = await ClientService.createClient(req.body);
  return res.status(201).json({ message: "Client saved successfully!", client });
});

export const getClients = asyncHandler(async (req, res) => {
  const { search } = req.query;
  const clients = await ClientService.getClients(search);
  return res.status(200).json({ clients });
});

export const getClientById = asyncHandler(async (req, res) => {
  const client = await ClientService.getClientById(req.params.id);
  return res.status(200).json({ client });
});

export const updateClient = asyncHandler(async (req, res) => {
  const client = await ClientService.updateClient(req.params.id, req.body);
  return res.status(200).json({ message: "Client updated successfully!", client });
});

export const deleteClient = asyncHandler(async (req, res) => {
  await ClientService.deleteClient(req.params.id);
  return res.status(200).json({ message: "Client deleted successfully." });
});

export default {
  createClient,
  getClients,
  getClientById,
  updateClient,
  deleteClient,
};
