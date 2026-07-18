import mongoose from "mongoose";

process.loadEnvFile(".env.local");

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;

  console.log("Updating Aarav Sharma's email...");
  const aaravRes = await db.collection("customers").updateOne(
    { name: "Aarav Sharma" },
    { $set: { email: "aarav.sharma@example.com" } }
  );
  console.log("Aarav updated:", aaravRes.modifiedCount);

  console.log("Updating Ananya Iyer's email...");
  const ananyaRes = await db.collection("customers").updateOne(
    { name: "Ananya Iyer" },
    { $set: { email: "ananya.iyer@example.com" } }
  );
  console.log("Ananya updated:", ananyaRes.modifiedCount);

  await mongoose.disconnect();
  console.log("Emails assigned successfully.");
}

run().catch(console.error);
