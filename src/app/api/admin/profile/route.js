import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { dbConnect } from "@/lib/dbConnect";
import { Admin } from "@/models/admin.model";
import { adminProfileSchema } from "@/schemas/profile.schema";

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
    const validation = adminProfileSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { 
          success: false, 
          message: validation.error.errors[0]?.message || "Validation failed." 
        },
        { status: 400 }
      );
    }

    const { name, image } = validation.data;

    await dbConnect();

    const updateData = { name };
    if (image !== undefined) {
      updateData.image = image;
    }

    const updatedAdmin = await Admin.findOneAndUpdate(
      { email: session.user.email },
      { $set: updateData },
      { new: true }
    );

    if (!updatedAdmin) {
      return NextResponse.json(
        { success: false, message: "Admin record not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully!",
      data: {
        id: updatedAdmin._id,
        name: updatedAdmin.name,
        email: updatedAdmin.email,
        image: updatedAdmin.image,
        role: updatedAdmin.role,
      },
    });
  } catch (error) {
    console.error("PATCH /api/admin/profile error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Internal server error." },
      { status: 500 }
    );
  }
}
