import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { dbConnect } from "@/lib/dbConnect";
import Order from "@/models/order.model";

export const dynamic = "force-dynamic";

function formatDateRangeStr(startDate, endDate) {
  const startStr = startDate.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const endStr = endDate.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return `${startStr} - ${endStr}`;
}

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Please sign in." },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const period = searchParams.get("period") || "week";

    await dbConnect();

    const now = new Date();
    let startDate;
    let endDate = now;
    let label = "This Week";

    if (period === "month") {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      label = "This Month";
    } else {
      // Default to "week"
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      label = "This Week";
    }

    const dateRangeStr = formatDateRangeStr(startDate, endDate);

    // Group items by COMBINATION of (product + costPricePerUnit + pricePerUnit)
    const breakdownAgg = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lt: endDate },
        },
      },
      {
        $lookup: {
          from: "payments",
          localField: "payment",
          foreignField: "_id",
          as: "paymentDetails",
        },
      },
      {
        $match: {
          "paymentDetails.status": "Paid",
        },
      },
      { $unwind: "$items" },
      {
        $match: {
          "items.costPricePerUnit": { $exists: true, $ne: null },
        },
      },
      {
        $group: {
          _id: {
            productId: "$items.product",
            productName: "$items.productName",
            costPricePerUnit: "$items.costPricePerUnit",
            pricePerUnit: "$items.pricePerUnit",
          },
          quantitySold: { $sum: "$items.quantity" },
          totalSale: { $sum: "$items.subtotal" },
          totalProfit: {
            $sum: {
              $multiply: [
                {
                  $subtract: ["$items.pricePerUnit", "$items.costPricePerUnit"],
                },
                "$items.quantity",
              ],
            },
          },
        },
      },
      {
        $sort: { totalProfit: -1 },
      },
    ]);

    // Count product occurrences to mark mid-period price variations
    const productCountMap = {};
    breakdownAgg.forEach((item) => {
      const pName = item._id.productName;
      productCountMap[pName] = (productCountMap[pName] || 0) + 1;
    });

    let grandTotalQuantitySold = 0;
    let grandTotalSale = 0;
    let grandTotalProfit = 0;

    const breakdown = breakdownAgg.map((item) => {
      const costPricePerUnit = item._id.costPricePerUnit || 0;
      const pricePerUnit = item._id.pricePerUnit || 0;
      const profitPerUnit = pricePerUnit - costPricePerUnit;
      const quantitySold = item.quantitySold || 0;
      const totalSale = item.totalSale || 0;
      const totalProfit = item.totalProfit || 0;

      grandTotalQuantitySold += quantitySold;
      grandTotalSale += totalSale;
      grandTotalProfit += totalProfit;

      return {
        productId: item._id.productId,
        productName: item._id.productName,
        costPricePerUnit,
        pricePerUnit,
        profitPerUnit,
        quantitySold,
        totalSale,
        totalProfit,
        hasPriceVariation: (productCountMap[item._id.productName] || 0) > 1,
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        period,
        label,
        dateRangeStr,
        startDate,
        endDate,
        breakdown,
        grandTotal: {
          totalQuantitySold: grandTotalQuantitySold,
          totalSale: grandTotalSale,
          totalProfit: grandTotalProfit,
        },
      },
    });
  } catch (error) {
    console.error("GET /api/admin/dashboard/profit-breakdown error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Internal server error." },
      { status: 500 }
    );
  }
}
