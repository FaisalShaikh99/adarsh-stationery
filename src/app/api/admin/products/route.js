import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/dbConnect";
import Product from "@/models/product.model";
import { ApiError } from "@/utils/ApiError";
import { ApiResponse } from "@/utils/ApiResponse";
import { asyncHandler } from "@/utils/asyncHandler";
import { getToken } from "next-auth/jwt";
import crypto from "crypto";
import mongoose from "mongoose";
import { Brand } from "@/models/brand.model";
import { productValidationSchema } from "@/schemas/products.schema";
import { createNotification } from "@/lib/createNotification";

export const POST = asyncHandler(async (request) => {
    await dbConnect();

    // 1. Secure authorization
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    if (!token || token.role !== "superadmin") {
        throw new ApiError(403, "Access Denied. Only superadmins can create products.");
    }

    const body = await request.json();

    // 2. Validate data via Zod Schema
    const validationResult = productValidationSchema.safeParse(body);
    if (!validationResult.success) {
        const message = validationResult.error.issues?.[0]?.message || validationResult.error.message || "Invalid product payload.";
        throw new ApiError(400, message);
    }

    const { 
        name, category, company, stock, minStock, supplier, stockUnit, 
        costPrice, sellingPrice, images, description, isActive 
    } = validationResult.data;

    // 3. Fetch Company Details to Generate Custom Product ID
    const companyDoc = await Brand.findById(company);
    if (!companyDoc) {
        throw new ApiError(404, "Linked company/brand not found in database.");
    }

    const companyPrefix = companyDoc.name.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, "X");
    const currentYear = new Date().getFullYear().toString().slice(-2);
    const randomHex = crypto.randomBytes(2).toString("hex").toUpperCase();
    const customProductId = `${companyPrefix}-${currentYear}-${randomHex}`;

    const newStockNum = Number(stock);

    // 4. Save cleanly structured product
    const savedProduct = await Product.create({
        productId: customProductId,
        name,
        category,
        company,
        stock: newStockNum,
        minStock: minStock !== undefined ? Number(minStock) : 10,
        supplier: supplier ? supplier.trim() : "",
        lastRestocked: newStockNum > 0 ? new Date() : null,
        stockUnit,
        costPrice,
        sellingPrice,
        images,
        description: description || "",
        isActive: isActive !== undefined ? isActive : true
    });

    return NextResponse.json(
        new ApiResponse(201, savedProduct, "New product listed successfully into live inventory matrix!")
    );
});

export const GET = asyncHandler(async (request) => {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const categoryFilter = searchParams.get("category");
    const companyFilter = searchParams.get("company");
    const searchQuery = searchParams.get("search");

    const matchCriteria = { isActive: true };

    if (categoryFilter && categoryFilter !== "all") {
        matchCriteria.category = new mongoose.Types.ObjectId(categoryFilter);
    }

    if (companyFilter && companyFilter !== "all") {
        matchCriteria.company = new mongoose.Types.ObjectId(companyFilter);
    }

    if (searchQuery && searchQuery.trim() !== "") {
        matchCriteria.name = { $regex: searchQuery, $options: "i" };
    }

    const products = await Product.aggregate([
        { $match: matchCriteria },
        {
            $lookup: {
                from: "categories",
                localField: "category",
                foreignField: "_id",
                as: "category"
            }
        },
        {
            $unwind: {
                path: "$category",
                preserveNullAndEmptyArrays: true
            }
        },
        {
            $lookup: {
                from: "brands",
                localField: "company",
                foreignField: "_id",
                as: "company"
            }
        },
        {
            $unwind: {
                path: "$company",
                preserveNullAndEmptyArrays: true
            }
        },
        {
            $addFields: {
                trafficSignalPriority: {
                    $cond: {
                        if: { $lte: ["$stock", 20] },
                        then: 1,
                        else: {
                            $cond: {
                                if: { $lte: ["$stock", 50] },
                                then: 2,
                                else: 3
                            }
                        }
                    }
                }
            }
        },
        {
            $sort: {
                trafficSignalPriority: 1,
                stock: 1
            }
        }
    ]);

    return NextResponse.json(
        new ApiResponse(200, products, "Inventory data successfully indexed and optimized!")
    );
});

export const PUT = asyncHandler(async (request) => {
    await dbConnect();

    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    if (!token || token.role !== "superadmin") {
        throw new ApiError(403, "Access Denied. Only superadmins can update products.");
    }

    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("_id") || searchParams.get("id");

    if (!productId) {
        throw new ApiError(400, "Product ID parameter is missing.");
    }

    const existingProduct = await Product.findById(productId);
    if (!existingProduct) {
        throw new ApiError(404, "Product not found in inventory.");
    }

    const body = await request.json();
    const { 
        name, category, company, stock, minStock, supplier, stockUnit, 
        costPrice, sellingPrice, images, description, isActive 
    } = body;

    if (!name || !category || !company || costPrice === undefined || sellingPrice === undefined) {
        throw new ApiError(400, "Missing required core parameters.");
    }

    if (!images || !Array.isArray(images) || images.length === 0) {
        throw new ApiError(400, "Product must have at least 1 image.");
    }

    if (Number(stock) < 0 || Number(costPrice) < 0 || Number(sellingPrice) < 0) {
        throw new ApiError(400, "Stock, Cost Price, or Selling Price cannot be negative.");
    }

    let customProductId = existingProduct.productId;

    if (existingProduct.company.toString() !== company) {
        const companyDoc = await Brand.findById(company);
        if (!companyDoc) {
            throw new ApiError(404, "New linked company/brand not found.");
        }
        
        const companyPrefix = companyDoc.name.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, "X");
        const currentYear = new Date().getFullYear().toString().slice(-2);
        const randomHex = crypto.randomBytes(2).toString("hex").toUpperCase();
        customProductId = `${companyPrefix}-${currentYear}-${randomHex}`;
    }

    const newStockNum = stock !== undefined && stock !== "" ? Number(stock) : 0;
    const oldStockNum = Number(existingProduct.stock || 0);

    const updatedProductPayload = {
        productId: customProductId,
        name: name.trim(),
        category,
        company,
        stock: newStockNum,
        minStock: minStock !== undefined && minStock !== "" ? Number(minStock) : (existingProduct.minStock || 10),
        supplier: supplier !== undefined ? supplier.trim() : (existingProduct.supplier || ""),
        stockUnit: stockUnit || "Pcs",
        costPrice: Number(costPrice),
        sellingPrice: Number(sellingPrice),
        images: images.filter(url => url && url.trim() !== ""),
        description: description ? description.trim() : "",
        isActive: isActive !== undefined ? isActive : existingProduct.isActive
    };

    // Update lastRestocked timestamp ONLY if stock quantity increased
    if (newStockNum > oldStockNum) {
        updatedProductPayload.lastRestocked = new Date();
    }

    const savedProduct = await Product.findByIdAndUpdate(
        productId,
        updatedProductPayload,
        { new: true, runValidators: true }
    );

    // Low stock notification trigger with unread deduplication
    const minStockThreshold = savedProduct.minStock !== undefined ? savedProduct.minStock : 10;
    if (savedProduct.stock <= minStockThreshold) {
        await createNotification({
            type: "low_stock",
            title: "Low Stock Alert",
            message: `${savedProduct.name} is running low on stock (${savedProduct.stock} ${savedProduct.stockUnit || "Pcs"} remaining)`,
            link: "/admin/inventory",
            relatedId: savedProduct._id,
        });
    }

    return NextResponse.json(
        new ApiResponse(200, savedProduct, "Product specifications updated live into database infrastructure!")
    );
});

export const DELETE = asyncHandler(async (request) => {
    await dbConnect();

    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    if (!token || token.role !== "superadmin") {
        throw new ApiError(403, "Access Denied. Only superadmins can delete products.");
    }

    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("_id") || searchParams.get("id");

    if (!productId) {
        throw new ApiError(400, "Product ID parameter is mandatory.");
    }

    const deletedProduct = await Product.findByIdAndUpdate(
        productId,
        { isActive: false },
        { new: true }
    );

    if (!deletedProduct) {
        throw new ApiError(404, "Product not found in database registry.");
    }

    return NextResponse.json(
        new ApiResponse(200, deletedProduct, "Product successfully archived and removed from live catalog matrix!")
    );
});