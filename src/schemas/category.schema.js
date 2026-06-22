import { z } from "zod";

export const categoryCreateSchema = z.object({
    name: z
        .string({ required_error: "Category name is required" })
        .trim()
        .min(2, { message: "Category name must be at least 2 characters long" })
        .max(50, { message: "Category name cannot exceed 50 characters" }),
    imageUrl: z
        .string()
        .url({ message: "Invalid image URL format" })
        .or(z.literal(""))
        .optional()
});