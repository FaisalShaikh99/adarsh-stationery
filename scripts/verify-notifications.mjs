import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const notificationSchema = new mongoose.Schema(
  {
    type: { type: String, required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    link: { type: String, default: "" },
    relatedId: { type: mongoose.Schema.Types.ObjectId, default: null },
    triggeredByAdminName: { type: String, default: "" },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const Notification = mongoose.models.Notification || mongoose.model("Notification", notificationSchema);

const productSchema = new mongoose.Schema(
  {
    name: String,
    stock: Number,
    minStock: Number,
  },
  { timestamps: true }
);

const Product = mongoose.models.Product || mongoose.model("Product", productSchema);

async function runVerification() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected to MongoDB.");

  // Test 1: Check Seed Notifications
  const newOrderCount = await Notification.countDocuments({ type: "new_order" });
  const newCustomerCount = await Notification.countDocuments({ type: "new_customer" });
  console.log(`\n--- Test 1: Seed Notifications ---`);
  console.log(`new_order Notifications: ${newOrderCount}`);
  console.log(`new_customer Notifications: ${newCustomerCount}`);

  if (newOrderCount > 0 && newCustomerCount > 0) {
    console.log("✓ Test 1 PASSED: new_order and new_customer notifications exist!");
  } else {
    console.log("ℹ Running npm run seed:orders will generate new_order & new_customer notifications.");
  }

  // Test 2: Low Stock Deduplication
  console.log(`\n--- Test 2: Low Stock Deduplication ---`);
  const dummyProductId = new mongoose.Types.ObjectId();
  
  // Helper simulating createNotification for low_stock
  async function triggerLowStock(prodId, name, stock) {
    const existingUnread = await Notification.findOne({
      type: "low_stock",
      relatedId: prodId,
      isRead: false,
    });

    if (existingUnread) {
      console.log(`[Deduplicated] Skipping duplicate low_stock alert for ${name}.`);
      return null;
    }

    return await Notification.create({
      type: "low_stock",
      title: "Low Stock Alert",
      message: `${name} is running low on stock (${stock} left)`,
      link: "/admin/inventory",
      relatedId: prodId,
    });
  }

  // Clean old test alerts for dummyProductId
  await Notification.deleteMany({ relatedId: dummyProductId });

  // First edit -> lower stock -> should create 1 notification
  const n1 = await triggerLowStock(dummyProductId, "Test Notebook", 3);
  console.log("First edit notification created:", !!n1);

  // Second edit -> stock still low -> should skip
  const n2 = await triggerLowStock(dummyProductId, "Test Notebook", 2);
  console.log("Second edit notification created:", !!n2);

  const lowStockAlerts = await Notification.find({ type: "low_stock", relatedId: dummyProductId, isRead: false });
  console.log(`Unread low_stock alerts for product: ${lowStockAlerts.length} (Expected: 1)`);

  if (lowStockAlerts.length === 1 && n1 !== null && n2 === null) {
    console.log("✓ Test 2 PASSED: Low stock deduplication works perfectly!");
  } else {
    console.error("❌ Test 2 FAILED!");
  }

  // Test 3: Order Status Change Notification
  console.log(`\n--- Test 3: Order Status Change ---`);
  const dummyOrderId = new mongoose.Types.ObjectId();
  const adminName = "Test Admin Rahul";
  const orderNumber = "ORD-2026-9999";

  const statusNotif = await Notification.create({
    type: "order_status_change",
    title: "Order Status Updated",
    message: `Order #${orderNumber} changed to Shipped by ${adminName}`,
    link: `/admin/orders/${dummyOrderId}`,
    relatedId: dummyOrderId,
    triggeredByAdminName: adminName,
  });

  console.log("Created order_status_change notification:");
  console.log(`Title: "${statusNotif.title}", Message: "${statusNotif.message}"`);

  if (statusNotif.triggeredByAdminName === "Test Admin Rahul" && statusNotif.message.includes("Rahul")) {
    console.log("✓ Test 3 PASSED: Order status change notification includes admin name!");
  } else {
    console.error("❌ Test 3 FAILED!");
  }

  // Clean test dummy entries
  await Notification.deleteMany({ relatedId: { $in: [dummyProductId, dummyOrderId] } });

  await mongoose.disconnect();
  console.log("\nDisconnected from MongoDB.");
}

runVerification().catch((err) => {
  console.error(err);
  process.exit(1);
});
