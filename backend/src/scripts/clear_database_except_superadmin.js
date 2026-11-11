import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

async function clearDatabase() {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    throw new Error("MONGO_URI not found in environment variables");
  }

  console.log("Connecting to MongoDB...");
  await mongoose.connect(mongoUri);
  console.log("Connected to database:", mongoose.connection.name);

  const db = mongoose.connection.db;

  const superAdminEmail = (process.env.SUPER_ADMIN_EMAIL || "admin@vista.com").trim().toLowerCase();
  const superAdminPassword = (process.env.SUPER_ADMIN_PASSWORD || "SuperAdmin@Secure2026!").trim();
  const superAdminName = process.env.SUPER_ADMIN_NAME || "Super Admin";

  console.log(`Ensuring Super Admin account [${superAdminEmail}]...`);

  const passwordHash = await bcrypt.hash(superAdminPassword, 12);

  let superAdminUser = await db.collection("users").findOne({
    $or: [{ role: "SUPER_ADMIN" }, { email: superAdminEmail }],
  });

  if (!superAdminUser) {
    const insertRes = await db.collection("users").insertOne({
      name: superAdminName,
      email: superAdminEmail,
      passwordHash,
      role: "SUPER_ADMIN",
      isActive: true,
      isEmailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    superAdminUser = await db.collection("users").findOne({ _id: insertRes.insertedId });
    console.log("Created fresh Super Admin user in 'users'.");
  } else {
    await db.collection("users").updateOne(
      { _id: superAdminUser._id },
      {
        $set: {
          name: superAdminName,
          email: superAdminEmail,
          passwordHash,
          role: "SUPER_ADMIN",
          isActive: true,
          isEmailVerified: true,
          updatedAt: new Date(),
        },
      }
    );
    console.log("Updated existing Super Admin credentials and password hash in 'users'.");
  }

  await db.collection("admins").updateOne(
    { email: superAdminEmail },
    {
      $set: {
        email: superAdminEmail,
        password: passwordHash,
        role: "SUPER_ADMIN",
        name: superAdminName,
        isActive: true,
        updatedAt: new Date(),
      },
      $unset: {
        passwordHash: "",
      },
      $setOnInsert: {
        createdAt: new Date(),
      },
    },
    { upsert: true }
  );
  console.log("Ensured Super Admin in 'admins' collection.");

  const deletedUsers = await db.collection("users").deleteMany({ _id: { $ne: superAdminUser._id } });
  console.log(`Deleted ${deletedUsers.deletedCount} non-superadmin users from 'users'.`);

  const deletedAdmins = await db.collection("admins").deleteMany({ email: { $ne: superAdminEmail } });
  console.log(`Deleted ${deletedAdmins.deletedCount} non-superadmin records from 'admins'.`);

  const collectionsToWipe = [
    "candidates",
    "candidateapplications",
    "crmcandidates",
    "crmcandidateapplications",
    "crmoverseasclients",
    "crmnotifications",
    "crmrefunds",
    "paymenttransactions",
    "candidateactivities",
    "clients",
    "clientpayments",
    "projects",
    "projectassignments",
    "projectpayments",
    "jobs",
    "vendors",
    "vendorpaymentmilestones",
    "interviews",
    "offers",
    "employees",
    "attendances",
    "leaves",
    "meetings",
    "notifications",
    "activitylogs",
    "auditlogs",
    "expenses",
    "expensecategories",
    "invoices",
    "dailyworklogs",
    "holidays",
    "announcements",
    "renewals",
    "otps",
    "refreshtokens",
    "sessions",
    "userpermissions",
  ];

  for (const colName of collectionsToWipe) {
    try {
      const res = await db.collection(colName).deleteMany({});
      console.log(`Cleared collection [${colName}]: deleted ${res.deletedCount} documents.`);
    } catch (err) {
      console.warn(`Collection [${colName}] skip/error:`, err.message);
    }
  }

  const remainingUsers = await db.collection("users").find({}).toArray();
  console.log("\n=== FINAL DATABASE STATE ===");
  console.log("Remaining Users:", remainingUsers.map(u => ({ id: u._id, name: u.name, email: u.email, role: u.role })));

  const remainingAdmins = await db.collection("admins").find({}).toArray();
  console.log("Remaining Admins:", remainingAdmins.map(a => ({ email: a.email, role: a.role })));

  console.log("\nDATABASE CLEARED SUCCESSFULLY! Only Super Admin remains.");
  await mongoose.disconnect();
}

clearDatabase()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Database clear failed:", err);
    process.exit(1);
  });
