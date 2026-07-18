import mongoose from "mongoose";
import { matchOrCreateCustomer } from "../src/lib/matchOrCreateCustomer.js";

const SEED_MARKER = /^seed-order-/;
const ORDER_STATUSES = ["Pending", "Confirmed", "Shipped", "Delivered", "Cancelled", "Pending", "Confirmed", "Shipped"];
const PAYMENT_STATUSES = ["Paid", "Paid", "Pending", "Paid", "Failed", "Pending", "Paid", "Paid"];

const ADDRESSES = [
  // Aarav Sharma - repeat customer with 3 orders
  { name: "Aarav Sharma", phone: "9876543210", addressLine1: "42 MG Road", addressLine2: "Near Central Mall", city: "Pune", state: "Maharashtra", pincode: "411001" },
  { name: "Aarav Sharma", phone: "9876543210", addressLine1: "42 MG Road", addressLine2: "Near Central Mall", city: "Pune", state: "Maharashtra", pincode: "411001" },
  { name: "Aarav Sharma", phone: "9876543210", addressLine1: "42 MG Road", addressLine2: "Near Central Mall", city: "Pune", state: "Maharashtra", pincode: "411001" },
  
  // Similar-but-not-identical names in the same city/pincode (duplicates candidate group with Aarav Sharma)
  { name: "Arav Sharma", phone: "9876543211", addressLine1: "42 MG Road", addressLine2: "Near Central Mall", city: "Pune", state: "Maharashtra", pincode: "411001" },
  { name: "Aarav Shama", phone: "9876543212", addressLine1: "45 MG Road", addressLine2: "", city: "Pune", state: "Maharashtra", pincode: "411001" },
  
  // Other customers
  { name: "Ananya Iyer", phone: "9845012345", addressLine1: "18 5th Cross", addressLine2: "Indiranagar", city: "Bengaluru", state: "Karnataka", pincode: "560038" },
  { name: "Rohan Mehta", phone: "9820123456", addressLine1: "B-14 Link Road", addressLine2: "Andheri West", city: "Mumbai", state: "Maharashtra", pincode: "400053" },
  { name: "Kavya Nair", phone: "9895123456", addressLine1: "22 Marine Drive", addressLine2: "Fort Kochi", city: "Kochi", state: "Kerala", pincode: "682001" },
];

function loadEnvironment() {
  if (process.env.MONGODB_URI) return;

  try {
    process.loadEnvFile(".env.local");
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }

  if (!process.env.MONGODB_URI) {
    throw new Error("Please define MONGODB_URI in .env.local before seeding orders.");
  }
}

function getStatusHistory(status, createdAt) {
  const hoursAfterCreation = (hours) => new Date(createdAt.getTime() + hours * 60 * 60 * 1000);
  const history = [{ status: "Pending", changedAt: createdAt }];

  if (["Confirmed", "Shipped", "Delivered"].includes(status)) {
    history.push({ status: "Confirmed", changedAt: hoursAfterCreation(3) });
  }
  if (["Shipped", "Delivered"].includes(status)) {
    history.push({ status: "Shipped", changedAt: hoursAfterCreation(28) });
  }
  if (status === "Delivered") {
    history.push({ status: "Delivered", changedAt: hoursAfterCreation(76) });
  }
  if (status === "Cancelled") {
    history.push({ status: "Cancelled", changedAt: hoursAfterCreation(5) });
  }

  return history;
}

async function seedOrders() {
  loadEnvironment();
  await mongoose.connect(process.env.MONGODB_URI, { bufferCommands: false });

  const db = mongoose.connection.db;
  const existingSeedCount = await db.collection("orders").countDocuments({ razorpayOrderId: SEED_MARKER });
  if (existingSeedCount > 0) {
    console.log(`Seed orders already exist (${existingSeedCount}); no duplicate test data was inserted.`);
    return;
  }

  const products = await db.collection("products").find({}, { projection: { name: 1, sellingPrice: 1 } }).toArray();
  if (products.length === 0) {
    throw new Error("No products found. Create product test data before running npm run seed:orders.");
  }

  const admin = await db.collection("admins").findOne({}, { projection: { _id: 1 } });
  if (!admin) {
    throw new Error("No admin account found. Sign in once before running npm run seed:orders.");
  }

  const year = new Date().getFullYear();
  const prefix = `ORD-${year}-`;
  const [latestOrder] = await db.collection("orders")
    .find({ orderNumber: new RegExp(`^${prefix}\\d{4}$`) }, { projection: { orderNumber: 1 } })
    .sort({ orderNumber: -1 })
    .limit(1)
    .toArray();
  const startingSequence = latestOrder ? Number(latestOrder.orderNumber.split("-").pop()) + 1 : 1;
  const now = new Date();

  // Clear existing customer profiles matching seed phone numbers to keep seeding clean
  const seedPhones = ADDRESSES.map((addr) => addr.phone);
  await db.collection("customers").deleteMany({ phone: { $in: seedPhones } });

  const orders = ORDER_STATUSES.map((status, index) => {
    const productCount = 1 + (index % Math.min(3, products.length));
    const items = Array.from({ length: productCount }, (_, productOffset) => {
      const product = products[(index + productOffset) % products.length];
      const quantity = 1 + ((index + productOffset) % 5);
      const pricePerUnit = Number(product.sellingPrice);

      if (!Number.isFinite(pricePerUnit) || pricePerUnit < 0) {
        throw new Error(`Product ${product._id} does not have a valid sellingPrice.`);
      }

      return {
        product: product._id,
        productName: product.name,
        quantity,
        pricePerUnit,
        subtotal: pricePerUnit * quantity,
      };
    });
    
    // Spread dates so they are chronologically separated
    const createdAt = new Date(now.getTime() - (index * 4 + 1) * 24 * 60 * 60 * 1000);
    const paymentStatus = PAYMENT_STATUSES[index];

    return {
      orderNumber: `${prefix}${String(startingSequence + index).padStart(4, "0")}`,
      items,
      totalAmount: items.reduce((total, item) => total + item.subtotal, 0),
      shippingAddress: ADDRESSES[index],
      status,
      paymentStatus,
      paymentId: paymentStatus === "Paid" ? `pay_seed_${String(index + 1).padStart(4, "0")}` : undefined,
      razorpayOrderId: `seed-order-${year}-${String(index + 1).padStart(2, "0")}`,
      statusHistory: getStatusHistory(status, createdAt),
      createdAt,
      updatedAt: createdAt,
    };
  });

  // Sort orders in ascending order of creation date to process them in chronological order
  const sortedOrders = [...orders].sort((a, b) => a.createdAt - b.createdAt);

  // Match or create a customer for each order and update the customer field
  for (const order of sortedOrders) {
    const customerDoc = await matchOrCreateCustomer(
      order.shippingAddress,
      order.totalAmount,
      order.createdAt
    );
    order.customer = customerDoc._id;
  }

  // Insert orders into database
  await db.collection("orders").insertMany(sortedOrders);
  console.log(`Successfully inserted ${sortedOrders.length} development seed orders and generated corresponding Customer profiles.`);
}

seedOrders()
  .catch((error) => {
    console.error("Order seed failed:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
