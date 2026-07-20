import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { getToken } from "next-auth/jwt";
import { dbConnect } from "@/lib/dbConnect";
import Customer from "@/models/customer.model";
import { ApiError } from "@/utils/ApiError";
import { ApiResponse } from "@/utils/ApiResponse";
import { asyncHandler } from "@/utils/asyncHandler";
import { customerContactSchema } from "@/schemas/customer.schema";

export const PATCH = asyncHandler(async (request, { params }) => {
  await dbConnect();

  // 1. Secure authorization
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  if (!token) {
    throw new ApiError(401, "Access Denied. Please sign in to modify customer details.");
  }

  // 2. Validate Customer ID parameter
  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) {
    throw new ApiError(400, "Invalid customer ID.");
  }

  // 3. Find Customer
  const customer = await Customer.findById(id);
  if (!customer) {
    throw new ApiError(404, "Customer not found.");
  }

  // 4. Parse & Validate request body
  const body = await request.json();
  const validationResult = customerContactSchema.safeParse(body);
  if (!validationResult.success) {
    const errorMessage = validationResult.error.errors.map(err => err.message).join(", ");
    throw new ApiError(400, errorMessage);
  }

  const { email, phone } = validationResult.data;

  // 5. Unique phone constraint validation
  const existingWithPhone = await Customer.findOne({ 
    phone, 
    _id: { $ne: customer._id } 
  });
  
  if (existingWithPhone) {
    throw new ApiError(400, "Phone number is already associated with another customer.");
  }

  // 6. Update fields and save
  customer.email = email || "";
  customer.phone = phone;
  await customer.save();

  return NextResponse.json(
    new ApiResponse(
      200,
      customer,
      "Customer contact details updated successfully."
    )
  );
});
