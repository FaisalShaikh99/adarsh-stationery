import mongoose from "mongoose";

const StoreSettingsSchema = new mongoose.Schema({
  storeName: {
    type: String,
    required: true,
    default: "Adarsh Stationery",
  },
  contactEmail: {
    type: String,
    required: true,
    default: "support@adarshstationery.com",
  },
  contactPhone: {
    type: String,
    required: true,
    default: "+91 98765 43210",
  },
  storeAddress: {
    type: String,
    required: true,
    default: "123 Stationery Plaza, Main Market, Mumbai, MH - 400001",
  },
}, { timestamps: true });

export const StoreSettings =
  mongoose.models.StoreSettings || mongoose.model("StoreSettings", StoreSettingsSchema);
