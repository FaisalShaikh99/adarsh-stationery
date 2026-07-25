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
  Legend,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

const STATUS_COLORS = {
  Confirmed: "#3b82f6",
  Processing: "#8b5cf6",
  Shipped: "#06b6d4",
  Delivered: "#10b981",
  Cancelled: "#f43f5e",
  Returned: "#f59e0b",
};

const CATEGORY_COLORS = ["#10b981", "#3b82f6", "#8b5cf6", "#f59e0b", "#ec4899", "#06b6d4", "#f43f5e"];

function formatCurrency(val) {
  return `₹${Number(val || 0).toLocaleString("en-IN")}`;
}

export default function DashboardPage() {
  const [lowStockThreshold, setLowStockThreshold] = useState(10);
  const [isReminderDismissed, setIsReminderDismissed] = useState(false);
  const [isWarningDismissed, setIsWarningDismissed] = useState(false);

  // Profit breakdown drill-down modal period ("week" | "month" | null)
  const [breakdownModalPeriod, setBreakdownModalPeriod] = useState(null);

  // Main Dashboard Aggregation Query
  const { data, isLoading, isError, error, refetch } = useQuery({
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
      <div className="flex h-[70vh] flex-col items-center justify-center space-y-4">
        <RefreshCw className="h-8 w-8 text-emerald-400 animate-spin" />
        <p className="text-zinc-400 text-sm font-medium">Loading executive analytics dashboard...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center space-y-4 text-center">
        <AlertTriangle className="h-10 w-10 text-rose-500" />
        <h2 className="text-lg font-bold text-white">Failed to load dashboard statistics</h2>
        <p className="text-xs text-zinc-400 max-w-md">{error?.message || "Internal server error occurred."}</p>
        <button
          onClick={() => refetch()}
          className="mt-2 px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold transition-all cursor-pointer"
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
    <div className="mx-auto w-full max-w-7xl space-y-6 pb-12 font-sans">
      
      {/* 1. Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-emerald-400" /> Executive Analytics & Command Center
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Real-time business performance metrics, profit/loss analysis, and inventory intelligence.
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 text-xs font-medium transition-colors cursor-pointer"
        >
          <RefreshCw className="h-3.5 w-3.5 text-blue-400" />
          <span>Refresh Analytics</span>
        </button>
      </div>

      {/* 2. Seasonal Reminder Banner */}
      {seasonalReminder && !isReminderDismissed && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-indigo-500/10 to-blue-500/10 border border-amber-500/30 flex items-start justify-between gap-4 relative overflow-hidden shadow-lg">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-400 shrink-0 mt-0.5">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400">Seasonal Advisory</span>
                <span className="text-[10px] text-zinc-400 bg-zinc-900/60 px-2 py-0.5 rounded-md border border-zinc-800">
                  {seasonalReminder.title}
                </span>
              </div>
              <p className="text-xs text-zinc-200 mt-1 leading-relaxed">
                {seasonalReminder.message}
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsReminderDismissed(true)}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900/60 transition-colors cursor-pointer shrink-0"
            title="Dismiss advisory"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* 2. Top Summary KPI Cards (5 Grid) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* KPI 1: Total Revenue */}
        <div className="p-4 rounded-2xl bg-bg-surface border border-border-default space-y-2 relative overflow-hidden group hover:border-border-hover transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">Total Revenue</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <IndianRupee className="h-4 w-4" />
            </div>
          </div>
          <div>
            <h3 className="text-xl font-extrabold text-text-primary tracking-tight">
              ₹{kpis.totalRevenue.toLocaleString("en-IN")}
            </h3>
            <p className="text-[10px] text-emerald-400 font-medium mt-0.5">Paid Orders Net</p>
          </div>
        </div>

        {/* KPI 2: Total Orders */}
        <Link href="/admin/orders" className="p-4 rounded-2xl bg-bg-surface border border-border-default space-y-2 relative overflow-hidden group hover:border-border-hover transition-colors block">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">Total Orders</span>
            <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
              <ShoppingBag className="h-4 w-4" />
            </div>
          </div>
          <div>
            <h3 className="text-xl font-extrabold text-text-primary tracking-tight">
              {kpis.totalOrders}
            </h3>
            <p className="text-[10px] text-blue-400 font-medium mt-0.5">Lifetime Orders</p>
          </div>
        </Link>

        {/* KPI 3: Total Customers */}
        <Link href="/admin/customers" className="p-4 rounded-2xl bg-bg-surface border border-border-default space-y-2 relative overflow-hidden group hover:border-border-hover transition-colors block">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">Customers</span>
            <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div>
            <h3 className="text-xl font-extrabold text-text-primary tracking-tight">
              {kpis.totalCustomers}
            </h3>
            <p className="text-[10px] text-purple-400 font-medium mt-0.5">Registered Profiles</p>
          </div>
        </Link>

        {/* KPI 4: Total Products */}
        <Link href="/admin/products" className="p-4 rounded-2xl bg-bg-surface border border-border-default space-y-2 relative overflow-hidden group hover:border-border-hover transition-colors block">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">Catalog Products</span>
            <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <Package className="h-4 w-4" />
            </div>
          </div>
          <div>
            <h3 className="text-xl font-extrabold text-text-primary tracking-tight">
              {kpis.totalProducts}
            </h3>
            <p className="text-[10px] text-indigo-400 font-medium mt-0.5">Active SKUs</p>
          </div>
        </Link>

        {/* KPI 5: Pending Fulfillment */}
        <Link href="/admin/orders" className="p-4 rounded-2xl bg-bg-surface border border-border-default space-y-2 relative overflow-hidden group hover:border-border-hover transition-colors block">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">Pending Action</span>
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div>
            <h3 className="text-xl font-extrabold text-text-primary tracking-tight">
              {kpis.pendingFulfillment}
            </h3>
            <p className="text-[10px] text-amber-400 font-medium mt-0.5">Confirmed Orders</p>
          </div>
        </Link>
      </div>

      {/* 4. Profit / Loss Summary Card & Revenue Trend Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Profit / Loss Card (1 col) */}
        <div className="p-6 rounded-3xl bg-bg-surface border border-border-default space-y-5 flex flex-col justify-between shadow-xl">
          <div className="border-b border-zinc-800/60 pb-3">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-emerald-400" /> Profit & Loss Analysis
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Gross and Net profit (after operating expenses). Click to view breakdown.
            </p>
          </div>

          {/* Missing Cost Price Data Warning Notice */}
          {profitLoss?.dataCompletenessWarning && !isWarningDismissed && (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-start justify-between gap-2 text-xs">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                <span className="text-amber-300 text-[11px] leading-snug">
                  Some older orders are missing cost price data and are excluded from this calculation — profit may be understated.
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsWarningDismissed(true)}
                className="text-amber-400 hover:text-white shrink-0 p-0.5 cursor-pointer"
                title="Dismiss warning"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* This Week */}
            <div 
              onClick={() => setBreakdownModalPeriod("week")}
              className="p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800/60 hover:border-emerald-500/50 hover:bg-zinc-900/80 space-y-3 cursor-pointer transition-all group relative"
              title="Click to view detailed itemized profit & expense breakdown"
            >
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 group-hover:text-emerald-400 transition-colors">This Week</span>
                  {profitLoss.thisWeek.dateRangeStr && (
                    <span className="text-[9px] text-zinc-500 font-mono mt-0.5">({profitLoss.thisWeek.dateRangeStr})</span>
                  )}
                </div>
                <Maximize2 className="h-3.5 w-3.5 text-zinc-600 group-hover:text-emerald-400 transition-colors" />
              </div>

              {/* Gross Profit */}
              <div>
                <span className="text-[10px] text-zinc-500 uppercase tracking-wider block font-bold">Gross Profit</span>
                <div className="flex items-center gap-2">
                  <h4 className="text-lg font-extrabold text-white">
                    ₹{profitLoss.thisWeek.profit.toLocaleString("en-IN")}
                  </h4>
                  <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold border ${
                    profitLoss.thisWeek.percentageChange >= 0
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                      : "bg-rose-500/10 text-rose-400 border-rose-500/20"
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
              <div className="border-t border-zinc-800/60 pt-2 space-y-1">
                <span className="text-[10px] text-emerald-400 uppercase tracking-wider block font-bold">Net Profit (after expenses)</span>
                <h4 className={`text-base font-bold font-mono ${profitLoss.thisWeek.netProfit >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                  ₹{profitLoss.thisWeek.netProfit.toLocaleString("en-IN")}
                </h4>
                <p className="text-[9px] text-zinc-500 font-mono">
                  ₹{profitLoss.thisWeek.profit.toLocaleString("en-IN")} gross − ₹{profitLoss.thisWeek.totalExpenses.toLocaleString("en-IN")} exp
                </p>
              </div>
            </div>

            {/* This Month */}
            <div 
              onClick={() => setBreakdownModalPeriod("month")}
              className="p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800/60 hover:border-emerald-500/50 hover:bg-zinc-900/80 space-y-3 cursor-pointer transition-all group relative"
              title="Click to view detailed itemized profit & expense breakdown"
            >
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 group-hover:text-emerald-400 transition-colors">This Month</span>
                  {profitLoss.thisMonth.dateRangeStr && (
                    <span className="text-[9px] text-zinc-500 font-mono mt-0.5">({profitLoss.thisMonth.dateRangeStr})</span>
                  )}
                </div>
                <Maximize2 className="h-3.5 w-3.5 text-zinc-600 group-hover:text-emerald-400 transition-colors" />
              </div>

              {/* Gross Profit */}
              <div>
                <span className="text-[10px] text-zinc-500 uppercase tracking-wider block font-bold">Gross Profit</span>
                <div className="flex items-center gap-2">
                  <h4 className="text-lg font-extrabold text-white">
                    ₹{profitLoss.thisMonth.profit.toLocaleString("en-IN")}
                  </h4>
                  <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold border ${
                    profitLoss.thisMonth.percentageChange >= 0
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                      : "bg-rose-500/10 text-rose-400 border-rose-500/20"
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
              <div className="border-t border-zinc-800/60 pt-2 space-y-1">
                <span className="text-[10px] text-emerald-400 uppercase tracking-wider block font-bold">Net Profit (after expenses)</span>
                <h4 className={`text-base font-bold font-mono ${profitLoss.thisMonth.netProfit >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                  ₹{profitLoss.thisMonth.netProfit.toLocaleString("en-IN")}
                </h4>
                <p className="text-[9px] text-zinc-500 font-mono">
                  ₹{profitLoss.thisMonth.profit.toLocaleString("en-IN")} gross − ₹{profitLoss.thisMonth.totalExpenses.toLocaleString("en-IN")} exp
                </p>
              </div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-zinc-950/40 border border-zinc-800/40 text-[11px] text-zinc-400 leading-relaxed flex items-center justify-between">
            <div>
              <span className="text-zinc-300 font-semibold">Margin Insight:</span> Click cards above for full itemized product & expense breakdown.
            </div>
          </div>
        </div>

        {/* Revenue Trend Chart (2 cols) */}
        <div className="lg:col-span-2 p-6 rounded-3xl bg-zinc-900/30 border border-zinc-800/60 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-zinc-800/60 pb-3">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-blue-400" /> Revenue Trend (Last 30 Days)
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">Daily aggregate revenue from completed/paid transactions.</p>
            </div>
          </div>

          <div className="h-64 w-full pt-2">
            {revenueTrend.some(r => r.revenue > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" stroke="#71717a" fontSize={11} tickLine={false} />
                  <YAxis stroke="#71717a" fontSize={11} tickLine={false} tickFormatter={(v) => `₹${v}`} />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-[#121216] border border-zinc-800 p-2.5 rounded-xl shadow-2xl text-xs font-mono">
                            <p className="font-bold text-white mb-1">{label}</p>
                            <p className="text-blue-400 font-semibold">Revenue: ₹{payload[0].value.toLocaleString("en-IN")}</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRevenue)" />
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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Category Purchase Trend (2 cols) */}
        <div className="lg:col-span-2 p-6 rounded-3xl bg-zinc-900/30 border border-zinc-800/60 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-zinc-800/60 pb-3">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-purple-400" /> Category-wise Purchase Trend (30 Days)
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">Top product categories by volume of units sold.</p>
            </div>
          </div>

          <div className="h-64 w-full pt-2">
            {categoryPurchaseTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryPurchaseTrend} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <XAxis dataKey="categoryName" stroke="#71717a" fontSize={11} tickLine={false} />
                  <YAxis stroke="#71717a" fontSize={11} tickLine={false} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-[#121216] border border-zinc-800 p-2.5 rounded-xl shadow-2xl text-xs">
                            <p className="font-bold text-white">{data.categoryName}</p>
                            <p className="text-purple-400 font-semibold">{data.totalQuantitySold} units sold</p>
                            <p className="text-zinc-400 text-[11px]">Revenue: ₹{data.totalRevenue?.toLocaleString("en-IN")}</p>
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
        <div className="p-6 rounded-3xl bg-zinc-900/30 border border-zinc-800/60 space-y-4 shadow-xl">
          <div className="border-b border-zinc-800/60 pb-3">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <PieIcon className="h-4 w-4 text-indigo-400" /> Order Status Distribution
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">Breakdown of orders across fulfillment states.</p>
          </div>

          <div className="h-48 w-full">
            {orderStatusBreakdown.some(s => s.count > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={orderStatusBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={3}
                    dataKey="count"
                    nameKey="status"
                  >
                    {orderStatusBreakdown.map((entry) => (
                      <Cell key={entry.status} fill={STATUS_COLORS[entry.status] || "#71717a"} />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-[#121216] border border-zinc-800 p-2 rounded-xl shadow-xl text-xs">
                            <span className="font-bold text-white">{payload[0].name}: </span>
                            <span className="text-emerald-400 font-bold">{payload[0].value} orders</span>
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

          {/* Status Badges Legend */}
          <div className="grid grid-cols-2 gap-1.5 pt-1 text-[11px]">
            {orderStatusBreakdown.map((item) => (
              <div key={item.status} className="flex items-center justify-between p-1.5 rounded-lg bg-zinc-950/40 border border-zinc-800/40">
                <span className="flex items-center gap-1.5 text-zinc-300 font-medium">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: STATUS_COLORS[item.status] || "#71717a" }} />
                  {item.status}
                </span>
                <span className="font-mono font-bold text-zinc-400">{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 6. Best-Selling Products & Low Stock Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Best-Selling Products Card */}
        <div className="p-6 rounded-3xl bg-zinc-900/30 border border-zinc-800/60 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-zinc-800/60 pb-3">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Tag className="h-4 w-4 text-emerald-400" /> Best-Selling Products
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">Top products ranked by units sold in paid orders.</p>
            </div>
            <Link href="/admin/products" className="text-xs text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1">
              View Catalog <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="space-y-2.5">
            {bestSellingProducts.length > 0 ? (
              bestSellingProducts.map((prod) => (
                <Link
                  key={prod.id}
                  href="/admin/products"
                  className="flex items-center justify-between p-3 rounded-2xl bg-zinc-950/60 border border-zinc-800/60 hover:border-zinc-700 transition-colors group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 overflow-hidden shrink-0 flex items-center justify-center">
                      {prod.thumbnail ? (
                        <img src={prod.thumbnail} alt={prod.name} className="w-full h-full object-cover" />
                      ) : (
                        <Package className="w-5 h-5 text-zinc-600" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-white truncate group-hover:text-emerald-400 transition-colors">
                        {prod.name}
                      </h4>
                      <p className="text-[10px] text-zinc-400 font-mono">
                        ₹{prod.revenue.toLocaleString("en-IN")} total revenue
                      </p>
                    </div>
                  </div>

                  <span className="px-2.5 py-1 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold shrink-0">
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
        <div className="p-6 rounded-3xl bg-zinc-900/30 border border-zinc-800/60 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-zinc-800/60 pb-3">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-rose-400" /> Low Stock Inventory Alerts
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">Products running below safety stock levels.</p>
            </div>
            <Link href="/admin/inventory" className="text-xs text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1">
              Restock All <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="space-y-2.5">
            {lowStockAlerts.length > 0 ? (
              lowStockAlerts.map((prod) => {
                const isCritical = prod.stock <= 3;
                return (
                  <div
                    key={prod.id}
                    className="flex items-center justify-between p-3 rounded-2xl bg-zinc-950/60 border border-zinc-800/60 space-x-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className={`px-2 py-1 rounded-xl text-[10px] font-bold border uppercase tracking-wider shrink-0 ${
                        isCritical
                          ? "bg-rose-500/10 text-rose-400 border-rose-500/20 animate-pulse"
                          : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                      }`}>
                        {prod.stock} {prod.stockUnit} Left
                      </span>
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-white truncate">{prod.name}</h4>
                        <p className="text-[10px] text-zinc-400">₹{prod.sellingPrice} selling price</p>
                      </div>
                    </div>

                    <Link
                      href="/admin/inventory"
                      className="px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 text-xs font-semibold transition-colors shrink-0 flex items-center gap-1 cursor-pointer"
                    >
                      <span>Restock</span>
                      <ExternalLink className="h-3 w-3 text-blue-400" />
                    </Link>
                  </div>
                );
              })
            ) : (
              <div className="flex flex-col items-center justify-center text-center py-8 text-zinc-500 space-y-1">
                <CheckCircle2 className="h-6 w-6 text-emerald-400" />
                <p className="text-xs">All inventory stock levels are healthy.</p>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* 7. Recently Sold Products & Recently Acquired Customers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Recently Sold Products Card */}
        <div className="p-6 rounded-3xl bg-zinc-900/30 border border-zinc-800/60 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-zinc-800/60 pb-3">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-400" /> Recently Sold Items
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">Latest item transactions from completed orders.</p>
            </div>
            <Link href="/admin/orders" className="text-xs text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1">
              All Orders <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="space-y-2">
            {recentlySoldProducts.length > 0 ? (
              recentlySoldProducts.map((item, idx) => (
                <div
                  key={`${item.orderId}-${idx}`}
                  className="flex items-center justify-between p-3 rounded-2xl bg-zinc-950/60 border border-zinc-800/60 text-xs"
                >
                  <div className="min-w-0 pr-2">
                    <h4 className="font-semibold text-zinc-100 truncate">{item.productName}</h4>
                    <p className="text-[10px] text-zinc-400 mt-0.5">
                      Buyer: <span className="text-zinc-300 font-medium">{item.customerName}</span> • {new Date(item.date).toLocaleDateString("en-IN")}
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="font-bold text-white">{item.quantity} qty</span>
                    <p className="text-[10px] text-emerald-400 font-mono">₹{item.subtotal}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-zinc-500 text-center py-6">No recent sales records.</p>
            )}
          </div>
        </div>

        {/* Recently New Customers Card */}
        <div className="p-6 rounded-3xl bg-zinc-900/30 border border-zinc-800/60 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-zinc-800/60 pb-3">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Users className="h-4 w-4 text-purple-400" /> Recently Acquired Customers
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">New buyer accounts registered in store.</p>
            </div>
            <Link href="/admin/customers" className="text-xs text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1">
              Customers <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="space-y-2">
            {recentlyNewCustomers.length > 0 ? (
              recentlyNewCustomers.map((cust) => (
                <div
                  key={cust.id}
                  className="flex items-center justify-between p-3 rounded-2xl bg-zinc-950/60 border border-zinc-800/60 text-xs"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
                      {cust.name[0].toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-semibold text-zinc-100 truncate">{cust.name}</h4>
                      <p className="text-[10px] text-zinc-400 font-mono mt-0.5">{cust.phone}</p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-400 border border-purple-500/20 font-bold">
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
        <DialogContent className="bg-[#0c0c0e] border border-zinc-800 text-white rounded-2xl w-[96vw] md:w-[92vw] xl:w-[90vw] max-w-7xl xl:max-w-[1300px] !max-w-[1300px] sm:max-w-none h-[90vh] max-h-[90vh] p-0 flex flex-col shadow-2xl overflow-hidden font-sans">
          {/* 1. PROFESSIONAL STICKY TOP HEADER */}
          <div className="border-b border-zinc-800/80 p-6 shrink-0 bg-[#0e0e12] flex flex-col sm:flex-row sm:items-center justify-between gap-4 z-20">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                <DollarSign className="h-5 w-5" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2.5">
                  <DialogTitle className="text-lg sm:text-xl font-extrabold text-white tracking-tight">
                    Net Profit Breakdown — {breakdownData?.label || (breakdownModalPeriod === "month" ? "This Month" : "This Week")}
                  </DialogTitle>
                  {breakdownData?.dateRangeStr && (
                    <span className="text-xs font-mono font-medium text-zinc-300 bg-zinc-900 border border-zinc-800 px-3 py-1 rounded-lg">
                      {breakdownData.dateRangeStr}
                    </span>
                  )}
                </div>
                <p className="text-xs text-zinc-400 mt-1">
                  Itemized product profit margins and operating expenses for full Net Profit reconciliation.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 pr-10 sm:pr-2 shrink-0">
              {breakdownData?.breakdown?.length > 0 && (
                <Button
                  onClick={() => handleExportBreakdownCsv(breakdownData)}
                  variant="outline"
                  className="border-zinc-800 bg-zinc-900 text-zinc-300 hover:text-white hover:bg-zinc-800 rounded-xl px-4 h-9 text-xs font-semibold flex items-center gap-2 cursor-pointer shadow-sm"
                >
                  <Download className="w-4 h-4 text-emerald-400" /> Export CSV
                </Button>
              )}
            </div>
          </div>

          {/* 2. SCROLLABLE FINANCIAL TABLE AREA */}
          <div className="flex-1 overflow-y-auto p-6 custom-scrollbar min-h-0 bg-[#09090b] space-y-8">
            {isBreakdownLoading ? (
              <div className="py-24 text-center text-zinc-400 text-xs font-medium space-y-3">
                <RefreshCw className="h-7 w-7 text-emerald-400 animate-spin mx-auto" />
                <p className="text-zinc-300 text-sm font-semibold">Calculating itemized profit margins and expenses...</p>
              </div>
            ) : breakdownError || !breakdownData ? (
              <div className="py-16 text-center text-rose-400 text-xs space-y-2">
                <AlertTriangle className="h-8 w-8 text-rose-500 mx-auto" />
                <p className="font-semibold text-sm">Failed to load profit breakdown data.</p>
                <p className="text-zinc-500">Please close and reopen the analytics report.</p>
              </div>
            ) : (
              <>
                {/* SECTION A: PRODUCT PROFIT BREAKDOWN */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                    <Package className="w-4 h-4 text-emerald-400" /> 1. Product Sales & Gross Profit
                  </h3>
                  {breakdownData.breakdown.length === 0 ? (
                    <div className="py-8 text-center text-zinc-500 text-xs border border-dashed border-zinc-800 rounded-xl">
                      No product sales recorded in this period.
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-2xl border border-zinc-800/80 bg-zinc-950/80 shadow-lg">
                      <Table className="w-full text-xs">
                        <TableHeader className="bg-[#121216] sticky top-0 z-10 border-b border-zinc-800">
                          <TableRow className="border-b border-zinc-800 uppercase tracking-wider text-[11px] text-zinc-400 hover:bg-transparent">
                            <TableHead className="font-bold py-3 text-zinc-400 text-left min-w-[280px]">Product</TableHead>
                            <TableHead className="font-bold py-3 text-zinc-400 text-center w-[90px]">Qty Sold</TableHead>
                            <TableHead className="font-bold py-3 text-zinc-400 text-right w-[120px]">Cost Price</TableHead>
                            <TableHead className="font-bold py-3 text-zinc-400 text-right w-[130px]">Selling Price</TableHead>
                            <TableHead className="font-bold py-3 text-zinc-400 text-right w-[130px]">Profit / Item</TableHead>
                            <TableHead className="font-bold py-3 text-zinc-400 text-right w-[150px]">Total Sale</TableHead>
                            <TableHead className="font-bold py-3 text-zinc-400 text-right w-[150px]">Total Profit</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {breakdownData.breakdown.map((item, idx) => (
                            <TableRow 
                              key={idx} 
                              className={`border-b border-zinc-800/60 transition-colors ${idx % 2 === 1 ? "bg-zinc-900/30" : "bg-transparent"} hover:bg-zinc-800/40`}
                            >
                              <TableCell className="py-3 text-left font-sans min-w-[280px]">
                                <div className="flex flex-col">
                                  <span className="font-bold text-zinc-100 capitalize text-xs">{item.productName}</span>
                                  {item.hasPriceVariation && (
                                    <span className="text-[10px] text-amber-400 font-semibold italic mt-0.5">
                                      (price changed mid-period)
                                    </span>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="text-center font-mono py-3 text-zinc-300 w-[90px] font-bold text-xs">
                                {item.quantitySold}
                              </TableCell>
                              <TableCell className="text-right font-mono py-3 text-zinc-400 w-[120px] text-xs">
                                ₹{item.costPricePerUnit}
                              </TableCell>
                              <TableCell className="text-right font-mono py-3 text-zinc-100 font-semibold w-[130px] text-xs">
                                ₹{item.pricePerUnit}
                              </TableCell>
                              <TableCell className="text-right font-mono py-3 w-[130px]">
                                <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-bold border ${
                                  item.profitPerUnit >= 0 
                                    ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/25" 
                                    : "text-rose-400 bg-rose-500/10 border-rose-500/25"
                                }`}>
                                  ₹{item.profitPerUnit}
                                </span>
                              </TableCell>
                              <TableCell className="text-right font-mono py-3 text-zinc-100 font-bold w-[150px] text-xs">
                                ₹{item.totalSale.toLocaleString("en-IN")}
                              </TableCell>
                              <TableCell className="text-right font-mono py-3 text-emerald-400 font-extrabold w-[150px] text-xs">
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
                  <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-rose-400" /> 2. Operating Expenses ({breakdownData.label})
                  </h3>
                  {!breakdownData.expenseBreakdown || breakdownData.expenseBreakdown.length === 0 ? (
                    <div className="py-6 text-center text-zinc-500 text-xs border border-dashed border-zinc-800 rounded-xl">
                      No operating expenses recorded for this period.
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-2xl border border-zinc-800/80 bg-zinc-950/80 shadow-lg">
                      <Table className="w-full text-xs">
                        <TableHeader className="bg-[#121216] border-b border-zinc-800">
                          <TableRow className="border-b border-zinc-800 uppercase tracking-wider text-[11px] text-zinc-400 hover:bg-transparent">
                            <TableHead className="font-bold py-3 text-zinc-400 text-left">Expense Category</TableHead>
                            <TableHead className="font-bold py-3 text-zinc-400 text-right w-48">Period Amount</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {breakdownData.expenseBreakdown.map((exp, idx) => (
                            <TableRow key={idx} className="border-b border-zinc-800/60 hover:bg-zinc-900/40 transition-colors">
                              <TableCell className="py-3 font-bold text-zinc-200 capitalize">
                                {exp.category}
                              </TableCell>
                              <TableCell className="py-3 text-right font-mono font-bold text-rose-400 text-xs">
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
              <div className="border-t border-zinc-800 bg-[#0e0e12] p-5 shrink-0 z-20 shadow-2xl">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 items-center">
                  <div className="bg-zinc-900/50 border border-zinc-800/80 p-3 rounded-xl">
                    <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold block">Gross Sales</span>
                    <span className="font-mono text-base font-bold text-zinc-100">₹{grandTotalSale.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="bg-zinc-900/50 border border-zinc-800/80 p-3 rounded-xl">
                    <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold block">Gross Profit</span>
                    <span className="font-mono text-base font-bold text-zinc-100">
                      ₹{grandTotalProfit.toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div className="bg-rose-500/10 border border-rose-500/20 p-3 rounded-xl">
                    <span className="text-[10px] text-rose-400 uppercase tracking-wider font-bold block">Total Operating Expenses</span>
                    <span className="font-mono text-base font-bold text-rose-400">
                      ₹{totalExpenses.toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div className={`border p-3 rounded-xl ${netProfit >= 0 ? "bg-emerald-500/10 border-emerald-500/30" : "bg-rose-500/10 border-rose-500/30"}`}>
                    <span className={`text-[10px] uppercase tracking-wider font-bold block ${netProfit >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                      Grand Net Profit
                    </span>
                    <span className={`font-mono text-xl sm:text-2xl font-extrabold ${netProfit >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
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
