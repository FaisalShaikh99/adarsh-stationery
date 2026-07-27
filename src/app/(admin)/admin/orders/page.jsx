"use client";

import { useMemo, useState } from "react";
import axios from "axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, Loader2, RefreshCw, Search, Eye, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import OrderDetailDrawer from "./OrderDetailDrawer";

const statuses = ["Pending", "Confirmed", "Shipped", "Delivered", "Cancelled"];
const paymentStatuses = ["Pending", "Paid", "Failed"];

const statusClasses = {
  Pending: "bg-amber-500/10 text-amber-300 border border-amber-500/25",
  Confirmed: "bg-sky-500/10 text-sky-300 border border-sky-500/25",
  Shipped: "bg-violet-500/10 text-violet-300 border border-violet-500/25",
  Delivered: "bg-emerald-500/10 text-emerald-300 border border-emerald-500/25",
  Cancelled: "bg-rose-500/10 text-rose-300 border border-rose-500/25",
};

const paymentStatusClasses = {
  Paid: "bg-emerald-500/10 text-emerald-300 border border-emerald-500/25",
  Pending: "bg-amber-500/10 text-amber-300 border border-amber-500/25",
  Failed: "bg-rose-500/10 text-rose-300 border border-rose-500/25",
};

function formatCurrency(amount) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount || 0);
}

export default function OrdersPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");
  const [selectedOrderId, setSelectedOrderId] = useState(null);

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
  const stats = statsResponse || { totalOrders: 0, totalRevenue: 0, totalItemsSold: 0, statusCounts: {} };

  const resetPage = (setter) => (event) => {
    setter(event.target.value);
    setPage(1);
  };

  return (
    <div className="w-full max-w-full space-y-6 font-sans pb-12 text-gray-900 overflow-x-hidden">
      {/* 1. CLEAN PAGE HEADER */}
      <div className="flex flex-wrap gap-4 justify-between items-center border-b border-border-subtle pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-primary-50 border border-primary-100 text-primary-600">
              <ShoppingBag className="h-5 w-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-gray-900">Orders & Invoices Feed</h1>
          </div>
          <p className="mt-1 text-xs sm:text-sm text-zinc-600 font-medium">
            Track real-time payment states, logistics fulfillment, and customer order dispatches.
          </p>
        </div>
        <Button 
          onClick={() => refetch()} 
          disabled={isFetching} 
          variant="outline" 
          className="rounded-xl border-border-subtle bg-bg-surface text-gray-900 hover:bg-primary-50 text-xs sm:text-sm font-semibold h-10 px-4 cursor-pointer shadow-xs btn-modern shrink-0"
          title="Refresh orders"
        >
          <RefreshCw className={`mr-2 h-4 w-4 text-primary-600 ${isFetching ? "animate-spin" : ""}`} />
          <span>Refresh Feed</span>
        </Button>
      </div>

      {/* 2. STATS CARDS GRID ROW */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          ["Total orders", stats.totalOrders],
          ["Paid revenue", formatCurrency(stats.totalRevenue)],
          ["Items sold", stats.totalItemsSold],
          ["Awaiting fulfillment", (stats.statusCounts?.Pending || 0) + (stats.statusCounts?.Confirmed || 0)],
        ].map(([label, value]) => (
          <div key={label} className="bg-bg-surface border border-border-subtle p-4 rounded-2xl shadow-xs flex flex-col justify-between">
            <div>
              <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold">{label}</p>
              <p className="text-xl font-bold mt-1 font-mono tracking-tight text-gray-900">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* 3. SEARCH & FILTERS CONTAINER */}
      <div className="bg-bg-surface border border-border-subtle rounded-2xl p-4 space-y-3 shadow-xs">
        <div className="flex flex-col gap-3 lg:flex-row items-center justify-between">
          <div className="flex items-center w-full bg-bg-surface border border-border-subtle rounded-xl px-3 transition-all gap-2 h-9 focus-within:border-primary-400">
            <Search className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
            <Input 
              value={search} 
              onChange={resetPage(setSearch)} 
              placeholder="Search order number or customer..." 
              className="flex-1 bg-transparent border-none text-gray-900 placeholder-zinc-400 focus-visible:ring-0 text-xs h-full p-0 shadow-none"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto shrink-0">
            <select 
              value={status} 
              onChange={resetPage(setStatus)} 
              className="h-9 bg-bg-surface border border-border-subtle rounded-xl px-3 text-xs font-semibold text-gray-900 hover:border-primary-400 transition-all outline-none cursor-pointer w-full sm:w-auto sm:min-w-[170px]"
            >
              <option value="" className="bg-white text-zinc-600">All order statuses</option>
              {statuses.map((item) => (
                <option key={item} value={item} className="bg-white text-gray-900">{item}</option>
              ))}
            </select>
            <select 
              value={paymentStatus} 
              onChange={resetPage(setPaymentStatus)} 
              className="h-9 bg-bg-surface border border-border-subtle rounded-xl px-3 text-xs font-semibold text-gray-900 hover:border-primary-400 transition-all outline-none cursor-pointer w-full sm:w-auto sm:min-w-[170px]"
            >
              <option value="" className="bg-white text-zinc-600">All payment statuses</option>
              {paymentStatuses.map((item) => (
                <option key={item} value={item} className="bg-white text-gray-900">{item}</option>
              ))}
            </select>
          </div>
        </div>

        {/* 4. ORDERS WORKSPACE CARDS */}
        {isLoading ? (
          <div className="flex h-40 items-center justify-center bg-bg-surface border border-border-subtle rounded-2xl">
            <Loader2 className="h-6 w-6 animate-spin text-primary-600" />
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center p-10 border border-dashed border-border-subtle bg-bg-surface rounded-2xl space-y-1.5 min-h-[220px]">
            <p className="font-semibold text-zinc-600 text-xs">No orders match these filters.</p>
            <p className="text-[11px] text-zinc-500">Try clearing active search queries or status filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {orders.map((order) => {
              const totalQty = order.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
              return (
                <div 
                  key={order._id}
                  className="bg-bg-surface border border-border-subtle rounded-2xl p-4 hover:border-primary-300 transition-all duration-200 shadow-xs flex flex-col justify-between space-y-3"
                >
                  {/* Header Row */}
                  {/* Top Bar: Order ID & Status Dropdown */}
                  <div className="flex items-center justify-between border-b border-border-subtle pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-primary-700 bg-primary-50 px-2 py-0.5 rounded border border-primary-200">Parcel</span>
                      <span className="font-extrabold text-gray-900 text-xs font-mono">{order.orderNumber}</span>
                    </div>

                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border uppercase tracking-wider ${paymentStatusClasses[order.paymentStatus] || "bg-zinc-100 text-zinc-700 border-zinc-200"}`}>
                        {order.paymentStatus}
                      </span>
                      <select 
                        value={order.status} 
                        disabled={statusMutation.isPending || ["Delivered", "Cancelled"].includes(order.status)} 
                        onChange={(event) => statusMutation.mutate({ id: order._id, nextStatus: event.target.value })} 
                        className={`border px-2 py-0.5 text-[11px] font-bold rounded-lg outline-none cursor-pointer disabled:cursor-not-allowed transition-all ${statusClasses[order.status] || "border-border-subtle text-gray-900"}`}
                      >
                        <option value={order.status} className="bg-white text-gray-900">{order.status}</option>
                        {statuses.filter((item) => item !== order.status).map((item) => (
                          <option key={item} value={item} className="bg-white text-gray-900">{item}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Content Details */}
                  <div className="space-y-2 text-xs flex-1">
                    <div className="flex items-center justify-between text-xs">
                      <div>
                        <p className="text-[9px] text-zinc-500 uppercase tracking-wider font-bold">Recipient Customer</p>
                        <p className="font-extrabold text-gray-900 text-xs capitalize">{order.customer?.name || "Customer unavailable"}</p>
                        <p className="font-mono text-[10px] text-zinc-500">{order.customer?.email || ""}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[9px] text-zinc-500 uppercase tracking-wider font-bold">Placed On</p>
                        <p className="font-mono text-[10px] text-zinc-500">
                          {new Date(order.createdAt).toLocaleDateString("en-IN", { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-1 pt-1">
                      <p className="text-[9px] text-zinc-500 uppercase tracking-wider font-bold">Items to Pack ({totalQty})</p>
                      <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto custom-scrollbar">
                        {order.items?.map((item, idx) => (
                          <div key={idx} className="flex items-center gap-1.5 bg-white/80 border border-border-subtle rounded-xl p-1.5 max-w-[190px] shrink-0 shadow-2xs">
                            <div className="relative w-7 h-7 rounded-lg bg-white border border-border-subtle p-0.5 shrink-0 flex items-center justify-center overflow-hidden">
                              {item.product?.images?.[0] ? (
                                <img 
                                  src={item.product.images[0]} 
                                  className="w-full h-full object-contain" 
                                  alt={item.product.name} 
                                  referrerPolicy="no-referrer"
                                />
                              ) : (
                                <span className="text-[8px] text-zinc-400 font-mono">No img</span>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-bold text-gray-900 truncate capitalize text-[10px]">{item.product?.name || "Product Info"}</p>
                              <p className="text-[9px] text-zinc-600 font-mono">Qty: {item.quantity}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Footer Row */}
                  <div className="flex items-center justify-between border-t border-border-subtle pt-2.5 text-xs">
                    <div className="font-mono font-bold text-zinc-600">
                      Amount: <span className="text-emerald-600 text-xs sm:text-sm font-extrabold">{formatCurrency(order.totalAmount)}</span>
                    </div>
                    
                    <Button
                      onClick={() => setSelectedOrderId(order._id)}
                      variant="outline"
                      className="border-border-subtle bg-bg-surface text-gray-900 hover:text-primary-700 hover:bg-primary-50 rounded-xl text-xs font-semibold h-7 px-3 cursor-pointer btn-modern"
                    >
                      <Eye className="w-3.5 h-3.5 mr-1 text-primary-600" /> View Details
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* PAGINATION ROW */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-zinc-800 pt-3 text-xs">
            <p className="text-zinc-500 text-[11px]">
              Page <span className="text-zinc-200 font-bold">{pagination.page}</span> of{" "}
              <span className="text-zinc-200 font-bold">{pagination.totalPages}</span> ({pagination.total} orders)
            </p>
            <div className="flex gap-1.5">
              <Button
                disabled={page === 1}
                onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                variant="outline"
                className="h-7 px-2.5 text-xs border-zinc-800 bg-zinc-900 text-zinc-300 hover:text-white disabled:opacity-40"
              >
                <ChevronLeft className="w-3.5 h-3.5 mr-1" /> Prev
              </Button>
              <Button
                disabled={page >= pagination.totalPages}
                onClick={() => setPage(prev => Math.min(prev + 1, pagination.totalPages))}
                variant="outline"
                className="h-7 px-2.5 text-xs border-zinc-800 bg-zinc-900 text-zinc-300 hover:text-white disabled:opacity-40"
              >
                Next <ChevronRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* RIGHT-SIDE ORDER DETAIL DRAWER */}
      <OrderDetailDrawer 
        orderId={selectedOrderId} 
        isOpen={!!selectedOrderId} 
        onClose={() => setSelectedOrderId(null)} 
      />
    </div>
  );
}
