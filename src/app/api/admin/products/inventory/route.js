import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/dbConnect";
import Product from "@/models/product.model";
import Order from "@/models/order.model";
import { ApiResponse } from "@/utils/ApiResponse";
import { asyncHandler } from "@/utils/asyncHandler";

export const dynamic = "force-dynamic";

export const GET = asyncHandler(async () => {
  await dbConnect();

  // 1. Calculate reserved quantities per product from active non-completed orders
  const reservedAgg = await Order.aggregate([
    {
      $match: {
        status: { $in: ["Pending", "Confirmed", "Shipped"] },
      },
    },
    { $unwind: "$items" },
    {
      $group: {
        _id: "$items.product",
        reservedStock: { $sum: "$items.quantity" },
      },
    },
  ]);

  const reservedMap = {};
  reservedAgg.forEach((item) => {
    if (item._id) {
      reservedMap[item._id.toString()] = item.reservedStock;
    }
  });

  // 2. Fetch active products with populated category & company
  const products = await Product.find({ isActive: true })
    .populate("category", "name")
    .populate("company", "name logo")
    .sort({ name: 1 })
    .lean();

  // 3. Map computed inventory metrics
  const inventoryList = products.map((p) => {
    const currentStock = p.stock || 0;
    const reservedStock = reservedMap[p._id.toString()] || 0;
    const availableStock = currentStock - reservedStock;
    const minStock = p.minStock !== undefined ? p.minStock : 10;
    const costPrice = p.costPrice || 0;
    const sellingPrice = p.sellingPrice || 0;
    const inventoryValue = currentStock * costPrice;
    const supplier = p.supplier || "";

    let status = "In Stock";
    if (availableStock <= 0) {
      status = "Out of Stock";
    } else if (availableStock <= minStock) {
      status = "Low Stock";
    }

    return {
      _id: p._id,
      productId: p.productId || `PROD-${p._id.toString().slice(-6).toUpperCase()}`,
      name: p.name,
      images: p.images || [],
      category: p.category,
      company: p.company,
      stockUnit: p.stockUnit || "Pcs",
      currentStock,
      reservedStock,
      availableStock,
      minStock,
      costPrice,
      sellingPrice,
      inventoryValue,
      supplier,
      status,
      lastRestocked: p.lastRestocked || null,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    };
  });

  return NextResponse.json(
    new ApiResponse(200, inventoryList, "Inventory computed data fetched successfully.")
  );
});
