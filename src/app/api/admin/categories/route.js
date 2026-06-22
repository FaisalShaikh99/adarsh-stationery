import { Product } from "@/models/product.model"; // Yeh line lookup ko active rakhegi!
import { dbConnect } from "@/lib/dbConnect";
import { Category } from "@/models/category.model";
import { categoryCreateSchema } from "@/schemas/category.schema"; 
import { ApiError } from "@/utils/ApiError";
import { ApiResponse } from "@/utils/ApiResponse";
import { asyncHandler } from "@/utils/asyncHandler";
import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";

export const POST = asyncHandler(async (request) => {
    await dbConnect();

    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    if (!token || token.role !== "superadmin") {
        throw new ApiError(403, "Access Denied. Unauthorized action.");
    }

    const body = await request.json();

    const validationResult = categoryCreateSchema.safeParse(body);
    
    if (!validationResult.success) {
        const errorMessage = validationResult.error.errors[0].message;
        throw new ApiError(400, errorMessage);
    }

    const { name, imageUrl } = validationResult.data;

    const generatedSlug = name
        .toLowerCase()
        .replace(/[^\w\s-]/g, "") 
        .replace(/[\s_-]+/g, "-")  
        .replace(/^-+|-+$/g, "");  

    const existingCategory = await Category.findOne({
        $or: [{ name: name }, { slug: generatedSlug }]
    });

    if (existingCategory) {
        throw new ApiError(400, "Category with this name already exists.");
    }

    const newCategory = await Category.create({
        name: name,
        slug: generatedSlug,
        image: imageUrl && imageUrl.trim() !== "" ? imageUrl : undefined,
    });

    return NextResponse.json(
        new ApiResponse(201, newCategory, "New category added successfully!")
    );
});

export const GET = asyncHandler(async (request) => {
    await dbConnect();

    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    if (!token) {
        throw new ApiError(401, "Unauthorized access. Please login first.");
    }

    // Dynamic Aggregation Pipeline 
    const categoriesWithProductCount = await Category.aggregate([
        // Saare products table ke sath link join (Lookup) 
        {
            $lookup: {
                from: "products",           // Aapke products collection ka asli naam (usually lowercase plural)
                localField: "_id",          // Category table ki ID
                foreignField: "category",   // Product table me jo category ref store hai
                as: "linkedProducts"        // Output array ka naam
            }
        },
        // Linked products array ki length calculate karke 'totalProducts' me map 
        {
            $project: {
                _id: 1,
                name: 1,
                slug: 1,
                image: 1,
                isActive: 1,
                createdAt: 1,
                // Agar linkedProducts array hai toh uski size nikaalein, nahi toh 0 set karein
                totalProducts: { $size: { $ifNull: ["$linkedProducts", []] } }
            }
        },
        
        {
            $sort: { createdAt: -1 }
        }
    ]);

    return NextResponse.json(
        new ApiResponse(200, categoriesWithProductCount, "Categories data loaded perfectly with live product counters!")
    );
});

export const PATCH = asyncHandler(async (request) => {
    await dbConnect();

    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    if (!token || token.role !== "superadmin") {
        throw new ApiError(403, "Access Denied. Only superadmin can toggle category status.");
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
        throw new ApiError(400, "Category ID query parameter is required.");
    }

    const targetCategory = await Category.findById(id);
    if (!targetCategory) {
        throw new ApiError(404, "Category not found inside system records.");
    }

    targetCategory.isActive = !targetCategory.isActive;

    await targetCategory.save();
    
    const message = targetCategory.isActive 
        ? `Category "${targetCategory.name}" is now Active.` 
        : `Category "${targetCategory.name}" is now Inactive.`;

    return NextResponse.json(
        new ApiResponse(200, targetCategory, message)
    );
});

export const DELETE = asyncHandler(async (request) => {
    await dbConnect();

    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    if (!token || token.role !== "superadmin") {
        throw new ApiError(403, "Access Denied. Only superadmin can delete categories.");
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
        throw new ApiError(400, "Category ID query parameter is required.");
    }

    // Safety Guard: Check karein ki is category me koi product to nahi hai?
    const attachedProductExists = await Product.findOne({ category: id });
    if (attachedProductExists) {
        throw new ApiError(
            400, 
            "Cannot delete category! It contains live active products. Move or delete them first."
        );
    }

    // Agar products nahi hain, toh safely delete karein
    const deletedCategory = await Category.findByIdAndDelete(id);
    if (!deletedCategory) {
        throw new ApiError(404, "Category not found inside system records.");
    }

    return NextResponse.json(
        new ApiResponse(200, null, `Category "${deletedCategory.name}" has been deleted successfully.`)
    );
});

export const PUT = asyncHandler(async (request) => {
    await dbConnect();

    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    if (!token || token.role !== "superadmin") {
        throw new ApiError(403, "Access Denied. Only superadmin can update categories.");
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
        throw new ApiError(400, "Category ID query parameter is required.");
    }

    // Frontend Body Se Naya Data 
    const body = await request.json();

    // Zod Schema Validation Secure Validation
    const validationResult = categoryCreateSchema.safeParse(body);
    if (!validationResult.success) {
        throw new ApiError(400, validationResult.error.errors[0].message);
    }

    const { name, imageUrl } = validationResult.data;

    // Naye Name Ke Mutabik Automatic Fresh Slug Generation
    const generatedSlug = name
        .toLowerCase()
        .replace(/[^\w\s-]/g, "") 
        .replace(/[\s_-]+/g, "-")  
        .replace(/^-+|-+$/g, "");

    // Database Update Query Execution
    const updatedCategory = await Category.findByIdAndUpdate(
        id,
        {
            $set: {
                name: name,
                slug: generatedSlug,
                image: imageUrl && imageUrl.trim() !== "" ? imageUrl : undefined
            }
        },
        { new: true, runValidators: true } // { new: true } se updated data return hota hai
    );

    if (!updatedCategory) {
        throw new ApiError(404, "Category not found or failed to update.");
    }

    return NextResponse.json(
        new ApiResponse(200, updatedCategory, `Category updated to "${updatedCategory.name}" successfully.`)
    );
});