import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { getToken } from "next-auth/jwt";
import { dbConnect } from "@/lib/dbConnect";
import Customer from "@/models/customer.model";
import { ApiError } from "@/utils/ApiError";
import { ApiResponse } from "@/utils/ApiResponse";
import { asyncHandler } from "@/utils/asyncHandler";

export const PATCH = asyncHandler(async (request, { params }) => {
  await dbConnect();

  // Secure authorization
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  if (!token) {
    throw new ApiError(401, "Access Denied. Please sign in to modify customer status.");
  }

  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) {
    throw new ApiError(400, "Invalid customer ID.");
  }

  const customer = await Customer.findById(id);
  if (!customer) {
    throw new ApiError(404, "Customer not found.");
  }

  // Toggle status
  customer.status = customer.status === "Active" ? "Blocked" : "Active";
  await customer.save();

  return NextResponse.json(
    new ApiResponse(
      200,
      customer,
      `Customer status updated successfully to ${customer.status}.`
    )
  );
});
