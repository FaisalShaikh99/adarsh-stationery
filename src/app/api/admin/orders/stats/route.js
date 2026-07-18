// this provide filtering features by orders and payments and show thats total orders.
import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { dbConnect } from "@/lib/dbConnect";
import Order from "@/models/order.model";
import { ApiError } from "@/utils/ApiError";
import { ApiResponse } from "@/utils/ApiResponse";
import { asyncHandler } from "@/utils/asyncHandler";

export const GET = asyncHandler(async (request) => {
  await dbConnect();

  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  if (!token) {
    throw new ApiError(401, "Access Denied. Please sign in to view order statistics.");
  }

  const [statusCounts, paidTotals] = await Promise.all([
    Order.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
    Order.aggregate([
      { $match: { paymentStatus: "Paid" } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$totalAmount" },
          totalItemsSold: { $sum: { $sum: "$items.quantity" } },
        },
      },
    ]),
  ]);

  const counts = Object.fromEntries(statusCounts.map(({ _id, count }) => [_id, count]));
  const totals = paidTotals[0] || { totalRevenue: 0, totalItemsSold: 0 };

  return NextResponse.json(
    new ApiResponse(200, {
      totalOrders: statusCounts.reduce((sum, { count }) => sum + count, 0),
      statusCounts: {
        Pending: counts.Pending || 0,
        Confirmed: counts.Confirmed || 0,
        Shipped: counts.Shipped || 0,
        Delivered: counts.Delivered || 0,
        Cancelled: counts.Cancelled || 0,
      },
      totalRevenue: totals.totalRevenue,
      totalItemsSold: totals.totalItemsSold,
    }, "Order statistics fetched successfully."),
  );
});
