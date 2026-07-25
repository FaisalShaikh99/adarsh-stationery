import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/dbConnect";
import Expense from "@/models/expense.model";
import { ApiResponse } from "@/utils/ApiResponse";
import { asyncHandler } from "@/utils/asyncHandler";

export const dynamic = "force-dynamic";

export const GET = asyncHandler(async (request) => {
  await dbConnect();

  const now = new Date();
  const allExpenses = await Expense.find({}).lean();

  const trendData = [];

  // Generate 30 daily buckets for the last 30 days
  for (let i = 29; i >= 0; i--) {
    const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i, 0, 0, 0, 0);
    const dayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i, 23, 59, 59, 999);
    const dateStr = dayStart.toLocaleDateString("en-US", { month: "short", day: "numeric" });

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
      date: dateStr,
      amount: Number(dailyTotal.toFixed(2)),
    });
  }

  return NextResponse.json(
    new ApiResponse(200, trendData, "30-day expense trend calculated successfully")
  );
});
