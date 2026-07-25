import mongoose from "mongoose";

export const EXPENSE_CATEGORIES = [
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
    category: {
      type: String,
      required: [true, "Expense category is required"],
      enum: {
        values: EXPENSE_CATEGORIES,
        message: "Invalid expense category",
      },
      trim: true,
    },
    amount: {
      type: Number,
      required: [true, "Expense amount is required"],
      min: [0, "Amount cannot be negative"],
    },
    note: {
      type: String,
      trim: true,
      default: "",
    },
    isRecurring: {
      type: Boolean,
      default: false,
    },
    date: {
      type: Date,
      required: [true, "Expense date is required"],
    },
    recurrenceFrequency: {
      type: String,
      enum: ["monthly", null],
      default: null,
    },
    recurrenceEndDate: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

export const Expense =
  mongoose.models.Expense || mongoose.model("Expense", expenseSchema);

export default Expense;
