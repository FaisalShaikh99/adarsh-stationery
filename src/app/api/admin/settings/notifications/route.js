import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { dbConnect } from "@/lib/dbConnect";
import { Admin } from "@/models/admin.model";
import { notificationsSchema } from "@/schemas/settings.schema";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json(
        { success: false, message: "Unauthorized." },
        { status: 401 }
      );
    }

    await dbConnect();
    const admin = await Admin.findOne({ email: session.user.email });

    if (!admin) {
      return NextResponse.json(
        { success: false, message: "Admin user not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        notifyNewOrder: admin.notifyNewOrder ?? true,
        notifyLowStock: admin.notifyLowStock ?? true,
        notifyNewTeamMember: admin.notifyNewTeamMember ?? true,
      },
    });
  } catch (error) {
    console.error("GET /api/admin/settings/notifications error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Server error." },
      { status: 500 }
    );
  }
}

export async function PATCH(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json(
        { success: false, message: "Unauthorized." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const validation = notificationsSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          message: validation.error.errors[0]?.message || "Validation failed.",
        },
        { status: 400 }
      );
    }

    await dbConnect();
    const updatedAdmin = await Admin.findOneAndUpdate(
      { email: session.user.email },
      { $set: validation.data },
      { new: true }
    );

    if (!updatedAdmin) {
      return NextResponse.json(
        { success: false, message: "Admin user not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Notification preferences saved successfully!",
      data: {
        notifyNewOrder: updatedAdmin.notifyNewOrder,
        notifyLowStock: updatedAdmin.notifyLowStock,
        notifyNewTeamMember: updatedAdmin.notifyNewTeamMember,
      },
    });
  } catch (error) {
    console.error("PATCH /api/admin/settings/notifications error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Server error." },
      { status: 500 }
    );
  }
}
