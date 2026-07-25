import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/dbConnect";
import Expense from "@/models/expense.model";
import { expenseUpdateSchema } from "@/schemas/expense.schema";
import { ApiError } from "@/utils/ApiError";
import { ApiResponse } from "@/utils/ApiResponse";
import { asyncHandler } from "@/utils/asyncHandler";

export const PATCH = asyncHandler(async (request, { params }) => {
  await dbConnect();

  const { id } = await params;
  if (!id) {
    throw new ApiError(400, "Expense ID parameter is required");
  }

  const existingExpense = await Expense.findById(id);
  if (!existingExpense) {
    throw new ApiError(404, "Expense entry not found");
  }

  const body = await request.json();

  const validationResult = expenseUpdateSchema.safeParse({
    ...existingExpense.toObject(),
    ...body,
  });

  if (!validationResult.success) {
    const message =
      validationResult.error.issues?.[0]?.message ||
      validationResult.error.message ||
      "Invalid update payload.";
    throw new ApiError(400, message);
  }

  const updatedData = validationResult.data;

  // Handle recurrence frequency and end date cleanup if isRecurring was turned off
  if (updatedData.isRecurring === false) {
    updatedData.recurrenceFrequency = null;
    updatedData.recurrenceEndDate = null;
  }

  const updatedExpense = await Expense.findByIdAndUpdate(
    id,
    { $set: updatedData },
    { new: true, runValidators: true }
  );

  return NextResponse.json(
    new ApiResponse(200, updatedExpense, "Expense entry updated successfully")
  );
});

export const DELETE = asyncHandler(async (request, { params }) => {
  await dbConnect();

  const { id } = await params;
  if (!id) {
    throw new ApiError(400, "Expense ID parameter is required");
  }

  const deletedExpense = await Expense.findByIdAndDelete(id);
  if (!deletedExpense) {
    throw new ApiError(404, "Expense entry not found");
  }

  return NextResponse.json(
    new ApiResponse(200, deletedExpense, "Expense entry deleted successfully")
  );
});
