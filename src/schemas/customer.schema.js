import { z } from "zod";

const objectIdRegex = /^[0-9a-fA-F]{24}$/;
const objectIdSchema = z.string().regex(objectIdRegex, "Invalid customer ID format");

export const mergeCustomersSchema = z.object({
  primaryId: objectIdSchema,
  duplicateIds: z.array(objectIdSchema).min(1, "At least one duplicate ID is required for merge"),
});
