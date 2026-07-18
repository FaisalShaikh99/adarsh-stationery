import mongoose from "mongoose";

const customerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Customer name is required"],
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      default: "",
    },
    phone: {
      type: String,
      required: [true, "Customer phone number is required"],
      unique: true,
      index: true,
      trim: true,
    },
    addressLine1: {
      type: String,
      trim: true,
      default: "",
    },
    addressLine2: {
      type: String,
      trim: true,
      default: "",
    },
    city: {
      type: String,
      trim: true,
      default: "",
    },
    state: {
      type: String,
      trim: true,
      default: "",
    },
    pincode: {
      type: String,
      trim: true,
      default: "",
    },
    orderCount: {
      type: Number,
      default: 0,
    },
    totalSpent: {
      type: Number,
      default: 0,
    },
    firstOrderDate: {
      type: Date,
    },
    lastOrderDate: {
      type: Date,
    },
    status: {
      type: String,
      enum: ["Active", "Blocked"],
      default: "Active",
    },
    tags: {
      type: [String],
      default: [],
    },
    aiInsight: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

// Re-register during Next.js hot-reloads in development
if (mongoose.models.Customer) {
  delete mongoose.models.Customer;
}

const Customer = mongoose.model("Customer", customerSchema);

export default Customer;
export { Customer };
