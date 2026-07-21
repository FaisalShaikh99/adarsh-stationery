"use client";

import { useMemo, useState } from "react";
import axios from "axios";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { jsPDF } from "jspdf";
import { 
  ChevronLeft, 
  ChevronRight, 
  Loader2, 
  RefreshCw, 
  Search, 
  CreditCard, 
  CheckCircle2, 
  AlertCircle, 
  XCircle, 
  TrendingUp, 
  RotateCcw, 
  FileText, 
  ArrowUpRight, 
  ArrowDownRight, 
  Plus, 
  Bot, 
  Percent, 
  HelpCircle,
  PiggyBank
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";

const paymentStatusClasses = {
  Paid: "bg-emerald-500/10 text-emerald-300 border border-emerald-500/25",
  Pending: "bg-amber-500/10 text-amber-300 border border-amber-500/25",
  Failed: "bg-rose-500/10 text-rose-300 border border-rose-500/25",
  Refunded: "bg-purple-500/10 text-purple-300 border border-purple-500/25",
  "Partially Refunded": "bg-indigo-500/10 text-indigo-305 border border-indigo-500/25",
  Cancelled: "bg-zinc-800 text-zinc-400 border border-zinc-700",
};

const paymentTypeClasses = {
  COD: "bg-zinc-850 text-zinc-300 border border-zinc-700",
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
  const queryClient = useQueryClient();
  
  // Navigation Tabs
  const [activeTab, setActiveTab] = useState("overview");

  // State filters for transactions tab
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");

  // Modals visibility
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [showSettlementModal, setShowSettlementModal] = useState(false);

  // Form states
  const [refundForm, setRefundForm] = useState({ paymentId: "", amount: "", reason: "" });
  const [settlementForm, setSettlementForm] = useState({ settlementId: "", gateway: "Razorpay", amount: "", bank: "", settlementDate: "", payments: "" });

  const queryParams = useMemo(() => ({ page, limit: 10, search, paymentStatus, paymentMethod }), [page, search, paymentStatus, paymentMethod]);
  
  // Queries
  const { data: paymentsResponse, isLoading: isPaymentsLoading, isFetching: isPaymentsFetching, refetch: refetchPayments } = useQuery({
    queryKey: ["payments", queryParams],
    queryFn: async () => (await axios.get("/api/admin/payments", { params: queryParams })).data.data,
  });

  const { data: statsResponse, isLoading: isStatsLoading, refetch: refetchStats } = useQuery({
    queryKey: ["paymentsStats"],
    queryFn: async () => (await axios.get("/api/admin/payments/stats")).data.data,
  });

  const { data: refundsResponse, isLoading: isRefundsLoading, refetch: refetchRefunds } = useQuery({
    queryKey: ["paymentsRefunds"],
    queryFn: async () => (await axios.get("/api/admin/payments/refunds")).data.data,
    enabled: activeTab === "refunds" || showRefundModal,
  });

  const { data: settlementsResponse, isLoading: isSettlementsLoading, refetch: refetchSettlements } = useQuery({
    queryKey: ["paymentsSettlements"],
    queryFn: async () => (await axios.get("/api/admin/payments/settlements")).data.data,
    enabled: activeTab === "settlements" || showSettlementModal,
  });

  const { data: invoicesResponse, isLoading: isInvoicesLoading, refetch: refetchInvoices } = useQuery({
    queryKey: ["paymentsInvoices"],
    queryFn: async () => (await axios.get("/api/admin/payments/invoices")).data.data,
    enabled: activeTab === "invoices",
  });

  // Mutations
  const refundMutation = useMutation({
    mutationFn: async ({ paymentId, amount, reason }) => {
      return (await axios.post(`/api/admin/payments/${paymentId}/refund`, { refundAmount: amount, reason })).data;
    },
    onSuccess: () => {
      toast.success("Refund processed successfully!");
      setShowRefundModal(false);
      setRefundForm({ paymentId: "", amount: "", reason: "" });
      queryClient.invalidateQueries(["payments"]);
      queryClient.invalidateQueries(["paymentsStats"]);
      queryClient.invalidateQueries(["paymentsRefunds"]);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to process refund");
    }
  });

  const settlementMutation = useMutation({
    mutationFn: async (settlementData) => {
      // Split payment IDs by comma
      const paymentsArr = settlementData.payments.split(",").map(p => p.trim()).filter(Boolean);
      return (await axios.post("/api/admin/payments/settlements", {
        ...settlementData,
        payments: paymentsArr
      })).data;
    },
    onSuccess: () => {
      toast.success("Settlement logged successfully!");
      setShowSettlementModal(false);
      setSettlementForm({ settlementId: "", gateway: "Razorpay", amount: "", bank: "", settlementDate: "", payments: "" });
      queryClient.invalidateQueries(["paymentsSettlements"]);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to log settlement");
    }
  });

  const markAsPaidMutation = useMutation({
    mutationFn: async (paymentId) => {
      return (await axios.patch(`/api/admin/payments/${paymentId}`, { status: "Paid", remarks: "Marked as Paid manually by Admin" })).data;
    },
    onSuccess: () => {
      toast.success("Payment status set to Paid");
      queryClient.invalidateQueries(["payments"]);
      queryClient.invalidateQueries(["paymentsStats"]);
    },
    onError: (error) => {
      toast.error("Failed to update status");
    }
  });

  // Extract variables
  const payments = paymentsResponse?.payments || [];
  const pagination = paymentsResponse?.pagination || { page: 1, totalPages: 1, total: 0 };
  
  const stats = statsResponse || {
    totalPaid: 0,
    totalPending: 0,
    totalFailed: 0,
    totalPaidAmount: 0,
    totalPendingAmount: 0,
    totalFailedAmount: 0,
    revenueTotal: 0,
    expenseTotal: 0,
    methodsSummary: {},
    monthlySummary: [],
    weeklySummary: []
  };

  const refunds = refundsResponse || [];
  const settlements = settlementsResponse || [];
  const invoices = invoicesResponse || [];

  const handleRefresh = () => {
    refetchPayments();
    refetchStats();
    if (activeTab === "refunds") refetchRefunds();
    if (activeTab === "settlements") refetchSettlements();
    if (activeTab === "invoices") refetchInvoices();
    toast.success("Finance ledger re-synced");
  };

  const downloadInvoicePDF = (inv) => {
    const order = inv.order;
    if (!order) {
      toast.error("Linked order not found for this invoice.");
      return;
    }

    const doc = new jsPDF();

    // Print Header
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text("Adarsh Stationery", 14, 20);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Premium Stationery & Office Supplies", 14, 26);
    doc.line(14, 29, 196, 29); // Draw dividing line

    // Order Details
    doc.setFont("helvetica", "bold");
    doc.text("INVOICE", 14, 38);
    doc.setFont("helvetica", "normal");
    doc.text(`Invoice No: ${inv.invoiceNumber}`, 14, 44);
    doc.text(`Order ID: ${order.orderNumber}`, 14, 50);
    doc.text(`Date Placed: ${formatDate(order.createdAt)}`, 14, 56);

    // Billing & Shipping Info
    doc.setFont("helvetica", "bold");
    doc.text("Shipping To:", 110, 38);
    doc.setFont("helvetica", "normal");
    doc.text(order.shippingAddress.name, 110, 44);
    doc.text(`Phone: ${order.shippingAddress.phone}`, 110, 50);
    doc.text(order.shippingAddress.addressLine1, 110, 56);
    if (order.shippingAddress.addressLine2) {
      doc.text(order.shippingAddress.addressLine2, 110, 62);
    }
    const cityStateZip = `${order.shippingAddress.city}, ${order.shippingAddress.state} - ${order.shippingAddress.pincode}`;
    doc.text(cityStateZip, 110, order.shippingAddress.addressLine2 ? 68 : 62);

    // Items Table Header
    let y = order.shippingAddress.addressLine2 ? 80 : 74;
    doc.line(14, y - 6, 196, y - 6);

    doc.setFont("helvetica", "bold");
    doc.text("Item Description", 14, y);
    doc.text("Qty", 120, y, { align: "center" });
    doc.text("Price", 150, y, { align: "right" });
    doc.text("Subtotal", 190, y, { align: "right" });

    doc.line(14, y + 2, 196, y + 2);
    doc.setFont("helvetica", "normal");

    // Items List
    y += 8;
    order.items?.forEach((item) => {
      // Truncate name if it's too long
      const cleanName = item.productName.length > 55 ? `${item.productName.substring(0, 52)}...` : item.productName;
      doc.text(cleanName, 14, y);
      doc.text(String(item.quantity), 120, y, { align: "center" });
      doc.text(`INR ${item.pricePerUnit.toFixed(2)}`, 150, y, { align: "right" });
      doc.text(`INR ${item.subtotal.toFixed(2)}`, 190, y, { align: "right" });
      y += 8;
    });

    doc.line(14, y + 2, 196, y + 2);
    y += 10;

    // Total Amount
    doc.setFont("helvetica", "bold");
    doc.text("Total Amount:", 140, y);
    doc.text(`INR ${order.totalAmount.toFixed(2)}`, 190, y, { align: "right" });

    // Save document
    doc.save(`${inv.invoiceNumber}.pdf`);
  };

  const resetPage = (setter) => (event) => {
    setter(event.target.value);
    setPage(1);
  };

  // Helper arrays for simple status queries
  const pendingPayments = useMemo(() => payments.filter(p => p.status === "Pending"), [payments]);
  const failedPayments = useMemo(() => payments.filter(p => p.status === "Failed"), [payments]);

  // Tab items definitions
  const tabItems = [
    { id: "overview", name: "Overview", icon: TrendingUp },
    { id: "transactions", name: "Transactions", icon: CreditCard },
    { id: "pending", name: `Pending (${pendingPayments.length})`, icon: AlertCircle },
    { id: "refunds", name: "Refunds", icon: RotateCcw },
    { id: "failed", name: "Failed", icon: XCircle },
    { id: "methods", name: "Payment Methods", icon: Percent },
    { id: "settlements", name: "Settlements", icon: PiggyBank }
  ];

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      
      {/* HEADER SECTION */}
      <div className="flex flex-wrap gap-3 justify-between items-center border-b border-zinc-800 pb-5">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-zinc-400" /> Payments & Financials
          </h1>
          <p className="mt-1 text-xs text-zinc-400">Decoupled transaction accounting module and bookkeeping dashboard.</p>
        </div>
        <div className="flex items-center gap-2">
          {activeTab === "refunds" && (
            <Button 
              onClick={() => setShowRefundModal(true)}
              className="bg-purple-600 text-white hover:bg-purple-700 h-9 rounded-xl text-xs font-semibold px-4 flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Record Refund
            </Button>
          )}
          {activeTab === "settlements" && (
            <Button 
              onClick={() => setShowSettlementModal(true)}
              className="bg-blue-600 text-white hover:bg-blue-700 h-9 rounded-xl text-xs font-semibold px-4 flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Record Settlement
            </Button>
          )}
          <Button 
            onClick={handleRefresh} 
            disabled={isPaymentsFetching} 
            variant="outline" 
            className="h-9 w-9 p-0 border-zinc-800 bg-zinc-900 text-zinc-450 hover:text-white shrink-0 rounded-xl hover:bg-zinc-800"
            title="Sync Ledger"
          >
            <RefreshCw className={`h-4 w-4 ${isPaymentsFetching ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {/* TOP TAB NAVIGATION */}
      <div className="flex flex-wrap gap-1 border-b border-zinc-800 pb-1 scrollbar-none overflow-x-auto">
        {tabItems.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`h-9 px-4 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${isActive ? "bg-zinc-800 text-white border border-zinc-700" : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50"}`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.name}
            </button>
          );
        })}
      </div>

      {/* DYNAMIC TAB SWITCHER */}
      
      {/* 1. OVERVIEW TAB */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* STATS CARDS GRID */}
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
          </div>          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* LEDGER TREND CHART (CSS BARS) */}
            <div className="lg:col-span-3 bg-[#0c0c0e] border border-zinc-805 border-zinc-800 rounded-2xl p-5 space-y-4">
              <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
                <h3 className="text-sm font-bold text-zinc-200">Monthly Revenue vs Expenses</h3>
                <div className="flex gap-3 text-[10px] uppercase font-bold tracking-wider">
                  <span className="flex items-center gap-1 text-emerald-400"><span className="w-2 h-2 rounded bg-emerald-500"></span> Revenue</span>
                  <span className="flex items-center gap-1 text-rose-400"><span className="w-2 h-2 rounded bg-rose-500"></span> Expense</span>
                </div>
              </div>
              
              {isStatsLoading ? (
                <div className="h-64 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-zinc-500" />
                </div>
              ) : stats.monthlySummary?.length === 0 ? (
                <div className="h-64 flex items-center justify-center text-xs text-zinc-500">
                  No monthly ledger data populated.
                </div>
              ) : (
                <div className="h-64 flex items-end justify-between gap-4 pt-8 pb-3 px-2">
                  {stats.monthlySummary.map((item) => {
                    const maxVal = Math.max(...stats.monthlySummary.map(m => Math.max(m.revenue, m.expense)), 1000);
                    const revPct = (item.revenue / maxVal) * 100;
                    const expPct = (item.expense / maxVal) * 100;
                    return (
                      <div key={item.month} className="flex-1 flex flex-col items-center h-full justify-end group cursor-default">
                        <div className="w-full flex justify-center gap-1.5 h-[80%] items-end relative">
                          {/* Tooltip */}
                          <div className="absolute -top-7 hidden group-hover:flex flex-col bg-zinc-900 border border-zinc-800 text-[10px] p-1.5 rounded-lg shadow-xl text-zinc-200 z-10 font-mono">
                            <span>Rev: {formatCurrency(item.revenue)}</span>
                            <span>Exp: {formatCurrency(item.expense)}</span>
                          </div>
                          {/* Revenue bar */}
                          <div 
                            style={{ height: `${revPct}%` }} 
                            className="w-3 sm:w-4 bg-emerald-500/80 hover:bg-emerald-400 transition-all rounded-t-sm"
                          ></div>
                          {/* Expense bar */}
                          <div 
                            style={{ height: `${expPct}%` }} 
                            className="w-3 sm:w-4 bg-rose-500/80 hover:bg-rose-400 transition-all rounded-t-sm"
                          ></div>
                        </div>
                        <span className="text-[10px] text-zinc-500 font-bold mt-2">{item.month}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 2. TRANSACTIONS TAB */}
      {activeTab === "transactions" && (
        <div className="bg-[#0c0c0e] border border-zinc-800 rounded-2xl p-4 sm:p-6 space-y-4 shadow-xl">
          <div className="flex flex-col gap-3 lg:flex-row items-center justify-between">
            <div className="flex items-center w-full bg-[#141416] border border-zinc-700 rounded-xl px-3.5 transition-all gap-2 h-11 focus-within:border-zinc-500 focus-within:ring-1 focus-within:ring-zinc-500">
              <Search className="h-4 w-4 text-zinc-500 shrink-0" />
              <Input 
                value={search} 
                onChange={resetPage(setSearch)} 
                placeholder="Search transactions..." 
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
                <option value="Refunded" className="bg-zinc-950 text-zinc-200">Refunded</option>
                <option value="Partially Refunded" className="bg-zinc-950 text-zinc-200">Partially Refunded</option>
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
          </div>          <div className="overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-900/10">
            <Table className="min-w-[1000px]">
              <TableHeader className="bg-zinc-900/40">
                <TableRow className="border-b border-zinc-800 hover:bg-transparent text-[11px] uppercase tracking-wider text-zinc-400">
                  <TableHead className="w-16 text-center font-semibold py-3 text-zinc-400">Flow</TableHead>
                  <TableHead className="font-semibold py-3 text-zinc-400">Ledger Reference</TableHead>
                  <TableHead className="font-semibold py-3 text-zinc-400">Order ID</TableHead>
                  <TableHead className="font-semibold py-3 text-zinc-400">Customer</TableHead>
                  <TableHead className="font-semibold py-3 text-zinc-400">Channel</TableHead>
                  <TableHead className="font-semibold py-3 text-zinc-400 text-right">Debit / Credit</TableHead>
                  <TableHead className="font-semibold py-3 text-zinc-400 text-center">Status</TableHead>
                  <TableHead className="font-semibold py-3 text-zinc-400 text-right">Timestamp</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isPaymentsLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-48 text-center text-zinc-450">
                      <Loader2 className="mx-auto h-5 w-5 animate-spin text-zinc-500" />
                    </TableCell>
                  </TableRow>
                ) : payments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-48 text-center text-sm text-zinc-500">
                      No transactions match these filters.
                    </TableCell>
                  </TableRow>
                ) : payments.map((payment) => {
                  const isDebit = payment.status === "Refunded" || payment.status === "Failed" || payment.status === "Cancelled";
                  return (
                    <TableRow 
                      key={payment._id} 
                      onClick={() => payment.order?._id && router.push(`/admin/orders/${payment.order._id}`)}
                      className="border-b border-zinc-800/60 hover:bg-zinc-900/20 transition-colors cursor-pointer text-xs"
                    >
                      {/* Flow Arrow */}
                      <TableCell className="py-3 text-center" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-center">
                          {isDebit ? (
                            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400" title="Outflow / Debit / Refund">
                              <ArrowUpRight className="w-3 h-3" />
                            </span>
                          ) : (
                            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400" title="Inflow / Credit / Sale">
                              <ArrowDownRight className="w-3 h-3" />
                            </span>
                          )}
                        </div>
                      </TableCell>

                      {/* Ledger Reference (Payment / Transaction ID) */}
                      <TableCell className="py-3 font-mono text-[11px] text-zinc-400">
                        <span className="bg-zinc-950 border border-zinc-850 px-2 py-0.5 rounded text-zinc-300 select-all font-mono">
                          {payment.gatewayTransactionId || payment.transactionId || payment.paymentNumber || "—"}
                        </span>
                      </TableCell>

                      {/* Order ID */}
                      <TableCell className="py-3 font-bold font-mono text-zinc-350">
                        {payment.order?.orderNumber || "—"}
                      </TableCell>

                      {/* Customer */}
                      <TableCell className="py-3 font-semibold text-zinc-200">
                        {payment.customer?.name || "Customer unavailable"}
                      </TableCell>

                      {/* Channel */}
                      <TableCell className="py-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${paymentTypeClasses[payment.paymentMethod] || "bg-zinc-800 text-zinc-455 border-zinc-700"}`}>
                          {payment.paymentMethod}
                        </span>
                      </TableCell>

                      {/* Debit / Credit Amount */}
                      <TableCell className="py-3 font-mono text-right font-bold">
                        {isDebit ? (
                          <span className="text-rose-455 text-rose-400 font-mono">- {formatCurrency(payment.amount)}</span>
                        ) : (
                          <span className="text-emerald-405 text-emerald-400 font-mono">+ {formatCurrency(payment.amount)}</span>
                        )}
                      </TableCell>

                      {/* Status */}
                      <TableCell className="py-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${paymentStatusClasses[payment.status] || "bg-zinc-800 text-zinc-455 border-zinc-700"}`}>
                          {payment.status}
                        </span>
                      </TableCell>

                      {/* Timestamp */}
                      <TableCell className="py-3 text-zinc-500 font-mono text-right text-[11px]">
                        {formatDate(payment.paymentDate)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* PAGINATION */}
          <div className="flex items-center justify-between text-xs text-zinc-500 font-mono border-t border-zinc-800/80 pt-5 mt-4">
            <span>{pagination.total} total transactions</span>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="icon" 
                disabled={page <= 1} 
                onClick={() => setPage((current) => current - 1)} 
                className="h-8 w-8 rounded-lg border border-zinc-800 bg-zinc-900/45 flex items-center justify-center text-zinc-455 hover:text-white disabled:opacity-30 disabled:hover:text-zinc-455" 
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-zinc-400">Page {pagination.page} of {pagination.totalPages || 1}</span>
              <Button 
                variant="outline" 
                size="icon" 
                disabled={page >= (pagination.totalPages || 1)} 
                onClick={() => setPage((current) => current + 1)} 
                className="h-8 w-8 rounded-lg border border-zinc-800 bg-zinc-900/45 flex items-center justify-center text-zinc-455 hover:text-white disabled:opacity-30" 
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 3. PENDING PAYMENTS TAB */}
      {activeTab === "pending" && (
        <div className="bg-[#0c0c0e] border border-zinc-800 rounded-2xl p-6 space-y-4">
          <div className="border-b border-zinc-800 pb-3 flex justify-between items-center">
            <div>
              <h2 className="text-sm font-bold text-zinc-200">Pending Financial Receivables</h2>
              <p className="text-[11px] text-zinc-500 mt-1">Payments awaiting manual ledger completion or gateway callback response.</p>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/20">
              {pendingPayments.length} pending
            </span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-zinc-800">
            <Table className="min-w-[1000px]">
              <TableHeader className="bg-zinc-900/30">
                <TableRow className="border-b border-zinc-800 text-[11px] uppercase tracking-wider text-zinc-400">
                  <TableHead className="font-semibold py-3 text-zinc-400">Payment Number</TableHead>
                  <TableHead className="font-semibold py-3 text-zinc-400">Order ID</TableHead>
                  <TableHead className="font-semibold py-3 text-zinc-400">Customer</TableHead>
                  <TableHead className="font-semibold py-3 text-zinc-400 text-right">Amount</TableHead>
                  <TableHead className="font-semibold py-3 text-zinc-400">Method</TableHead>
                  <TableHead className="font-semibold py-3 text-zinc-400 text-right w-28">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isPaymentsLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center">
                      <Loader2 className="w-4 h-4 animate-spin mx-auto text-zinc-500" />
                    </TableCell>
                  </TableRow>
                ) : pendingPayments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center text-xs text-zinc-500">
                      No pending payments in current ledger batch.
                    </TableCell>
                  </TableRow>
                ) : pendingPayments.map((p) => (
                  <TableRow key={p._id} className="border-b border-zinc-800/50 hover:bg-zinc-900/10 text-xs">
                    <TableCell className="font-mono text-zinc-200 font-bold py-2.5">{p.paymentNumber}</TableCell>
                    <TableCell className="font-mono text-zinc-400 py-2.5">{p.order?.orderNumber || "—"}</TableCell>
                    <TableCell className="text-zinc-200 font-semibold py-2.5">{p.customer?.name || "Customer unavailable"}</TableCell>
                    <TableCell className="font-mono text-amber-500 font-bold py-2.5 text-right">{formatCurrency(p.amount)}</TableCell>
                    <TableCell className="py-2.5">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${paymentTypeClasses[p.paymentMethod] || "bg-zinc-800 border-zinc-700"}`}>
                        {p.paymentMethod}
                      </span>
                    </TableCell>
                    <TableCell className="py-2.5 text-right">
                      <Button 
                        onClick={(e) => {
                          e.stopPropagation();
                          markAsPaidMutation.mutate(p._id);
                        }}
                        disabled={markAsPaidMutation.isPending}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-semibold h-7 rounded-lg px-3 cursor-pointer"
                      >
                        {markAsPaidMutation.isPending ? "Updating..." : "Mark Paid"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* 4. REFUNDS TAB */}
      {activeTab === "refunds" && (
        <div className="bg-[#0c0c0e] border border-zinc-800 rounded-2xl p-6 space-y-4">
          <div className="border-b border-zinc-800 pb-3 flex justify-between items-center">
            <div>
              <h2 className="text-sm font-bold text-zinc-200">Refund Registry</h2>
              <p className="text-[11px] text-zinc-500 mt-1">Audit log of customer transaction chargebacks and manual ledger refunds.</p>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-zinc-800">
            <Table className="min-w-[1000px]">
              <TableHeader className="bg-zinc-900/30">
                <TableRow className="border-b border-zinc-800 text-[11px] uppercase tracking-wider text-zinc-400">
                  <TableHead className="font-semibold py-3 text-zinc-400">Refund ID</TableHead>
                  <TableHead className="font-semibold py-3 text-zinc-400">Linked Payment</TableHead>
                  <TableHead className="font-semibold py-3 text-zinc-400 text-right">Refund Amount</TableHead>
                  <TableHead className="font-semibold py-3 text-zinc-400">Reason</TableHead>
                  <TableHead className="font-semibold py-3 text-zinc-400 text-center">Status</TableHead>
                  <TableHead className="font-semibold py-3 text-zinc-400 text-center">Processed Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isRefundsLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center">
                      <Loader2 className="w-4 h-4 animate-spin mx-auto text-zinc-500" />
                    </TableCell>
                  </TableRow>
                ) : refunds.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center text-xs text-zinc-500">
                      No refund records logged in database.
                    </TableCell>
                  </TableRow>
                ) : refunds.map((r) => (
                  <TableRow key={r._id} className="border-b border-zinc-800/50 hover:bg-zinc-900/10 text-xs">
                    <TableCell className="font-mono text-zinc-400 py-2.5">
                      <span className="bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded text-zinc-300 font-mono text-[10px]">
                        {r._id.toString().slice(-8).toUpperCase()}
                      </span>
                    </TableCell>
                    <TableCell className="font-mono text-zinc-450 text-zinc-500 py-2.5">
                      {r.payment?.paymentNumber || "—"} <span className="text-[10px] text-zinc-500 font-bold">({r.payment?.order?.orderNumber || "—"})</span>
                    </TableCell>
                    <TableCell className="font-mono text-rose-400 font-bold py-2.5 text-right">- {formatCurrency(r.refundAmount)}</TableCell>
                    <TableCell className="text-zinc-300 py-2.5 truncate max-w-[150px] capitalize" title={r.reason}>{r.reason || "Customer Return"}</TableCell>
                    <TableCell className="py-2.5 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/15 text-purple-300 border border-purple-500/25">
                        {r.status || "Processed"}
                      </span>
                    </TableCell>
                    <TableCell className="text-zinc-500 text-center py-2.5 font-mono">{formatDate(r.processedDate || r.createdAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* 5. FAILED PAYMENTS TAB */}
      {activeTab === "failed" && (
        <div className="bg-[#0c0c0e] border border-zinc-800 rounded-2xl p-6 space-y-4">
          <div className="border-b border-zinc-800 pb-3 flex justify-between items-center">
            <div>
              <h2 className="text-sm font-bold text-zinc-200">Failed Transactions Audit</h2>
              <p className="text-[11px] text-zinc-500 mt-1">Transaction failures from failed gateway attempts or cancelled entries.</p>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-300 border border-rose-500/20">
              {failedPayments.length} failed
            </span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-zinc-800">
            <Table className="min-w-[1000px]">
              <TableHeader className="bg-zinc-900/30">
                <TableRow className="border-b border-zinc-800 text-[11px] uppercase tracking-wider text-zinc-400">
                  <TableHead className="font-semibold py-3 text-zinc-400">Payment Number</TableHead>
                  <TableHead className="font-semibold py-3 text-zinc-400">Order ID</TableHead>
                  <TableHead className="font-semibold py-3 text-zinc-400">Customer</TableHead>
                  <TableHead className="font-semibold py-3 text-zinc-400 text-right">Amount</TableHead>
                  <TableHead className="font-semibold py-3 text-zinc-400">Method</TableHead>
                  <TableHead className="font-semibold py-3 text-zinc-400">Failure Reason / Remarks</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isPaymentsLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center">
                      <Loader2 className="w-4 h-4 animate-spin mx-auto text-zinc-500" />
                    </TableCell>
                  </TableRow>
                ) : failedPayments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center text-xs text-zinc-500">
                      No failed transactions logged in database.
                    </TableCell>
                  </TableRow>
                ) : failedPayments.map((p) => (
                  <TableRow key={p._id} className="border-b border-zinc-800/50 hover:bg-zinc-900/10 text-xs opacity-75">
                    <TableCell className="font-mono text-zinc-400 py-2.5">{p.paymentNumber}</TableCell>
                    <TableCell className="font-mono text-zinc-550 text-zinc-500 py-2.5">{p.order?.orderNumber || "—"}</TableCell>
                    <TableCell className="text-zinc-200 font-semibold py-2.5">{p.customer?.name || "Customer unavailable"}</TableCell>
                    <TableCell className="font-mono text-zinc-500 line-through py-2.5 text-right font-bold">{formatCurrency(p.amount)}</TableCell>
                    <TableCell className="py-2.5">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${paymentTypeClasses[p.paymentMethod] || "bg-zinc-800 border-zinc-700"}`}>
                        {p.paymentMethod}
                      </span>
                    </TableCell>
                    <TableCell className="text-rose-400 text-xs italic py-2.5">{p.failureReason || p.remarks || "Gateway transaction failed"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* 6. PAYMENT METHODS TAB */}
      {activeTab === "methods" && (
        <div className="space-y-6">
          <div className="bg-[#0c0c0e] border border-zinc-800 rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-zinc-200 border-b border-zinc-800 pb-3">Payment Channel Breakdown</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 py-2">
              {["UPI", "COD", "Card", "NetBanking"].map((method) => {
                const data = stats.methodsSummary?.[method] || { amount: 0, count: 0 };
                const totalChannelPaid = Object.values(stats.methodsSummary || {}).reduce((acc, curr) => acc + curr.amount, 0) || 1;
                const percentage = ((data.amount / totalChannelPaid) * 100).toFixed(0);

                return (
                  <div key={method} className="bg-zinc-950 border border-zinc-800/70 p-4 rounded-xl space-y-3 relative overflow-hidden group">
                    <div className="flex justify-between items-center">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${paymentTypeClasses[method]}`}>{method}</span>
                      <span className="text-xs font-mono text-zinc-400 font-bold">{percentage}% Share</span>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-zinc-500 font-medium">Volume Collected</p>
                      <p className="text-lg font-bold text-zinc-100 font-mono">{formatCurrency(data.amount)}</p>
                    </div>
                    <p className="text-[10px] text-zinc-505">{data.count} successful payouts</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 7. SETTLEMENT HISTORY TAB */}
      {activeTab === "settlements" && (
        <div className="bg-[#0c0c0e] border border-zinc-800 rounded-2xl p-6 space-y-4">
          <div className="border-b border-zinc-800 pb-3 flex justify-between items-center">
            <div>
              <h2 className="text-sm font-bold text-zinc-200">Gateway Settlement History</h2>
              <p className="text-[11px] text-zinc-500 mt-1">Payout settlements deposited by payment gateways (Razorpay/Stripe) into the bank.</p>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-zinc-800">
            <Table className="min-w-[1000px]">
              <TableHeader className="bg-zinc-900/30">
                <TableRow className="border-b border-zinc-800 text-[11px] uppercase tracking-wider text-zinc-400">
                  <TableHead className="font-semibold py-3 text-zinc-400">Settlement ID</TableHead>
                  <TableHead className="font-semibold py-3 text-zinc-400">Gateway</TableHead>
                  <TableHead className="font-semibold py-3 text-zinc-400 text-right">Amount</TableHead>
                  <TableHead className="font-semibold py-3 text-zinc-400">Destination Bank</TableHead>
                  <TableHead className="font-semibold py-3 text-zinc-400">Settle Date</TableHead>
                  <TableHead className="font-semibold py-3 text-zinc-400">Linked Payments</TableHead>
                  <TableHead className="font-semibold py-3 text-zinc-400 text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isSettlementsLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-32 text-center">
                      <Loader2 className="w-4 h-4 animate-spin mx-auto text-zinc-500" />
                    </TableCell>
                  </TableRow>
                ) : settlements.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-32 text-center text-xs text-zinc-500">
                      No settlements recorded in ledger.
                    </TableCell>
                  </TableRow>
                ) : settlements.map((s) => (
                  <TableRow key={s._id} className="border-b border-zinc-800/50 hover:bg-zinc-900/10 text-xs">
                    <TableCell className="font-mono text-zinc-400 py-2.5">
                      <span className="bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded text-zinc-300 font-mono text-[10px]">
                        {s.settlementId}
                      </span>
                    </TableCell>
                    <TableCell className="text-zinc-300 font-bold py-2.5">{s.gateway}</TableCell>
                    <TableCell className="font-mono text-emerald-400 font-bold py-2.5 text-right">+ {formatCurrency(s.amount)}</TableCell>
                    <TableCell className="text-zinc-400 py-2.5">{s.bank || "—"}</TableCell>
                    <TableCell className="text-zinc-500 font-mono py-2.5">{formatDate(s.settlementDate)}</TableCell>
                    <TableCell className="text-zinc-500 font-mono font-semibold py-2.5">{s.payments?.length || 0} items</TableCell>
                    <TableCell className="py-2.5 text-center">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/25">
                        {s.status}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* RECORD REFUND OVERLAY MODAL */}
      {showRefundModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-950 border border-zinc-805 border-zinc-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="border-b border-zinc-800 pb-3 flex justify-between items-center">
              <h3 className="text-sm font-bold text-zinc-200 flex items-center gap-1.5">
                <RotateCcw className="w-4 h-4 text-purple-400" /> Record Refund
              </h3>
              <button onClick={() => setShowRefundModal(false)} className="text-zinc-450 hover:text-white text-lg font-bold">×</button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-[10px] text-zinc-450 font-bold uppercase block mb-1">Target Payment ID / ObjectId</label>
                <Input 
                  placeholder="e.g. 64b8fcf61f..." 
                  value={refundForm.paymentId}
                  onChange={(e) => setRefundForm({...refundForm, paymentId: e.target.value})}
                  className="bg-zinc-900 border-zinc-800 text-xs text-zinc-200 h-10"
                />
              </div>
              <div>
                <label className="text-[10px] text-zinc-455 font-bold uppercase block mb-1">Refund Amount (₹)</label>
                <Input 
                  type="number" 
                  placeholder="e.g. 500" 
                  value={refundForm.amount}
                  onChange={(e) => setRefundForm({...refundForm, amount: e.target.value})}
                  className="bg-zinc-900 border-zinc-800 text-xs text-zinc-200 h-10"
                />
              </div>
              <div>
                <label className="text-[10px] text-zinc-455 font-bold uppercase block mb-1">Reason</label>
                <Input 
                  placeholder="e.g. Returned damaged items" 
                  value={refundForm.reason}
                  onChange={(e) => setRefundForm({...refundForm, reason: e.target.value})}
                  className="bg-zinc-900 border-zinc-800 text-xs text-zinc-200 h-10"
                />
              </div>
            </div>
            <div className="flex gap-3 justify-end pt-2 border-t border-zinc-800/80">
              <Button onClick={() => setShowRefundModal(false)} variant="outline" className="border-zinc-800 text-zinc-400 text-xs h-9 rounded-xl">
                Cancel
              </Button>
              <Button 
                onClick={() => refundMutation.mutate(refundForm)}
                disabled={refundMutation.isPending}
                className="bg-purple-650 text-white hover:bg-purple-700 text-xs h-9 rounded-xl px-4 cursor-pointer"
              >
                {refundMutation.isPending ? "Processing..." : "Process Refund"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* RECORD SETTLEMENT OVERLAY MODAL */}
      {showSettlementModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="border-b border-zinc-800 pb-3 flex justify-between items-center">
              <h3 className="text-sm font-bold text-zinc-200 flex items-center gap-1.5">
                <PiggyBank className="w-4 h-4 text-blue-400" /> Record Settlement Batch
              </h3>
              <button onClick={() => setShowSettlementModal(false)} className="text-zinc-450 hover:text-white text-lg">×</button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-[10px] text-zinc-450 font-bold uppercase block mb-1">Settlement ID</label>
                <Input 
                  placeholder="e.g. setl_09872" 
                  value={settlementForm.settlementId}
                  onChange={(e) => setSettlementForm({...settlementForm, settlementId: e.target.value})}
                  className="bg-zinc-900 border-zinc-800 text-xs text-zinc-200 h-10"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-zinc-450 font-bold uppercase block mb-1">Gateway</label>
                  <select 
                    value={settlementForm.gateway}
                    onChange={(e) => setSettlementForm({...settlementForm, gateway: e.target.value})}
                    className="w-full bg-[#141416] border border-zinc-800 text-xs text-zinc-200 h-10 rounded-lg px-3 focus:outline-none"
                  >
                    <option value="Razorpay">Razorpay</option>
                    <option value="Stripe">Stripe</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-zinc-450 font-bold uppercase block mb-1">Bank</label>
                  <Input 
                    placeholder="e.g. HDFC" 
                    value={settlementForm.bank}
                    onChange={(e) => setSettlementForm({...settlementForm, bank: e.target.value})}
                    className="bg-zinc-900 border-zinc-800 text-xs text-zinc-200 h-10"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-zinc-450 font-bold uppercase block mb-1">Amount (₹)</label>
                  <Input 
                    type="number"
                    placeholder="e.g. 15000" 
                    value={settlementForm.amount}
                    onChange={(e) => setSettlementForm({...settlementForm, amount: e.target.value})}
                    className="bg-zinc-900 border-zinc-800 text-xs text-zinc-200 h-10"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-zinc-450 font-bold uppercase block mb-1">Settle Date</label>
                  <Input 
                    type="date" 
                    value={settlementForm.settlementDate}
                    onChange={(e) => setSettlementForm({...settlementForm, settlementDate: e.target.value})}
                    className="bg-zinc-900 border-zinc-800 text-xs text-zinc-200 h-10"
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] text-zinc-450 font-bold uppercase block mb-1">Linked Payment IDs (comma-separated)</label>
                <Input 
                  placeholder="e.g. 64b8fcf61f, 64b8fdg8..." 
                  value={settlementForm.payments}
                  onChange={(e) => setSettlementForm({...settlementForm, payments: e.target.value})}
                  className="bg-zinc-900 border-zinc-800 text-xs text-zinc-200 h-10"
                />
              </div>
            </div>
            <div className="flex gap-3 justify-end pt-2 border-t border-zinc-800/80">
              <Button onClick={() => setShowSettlementModal(false)} variant="outline" className="border-zinc-800 text-zinc-400 text-xs h-9 rounded-xl">
                Cancel
              </Button>
              <Button 
                onClick={() => settlementMutation.mutate(settlementForm)}
                disabled={settlementMutation.isPending}
                className="bg-blue-650 text-white hover:bg-blue-700 text-xs h-9 rounded-xl px-4 cursor-pointer"
              >
                {settlementMutation.isPending ? "Logging..." : "Log Settlement"}
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
