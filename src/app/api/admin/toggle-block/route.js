import { dbConnect } from "@/lib/dbConnect";
import { Admin } from "@/models/admin.model";
import { ApiError } from "@/utils/ApiError";
import { ApiResponse } from "@/utils/ApiResponse";
import { asyncHandler } from "@/utils/asyncHandler";
import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";


export const PATCH = asyncHandler(async (request) => {
    await dbConnect();

    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    if (!token || token.role !== "superadmin") {
        throw new ApiError(403, "Only Superadmin can remove team members.");
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
        throw new ApiError(400, "Member ID is required.");
    }

    // 3. Find target member
    const targetMember = await Admin.findById(id);
    if (!targetMember) {
        throw new ApiError(404, "Team member not found.");
    }

    if (targetMember.role === "superadmin") {
        throw new ApiError(400, "Superadmin account cannot be blocked.");
    }

    targetMember.isBlocked = !targetMember.isBlocked;
    targetMember.isActive = true;
    
    if (targetMember.isBlocked) {
        targetMember.isActive = false;
    }
    

    await targetMember.save();

    const message = targetMember.isBlocked ? "User blocked successfully." : "User unblocked successfully.";
    return NextResponse.json(new ApiResponse(200, targetMember, message));
})