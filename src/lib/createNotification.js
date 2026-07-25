import Notification from "@/models/notification.model";

/**
 * Creates a global admin notification.
 * For "low_stock" notifications, checks if an UNREAD notification for the same relatedId
 * already exists, and skips duplicate creation if found.
 */
export async function createNotification({
  type,
  title,
  message,
  link = "",
  relatedId = null,
  triggeredByAdminName = "",
}) {
  try {
    if (type === "low_stock" && relatedId) {
      const existingUnread = await Notification.findOne({
        type: "low_stock",
        relatedId,
        isRead: false,
      });

      if (existingUnread) {
        // Skip duplicate unread low stock alert
        return null;
      }
    }

    const notification = await Notification.create({
      type,
      title,
      message,
      link,
      relatedId: relatedId || null,
      triggeredByAdminName: triggeredByAdminName || "",
      isRead: false,
    });

    return notification;
  } catch (err) {
    console.error("Failed to create notification:", err);
    return null;
  }
}
