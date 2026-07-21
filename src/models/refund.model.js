import mongoose from "mongoose";

const STATUSES = ["Pending", "Processed", "Failed"];

const refundSchema = new mongoose.Schema(
  {
    payment: { type: mongoose.Schema.Types.ObjectId, ref: "Payment", required: true, index: true },
    refundAmount: { type: Number, required: true, min: 0.01 },
    reason: { type: String, trim: true },
    status: { type: String, enum: STATUSES, default: "Pending" },
    approvedBy: { type: String, trim: true },
    processedDate: { type: Date },
    isArchived: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

if (mongoose.models.Refund) {
  delete mongoose.models.Refund;
}

const Refund = mongoose.model("Refund", refundSchema);

export { STATUSES };
export default Refund;
