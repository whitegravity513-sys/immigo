import Client from "../models/Client.js";
import { ApiError } from "../utils/apiError.js";
import { generateNextClientId } from "../utils/idGenerator.js";

export class ClientService {
  static async createClient(data) {
    const { name, mobile, phone, email, company, companyName, address, gstPan, remark, directorName, directorEmail, directorMobile, paymentMilestones } = data;
    const finalName = name || companyName || company;
    const finalEmail = email || `${Date.now()}@client.com`;

    if (!finalName) {
      throw new ApiError(400, "Client Name or Company Name is required.");
    }
    
    if (!directorEmail || !/^\S+@\S+\.\S+$/.test(directorEmail)) {
      throw new ApiError(400, "A valid Director Email is required.");
    }
    
    let cleanDirectorMobile = "";
    if (directorMobile) {
      cleanDirectorMobile = String(directorMobile).replace(/\D/g, "");
      if (cleanDirectorMobile.length < 10) {
        throw new ApiError(400, "Director Mobile Number must be at least 10 digits.");
      }
    }

    let formattedMilestones = [];
    if (Array.isArray(paymentMilestones)) {
      formattedMilestones = paymentMilestones.map((m, idx) => ({
        id: m.id || `mls-${Date.now()}-${idx + 1}`,
        name: (m.name || `Milestone ${idx + 1}`).trim(),
        amount: Number(m.amount) || 0,
        condition: (m.condition || "Candidate successfully selected").trim(),
        timeline: (m.timeline || "Within 7 days").trim(),
        description: m.description || "",
        status: m.status || "Pending",
        paidAmount: Number(m.paidAmount) || 0,
        remainingBalance: Math.max(0, (Number(m.amount) || 0) - (Number(m.paidAmount) || 0)),
        remarks: m.remarks || "",
      }));
    }

    const totalAgreed = formattedMilestones.reduce((acc, m) => acc + (Number(m.amount) || 0), 0);

    let clientId = data.clientId || data.id;
    if (!clientId || String(clientId).startsWith("cli-")) {
      clientId = await generateNextClientId();
    }

    const client = await Client.create({
      clientId,
      name: finalName.trim(),
      email: finalEmail.trim().toLowerCase(),
      phone: phone || mobile || "",
      company: companyName || company || "",
      address: address || "",
      directorName: directorName || "",
      directorEmail: directorEmail.trim().toLowerCase(),
      directorMobile: cleanDirectorMobile || "",
      gstPan: gstPan || "",
      remark: remark || "",
      paymentMilestones: formattedMilestones,
      totalAgreedAmount: totalAgreed,
      totalPaidAmount: 0,
      remainingAmount: totalAgreed,
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
    const { name, mobile, phone, email, company, companyName, address, gstPan, remark, directorName, directorEmail, directorMobile, paymentMilestones } = data;
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
    
    if (directorEmail !== undefined) {
      if (!/^\S+@\S+\.\S+$/.test(directorEmail)) {
        throw new ApiError(400, "A valid Director Email is required.");
      }
      updateData.directorEmail = directorEmail.trim().toLowerCase();
    }
    
    if (directorMobile !== undefined) {
      const cleanDirectorMobile = String(directorMobile).replace(/\D/g, "");
      if (cleanDirectorMobile && cleanDirectorMobile.length < 10) {
        throw new ApiError(400, "Director Mobile Number must be at least 10 digits.");
      }
      updateData.directorMobile = cleanDirectorMobile;
    }
    
    if (directorName !== undefined) updateData.directorName = directorName.trim();
    
    if (gstPan !== undefined) updateData.gstPan = gstPan;
    if (remark !== undefined) updateData.remark = remark;

    if (Array.isArray(paymentMilestones)) {
      updateData.paymentMilestones = paymentMilestones.map((m, idx) => ({
        id: m.id || `mls-${Date.now()}-${idx + 1}`,
        name: (m.name || `Milestone ${idx + 1}`).trim(),
        amount: Number(m.amount) || 0,
        condition: (m.condition || "Candidate successfully selected").trim(),
        timeline: (m.timeline || "Within 7 days").trim(),
        description: m.description || "",
        status: m.status || "Pending",
        paidAmount: Number(m.paidAmount) || 0,
        remainingBalance: Math.max(0, (Number(m.amount) || 0) - (Number(m.paidAmount) || 0)),
        dueDate: m.dueDate || null,
        paidDate: m.paidDate || null,
        relatedProjectId: m.relatedProjectId || "",
        relatedProjectName: m.relatedProjectName || "",
        relatedCandidateId: m.relatedCandidateId || "",
        relatedCandidateName: m.relatedCandidateName || "",
        remarks: m.remarks || "",
      }));
      const totalAgreed = updateData.paymentMilestones.reduce((acc, m) => acc + (Number(m.amount) || 0), 0);
      updateData.totalAgreedAmount = totalAgreed;
    }

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
