"use client";

import { useMemo, useState } from "react";
import axios from "axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, Loader2, RefreshCw, Search, Eye } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

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
  const router = useRouter();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");

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
    <div className="mx-auto w-full max-w-7xl space-y-6">
      {/* 1. TOP NAVBAR */}
      <div className="flex flex-wrap gap-3 justify-between items-center border-b border-zinc-800 pb-5">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white">Orders & Invoices</h1>
          <p className="mt-1 text-xs text-zinc-400">Track payments, fulfillment, and customer orders.</p>
        </div>
        <Button 
          onClick={() => refetch()} 
          disabled={isFetching} 
          variant="outline" 
          className="h-9 w-9 p-0 border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white shrink-0 rounded-xl hover:bg-zinc-800"
          title="Refresh orders"
        >
          <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {/* 2. STATS CARDS GRID ROW */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          ["Total orders", stats.totalOrders],
          ["Paid revenue", formatCurrency(stats.totalRevenue)],
          ["Items sold", stats.totalItemsSold],
          ["Awaiting fulfillment", (stats.statusCounts?.Pending || 0) + (stats.statusCounts?.Confirmed || 0)],
        ].map(([label, value]) => (
          <div key={label} className="bg-[#0c0c0e] border border-zinc-800/80 p-5 rounded-2xl shadow-sm flex flex-col justify-between min-h-[105px]">
            <div>
              <p className="text-xs text-zinc-500 uppercase tracking-wider font-bold">{label}</p>
              <p className="text-2xl font-bold mt-2 font-mono tracking-tight text-white">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* 3. SEARCH & FILTERS CONTAINER */}
      <div className="bg-[#0c0c0e] border border-zinc-800 rounded-2xl p-4 sm:p-6 space-y-4 shadow-xl">
        <div className="flex flex-col gap-3 lg:flex-row items-center justify-between">
          <div className="flex items-center w-full bg-[#141416] border border-zinc-700 rounded-xl px-3.5 transition-all gap-2 h-11 focus-within:border-zinc-500 focus-within:ring-1 focus-within:ring-zinc-500">
            <Search className="h-4 w-4 text-zinc-500 shrink-0" />
            <Input 
              value={search} 
              onChange={resetPage(setSearch)} 
              placeholder="Search order number or customer..." 
              className="flex-1 bg-transparent border-none text-zinc-300 placeholder-zinc-500 focus-visible:ring-0 focus-visible:ring-offset-0 focus:outline-none focus:ring-0 text-xs h-full p-0 shadow-none"
            />
          </div>
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto shrink-0">
            <select 
              value={status} 
              onChange={resetPage(setStatus)} 
              className="h-11 bg-[#141416] border border-zinc-700 rounded-xl px-4 text-xs font-semibold text-zinc-300 hover:text-white hover:border-zinc-500 transition-all outline-none cursor-pointer w-full sm:w-auto sm:min-w-[180px]"
            >
              <option value="" className="bg-zinc-950 text-zinc-400">All order statuses</option>
              {statuses.map((item) => (
                <option key={item} value={item} className="bg-zinc-950 text-zinc-200">{item}</option>
              ))}
            </select>
            <select 
              value={paymentStatus} 
              onChange={resetPage(setPaymentStatus)} 
              className="h-11 bg-[#141416] border border-zinc-700 rounded-xl px-4 text-xs font-semibold text-zinc-300 hover:text-white hover:border-zinc-500 transition-all outline-none cursor-pointer w-full sm:w-auto sm:min-w-[180px]"
            >
              <option value="" className="bg-zinc-950 text-zinc-400">All payment statuses</option>
              {paymentStatuses.map((item) => (
                <option key={item} value={item} className="bg-zinc-950 text-zinc-200">{item}</option>
              ))}
            </select>
          </div>
        </div>

        {/* 4. ORDERS WORKSPACE CARDS */}
        {isLoading ? (
          <div className="flex h-48 items-center justify-center bg-[#0c0c0e]/30 border border-zinc-805 border-zinc-800 rounded-2xl">
            <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center p-12 border border-dashed border-zinc-805 border-zinc-800 bg-[#0c0c0e]/30 rounded-2xl space-y-2 min-h-[250px]">
            <p className="font-semibold text-zinc-400">No orders match these filters.</p>
            <p className="text-xs text-zinc-500">Try clearing active search queries or status filters.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const totalQty = order.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
              return (
                <div 
                  key={order._id}
                  className="bg-[#0c0c0e]/60 border border-zinc-805 border-zinc-800 rounded-2xl p-5 hover:border-zinc-700 hover:bg-zinc-900/10 transition-all duration-200 shadow-sm space-y-4"
                >
                  {/* Header Row */}
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800/60 pb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] bg-zinc-900 border border-zinc-805 border-zinc-800 px-2.5 py-0.5 rounded-md text-zinc-400 font-mono font-semibold uppercase tracking-wider">
                        Parcel
                      </span>
                      <button 
                        onClick={() => router.push(`/admin/orders/${order._id}`)}
                        className="text-sm font-bold text-white hover:text-blue-400 transition-colors hover:underline"
                      >
                        {order.orderNumber}
                      </button>
                      <span className="text-zinc-500 font-mono text-xs">
                        {new Date(order.createdAt).toLocaleDateString("en-IN", { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                      <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold border uppercase tracking-wider ${paymentStatusClasses[order.paymentStatus] || "bg-zinc-800 text-zinc-450 border-zinc-700"}`}>
                        {order.paymentStatus}
                      </span>
                      <select 
                        value={order.status} 
                        disabled={statusMutation.isPending || ["Delivered", "Cancelled"].includes(order.status)} 
                        onChange={(event) => statusMutation.mutate({ id: order._id, nextStatus: event.target.value })} 
                        className={`border px-2.5 py-1 text-xs font-semibold rounded-lg outline-none cursor-pointer disabled:cursor-not-allowed transition-all ${statusClasses[order.status] || "border-zinc-700 text-zinc-300"}`}
                      >
                        <option value={order.status} className="bg-zinc-950 text-zinc-200">{order.status}</option>
                        {statuses.filter((item) => item !== order.status).map((item) => (
                          <option key={item} value={item} className="bg-zinc-950 text-zinc-200">{item}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Main Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-zinc-300">
                    {/* Customer */}
                    <div className="space-y-1">
                      <p className="text-[9px] text-zinc-500 uppercase tracking-wider font-bold">Recipient Customer</p>
                      <p className="font-bold text-zinc-200 text-sm capitalize">{order.customer?.name || "Customer unavailable"}</p>
                      <p className="font-mono text-[11px] text-zinc-400">{order.customer?.email || ""}</p>
                    </div>

                    {/* Items */}
                    <div className="space-y-2 md:col-span-2">
                      <p className="text-[9px] text-zinc-500 uppercase tracking-wider font-bold">Items to Pack & Dispatch ({totalQty})</p>
                      <div className="flex flex-wrap gap-2.5">
                        {order.items?.map((item, idx) => (
                          <div key={idx} className="flex items-center gap-2 bg-zinc-900/50 border border-zinc-800 rounded-xl p-2 max-w-[200px] shrink-0">
                            <div className="relative w-8 h-8 rounded-lg bg-white border border-zinc-800 p-0.5 shrink-0 flex items-center justify-center overflow-hidden">
                              {item.product?.images?.[0] ? (
                                <img 
                                  src={item.product.images[0]} 
                                  className="w-full h-full object-contain" 
                                  alt={item.product.name} 
                                  referrerPolicy="no-referrer"
                                />
                              ) : (
                                <span className="text-[8px] text-zinc-500 font-mono">No img</span>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-bold text-zinc-200 truncate capitalize text-[10px]">{item.product?.name || "Product Info"}</p>
                              <p className="text-[10px] text-zinc-400 font-mono">Qty: {item.quantity}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Footer Row */}
                  <div className="flex items-center justify-between border-t border-zinc-900 pt-3 text-xs">
                    <div className="font-mono font-bold text-zinc-305 text-zinc-300">
                      Amount: <span className="text-blue-400 text-sm font-extrabold">{formatCurrency(order.totalAmount)}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={() => router.push(`/admin/orders/${order._id}`)}
                        variant="outline"
                        className="border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-white rounded-xl text-xs font-semibold h-8 px-3 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5 mr-1" /> View Fulfillment details
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 5. PAGINATION CONTROLS */}
        <div className="flex items-center justify-between text-xs text-zinc-500 font-mono border-t border-zinc-800/80 pt-5 mt-4">
          <span>{pagination.total} total orders</span>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="icon" 
              disabled={page <= 1} 
              onClick={() => setPage((current) => current - 1)} 
              className="h-8 w-8 rounded-lg border border-zinc-800 bg-zinc-900/45 flex items-center justify-center text-zinc-450 hover:text-white disabled:opacity-30 disabled:hover:text-zinc-450 transition-all cursor-pointer hover:border-zinc-700" 
              title="Previous page"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-zinc-400">Page {pagination.page} of {pagination.totalPages || 1}</span>
            <Button 
              variant="outline" 
              size="icon" 
              disabled={page >= (pagination.totalPages || 1)} 
              onClick={() => setPage((current) => current + 1)} 
              className="h-8 w-8 rounded-lg border border-zinc-800 bg-zinc-900/45 flex items-center justify-center text-zinc-450 hover:text-white disabled:opacity-30 disabled:hover:text-zinc-450 transition-all cursor-pointer hover:border-zinc-700" 
              title="Next page"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
