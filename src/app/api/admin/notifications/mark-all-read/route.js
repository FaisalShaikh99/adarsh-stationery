import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/dbConnect";
import Notification from "@/models/notification.model";
import { ApiResponse } from "@/utils/ApiResponse";
import { asyncHandler } from "@/utils/asyncHandler";

export const PATCH = asyncHandler(async () => {
  await dbConnect();

  const result = await Notification.updateMany(
    { isRead: false },
    { $set: { isRead: true } }
  );

  return NextResponse.json(
    new ApiResponse(
      200,
      { modifiedCount: result.modifiedCount },
      "All notifications marked as read"
    )
  );
});
