import mongoose from "mongoose";

const crmOverseasClientSchema = new mongoose.Schema(
  {
    clientId: {
      type: String,
      sparse: true,
      trim: true,
    },
    companyName: {
      type: String,
      required: true,
      trim: true,
    },
    companyType: {
      type: String,
      default: "Construction",
    },
    country: {
      type: String,
      default: "UAE",
    },
    city: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      default: "Active",
    },
    projects: {
      type: Array,
      default: [],
    },
    contacts: {
      type: Array,
      default: [],
    },
  },
  {
    strict: false,
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        ret.id = ret.clientId || ret._id.toString();
        delete ret.__v;
        return ret;
      },
    },
  }
);

crmOverseasClientSchema.index({ companyName: 1 });
crmOverseasClientSchema.index({ clientId: 1 });

const CrmOverseasClient = mongoose.model("CrmOverseasClient", crmOverseasClientSchema);
export default CrmOverseasClient;
