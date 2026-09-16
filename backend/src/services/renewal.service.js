import Renewal from "../models/Renewal.js";
import { ApiError } from "../utils/apiError.js";

const addOneYear = (dateString) => {
  if (!dateString) return null;
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return null;
  date.setFullYear(date.getFullYear() + 1);
  return date;
};

const computeStatus = (hExpiry, aExpiry) => {
  const now = new Date();
  const next7Days = new Date();
  next7Days.setDate(now.getDate() + 7);

  const dates = [];
  if (hExpiry) dates.push(new Date(hExpiry));
  if (aExpiry) dates.push(new Date(aExpiry));

  if (dates.length === 0) return "Active";

  for (const date of dates) {
    if (date < now) {
      return "Expired";
    }
    if (date <= next7Days) {
      return "Expiring Soon";
    }
  }
  return "Active";
};

/**
 * Enterprise Service & AMC Renewal Management Service
 */
export class RenewalService {
  static formatRenewal(renewal) {
    if (!renewal) return null;
    const proj = renewal.projectId;
    const currentStatus = computeStatus(renewal.hostingerExpiryDate, renewal.amcExpiryDate);
    return {
      ...(renewal.toObject ? renewal.toObject() : renewal),
      id: renewal._id?.toString() || renewal.id,
      _id: renewal._id?.toString() || renewal.id,
      status: currentStatus,
      client: proj?.clientId || null,
      projectName: proj?.title || "",
    };
  }

  static async createRenewal(data) {
    const { projectId, hostingerPurchaseDate, amcPurchaseDate, notes } = data;
    if (!projectId) {
      throw new ApiError(400, "projectId is required");
    }

    const hostingerExpiryDate = addOneYear(hostingerPurchaseDate);
    const amcExpiryDate = addOneYear(amcPurchaseDate);
    const status = computeStatus(hostingerExpiryDate, amcExpiryDate);

    const renewal = await Renewal.create({
      projectId,
      hostingerPurchaseDate: hostingerPurchaseDate ? new Date(hostingerPurchaseDate) : null,
      hostingerExpiryDate,
      amcPurchaseDate: amcPurchaseDate ? new Date(amcPurchaseDate) : null,
      amcExpiryDate,
      notes: notes || "",
      status,
    });

    await renewal.populate({
      path: "projectId",
      select: "title clientId",
      populate: { path: "clientId", select: "name company" },
    });

    return this.formatRenewal(renewal);
  }

  static async getRenewals() {
    const renewals = await Renewal.find()
      .populate({
        path: "projectId",
        select: "title clientId",
        populate: { path: "clientId", select: "name company email phone" },
      })
      .sort({ createdAt: -1 })
      .lean();

    return renewals.map((renewal) => this.formatRenewal(renewal));
  }

  static async updateRenewal(id, data) {
    const { hostingerPurchaseDate, amcPurchaseDate, notes } = data;

    const hostingerExpiryDate = addOneYear(hostingerPurchaseDate);
    const amcExpiryDate = addOneYear(amcPurchaseDate);
    const status = computeStatus(hostingerExpiryDate, amcExpiryDate);

    const renewal = await Renewal.findById(id);
    if (!renewal) {
      throw new ApiError(404, "Renewal not found");
    }

    renewal.hostingerPurchaseDate = hostingerPurchaseDate ? new Date(hostingerPurchaseDate) : null;
    renewal.hostingerExpiryDate = hostingerExpiryDate;
    renewal.amcPurchaseDate = amcPurchaseDate ? new Date(amcPurchaseDate) : null;
    renewal.amcExpiryDate = amcExpiryDate;
    if (notes !== undefined) renewal.notes = notes;
    renewal.status = status;

    await renewal.save();
    await renewal.populate({
      path: "projectId",
      select: "title clientId",
      populate: { path: "clientId", select: "name company" },
    });

    return this.formatRenewal(renewal);
  }

  static async deleteRenewal(id) {
    const renewal = await Renewal.findByIdAndDelete(id);
    if (!renewal) {
      throw new ApiError(404, "Renewal not found");
    }
    return renewal;
  }

  static async getRenewalAlerts() {
    const renewals = await Renewal.find().populate({
      path: "projectId",
      select: "title clientId",
      populate: { path: "clientId", select: "name company" },
    });

    const now = new Date();
    const next7Days = new Date();
    next7Days.setDate(now.getDate() + 7);

    const alerts = [];

    for (const renewal of renewals) {
      if (renewal.hostingerExpiryDate) {
        const expDate = new Date(renewal.hostingerExpiryDate);
        if (expDate <= next7Days) {
          const daysRemaining = Math.ceil(
            (expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
          );
          alerts.push({
            id: renewal._id.toString() + "_hostinger",
            renewalId: renewal._id.toString(),
            clientName: renewal.projectId?.clientId?.name || "No Client",
            company: renewal.projectId?.clientId?.company || "",
            projectName: renewal.projectId?.title || "No Project",
            service: "Hostinger",
            expiryDate: expDate,
            daysRemaining,
            isExpired: daysRemaining < 0,
          });
        }
      }

      if (renewal.amcExpiryDate) {
        const expDate = new Date(renewal.amcExpiryDate);
        if (expDate <= next7Days) {
          const daysRemaining = Math.ceil(
            (expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
          );
          alerts.push({
            id: renewal._id.toString() + "_amc",
            renewalId: renewal._id.toString(),
            clientName: renewal.projectId?.clientId?.name || "No Client",
            company: renewal.projectId?.clientId?.company || "",
            projectName: renewal.projectId?.title || "No Project",
            service: "AMC",
            expiryDate: expDate,
            daysRemaining,
            isExpired: daysRemaining < 0,
          });
        }
      }
    }

    alerts.sort((a, b) => a.expiryDate.getTime() - b.expiryDate.getTime());

    const expired = alerts.filter((a) => a.isExpired);
    const expiringSoon = alerts.filter((a) => !a.isExpired);

    return { expired, expiringSoon };
  }
}

export default RenewalService;
