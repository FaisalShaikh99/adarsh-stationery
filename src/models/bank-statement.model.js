import mongoose from "mongoose";

const STATUSES = ["Matched", "Unmatched", "Partially Matched"];

const bankStatementSchema = new mongoose.Schema(
  {
    date: { type: Date, required: true },
    bank: { type: String, required: true, trim: true },
    transactionReference: { type: String, required: true, trim: true, unique: true, index: true },
    credit: { type: Number, default: 0, min: 0 },
    debit: { type: Number, default: 0, min: 0 },
    balance: { type: Number, required: true },
    remarks: { type: String, trim: true },
    linkedPayment: { type: mongoose.Schema.Types.ObjectId, ref: "Payment" },
    status: { type: String, enum: STATUSES, default: "Unmatched" },
    isArchived: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

if (mongoose.models.BankStatement) {
  delete mongoose.models.BankStatement;
}

const BankStatement = mongoose.model("BankStatement", bankStatementSchema);

export { STATUSES };
export default BankStatement;
