import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/dbConnect";
import Notification from "@/models/notification.model";
import { ApiResponse } from "@/utils/ApiResponse";
import { asyncHandler } from "@/utils/asyncHandler";

export const dynamic = "force-dynamic";

export const GET = asyncHandler(async (request) => {
  await dbConnect();

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = Math.max(1, parseInt(searchParams.get("limit") || "10", 10));
  const unreadOnly = searchParams.get("unreadOnly") === "true";

  const filter = {};
  if (unreadOnly) {
    filter.isRead = false;
  }

  const skip = (page - 1) * limit;

  const [notifications, total] = await Promise.all([
    Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Notification.countDocuments(filter),
  ]);

  const totalPages = Math.ceil(total / limit) || 1;

  return NextResponse.json(
    new ApiResponse(
      200,
      {
        notifications,
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
      },
      "Notifications fetched successfully"
    )
  );
});
