import mongoose from "mongoose";

const projectAssignmentSchema = new mongoose.Schema(
  {
    assignmentType: {
      type: String,
      enum: ["VENDOR_PROJECT", "VENDOR_HR_PROJECT", "EMPLOYEE_HR_PROJECT", "ADMIN_PROJECT"],
      required: true,
      index: true,
    },
    projectId: {
      type: String,
      required: [true, "Project ID is required"],
      index: true,
      trim: true,
    },
    projectRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
    },
    projectName: {
      type: String,
      default: "",
    },
    vendorId: {
      type: String,
      default: "",
      index: true,
      trim: true,
    },
    vendorRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vendor",
    },
    vendorName: {
      type: String,
      default: "",
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    userName: {
      type: String,
      default: "",
    },
    userEmail: {
      type: String,
      default: "",
    },
    userRole: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["Active", "Inactive", "Removed"],
      default: "Active",
      index: true,
    },
    assignedBy: {
      type: String,
      default: "",
    },
    assignedByName: {
      type: String,
      default: "",
    },
    assignedByRole: {
      type: String,
      default: "SUPER_ADMIN",
    },
    assignedAt: {
      type: Date,
      default: Date.now,
    },
    removedAt: {
      type: Date,
      default: null,
    },
    removedBy: {
      type: String,
      default: "",
    },
    notes: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

projectAssignmentSchema.index(
  { assignmentType: 1, projectId: 1, vendorId: 1, userId: 1 },
  { unique: false }
);

export const ProjectAssignment = mongoose.model("ProjectAssignment", projectAssignmentSchema);
export default ProjectAssignment;
