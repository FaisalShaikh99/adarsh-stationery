import { z } from "zod";

const parseNumberField = (value) => {
  if (value === "" || value === undefined || value === null) return undefined;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? value : parsed;
};

export const productValidationSchema = z.object({
  name: z.string().min(2, "Product name must be at least 2 characters long.").trim(),
  category: z.string().regex(/^[0-9a-fA-F]{24}$/, "Please select a valid Category."),
  company: z.string().regex(/^[0-9a-fA-F]{24}$/, "Please select a valid Brand/Company."),
  stock: z.preprocess(
    parseNumberField,
    z.number({ required_error: "Stock is required." }).min(0, "Stock quantity cannot be negative.")
  ),
  stockUnit: z.string().min(1, "Stock unit is required.").trim(),
  costPrice: z.preprocess(
    parseNumberField,
    z.number({ required_error: "Cost price is required." }).min(0, "Cost price cannot be negative.")
  ),
  sellingPrice: z.preprocess(
    parseNumberField,
    z.number({ required_error: "Selling price is required." }).min(0, "Selling price cannot be negative.")
  ),
  images: z.array(z.string()).refine((arr) => arr.some(img => img !== ""), {
    message: "At least one product image is required."
  }),
  description: z.string().optional(),
  isActive: z.boolean().optional().default(true)
});

export const productSchema = productValidationSchema;