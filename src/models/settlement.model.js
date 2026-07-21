import mongoose from "mongoose";

const STATUSES = ["Pending", "Processed", "Failed"];

const settlementSchema = new mongoose.Schema(
  {
    settlementId: { type: String, required: true, trim: true, unique: true, index: true },
    gateway: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
    payments: [{ type: mongoose.Schema.Types.ObjectId, ref: "Payment" }],
    bank: { type: String, trim: true },
    settlementDate: { type: Date, required: true },
    status: { type: String, enum: STATUSES, default: "Pending" },
    isArchived: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

if (mongoose.models.Settlement) {
  delete mongoose.models.Settlement;
}

const Settlement = mongoose.model("Settlement", settlementSchema);

export { STATUSES };
export default Settlement;
