import z from "zod";

export const adminInviteSchema = z.object({
  email: z
    .string()
    .min(1, { message: "This field has to be filled." })
    .email("This is not a valid email."),

  role: z.enum(["admin", "staff"], {
    errorMap: () => ({ message: "Role must be either admin or staff." })
  }),

  message: z.string().optional()
});
