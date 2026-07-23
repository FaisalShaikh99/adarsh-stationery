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
  ExternalLink
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

const fetchDashboardData = async () => {
  const { data } = await axios.get("/api/admin/dashboard");
  return data.data;
};

export default function AdminDashboardPage() {
  const [isReminderDismissed, setIsReminderDismissed] = useState(false);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["adminDashboardData"],
    queryFn: fetchDashboardData,
    refetchInterval: 60000, // Auto refresh every 60 seconds
  });

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

  // Status colors mapping
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

      {/* 2. Seasonal Reminder Banner (if active & not dismissed) */}
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

      {/* 3. Top KPI Row (5 Summary Cards) */}
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
        <div className="p-4 rounded-2xl bg-zinc-900/40 border border-zinc-800/60 space-y-2 relative overflow-hidden group hover:border-zinc-700 transition-colors">
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
        </div>

        {/* KPI 3: Total Customers */}
        <div className="p-4 rounded-2xl bg-zinc-900/40 border border-zinc-800/60 space-y-2 relative overflow-hidden group hover:border-zinc-700 transition-colors">
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
        </div>

        {/* KPI 4: Total Products */}
        <div className="p-4 rounded-2xl bg-zinc-900/40 border border-zinc-800/60 space-y-2 relative overflow-hidden group hover:border-zinc-700 transition-colors">
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
        </div>

        {/* KPI 5: Pending Fulfillment */}
        <div className="p-4 rounded-2xl bg-zinc-900/40 border border-zinc-800/60 space-y-2 relative overflow-hidden group hover:border-zinc-700 transition-colors">
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
        </div>
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
              Net margin computed from item cost prices.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* This Week */}
            <div className="p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800/60 space-y-2">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">This Week</span>
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
                <span className="text-[10px] text-zinc-500">vs last week</span>
              </div>
            </div>

            {/* This Month */}
            <div className="p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800/60 space-y-2">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">This Month</span>
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
                <span className="text-[10px] text-zinc-500">vs last month</span>
              </div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-zinc-950/40 border border-zinc-800/40 text-[11px] text-zinc-400 leading-relaxed">
            <span className="text-zinc-300 font-semibold">Margin Insight:</span> Net profits snapshot actual cost of goods sold (COGS) recorded at checkout time.
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
                  <YAxis stroke="#71717a" fontSize={10} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: "#09090b", borderColor: "#27272a", borderRadius: "12px", fontSize: "11px", color: "#fff" }}
                    formatter={(val) => [`₹${val.toLocaleString("en-IN")}`, "Revenue"]}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-zinc-500 text-xs space-y-1">
                <ShoppingBag className="h-6 w-6 text-zinc-600" />
                <p>No sales revenue recorded in the last 30 days.</p>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* 5. Order Status Breakdown (Donut) & Category Purchase Trend (Bar) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Order Status Breakdown Chart (1 col) */}
        <div className="p-6 rounded-3xl bg-zinc-900/30 border border-zinc-800/60 space-y-4 shadow-xl">
          <div className="border-b border-zinc-800/60 pb-3">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <PieChart className="h-4 w-4 text-indigo-400" /> Order Status Distribution
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">Order pipeline breakdown by current fulfillment state.</p>
          </div>

          <div className="h-52 w-full flex items-center justify-center">
            {totalStatusOrders > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={orderStatusBreakdown}
                    dataKey="count"
                    nameKey="status"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={3}
                  >
                    {orderStatusBreakdown.map((entry) => (
                      <Cell key={entry.status} fill={statusColors[entry.status] || "#71717a"} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: "#09090b", borderColor: "#27272a", borderRadius: "12px", fontSize: "11px", color: "#fff" }}
                    formatter={(val, name) => [`${val} orders`, name]}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-xs text-zinc-500">No order data available.</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2">
            {orderStatusBreakdown.map((st) => (
              <div key={st.status} className="flex items-center justify-between p-2 rounded-xl bg-zinc-950/50 border border-zinc-800/60 text-xs">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: statusColors[st.status] || "#71717a" }} />
                  <span className="text-zinc-300 font-medium text-[11px]">{st.status}</span>
                </div>
                <span className="font-bold text-white text-[11px]">{st.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Category Purchase Trend Chart (2 cols) */}
        <div className="lg:col-span-2 p-6 rounded-3xl bg-zinc-900/30 border border-zinc-800/60 space-y-4 shadow-xl">
          <div className="border-b border-zinc-800/60 pb-3">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Layers className="h-4 w-4 text-purple-400" /> Category Purchase Demand (Last 30 Days)
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">Total units sold grouped by stationery category.</p>
          </div>

          <div className="h-64 w-full pt-2">
            {categoryPurchaseTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart layout="vertical" data={categoryPurchaseTrend} margin={{ top: 5, right: 20, left: 30, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" horizontal={false} />
                  <XAxis type="number" stroke="#71717a" fontSize={10} />
                  <YAxis type="category" dataKey="categoryName" stroke="#a1a1aa" fontSize={11} width={120} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: "#09090b", borderColor: "#27272a", borderRadius: "12px", fontSize: "11px", color: "#fff" }}
                    formatter={(val) => [`${val} units sold`, "Volume"]}
                  />
                  <Bar dataKey="totalQuantitySold" fill="#6366f1" radius={[0, 8, 8, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-zinc-500 text-xs space-y-1">
                <Layers className="h-6 w-6 text-zinc-600" />
                <p>No category purchase data in the last 30 days.</p>
              </div>
            )}
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
                <Tag className="h-4 w-4 text-emerald-400" /> Top Best-Selling Products
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">Ranked by overall units sold in paid orders.</p>
            </div>
            <Link href="/admin/products" className="text-xs text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1">
              View All <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="space-y-2.5">
            {bestSellingProducts.length > 0 ? (
              bestSellingProducts.map((prod, idx) => (
                <Link
                  key={prod.id}
                  href="/admin/products"
                  className="flex items-center justify-between p-3 rounded-2xl bg-zinc-950/60 border border-zinc-800/60 hover:border-zinc-700 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 text-xs font-bold text-zinc-500 group-hover:text-blue-400 transition-colors">
                      #{idx + 1}
                    </span>
                    {prod.thumbnail ? (
                      <img src={prod.thumbnail} alt={prod.name} className="w-9 h-9 rounded-xl border border-zinc-800 object-cover shrink-0" />
                    ) : (
                      <div className="w-9 h-9 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-400 shrink-0">
                        {prod.name[0]}
                      </div>
                    )}
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-white group-hover:text-blue-400 transition-colors truncate">
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

        {/* Low Stock Alerts Card */}
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

      {/* 7. Recently Sold Products & Recently New Customers */}
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

    </div>
  );
}
