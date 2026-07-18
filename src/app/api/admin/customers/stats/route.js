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
    throw new ApiError(401, "Access Denied. Please sign in to view customer statistics.");
  }

  const [totalCustomers, vipCount, newCount, atRiskCount] = await Promise.all([
    Customer.countDocuments({}),
    Customer.countDocuments({ tags: "VIP" }),
    Customer.countDocuments({ tags: "New" }),
    Customer.countDocuments({ tags: "At Risk" }),
  ]);

  return NextResponse.json(
    new ApiResponse(
      200,
      {
        totalCustomers,
        vipCount,
        newCount,
        atRiskCount,
      },
      "Customer statistics fetched successfully."
    )
  );
});
