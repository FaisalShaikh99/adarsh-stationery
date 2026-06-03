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
import { sendInvitationEmail } from "@/utils/sendInviteEmail";

export const POST = asyncHandler(async (request) => {
    // DB Connection
    await dbConnect();

    //Get Superadmin Token to know who is inviting
    const superadminToken = await getToken({ req: request });
    if (!superadminToken) {
        throw new ApiError(401, "Unauthorized access");
    }

    // Extract Data from request body
    const body = await request.json();
    const { email, role, message } = body;

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

    //  Generate Secure Crypto Token & Expiry (24 Hours)
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    //  Create Invite Link URL
    const inviteLink = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/admin/login?token=${token}`;

    //  Send Email via Resend Helper Function
    const emailResult = await sendInvitationEmail(email, role, inviteLink, message);
    if (!emailResult.success) {
        throw new ApiError(500, "Failed to send invitation email. Please try again.");
    }

    // Save Invitation to Database (isUsed should be false initially)
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