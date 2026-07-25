import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/dbConnect";
import Notification from "@/models/notification.model";
import { ApiError } from "@/utils/ApiError";
import { ApiResponse } from "@/utils/ApiResponse";
import { asyncHandler } from "@/utils/asyncHandler";

export const PATCH = asyncHandler(async (request, { params }) => {
  await dbConnect();

  const { id } = await params;
  if (!id) {
    throw new ApiError(400, "Notification ID is required");
  }

  const notification = await Notification.findByIdAndUpdate(
    id,
    { isRead: true },
    { new: true }
  );

  if (!notification) {
    throw new ApiError(404, "Notification not found");
  }

  return NextResponse.json(
    new ApiResponse(200, notification, "Notification marked as read")
  );
});
