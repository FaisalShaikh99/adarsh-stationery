import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/dbConnect";
import { Admin } from "@/models/admin.model";
import { getToken } from "next-auth/jwt";

export async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    await dbConnect();

    // Verify session authorization
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    if (!token || token.role !== "superadmin") {
      return NextResponse.json(
        { success: false, message: "Access Denied. Only Superadmin can change team member roles." },
        { status: 403 }
      );
    }

    // Prevent Superadmin from changing their own role
    if (token.id === id || token.sub === id || token.email === (await Admin.findById(id))?.email) {
      const targetAdmin = await Admin.findById(id);
      if (token.email === targetAdmin?.email) {
        return NextResponse.json(
          { success: false, message: "Superadmins cannot change their own role." },
          { status: 400 }
        );
      }
    }

    const body = await request.json();
    const { role } = body;

    const allowedRoles = ["superadmin", "admin", "staff", "manager", "inventory"];
    if (!role || !allowedRoles.includes(role.toLowerCase())) {
      return NextResponse.json(
        { success: false, message: "Invalid role specified." },
        { status: 400 }
      );
    }

    const member = await Admin.findById(id);
    if (!member) {
      return NextResponse.json(
        { success: false, message: "Team member not found in database." },
        { status: 404 }
      );
    }

    const oldRole = member.role;
    member.role = role.toLowerCase();
    await member.save();

    return NextResponse.json({
      success: true,
      message: `Role for "${member.name}" changed from ${oldRole.toUpperCase()} to ${role.toUpperCase()}.`,
      data: member,
    });
  } catch (error) {
    console.error("Team member role update error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update team member role." },
      { status: 500 }
    );
  }
}
