import mongoose from "mongoose";
import "@/models/customer.model";

const ORDER_STATUSES = ["Pending", "Confirmed", "Shipped", "Delivered", "Cancelled"];

const orderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    productName: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, min: 1 },
    pricePerUnit: { type: Number, required: true, min: 0 },
    costPricePerUnit: { type: Number, min: 0, default: 0 },
    subtotal: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

const shippingAddressSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, trim: true },
    phone: { type: String, required: true, trim: true },
    addressLine1: { type: String, required: true, trim: true },
    addressLine2: { type: String, trim: true, default: "" },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    pincode: { type: String, required: true, trim: true },
  },
  { _id: false },
);

const statusHistorySchema = new mongoose.Schema(
  {
    status: { type: String, enum: ORDER_STATUSES, required: true },
    changedAt: { type: Date, required: true, default: Date.now },
  },
  { _id: false },
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, unique: true, trim: true, index: true },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
    },
    items: { type: [orderItemSchema], required: true, validate: [(items) => items.length > 0, "An order must contain at least one item"] },
    totalAmount: { type: Number, required: true, min: 0 },
    shippingAddress: { type: shippingAddressSchema, required: true },
    status: { type: String, enum: ORDER_STATUSES, default: "Pending" },
    payment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Payment",
    },
    statusHistory: { type: [statusHistorySchema], default: [] },
  },
  { timestamps: true },
);

orderSchema.pre("validate", async function generateOrderNumber() {
  if (!this.isNew || this.orderNumber) {
    return;
  }

  const year = new Date().getFullYear();
  const prefix = `ORD-${year}-`;
  const latestOrder = await this.constructor
    .findOne({ orderNumber: new RegExp(`^${prefix}\\d{4}$`) })
    .sort({ orderNumber: -1 })
    .select("orderNumber")
    .lean();
  const previousSequence = latestOrder ? Number(latestOrder.orderNumber.split("-").pop()) : 0;

  this.orderNumber = `${prefix}${String(previousSequence + 1).padStart(4, "0")}`;
  this.statusHistory.push({ status: this.status || "Pending", changedAt: new Date() });
});

// Re-register during Next.js development hot reloads so schema middleware stays current.
if (mongoose.models.Order) {
  delete mongoose.models.Order;
}

const Order = mongoose.model("Order", orderSchema);

export { ORDER_STATUSES };
export default Order;
