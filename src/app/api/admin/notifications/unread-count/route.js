import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/dbConnect";
import Notification from "@/models/notification.model";
import { ApiResponse } from "@/utils/ApiResponse";
import { asyncHandler } from "@/utils/asyncHandler";

export const dynamic = "force-dynamic";

export const GET = asyncHandler(async () => {
  await dbConnect();

  const unreadCount = await Notification.countDocuments({ isRead: false });

  return NextResponse.json(
    new ApiResponse(200, { unreadCount }, "Unread notifications count fetched successfully")
  );
});
