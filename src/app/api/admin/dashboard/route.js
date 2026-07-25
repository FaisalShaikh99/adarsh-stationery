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

    // 1. Explicit Date Ranges
    // "This Week": rolling last-7-days window ending now
    const thisWeekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thisWeekEnd = now;

    // Prior Week: rolling 7 days preceding thisWeekStart
    const priorWeekStart = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    const priorWeekEnd = thisWeekStart;

    // "This Month": current calendar month to date (starts on 1st of month)
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    const thisMonthEnd = now;

    // Prior Month: previous calendar month
    const priorMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
    const priorMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

    // 30 days for revenue trend & category purchase trend
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
          $match: {
            "items.costPricePerUnit": { $exists: true, $ne: null },
          },
        },
        {
          $group: {
            _id: null,
            profit: {
              $sum: {
                $multiply: [
                  {
                    $subtract: [
                      "$items.pricePerUnit",
                      "$items.costPricePerUnit",
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

    // Helper for expense calculation for a date range
    const getExpenseForPeriod = async (startDate, endDate, isWeek) => {
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
    };

    // Check data completeness
    const missingCostAgg = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: thisMonthStart, $lt: now },
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
          $or: [
            { "items.costPricePerUnit": { $exists: false } },
            { "items.costPricePerUnit": null },
          ],
        },
      },
      { $limit: 1 },
    ]);

    const dataCompletenessWarning = missingCostAgg.length > 0;

    // 2. Profit / Loss Summary & Expenses
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

    const weekPercentageChange =
      lastWeekProfit > 0
        ? Number(
            (((thisWeekProfit - lastWeekProfit) / lastWeekProfit) * 100).toFixed(1)
          )
        : thisWeekProfit > 0
        ? 100
        : 0;

    const monthPercentageChange =
      lastMonthProfit > 0
        ? Number(
            (
              ((thisMonthProfit - lastMonthProfit) / lastMonthProfit) * 100
            ).toFixed(1)
          )
        : thisMonthProfit > 0
        ? 100
        : 0;

    // 3. Best-selling products
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

    // 4. Low stock alerts
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

    // 5. Category-wise purchase trend
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

    // 6. Recently sold products
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

    // 7. Recently new customers
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

    // 8. Revenue trend
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
        date: dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
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
          dataCompletenessWarning,
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
