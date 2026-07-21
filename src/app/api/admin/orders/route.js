import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { dbConnect } from "@/lib/dbConnect";
import { Admin } from "@/models/admin.model";
import Order from "@/models/order.model";
import Payment from "@/models/payment.model";
import { ApiError } from "@/utils/ApiError";
import { ApiResponse } from "@/utils/ApiResponse";
import { asyncHandler } from "@/utils/asyncHandler";
import { orderPopulation, sanitizeOrder } from "./_utils";

export const GET = asyncHandler(async (request) => {
  await dbConnect();

  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  if (!token) {
    throw new ApiError(401, "Access Denied. Please sign in to view orders.");
  }

  const { searchParams } = new URL(request.url);
  const page = Math.max(Number.parseInt(searchParams.get("page") || "1", 10), 1);
  const limit = Math.min(Math.max(Number.parseInt(searchParams.get("limit") || "10", 10), 1), 100);
  const status = searchParams.get("status");
  const paymentStatus = searchParams.get("paymentStatus");
  const search = searchParams.get("search")?.trim();
  const filter = {};

  if (status) filter.status = status;

  if (paymentStatus) {
    const matchingPayments = await Payment.find({ status: paymentStatus, isArchived: false })
      .select("_id")
      .lean();
    filter.payment = { $in: matchingPayments.map((p) => p._id) };
  }

  if (search) {
    const customers = await Admin.find(
      { name: { $regex: search, $options: "i" } },
      { _id: 1 },
    ).lean();
    filter.$or = [
      { orderNumber: { $regex: search, $options: "i" } },
      { customer: { $in: customers.map((customer) => customer._id) } },
    ];
  }

  const [orders, total] = await Promise.all([
    Order.find(filter)
      .populate(orderPopulation)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Order.countDocuments(filter),
  ]);

  const sanitizedOrders = orders.map(sanitizeOrder);

  return NextResponse.json(
    new ApiResponse(200, {
      orders: sanitizedOrders,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    }, "Orders fetched successfully."),
  );
});
