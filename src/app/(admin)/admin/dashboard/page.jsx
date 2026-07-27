"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  IndianRupee,
  ShoppingBag, 
  Users, 
  Package, 
  Clock, 
  Sparkles, 
  X, 
  AlertTriangle, 
  ArrowRight, 
  Layers, 
  CheckCircle2, 
  RefreshCw,
  Tag,
  ExternalLink,
  Maximize2,
  Download,
  Receipt,
  PieChart as PieIcon,
  BarChart3
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

// Fixed status badge colors (Untouched and independent of primary brand scale)
const STATUS_COLORS = {
  Confirmed: "#3b82f6",
  Processing: "#8b5cf6",
  Shipped: "#06b6d4",
  Delivered: "#10b981",
  Cancelled: "#f43f5e",
  Returned: "#f59e0b",
};

// Purple Brand Palette for Category Bar Chart
const CATEGORY_COLORS = ["#5B2C8F", "#6B3FA0", "#8A5FC0", "#4A056D", "#B995DE", "#D4B8ED", "#E8C547"];

export default function DashboardPage() {
  const [lowStockThreshold, setLowStockThreshold] = useState(10);
  const [isReminderDismissed, setIsReminderDismissed] = useState(false);
  const [isWarningDismissed, setIsWarningDismissed] = useState(false);

  // Profit breakdown drill-down modal period ("week" | "month" | null)
  const [breakdownModalPeriod, setBreakdownModalPeriod] = useState(null);

  // Main Dashboard Aggregation Query
  const { data, isLoading, isError, error, refetch, isRefetching } = useQuery({
    queryKey: ["adminDashboard", lowStockThreshold],
    queryFn: async () => {
      const res = await axios.get("/api/admin/dashboard", {
        params: { lowStockThreshold },
      });
      return res.data;
    },
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
  });

  // Drill-down Profit Breakdown Query
  const {
    data: breakdownResponse,
    isLoading: isBreakdownLoading,
    isError: isBreakdownError,
    error: breakdownError,
  } = useQuery({
    queryKey: ["adminProfitBreakdown", breakdownModalPeriod],
    queryFn: async () => {
      if (!breakdownModalPeriod) return null;
      const res = await axios.get("/api/admin/dashboard/profit-breakdown", {
        params: { period: breakdownModalPeriod },
      });
      return res.data;
    },
    enabled: !!breakdownModalPeriod,
    staleTime: 30 * 1000,
  });

  const breakdownData = breakdownResponse?.data;

  // Handle Export CSV for Profit Breakdown Modal
  const handleExportBreakdownCsv = (dataToExport) => {
    if (!dataToExport || !dataToExport.breakdown) return;

    const headers = [
      "Product Name",
      "Quantity Sold",
      "Cost Price Per Unit (INR)",
      "Selling Price Per Unit (INR)",
      "Profit Per Item (INR)",
      "Total Sale (INR)",
      "Total Profit (INR)",
    ];

    const rows = dataToExport.breakdown.map((item) => [
      `"${item.productName.replace(/"/g, '""')}"`,
      item.quantitySold,
      item.costPricePerUnit,
      item.pricePerUnit,
      item.profitPerUnit,
      item.totalSale,
      item.totalProfit,
    ]);

    const expenseHeaders = ["Category", "Amount (INR)"];
    const expenseRows = (dataToExport.expenseBreakdown || []).map((exp) => [
      `"${exp.category.replace(/"/g, '""')}"`,
      exp.amount,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [
        `Profit Breakdown Report - ${dataToExport.label} (${dataToExport.dateRangeStr || ""})`,
        "",
        "PRODUCT SALES PROFIT BREAKDOWN",
        headers.join(","),
        ...rows.map((e) => e.join(",")),
        "",
        "OPERATING EXPENSES BREAKDOWN",
        expenseHeaders.join(","),
        ...expenseRows.map((e) => e.join(",")),
        "",
        `Grand Total Sales,${dataToExport.grandTotal?.totalSale || 0}`,
        `Grand Total Gross Profit,${dataToExport.grandTotal?.totalProfit || 0}`,
        `Total Operating Expenses,${dataToExport.grandTotal?.totalExpenses || 0}`,
        `Grand Total Net Profit,${dataToExport.grandTotal?.netProfit || 0}`,
      ].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `Profit_Breakdown_${dataToExport.period}_${new Date().toISOString().split("T")[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
    return (
      <div className="flex h-[70vh] flex-col items-center justify-center space-y-4 px-4">
        <RefreshCw className="h-8 w-8 text-primary-600 animate-spin" />
        <p className="text-zinc-600 text-sm font-medium text-center">Loading executive analytics dashboard...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center space-y-4 text-center px-4">
        <AlertTriangle className="h-10 w-10 text-rose-500" />
        <h2 className="text-lg font-bold text-gray-900">Failed to load dashboard statistics</h2>
        <p className="text-xs text-zinc-500 max-w-md">{error?.message || "Internal server error occurred."}</p>
        <button
          onClick={() => refetch()}
          className="mt-2 px-4 py-2 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-xs font-semibold transition-all cursor-pointer shadow-xs"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  const dashboard = data?.data || {};
  const kpis = dashboard.kpis || { totalRevenue: 0, totalOrders: 0, totalCustomers: 0, totalProducts: 0, pendingFulfillment: 0 };
  const profitLoss = dashboard.profitLoss || {
    thisWeek: { profit: 0, grossProfit: 0, totalExpenses: 0, netProfit: 0, percentageChange: 0, dateRangeStr: "" },
    thisMonth: { profit: 0, grossProfit: 0, totalExpenses: 0, netProfit: 0, percentageChange: 0, dateRangeStr: "" },
  };
  const bestSellingProducts = dashboard.bestSellingProducts || [];
  const lowStockAlerts = dashboard.lowStockAlerts || [];
  const categoryPurchaseTrend = dashboard.categoryPurchaseTrend || [];
  const recentlySoldProducts = dashboard.recentlySoldProducts || [];
  const recentlyNewCustomers = dashboard.recentlyNewCustomers || [];
  const revenueTrend = dashboard.revenueTrend || [];
  const orderStatusBreakdown = dashboard.orderStatusBreakdown || [];
  const seasonalReminder = dashboard.seasonalReminder || null;

  return (
    <div className="w-full space-y-5 sm:space-y-7 pb-12 font-sans text-gray-900 min-h-screen px-1 sm:px-2 md:px-3 overflow-x-hidden">
      
      {/* 1. UNIQUE HAZED PURPLE GRADIENT TOP CONTAINER UI */}
      <div className="hazed-purple-banner p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-3">
            <Sparkles className="h-7 w-7 text-accent shrink-0 animate-pulse" /> Executive Command Center
          </h1>
          <p className="text-sm text-purple-100 font-semibold mt-1 max-w-2xl leading-relaxed">
            Real-time sales performance, profit/loss reconciliation, and inventory analytics for Adarsh Stationery.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <Button
            onClick={() => refetch()}
            variant="outline"
            size="sm"
            disabled={isRefetching}
            className="rounded-xl border-white/40 bg-white/20 text-white hover:bg-white hover:text-primary-800 text-sm font-extrabold px-4 h-10 cursor-pointer shadow-xs btn-modern"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isRefetching ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </Button>
          <Link href="/admin/products">
            <Button
              size="sm"
              className="bg-white text-primary-800 hover:bg-primary-50 font-black rounded-xl text-sm px-4 h-10 shadow-md cursor-pointer btn-modern"
            >
              <Package className="mr-2 h-4 w-4 text-primary-600" />
              <span>Catalog Matrix</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* 2. Seasonal Advisory Banner */}
      {seasonalReminder && !isReminderDismissed && (
        <div className="p-3.5 sm:p-4 rounded-2xl bg-bg-surface border border-accent/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-start gap-3 min-w-0">
            <div className="p-2 rounded-xl bg-accent/20 text-accent shrink-0 mt-0.5">
              <Sparkles className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-accent">Seasonal Advisory</span>
                <span className="text-[10px] text-zinc-600 bg-primary-50 px-2 py-0.5 rounded-md border border-primary-100 font-mono">
                  {seasonalReminder.title}
                </span>
              </div>
              <p className="text-xs text-gray-900 mt-1 leading-relaxed break-words">
                {seasonalReminder.message}
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsReminderDismissed(true)}
            className="self-end sm:self-center p-1.5 rounded-lg text-zinc-400 hover:text-gray-900 hover:bg-primary-50 transition-colors cursor-pointer shrink-0"
            title="Dismiss advisory"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* 3. Top Summary KPI Cards (Colorful Mesh Gradient UI Inspired by Reference) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
        {/* KPI 1: Total Revenue */}
        <div className="p-5 sm:p-6 rounded-[28px] bg-[linear-gradient(135deg,#F4ECFF_0%,#FFD9EC_50%,#FFE4D6_100%)] border border-purple-200/70 space-y-3 relative overflow-hidden transition-all hover:scale-[1.02] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-purple-900">Total Revenue</span>
            <div className="p-2.5 rounded-2xl bg-white/80 border border-white text-purple-700 shadow-2xs">
              <IndianRupee className="h-5 w-5" />
            </div>
          </div>
          <div>
            <h3 className="text-2xl sm:text-3xl xl:text-4xl font-black text-gray-900 tracking-tight font-mono">
              ₹{kpis.totalRevenue.toLocaleString("en-IN")}
            </h3>
            <p className="text-xs text-emerald-700 font-extrabold mt-1">Paid Orders Net</p>
          </div>
        </div>

        {/* KPI 2: Total Orders */}
        <Link href="/admin/orders" className="p-5 sm:p-6 rounded-[28px] bg-[linear-gradient(135deg,#D6F6FF_0%,#E3E8FF_50%,#F3E8FF_100%)] border border-blue-200/70 space-y-3 relative overflow-hidden transition-all hover:scale-[1.02] shadow-xs block">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-blue-900">Total Orders</span>
            <div className="p-2.5 rounded-2xl bg-white/80 border border-white text-blue-700 shadow-2xs">
              <ShoppingBag className="h-5 w-5" />
            </div>
          </div>
          <div>
            <h3 className="text-2xl sm:text-3xl xl:text-4xl font-black text-gray-900 tracking-tight font-mono">
              {kpis.totalOrders}
            </h3>
            <p className="text-xs text-blue-700 font-extrabold mt-1">Lifetime Orders</p>
          </div>
        </Link>

        {/* KPI 3: Total Customers */}
        <Link href="/admin/customers" className="p-5 sm:p-6 rounded-[28px] bg-[linear-gradient(135deg,#ECFDF5_0%,#D1FAE5_50%,#FEF3C7_100%)] border border-emerald-200/70 space-y-3 relative overflow-hidden transition-all hover:scale-[1.02] shadow-xs block">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-emerald-900">Customers</span>
            <div className="p-2.5 rounded-2xl bg-white/80 border border-white text-emerald-700 shadow-2xs">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <div>
            <h3 className="text-2xl sm:text-3xl xl:text-4xl font-black text-gray-900 tracking-tight font-mono">
              {kpis.totalCustomers}
            </h3>
            <p className="text-xs text-emerald-700 font-extrabold mt-1">Registered Profiles</p>
          </div>
        </Link>

        {/* KPI 4: Total Products */}
        <Link href="/admin/products" className="p-5 sm:p-6 rounded-[28px] bg-[linear-gradient(135deg,#F3E8FF_0%,#FEF3C7_50%,#FDE68A_100%)] border border-amber-200/70 space-y-3 relative overflow-hidden transition-all hover:scale-[1.02] shadow-xs block">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-purple-900">Catalog Products</span>
            <div className="p-2.5 rounded-2xl bg-white/80 border border-white text-purple-700 shadow-2xs">
              <Package className="h-5 w-5" />
            </div>
          </div>
          <div>
            <h3 className="text-2xl sm:text-3xl xl:text-4xl font-black text-gray-900 tracking-tight font-mono">
              {kpis.totalProducts}
            </h3>
            <p className="text-xs text-purple-700 font-extrabold mt-1">Active SKUs</p>
          </div>
        </Link>

        {/* KPI 5: Pending Fulfillment */}
        <Link href="/admin/orders" className="p-5 sm:p-6 rounded-[28px] bg-[linear-gradient(135deg,#FEF3C7_0%,#FEE2E2_50%,#FFEDD5_100%)] border border-amber-200/70 space-y-3 relative overflow-hidden transition-all hover:scale-[1.02] shadow-xs block">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-amber-900">Pending Action</span>
            <div className="p-2.5 rounded-2xl bg-white/80 border border-white text-amber-700 shadow-2xs">
              <Clock className="h-5 w-5" />
            </div>
          </div>
          <div>
            <h3 className="text-2xl sm:text-3xl xl:text-4xl font-black text-amber-950 tracking-tight font-mono">
              {kpis.pendingFulfillment}
            </h3>
            <p className="text-xs text-amber-800 font-extrabold mt-1">Confirmed Orders</p>
          </div>
        </Link>
      </div>

      {/* 4. Profit / Loss Summary Card & Revenue Trend Row (Stacked on mobile/tablet, 3 cols on lg) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        
        {/* Profit / Loss Card (1 col) */}
        <div className="p-4 sm:p-6 rounded-2xl bg-bg-surface border border-border-subtle space-y-4 flex flex-col justify-between">
          <div className="border-b border-border-subtle pb-3">
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-primary-600 shrink-0" /> Profit & Loss Analysis
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              Gross and Net profit (after operating expenses). Click to view breakdown.
            </p>
          </div>

          {/* Missing Cost Price Data Warning Notice */}
          {profitLoss?.dataCompletenessWarning && !isWarningDismissed && (
            <div className="p-3 rounded-xl bg-accent/15 border border-accent/40 flex items-start justify-between gap-2 text-xs">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                <span className="text-gray-900 text-[11px] leading-snug">
                  Some older orders missing cost price data are excluded — profit may be understated.
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsWarningDismissed(true)}
                className="text-zinc-600 hover:text-gray-900 shrink-0 p-0.5 cursor-pointer"
                title="Dismiss warning"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {/* This Week */}
            <div 
              onClick={() => setBreakdownModalPeriod("week")}
              className="p-3.5 sm:p-4 rounded-xl bg-bg-page border border-border-subtle hover:border-primary-400 space-y-2.5 cursor-pointer transition-all group relative"
              title="Click to view detailed itemized profit & expense breakdown"
            >
              <div className="flex items-center justify-between">
                <div className="flex flex-col min-w-0">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-600 group-hover:text-primary-600 transition-colors">This Week</span>
                  {profitLoss.thisWeek.dateRangeStr && (
                    <span className="text-[9px] text-zinc-500 font-mono mt-0.5 truncate">({profitLoss.thisWeek.dateRangeStr})</span>
                  )}
                </div>
                <Maximize2 className="h-3.5 w-3.5 text-zinc-400 group-hover:text-primary-600 transition-colors shrink-0" />
              </div>

              {/* Gross Profit */}
              <div>
                <span className="text-[10px] text-zinc-500 uppercase tracking-wider block font-bold">Gross Profit</span>
                <div className="flex items-center gap-2">
                  <h4 className="text-base sm:text-lg font-extrabold text-gray-900">
                    ₹{profitLoss.thisWeek.profit.toLocaleString("en-IN")}
                  </h4>
                  <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold border ${
                    profitLoss.thisWeek.percentageChange >= 0
                      ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                      : "bg-rose-500/10 text-rose-600 border-rose-500/20"
                  }`}>
                    {profitLoss.thisWeek.percentageChange >= 0 ? (
                      <TrendingUp className="h-3 w-3 mr-0.5" />
                    ) : (
                      <TrendingDown className="h-3 w-3 mr-0.5" />
                    )}
                    {Math.abs(profitLoss.thisWeek.percentageChange)}%
                  </span>
                </div>
              </div>

              {/* Net Profit (after expenses) */}
              <div className="border-t border-border-subtle pt-2 space-y-0.5">
                <span className="text-[10px] text-emerald-600 uppercase tracking-wider block font-bold">Net Profit (after exp)</span>
                <h4 className={`text-sm sm:text-base font-bold font-mono ${profitLoss.thisWeek.netProfit >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                  ₹{profitLoss.thisWeek.netProfit.toLocaleString("en-IN")}
                </h4>
              </div>
            </div>

            {/* This Month */}
            <div 
              onClick={() => setBreakdownModalPeriod("month")}
              className="p-3.5 sm:p-4 rounded-xl bg-bg-page border border-border-subtle hover:border-primary-400 space-y-2.5 cursor-pointer transition-all group relative"
              title="Click to view detailed itemized profit & expense breakdown"
            >
              <div className="flex items-center justify-between">
                <div className="flex flex-col min-w-0">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-600 group-hover:text-primary-600 transition-colors">This Month</span>
                  {profitLoss.thisMonth.dateRangeStr && (
                    <span className="text-[9px] text-zinc-500 font-mono mt-0.5 truncate">({profitLoss.thisMonth.dateRangeStr})</span>
                  )}
                </div>
                <Maximize2 className="h-3.5 w-3.5 text-zinc-400 group-hover:text-primary-600 transition-colors shrink-0" />
              </div>

              {/* Gross Profit */}
              <div>
                <span className="text-[10px] text-zinc-500 uppercase tracking-wider block font-bold">Gross Profit</span>
                <div className="flex items-center gap-2">
                  <h4 className="text-base sm:text-lg font-extrabold text-gray-900">
                    ₹{profitLoss.thisMonth.profit.toLocaleString("en-IN")}
                  </h4>
                  <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold border ${
                    profitLoss.thisMonth.percentageChange >= 0
                      ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                      : "bg-rose-500/10 text-rose-600 border-rose-500/20"
                  }`}>
                    {profitLoss.thisMonth.percentageChange >= 0 ? (
                      <TrendingUp className="h-3 w-3 mr-0.5" />
                    ) : (
                      <TrendingDown className="h-3 w-3 mr-0.5" />
                    )}
                    {Math.abs(profitLoss.thisMonth.percentageChange)}%
                  </span>
                </div>
              </div>

              {/* Net Profit (after expenses) */}
              <div className="border-t border-border-subtle pt-2 space-y-0.5">
                <span className="text-[10px] text-emerald-600 uppercase tracking-wider block font-bold">Net Profit (after exp)</span>
                <h4 className={`text-sm sm:text-base font-bold font-mono ${profitLoss.thisMonth.netProfit >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                  ₹{profitLoss.thisMonth.netProfit.toLocaleString("en-IN")}
                </h4>
              </div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-primary-50 border border-primary-100 text-[11px] text-zinc-600 leading-relaxed">
            <span className="text-gray-900 font-semibold">Margin Insight:</span> Click cards above for full itemized product & expense breakdown.
          </div>
        </div>

        {/* Revenue Trend Chart (2 cols on lg, full width on mobile/tablet) */}
        <div className="lg:col-span-2 p-4 sm:p-6 rounded-2xl bg-bg-surface border border-border-subtle space-y-4">
          <div className="flex items-center justify-between border-b border-border-subtle pb-3">
            <div>
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary-600 shrink-0" /> Revenue Trend (Last 30 Days)
              </h2>
              <p className="text-xs text-zinc-500 mt-0.5">Daily aggregate revenue from completed transactions.</p>
            </div>
          </div>

          <div className="h-56 sm:h-64 w-full pt-2">
            {revenueTrend.some(r => r.revenue > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6B3FA0" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#6B3FA0" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" stroke="#8A5FC0" fontSize={10} tickLine={false} minTickGap={15} />
                  <YAxis stroke="#8A5FC0" fontSize={10} tickLine={false} tickFormatter={(v) => `₹${v}`} />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-bg-surface border border-border-subtle p-2.5 rounded-xl shadow-lg text-xs font-mono">
                            <p className="font-bold text-gray-900 mb-1">{label}</p>
                            <p className="text-primary-600 font-semibold">Revenue: ₹{payload[0].value.toLocaleString("en-IN")}</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#6B3FA0" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-zinc-500">
                No revenue recorded in the last 30 days.
              </div>
            )}
          </div>
        </div>

      </div>

      {/* 5. Category Purchase Trend & Order Status Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Category Purchase Trend (2 cols on lg) */}
        <div className="lg:col-span-2 p-4 sm:p-6 rounded-2xl bg-bg-surface border border-border-subtle space-y-4">
          <div className="flex items-center justify-between border-b border-border-subtle pb-3">
            <div>
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-primary-600 shrink-0" /> Category-wise Purchase Trend (30 Days)
              </h2>
              <p className="text-xs text-zinc-500 mt-0.5">Top product categories by volume of units sold.</p>
            </div>
          </div>

          <div className="h-56 sm:h-64 w-full pt-2">
            {categoryPurchaseTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryPurchaseTrend} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <XAxis dataKey="categoryName" stroke="#8A5FC0" fontSize={10} tickLine={false} minTickGap={10} />
                  <YAxis stroke="#8A5FC0" fontSize={10} tickLine={false} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-bg-surface border border-border-subtle p-2.5 rounded-xl shadow-lg text-xs">
                            <p className="font-bold text-gray-900">{data.categoryName}</p>
                            <p className="text-primary-600 font-semibold">{data.totalQuantitySold} units sold</p>
                            <p className="text-zinc-500 text-[11px]">Revenue: ₹{data.totalRevenue?.toLocaleString("en-IN")}</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="totalQuantitySold" radius={[6, 6, 0, 0]}>
                    {categoryPurchaseTrend.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-zinc-500">
                No category purchase data recorded.
              </div>
            )}
          </div>
        </div>

        {/* Order Status Breakdown Pie Chart (1 col) */}
        <div className="p-4 sm:p-6 rounded-2xl bg-bg-surface border border-border-subtle space-y-4">
          <div className="border-b border-border-subtle pb-3">
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <PieIcon className="h-4 w-4 text-primary-600 shrink-0" /> Order Status Distribution
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">Breakdown of orders across fulfillment states.</p>
          </div>

          <div className="h-44 sm:h-48 w-full">
            {orderStatusBreakdown.some(s => s.count > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={orderStatusBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={65}
                    paddingAngle={3}
                    dataKey="count"
                    nameKey="status"
                  >
                    {orderStatusBreakdown.map((entry) => (
                      <Cell key={entry.status} fill={STATUS_COLORS[entry.status] || "#8A5FC0"} />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-bg-surface border border-border-subtle p-2 rounded-xl shadow-lg text-xs">
                            <span className="font-bold text-gray-900">{payload[0].name}: </span>
                            <span className="text-primary-600 font-bold">{payload[0].value} orders</span>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-zinc-500">
                No order status data populated.
              </div>
            )}
          </div>

          {/* Status Badges Legend (Preserving Fixed Status Colors) */}
          <div className="grid grid-cols-2 gap-1.5 pt-1 text-[11px]">
            {orderStatusBreakdown.map((item) => (
              <div key={item.status} className="flex items-center justify-between p-1.5 rounded-lg bg-bg-page border border-border-subtle">
                <span className="flex items-center gap-1.5 text-gray-900 font-medium truncate pr-1">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: STATUS_COLORS[item.status] || "#8A5FC0" }} />
                  <span className="truncate">{item.status}</span>
                </span>
                <span className="font-mono font-bold text-zinc-600 shrink-0">{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 6. Best-Selling Products & Low Stock Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        
        {/* Best-Selling Products Card */}
        <div className="p-4 sm:p-6 rounded-2xl bg-bg-surface border border-border-subtle space-y-4">
          <div className="flex items-center justify-between border-b border-border-subtle pb-3">
            <div>
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Tag className="h-4 w-4 text-emerald-600 shrink-0" /> Best-Selling Products
              </h2>
              <p className="text-xs text-zinc-500 mt-0.5">Top products ranked by units sold.</p>
            </div>
            <Link href="/admin/products" className="text-xs text-primary-600 hover:text-primary-700 font-semibold flex items-center gap-1 shrink-0">
              Catalog <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="space-y-2.5">
            {bestSellingProducts.length > 0 ? (
              bestSellingProducts.map((prod) => (
                <Link
                  key={prod.id}
                  href="/admin/products"
                  className="flex items-center justify-between p-3 rounded-xl bg-bg-page border border-border-subtle hover:border-primary-300 transition-colors group"
                >
                  <div className="flex items-center gap-3 min-w-0 pr-2">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-bg-surface border border-border-subtle overflow-hidden shrink-0 flex items-center justify-center">
                      {prod.thumbnail ? (
                        <img src={prod.thumbnail} alt={prod.name} className="w-full h-full object-cover" />
                      ) : (
                        <Package className="w-4 h-4 sm:w-5 sm:h-5 text-zinc-400" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-gray-900 truncate group-hover:text-primary-600 transition-colors">
                        {prod.name}
                      </h4>
                      <p className="text-[10px] text-zinc-500 font-mono">
                        ₹{prod.revenue.toLocaleString("en-IN")} revenue
                      </p>
                    </div>
                  </div>

                  <span className="px-2.5 py-1 rounded-xl bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 text-xs font-bold shrink-0">
                    {prod.quantitySold} sold
                  </span>
                </Link>
              ))
            ) : (
              <p className="text-xs text-zinc-500 text-center py-6">No best-selling product data available.</p>
            )}
          </div>
        </div>

        {/* Low Stock Inventory Alerts Card */}
        <div className="p-4 sm:p-6 rounded-2xl bg-bg-surface border border-border-subtle space-y-4">
          <div className="flex items-center justify-between border-b border-border-subtle pb-3">
            <div>
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-rose-500 shrink-0" /> Low Stock Inventory Alerts
              </h2>
              <p className="text-xs text-zinc-500 mt-0.5">Products running below safety stock levels.</p>
            </div>
            <Link href="/admin/inventory" className="text-xs text-primary-600 hover:text-primary-700 font-semibold flex items-center gap-1 shrink-0">
              Restock <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="space-y-2.5">
            {lowStockAlerts.length > 0 ? (
              lowStockAlerts.map((prod) => {
                const isCritical = prod.stock <= 3;
                return (
                  <div
                    key={prod.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-bg-page border border-border-subtle space-x-2 sm:space-x-3"
                  >
                    <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 pr-1">
                      <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border uppercase tracking-wider shrink-0 ${
                        isCritical
                          ? "bg-rose-500/10 text-rose-600 border-rose-500/20"
                          : "bg-accent/20 text-accent border-accent/40"
                      }`}>
                        {prod.stock} Left
                      </span>
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-gray-900 truncate">{prod.name}</h4>
                        <p className="text-[10px] text-zinc-500">₹{prod.sellingPrice}</p>
                      </div>
                    </div>

                    <Link
                      href="/admin/inventory"
                      className="px-2.5 py-1.5 rounded-lg bg-primary-600 hover:bg-primary-700 text-white text-xs font-semibold shadow-xs transition-colors shrink-0 flex items-center gap-1 cursor-pointer"
                    >
                      <span>Restock</span>
                      <ExternalLink className="h-3 w-3 text-white" />
                    </Link>
                  </div>
                );
              })
            ) : (
              <div className="flex flex-col items-center justify-center text-center py-8 text-zinc-500 space-y-1">
                <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                <p className="text-xs">All inventory stock levels are healthy.</p>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* 7. Recently Sold Products & Recently Acquired Customers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">

        {/* Recently Sold Products Card (Custom #9B66D4 to #D8A5E9 Gradient UI) */}
        <div className="p-5 sm:p-6 rounded-[28px] bg-[linear-gradient(135deg,#9B66D4_0%,#B882E4_50%,#D8A5E9_100%)] text-[#2E0B52] shadow-md space-y-4 border border-purple-300/40">
          <div className="flex items-center justify-between border-b border-purple-900/15 pb-3">
            <div>
              <h2 className="text-lg sm:text-xl font-black text-[#2E0B52] flex items-center gap-2.5">
                <Clock className="h-5 w-5 text-[#3B1260] shrink-0" /> Recently Sold Items
              </h2>
              <p className="text-xs text-[#4A1D7A] mt-0.5 font-extrabold">Latest item transactions from completed orders.</p>
            </div>
            <Link href="/admin/orders" className="text-xs text-[#2E0B52] hover:text-black font-black flex items-center gap-1 shrink-0 bg-white/80 hover:bg-white px-3.5 py-1.5 rounded-full border border-white/80 transition-colors shadow-2xs">
              Orders <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="space-y-2.5">
            {recentlySoldProducts.length > 0 ? (
              recentlySoldProducts.map((item, idx) => (
                <div
                  key={`${item.orderId}-${idx}`}
                  className="flex items-center justify-between p-3.5 sm:p-4 rounded-2xl bg-white/80 backdrop-blur-xl border border-white/90 text-[#2E0B52] shadow-2xs hover:bg-white transition-all"
                >
                  <div className="min-w-0 pr-3">
                    <h4 className="font-black text-[#2E0B52] truncate text-sm sm:text-base tracking-tight">{item.productName}</h4>
                    <p className="text-xs text-[#5C2B90] mt-0.5 truncate font-semibold">
                      Buyer: <span className="text-[#2E0B52] font-black">{item.customerName}</span> • {new Date(item.date).toLocaleDateString("en-IN")}
                    </p>
                  </div>

                  <div className="text-right shrink-0 flex flex-col items-end gap-1">
                    <span className="text-xs font-black text-[#3B1260] bg-purple-100/90 px-2.5 py-0.5 rounded-md border border-purple-200">{item.quantity} qty</span>
                    <p className="text-sm sm:text-base font-black font-mono text-[#2E0B52] bg-white px-3 py-1 rounded-xl border border-purple-200/80 shadow-2xs">
                      ₹{item.subtotal}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-[#4A1D7A] font-extrabold text-center py-6">No recent sales records.</p>
            )}
          </div>
        </div>

        {/* Recently New Customers Card */}
        <div className="p-4 sm:p-6 rounded-2xl bg-bg-surface border border-border-subtle space-y-4">
          <div className="flex items-center justify-between border-b border-border-subtle pb-3">
            <div>
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Users className="h-4 w-4 text-primary-600 shrink-0" /> Recently Acquired Customers
              </h2>
              <p className="text-xs text-zinc-500 mt-0.5">New buyer accounts registered in store.</p>
            </div>
            <Link href="/admin/customers" className="text-xs text-primary-600 hover:text-primary-700 font-semibold flex items-center gap-1 shrink-0">
              Customers <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="space-y-2">
            {recentlyNewCustomers.length > 0 ? (
              recentlyNewCustomers.map((cust) => (
                <div
                  key={cust.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-bg-page border border-border-subtle text-xs"
                >
                  <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 pr-2">
                    <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
                      {cust.name[0].toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-semibold text-gray-900 truncate">{cust.name}</h4>
                      <p className="text-[10px] text-zinc-500 font-mono mt-0.5">{cust.phone}</p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-primary-50 text-primary-700 border border-primary-200 font-bold">
                      {cust.orderCount} Orders
                    </span>
                    <p className="text-[10px] text-zinc-500 mt-0.5">
                      Joined {new Date(cust.firstOrderDate).toLocaleDateString("en-IN")}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-zinc-500 text-center py-6">No customer records found.</p>
            )}
          </div>
        </div>

      </div>

      {/* PROFIT & EXPENSE BREAKDOWN DRILL-DOWN ANALYTICS WORKBENCH MODAL */}
      <Dialog open={!!breakdownModalPeriod} onOpenChange={(open) => !open && setBreakdownModalPeriod(null)}>
        <DialogContent className="bg-bg-surface border border-border-subtle text-gray-900 rounded-2xl w-[95vw] max-w-7xl xl:max-w-[1300px] h-[90vh] max-h-[90vh] p-0 flex flex-col shadow-2xl overflow-hidden font-sans">
          {/* 1. PROFESSIONAL STICKY TOP HEADER */}
          <div className="border-b border-border-subtle p-4 sm:p-6 shrink-0 bg-primary-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 z-20">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-primary-100 border border-primary-200 text-primary-600 flex items-center justify-center shrink-0 mt-0.5">
                <DollarSign className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <DialogTitle className="text-base sm:text-xl font-extrabold text-gray-900 tracking-tight leading-snug">
                    Net Profit Breakdown — {breakdownData?.label || (breakdownModalPeriod === "month" ? "This Month" : "This Week")}
                  </DialogTitle>
                  {breakdownData?.dateRangeStr && (
                    <span className="text-xs font-mono font-medium text-primary-700 bg-bg-surface border border-primary-200 px-2.5 py-0.5 rounded-lg">
                      {breakdownData.dateRangeStr}
                    </span>
                  )}
                </div>
                <p className="text-xs text-zinc-500 mt-0.5 sm:mt-1">
                  Itemized product profit margins and operating expenses.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              {breakdownData?.breakdown?.length > 0 && (
                <Button
                  onClick={() => handleExportBreakdownCsv(breakdownData)}
                  className="bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl px-3.5 h-8 sm:h-9 text-xs flex items-center gap-2 cursor-pointer shadow-xs"
                >
                  <Download className="w-4 h-4 text-white" /> Export CSV
                </Button>
              )}
            </div>
          </div>

          {/* 2. SCROLLABLE FINANCIAL TABLE AREA */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar min-h-0 bg-bg-surface space-y-6 sm:space-y-8">
            {isBreakdownLoading ? (
              <div className="py-24 text-center text-zinc-500 text-xs font-medium space-y-3">
                <RefreshCw className="h-7 w-7 text-primary-600 animate-spin mx-auto" />
                <p className="text-gray-900 text-sm font-semibold">Calculating itemized profit margins and expenses...</p>
              </div>
            ) : breakdownError || !breakdownData ? (
              <div className="py-16 text-center text-rose-500 text-xs space-y-2">
                <AlertTriangle className="h-8 w-8 text-rose-500 mx-auto" />
                <p className="font-semibold text-sm">Failed to load profit breakdown data.</p>
                <p className="text-zinc-500">Please close and reopen the analytics report.</p>
              </div>
            ) : (
              <>
                {/* SECTION A: PRODUCT PROFIT BREAKDOWN */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-primary-700 flex items-center gap-2">
                    <Package className="w-4 h-4 text-primary-600" /> 1. Product Sales & Gross Profit
                  </h3>
                  {breakdownData.breakdown.length === 0 ? (
                    <div className="py-8 text-center text-zinc-500 text-xs border border-dashed border-border-subtle rounded-xl">
                      No product sales recorded in this period.
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-xl border border-border-subtle bg-bg-surface shadow-xs">
                      <Table className="w-full text-xs">
                        <TableHeader className="bg-primary-50/80 sticky top-0 z-10 border-b border-border-subtle">
                          <TableRow className="border-b border-border-subtle uppercase tracking-wider text-[11px] text-zinc-600 hover:bg-transparent">
                            <TableHead className="font-bold py-3 text-zinc-700 text-left min-w-[200px]">Product</TableHead>
                            <TableHead className="font-bold py-3 text-zinc-700 text-center w-[80px]">Qty</TableHead>
                            <TableHead className="font-bold py-3 text-zinc-700 text-right w-[100px]">Cost</TableHead>
                            <TableHead className="font-bold py-3 text-zinc-700 text-right w-[110px]">Selling</TableHead>
                            <TableHead className="font-bold py-3 text-zinc-700 text-right w-[110px]">Profit/Item</TableHead>
                            <TableHead className="font-bold py-3 text-zinc-700 text-right w-[130px]">Total Sale</TableHead>
                            <TableHead className="font-bold py-3 text-zinc-700 text-right w-[130px]">Total Profit</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {breakdownData.breakdown.map((item, idx) => (
                            <TableRow 
                              key={idx} 
                              className={`border-b border-border-subtle transition-colors ${idx % 2 === 1 ? "bg-bg-page" : "bg-transparent"} hover:bg-primary-50/50`}
                            >
                              <TableCell className="py-3 text-left font-sans min-w-[200px]">
                                <div className="flex flex-col">
                                  <span className="font-bold text-gray-900 capitalize text-xs">{item.productName}</span>
                                  {item.hasPriceVariation && (
                                    <span className="text-[10px] text-accent font-semibold italic mt-0.5">
                                      (price changed mid-period)
                                    </span>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="text-center font-mono py-3 text-gray-900 w-[80px] font-bold text-xs">
                                {item.quantitySold}
                              </TableCell>
                              <TableCell className="text-right font-mono py-3 text-zinc-600 w-[100px] text-xs">
                                ₹{item.costPricePerUnit}
                              </TableCell>
                              <TableCell className="text-right font-mono py-3 text-gray-900 font-semibold w-[110px] text-xs">
                                ₹{item.pricePerUnit}
                              </TableCell>
                              <TableCell className="text-right font-mono py-3 w-[110px]">
                                <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-bold border ${
                                  item.profitPerUnit >= 0 
                                    ? "text-emerald-600 bg-emerald-500/10 border-emerald-500/25" 
                                    : "text-rose-600 bg-rose-500/10 border-rose-500/25"
                                }`}>
                                  ₹{item.profitPerUnit}
                                </span>
                              </TableCell>
                              <TableCell className="text-right font-mono py-3 text-gray-900 font-bold w-[130px] text-xs">
                                ₹{item.totalSale.toLocaleString("en-IN")}
                              </TableCell>
                              <TableCell className="text-right font-mono py-3 text-emerald-600 font-extrabold w-[130px] text-xs">
                                ₹{item.totalProfit.toLocaleString("en-IN")}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>

                {/* SECTION B: OPERATING EXPENSES BREAKDOWN */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-primary-700 flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-rose-500" /> 2. Operating Expenses ({breakdownData.label})
                  </h3>
                  {!breakdownData.expenseBreakdown || breakdownData.expenseBreakdown.length === 0 ? (
                    <div className="py-6 text-center text-zinc-500 text-xs border border-dashed border-border-subtle rounded-xl">
                      No operating expenses recorded for this period.
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-xl border border-border-subtle bg-bg-surface shadow-xs">
                      <Table className="w-full text-xs">
                        <TableHeader className="bg-primary-50/80 border-b border-border-subtle">
                          <TableRow className="border-b border-border-subtle uppercase tracking-wider text-[11px] text-zinc-600 hover:bg-transparent">
                            <TableHead className="font-bold py-3 text-zinc-700 text-left">Expense Category</TableHead>
                            <TableHead className="font-bold py-3 text-zinc-700 text-right w-40">Period Amount</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {breakdownData.expenseBreakdown.map((exp, idx) => (
                            <TableRow key={idx} className="border-b border-border-subtle hover:bg-primary-50/50 transition-colors">
                              <TableCell className="py-3 font-bold text-gray-900 capitalize">
                                {exp.category}
                              </TableCell>
                              <TableCell className="py-3 text-right font-mono font-bold text-rose-600 text-xs">
                                ₹{exp.amount.toLocaleString("en-IN")}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* 3. STICKY SUMMARY FOOTER (NET PROFIT RECONCILIATION) */}
          {breakdownData && (() => {
            const grandTotalSale = breakdownData.grandTotal?.totalSale || 0;
            const grandTotalProfit = breakdownData.grandTotal?.totalProfit || 0;
            const totalExpenses = breakdownData.grandTotal?.totalExpenses || 0;
            const netProfit = breakdownData.grandTotal?.netProfit || (grandTotalProfit - totalExpenses);

            return (
              <div className="border-t border-border-subtle bg-primary-50/90 p-4 sm:p-5 shrink-0 z-20 shadow-lg">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 items-center">
                  <div className="bg-bg-surface border border-border-subtle p-3 rounded-xl">
                    <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold block">Gross Sales</span>
                    <span className="font-mono text-base font-bold text-gray-900">₹{grandTotalSale.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="bg-bg-surface border border-border-subtle p-3 rounded-xl">
                    <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold block">Gross Profit</span>
                    <span className="font-mono text-base font-bold text-gray-900">
                      ₹{grandTotalProfit.toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div className="bg-rose-500/10 border border-rose-500/20 p-3 rounded-xl">
                    <span className="text-[10px] text-rose-600 uppercase tracking-wider font-bold block">Total Operating Expenses</span>
                    <span className="font-mono text-base font-bold text-rose-600">
                      ₹{totalExpenses.toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div className={`border p-3 rounded-xl ${netProfit >= 0 ? "bg-emerald-500/10 border-emerald-500/30" : "bg-rose-500/10 border-rose-500/30"}`}>
                    <span className={`text-[10px] uppercase tracking-wider font-bold block ${netProfit >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                      Grand Net Profit
                    </span>
                    <span className={`font-mono text-xl font-extrabold ${netProfit >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                      ₹{netProfit.toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

    </div>
  );
}
