import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { dbConnect } from "@/lib/dbConnect";
import Order from "@/models/order.model";
import Customer from "@/models/customer.model";
import { ApiError } from "@/utils/ApiError";
import { ApiResponse } from "@/utils/ApiResponse";
import { asyncHandler } from "@/utils/asyncHandler";

export const GET = asyncHandler(async (request) => {
  await dbConnect();

  // Secure authorization
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  if (!token) {
    throw new ApiError(401, "Access Denied. Please sign in to view payments.");
  }

  const { searchParams } = new URL(request.url);
  const page = Math.max(Number.parseInt(searchParams.get("page") || "1", 10), 1);
  const limit = Math.min(Math.max(Number.parseInt(searchParams.get("limit") || "10", 10), 1), 100);
  
  const paymentStatus = searchParams.get("paymentStatus"); 
  const paymentMethod = searchParams.get("paymentMethod"); 
  const search = searchParams.get("search")?.trim();

  const filter = {};

  if (paymentStatus) {
    filter.paymentStatus = paymentStatus;
  }
  if (paymentMethod) {
    filter.paymentMethod = paymentMethod;
  }

  if (search) {
    const matchingCustomers = await Customer.find({
      name: { $regex: search, $options: "i" }
    }).select("_id").lean();

    const customerIds = matchingCustomers.map((c) => c._id);

    filter.$or = [
      { orderNumber: { $regex: search, $options: "i" } },
      { paymentId: { $regex: search, $options: "i" } },
      { customer: { $in: customerIds } }
    ];
  }

  // 1. Fetch Aggregated Statistics
  const statsResult = await Order.aggregate([
    {
      $group: {
        _id: "$paymentStatus",
        count: { $sum: 1 },
        totalAmount: { $sum: "$totalAmount" }
      }
    }
  ]);

  let totalPaid = 0;
  let totalPending = 0;
  let totalFailed = 0;
  let totalPaidAmount = 0;
  let totalPendingAmount = 0;
  let totalFailedAmount = 0;

  statsResult.forEach((item) => {
    if (item._id === "Paid") {
      totalPaid = item.count;
      totalPaidAmount = item.totalAmount;
    } else if (item._id === "Pending") {
      totalPending = item.count;
      totalPendingAmount = item.totalAmount;
    } else if (item._id === "Failed") {
      totalFailed = item.count;
      totalFailedAmount = item.totalAmount;
    }
  });

  // 2. Fetch Payments List
  const [payments, total] = await Promise.all([
    Order.find(filter)
      .populate({ path: "customer", select: "name email" })
      .select("orderNumber customer paymentId paymentStatus totalAmount paymentMethod createdAt statusHistory")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Order.countDocuments(filter)
  ]);

  const sanitizedPayments = payments.map((p) => ({
    ...p,
    paymentMethod: p.paymentMethod || "UPI"
  }));

  return NextResponse.json(
    new ApiResponse(200, {
      payments: sanitizedPayments,
      stats: {
        totalPaid,
        totalPending,
        totalFailed,
        totalPaidAmount,
        totalPendingAmount,
        totalFailedAmount
      },
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    }, "Payments fetched successfully.")
  );
});
