import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Employee from "../models/Employee.js";
import env from "../config/env.js";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const employeeLogin = asyncHandler(async (req, res) => {
  const { employeeId, email, password } = req.body;
  const identifier = String(employeeId || email || "").trim();
  const cleanPassword = String(password || "").trim();

  if (!identifier || !cleanPassword) {
    throw new ApiError(400, "Employee ID and password are required.");
  }

  if (identifier.includes("@")) {
    throw new ApiError(400, "Please login with your Employee ID only (e.g. IMMI-001). Email login is not allowed for employee accounts.");
  }

  const escapedIdentifier = identifier.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const alphanumeric = identifier.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  let employee = await Employee.findOne({
    $or: [
      { employeeId: identifier },
      { employeeId: identifier.toUpperCase() },
      { employeeId: { $regex: new RegExp(`^${escapedIdentifier}$`, "i") } },
      ...(alphanumeric ? [{ employeeId: `IMMI-${alphanumeric.replace(/^IMMI/, "")}` }] : []),
      ...(alphanumeric === "001" || alphanumeric === "IMMI001" ? [{ employeeId: "IMMI-001" }] : []),
    ],
  });

  if (!employee) {
    throw new ApiError(401, "Invalid Employee ID or password.");
  }

  if (employee.status === "inactive") {
    throw new ApiError(403, "Your account has been deactivated / marked inactive. You cannot log in or mark attendance. Please contact administrator.");
  }

  const isMatch = employee.password ? await bcrypt.compare(cleanPassword, employee.password) : false;

  if (!isMatch) {
    throw new ApiError(401, "Invalid Employee ID or password.");
  }

  const token = jwt.sign(
    {
      id: employee._id.toString(),
      employeeId: employee.employeeId,
      name: employee.name,
      role: "employee",
    },
    env.JWT_SECRET,
    { expiresIn: "30d" }
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
      department: employee.department || "",
      profileImage: employee.profileImage || "",
      leaveBalance: employee.leaveBalance ?? 0,
    },
  });
});

export default {
  employeeLogin,
};
