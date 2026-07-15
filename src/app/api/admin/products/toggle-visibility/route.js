import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/dbConnect";
import Product from "@/models/product.model";
import { ApiError } from "@/utils/ApiError";
import { ApiResponse } from "@/utils/ApiResponse";
import { asyncHandler } from "@/utils/asyncHandler";
import { getToken } from "next-auth/jwt";

export const PATCH = asyncHandler(async (request) => {
    await dbConnect();

    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    if (!token || token.role !== "superadmin") {
        throw new ApiError(403, "Access Denied. Only superadmins can toggle product visibility.");
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id") || searchParams.get("_id");

    if (!id) {
        throw new ApiError(400, "Product ID query parameter is required.");
    }

    const targetProduct = await Product.findById(id);
    if (!targetProduct) {
        throw new ApiError(404, "Product not found inside system records.");
    }

    // Toggle isVisible boolean state (defaults to true if undefined)
    targetProduct.isVisible = targetProduct.isVisible === false;

    await targetProduct.save();
    
    const message = targetProduct.isVisible 
        ? `Product "${targetProduct.name}" is now visible to customers.` 
        : `Product "${targetProduct.name}" is now hidden from customers.`;

    return NextResponse.json(
        new ApiResponse(200, targetProduct, message)
    );
});
