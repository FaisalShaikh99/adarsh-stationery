import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/dbConnect";
import { Admin } from "@/models/admin.model";

export async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    await dbConnect();

    const admin = await Admin.findById(id);
    if (!admin) {
      return NextResponse.json(
        { success: false, message: "Member account not found in database." },
        { status: 404 }
      );
    }

    if (admin.role === "superadmin") {
      return NextResponse.json(
        { success: false, message: "Cannot block Master Superadmin account." },
        { status: 400 }
      );
    }

    admin.isBlocked = !admin.isBlocked;
    await admin.save();

    return NextResponse.json({
      success: true,
      message: `Account status for "${admin.name}" updated to ${admin.isBlocked ? "Blocked" : "Active"}.`,
      data: admin,
    });
  } catch (error) {
    console.error("Toggle block error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update account status." },
      { status: 500 }
    );
  }
}
