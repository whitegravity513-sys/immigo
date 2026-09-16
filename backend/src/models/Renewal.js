import mongoose from "mongoose";

const renewalSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      unique: true,
    },
    hostingerPurchaseDate: {
      type: Date,
      default: null,
    },
    hostingerExpiryDate: {
      type: Date,
      default: null,
    },
    amcPurchaseDate: {
      type: Date,
      default: null,
    },
    amcExpiryDate: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      default: "Active", // "Active", "Expiring Soon", "Expired"
    },
    notes: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        ret.id = ret._id.toString();
        delete ret.__v;
        return ret;
      },
    },
    toObject: {
      virtuals: true,
      transform: (doc, ret) => {
        ret.id = ret._id.toString();
        delete ret.__v;
        return ret;
      },
    },
  }
);

renewalSchema.index({ status: 1 });
renewalSchema.index({ hostingerExpiryDate: 1 });
renewalSchema.index({ amcExpiryDate: 1 });

const Renewal = mongoose.model("Renewal", renewalSchema);
export default Renewal;
