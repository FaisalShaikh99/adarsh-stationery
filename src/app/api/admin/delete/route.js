import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { dbConnect } from "@/lib/dbConnect";
import { Admin } from "@/models/admin.model";
import { asyncHandler } from "@/utils/asyncHandler";
import { ApiError } from "@/utils/ApiError";
import { ApiResponse } from "@/utils/ApiResponse";

export const DELETE = asyncHandler(async (request) => {
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
        throw new ApiError(400, "Superadmin account cannot be deleted.");
    }
    await Admin.findByIdAndDelete(id);

    return NextResponse.json(
        new ApiResponse(200, null, "Member removed from database successfully!")
    );
});