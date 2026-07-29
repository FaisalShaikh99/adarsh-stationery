import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { dbConnect } from "@/lib/dbConnect";
import Order, { ORDER_STATUSES } from "@/models/order.model";
import Product from "@/models/product.model";
import Customer from "@/models/customer.model";
import { Category } from "@/models/category.model";
import Payment from "@/models/payment.model";
import Expense from "@/models/expense.model";
import { getCurrentSeasonalReminder } from "@/lib/seasonalReminders";

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
    const lowStockThreshold = Math.max(
      Number.parseInt(searchParams.get("lowStockThreshold") || "10", 10),
      0
    );

    await dbConnect();

    const now = new Date();

    // 1. Date Ranges
    const thisWeekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thisWeekEnd = now;

    const priorWeekStart = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    const priorWeekEnd = thisWeekStart;

    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    const thisMonthEnd = now;

    const priorMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
    const priorMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

    const d30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Top KPI numbers
    const [
      paidOrdersRevenueAgg,
      totalOrders,
      totalCustomers,
      totalProducts,
      pendingFulfillment,
    ] = await Promise.all([
      Order.aggregate([
        {
          $match: {
            status: { $ne: "Cancelled" }
          }
        },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: "$totalAmount" }
          }
        }
      ]),
      Order.countDocuments({}),
      Customer.countDocuments({}),
      Product.countDocuments({}),
      Order.countDocuments({ status: "Confirmed" }),
    ]);

    const totalRevenue = paidOrdersRevenueAgg[0]?.totalRevenue || 0;

    // Profit calculation helper
    const getProfitForPeriod = async (startDate, endDate) => {
      try {
        const res = await Order.aggregate([
          {
            $match: {
              createdAt: { $gte: startDate, $lt: endDate },
              status: { $ne: "Cancelled" }
            },
          },
          { $unwind: "$items" },
          {
            $group: {
              _id: null,
              profit: {
                $sum: {
                  $multiply: [
                    {
                      $subtract: [
                        { $ifNull: ["$items.pricePerUnit", 0] },
                        { $ifNull: ["$items.costPricePerUnit", 0] },
                      ],
                    },
                    { $ifNull: ["$items.quantity", 1] },
                  ],
                },
              },
            },
          },
        ]);
        return res[0]?.profit || 0;
      } catch (err) {
        console.error("getProfitForPeriod error:", err);
        return 0;
      }
    };

    // Expense calculation helper
    const getExpenseForPeriod = async (startDate, endDate, isWeek) => {
      try {
        const allExpenses = await Expense.find({}).lean();
        let total = 0;
        for (const exp of allExpenses) {
          const expDate = new Date(exp.date);
          const recEndDate = exp.recurrenceEndDate ? new Date(exp.recurrenceEndDate) : null;
          if (!exp.isRecurring) {
            if (expDate >= startDate && expDate <= endDate) {
              total += exp.amount || 0;
            }
          } else {
            const isActive = expDate <= endDate && (!recEndDate || recEndDate >= startDate);
            if (isActive) {
              total += isWeek ? (exp.amount || 0) / 4 : (exp.amount || 0);
            }
          }
        }
        return Number(total.toFixed(2));
      } catch (err) {
        console.error("getExpenseForPeriod error:", err);
        return 0;
      }
    };

    // 2. Profit / Loss Calculations
    const [thisWeekProfit, lastWeekProfit, thisMonthProfit, lastMonthProfit, thisWeekExpenses, thisMonthExpenses] =
      await Promise.all([
        getProfitForPeriod(thisWeekStart, thisWeekEnd),
        getProfitForPeriod(priorWeekStart, priorWeekEnd),
        getProfitForPeriod(thisMonthStart, thisMonthEnd),
        getProfitForPeriod(priorMonthStart, priorMonthEnd),
        getExpenseForPeriod(thisWeekStart, thisWeekEnd, true),
        getExpenseForPeriod(thisMonthStart, thisMonthEnd, false),
      ]);

    const thisWeekNetProfit = thisWeekProfit - thisWeekExpenses;
    const thisMonthNetProfit = thisMonthProfit - thisMonthExpenses;

    const calcPercentageChange = (current, prior) => {
      if (prior === 0) return current > 0 ? 100 : 0;
      return Number((((current - prior) / prior) * 100).toFixed(1));
    };

    const weekPercentageChange = calcPercentageChange(thisWeekNetProfit, lastWeekProfit);
    const monthPercentageChange = calcPercentageChange(thisMonthNetProfit, lastMonthProfit);

    // 3. Best Selling Products
    const bestSellingProductsAgg = await Order.aggregate([
      { $match: { status: { $ne: "Cancelled" } } },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.product",
          productName: { $first: "$items.productName" },
          totalUnitsSold: { $sum: "$items.quantity" },
          totalRevenueGenerated: { $sum: "$items.subtotal" },
        },
      },
      { $sort: { totalUnitsSold: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "_id",
          as: "productDoc",
        },
      },
      {
        $project: {
          productId: "$_id",
          productName: 1,
          totalUnitsSold: 1,
          totalRevenueGenerated: 1,
          stockLevel: { $arrayElemAt: ["$productDoc.stockQuantity", 0] },
        },
      },
    ]);

    // 4. Low Stock Alerts
    const lowStockProducts = await Product.find({
      stockQuantity: { $lte: lowStockThreshold },
    })
      .select("name stockQuantity sku category")
      .lean();

    const lowStockAlerts = lowStockProducts.map((p) => ({
      productId: p._id,
      productName: p.name,
      stockQuantity: p.stockQuantity,
      sku: p.sku || "N/A",
      threshold: lowStockThreshold,
    }));

    // 5. Category Purchase Trend
    const categoryPurchaseTrend = await Order.aggregate([
      { $match: { createdAt: { $gte: d30 }, status: { $ne: "Cancelled" } } },
      { $unwind: "$items" },
      {
        $lookup: {
          from: "products",
          localField: "items.product",
          foreignField: "_id",
          as: "productDetails",
        },
      },
      { $unwind: { path: "$productDetails", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "categories",
          localField: "productDetails.category",
          foreignField: "_id",
          as: "categoryDetails",
        },
      },
      { $unwind: { path: "$categoryDetails", preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: "$categoryDetails.name",
          totalPurchases: { $sum: "$items.quantity font-mono" },
          revenue: { $sum: "$items.subtotal" },
        },
      },
      {
        $project: {
          categoryName: { $ifNull: ["$_id", "Uncategorized"] },
          totalPurchases: "$revenue",
          revenue: 1,
        },
      },
      { $sort: { revenue: -1 } },
      { $limit: 6 },
    ]);

    // 6. Recently Sold Products & New Customers
    const recentlySoldProductsAgg = await Order.aggregate([
      { $match: { status: { $ne: "Cancelled" } } },
      { $sort: { createdAt: -1 } },
      { $limit: 6 },
      { $unwind: "$items" },
      {
        $project: {
          orderId: "$_id",
          orderNumber: 1,
          productName: "$items.productName",
          quantity: "$items.quantity",
          subtotal: "$items.subtotal",
          soldAt: "$createdAt",
          shippingName: "$shippingAddress.name",
        },
      },
      { $limit: 6 },
    ]);

    const recentlyNewCustomers = await Customer.find({})
      .sort({ createdAt: -1 })
      .limit(5)
      .select("name email phone totalOrders createdAt")
      .lean();

    // 7. 30-Day Revenue Trend
    const rawRevenueTrend = await Order.aggregate([
      { $match: { createdAt: { $gte: d30 }, status: { $ne: "Cancelled" } } },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          },
          dailyRevenue: { $sum: "$totalAmount" },
          orderCount: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const revenueTrendMap = new Map();
    for (const item of rawRevenueTrend) {
      revenueTrendMap.set(item._id, {
        revenue: item.dailyRevenue,
        orderCount: item.orderCount,
      });
    }

    const revenueTrend = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = d.toISOString().split("T")[0];
      const displayLabel = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      const entry = revenueTrendMap.get(dateStr) || { revenue: 0, orderCount: 0 };
      revenueTrend.push({
        date: dateStr,
        label: displayLabel,
        revenue: entry.revenue,
        orderCount: entry.orderCount,
      });
    }

    // 8. Order Status Breakdown
    const statusCounts = await Order.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    const statusMap = new Map(statusCounts.map((s) => [s._id, s.count]));
    const orderStatusBreakdown = ORDER_STATUSES.map((st) => ({
      status: st,
      count: statusMap.get(st) || 0,
    }));

    const seasonalReminder = getCurrentSeasonalReminder();

    return NextResponse.json({
      success: true,
      data: {
        kpis: {
          totalRevenue,
          totalOrders,
          totalCustomers,
          totalProducts,
          pendingFulfillment,
        },
        profitLoss: {
          thisWeek: {
            label: "This Week",
            dateRangeStr: formatDateRangeStr(thisWeekStart, thisWeekEnd),
            startDate: thisWeekStart,
            endDate: thisWeekEnd,
            profit: thisWeekProfit,
            grossProfit: thisWeekProfit,
            totalExpenses: thisWeekExpenses,
            netProfit: thisWeekNetProfit,
            priorProfit: lastWeekProfit,
            percentageChange: weekPercentageChange,
          },
          thisMonth: {
            label: "This Month",
            dateRangeStr: formatDateRangeStr(thisMonthStart, thisMonthEnd),
            startDate: thisMonthStart,
            endDate: thisMonthEnd,
            profit: thisMonthProfit,
            grossProfit: thisMonthProfit,
            totalExpenses: thisMonthExpenses,
            netProfit: thisMonthNetProfit,
            priorProfit: lastMonthProfit,
            percentageChange: monthPercentageChange,
          },
          dataCompletenessWarning: false,
        },
        bestSellingProducts: bestSellingProductsAgg,
        lowStockAlerts,
        categoryPurchaseTrend,
        recentlySoldProducts: recentlySoldProductsAgg,
        recentlyNewCustomers,
        revenueTrend,
        orderStatusBreakdown,
        seasonalReminder,
      },
    });
  } catch (error) {
    console.error("GET /api/admin/dashboard error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Internal server error." },
      { status: 500 }
    );
  }
}
