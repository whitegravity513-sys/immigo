import "dotenv/config";
import bcrypt from "bcryptjs";
import Employee from "../models/Employee.js";
import { connectDB } from "../config/db.js";
import { logger } from "../utils/logger.js";

export const seedDefaultEmployee = async (exitOnComplete = true) => {
  try {
    await connectDB();

    const testEmployeeId = "VESTA-001";
    const testEmail = "employee@vesta.in";
    const testPassword = process.env.DEFAULT_EMPLOYEE_PASSWORD || "12345";

    const existingEmp = await Employee.findOne({
      $or: [{ employeeId: testEmployeeId }, { email: testEmail }],
    });

    const hashedPassword = await bcrypt.hash(testPassword, 10);

    if (existingEmp) {
      existingEmp.password = hashedPassword;
      existingEmp.status = "active";
      if (!existingEmp.employeeId) existingEmp.employeeId = testEmployeeId;
      await existingEmp.save();

      logger.info(`✅ Default Employee [${testEmployeeId}] password updated to: ${testPassword}`);
      if (exitOnComplete) {
        process.exit(0);
      }
      return existingEmp;
    }

    const emp = await Employee.create({
      employeeId: testEmployeeId,
      name: "Abhishek Sharma",
      email: testEmail,
      password: hashedPassword,
      designation: "Software Engineer",
      joiningDate: new Date(),
      status: "active",
      leaveBalance: 12,
    });

    logger.info(`✅ Default Employee created successfully:
- Employee ID: ${emp.employeeId}
- Email: ${emp.email}
- Password: ${testPassword}
- Name: ${emp.name}`);

    if (exitOnComplete) {
      process.exit(0);
    }
    return emp;
  } catch (err) {
    logger.error("Employee seeding failed:", err);
    if (exitOnComplete) {
      process.exit(1);
    }
    throw err;
  }
};

// Auto-run if executed directly
if (import.meta.url === `file://${process.argv[1]?.replace(/\\/g, "/")}` || process.argv[1]?.endsWith("employee.seed.js")) {
  seedDefaultEmployee(true);
}

export default seedDefaultEmployee;
