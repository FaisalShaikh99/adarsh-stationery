"use client";

import { useMemo, useState } from "react";
import axios from "axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, Loader2, RefreshCw, Search, Eye } from "lucide-react";
import Link from "next/link";
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

        {/* 4. ORDERS TABLE */}
        <div className="overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-900/10">
          <Table>
            <TableHeader className="bg-zinc-900/40">
              <TableRow className="border-b border-zinc-800 hover:bg-transparent">
                <TableHead className="font-semibold text-zinc-400">Order</TableHead>
                <TableHead className="font-semibold text-zinc-400">Customer</TableHead>
                <TableHead className="font-semibold text-zinc-400">Items</TableHead>
                <TableHead className="font-semibold text-zinc-400">Amount</TableHead>
                <TableHead className="font-semibold text-zinc-400">Payment</TableHead>
                <TableHead className="font-semibold text-zinc-400">Status</TableHead>
                <TableHead className="font-semibold text-zinc-400 text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-48 text-center text-zinc-450">
                    <Loader2 className="mx-auto h-5 w-5 animate-spin text-zinc-500" />
                  </TableCell>
                </TableRow>
              ) : orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-48 text-center text-sm text-zinc-500">
                    No orders match these filters.
                  </TableCell>
                </TableRow>
              ) : orders.map((order) => (
                <TableRow key={order._id} className="border-b border-zinc-800/60 hover:bg-zinc-900/20 transition-colors">
                  <TableCell className="py-4">
                    <p className="font-bold tracking-tight text-sm text-zinc-100">{order.orderNumber}</p>
                    <p className="mt-1 text-xs text-zinc-400">{new Date(order.createdAt).toLocaleDateString("en-IN")}</p>
                  </TableCell>
                  <TableCell className="py-4">
                    <p className="font-semibold text-zinc-200">{order.customer?.name || "Customer unavailable"}</p>
                    <p className="mt-1 text-xs text-zinc-400">{order.customer?.email || ""}</p>
                  </TableCell>
                  <TableCell className="text-zinc-300 py-4 font-mono">
                    {order.items?.reduce((sum, item) => sum + item.quantity, 0) || 0}
                  </TableCell>
                  <TableCell className="font-mono text-zinc-100 py-4">
                    {formatCurrency(order.totalAmount)}
                  </TableCell>
                  <TableCell className="py-4">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${paymentStatusClasses[order.paymentStatus] || "bg-zinc-800 text-zinc-450 border-zinc-700"}`}>
                      {order.paymentStatus}
                    </span>
                  </TableCell>
                  <TableCell className="py-4">
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
                  </TableCell>
                  <TableCell className="py-4 text-center">
                    <Link href={`/admin/orders/${order._id}`} passHref>
                      <Button variant="ghost" className="p-1 h-auto text-zinc-450 hover:text-white hover:bg-transparent transition-colors" title="View Details">
                        <Eye className="w-4 h-4" />
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

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
