import mongoose from "mongoose";

export const NOTIFICATION_TYPES = [
  "new_order",
  "low_stock",
  "new_customer",
  "order_status_change",
];

const notificationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: [true, "Notification type is required"],
      enum: {
        values: NOTIFICATION_TYPES,
        message: "Invalid notification type",
      },
    },
    title: {
      type: String,
      required: [true, "Notification title is required"],
      trim: true,
    },
    message: {
      type: String,
      required: [true, "Notification message is required"],
      trim: true,
    },
    link: {
      type: String,
      default: "",
      trim: true,
    },
    relatedId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    triggeredByAdminName: {
      type: String,
      default: "",
      trim: true,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

export const Notification =
  mongoose.models.Notification || mongoose.model("Notification", notificationSchema);

export default Notification;
