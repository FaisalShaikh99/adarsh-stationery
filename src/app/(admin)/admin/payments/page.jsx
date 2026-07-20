"use client";

import { useMemo, useState } from "react";
import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { 
  ChevronLeft, 
  ChevronRight, 
  Loader2, 
  RefreshCw, 
  Search, 
  CreditCard, 
  CheckCircle2, 
  AlertCircle, 
  XCircle 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const paymentStatusClasses = {
  Paid: "bg-emerald-500/10 text-emerald-300 border border-emerald-500/25",
  Pending: "bg-amber-500/10 text-amber-300 border border-amber-500/25",
  Failed: "bg-rose-500/10 text-rose-300 border border-rose-500/25",
};

const paymentTypeClasses = {
  COD: "bg-zinc-800 text-zinc-300 border border-zinc-700",
  UPI: "bg-blue-500/10 text-blue-300 border border-blue-500/25",
  Card: "bg-violet-500/10 text-violet-300 border border-violet-500/25",
  NetBanking: "bg-sky-500/10 text-sky-300 border border-sky-500/25",
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

export default function PaymentsPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");

  const queryParams = useMemo(() => ({ page, limit: 10, search, paymentStatus, paymentMethod }), [page, search, paymentStatus, paymentMethod]);
  
  const { data: paymentsResponse, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["payments", queryParams],
    queryFn: async () => (await axios.get("/api/admin/payments", { params: queryParams })).data.data,
  });

  const payments = paymentsResponse?.payments || [];
  const stats = paymentsResponse?.stats || {
    totalPaid: 0,
    totalPending: 0,
    totalFailed: 0,
    totalPaidAmount: 0,
    totalPendingAmount: 0,
    totalFailedAmount: 0
  };
  const pagination = paymentsResponse?.pagination || { page: 1, totalPages: 1, total: 0 };

  const resetPage = (setter) => (event) => {
    setter(event.target.value);
    setPage(1);
  };

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      
      {/* 1. TOP NAVBAR */}
      <div className="flex flex-wrap gap-3 justify-between items-center border-b border-zinc-800 pb-5">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-zinc-400" /> Payment Transactions
          </h1>
          <p className="mt-1 text-xs text-zinc-400">Monitor payment statuses, methods, and transaction details.</p>
        </div>
        <Button 
          onClick={() => refetch()} 
          disabled={isFetching} 
          variant="outline" 
          className="h-9 w-9 p-0 border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white shrink-0 rounded-xl hover:bg-zinc-800"
          title="Refresh transactions"
        >
          <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {/* 2. STATS CARDS GRID */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: "Total Paid", value: stats.totalPaid, color: "text-emerald-400", icon: CheckCircle2 },
          { label: "Total Pending", value: stats.totalPending, color: "text-amber-400", icon: AlertCircle },
          { label: "Total Failed", value: stats.totalFailed, color: "text-rose-400", icon: XCircle },
          { label: "Paid Amount", value: formatCurrency(stats.totalPaidAmount), color: "text-emerald-400", icon: CheckCircle2 },
          { label: "Pending Amount", value: formatCurrency(stats.totalPendingAmount), color: "text-amber-400", icon: AlertCircle },
          { label: "Failed Amount", value: formatCurrency(stats.totalFailedAmount), color: "text-rose-400", icon: XCircle },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="bg-[#0c0c0e] border border-zinc-800/80 p-4 rounded-2xl shadow-sm flex flex-col justify-between min-h-[95px]">
              <div>
                <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold">{item.label}</p>
                <p className={`text-lg font-bold mt-2 font-mono tracking-tight ${item.color}`}>{item.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. SEARCH & FILTERS CONTAINER */}
      <div className="bg-[#0c0c0e] border border-zinc-800 rounded-2xl p-4 sm:p-6 space-y-4 shadow-xl">
        <div className="flex flex-col gap-3 lg:flex-row items-center justify-between">
          <div className="flex items-center w-full bg-[#141416] border border-zinc-700 rounded-xl px-3.5 transition-all gap-2 h-11 focus-within:border-zinc-500 focus-within:ring-1 focus-within:ring-zinc-500">
            <Search className="h-4 w-4 text-zinc-500 shrink-0" />
            <Input 
              value={search} 
              onChange={resetPage(setSearch)} 
              placeholder="Search by order number, customer name, or payment ID..." 
              className="flex-1 bg-transparent border-none text-zinc-300 placeholder-zinc-500 focus-visible:ring-0 focus-visible:ring-offset-0 focus:outline-none focus:ring-0 text-xs h-full p-0 shadow-none"
            />
          </div>
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto shrink-0">
            <select 
              value={paymentStatus} 
              onChange={resetPage(setPaymentStatus)} 
              className="h-11 bg-[#141416] border border-zinc-700 rounded-xl px-4 text-xs font-semibold text-zinc-300 hover:text-white hover:border-zinc-500 transition-all outline-none cursor-pointer w-full sm:w-auto sm:min-w-[180px]"
            >
              <option value="" className="bg-zinc-950 text-zinc-400">All payment statuses</option>
              <option value="Paid" className="bg-zinc-950 text-zinc-200">Paid</option>
              <option value="Pending" className="bg-zinc-950 text-zinc-200">Pending</option>
              <option value="Failed" className="bg-zinc-950 text-zinc-200">Failed</option>
            </select>
            <select 
              value={paymentMethod} 
              onChange={resetPage(setPaymentMethod)} 
              className="h-11 bg-[#141416] border border-zinc-700 rounded-xl px-4 text-xs font-semibold text-zinc-300 hover:text-white hover:border-zinc-500 transition-all outline-none cursor-pointer w-full sm:w-auto sm:min-w-[180px]"
            >
              <option value="" className="bg-zinc-950 text-zinc-400">All payment methods</option>
              <option value="UPI" className="bg-zinc-950 text-zinc-200">UPI</option>
              <option value="COD" className="bg-zinc-950 text-zinc-200">COD</option>
              <option value="Card" className="bg-zinc-950 text-zinc-200">Card</option>
              <option value="NetBanking" className="bg-zinc-950 text-zinc-200">NetBanking</option>
            </select>
          </div>
        </div>

        {/* 4. PAYMENTS TABLE */}
        <div className="overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-900/10">
          <Table>
            <TableHeader className="bg-zinc-900/40">
              <TableRow className="border-b border-zinc-800 hover:bg-transparent">
                <TableHead className="font-semibold text-zinc-400">Order Number</TableHead>
                <TableHead className="font-semibold text-zinc-400">Customer Name</TableHead>
                <TableHead className="font-semibold text-zinc-400">Payment ID</TableHead>
                <TableHead className="font-semibold text-zinc-400">Amount</TableHead>
                <TableHead className="font-semibold text-zinc-400">Payment Method</TableHead>
                <TableHead className="font-semibold text-zinc-400">Status</TableHead>
                <TableHead className="font-semibold text-zinc-400">Payment Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-48 text-center text-zinc-450">
                    <Loader2 className="mx-auto h-5 w-5 animate-spin text-zinc-500" />
                  </TableCell>
                </TableRow>
              ) : payments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-48 text-center text-sm text-zinc-500">
                    No transactions match these filters.
                  </TableCell>
                </TableRow>
              ) : payments.map((payment) => (
                <TableRow 
                  key={payment._id} 
                  onClick={() => router.push(`/admin/orders/${payment._id}`)}
                  className="border-b border-zinc-800/60 hover:bg-zinc-900/20 transition-colors cursor-pointer"
                >
                  <TableCell className="py-4 font-bold font-mono text-zinc-100 text-xs sm:text-sm">
                    {payment.orderNumber}
                  </TableCell>
                  <TableCell className="py-4 font-semibold text-zinc-200">
                    {payment.customer?.name || "Customer unavailable"}
                  </TableCell>
                  <TableCell className="py-4 text-zinc-350 font-mono text-xs">
                    {payment.paymentId || <span className="text-zinc-650">—</span>}
                  </TableCell>
                  <TableCell className="py-4 text-zinc-100 font-mono">
                    {formatCurrency(payment.totalAmount)}
                  </TableCell>
                  <TableCell className="py-4">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${paymentTypeClasses[payment.paymentMethod] || "bg-zinc-800 text-zinc-450 border-zinc-700"}`}>
                      {payment.paymentMethod}
                    </span>
                  </TableCell>
                  <TableCell className="py-4">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${paymentStatusClasses[payment.paymentStatus] || "bg-zinc-800 text-zinc-455 border-zinc-700"}`}>
                      {payment.paymentStatus}
                    </span>
                  </TableCell>
                  <TableCell className="py-4 text-zinc-400 text-xs font-mono">
                    {formatDate(payment.createdAt)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* 5. PAGINATION CONTROLS */}
        <div className="flex items-center justify-between text-xs text-zinc-500 font-mono border-t border-zinc-800/80 pt-5 mt-4">
          <span>{pagination.total} total transactions</span>
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
