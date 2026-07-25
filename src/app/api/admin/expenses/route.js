import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/dbConnect";
import Expense from "@/models/expense.model";
import { expenseValidationSchema } from "@/schemas/expense.schema";
import { ApiError } from "@/utils/ApiError";
import { ApiResponse } from "@/utils/ApiResponse";
import { asyncHandler } from "@/utils/asyncHandler";

export const GET = asyncHandler(async (request) => {
  await dbConnect();

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = Math.max(1, parseInt(searchParams.get("limit") || "10", 10));
  const category = searchParams.get("category");
  const isRecurringParam = searchParams.get("isRecurring");

  const query = {};

  if (category && category !== "all") {
    query.category = category;
  }

  if (isRecurringParam !== null && isRecurringParam !== undefined && isRecurringParam !== "") {
    query.isRecurring = isRecurringParam === "true";
  }

  const skip = (page - 1) * limit;

  const [expenses, total] = await Promise.all([
    Expense.find(query).sort({ date: -1, createdAt: -1 }).skip(skip).limit(limit).lean(),
    Expense.countDocuments(query),
  ]);

  const totalPages = Math.ceil(total / limit) || 1;

  return NextResponse.json(
    new ApiResponse(
      200,
      {
        expenses,
        pagination: {
          page,
          limit,
          totalPages,
          total,
        },
      },
      "Expenses retrieved successfully"
    )
  );
});

export const POST = asyncHandler(async (request) => {
  await dbConnect();

  const body = await request.json();

  const validationResult = expenseValidationSchema.safeParse(body);
  if (!validationResult.success) {
    const message =
      validationResult.error.issues?.[0]?.message ||
      validationResult.error.message ||
      "Invalid expense data.";
    throw new ApiError(400, message);
  }

  const {
    category,
    amount,
    note,
    isRecurring,
    date,
    recurrenceFrequency,
    recurrenceEndDate,
  } = validationResult.data;

  const newExpense = await Expense.create({
    category,
    amount,
    note: note || "",
    isRecurring,
    date,
    recurrenceFrequency: isRecurring ? recurrenceFrequency : null,
    recurrenceEndDate: isRecurring ? recurrenceEndDate : null,
  });

  return NextResponse.json(
    new ApiResponse(201, newExpense, "Expense entry created successfully")
  );
});
