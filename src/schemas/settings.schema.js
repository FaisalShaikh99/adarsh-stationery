import * as z from "zod";

export const storeSettingsSchema = z.object({
  storeName: z.string().min(2, "Store name must be at least 2 characters"),
  contactEmail: z.string().email("Invalid email address"),
  contactPhone: z.string().min(6, "Phone number must be at least 6 characters"),
  storeAddress: z.string().min(5, "Address must be at least 5 characters"),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(6, "New password must be at least 6 characters long"),
  confirmPassword: z.string().min(1, "Confirm password is required"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "New password and confirm password do not match",
  path: ["confirmPassword"],
});

export const notificationsSchema = z.object({
  notifyNewOrder: z.boolean(),
  notifyLowStock: z.boolean(),
  notifyNewTeamMember: z.boolean(),
});
