import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { dbConnect } from "@/lib/dbConnect";
import { Admin } from "@/models/admin.model";
import { asyncHandler } from "@/utils/asyncHandler";
import { ApiError } from "@/utils/ApiError";
import { ApiResponse } from "@/utils/ApiResponse";

export const POST = asyncHandler(async (request) => {
    await dbConnect();

    
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    if (!token) {
        throw new ApiError(401, "User session not found.");
    }

    await Admin.findByIdAndUpdate(token.id, { isActive: false });

    return NextResponse.json(
        new ApiResponse(200, null, "Status updated to inactive successfully.")
    );
});