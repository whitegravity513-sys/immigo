import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import "dotenv/config";
import { connectDB } from "../config/db.js";
import Candidate from "../models/Candidate.js";
import CandidateApplication from "../models/CandidateApplication.js";
import { logger } from "../utils/logger.js";

export const resetAndSeedCandidates = async (exitOnComplete = true) => {
  try {
    await connectDB();
    logger.info("Connected to MongoDB. Resetting candidates and applications...");

    // 1. Clear existing candidates and applications
    await Candidate.deleteMany({});
    await CandidateApplication.deleteMany({});
    logger.info("Cleared all stale candidates and job applications.");

    // 2. Hash demo password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash("Password@123", salt);

    // 3. Create pre-approved verified demo candidate
    const demoCandidate = await Candidate.create({
      candidateId: "CAN-2026-0001",
      fullName: "Rahul Sharma",
      email: "candidate@immigo.com",
      phone: "+91 98765 43210",
      password: hashedPassword,
      termsAccepted: true,
      accountStatus: "Approved",
      approvalDate: new Date(),
      approvedBy: "System Administrator",
      documentStatus: "Verified",
      jobApplicationAccess: "Unlocked",
      profile: {
        dob: "1996-05-14",
        gender: "Male",
        address: "402, Surya Heights, Andheri West",
        city: "Mumbai",
        state: "Maharashtra",
        pincode: "400058",
        countryPreference: ["United Arab Emirates", "Saudi Arabia", "Qatar", "Kuwait"],
        education: [
          { degree: "Diploma in Mechanical Engineering", institution: "Maharashtra Technical Board", year: "2016" }
        ],
        skills: ["TIG Welding", "MIG/MAG 6G", "Arc Welding", "Piping Blueprints", "ISO Safety Standards"],
        trade: "6G SMAW / TIG Welder",
        experienceYears: 5,
        currentOccupation: "Senior Pipe Welder",
        preferredJobRole: "Structural & Pipe Welder",
        preferredCountries: ["United Arab Emirates", "Saudi Arabia", "Qatar"],
        languages: ["English", "Hindi", "Arabic"],
        passportNumber: "Z8492019",
        passportExpiry: "2034-08-15",
        passportIssueCountry: "India",
        profileCompleted: true,
        profileCompletionPercent: 100,
      },
      documents: [
        {
          id: `doc-${Date.now()}-1`,
          docType: "resume",
          name: "Resume_Mohammad_Al_Arabi.pdf",
          fileUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
          fileName: "Resume_Mohammad_Al_Arabi.pdf",
          fileSize: 245000,
          status: "Verified",
          verifiedAt: new Date(),
          verifiedBy: "Compliance Officer",
          uploadedAt: new Date(),
        },
        {
          id: `doc-${Date.now()}-2`,
          docType: "passport",
          name: "International_Passport_Copy.pdf",
          fileUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
          fileName: "Passport_Z8492019.pdf",
          fileSize: 310000,
          status: "Verified",
          verifiedAt: new Date(),
          verifiedBy: "Compliance Officer",
          uploadedAt: new Date(),
        },
        {
          id: `doc-${Date.now()}-3`,
          docType: "certificate",
          name: "6G_AWS_Welding_Certificate.pdf",
          fileUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
          fileName: "AWS_Certificate_6G.pdf",
          fileSize: 180000,
          status: "Verified",
          verifiedAt: new Date(),
          verifiedBy: "Compliance Officer",
          uploadedAt: new Date(),
        },
      ],
    });

    logger.info(`✅ Demo Candidate created successfully:`);
    logger.info(`   Candidate ID: ${demoCandidate.candidateId}`);
    logger.info(`   Email: ${demoCandidate.email}`);
    logger.info(`   Password: Password@123`);
    logger.info(`   Account Status: ${demoCandidate.accountStatus}`);
    logger.info(`   Job Access: ${demoCandidate.jobApplicationAccess}`);

    if (exitOnComplete) {
      process.exit(0);
    }
  } catch (err) {
    logger.error("❌ Reset and seed failed:", err);
    if (exitOnComplete) {
      process.exit(1);
    }
    throw err;
  }
};

if (import.meta.url === `file://${process.argv[1]?.replace(/\\/g, "/")}` || process.argv[1]?.includes("resetAndSeedCandidates")) {
  resetAndSeedCandidates(true);
}

export default resetAndSeedCandidates;
