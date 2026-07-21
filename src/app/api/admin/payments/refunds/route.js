import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { dbConnect } from "@/lib/dbConnect";
import { ApiError } from "@/utils/ApiError";
import { asyncHandler } from "@/utils/asyncHandler";
import paymentController from "@/controllers/payment.controller";

export const GET = asyncHandler(async (request) => {
  await dbConnect();
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  if (!token) {
    throw new ApiError(401, "Access Denied. Please sign in to view refunds.");
  }
  const apiResponse = await paymentController.getAllRefunds(request);
  return NextResponse.json(apiResponse, { status: apiResponse.statusCode });
});
