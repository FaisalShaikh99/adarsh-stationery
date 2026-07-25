import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/dbConnect";
import Expense, { EXPENSE_CATEGORIES } from "@/models/expense.model";
import { ApiResponse } from "@/utils/ApiResponse";
import { asyncHandler } from "@/utils/asyncHandler";

export const dynamic = "force-dynamic";

export const GET = asyncHandler(async (request) => {
  await dbConnect();

  const { searchParams } = new URL(request.url);
  const period = searchParams.get("period") === "week" ? "week" : "month";

  const now = new Date();
  const endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  let startDate;
  if (period === "week") {
    // Rolling last 7 days ending today
    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6, 0, 0, 0, 0);
  } else {
    // Current calendar month to date (1st of month to today)
    startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
  }

  // Fetch all expenses to evaluate recurring vs one-time
  const allExpenses = await Expense.find({}).lean();

  const categoryTotals = {};
  EXPENSE_CATEGORIES.forEach((cat) => {
    categoryTotals[cat] = 0;
  });

  let totalExpenses = 0;

  for (const exp of allExpenses) {
    const expDate = new Date(exp.date);
    const recEndDate = exp.recurrenceEndDate ? new Date(exp.recurrenceEndDate) : null;

    if (!exp.isRecurring) {
      // ONE-TIME expense: check if expense date falls within [startDate, endDate]
      if (expDate >= startDate && expDate <= endDate) {
        const amt = exp.amount || 0;
        totalExpenses += amt;
        categoryTotals[exp.category] = (categoryTotals[exp.category] || 0) + amt;
      }
    } else {
      // RECURRING expense: active if start date <= endDate AND (no recurrenceEndDate OR recurrenceEndDate >= startDate)
      const isActive = expDate <= endDate && (!recEndDate || recEndDate >= startDate);
      if (isActive) {
        // Prorate recurring monthly expense: amount/4 for weekly period, full amount for monthly period
        const amt = period === "week" ? exp.amount / 4 : exp.amount;
        totalExpenses += amt;
        categoryTotals[exp.category] = (categoryTotals[exp.category] || 0) + amt;
      }
    }
  }

  const breakdown = Object.entries(categoryTotals)
    .filter(([_, amount]) => amount > 0)
    .map(([category, amount]) => ({
      category,
      amount: Number(amount.toFixed(2)),
    }));

  return NextResponse.json(
    new ApiResponse(
      200,
      {
        period,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        totalExpenses: Number(totalExpenses.toFixed(2)),
        breakdown,
      },
      "Expense summary calculated successfully"
    )
  );
});
