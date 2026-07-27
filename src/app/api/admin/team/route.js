import { dbConnect } from "@/lib/dbConnect";
import { Admin } from "@/models/admin.model";
import { AdminInvite } from "@/models/adminInvite.model";
import { ApiError } from "@/utils/ApiError";
import { ApiResponse } from "@/utils/ApiResponse";
import { asyncHandler } from "@/utils/asyncHandler";
import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";

export const GET = asyncHandler(async (request) => {
    await dbConnect();

    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    
    if (!token) {
        throw new ApiError(401, "Unauthorized access. Please login first.");
    }
    
    // Query actual existing Admin & Staff accounts from MongoDB
    const teamMembers = await Admin.find({}).sort({ createdAt: -1 }).lean();
    
    // Query any pending non-used AdminInvites from MongoDB
    const pendingInvites = await AdminInvite.find({ isUsed: false }).sort({ createdAt: -1 }).lean();

    return NextResponse.json(
        new ApiResponse(200, { teamMembers, pendingInvites }, "Team members fetched successfully!")
    );
});