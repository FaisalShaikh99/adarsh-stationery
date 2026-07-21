import mongoose from "mongoose";

const STATUSES = ["Draft", "Sent", "Paid", "Overdue", "Cancelled"];

const invoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: { type: String, required: true, trim: true, unique: true, index: true },
    order: { type: mongoose.Schema.Types.ObjectId, ref: "Order" },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: "Customer" },
    amount: { type: Number, required: true, min: 0 },
    dueDate: { type: Date },
    status: { type: String, enum: STATUSES, default: "Draft" },
  },
  { timestamps: true }
);

if (mongoose.models.Invoice) {
  delete mongoose.models.Invoice;
}

const Invoice = mongoose.model("Invoice", invoiceSchema);

export { STATUSES };
export default Invoice;
