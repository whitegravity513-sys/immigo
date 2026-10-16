import mongoose from "mongoose";

const vendorSchema = new mongoose.Schema(
  {
    vendorId: {
      type: String,
      required: true,
      unique: true,
    },
    companyName: {
      type: String,
      required: true,
      trim: true,
    },
    registrationNumber: {
      type: String,
      default: "",
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      default: "",
    },
    mobile: {
      type: String,
      default: "",
    },
    pan: {
      type: String,
      default: "",
      trim: true,
      uppercase: true,
    },
    gstin: {
      type: String,
      default: "",
      trim: true,
      uppercase: true,
    },
    country: {
      type: String,
      default: "India",
    },
    state: {
      type: String,
      default: "",
    },
    city: {
      type: String,
      default: "",
    },
    address: {
      type: String,
      default: "",
    },
    website: {
      type: String,
      default: "",
    },
    contactPersonName: {
      type: String,
      default: "",
    },
    contactPersonEmail: {
      type: String,
      lowercase: true,
      trim: true,
    },
    contactPersonPhone: {
      type: String,
      default: "",
    },
    businessType: {
      type: String,
      default: "",
    },
    specialization: {
      type: String,
      default: "",
    },
    countriesServed: [
      {
        type: String,
      },
    ],
    employeeCount: {
      type: String,
      default: "",
    },
    experienceYears: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: [
        "Registration Pending",
        "Registration Approved",
        "Registration Rejected",
        "Registration On Hold",
        "Documents Pending",
        "Documents Under Review",
        "Documents Correction Required",
        "Documents Rejected",
        "Documents Verified",
        "MOU Pending",
        "MOU Under Review",
        "MOU Correction Required",
        "MOU Rejected",
        "Active",
        
        "Pending",
        "Under Review",
        "Pending MOU Approval",
        "Approved",
        "Rejected",
        "Suspended",
      ],
      default: "Registration Pending",
    },
    onboardingStage: {
      type: String,
      enum: [
        "REGISTRATION_PENDING",
        "REGISTRATION_APPROVED",
        "DOCS_PENDING",
        "DOCS_SUBMITTED",
        "DOCS_UNDER_REVIEW",
        "DOCS_VERIFIED",
        "MOU_SENT",
        "MOU_PENDING",
        "MOU_SIGNED",
        "MOU_UNDER_REVIEW",
        "COMPLETED",
        "ACTIVE",
      ],
      default: "REGISTRATION_PENDING",
    },
    adminRemarks: {
      type: String,
      default: "",
    },
    approvedAt: {
      type: Date,
      default: null,
    },
    activationDate: {
      type: Date,
      default: null,
    },
    mouSignMethod: {
      type: String,
      enum: ["digital", "upload", "DIGITAL_ACKNOWLEDGEMENT", "DOWNLOAD_SIGN_UPLOAD", ""],
      default: "",
    },
    signedMouDocUrl: {
      type: String,
      default: "",
    },
    rejectionReason: {
      type: String,
      default: "",
    },
    mouSigned: {
      type: Boolean,
      default: false,
    },
    mouStatus: {
      type: String,
      enum: ["Pending", "Sent", "Signed", "Under Review", "Approved", "Correction Required", "Rejected"],
      default: "Pending",
    },
    documents: [
      {
        id: String,
        name: String,
        fileName: String,
        type: { type: String, default: "Document" },
        fileUrl: String,
        size: String,
        uploadedAt: { type: Date, default: Date.now },
        status: { type: String, default: "Pending" },
        remarks: { type: String, default: "" },
      },
    ],
    documentsUploaded: {
      type: Boolean,
      default: false,
    },
    bankDetails: {
      accountName: { type: String, default: "" },
      accountNumber: { type: String, default: "" },
      bankName: { type: String, default: "" },
      ifsc: { type: String, default: "" },
    },
    mouDocument: {
      title: { type: String, default: "Memorandum of Understanding (MOU)" },
      sentAt: { type: Date, default: null },
      agreementDate: { type: String, default: "" },
      validityYears: { type: String, default: "1 Year" },
      commissionRate: { type: String, default: "" },
      paymentTerms: { type: String, default: "" },
      replacementPeriod: { type: String, default: "" },
      sectors: { type: String, default: "" },
      specialClauses: { type: String, default: "" },
      adminSignatoryName: { type: String, default: "" },
      adminDesignation: { type: String, default: "" },
      fileUrl: { type: String, default: "" },
      termsVersion: { type: String, default: "v1.0" },
    },
    signedMou: {
      signatoryName: { type: String, default: "" },
      designation: { type: String, default: "" },
      signedAt: { type: Date, default: null },
      signatureData: { type: String, default: "" },
      signedFileUrl: { type: String, default: "" },
    },
    verifiedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        ret.id = ret._id.toString();
        delete ret.__v;
        delete ret.password;
        return ret;
      },
    },
  }
);

const Vendor = mongoose.model("Vendor", vendorSchema);
export default Vendor;
