import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { getToken } from "next-auth/jwt";
import { dbConnect } from "@/lib/dbConnect";
import Order from "@/models/order.model";
import { ApiError } from "@/utils/ApiError";
import { ApiResponse } from "@/utils/ApiResponse";
import { asyncHandler } from "@/utils/asyncHandler";
import { orderPopulation, sanitizeOrder } from "../_utils";

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

  // Fetch other orders belonging to the same customer
  let otherOrders = [];
  if (order.customer?._id) {
    otherOrders = await Order.find({
      $or: [
        { customer: order.customer._id },
        { "shippingAddress.phone": order.shippingAddress.phone },
        { "shippingAddress.email": order.shippingAddress.email }
      ],
      _id: { $ne: order._id }
    })
    .populate("payment")
    .select("orderNumber status totalAmount createdAt payment")
    .sort({ createdAt: -1 })
    .lean();
  } else {
    const queryConditions = [];
    if (order.shippingAddress?.phone) {
      queryConditions.push({ "shippingAddress.phone": order.shippingAddress.phone });
    }
    if (order.shippingAddress?.email) {
      queryConditions.push({ "shippingAddress.email": order.shippingAddress.email });
    }
    if (queryConditions.length > 0) {
      otherOrders = await Order.find({
        $or: queryConditions,
        _id: { $ne: order._id }
      })
      .populate("payment")
      .select("orderNumber status totalAmount createdAt payment")
      .sort({ createdAt: -1 })
      .lean();
    }
  }

  const sanitizedOrder = sanitizeOrder(order);
  const sanitizedOtherOrders = otherOrders.map(sanitizeOrder);

  const orderData = {
    ...sanitizedOrder,
    otherOrders: sanitizedOtherOrders
  };

  return NextResponse.json(new ApiResponse(200, orderData, "Order fetched successfully."));
});
