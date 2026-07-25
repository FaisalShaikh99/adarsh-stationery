"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
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
  Download
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  CartesianGrid
} from "recharts";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const fetchDashboardData = async () => {
  const { data } = await axios.get("/api/admin/dashboard");
  return data.data;
};

function formatCurrency(amount) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount || 0);
}

export default function AdminDashboardPage() {
  const [isReminderDismissed, setIsReminderDismissed] = useState(false);
  const [isWarningDismissed, setIsWarningDismissed] = useState(false);
  const [breakdownModalPeriod, setBreakdownModalPeriod] = useState(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["adminDashboardData"],
    queryFn: fetchDashboardData,
    refetchInterval: 60000,
  });

  const {
    data: breakdownData,
    isLoading: isBreakdownLoading,
    isError: breakdownError,
  } = useQuery({
    queryKey: ["profitBreakdown", breakdownModalPeriod],
    queryFn: async () => {
      if (!breakdownModalPeriod) return null;
      const res = await axios.get(`/api/admin/dashboard/profit-breakdown?period=${breakdownModalPeriod}`);
      return res.data?.data;
    },
    enabled: !!breakdownModalPeriod,
  });

  const handleExportBreakdownCsv = (bData) => {
    if (!bData?.breakdown || bData.breakdown.length === 0) return;

    const headers = [
      "Product Name",
      "Quantity Sold",
      "Cost Price (INR)",
      "Selling Price (INR)",
      "Profit Per Item (INR)",
      "Total Sale (INR)",
      "Total Profit (INR)",
      "Price Variation Note"
    ];

    const rows = bData.breakdown.map((item) => [
      `"${item.productName.replace(/"/g, '""')}"`,
      item.quantitySold,
      item.costPricePerUnit,
      item.pricePerUnit,
      item.profitPerUnit,
      item.totalSale,
      item.totalProfit,
      item.hasPriceVariation ? "Price changed mid-period" : "Standard"
    ]);

    rows.push([
      "Grand Total",
      bData.grandTotal?.totalQuantitySold || 0,
      "-",
      "-",
      "-",
      bData.grandTotal?.totalSale || 0,
      bData.grandTotal?.totalProfit || 0,
      "-"
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `profit-breakdown-${bData.period}-${bData.dateRangeStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="relative">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 animate-spin flex items-center justify-center">
            <RefreshCw className="h-6 w-6 text-white" />
          </div>
        </div>
        <p className="text-xs text-zinc-400 font-medium">Aggregating workspace analytics...</p>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4 text-center">
        <AlertTriangle className="h-10 w-10 text-rose-400" />
        <h2 className="text-lg font-bold text-white">Failed to load dashboard metrics</h2>
        <p className="text-xs text-zinc-400 max-w-sm">
          An error occurred while computing sales & inventory statistics.
        </p>
        <Button 
          onClick={() => refetch()} 
          className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl"
        >
          Try Again
        </Button>
      </div>
    );
  }

  const {
    kpis,
    profitLoss,
    bestSellingProducts,
    lowStockAlerts,
    categoryPurchaseTrend,
    recentlySoldProducts,
    recentlyNewCustomers,
    revenueTrend,
    orderStatusBreakdown,
    seasonalReminder,
  } = data;

  const statusColors = {
    Pending: "#f59e0b",
    Confirmed: "#3b82f6",
    Shipped: "#6366f1",
    Delivered: "#10b981",
    Cancelled: "#ef4444",
  };

  const totalStatusOrders = orderStatusBreakdown.reduce((sum, s) => sum + s.count, 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans animate-in fade-in duration-300 pb-12">
      
      {/* 1. Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-800/80 pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Sparkles className="h-5 w-5 text-blue-400" /> Executive Workspace Dashboard
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Real-time sales performance, inventory intelligence, and order fulfillment analytics.
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

      {/* 3. Top KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* KPI 1: Revenue */}
        <div className="p-4 rounded-2xl bg-zinc-900/40 border border-zinc-800/60 space-y-2 relative overflow-hidden group hover:border-zinc-700 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">Total Revenue</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <div>
            <h3 className="text-xl font-extrabold text-white tracking-tight">
              ₹{kpis.totalRevenue.toLocaleString("en-IN")}
            </h3>
            <p className="text-[10px] text-emerald-400 font-medium mt-0.5">Paid Orders Net</p>
          </div>
        </div>

        {/* KPI 2: Total Orders */}
        <Link href="/admin/orders" className="p-4 rounded-2xl bg-zinc-900/40 border border-zinc-800/60 space-y-2 relative overflow-hidden group hover:border-zinc-700 transition-colors block">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">Total Orders</span>
            <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
              <ShoppingBag className="h-4 w-4" />
            </div>
          </div>
          <div>
            <h3 className="text-xl font-extrabold text-white tracking-tight">
              {kpis.totalOrders}
            </h3>
            <p className="text-[10px] text-blue-400 font-medium mt-0.5">Lifetime Orders</p>
          </div>
        </Link>

        {/* KPI 3: Total Customers */}
        <Link href="/admin/customers" className="p-4 rounded-2xl bg-zinc-900/40 border border-zinc-800/60 space-y-2 relative overflow-hidden group hover:border-zinc-700 transition-colors block">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">Customers</span>
            <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div>
            <h3 className="text-xl font-extrabold text-white tracking-tight">
              {kpis.totalCustomers}
            </h3>
            <p className="text-[10px] text-purple-400 font-medium mt-0.5">Registered Profiles</p>
          </div>
        </Link>

        {/* KPI 4: Total Products */}
        <Link href="/admin/products" className="p-4 rounded-2xl bg-zinc-900/40 border border-zinc-800/60 space-y-2 relative overflow-hidden group hover:border-zinc-700 transition-colors block">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">Catalog Products</span>
            <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <Package className="h-4 w-4" />
            </div>
          </div>
          <div>
            <h3 className="text-xl font-extrabold text-white tracking-tight">
              {kpis.totalProducts}
            </h3>
            <p className="text-[10px] text-indigo-400 font-medium mt-0.5">Active SKUs</p>
          </div>
        </Link>

        {/* KPI 5: Pending Fulfillment */}
        <Link href="/admin/orders" className="p-4 rounded-2xl bg-zinc-900/40 border border-zinc-800/60 space-y-2 relative overflow-hidden group hover:border-zinc-700 transition-colors block">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">Pending Action</span>
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div>
            <h3 className="text-xl font-extrabold text-white tracking-tight">
              {kpis.pendingFulfillment}
            </h3>
            <p className="text-[10px] text-amber-400 font-medium mt-0.5">Confirmed Orders</p>
          </div>
        </Link>
      </div>

      {/* 4. Profit / Loss Summary Card & Revenue Trend Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Profit / Loss Card (1 col) */}
        <div className="p-6 rounded-3xl bg-zinc-900/30 border border-zinc-800/60 space-y-5 flex flex-col justify-between shadow-xl">
          <div className="border-b border-zinc-800/60 pb-3">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-emerald-400" /> Profit & Loss Analysis
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Net margin computed from item cost prices. Click cards for drill-down.
            </p>
          </div>

          {/* Missing Cost Price Data Completeness Warning Notice */}
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

          <div className="grid grid-cols-2 gap-4">
            {/* This Week */}
            <div 
              onClick={() => setBreakdownModalPeriod("week")}
              className="p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800/60 hover:border-emerald-500/50 hover:bg-zinc-900/80 space-y-2 cursor-pointer transition-all group relative"
              title="Click to view detailed itemized profit breakdown"
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
              <h4 className="text-lg font-extrabold text-white">
                ₹{profitLoss.thisWeek.profit.toLocaleString("en-IN")}
              </h4>
              <div className="flex items-center gap-1.5">
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
                <span className="text-[10px] text-zinc-500">vs prior period</span>
              </div>
            </div>

            {/* This Month */}
            <div 
              onClick={() => setBreakdownModalPeriod("month")}
              className="p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800/60 hover:border-emerald-500/50 hover:bg-zinc-900/80 space-y-2 cursor-pointer transition-all group relative"
              title="Click to view detailed itemized profit breakdown"
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
              <h4 className="text-lg font-extrabold text-white">
                ₹{profitLoss.thisMonth.profit.toLocaleString("en-IN")}
              </h4>
              <div className="flex items-center gap-1.5">
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
                <span className="text-[10px] text-zinc-500">vs prior month</span>
              </div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-zinc-950/40 border border-zinc-800/40 text-[11px] text-zinc-400 leading-relaxed flex items-center justify-between">
            <div>
              <span className="text-zinc-300 font-semibold">Margin Insight:</span> Click either card above to view itemized breakdown.
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
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                  <XAxis 
                    dataKey="date" 
                    stroke="#71717a" 
                    fontSize={10} 
                    tickFormatter={(val) => val.split("-").slice(1).join("/")}
                  />
                  <YAxis stroke="#71717a" fontSize={10} tickFormatter={(val) => `₹${val}`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: "#09090b", borderColor: "#27272a", borderRadius: "12px", color: "#fff" }}
                    formatter={(val) => [`₹${val.toLocaleString("en-IN")}`, "Revenue"]}
                    labelFormatter={(label) => `Date: ${label}`}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRevenue)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center text-zinc-500 text-xs space-y-2 border border-dashed border-zinc-800 rounded-2xl">
                <TrendingUp className="h-8 w-8 text-zinc-600" />
                <p>No paid revenue data recorded in the last 30 days.</p>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* 5. Second Row: Donut Chart & Category Trend & Best Sellers */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Order Status Breakdown Donut Chart */}
        <div className="p-6 rounded-3xl bg-zinc-900/30 border border-zinc-800/60 space-y-4 shadow-xl flex flex-col justify-between">
          <div className="border-b border-zinc-800/60 pb-3">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <ShoppingBag className="h-4 w-4 text-amber-400" /> Order Status Distribution
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">Breakdown of orders by fulfillment lifecycle.</p>
          </div>

          {totalStatusOrders > 0 ? (
            <div className="h-48 w-full flex items-center justify-center relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={orderStatusBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="count"
                    nameKey="status"
                  >
                    {orderStatusBreakdown.map((entry) => (
                      <Cell key={entry.status} fill={statusColors[entry.status] || "#71717a"} stroke="#09090b" strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: "#09090b", borderColor: "#27272a", borderRadius: "12px", color: "#fff" }}
                    formatter={(value, name) => [`${value} Orders`, name]}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-xl font-bold text-white">{totalStatusOrders}</span>
                <span className="text-[10px] text-zinc-400 uppercase tracking-wider">Orders</span>
              </div>
            </div>
          ) : (
            <p className="text-xs text-zinc-500 text-center py-12">No orders recorded.</p>
          )}

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-800/60">
            {orderStatusBreakdown.map((item) => (
              <div key={item.status} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: statusColors[item.status] || "#71717a" }} />
                  <span className="text-zinc-300 text-[11px] font-medium">{item.status}</span>
                </div>
                <span className="font-mono text-zinc-400 font-bold">{item.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Category Purchase Trend Bar Chart */}
        <div className="p-6 rounded-3xl bg-zinc-900/30 border border-zinc-800/60 space-y-4 shadow-xl">
          <div className="border-b border-zinc-800/60 pb-3">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Tag className="h-4 w-4 text-purple-400" /> Category Purchase Demand
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">Top stationery categories by units sold (30 days).</p>
          </div>

          <div className="h-60 w-full">
            {categoryPurchaseTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryPurchaseTrend.slice(0, 5)} layout="vertical" margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" horizontal={false} />
                  <XAxis type="number" stroke="#71717a" fontSize={10} />
                  <YAxis type="category" dataKey="categoryName" stroke="#a1a1aa" fontSize={10} width={90} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: "#09090b", borderColor: "#27272a", borderRadius: "12px", color: "#fff" }}
                    formatter={(val) => [`${val} Units`, "Quantity Sold"]}
                  />
                  <Bar dataKey="totalQuantitySold" fill="#8b5cf6" radius={[0, 8, 8, 0]} barSize={16} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-xs text-zinc-500 text-center py-12">No category sales recorded.</p>
            )}
          </div>
        </div>

        {/* Best Selling Products Card */}
        <div className="p-6 rounded-3xl bg-zinc-900/30 border border-zinc-800/60 space-y-4 shadow-xl flex flex-col justify-between">
          <div className="border-b border-zinc-800/60 pb-3 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-amber-400" /> Best-Selling Products
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">Top 5 items ranked by volume.</p>
            </div>
            <Link href="/admin/products" className="text-xs text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1">
              Catalog <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="space-y-2.5">
            {bestSellingProducts.length > 0 ? (
              bestSellingProducts.map((p, idx) => (
                <div key={p.id || idx} className="flex items-center justify-between p-2.5 rounded-2xl bg-zinc-950/60 border border-zinc-800/60 text-xs">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-white border border-zinc-800 p-0.5 shrink-0 flex items-center justify-center">
                      {p.thumbnail ? (
                        <img src={p.thumbnail} alt={p.name} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                      ) : (
                        <Package className="h-4 w-4 text-zinc-400" />
                      )}
                    </div>
                    <span className="font-semibold text-zinc-200 truncate capitalize">{p.name}</span>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-bold text-emerald-400 font-mono">{p.quantitySold} Sold</span>
                    <p className="text-[10px] text-zinc-500 font-mono">₹{p.revenue?.toLocaleString("en-IN")}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-zinc-500 text-center py-8">No product sales recorded.</p>
            )}
          </div>
        </div>

      </div>

      {/* 6. Third Row: Low Stock Alerts & Feeds */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Low Stock Inventory Alerts List */}
        <div className="p-6 rounded-3xl bg-zinc-900/30 border border-zinc-800/60 space-y-4 shadow-xl">
          <div className="border-b border-zinc-800/60 pb-3 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-rose-400" /> Low Stock Inventory Alerts
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">Products requiring immediate restock.</p>
            </div>
            <Link href="/admin/inventory" className="text-xs text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1">
              Control <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="space-y-2">
            {lowStockAlerts.length > 0 ? (
              lowStockAlerts.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 rounded-2xl bg-zinc-950/60 border border-zinc-800/60 text-xs">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-white border border-zinc-800 p-0.5 shrink-0 flex items-center justify-center">
                      {item.thumbnail ? (
                        <img src={item.thumbnail} alt={item.name} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                      ) : (
                        <Package className="h-4 w-4 text-zinc-400" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-semibold text-zinc-200 truncate capitalize">{item.name}</h4>
                      <p className="text-[10px] text-zinc-500 font-mono">₹{item.sellingPrice}/-</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      item.stock === 0
                        ? "bg-rose-500/10 text-rose-400 border border-rose-500/25"
                        : "bg-amber-500/10 text-amber-400 border border-amber-500/25"
                    }`}>
                      {item.stock} {item.stockUnit}
                    </span>
                    <Link
                      href="/admin/inventory"
                      className="p-1 rounded-lg text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors"
                      title="Restock in Inventory"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-zinc-500 text-xs space-y-1">
                <CheckCircle2 className="h-6 w-6 text-emerald-400 mx-auto" />
                <p>All stock levels are optimal!</p>
              </div>
            )}
          </div>
        </div>

        {/* Recently Sold Items List */}
        <div className="p-6 rounded-3xl bg-zinc-900/30 border border-zinc-800/60 space-y-4 shadow-xl">
          <div className="border-b border-zinc-800/60 pb-3 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-400" /> Recently Sold Products
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">Live stream of checkout activity.</p>
            </div>
            <Link href="/admin/orders" className="text-xs text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1">
              Orders <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="space-y-2">
            {recentlySoldProducts.length > 0 ? (
              recentlySoldProducts.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-2xl bg-zinc-950/60 border border-zinc-800/60 text-xs">
                  <div className="min-w-0 pr-2">
                    <h4 className="font-semibold text-zinc-200 truncate capitalize">{item.productName}</h4>
                    <p className="text-[10px] text-zinc-500 mt-0.5">
                      By <span className="text-zinc-300 font-medium">{item.customerName}</span> ({item.orderNumber})
                    </p>
                  </div>
                  <div className="text-right shrink-0 font-mono">
                    <span className="font-bold text-white">₹{item.subtotal}</span>
                    <span className="text-[10px] text-zinc-500 block">{item.quantity} qty</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-zinc-500 text-center py-8">No recent transactions.</p>
            )}
          </div>
        </div>

        {/* Recently Acquired Customers */}
        <div className="p-6 rounded-3xl bg-zinc-900/30 border border-zinc-800/60 space-y-4 shadow-xl">
          <div className="border-b border-zinc-800/60 pb-3 flex items-center justify-between">
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

      {/* PROFIT BREAKDOWN DRILL-DOWN ANALYTICS WORKBENCH MODAL */}
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
                    Profit Breakdown — {breakdownData?.label || (breakdownModalPeriod === "month" ? "This Month" : "This Week")}
                  </DialogTitle>
                  {breakdownData?.dateRangeStr && (
                    <span className="text-xs font-mono font-medium text-zinc-300 bg-zinc-900 border border-zinc-800 px-3 py-1 rounded-lg">
                      {breakdownData.dateRangeStr}
                    </span>
                  )}
                </div>
                <p className="text-xs text-zinc-400 mt-1">
                  Itemized financial ledger grouped by snapshot price & cost price per unit.
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
          <div className="flex-1 overflow-y-auto p-6 custom-scrollbar min-h-0 bg-[#09090b]">
            {isBreakdownLoading ? (
              <div className="py-24 text-center text-zinc-400 text-xs font-medium space-y-3">
                <RefreshCw className="h-7 w-7 text-emerald-400 animate-spin mx-auto" />
                <p className="text-zinc-300 text-sm font-semibold">Calculating itemized profit margins...</p>
              </div>
            ) : breakdownError || !breakdownData ? (
              <div className="py-16 text-center text-rose-400 text-xs space-y-2">
                <AlertTriangle className="h-8 w-8 text-rose-500 mx-auto" />
                <p className="font-semibold text-sm">Failed to load profit breakdown data.</p>
                <p className="text-zinc-500">Please close and reopen the analytics report.</p>
              </div>
            ) : breakdownData.breakdown.length === 0 ? (
              /* Analytics Empty State */
              <div className="py-20 text-center text-zinc-400 space-y-3 max-w-sm mx-auto">
                <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto text-zinc-500">
                  <DollarSign className="w-6 h-6 text-zinc-400" />
                </div>
                <h3 className="text-sm font-bold text-zinc-200">No Sales Recorded</h3>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  There are no completed or paid order items within this selected date range ({breakdownData.dateRangeStr || "current period"}).
                </p>
              </div>
            ) : (
              /* Itemized Financial Ledger Table */
              <div className="overflow-x-auto lg:overflow-x-visible rounded-2xl border border-zinc-800/80 bg-zinc-950/80 shadow-lg">
                <Table className="w-full text-xs">
                  <TableHeader className="bg-[#121216] sticky top-0 z-10 border-b border-zinc-800">
                    <TableRow className="border-b border-zinc-800 uppercase tracking-wider text-[11px] text-zinc-400 hover:bg-transparent">
                      <TableHead className="font-bold py-4 text-zinc-400 text-left min-w-[280px]">Product</TableHead>
                      <TableHead className="font-bold py-4 text-zinc-400 text-center w-[90px]">Qty Sold</TableHead>
                      <TableHead className="font-bold py-4 text-zinc-400 text-right w-[120px]">Cost Price</TableHead>
                      <TableHead className="font-bold py-4 text-zinc-400 text-right w-[130px]">Selling Price</TableHead>
                      <TableHead className="font-bold py-4 text-zinc-400 text-right w-[130px]">Profit / Item</TableHead>
                      <TableHead className="font-bold py-4 text-zinc-400 text-right w-[150px]">Total Sale</TableHead>
                      <TableHead className="font-bold py-4 text-zinc-400 text-right w-[150px]">Total Profit</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {breakdownData.breakdown.map((item, idx) => (
                      <TableRow 
                        key={idx} 
                        className={`border-b border-zinc-800/60 transition-colors ${idx % 2 === 1 ? "bg-zinc-900/30" : "bg-transparent"} hover:bg-zinc-800/40`}
                      >
                        {/* Product */}
                        <TableCell className="py-4 text-left font-sans min-w-[280px]">
                          <div className="flex flex-col">
                            <span className="font-bold text-zinc-100 capitalize text-xs sm:text-sm">{item.productName}</span>
                            {item.hasPriceVariation && (
                              <span className="text-[10px] text-amber-400 font-semibold italic mt-0.5">
                                (price changed mid-period)
                              </span>
                            )}
                          </div>
                        </TableCell>
                        {/* Qty Sold */}
                        <TableCell className="text-center font-mono py-4 text-zinc-300 w-[90px] font-bold text-xs sm:text-sm">
                          {item.quantitySold}
                        </TableCell>
                        {/* Cost Price */}
                        <TableCell className="text-right font-mono py-4 text-zinc-400 w-[120px] text-xs sm:text-sm">
                          ₹{item.costPricePerUnit}
                        </TableCell>
                        {/* Selling Price */}
                        <TableCell className="text-right font-mono py-4 text-zinc-100 font-semibold w-[130px] text-xs sm:text-sm">
                          ₹{item.pricePerUnit}
                        </TableCell>
                        {/* Profit / Item */}
                        <TableCell className="text-right font-mono py-4 w-[130px]">
                          <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold border ${
                            item.profitPerUnit >= 0 
                              ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/25" 
                              : "text-rose-400 bg-rose-500/10 border-rose-500/25"
                          }`}>
                            ₹{item.profitPerUnit}
                          </span>
                        </TableCell>
                        {/* Total Sale */}
                        <TableCell className="text-right font-mono py-4 text-zinc-100 font-bold w-[150px] text-xs sm:text-sm">
                          ₹{item.totalSale.toLocaleString("en-IN")}
                        </TableCell>
                        {/* Total Profit */}
                        <TableCell className="text-right font-mono py-4 text-emerald-400 font-extrabold w-[150px] text-xs sm:text-sm">
                          ₹{item.totalProfit.toLocaleString("en-IN")}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>

          {/* 3. STICKY SUMMARY FOOTER */}
          {breakdownData?.breakdown?.length > 0 && (() => {
            const productCount = breakdownData.breakdown.length;
            const grandTotalSale = breakdownData.grandTotal.totalSale;
            const grandTotalProfit = breakdownData.grandTotal.totalProfit;
            const marginPct = grandTotalSale > 0 ? ((grandTotalProfit / grandTotalSale) * 100).toFixed(1) : "0.0";

            return (
              <div className="border-t border-zinc-800 bg-[#0e0e12] p-5 shrink-0 z-20 shadow-2xl">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 items-center">
                  <div className="bg-zinc-900/50 border border-zinc-800/80 p-3 rounded-xl">
                    <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold block">Products</span>
                    <span className="font-mono text-base font-bold text-zinc-100">{productCount} items</span>
                  </div>
                  <div className="bg-zinc-900/50 border border-zinc-800/80 p-3 rounded-xl">
                    <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold block">Profit Margin</span>
                    <span className={`font-mono text-base font-bold ${Number(marginPct) >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                      {marginPct}%
                    </span>
                  </div>
                  <div className="bg-zinc-900/50 border border-zinc-800/80 p-3 rounded-xl">
                    <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold block">Grand Total Sales</span>
                    <span className="font-mono text-base font-bold text-zinc-100">
                      ₹{grandTotalSale.toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div className="bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-xl">
                    <span className="text-[10px] text-emerald-400 uppercase tracking-wider font-bold block">Grand Total Profit</span>
                    <span className="font-mono text-xl sm:text-2xl font-extrabold text-emerald-400">
                      ₹{grandTotalProfit.toLocaleString("en-IN")}
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
