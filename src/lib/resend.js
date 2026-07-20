import { Resend } from "resend";

export const resend = new Resend(process.env.ADMIN_RESEND_API_KEY || process.env.ADARSH_ADMIN_API_KEY || 're_dummy_key_for_build');