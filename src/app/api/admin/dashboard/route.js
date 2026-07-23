import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { dbConnect } from "@/lib/dbConnect";
import Order, { ORDER_STATUSES } from "@/models/order.model";
import Product from "@/models/product.model";
import Customer from "@/models/customer.model";
import { Category } from "@/models/category.model";
import Payment from "@/models/payment.model";
import { getCurrentSeasonalReminder } from "@/lib/seasonalReminders";

export const dynamic = "force-dynamic";

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
    const d7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const d14 = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    const d30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const d60 = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    // 1. Top KPI numbers
    const [
      paidOrdersRevenueAgg,
      totalOrders,
      totalCustomers,
      totalProducts,
      pendingFulfillment,
    ] = await Promise.all([
      Order.aggregate([
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
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: "$totalAmount" },
          },
        },
      ]),
      Order.countDocuments({}),
      Customer.countDocuments({}),
      Product.countDocuments({}),
      Order.countDocuments({ status: "Confirmed" }),
    ]);

    const totalRevenue = paidOrdersRevenueAgg[0]?.totalRevenue || 0;

    // Helper for profit calculation across paid orders in a date range
    const getProfitForPeriod = async (startDate, endDate) => {
      const res = await Order.aggregate([
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
          $group: {
            _id: null,
            profit: {
              $sum: {
                $multiply: [
                  {
                    $subtract: [
                      "$items.pricePerUnit",
                      { $ifNull: ["$items.costPricePerUnit", 0] },
                    ],
                  },
                  "$items.quantity",
                ],
              },
            },
          },
        },
      ]);
      return res[0]?.profit || 0;
    };

    // 2. Profit / Loss Summary
    const [thisWeekProfit, lastWeekProfit, thisMonthProfit, lastMonthProfit] =
      await Promise.all([
        getProfitForPeriod(d7, now),
        getProfitForPeriod(d14, d7),
        getProfitForPeriod(d30, now),
        getProfitForPeriod(d60, d30),
      ]);

    const weekPercentageChange =
      lastWeekProfit > 0
        ? Number(
            (((thisWeekProfit - lastWeekProfit) / lastWeekProfit) * 100).toFixed(
              1
            )
          )
        : thisWeekProfit > 0
        ? 100
        : 0;

    const monthPercentageChange =
      lastMonthProfit > 0
        ? Number(
            (
              ((thisMonthProfit - lastMonthProfit) / lastMonthProfit) *
              100
            ).toFixed(1)
          )
        : thisMonthProfit > 0
        ? 100
        : 0;

    // 3. Best-selling products (top 5 by quantity sold in Paid orders)
    const bestSellingProductsAgg = await Order.aggregate([
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
        $group: {
          _id: "$items.product",
          name: { $first: "$items.productName" },
          quantitySold: { $sum: "$items.quantity" },
          revenue: { $sum: "$items.subtotal" },
        },
      },
      { $sort: { quantitySold: -1 } },
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
          id: "$_id",
          name: 1,
          quantitySold: 1,
          revenue: 1,
          thumbnail: {
            $arrayElemAt: [{ $arrayElemAt: ["$productDoc.images", 0] }, 0],
          },
        },
      },
    ]);

    // 4. Low stock alerts (products with stock <= threshold)
    const lowStockProducts = await Product.find({
      stock: { $lte: lowStockThreshold },
    })
      .sort({ stock: 1 })
      .limit(10)
      .select("_id name stock stockUnit sellingPrice costPrice images")
      .lean();

    const lowStockAlerts = lowStockProducts.map((p) => ({
      id: p._id,
      name: p.name,
      stock: p.stock,
      stockUnit: p.stockUnit || "Pcs",
      sellingPrice: p.sellingPrice,
      costPrice: p.costPrice,
      thumbnail: p.images?.[0] || "",
    }));

    // 5. Category-wise purchase trend (last 30 days)
    const categoryPurchaseTrend = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: d30 },
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
        $lookup: {
          from: "products",
          localField: "items.product",
          foreignField: "_id",
          as: "productDoc",
        },
      },
      { $unwind: "$productDoc" },
      {
        $lookup: {
          from: "categories",
          localField: "productDoc.category",
          foreignField: "_id",
          as: "categoryDoc",
        },
      },
      { $unwind: "$categoryDoc" },
      {
        $group: {
          _id: "$categoryDoc._id",
          categoryName: { $first: "$categoryDoc.name" },
          totalQuantitySold: { $sum: "$items.quantity" },
          totalRevenue: { $sum: "$items.subtotal" },
        },
      },
      { $sort: { totalQuantitySold: -1 } },
    ]);

    // 6. Recently sold products (last 8 items in Paid orders)
    const recentlySoldProductsAgg = await Order.aggregate([
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
      { $sort: { createdAt: -1 } },
      { $limit: 10 },
      { $unwind: "$items" },
      {
        $lookup: {
          from: "customers",
          localField: "customer",
          foreignField: "_id",
          as: "customerDoc",
        },
      },
      {
        $project: {
          orderId: "$_id",
          orderNumber: "$orderNumber",
          productName: "$items.productName",
          quantity: "$items.quantity",
          pricePerUnit: "$items.pricePerUnit",
          subtotal: "$items.subtotal",
          customerName: {
            $ifNull: [
              { $arrayElemAt: ["$customerDoc.name", 0] },
              "$shippingAddress.name",
            ],
          },
          date: "$createdAt",
        },
      },
      { $limit: 8 },
    ]);

    // 7. Recently new customers (last 8 Customer documents sorted by firstOrderDate/createdAt descending)
    const rawCustomers = await Customer.find()
      .sort({ firstOrderDate: -1, createdAt: -1 })
      .limit(8)
      .select("_id name phone email firstOrderDate orderCount totalSpent")
      .lean();

    const recentlyNewCustomers = rawCustomers.map((c) => ({
      id: c._id,
      name: c.name,
      phone: c.phone,
      email: c.email || "",
      firstOrderDate: c.firstOrderDate || c.createdAt,
      orderCount: c.orderCount || 0,
      totalSpent: c.totalSpent || 0,
    }));

    // 8. Revenue trend (daily revenue for last 30 days)
    const dailyRevenueAgg = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: d30 },
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
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          revenue: { $sum: "$totalAmount" },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const revMap = {};
    dailyRevenueAgg.forEach((item) => {
      revMap[item._id] = item.revenue;
    });

    const revenueTrend = [];
    for (let i = 29; i >= 0; i--) {
      const dateObj = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = dateObj.toISOString().split("T")[0];
      revenueTrend.push({
        date: dateStr,
        revenue: revMap[dateStr] || 0,
      });
    }

    // 9. Order status breakdown
    const orderStatusAgg = await Order.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    const orderStatusBreakdown = ORDER_STATUSES.map((st) => {
      const found = orderStatusAgg.find((item) => item._id === st);
      return {
        status: st,
        count: found ? found.count : 0,
      };
    });

    // 10. Seasonal reminder rule
    const seasonalReminder = getCurrentSeasonalReminder(now);

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
            profit: thisWeekProfit,
            priorProfit: lastWeekProfit,
            percentageChange: weekPercentageChange,
          },
          thisMonth: {
            label: "This Month",
            profit: thisMonthProfit,
            priorProfit: lastMonthProfit,
            percentageChange: monthPercentageChange,
          },
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
