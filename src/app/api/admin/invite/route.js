import crypto from "crypto";
import React from "react";
import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { asyncHandler } from "@/utils/asyncHandler";
import { ApiError } from "@/utils/ApiError";
import { ApiResponse } from "@/utils/ApiResponse";
import { dbConnect } from "@/lib/dbConnect";
import { AdminInvite } from "@/models/adminInvite.model";
import { Admin } from "@/models/admin.model";
import { adminInviteSchema } from "@/schemas/invite.schema";
import { resend } from "@/lib/resend";
import InviteEmail from "@/email_template/inviteEmailTemplate";

export const POST = asyncHandler(async (request) => {
    // DB Connection
    await dbConnect();

    const superadminToken = await getToken({ 
        req: request, 
        secret: process.env.NEXTAUTH_SECRET 
    });
    
    if (!superadminToken) {
        throw new ApiError(401, "Unauthorized access");
    }

    // Extract Data from request body
    const body = await request.json();
    const { email, role, message } = body;

    // Basic server-side email sanity check
    if (!email || typeof email !== "string" || !email.trim()) {
        throw new ApiError(400, "Invalid email address");
    }

    // Zod Validation Check
    const validation = adminInviteSchema.safeParse({ email, role });
    if (!validation.success) {
        const message = validation.error.issues?.[0]?.message || validation.error.message || "Invalid invite payload.";
        throw new ApiError(400, message);
    }

    // Check if the user is already a registered team member
    const existingByEmail = await Admin.findOne({ email });
    if (existingByEmail) {
        throw new ApiError(400, "This user is already a team member");
    }

    // Invalidate any previous unused invitations for this email so Super Admin can resend invites freely
    await AdminInvite.updateMany({ email, isUsed: false }, { isUsed: true });

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // Build secure HTTPS link to prevent Gmail anti-phishing spam flags
    let baseUrl = process.env.NEXTAUTH_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "https://adarsh-stationery.vercel.app");
    if (baseUrl.startsWith("http://localhost")) {
      baseUrl = "https://adarsh-stationery.vercel.app";
    }
    const inviteLink = `${baseUrl}/admin/sign-in?token=${token}`;

    const apiKey = process.env.ADMIN_RESEND_API_KEY || process.env.ADARSH_ADMIN_API_KEY;
    const isResendConfigured = apiKey && !apiKey.startsWith("re_dummy");

    let emailSent = false;
    let lastError = null;

    // 1. Try Resend first (if API key configured)
    if (isResendConfigured) {
        try {
            const resendResult = await resend.emails.send({
                from: process.env.SENDER_EMAIL || "Adarsh Stationery <onboarding@resend.dev>",
                to: email,
                subject: `Official Admin Invitation (${role.toUpperCase()}) - Adarsh Stationery`,
                react: (
                    <InviteEmail
                        email={email}
                        role={role}
                        inviteLink={inviteLink}
                        message={message}
                    />
                ),
            });

            if (resendResult.error) {
                console.error("Resend Delivery Error Result:", resendResult.error);
                lastError = resendResult.error.message || JSON.stringify(resendResult.error);
            } else {
                emailSent = true;
            }
        } catch (resendErr) {
            console.error("Resend Delivery Exception:", resendErr);
            lastError = resendErr.message;
        }
    }

    // 2. Fallback to EmailJS if Resend failed or is not configured
    if (!emailSent) {
        const isEmailJSConfigured = process.env.EMAILJS_SERVICE_ID && process.env.EMAILJS_TEMPLATE_ID && process.env.EMAILJS_PUBLIC_KEY;
        if (isEmailJSConfigured) {
            const emailJSData = {
                service_id: process.env.EMAILJS_SERVICE_ID,
                template_id: process.env.EMAILJS_TEMPLATE_ID,
                user_id: process.env.EMAILJS_PUBLIC_KEY,
                accessToken: process.env.EMAILJS_PRIVATE_KEY, 
                template_params: {
                     to_email: email,
                     recipient_email: email,
                     user_email: email,
                     email: email,
                     role: role.toUpperCase(),
                     message: message || "No custom message attached.",
                     invite_link: inviteLink,
                },
            };

            try {
                const emailResponse = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(emailJSData),
                });

                if (emailResponse.ok) {
                    emailSent = true;
                } else {
                    const errorText = await emailResponse.text();
                    console.error("EmailJS Error:", errorText);
                    lastError = errorText;
                }
            } catch (err) {
                console.error("EmailJS Exception:", err);
                lastError = err.message;
            }
        }
    }

    // 3. If neither provider delivered, throw real error to UI
    if (!emailSent) {
        console.error("Email delivery failed. Last error:", lastError);
        throw new ApiError(
            500,
            `Email delivery failed: ${lastError || "Please check Resend/EmailJS API keys & domain verification."}`
        );
    }

    // Save Invitation to Database only if email sending is successful
    await AdminInvite.create({
        email,
        role,
        message,
        token,
        expiresAt,
        isUsed: false, 
        invitedBy: superadminToken.id 
    });

    return NextResponse.json(
        new ApiResponse(201, { email, role, inviteLink }, "Invitation sent successfully!")
    );
});