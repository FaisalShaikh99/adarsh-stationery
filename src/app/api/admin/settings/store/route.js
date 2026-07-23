import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { dbConnect } from "@/lib/dbConnect";
import { StoreSettings } from "@/models/storeSettings.model";
import { storeSettingsSchema } from "@/schemas/settings.schema";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { success: false, message: "Unauthorized." },
        { status: 401 }
      );
    }

    await dbConnect();
    let settings = await StoreSettings.findOne();
    if (!settings) {
      settings = await StoreSettings.create({});
    }

    return NextResponse.json({
      success: true,
      data: settings,
    });
  } catch (error) {
    console.error("GET /api/admin/settings/store error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Server error." },
      { status: 500 }
    );
  }
}

export async function PATCH(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { success: false, message: "Unauthorized." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const validation = storeSettingsSchema.safeParse(body);
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

    let settings = await StoreSettings.findOne();
    if (!settings) {
      settings = await StoreSettings.create(validation.data);
    } else {
      settings = await StoreSettings.findOneAndUpdate(
        {},
        { $set: validation.data },
        { new: true }
      );
    }

    return NextResponse.json({
      success: true,
      message: "General Store settings saved successfully!",
      data: settings,
    });
  } catch (error) {
    console.error("PATCH /api/admin/settings/store error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Server error." },
      { status: 500 }
    );
  }
}
