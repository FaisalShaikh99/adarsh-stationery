import { z } from "zod";
import { EXPENSE_CATEGORIES } from "@/models/expense.model";

export const expenseValidationSchema = z
  .object({
    category: z.enum(EXPENSE_CATEGORIES, {
      errorMap: () => ({ message: "Invalid expense category" }),
    }),
    amount: z.coerce
      .number({ required_error: "Expense amount is required" })
      .positive("Amount must be greater than 0"),
    note: z.string().trim().optional().default(""),
    isRecurring: z.boolean().default(false),
    date: z.coerce.date({ required_error: "Expense date is required" }),
    recurrenceFrequency: z.enum(["monthly"]).nullable().optional().default(null),
    recurrenceEndDate: z.coerce.date().nullable().optional().default(null),
  })
  .refine(
    (data) => {
      if (data.isRecurring) {
        return !!data.recurrenceFrequency;
      }
      return true;
    },
    {
      message: "Recurrence frequency is required when isRecurring is true",
      path: ["recurrenceFrequency"],
    }
  );

export const expenseUpdateSchema = z
  .object({
    category: z.enum(EXPENSE_CATEGORIES).optional(),
    amount: z.coerce.number().positive().optional(),
    note: z.string().trim().optional(),
    isRecurring: z.boolean().optional(),
    date: z.coerce.date().optional(),
    recurrenceFrequency: z.enum(["monthly"]).nullable().optional(),
    recurrenceEndDate: z.coerce.date().nullable().optional(),
  })
  .refine(
    (data) => {
      if (data.isRecurring) {
        return !!data.recurrenceFrequency;
      }
      return true;
    },
    {
      message: "Recurrence frequency is required when isRecurring is true",
      path: ["recurrenceFrequency"],
    }
  );
