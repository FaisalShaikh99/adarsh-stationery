import { z } from "zod";

const parseNumberField = (value) => {
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isNaN(parsed) ? value : parsed;
  }
  return value;
};

const parseEmptyStringToUndefined = (value) => {
  if (typeof value === "string") {
    return value.trim() === "" ? undefined : value;
  }
  return value;
};

export const productValidationSchema = z.object({
  productId: z.string().optional(),
  name: z.string().min(2, "Product name must be at least 2 characters long").trim(),
  category: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid Category ID format"),
  company: z.preprocess(parseEmptyStringToUndefined, z.string().optional().default("Generic")),
  companyLogo: z.string().optional().default(""),
  stock: z.preprocess(parseNumberField, z.number().min(0, "Stock quantity cannot be negative")),
  stockUnit: z.string().min(1, "Stock unit is required").trim(),
  costPrice: z.preprocess(parseNumberField, z.number().min(0, "Cost price cannot be negative")),
  sellingPrice: z.preprocess(parseNumberField, z.number().min(0, "Selling price cannot be negative")),
  images: z.array(z.string()).min(1, "At least one product image is required"), // 🔥 Strict min 1
  description: z.string().optional(),
  isActive: z.boolean().optional().default(true),
});