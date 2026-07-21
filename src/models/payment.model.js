import mongoose from "mongoose";

const STATUSES = ["Pending", "Paid", "Failed", "Refunded", "Partially Refunded", "Cancelled"];
const TYPES = ["Incoming", "Outgoing"];
const GATEWAYS = ["Razorpay", "Stripe", "None", "Cash", "BankTransfer"];
const METHODS = ["COD", "UPI", "Card", "NetBanking"];

const statusHistorySchema = new mongoose.Schema(
  {
    status: { type: String, enum: STATUSES, required: true },
    changedAt: { type: Date, required: true, default: Date.now },
    changedBy: { type: String, default: "System" },
    remarks: { type: String, default: "" },
  },
  { _id: false }
);

const paymentSchema = new mongoose.Schema(
  {
    paymentNumber: { type: String, unique: true, trim: true, index: true },
    order: { type: mongoose.Schema.Types.ObjectId, ref: "Order" },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: "Customer" },
    invoice: { type: mongoose.Schema.Types.ObjectId, ref: "Invoice" },
    transactionId: { type: String, trim: true, unique: true, sparse: true },
    gatewayTransactionId: { type: String, trim: true },
    gatewayOrderId: { type: String, trim: true },
    gateway: { type: String, enum: GATEWAYS, default: "None" },
    paymentMethod: { type: String, enum: METHODS, default: "UPI" },
    type: { type: String, enum: TYPES, default: "Incoming" },
    amount: { type: Number, required: true, min: 0 },
    refundedAmount: { type: Number, default: 0, min: 0 },
    currency: { type: String, default: "INR" },
    status: { type: String, enum: STATUSES, default: "Pending" },
    paymentDate: { type: Date, default: Date.now },
    referenceNumber: { type: String, trim: true },
    bankName: { type: String, trim: true },
    accountName: { type: String, trim: true },
    accountNumber: { type: String, trim: true }, // Should be stored masked or encrypted in production
    upiId: { type: String, trim: true },
    remarks: { type: String, trim: true },
    failureReason: { type: String, trim: true },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
    statusHistory: { type: [statusHistorySchema], default: [] },
    isArchived: { type: Boolean, default: false, index: true },
    createdBy: { type: String, default: "System" },
    updatedBy: { type: String, default: "System" },
  },
  { timestamps: true }
);

paymentSchema.pre("validate", async function generatePaymentNumber() {
  if (!this.isNew || this.paymentNumber) {
    return;
  }

  const year = new Date().getFullYear();
  const prefix = `PAY-${year}-`;
  const latestPayment = await this.constructor
    .findOne({ paymentNumber: new RegExp(`^${prefix}\\d{5}$`) })
    .sort({ paymentNumber: -1 })
    .select("paymentNumber")
    .lean();

  const previousSequence = latestPayment ? Number(latestPayment.paymentNumber.split("-").pop()) : 0;
  this.paymentNumber = `${prefix}${String(previousSequence + 1).padStart(5, "0")}`;
  
  if (this.statusHistory.length === 0) {
    this.statusHistory.push({
      status: this.status || "Pending",
      changedAt: new Date(),
      changedBy: this.createdBy || "System",
      remarks: "Payment initialized"
    });
  }
});

if (mongoose.models.Payment) {
  delete mongoose.models.Payment;
}

const Payment = mongoose.model("Payment", paymentSchema);

export { STATUSES, TYPES, GATEWAYS, METHODS };
export default Payment;
