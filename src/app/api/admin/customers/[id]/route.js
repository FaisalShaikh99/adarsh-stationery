import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { getToken } from "next-auth/jwt";
import { dbConnect } from "@/lib/dbConnect";
import Customer from "@/models/customer.model";
import Order from "@/models/order.model";
import { ApiError } from "@/utils/ApiError";
import { ApiResponse } from "@/utils/ApiResponse";
import { asyncHandler } from "@/utils/asyncHandler";
import { orderPopulation } from "../../orders/_utils";

export const GET = asyncHandler(async (request, { params }) => {
  await dbConnect();

  // Secure authorization
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  if (!token) {
    throw new ApiError(401, "Access Denied. Please sign in to view customer details.");
  }

  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) {
    throw new ApiError(400, "Invalid customer ID.");
  }

  const customer = await Customer.findById(id).lean();
  if (!customer) {
    throw new ApiError(404, "Customer not found.");
  }

  // Fetch all orders associated with this customer
  const orders = await Order.find({ customer: id })
    .populate(orderPopulation)
    .sort({ createdAt: -1 })
    .lean();

  return NextResponse.json(
    new ApiResponse(
      200,
      {
        ...customer,
        orders,
      },
      "Customer details and order history fetched successfully."
    )
  );
});
