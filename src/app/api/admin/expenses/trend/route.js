import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/dbConnect";
import Expense from "@/models/expense.model";
import { ApiResponse } from "@/utils/ApiResponse";
import { asyncHandler } from "@/utils/asyncHandler";

export const dynamic = "force-dynamic";

export const GET = asyncHandler(async (request) => {
  await dbConnect();

  const now = new Date();
  let allExpenses = await Expense.find({}).lean();

  // If no expenses exist yet in database, seed default operational expenses
  if (allExpenses.length === 0) {
    const today = new Date();
    const defaultExpenses = [
      { category: "Rent", amount: 5000, note: "Monthly Store Premises Rent", isRecurring: true, date: today, recurrenceFrequency: "monthly" },
      { category: "Transport", amount: 1500, note: "Logistics & Delivery Freight", isRecurring: false, date: new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000) },
      { category: "Utilities", amount: 2000, note: "Electricity & Fiber Internet", isRecurring: true, date: today, recurrenceFrequency: "monthly" }
    ];
    await Expense.insertMany(defaultExpenses);
    allExpenses = await Expense.find({}).lean();
  }

  const trendData = [];

  // Generate 30 daily buckets for the last 30 days
  for (let i = 29; i >= 0; i--) {
    const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i, 0, 0, 0, 0);
    const dayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i, 23, 59, 59, 999);
    const isoDate = dayStart.toISOString().split("T")[0];
    const displayLabel = dayStart.toLocaleDateString("en-US", { month: "short", day: "numeric" });

    let dailyTotal = 0;

    for (const exp of allExpenses) {
      const expDate = new Date(exp.date);
      const recEndDate = exp.recurrenceEndDate ? new Date(exp.recurrenceEndDate) : null;

      if (!exp.isRecurring) {
        // One-time expense on this exact day
        if (expDate >= dayStart && expDate <= dayEnd) {
          dailyTotal += exp.amount || 0;
        }
      } else {
        // Recurring expense active on this day
        const isActive = expDate <= dayEnd && (!recEndDate || recEndDate >= dayStart);
        if (isActive) {
          // Daily prorated amount for monthly recurring expense
          dailyTotal += (exp.amount || 0) / 30;
        }
      }
    }

    trendData.push({
      date: isoDate,
      label: displayLabel,
      amount: Number(dailyTotal.toFixed(2)),
    });
  }

  return NextResponse.json(
    new ApiResponse(200, trendData, "30-day expense trend calculated successfully")
  );
});
