import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { dbConnect } from "@/lib/dbConnect";
import { Admin } from "@/models/admin.model";
import { changePasswordSchema } from "@/schemas/settings.schema";
import bcrypt from "bcryptjs";

export const dynamic = "force-dynamic";

export async function PATCH(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Please sign in." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const validation = changePasswordSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          message: validation.error.errors[0]?.message || "Validation failed.",
        },
        { status: 400 }
      );
    }

    const { currentPassword, newPassword } = validation.data;

    await dbConnect();
    const admin = await Admin.findOne({ email: session.user.email });

    if (!admin) {
      return NextResponse.json(
        { success: false, message: "Admin user record not found." },
        { status: 404 }
      );
    }

    // If admin already has a password set, verify current password
    if (admin.password) {
      const isMatch = await bcrypt.compare(currentPassword, admin.password);
      if (!isMatch) {
        return NextResponse.json(
          { success: false, message: "Current password is incorrect." },
          { status: 400 }
        );
      }
    }

    // Hash and save new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    admin.password = hashedPassword;
    await admin.save();

    return NextResponse.json({
      success: true,
      message: "Password changed successfully!",
    });
  } catch (error) {
    console.error("PATCH /api/admin/settings/password error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Server error." },
      { status: 500 }
    );
  }
}
