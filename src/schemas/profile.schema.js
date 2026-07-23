import * as z from "zod";

export const adminProfileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters long"),
  image: z.string().optional(),
});
