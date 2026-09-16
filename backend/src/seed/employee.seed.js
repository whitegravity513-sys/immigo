import "dotenv/config";
import bcrypt from "bcryptjs";
import Employee from "../models/Employee.js";
import { connectDB } from "../config/db.js";
import { logger } from "../utils/logger.js";

const seedDefaultEmployee = async () => {
  try {
    await connectDB();

    const testEmployeeId = "VESTA-001";
    const testEmail = "employee@vesta.in";
    const testPassword = "Password@123";

    const existingEmp = await Employee.findOne({
      $or: [{ employeeId: testEmployeeId }, { email: testEmail }],
    });

    if (existingEmp) {
      logger.info(`Test Employee [${testEmployeeId}] already exists.`);
      process.exit(0);
    }

    const hashedPassword = await bcrypt.hash(testPassword, 10);

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
    process.exit(0);
  } catch (err) {
    logger.error("Employee seeding failed:", err);
    process.exit(1);
  }
};

seedDefaultEmployee();
