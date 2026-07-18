import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { dbConnect } from "@/lib/dbConnect";
import Product from "@/models/product.model";
import Order from "@/models/order.model";
import Customer from "@/models/customer.model";
import { ApiError } from "@/utils/ApiError";
import { ApiResponse } from "@/utils/ApiResponse";
import { asyncHandler } from "@/utils/asyncHandler";

export const GET = asyncHandler(async (request, { params }) => {
  await dbConnect();

  // Secure authorization check
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  if (!token) {
    throw new ApiError(401, "Access Denied. Please sign in to query customers.");
  }

  const { id } = await params;

  // 1. Find product to get its category
  const product = await Product.findById(id);
  if (!product) {
    throw new ApiError(404, "Product not found.");
  }

  const categoryId = product.category;
  if (!categoryId) {
    throw new ApiError(400, "Product does not belong to any category.");
  }

  // 2. Fetch all products belonging to the same category
  const relatedProducts = await Product.find({ category: categoryId }).select("_id");
  const relatedProductIds = relatedProducts.map((p) => p._id);

  // 3. Query Order collection to find customers with 2+ distinct qualifying orders
  // Group by customer, count orders, filter by count >= 2
  const results = await Order.aggregate([
    {
      $match: {
        customer: { $exists: true, $ne: null },
        "items.product": { $in: relatedProductIds },
      },
    },
    {
      $group: {
        _id: "$customer",
        qualifyingOrdersCount: { $sum: 1 },
      },
    },
    {
      $match: {
        qualifyingOrdersCount: { $gte: 2 },
      },
    },
  ]);

  const eligibleCustomerIds = results.map((r) => r._id);

  // 4. Query Customer details for these IDs who have non-empty email addresses
  const eligibleCustomers = await Customer.find({
    _id: { $in: eligibleCustomerIds },
    email: { $exists: true, $ne: "", $regex: /\S+/ },
    status: "Active", // only active customers should receive emails
  }).select("name email phone status");

  return NextResponse.json(
    new ApiResponse(200, eligibleCustomers, "Eligible customers fetched successfully.")
  );
});
