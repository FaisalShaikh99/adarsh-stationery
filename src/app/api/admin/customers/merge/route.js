import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { dbConnect } from "@/lib/dbConnect";
import Customer from "@/models/customer.model";
import Order from "@/models/order.model";
import { ApiError } from "@/utils/ApiError";
import { ApiResponse } from "@/utils/ApiResponse";
import { asyncHandler } from "@/utils/asyncHandler";
import { mergeCustomersSchema } from "@/schemas/customer.schema";
import { computeCustomerTags } from "@/lib/computeCustomerTags";

export const POST = asyncHandler(async (request) => {
  await dbConnect();

  // Secure authorization
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  if (!token || token.role !== "superadmin") {
    throw new ApiError(403, "Access Denied. Only superadmins can merge customer accounts.");
  }

  const body = await request.json();

  // Validate request body
  const validationResult = mergeCustomersSchema.safeParse(body);
  if (!validationResult.success) {
    const message = validationResult.error.issues?.[0]?.message || validationResult.error.message || "Invalid merge payload.";
    throw new ApiError(400, message);
  }

  const { primaryId, duplicateIds } = validationResult.data;

  // Prevent merging a customer into themselves
  if (duplicateIds.includes(primaryId)) {
    throw new ApiError(400, "Primary customer ID cannot be present in the duplicate IDs list.");
  }

  // Find primary customer
  const primaryCustomer = await Customer.findById(primaryId);
  if (!primaryCustomer) {
    throw new ApiError(404, "Primary customer not found.");
  }

  // Find duplicate customers
  const duplicateCustomers = await Customer.find({ _id: { $in: duplicateIds } });
  if (duplicateCustomers.length === 0) {
    throw new ApiError(404, "No duplicate customer accounts found with the provided IDs.");
  }

  // Calculate merged stats
  let totalOrderCount = primaryCustomer.orderCount;
  let totalTotalSpent = primaryCustomer.totalSpent;
  const firstOrderDates = [primaryCustomer.firstOrderDate];
  const lastOrderDates = [primaryCustomer.lastOrderDate];

  for (const dup of duplicateCustomers) {
    totalOrderCount += dup.orderCount;
    totalTotalSpent += dup.totalSpent;
    if (dup.firstOrderDate) firstOrderDates.push(dup.firstOrderDate);
    if (dup.lastOrderDate) lastOrderDates.push(dup.lastOrderDate);
  }

  // Update primary customer properties
  primaryCustomer.orderCount = totalOrderCount;
  primaryCustomer.totalSpent = totalTotalSpent;

  // Filter out any undefined or null dates
  const validFirstDates = firstOrderDates.filter(Boolean);
  const validLastDates = lastOrderDates.filter(Boolean);

  if (validFirstDates.length > 0) {
    primaryCustomer.firstOrderDate = new Date(Math.min(...validFirstDates.map(d => new Date(d).getTime())));
  }
  if (validLastDates.length > 0) {
    primaryCustomer.lastOrderDate = new Date(Math.max(...validLastDates.map(d => new Date(d).getTime())));
  }

  // Re-calculate tags
  primaryCustomer.tags = computeCustomerTags(primaryCustomer);

  // Reassign all orders referencing the duplicates to the primary customer
  const duplicateObjectIds = duplicateCustomers.map(dup => dup._id);
  await Order.updateMany(
    { customer: { $in: duplicateObjectIds } },
    { $set: { customer: primaryCustomer._id } }
  );

  // Save the updated primary customer
  await primaryCustomer.save();

  // Delete the duplicate customer documents
  await Customer.deleteMany({ _id: { $in: duplicateObjectIds } });

  return NextResponse.json(
    new ApiResponse(
      200,
      primaryCustomer,
      `Successfully merged ${duplicateCustomers.length} duplicate accounts into customer "${primaryCustomer.name}".`
    )
  );
});
