import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Employee from "../models/Employee.js";
import env from "../config/env.js";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

/**
 * Enterprise Employee Authentication Controller
 */
export const employeeLogin = asyncHandler(async (req, res) => {
  const { email, employeeId, password } = req.body;
  const identifier = (email || employeeId || "").trim();

  if (!identifier || !password) {
    throw new ApiError(400, "Email/Employee ID and password are required");
  }

  const employee = await Employee.findOne({
    $or: [
      { email: identifier.toLowerCase() },
      { employeeId: identifier },
      { employeeId: identifier.toUpperCase() },
    ],
  });

  if (!employee) {
    throw new ApiError(401, "Invalid credentials");
  }

  if (employee.status === "inactive") {
    throw new ApiError(403, "Your account has been deactivated. Please contact administrator.");
  }

  const isMatch = await bcrypt.compare(password, employee.password);
  if (!isMatch) {
    throw new ApiError(401, "Invalid credentials");
  }

  const token = jwt.sign(
    {
      id: employee._id.toString(),
      employeeId: employee.employeeId,
      name: employee.name,
      role: "employee",
    },
    env.JWT_SECRET,
    { expiresIn: "7d" }
  );

  return res.status(200).json({
    message: "Employee logged in successfully",
    token,
    employee: {
      id: employee._id.toString(),
      _id: employee._id.toString(),
      employeeId: employee.employeeId,
      name: employee.name,
      email: employee.email,
      designation: employee.designation || "Employee",
      department: employee.department || "General",
      profileImage: employee.profileImage || "",
      leaveBalance: employee.leaveBalance ?? 0,
    },
  });
});

export default {
  employeeLogin,
};
