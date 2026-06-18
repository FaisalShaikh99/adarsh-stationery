import crypto from "crypto";
import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { asyncHandler } from "@/utils/asyncHandler";
import { ApiError } from "@/utils/ApiError";
import { ApiResponse } from "@/utils/ApiResponse";
import { dbConnect } from "@/lib/dbConnect";
import { AdminInvite } from "@/models/adminInvite.model";
import { Admin } from "@/models/admin.model";
import { adminInviteSchema } from "@/schemas/invite.schema";

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
        throw new ApiError(400, validation.error.errors[0].message);
    }

    // Check if the user is already a registered team member
    const existingByEmail = await Admin.findOne({ email });
    if (existingByEmail) {
        throw new ApiError(400, "This user is already a team member");
    }

    // Check if an active (unused) invitation already exists for this email
    const adminExistInInviteState = await AdminInvite.findOne({ email, isUsed: false });
    if (adminExistInInviteState) {
        throw new ApiError(400, "An active invitation has already been sent to this email");
    }

    
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    
    const inviteLink = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/admin/sign-in?token=${token}`;

   const emailJSData = {
       service_id: process.env.EMAILJS_SERVICE_ID,
       template_id: process.env.EMAILJS_TEMPLATE_ID,
       user_id: process.env.EMAILJS_PUBLIC_KEY,
       accessToken: process.env.EMAILJS_PRIVATE_KEY, 
       template_params: {
            // include several common variable names to match different template setups
            to_email: email,
            recipient_email: email,
            user_email: email,
            email: email,
            role: role,
            message: message || "No custom message attached.",
            invite_link: inviteLink,
       },
   };

    // Log payload for debugging (server logs only)
    try {
        console.debug("EmailJS payload:", JSON.stringify(emailJSData));

        const emailResponse = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(emailJSData),
        });

        if (!emailResponse.ok) {
            const errorText = await emailResponse.text();
            console.error("EmailJS Service Error Details:", errorText);
            console.error("EmailJS Payload:", JSON.stringify(emailJSData));
            throw new ApiError(500, "Failed to send invitation email via EmailJS. Please try again.");
        }
    } catch (err) {
        // Bubble up ApiError or wrap unexpected errors
        if (err instanceof ApiError) throw err;
        console.error("Unexpected error sending EmailJS email:", err);
        throw new ApiError(500, "Failed to send invitation email via EmailJS. Please try again.");
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
        new ApiResponse(200, null, "Invitation sent and email delivered successfully!")
    );
});