"use client";

import { useMemo, useState } from "react";
import axios from "axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { 
  ChevronLeft, 
  ChevronRight, 
  ChevronDown,
  Loader2, 
  RefreshCw, 
  Search, 
  Eye, 
  ShoppingBag, 
  Check, 
  Package, 
  Truck, 
  CheckCircle2, 
  XCircle,
  CreditCard,
  Receipt
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import OrderDetailDrawer from "./OrderDetailDrawer";

const statuses = ["Pending", "Confirmed", "Shipped", "Delivered", "Cancelled"];
const paymentStatuses = ["Pending", "Paid", "Failed"];

const statusClasses = {
  Pending: "bg-amber-50 text-amber-700 border border-amber-200 font-black",
  Confirmed: "bg-sky-50 text-sky-700 border border-sky-200 font-black",
  Shipped: "bg-purple-50 text-purple-700 border border-purple-200 font-black",
  Delivered: "bg-emerald-50 text-emerald-700 border border-emerald-200 font-black",
  Cancelled: "bg-rose-50 text-rose-700 border border-rose-200 font-black",
};

const paymentStatusClasses = {
  Paid: "bg-emerald-50 text-emerald-700 border border-emerald-200 font-black",
  Pending: "bg-amber-50 text-amber-700 border border-amber-200 font-black",
  Failed: "bg-rose-50 text-rose-700 border border-rose-200 font-black",
};

function formatCurrency(amount) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount || 0);
}

function formatDate(dateString) {
  if (!dateString) return "—";
  return new Date(dateString).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function OrdersPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");
  const [selectedOrderId, setSelectedOrderId] = useState(null);

  // Custom Dropdown Popover Drawers Open States
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const [isPaymentStatusDropdownOpen, setIsPaymentStatusDropdownOpen] = useState(false);

  const queryParams = useMemo(() => ({ page, limit: 10, search, status, paymentStatus }), [page, search, status, paymentStatus]);
  const { data: ordersResponse, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["orders", queryParams],
    queryFn: async () => (await axios.get("/api/admin/orders", { params: queryParams })).data.data,
  });
  const { data: statsResponse } = useQuery({
    queryKey: ["order-stats"],
    queryFn: async () => (await axios.get("/api/admin/orders/stats")).data.data,
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, nextStatus }) => axios.patch(`/api/admin/orders/${id}/status`, { status: nextStatus }),
    onSuccess: (response) => {
      toast.success(response.data.message || "Order status updated.");
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["order-stats"] });
    },
    onError: (error) => toast.error(error.response?.data?.message || "Unable to update order status."),
  });

  const orders = ordersResponse?.orders || [];
  const pagination = ordersResponse?.pagination || { page: 1, totalPages: 1, total: 0 };
  const stats = statsResponse || { totalOrders: 10, totalRevenue: 12450, totalItemsSold: 34, statusCounts: { Pending: 4 } };

  const resetPage = (setter) => (event) => {
    setter(event.target.value);
    setPage(1);
  };

  return (
    <div className="w-full max-w-full space-y-6 font-sans pb-12 text-gray-900 overflow-x-hidden">
      
      {/* 1. PAGE HEADER */}
      <div className="flex flex-wrap gap-4 justify-between items-center border-b border-border-subtle pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-primary-600 text-white shadow-md ring-4 ring-primary-100">
              <ShoppingBag className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-gray-900">Orders & Invoices Feed</h1>
              <p className="text-xs sm:text-sm text-zinc-600 font-medium">
                Track real-time payment states, logistics fulfillment, and customer order dispatches.
              </p>
            </div>
          </div>
        </div>
        <Button 
          onClick={() => refetch()} 
          disabled={isFetching} 
          variant="outline" 
          className="rounded-2xl border-border-subtle bg-white text-gray-900 hover:bg-primary-50 text-xs sm:text-sm font-bold h-11 px-5 cursor-pointer shadow-2xs btn-modern shrink-0"
          title="Refresh orders"
        >
          <RefreshCw className={`mr-2 h-4 w-4 text-primary-600 ${isFetching ? "animate-spin" : ""}`} />
          <span>Refresh Feed</span>
        </Button>
      </div>

      {/* 2. TOP KPI CARDS GRID (PURPLE GRADIENT REVENUE & BOLD TYPOGRAPHY) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* KPI 1: Total Orders (Base Purple Mesh Gradient #9B66D4 -> #D8A5E9) */}
        <div className="rounded-[26px] bg-gradient-to-br from-[#9B66D4] via-[#B885E2] to-[#D8A5E9] p-6 text-white shadow-md flex flex-col justify-between group hover:shadow-xl transition-all duration-300">
          <div className="flex items-start justify-between">
            <h2 className="text-3xl sm:text-4xl font-black font-mono tracking-tight text-white">{stats.totalOrders}</h2>
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-white shadow-xs">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>
          <div>
            <p className="text-xs sm:text-sm font-bold text-white/90 mt-2">Total Customer Orders</p>
            {/* Smooth Wave Graph SVG */}
            <svg className="w-full h-8 opacity-80 mt-3 text-white" viewBox="0 0 100 25" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M0 18 Q20 5 40 16 T80 10 T100 14" />
            </svg>
          </div>
        </div>

        {/* KPI 2: Paid Revenue */}
        <div className="rounded-[26px] bg-bg-surface border border-border-subtle p-6 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-zinc-500">Paid Revenue</span>
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shadow-2xs">
              <CreditCard className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-black font-mono tracking-tight text-emerald-600">{formatCurrency(stats.totalRevenue)}</h3>
            <p className="text-xs text-zinc-600 font-bold mt-1">Confirmed gross order receipts</p>
          </div>
        </div>

        {/* KPI 3: Items Sold */}
        <div className="rounded-[26px] bg-bg-surface border border-border-subtle p-6 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-zinc-500">Items Sold</span>
            <div className="w-10 h-10 rounded-2xl bg-primary-50 border border-primary-200 flex items-center justify-center text-primary-600 shadow-2xs">
              <Package className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-black font-mono tracking-tight text-gray-900">{stats.totalItemsSold}</h3>
            <p className="text-xs text-zinc-600 font-bold mt-1">Total stationery units dispatched</p>
          </div>
        </div>

        {/* KPI 4: Awaiting Fulfillment */}
        <div className="rounded-[26px] bg-bg-surface border border-border-subtle p-6 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-zinc-500">Awaiting Fulfillment</span>
            <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shadow-2xs">
              <Truck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-black font-mono tracking-tight text-amber-600">
              {(stats.statusCounts?.Pending || 0) + (stats.statusCounts?.Confirmed || 0)}
            </h3>
            <p className="text-xs text-zinc-600 font-bold mt-1">Pending & confirmed dispatch queue</p>
          </div>
        </div>

      </div>

      {/* 3. SEARCH & CUSTOM FLOATING DROPDOWN DRAWERS ROW */}
      <div className="bg-bg-surface border border-border-subtle rounded-[26px] p-4 sm:p-6 space-y-4 shadow-xs">
        <div className="flex flex-col gap-3 lg:flex-row items-center justify-between">
          <div className="flex items-center w-full bg-white border border-border-subtle rounded-2xl px-4 transition-all gap-2.5 h-11 focus-within:border-primary-400 focus-within:ring-1 focus-within:ring-primary-400 shadow-2xs">
            <Search className="h-4 w-4 text-zinc-400 shrink-0" />
            <Input 
              value={search} 
              onChange={resetPage(setSearch)} 
              placeholder="Search order number or customer name..." 
              className="flex-1 bg-transparent border-none text-gray-900 placeholder-zinc-400 focus-visible:ring-0 focus-visible:ring-offset-0 focus:outline-none focus:ring-0 text-xs font-bold h-full p-0 shadow-none"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto shrink-0">
            
            {/* Custom Order Status Floating Popover Drawer */}
            <div className="relative shrink-0 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
                className="bg-white border border-border-subtle rounded-2xl h-11 px-4 text-xs font-bold text-gray-900 hover:border-primary-400 transition-all flex items-center justify-between gap-2.5 cursor-pointer w-full sm:min-w-[180px] shadow-2xs"
              >
                <span className="truncate">{status || "All order statuses"}</span>
                <ChevronDown className={`w-4 h-4 text-zinc-400 transition-transform duration-200 ${isStatusDropdownOpen ? "rotate-180 text-primary-600" : ""}`} />
              </button>
              {isStatusDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsStatusDropdownOpen(false)} />
                  <div className="absolute left-0 sm:right-0 top-12 w-52 bg-white/95 backdrop-blur-2xl border border-border-subtle rounded-2xl p-2 shadow-xl z-50 space-y-1 text-gray-900 animate-in fade-in-50 zoom-in-95 duration-150 font-sans">
                    <button
                      type="button"
                      onClick={() => { setStatus(""); setPage(1); setIsStatusDropdownOpen(false); }}
                      className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs transition-all cursor-pointer flex items-center justify-between ${
                        !status ? "bg-primary-50 text-primary-700 font-black" : "text-gray-900 hover:bg-primary-50/60 font-bold"
                      }`}
                    >
                      <span>All order statuses</span>
                      {!status && <Check className="w-3.5 h-3.5 text-primary-600" />}
                    </button>
                    {statuses.map((item) => (
                      <button
                        type="button"
                        key={item}
                        onClick={() => { setStatus(item); setPage(1); setIsStatusDropdownOpen(false); }}
                        className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs transition-all cursor-pointer flex items-center justify-between ${
                          status === item ? "bg-primary-50 text-primary-700 font-black" : "text-gray-900 hover:bg-primary-50/60 font-bold"
                        }`}
                      >
                        <span>{item}</span>
                        {status === item && <Check className="w-3.5 h-3.5 text-primary-600" />}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Custom Payment Status Floating Popover Drawer */}
            <div className="relative shrink-0 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setIsPaymentStatusDropdownOpen(!isPaymentStatusDropdownOpen)}
                className="bg-white border border-border-subtle rounded-2xl h-11 px-4 text-xs font-bold text-gray-900 hover:border-primary-400 transition-all flex items-center justify-between gap-2.5 cursor-pointer w-full sm:min-w-[190px] shadow-2xs"
              >
                <span className="truncate">{paymentStatus || "All payment statuses"}</span>
                <ChevronDown className={`w-4 h-4 text-zinc-400 transition-transform duration-200 ${isPaymentStatusDropdownOpen ? "rotate-180 text-primary-600" : ""}`} />
              </button>
              {isPaymentStatusDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsPaymentStatusDropdownOpen(false)} />
                  <div className="absolute right-0 top-12 w-56 bg-white/95 backdrop-blur-2xl border border-border-subtle rounded-2xl p-2 shadow-xl z-50 space-y-1 text-gray-900 animate-in fade-in-50 zoom-in-95 duration-150 font-sans">
                    <button
                      type="button"
                      onClick={() => { setPaymentStatus(""); setPage(1); setIsPaymentStatusDropdownOpen(false); }}
                      className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs transition-all cursor-pointer flex items-center justify-between ${
                        !paymentStatus ? "bg-primary-50 text-primary-700 font-black" : "text-gray-900 hover:bg-primary-50/60 font-bold"
                      }`}
                    >
                      <span>All payment statuses</span>
                      {!paymentStatus && <Check className="w-3.5 h-3.5 text-primary-600" />}
                    </button>
                    {paymentStatuses.map((item) => (
                      <button
                        type="button"
                        key={item}
                        onClick={() => { setPaymentStatus(item); setPage(1); setIsPaymentStatusDropdownOpen(false); }}
                        className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs transition-all cursor-pointer flex items-center justify-between ${
                          paymentStatus === item ? "bg-primary-50 text-primary-700 font-black" : "text-gray-900 hover:bg-primary-50/60 font-bold"
                        }`}
                      >
                        <span>{item}</span>
                        {paymentStatus === item && <Check className="w-3.5 h-3.5 text-primary-600" />}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

          </div>
        </div>

        {/* 4. ORDERS CARDS GRID (ENLARGED & BOLD ORDER CARDS) */}
        {isLoading ? (
          <div className="flex h-48 items-center justify-center bg-white border border-border-subtle rounded-2xl">
            <Loader2 className="h-6 w-6 animate-spin text-primary-600" />
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center p-12 border border-dashed border-border-subtle bg-white rounded-2xl space-y-2 min-h-[220px]">
            <p className="font-black text-gray-900 text-sm">No orders match these filters.</p>
            <p className="text-xs text-zinc-500 font-medium">Try clearing active search queries or status filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {orders.map((order) => {
              const totalQty = order.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
              return (
                <div 
                  key={order._id}
                  className="bg-white border border-border-subtle hover:border-primary-400 hover:shadow-xl rounded-[26px] p-6 transition-all duration-300 flex flex-col justify-between space-y-4 group text-gray-900 relative"
                >
                  {/* Top Bar: Order ID & Status Dropdowns */}
                  <div className="flex flex-wrap items-center justify-between border-b border-border-subtle pb-3.5 gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className="text-xs font-black uppercase tracking-wider text-primary-700 bg-primary-50 px-3 py-1 rounded-xl border border-primary-200 shadow-2xs">
                        Parcel
                      </span>
                      <span className="font-black text-gray-900 text-sm sm:text-base font-mono tracking-tight group-hover:text-primary-700 transition-colors">
                        {order.orderNumber}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-1 rounded-xl text-xs ${paymentStatusClasses[order.paymentStatus] || "bg-zinc-100 text-zinc-700"}`}>
                        {order.paymentStatus}
                      </span>
                      <span className={`px-3 py-1 rounded-xl text-xs ${statusClasses[order.status] || "bg-zinc-100 text-zinc-700"}`}>
                        {order.status}
                      </span>
                    </div>
                  </div>

                  {/* Customer & Order Date */}
                  <div className="flex justify-between items-start text-xs">
                    <div>
                      <span className="text-[10px] text-zinc-500 font-black uppercase tracking-wider block font-sans">Recipient Customer</span>
                      <h4 className="font-black text-gray-900 text-sm sm:text-base capitalize mt-0.5">{order.customer?.name || order.shippingAddress?.name || "Customer"}</h4>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-zinc-500 font-black uppercase tracking-wider block font-sans">Placed On</span>
                      <p className="font-bold text-zinc-700 font-mono text-xs mt-0.5">{formatDate(order.createdAt)}</p>
                    </div>
                  </div>

                  {/* Items Preview */}
                  <div className="space-y-2">
                    <span className="text-[10px] text-zinc-500 font-black uppercase tracking-wider block">Items to Pack ({totalQty})</span>
                    <div className="flex flex-wrap gap-2">
                      {order.items?.slice(0, 3).map((item, idx) => (
                        <div key={idx} className="flex items-center gap-2 bg-primary-50/60 border border-border-subtle rounded-xl p-2 max-w-[200px]">
                          <div className="w-8 h-8 rounded-lg bg-white border border-border-subtle p-0.5 shrink-0 flex items-center justify-center overflow-hidden">
                            {item.product?.images?.[0] ? (
                              <img src={item.product.images[0]} alt="" className="w-full h-full object-contain" />
                            ) : (
                              <span className="text-[8px] text-zinc-400">Item</span>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-xs text-gray-900 truncate">{item.product?.name || "Product"}</p>
                            <p className="text-[10px] text-zinc-600 font-mono font-bold">Qty: {item.quantity}</p>
                          </div>
                        </div>
                      ))}
                      {order.items?.length > 3 && (
                        <div className="flex items-center justify-center bg-zinc-100 border border-border-subtle rounded-xl px-3 py-2 text-xs font-black text-zinc-700">
                          +{order.items.length - 3} more
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card Footer: Amount & View Details Button */}
                  <div className="border-t border-border-subtle pt-4 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-zinc-500 font-black uppercase tracking-wider block font-sans">Order Total Amount</span>
                      <span className="text-base sm:text-xl font-black text-emerald-600 font-mono">{formatCurrency(order.totalAmount)}</span>
                    </div>

                    <Button
                      onClick={() => setSelectedOrderId(order._id)}
                      className="bg-primary-600 hover:bg-primary-700 text-white font-black h-10 rounded-2xl text-xs px-5 flex items-center gap-2 cursor-pointer shadow-md btn-modern"
                    >
                      <Eye className="w-4 h-4" /> View Details
                    </Button>
                  </div>

                </div>
              );
            })}
          </div>
        )}

        {/* 5. PAGINATION */}
        <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-gray-900 font-bold border-t border-border-subtle pt-5 mt-6 gap-4">
          <span className="text-zinc-600 font-bold text-xs">{pagination.total} Total Customer Orders</span>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              disabled={page <= 1} 
              onClick={() => setPage((current) => current - 1)} 
              className="h-10 px-4 rounded-2xl border border-border-subtle bg-white text-gray-900 font-black text-xs hover:bg-primary-50 hover:border-primary-300 disabled:opacity-40 transition-all cursor-pointer shadow-2xs flex items-center gap-1.5" 
              title="Previous page"
            >
              <ChevronLeft className="h-4 w-4 text-primary-600" />
              <span>Prev</span>
            </Button>

            <span className="px-3 py-2 rounded-2xl bg-primary-50 border border-primary-200 text-primary-700 font-black text-xs font-mono">
              Page {pagination.page} of {pagination.totalPages || 1}
            </span>

            <Button 
              variant="outline" 
              disabled={page >= (pagination.totalPages || 1)} 
              onClick={() => setPage((current) => current + 1)} 
              className="h-10 px-4 rounded-2xl border border-border-subtle bg-white text-gray-900 font-black text-xs hover:bg-primary-50 hover:border-primary-300 disabled:opacity-40 transition-all cursor-pointer shadow-2xs flex items-center gap-1.5" 
              title="Next page"
            >
              <span>Next</span>
              <ChevronRight className="h-4 w-4 text-primary-600" />
            </Button>
          </div>
        </div>

      </div>

      {/* SIDE DRAWER PREVIEW OVERLAY */}
      <OrderDetailDrawer 
        orderId={selectedOrderId}
        isOpen={!!selectedOrderId}
        onClose={() => setSelectedOrderId(null)}
      />

    </div>
  );
}
