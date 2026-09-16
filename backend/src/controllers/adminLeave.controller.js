import LeaveService from "../services/leave.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";

/**
 * Enterprise Admin Leave Controller
 */
export const getLeaves = asyncHandler(async (req, res) => {
  const leaves = await LeaveService.getLeaves();
  return res.status(200).json(leaves);
});

export const updateLeaveStatus = asyncHandler(async (req, res) => {
  const { status, adminRemark } = req.body;
  const leave = await LeaveService.updateLeaveStatus(req.params.id, status, adminRemark);
  return res.status(200).json({
    message: `Leave application status updated to ${status}`,
    leave,
  });
});

export default {
  getLeaves,
  updateLeaveStatus,
};
