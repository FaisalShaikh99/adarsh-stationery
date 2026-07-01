import { z } from "zod";

export const productValidationSchema = z.object({
  productId: z.string().optional(),
  name: z.string().min(2, "Product name must be at least 2 characters long").trim(),
  category: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid Category ID format"),
  company: z.string().optional().default("Generic"), // 🔥 Optional node
  companyLogo: z.string().optional().default(""),
  stock: z.number().min(0, "Stock quantity cannot be negative"),
  stockUnit: z.string().min(1, "Stock unit is required").trim(),
  costPrice: z.number().min(0, "Cost price cannot be negative"),
  sellingPrice: z.number().min(0, "Selling price cannot be negative"),
  images: z.array(z.string()).min(1, "At least one product image is required"), // 🔥 Strict min 1
  description: z.string().optional(),
  isActive: z.boolean().optional().default(true),
});