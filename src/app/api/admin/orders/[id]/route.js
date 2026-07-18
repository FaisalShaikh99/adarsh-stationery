// this routes show detail of whole order
import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { getToken } from "next-auth/jwt";
import { dbConnect } from "@/lib/dbConnect";
import Order from "@/models/order.model";
import { ApiError } from "@/utils/ApiError";
import { ApiResponse } from "@/utils/ApiResponse";
import { asyncHandler } from "@/utils/asyncHandler";
import { orderPopulation } from "../_utils";

export const GET = asyncHandler(async (request, { params }) => {
  await dbConnect();

  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  if (!token) {
    throw new ApiError(401, "Access Denied. Please sign in to view orders.");
  }

  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) {
    throw new ApiError(400, "Invalid order ID.");
  }

  const order = await Order.findById(id).populate(orderPopulation).lean();
  if (!order) {
    throw new ApiError(404, "Order not found.");
  }

  return NextResponse.json(new ApiResponse(200, order, "Order fetched successfully."));
});
