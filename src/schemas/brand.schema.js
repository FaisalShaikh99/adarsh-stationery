import { z } from "zod";

export const brandValidationSchema = z.object({
  name: z
    .string({ required_error: "Brand name is required" })
    .trim()
    .min(2, "Brand name must be at least 2 characters long"),
  
  categories: z
    .array(z.string())
    .min(1, "Select at least one category for this brand"),
  
  primaryContact: z.string().trim().optional().default(""),
  websiteURL: z.string().trim().url("Invalid website URL format").optional().or(z.literal("")),
  logo: z.string().optional().default(""),
  description: z.string().trim().optional().default(""),
  isActive: z.boolean().default(true)
});