import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { dbConnect } from "@/lib/dbConnect";
import { ApiError } from "@/utils/ApiError";
import { asyncHandler } from "@/utils/asyncHandler";
import paymentController from "@/controllers/payment.controller";

export const GET = asyncHandler(async (request, { params }) => {
  await dbConnect();
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  if (!token) {
    throw new ApiError(401, "Access Denied. Please sign in to view payments.");
  }
  const { id } = await params;
  const apiResponse = await paymentController.getPayment(request, id);
  return NextResponse.json(apiResponse, { status: apiResponse.statusCode });
});

export const PATCH = asyncHandler(async (request, { params }) => {
  await dbConnect();
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  if (!token) {
    throw new ApiError(401, "Access Denied. Please sign in to manage payments.");
  }
  const { id } = await params;
  const apiResponse = await paymentController.updatePayment(request, id);
  return NextResponse.json(apiResponse, { status: apiResponse.statusCode });
});

export const DELETE = asyncHandler(async (request, { params }) => {
  await dbConnect();
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  if (!token) {
    throw new ApiError(401, "Access Denied. Please sign in to manage payments.");
  }
  const { id } = await params;
  const apiResponse = await paymentController.deletePayment(request, id);
  return NextResponse.json(apiResponse, { status: apiResponse.statusCode });
});
