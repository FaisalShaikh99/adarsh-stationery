import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/dbConnect";
import { Brand } from "@/models/brand.model";
import Product from "@/models/product.model";
import { ApiError } from "@/utils/ApiError";
import { ApiResponse } from "@/utils/ApiResponse";
import { asyncHandler } from "@/utils/asyncHandler";
import { getToken } from "next-auth/jwt";
import { brandValidationSchema } from "@/schemas/brand.schema";


export const POST = asyncHandler(async (request) => {
    await dbConnect();

    // 1. Secure authorization
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    if (!token || token.role !== "superadmin") {
        throw new ApiError(403, "Access Denied. Unauthorized action.");
    }

    const body = await request.json();
    
    // 2. Validate incoming data using your Zod schema
    const validationResult = brandValidationSchema.safeParse(body);
    if (!validationResult.success) {
        const message = validationResult.error.issues?.[0]?.message || validationResult.error.message || "Invalid brand payload.";
        throw new ApiError(400, message);
    }

    const { name, categories, primaryContact, websiteURL, logo, description, isActive } = validationResult.data;

    // 3. Prevent duplicate brand records
    const existingBrand = await Brand.findOne({ name: name });
    if (existingBrand) {
        throw new ApiError(400, `A brand named "${name}" already exists.`);
    }

    // 4. Save clean data payload
    const savedBrand = await Brand.create({
        name,
        categories,
        primaryContact,
        websiteURL,
        logo,
        description,
        isActive: isActive !== undefined ? isActive : true
    });

    return NextResponse.json(
        new ApiResponse(201, savedBrand, "New Brand profile successfully registered!")
    );
});

export const GET = asyncHandler(async (request) => {
    await dbConnect();

    // Optional query parameter filtering
    const { searchParams } = new URL(request.url);
    const categoryFilter = searchParams.get("category");
    const searchQuery = searchParams.get("search");

    const matchCriteria = { isActive: true };

    if (categoryFilter && categoryFilter !== "all") {
        matchCriteria.categories = categoryFilter;
    }

    if (searchQuery && searchQuery.trim() !== "") {
        matchCriteria.name = { $regex: searchQuery, $options: "i" };
    }

    // Find profiles and populate linked category metadata
    const brands = await Brand.find(matchCriteria)
        .populate("categories", "name slug")
        .sort({ createdAt: -1 });

    return NextResponse.json(
        new ApiResponse(200, brands, "Brand registries loaded perfectly.")
    );
});

export const PUT = asyncHandler(async (request) => {
    await dbConnect();

    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    if (!token || token.role !== "superadmin") {
        throw new ApiError(403, "Access Denied. Only superadmins can modify brand metadata.");
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
        throw new ApiError(400, "Brand ID query parameter is missing.");
    }

    const body = await request.json();
    const { name, categories, primaryContact, websiteURL, logo, description, isActive } = body;

    if (!name || !logo) {
        throw new ApiError(400, "Brand name and logo cannot be left blank.");
    }

    if (!categories || !Array.isArray(categories) || categories.length === 0) {
        throw new ApiError(400, "Brand must retain association with at least one category.");
    }

    const updatedBrandPayload = {
        name: name.trim(),
        categories,
        primaryContact: primaryContact ? primaryContact.trim() : "",
        websiteURL: websiteURL ? websiteURL.trim() : "",
        logo: logo.trim(),
        description: description ? description.trim() : "",
        isActive: isActive !== undefined ? isActive : true
    };

    const updatedBrand = await Brand.findByIdAndUpdate(
        id,
        { $set: updatedBrandPayload },
        { new: true, runValidators: true }
    );

    if (!updatedBrand) {
        throw new ApiError(404, "Target Brand document not found or failed to update.");
    }

    return NextResponse.json(
        new ApiResponse(200, updatedBrand, `Brand profile for "${updatedBrand.name}" updated live sync!`)
    );
});


export const DELETE = asyncHandler(async (request) => {
    await dbConnect();

    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    if (!token || token.role !== "superadmin") {
        throw new ApiError(403, "Access Denied. Only superadmins can execute destructive commands.");
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
        throw new ApiError(400, "Brand ID target parameter is mandatory.");
    }

    // Safety Guard: Check if any active products are still relying on this brand/company
    // (Note: ensure your Product model field aligns with either 'company' or 'brand')
    const attachedProductExists = await Product.findOne({ company: id, isActive: true });
    if (attachedProductExists) {
        throw new ApiError(
            400,
            "Cannot drop brand profile! Active structural products remain in inventory under this brand flag."
        );
    }

    // Standard Soft-Delete Deactivation
    const archivedBrand = await Brand.findByIdAndUpdate(
        id,
        { $set: { isActive: false } },
        { new: true }
    );

    if (!archivedBrand) {
        throw new ApiError(404, "Brand profile not found in architecture index.");
    }

    return NextResponse.json(
        new ApiResponse(200, archivedBrand, `Brand "${archivedBrand.name}" safely retired from live matrices.`)
    );
});