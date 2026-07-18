// this routes used to update status of orders
import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { getToken } from "next-auth/jwt";
import { dbConnect } from "@/lib/dbConnect";
import Order, { ORDER_STATUSES } from "@/models/order.model";
import { ApiError } from "@/utils/ApiError";
import { ApiResponse } from "@/utils/ApiResponse";
import { orderPopulation } from "../../_utils";

const allowedTransitions = {
  Pending: ["Confirmed", "Cancelled"],
  Confirmed: ["Shipped", "Cancelled"],
  Shipped: ["Delivered", "Cancelled"],
  Delivered: [],
  Cancelled: [],
};

export async function PATCH(request, { params }) {
  try {
    await dbConnect();

    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    if (!token) {
      throw new ApiError(401, "Access Denied. Please sign in to update orders.");
    }

    const { id } = await params;
    const { status } = await request.json();

    if (!mongoose.isValidObjectId(id)) {
      throw new ApiError(400, "Invalid order ID.");
    }
    if (!ORDER_STATUSES.includes(status)) {
      throw new ApiError(400, "Invalid order status.");
    }

    const order = await Order.findById(id);
    if (!order) {
      throw new ApiError(404, "Order not found.");
    }
    if (!allowedTransitions[order.status].includes(status)) {
      throw new ApiError(400, `Cannot change an order from ${order.status} to ${status}.`);
    }

    order.status = status;
    order.statusHistory.push({ status, changedAt: new Date() });
    await order.save();
    await order.populate(orderPopulation);

    return NextResponse.json(new ApiResponse(200, order, "Order status updated successfully."));
  } catch (error) {
    console.error("Order status update error:", error);

    return NextResponse.json(
      {
        success: false,
        message: error.message || "Internal Server Error",
        errors: error.errors || [],
      },
      { status: error.statusCode || 500 },
    );
  }
}
