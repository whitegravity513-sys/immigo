import mongoose from "mongoose";
import "dotenv/config";
import { connectDB } from "../config/db.js";

// Models to clear
import Attendance from "../models/Attendance.js";
import Leave from "../models/Leave.js";
import DailyWorkLog from "../models/DailyWorkLog.js";
import ActivityLog from "../models/ActivityLog.js";
import CandidateApplication from "../models/CandidateApplication.js";
import CrmCandidate from "../models/CrmCandidate.js";
import CrmCandidateApplication from "../models/CrmCandidateApplication.js";
import Client from "../models/Client.js";
import ClientPayment from "../models/ClientPayment.js";
import CrmOverseasClient from "../models/CrmOverseasClient.js";
import Project from "../models/Project.js";
import ProjectPayment from "../models/ProjectPayment.js";
import Expense from "../models/Expense.js";
import ExpenseCategory from "../models/ExpenseCategory.js";
import Invoice from "../models/Invoice.js";
import Renewal from "../models/Renewal.js";
import Meeting from "../models/Meeting.js";
import Notification from "../models/Notification.js";
import CrmNotification from "../models/CrmNotification.js";

// Login models to keep
import Admin from "../models/Admin.js";
import User from "../models/User.js";
import Employee from "../models/Employee.js";
import Vendor from "../models/Vendor.js";
import Candidate from "../models/Candidate.js";

async function clearSectionDataKeepLogins() {
  try {
    await connectDB();
    console.log("Connected to MongoDB. Starting database wipe for all section data...");

    const results = await Promise.all([
      Attendance.deleteMany({}),
      Leave.deleteMany({}),
      DailyWorkLog.deleteMany({}),
      ActivityLog.deleteMany({}),
      CandidateApplication.deleteMany({}),
      CrmCandidate.deleteMany({}),
      CrmCandidateApplication.deleteMany({}),
      Client.deleteMany({}),
      ClientPayment.deleteMany({}),
      CrmOverseasClient.deleteMany({}),
      Project.deleteMany({}),
      ProjectPayment.deleteMany({}),
      Expense.deleteMany({}),
      ExpenseCategory.deleteMany({}),
      Invoice.deleteMany({}),
      Renewal.deleteMany({}),
      Meeting.deleteMany({}),
      Notification.deleteMany({}),
      CrmNotification.deleteMany({}),
    ]);

    console.log("Successfully cleared section data:");
    console.log(`- Attendances removed: ${results[0].deletedCount}`);
    console.log(`- Leaves removed: ${results[1].deletedCount}`);
    console.log(`- DailyWorkLogs removed: ${results[2].deletedCount}`);
    console.log(`- ActivityLogs removed: ${results[3].deletedCount}`);
    console.log(`- CandidateApplications removed: ${results[4].deletedCount}`);
    console.log(`- CrmCandidates removed: ${results[5].deletedCount}`);
    console.log(`- CrmCandidateApplications removed: ${results[6].deletedCount}`);
    console.log(`- Clients removed: ${results[7].deletedCount}`);
    console.log(`- ClientPayments removed: ${results[8].deletedCount}`);
    console.log(`- CrmOverseasClients removed: ${results[9].deletedCount}`);
    console.log(`- Projects removed: ${results[10].deletedCount}`);
    console.log(`- ProjectPayments removed: ${results[11].deletedCount}`);
    console.log(`- Expenses removed: ${results[12].deletedCount}`);
    console.log(`- ExpenseCategories removed: ${results[13].deletedCount}`);
    console.log(`- Invoices removed: ${results[14].deletedCount}`);
    console.log(`- Renewals removed: ${results[15].deletedCount}`);
    console.log(`- Meetings removed: ${results[16].deletedCount}`);
    console.log(`- Notifications removed: ${results[17].deletedCount + results[18].deletedCount}`);

    // Verify logins are intact
    const [adminCount, userCount, empCount, vendorCount, candCount] = await Promise.all([
      Admin.countDocuments(),
      User.countDocuments(),
      Employee.countDocuments(),
      Vendor.countDocuments(),
      Candidate.countDocuments(),
    ]);

    console.log("\nVerified Logins Preserved (Untouched):");
    console.log(`- Admins: ${adminCount}`);
    console.log(`- Users: ${userCount}`);
    console.log(`- Employees: ${empCount}`);
    console.log(`- Vendors: ${vendorCount}`);
    console.log(`- Candidates: ${candCount}`);

    console.log("\nDatabase wipe complete! All section data is now 100% clean.");
    process.exit(0);
  } catch (err) {
    console.error("Error clearing section data:", err);
    process.exit(1);
  }
}

clearSectionDataKeepLogins();
