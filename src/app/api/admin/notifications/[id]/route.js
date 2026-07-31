import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/dbConnect";
import Notification from "@/models/notification.model";
import { ApiError } from "@/utils/ApiError";
import { ApiResponse } from "@/utils/ApiResponse";
import { asyncHandler } from "@/utils/asyncHandler";

export const DELETE = asyncHandler(async (request, { params }) => {
  await dbConnect();

  const { id } = await params;
  if (!id) {
    throw new ApiError(400, "Notification ID is required");
  }

  const deletedNotif = await Notification.findByIdAndDelete(id);

  if (!deletedNotif) {
    throw new ApiError(404, "Notification record not found");
  }

  return NextResponse.json(
    new ApiResponse(200, { _id: id }, "Notification dismissed successfully")
  );
});

export const PATCH = asyncHandler(async (request, { params }) => {
  await dbConnect();

  const { id } = await params;
  if (!id) {
    throw new ApiError(400, "Notification ID is required");
  }

  const updatedNotif = await Notification.findByIdAndUpdate(
    id,
    { isRead: true },
    { new: true }
  );

  if (!updatedNotif) {
    throw new ApiError(404, "Notification record not found");
  }

  return NextResponse.json(
    new ApiResponse(200, updatedNotif, "Notification updated successfully")
  );
});
