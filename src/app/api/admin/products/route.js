import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/dbConnect";
import Product from "@/models/product.model";
import { Category } from "@/models/category.model";
import { productValidationSchema } from "@/schemas/products.schema";

// ==================== 📊 1. GET ROUTE (Fetch + Metrics Box Aggregate Core) ====================
export async function GET(req) {
  try {
    await dbConnect();
    
    // A. URL parameters for query filters & paginations
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = 10; // 10 items showing matching diagram specification
    const skip = (page - 1) * limit;

    // Build dynamic search query matrix
    let queryFilter = {};
    if (search) {
      queryFilter.$or = [
        { name: { $regex: search, $options: "i" } },
        { company: { $regex: search, $options: "i" } },
        { productId: { $regex: search, $options: "i" } }
      ];
    }

    // B. 🔥 HIGH-END AGGREGATION PIPELINE FOR THE TOP 4 BOXES
    // Is computational calculations se database single-shot me saare boxes ke data nikal dega
    const analytics = await Product.aggregate([
      {
        $facet: {
          totalProductsLive: [{ $match: { isActive: true } }, { $count: "count" }],
          uniqueBrands: [{ $group: { _id: "$company" } }, { $count: "count" }],
          revenueCalculated: [
            { $project: { revenue: { $multiply: ["$sellingPrice", "$stock"] } } },
            { $group: { _id: null, total: { $sum: "$revenue" } } }
          ],
          criticalStockAlert: [
            { $match: { stock: { $lte: 10 } } }, // 10 items limit for alert card trigger
            { $limit: 1 },
            { $project: { name: 1 } }
          ]
        }
      }
    ]);

    const metrics = {
      totalProductsLive: analytics[0]?.totalProductsLive[0]?.count || 0,
      totalBrands: analytics[0]?.uniqueBrands[0]?.count || 0,
      totalRevenue: analytics[0]?.revenueCalculated[0]?.total || 0,
      stockAlertProductName: analytics[0]?.criticalStockAlert[0]?.name || "All Stocks Stable"
    };

    // C. Fetch paginated products matrix docs
    const productsList = await Product.find(queryFilter)
      .populate("category", "name") // Pulls parent category string references data
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalMatchingDocs = await Product.countDocuments(queryFilter);

    return NextResponse.json({
      success: true,
      data: productsList,
      metrics, // Sends dashboard boxes variables array data
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalMatchingDocs / limit),
        totalProducts: totalMatchingDocs
      }
    }, { status: 200 });

  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// ==================== 📥 2. POST ROUTE (Form Document Submission Node) ====================
export async function POST(req) {
  try {
    await dbConnect();
    const body = await req.json();

    // Run strict Zod interceptor schema parsing layer validation shield
    const validationResult = productValidationSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json({ 
        success: false, 
        message: validationResult.error.errors[0].message 
      }, { status: 400 });
    }

    // Create new mongoose record entry framework
    const newProduct = new Product(validationResult.data);
    await newProduct.save();

    // Increment Total products tracker directly onto relative Category doc collection hook
    await Category.findByIdAndUpdate(validationResult.data.category, {
      $inc: { totalProducts: 1 }
    });

    return NextResponse.json({ 
      success: true, 
      message: "Asset saved and synced into warehouse logging matrix!",
      data: newProduct 
    }, { status: 201 });

  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// ==================== 🛠️ 3. PUT ROUTE (Complete Row Modification Sync) ====================
export async function PUT(req) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) return NextResponse.json({ success: false, message: "Missing system target ID parameter" }, { status: 400 });
    
    const body = await req.json();
    const validationResult = productValidationSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json({ success: false, message: validationResult.error.errors[0].message }, { status: 400 });
    }

    const updatedProduct = await Product.findByIdAndUpdate(id, validationResult.data, { new: true });
    
    if (!updatedProduct) return NextResponse.json({ success: false, message: "Target document footprint not found" }, { status: 404 });

    return NextResponse.json({ 
      success: true, 
      message: "Operational modifications permanently committed!",
      data: updatedProduct 
    }, { status: 200 });

  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// ==================== 🎛️ 4. PATCH ROUTE (Binary State Toggle Controller) ====================
export async function PATCH(req) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) return NextResponse.json({ success: false, message: "Target row unique identifier missing" }, { status: 400 });

    const targetProduct = await Product.findById(id);
    if (!targetProduct) return NextResponse.json({ success: false, message: "No operational asset record mapped" }, { status: 404 });

    // Atomic boolean data state reversal transition toggle inversion 🔄
    targetProduct.isActive = !targetProduct.isActive;
    await targetProduct.save();

    return NextResponse.json({ 
      success: true, 
      message: `Product context visibility switched to ${targetProduct.isActive ? 'ACTIVE' : 'DISABLED'}` 
    }, { status: 200 });

  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// ==================== 🗑️ 5. DELETE ROUTE (Purge Asset Record Node) ====================
export async function DELETE(req) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) return NextResponse.json({ success: false, message: "Target document removal node string missing" }, { status: 400 });

    const deletedProduct = await Product.findByIdAndDelete(id);
    if (!deletedProduct) return NextResponse.json({ success: false, message: "Record index missing or already purged" }, { status: 404 });

    // Decrement relative index total values from inside active category documents counter node
    await Category.findByIdAndUpdate(deletedProduct.category, {
      $inc: { totalProducts: -1 }
    });

    return NextResponse.json({ 
      success: true, 
      message: "Document entity successfully dropped from cloud cluster records storage layer." 
    }, { status: 200 });

  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}