import Client from "../models/Client.js";
import { ApiError } from "../utils/apiError.js";

/**
 * Enterprise Client Management Service
 */
export class ClientService {
  static async createClient(data) {
    const { name, mobile, phone, email, company, companyName, address, gstPan, remark } = data;
    const finalName = name || companyName || company;
    const finalEmail = email || `${Date.now()}@client.com`;

    if (!finalName) {
      throw new ApiError(400, "Client Name or Company Name is required.");
    }

    const client = await Client.create({
      name: finalName.trim(),
      email: finalEmail.trim().toLowerCase(),
      phone: phone || mobile || "",
      company: companyName || company || "",
      address: address || "",
      gstPan: gstPan || "",
      remark: remark || "",
    });

    return {
      ...client.toObject(),
      id: client._id.toString(),
      _id: client._id.toString(),
      companyName: client.company,
      mobile: client.phone,
    };
  }

  static async getClients(search = "") {
    let query = {};
    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), "i");
      query = {
        $or: [
          { name: regex },
          { email: regex },
          { company: regex },
          { phone: regex },
        ],
      };
    }
    const clients = await Client.find(query).sort({ createdAt: -1 }).lean();
    return clients.map((c) => ({
      ...c,
      id: c._id.toString(),
      _id: c._id.toString(),
      companyName: c.company,
      mobile: c.phone,
    }));
  }

  static async getClientById(id) {
    const client = await Client.findById(id).lean();
    if (!client) {
      throw new ApiError(404, "Client not found.");
    }
    return {
      ...client,
      id: client._id.toString(),
      _id: client._id.toString(),
      companyName: client.company,
      mobile: client.phone,
    };
  }

  static async updateClient(id, data) {
    const { name, mobile, phone, email, company, companyName, address, gstPan, remark } = data;
    const updateData = {};
    if (name !== undefined) updateData.name = name.trim();
    if (companyName !== undefined || company !== undefined) {
      updateData.company = (companyName || company || "").trim();
    }
    if (email !== undefined) updateData.email = email.trim().toLowerCase();
    if (mobile !== undefined || phone !== undefined) {
      updateData.phone = (phone || mobile || "").trim();
    }
    if (address !== undefined) updateData.address = address;
    if (gstPan !== undefined) updateData.gstPan = gstPan;
    if (remark !== undefined) updateData.remark = remark;

    const client = await Client.findByIdAndUpdate(id, updateData, { new: true });
    if (!client) {
      throw new ApiError(404, "Client not found.");
    }

    return {
      ...client.toObject(),
      id: client._id.toString(),
      _id: client._id.toString(),
      companyName: client.company,
      mobile: client.phone,
    };
  }

  static async deleteClient(id) {
    const client = await Client.findByIdAndDelete(id);
    if (!client) {
      throw new ApiError(404, "Client not found.");
    }
    return client;
  }
}

export default ClientService;
