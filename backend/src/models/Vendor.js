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
      enum: ["Pending", "Approved", "Rejected", "Suspended"],
      default: "Pending",
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
      default: "Pending",
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
