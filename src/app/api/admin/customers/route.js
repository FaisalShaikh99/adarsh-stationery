import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { dbConnect } from "@/lib/dbConnect";
import Customer from "@/models/customer.model";
import { ApiError } from "@/utils/ApiError";
import { ApiResponse } from "@/utils/ApiResponse";
import { asyncHandler } from "@/utils/asyncHandler";

export const GET = asyncHandler(async (request) => {
  await dbConnect();

  // Secure authorization
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  if (!token) {
    throw new ApiError(401, "Access Denied. Please sign in to view customers.");
  }

  const { searchParams } = new URL(request.url);
  const page = Math.max(Number.parseInt(searchParams.get("page") || "1", 10), 1);
  const limit = Math.min(Math.max(Number.parseInt(searchParams.get("limit") || "10", 10), 1), 100);
  const status = searchParams.get("status");
  const tag = searchParams.get("tag");
  const search = searchParams.get("search")?.trim();

  const filter = {};

  if (status) {
    filter.status = status;
  }
  if (tag) {
    filter.tags = tag;
  }
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { phone: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
    ];
  }

  const [customers, total] = await Promise.all([
    Customer.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Customer.countDocuments(filter),
  ]);

  return NextResponse.json(
    new ApiResponse(
      200,
      {
        customers,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
      "Customers fetched successfully."
    )
  );
});
