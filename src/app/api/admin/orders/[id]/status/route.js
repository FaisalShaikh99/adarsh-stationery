import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { getToken } from "next-auth/jwt";
import { dbConnect } from "@/lib/dbConnect";
import Order, { ORDER_STATUSES } from "@/models/order.model";
import Payment from "@/models/payment.model";
import paymentService from "@/services/payment.service";
import { ApiError } from "@/utils/ApiError";
import { ApiResponse } from "@/utils/ApiResponse";
import { orderPopulation, sanitizeOrder } from "../../_utils";

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

    const order = await Order.findById(id).populate("payment");
    if (!order) {
      throw new ApiError(404, "Order not found.");
    }
    if (!allowedTransitions[order.status].includes(status)) {
      throw new ApiError(400, `Cannot change an order from ${order.status} to ${status}.`);
    }

    order.status = status;
    order.statusHistory.push({ status, changedAt: new Date() });

    // Handle automated payment creations or updates
    let linkedPayment = order.payment;
    if (!linkedPayment) {
      linkedPayment = await paymentService.createPayment({
        order: order._id,
        customer: order.customer,
        amount: order.totalAmount,
        currency: "INR",
        status: status === "Delivered" ? "Paid" : "Pending",
        paymentMethod: "UPI",
        gateway: "None",
        type: "Incoming",
        remarks: `Payment auto-initialized on order transition to ${status}`,
        createdBy: "System"
      });
      order.payment = linkedPayment._id;
    } else {
      if (status === "Delivered" && linkedPayment.status !== "Paid") {
        await paymentService.updatePayment(linkedPayment._id, {
          status: "Paid",
          remarks: "Payment marked as Paid automatically on order delivery"
        });
      }
    }

    await order.save();
    await order.populate(orderPopulation);

    const sanitizedOrder = sanitizeOrder(order.toObject());

    return NextResponse.json(new ApiResponse(200, sanitizedOrder, "Order status updated successfully."));
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
