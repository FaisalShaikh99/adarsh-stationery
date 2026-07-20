import { z } from "zod";

export const customerContactSchema = z.object({
  email: z.string().trim().email("Invalid email address").optional().or(z.literal("")),
  phone: z.string().trim().regex(/^\d{10}$/, "Phone number must be exactly 10 digits"),
});
