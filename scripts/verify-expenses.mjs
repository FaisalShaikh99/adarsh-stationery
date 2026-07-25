import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const EXPENSE_CATEGORIES = [
  "Transport",
  "Labour/Salary",
  "Rent",
  "Utilities",
  "Packaging",
  "Marketing",
  "Other",
];

const expenseSchema = new mongoose.Schema(
  {
    category: { type: String, required: true, enum: EXPENSE_CATEGORIES },
    amount: { type: Number, required: true },
    note: { type: String, default: "" },
    isRecurring: { type: Boolean, default: false },
    date: { type: Date, required: true },
    recurrenceFrequency: { type: String, enum: ["monthly", null], default: null },
    recurrenceEndDate: { type: Date, default: null },
  },
  { timestamps: true }
);

const Expense = mongoose.models.Expense || mongoose.model("Expense", expenseSchema);

async function runVerification() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected to MongoDB.");

  // Clean test entries for Transport and Labour/Salary created today / 1st of month
  await Expense.deleteMany({ category: { $in: ["Transport", "Labour/Salary"] } });

  const now = new Date();
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  // 1. Create a one-time expense (Transport, ₹500, today's date)
  const oneTime = await Expense.create({
    category: "Transport",
    amount: 500,
    note: "Verification test transport",
    isRecurring: false,
    date: now,
  });
  console.log("Created One-Time Expense:", oneTime.category, "₹" + oneTime.amount, "Date:", oneTime.date);

  // 2. Create a recurring monthly expense (Labour/Salary, ₹8000, 1st of this month)
  const recurring = await Expense.create({
    category: "Labour/Salary",
    amount: 8000,
    note: "Verification test salary",
    isRecurring: true,
    recurrenceFrequency: "monthly",
    date: firstOfMonth,
  });
  console.log("Created Recurring Expense:", recurring.category, "₹" + recurring.amount, "Date:", recurring.date);

  // Function to simulate summary calculation
  async function getSummary(period) {
    const endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    let startDate;
    if (period === "week") {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6, 0, 0, 0, 0);
    } else {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    }

    const allExpenses = await Expense.find({}).lean();
    let totalExpenses = 0;
    const categoryTotals = {};

    for (const exp of allExpenses) {
      const expDate = new Date(exp.date);
      const recEndDate = exp.recurrenceEndDate ? new Date(exp.recurrenceEndDate) : null;

      if (!exp.isRecurring) {
        if (expDate >= startDate && expDate <= endDate) {
          const amt = exp.amount || 0;
          totalExpenses += amt;
          categoryTotals[exp.category] = (categoryTotals[exp.category] || 0) + amt;
        }
      } else {
        const isActive = expDate <= endDate && (!recEndDate || recEndDate >= startDate);
        if (isActive) {
          const amt = period === "week" ? exp.amount / 4 : exp.amount;
          totalExpenses += amt;
          categoryTotals[exp.category] = (categoryTotals[exp.category] || 0) + amt;
        }
      }
    }

    return { period, totalExpenses, categoryTotals };
  }

  // Test Period = Month
  const monthSummary = await getSummary("month");
  console.log("\n--- Month Summary Verification ---");
  console.log("Total Expenses (Expected ₹8500):", "₹" + monthSummary.totalExpenses);
  console.log("Breakdown:", monthSummary.categoryTotals);

  if (monthSummary.totalExpenses === 8500) {
    console.log("✓ Month Summary PASSED!");
  } else {
    console.error("❌ Month Summary FAILED! Expected 8500, got", monthSummary.totalExpenses);
  }

  // Test Period = Week
  const weekSummary = await getSummary("week");
  console.log("\n--- Week Summary Verification ---");
  console.log("Total Expenses (Expected ₹2500):", "₹" + weekSummary.totalExpenses);
  console.log("Breakdown:", weekSummary.categoryTotals);

  if (weekSummary.totalExpenses === 2500) {
    console.log("✓ Week Summary PASSED!");
  } else {
    console.error("❌ Week Summary FAILED! Expected 2500, got", weekSummary.totalExpenses);
  }

  await mongoose.disconnect();
  console.log("Disconnected from MongoDB.");
}

runVerification().catch((err) => {
  console.error(err);
  process.exit(1);
});
