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
  PiggyBank,
  Receipt,
  Pencil,
  Trash2,
  Calendar,
  DollarSign
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";
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

const EXPENSE_CATEGORIES = [
  "Transport",
  "Labour/Salary",
  "Rent",
  "Utilities",
  "Packaging",
  "Marketing",
  "Other",
];

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

  // Expense tab filters & pagination
  const [expensePage, setExpensePage] = useState(1);
  const [expenseCategory, setExpenseCategory] = useState("");
  const [expenseIsRecurring, setExpenseIsRecurring] = useState("");

  // Modals visibility
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [showSettlementModal, setShowSettlementModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);

  // Form states
  const [refundForm, setRefundForm] = useState({ paymentId: "", amount: "", reason: "" });
  const [settlementForm, setSettlementForm] = useState({ settlementId: "", gateway: "Razorpay", amount: "", bank: "", settlementDate: "", payments: "" });
  const [expenseForm, setExpenseForm] = useState({
    category: "Transport",
    amount: "",
    note: "",
    isRecurring: false,
    date: new Date().toISOString().split("T")[0],
    recurrenceFrequency: "monthly",
    recurrenceEndDate: "",
  });

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

  const { data: dashboardData } = useQuery({
    queryKey: ["dashboardData"],
    queryFn: async () => (await axios.get("/api/admin/dashboard")).data.data,
  });

  const { data: expenseTrendData } = useQuery({
    queryKey: ["expenseTrend"],
    queryFn: async () => (await axios.get("/api/admin/expenses/trend")).data.data,
  });

  const { data: expenseSummaryData } = useQuery({
    queryKey: ["expenseSummaryMonth"],
    queryFn: async () => (await axios.get("/api/admin/expenses/summary?period=month")).data.data,
  });

  const { data: expensesResponse, isLoading: isExpensesLoading, refetch: refetchExpenses } = useQuery({
    queryKey: ["expenses", { expensePage, expenseCategory, expenseIsRecurring }],
    queryFn: async () => (await axios.get("/api/admin/expenses", { 
      params: { 
        page: expensePage, 
        limit: 10, 
        category: expenseCategory, 
        isRecurring: expenseIsRecurring 
      } 
    })).data.data,
    enabled: activeTab === "expenses" || showExpenseModal,
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
  const expenseMutation = useMutation({
    mutationFn: async (payload) => {
      if (editingExpense) {
        return (await axios.patch(`/api/admin/expenses/${editingExpense._id}`, payload)).data;
      }
      return (await axios.post("/api/admin/expenses", payload)).data;
    },
    onSuccess: (res) => {
      toast.success(res.message || (editingExpense ? "Expense updated!" : "Expense added!"));
      setShowExpenseModal(false);
      setEditingExpense(null);
      setExpenseForm({
        category: "Transport",
        amount: "",
        note: "",
        isRecurring: false,
        date: new Date().toISOString().split("T")[0],
        recurrenceFrequency: "monthly",
        recurrenceEndDate: "",
      });
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["expenseSummaryMonth"] });
      queryClient.invalidateQueries({ queryKey: ["expenseTrend"] });
      queryClient.invalidateQueries({ queryKey: ["paymentsStats"] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to save expense entry");
    },
  });

  const deleteExpenseMutation = useMutation({
    mutationFn: async (id) => {
      return (await axios.delete(`/api/admin/expenses/${id}`)).data;
    },
    onSuccess: () => {
      toast.success("Expense entry deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["expenseSummaryMonth"] });
      queryClient.invalidateQueries({ queryKey: ["expenseTrend"] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to delete expense entry");
    },
  });

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

  const expensesList = expensesResponse?.expenses || [];
  const expensesPagination = expensesResponse?.pagination || { page: 1, totalPages: 1, total: 0 };

  // Calculate 30-Day Revenue vs Expense Trend Chart Data
  const combinedTrendData = useMemo(() => {
    const revenueTrend = dashboardData?.revenueTrend || [];
    const expenseTrend = expenseTrendData || [];

    const expenseMap = {};
    expenseTrend.forEach((item) => {
      expenseMap[item.date] = item.amount || 0;
    });

    if (revenueTrend.length > 0) {
      return revenueTrend.map((r) => ({
        date: r.date,
        revenue: r.revenue || 0,
        expense: expenseMap[r.date] || 0,
      }));
    }

    return expenseTrend.map((e) => ({
      date: e.date,
      revenue: 0,
      expense: e.amount || 0,
    }));
  }, [dashboardData, expenseTrendData]);

  // Current Month Summary Metrics
  const monthTotalRevenue = dashboardData?.totalRevenue || stats.totalPaidAmount || 0;
  const monthTotalExpenses = expenseSummaryData?.totalExpenses || 0;
  const monthNetProfit = monthTotalRevenue - monthTotalExpenses;

  const handleRefresh = () => {
    refetchPayments();
    refetchStats();
    if (activeTab === "refunds") refetchRefunds();
    if (activeTab === "settlements") refetchSettlements();
    if (activeTab === "invoices") refetchInvoices();
    if (activeTab === "expenses") refetchExpenses();
    toast.success("Finance ledger re-synced");
  };

  const resetPage = (setter) => (event) => {
    setter(event.target.value);
    setPage(1);
  };

  const handleOpenCreateExpense = () => {
    setEditingExpense(null);
    setExpenseForm({
      category: "Transport",
      amount: "",
      note: "",
      isRecurring: false,
      date: new Date().toISOString().split("T")[0],
      recurrenceFrequency: "monthly",
      recurrenceEndDate: "",
    });
    setShowExpenseModal(true);
  };

  const handleOpenEditExpense = (exp) => {
    setEditingExpense(exp);
    setExpenseForm({
      category: exp.category,
      amount: String(exp.amount),
      note: exp.note || "",
      isRecurring: !!exp.isRecurring,
      date: exp.date ? new Date(exp.date).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
      recurrenceFrequency: exp.recurrenceFrequency || "monthly",
      recurrenceEndDate: exp.recurrenceEndDate ? new Date(exp.recurrenceEndDate).toISOString().split("T")[0] : "",
    });
    setShowExpenseModal(true);
  };

  // Helper arrays for simple status queries
  const pendingPayments = useMemo(() => payments.filter(p => p.status === "Pending"), [payments]);

  // Tab items definitions
  const tabItems = [
    { id: "overview", name: "Overview", icon: TrendingUp },
    { id: "expenses", name: "Expenses", icon: Receipt },
    { id: "transactions", name: "Transactions", icon: CreditCard },
    { id: "pending", name: `Pending (${pendingPayments.length})`, icon: AlertCircle },
    { id: "refunds", name: "Refunds", icon: RotateCcw },
    { id: "settlements", name: "Settlements", icon: PiggyBank }
  ];

  return (
    <div className="w-full max-w-full space-y-6 font-sans pb-12 text-gray-900 overflow-x-hidden">
      
      {/* HEADER SECTION */}
      {/* 1. CLEAN PAGE HEADER */}
      <div className="flex flex-wrap gap-4 justify-between items-center border-b border-border-subtle pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-primary-50 border border-primary-100 text-primary-600">
              <CreditCard className="h-5 w-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-gray-900">Payments & Financial Accounting</h1>
          </div>
          <p className="mt-1 text-xs sm:text-sm text-zinc-600 font-medium">
            Real-time transaction reconciliation, P&L cash flow, expense tracking, and settlements.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {activeTab === "expenses" && (
            <Button 
              onClick={handleOpenCreateExpense}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-10 rounded-xl text-xs sm:text-sm px-4 flex items-center gap-2 cursor-pointer shadow-xs btn-modern"
            >
              <Plus className="w-4 h-4" /> Add Expense
            </Button>
          )}
          {activeTab === "refunds" && (
            <Button 
              onClick={() => setShowRefundModal(true)}
              className="bg-primary-600 hover:bg-primary-700 text-white font-bold h-10 rounded-xl text-xs sm:text-sm px-4 flex items-center gap-2 cursor-pointer shadow-xs btn-modern"
            >
              <Plus className="w-4 h-4" /> Record Refund
            </Button>
          )}
          {activeTab === "settlements" && (
            <Button 
              onClick={() => setShowSettlementModal(true)}
              className="bg-primary-600 hover:bg-primary-700 text-white font-bold h-10 rounded-xl text-xs sm:text-sm px-4 flex items-center gap-2 cursor-pointer shadow-xs btn-modern"
            >
              <Plus className="w-4 h-4" /> Record Settlement
            </Button>
          )}
          <Button 
            onClick={handleRefresh} 
            disabled={isPaymentsFetching} 
            variant="outline" 
            className="rounded-xl border-border-subtle bg-bg-surface text-gray-900 hover:bg-primary-50 text-xs sm:text-sm font-semibold h-10 px-4 cursor-pointer shadow-xs btn-modern shrink-0"
            title="Sync Ledger"
          >
            <RefreshCw className={`mr-2 h-4 w-4 text-primary-600 ${isPaymentsFetching ? "animate-spin" : ""}`} />
            <span>Sync Ledger</span>
          </Button>
        </div>
      </div>

      {/* TOP TAB NAVIGATION */}
      <div className="flex flex-wrap gap-1 border-b border-border-subtle pb-1 scrollbar-none overflow-x-auto">
        {tabItems.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`h-9 px-4 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                isActive 
                  ? "bg-primary-100 text-primary-700 border border-primary-200 shadow-xs" 
                  : "text-zinc-600 hover:text-gray-900 hover:bg-primary-50/70"
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? "text-primary-600" : "text-zinc-500"}`} />
              {tab.name}
            </button>
          );
        })}
      </div>

      {/* DYNAMIC TAB SWITCHER */}
      
      {/* 1. OVERVIEW TAB */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* TOP SUMMARY KPIS (REVENUE, EXPENSES, NET PROFIT) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-bg-surface border border-border-subtle p-5 rounded-2xl shadow-xs space-y-1">
              <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold block">Current Month Revenue</span>
              <p className="text-2xl font-extrabold font-mono text-emerald-600">{formatCurrency(monthTotalRevenue)}</p>
              <p className="text-[11px] text-zinc-500">Gross sales from paid orders</p>
            </div>

            <div className="bg-bg-surface border border-border-subtle p-5 rounded-2xl shadow-xs space-y-1">
              <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold block">Current Month Expenses</span>
              <p className="text-2xl font-extrabold font-mono text-rose-600">{formatCurrency(monthTotalExpenses)}</p>
              <p className="text-[11px] text-zinc-500">Operating costs & prorated recurring bills</p>
            </div>

            <div className="bg-bg-surface border border-border-subtle p-5 rounded-2xl shadow-xs space-y-1">
              <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold block">Current Month Net Profit</span>
              <p className={`text-2xl font-extrabold font-mono ${monthNetProfit >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                {formatCurrency(monthNetProfit)}
              </p>
              <p className="text-[11px] text-zinc-500">Revenue minus operating expenses</p>
            </div>
          </div>

          {/* STATS CARDS GRID */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { label: "Total Paid", value: stats.totalPaid, color: "text-emerald-600", icon: CheckCircle2 },
              { label: "Total Pending", value: stats.totalPending, color: "text-amber-600", icon: AlertCircle },
              { label: "Total Failed", value: stats.totalFailed, color: "text-rose-600", icon: XCircle },
              { label: "Paid Amount", value: formatCurrency(stats.totalPaidAmount), color: "text-emerald-600", icon: CheckCircle2 },
              { label: "Pending Amount", value: formatCurrency(stats.totalPendingAmount), color: "text-amber-600", icon: AlertCircle },
              { label: "Failed Amount", value: formatCurrency(stats.totalFailedAmount), color: "text-rose-600", icon: XCircle },
            ].map((item) => (
              <div key={item.label} className="bg-bg-surface border border-border-subtle p-4 rounded-2xl shadow-xs flex flex-col justify-between min-h-[95px]">
                <div>
                  <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold">{item.label}</p>
                  <p className={`text-lg font-bold mt-2 font-mono tracking-tight ${item.color}`}>{item.value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* REAL REVENUE VS EXPENSES RECHARTS TREND */}
          <div className="bg-bg-surface border border-border-subtle rounded-2xl p-6 space-y-4 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-subtle pb-4">
              <div>
                <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-600" /> 30-Day Revenue vs Expenses Trend
                </h3>
                <p className="text-xs text-zinc-500 mt-0.5">Live comparison of checkout revenue against recorded business expenses.</p>
              </div>
              <div className="flex items-center gap-4 text-xs font-bold font-mono">
                <span className="flex items-center gap-1.5 text-emerald-600">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Revenue
                </span>
                <span className="flex items-center gap-1.5 text-rose-600">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Expense
                </span>
              </div>
            </div>

            <div className="h-72 w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={combinedTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" stroke="#71717a" fontSize={11} tickLine={false} />
                  <YAxis stroke="#71717a" fontSize={11} tickLine={false} tickFormatter={(v) => `₹${v}`} />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        const rev = payload.find((p) => p.dataKey === "revenue")?.value || 0;
                        const exp = payload.find((p) => p.dataKey === "expense")?.value || 0;
                        const profit = rev - exp;
                        return (
                          <div className="bg-[#121216] border border-zinc-800 p-3 rounded-xl shadow-2xl text-xs font-mono space-y-1.5">
                            <p className="font-bold text-white text-xs">{label}</p>
                            <div className="space-y-1 text-[11px]">
                              <p className="text-emerald-400 font-semibold">Revenue: ₹{rev.toLocaleString("en-IN")}</p>
                              <p className="text-rose-400 font-semibold">Expense: ₹{exp.toLocaleString("en-IN")}</p>
                              <div className="border-t border-zinc-800 pt-1">
                                <p className={`font-bold ${profit >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                                  Net: ₹{profit.toLocaleString("en-IN")}
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRevenue)" />
                  <Area type="monotone" dataKey="expense" name="Expense" stroke="#f43f5e" strokeWidth={2.5} fillOpacity={1} fill="url(#colorExpense)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* 2. EXPENSES TAB */}
      {activeTab === "expenses" && (
        <div className="bg-[#0c0c0e] border border-zinc-800 rounded-2xl p-4 sm:p-6 space-y-4 shadow-xl">
          {/* SEARCH & FILTERS ROW */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
              <select
                value={expenseCategory}
                onChange={(e) => { setExpenseCategory(e.target.value); setExpensePage(1); }}
                className="h-10 bg-[#141416] border border-zinc-700 rounded-xl px-3.5 text-xs font-semibold text-zinc-300 hover:text-white transition-all outline-none cursor-pointer min-w-[160px]"
              >
                <option value="" className="bg-zinc-950 text-zinc-400">All Categories</option>
                {EXPENSE_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat} className="bg-zinc-950 text-zinc-200">{cat}</option>
                ))}
              </select>

              <select
                value={expenseIsRecurring}
                onChange={(e) => { setExpenseIsRecurring(e.target.value); setExpensePage(1); }}
                className="h-10 bg-[#141416] border border-zinc-700 rounded-xl px-3.5 text-xs font-semibold text-zinc-300 hover:text-white transition-all outline-none cursor-pointer min-w-[160px]"
              >
                <option value="" className="bg-zinc-950 text-zinc-400">All Types</option>
                <option value="false" className="bg-zinc-950 text-zinc-200">One-Time</option>
                <option value="true" className="bg-zinc-950 text-zinc-200">Recurring</option>
              </select>
            </div>

            <Button
              onClick={handleOpenCreateExpense}
              className="bg-emerald-600 hover:bg-emerald-500 text-white h-10 rounded-xl text-xs font-semibold px-4 flex items-center gap-1.5 cursor-pointer shadow-md w-full sm:w-auto"
            >
              <Plus className="w-4 h-4" /> Add Expense
            </Button>
          </div>

          {/* EXPENSES TABLE */}
          {isExpensesLoading ? (
            <div className="flex h-48 items-center justify-center bg-[#0c0c0e]/30 border border-zinc-800 rounded-2xl">
              <Loader2 className="h-6 w-6 animate-spin text-emerald-400" />
            </div>
          ) : expensesList.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center p-12 border border-dashed border-zinc-800 bg-[#0c0c0e]/30 rounded-2xl space-y-2 min-h-[220px]">
              <Receipt className="h-8 w-8 text-zinc-500" />
              <p className="font-semibold text-zinc-400 text-xs">No expense entries found.</p>
              <p className="text-[11px] text-zinc-500">Click "Add Expense" above to record business operational costs.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-950/40">
              <Table className="min-w-[700px] text-xs">
                <TableHeader className="bg-zinc-900/60">
                  <TableRow className="border-b border-zinc-800 hover:bg-transparent">
                    <TableHead className="font-semibold text-zinc-400">Category</TableHead>
                    <TableHead className="font-semibold text-zinc-400 text-right w-32">Amount</TableHead>
                    <TableHead className="font-semibold text-zinc-400 text-center w-32">Date</TableHead>
                    <TableHead className="font-semibold text-zinc-400 text-center w-36">Type / Frequency</TableHead>
                    <TableHead className="font-semibold text-zinc-400">Note</TableHead>
                    <TableHead className="font-semibold text-zinc-400 text-right w-24">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expensesList.map((exp) => (
                    <TableRow key={exp._id} className="border-b border-zinc-800/60 hover:bg-zinc-900/20 transition-colors">
                      <TableCell className="py-3 font-bold text-zinc-100 capitalize">
                        {exp.category}
                      </TableCell>
                      <TableCell className="py-3 text-right font-mono font-bold text-rose-400 text-sm">
                        ₹{exp.amount?.toLocaleString("en-IN")}
                      </TableCell>
                      <TableCell className="py-3 text-center font-mono text-zinc-400 text-xs">
                        {formatDate(exp.date)}
                      </TableCell>
                      <TableCell className="py-3 text-center">
                        {exp.isRecurring ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/10 text-purple-300 border border-purple-500/25">
                            Monthly Recurring
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-zinc-800 text-zinc-400 border border-zinc-700">
                            One-Time
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="py-3 text-zinc-400 truncate max-w-[200px]" title={exp.note}>
                        {exp.note || "—"}
                      </TableCell>
                      <TableCell className="py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenEditExpense(exp)}
                            className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
                            title="Edit Expense"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Delete ${exp.category} expense of ₹${exp.amount}?`)) {
                                deleteExpenseMutation.mutate(exp._id);
                              }
                            }}
                            className="p-1.5 text-zinc-400 hover:text-rose-400 hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
                            title="Delete Expense"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* PAGINATION */}
          {expensesPagination.totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-zinc-800 pt-3 text-xs">
              <p className="text-zinc-500 text-[11px]">
                Page <span className="text-zinc-200 font-bold">{expensesPagination.page}</span> of{" "}
                <span className="text-zinc-200 font-bold">{expensesPagination.totalPages}</span> ({expensesPagination.total} expenses)
              </p>
              <div className="flex gap-1.5">
                <Button
                  disabled={expensePage === 1}
                  onClick={() => setExpensePage((prev) => Math.max(prev - 1, 1))}
                  variant="outline"
                  className="h-7 px-2.5 text-xs border-zinc-800 bg-zinc-900 text-zinc-300 hover:text-white disabled:opacity-40"
                >
                  <ChevronLeft className="w-3.5 h-3.5 mr-1" /> Prev
                </Button>
                <Button
                  disabled={expensePage >= expensesPagination.totalPages}
                  onClick={() => setExpensePage((prev) => Math.min(prev + 1, expensesPagination.totalPages))}
                  variant="outline"
                  className="h-7 px-2.5 text-xs border-zinc-800 bg-zinc-900 text-zinc-300 hover:text-white disabled:opacity-40"
                >
                  Next <ChevronRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. TRANSACTIONS TAB */}
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
              </select>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-950/40">
            <Table className="min-w-[800px] text-xs">
              <TableHeader className="bg-zinc-900/60">
                <TableRow className="border-b border-zinc-800 hover:bg-transparent">
                  <TableHead className="font-semibold text-zinc-400">Transaction ID</TableHead>
                  <TableHead className="font-semibold text-zinc-400">Order ID</TableHead>
                  <TableHead className="font-semibold text-zinc-400">Customer</TableHead>
                  <TableHead className="font-semibold text-zinc-400 text-right">Amount</TableHead>
                  <TableHead className="font-semibold text-zinc-400 text-center">Status</TableHead>
                  <TableHead className="font-semibold text-zinc-400 text-center">Method</TableHead>
                  <TableHead className="font-semibold text-zinc-400 text-right">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((p) => (
                  <TableRow key={p._id} className="border-b border-zinc-800/60 hover:bg-zinc-900/20 transition-colors">
                    <TableCell className="font-mono text-zinc-300 font-bold">{p.transactionId || p._id.substring(0, 10)}</TableCell>
                    <TableCell className="font-mono text-blue-400 font-semibold">{p.order?.orderNumber || "—"}</TableCell>
                    <TableCell className="text-zinc-200 font-medium capitalize">{p.customer?.name || p.order?.shippingAddress?.name || "Customer"}</TableCell>
                    <TableCell className="text-right font-mono font-bold text-emerald-400">{formatCurrency(p.amount)}</TableCell>
                    <TableCell className="text-center">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${paymentStatusClasses[p.status] || "bg-zinc-800 text-zinc-400 border-zinc-700"}`}>
                        {p.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${paymentTypeClasses[p.paymentMethod] || "bg-zinc-800 text-zinc-400 border-zinc-700"}`}>
                        {p.paymentMethod}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-mono text-zinc-400 text-[11px]">{formatDate(p.createdAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* ADD / EDIT EXPENSE OVERLAY MODAL */}
      {showExpenseModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0c0c0e] border border-zinc-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="border-b border-zinc-800 pb-3 flex justify-between items-center">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Receipt className="w-4 h-4 text-emerald-400" />
                {editingExpense ? "Edit Expense Entry" : "Record New Expense"}
              </h3>
              <button 
                onClick={() => setShowExpenseModal(false)} 
                className="text-zinc-400 hover:text-white text-lg font-mono p-1 rounded-lg"
              >
                ×
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-[10px] text-zinc-400 font-bold uppercase block mb-1">Expense Category</label>
                <select
                  value={expenseForm.category}
                  onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
                  className="w-full bg-[#141416] border border-zinc-700 rounded-xl px-3 h-10 text-xs font-semibold text-zinc-200 focus:outline-none focus:border-zinc-500 cursor-pointer"
                >
                  {EXPENSE_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat} className="bg-zinc-950 text-zinc-200">{cat}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-zinc-400 font-bold uppercase block mb-1">Amount (₹)</label>
                  <Input 
                    type="number"
                    placeholder="e.g. 1500" 
                    value={expenseForm.amount}
                    onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                    className="bg-[#141416] border-zinc-700 text-xs text-zinc-200 h-10 font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-zinc-400 font-bold uppercase block mb-1">Date</label>
                  <Input 
                    type="date"
                    value={expenseForm.date}
                    onChange={(e) => setExpenseForm({ ...expenseForm, date: e.target.value })}
                    className="bg-[#141416] border-zinc-700 text-xs text-zinc-200 h-10 font-mono"
                  />
                </div>
              </div>

              {/* Recurring Toggle */}
              <div className="bg-[#141416] border border-zinc-800 rounded-xl p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-zinc-200 text-xs">Recurring Expense</p>
                    <p className="text-[10px] text-zinc-500">Auto-calculated into monthly/weekly reports</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={expenseForm.isRecurring}
                    onChange={(e) => setExpenseForm({ ...expenseForm, isRecurring: e.target.checked })}
                    className="w-4 h-4 rounded border-zinc-700 bg-zinc-900 text-emerald-500 focus:ring-0 cursor-pointer"
                  />
                </div>

                {expenseForm.isRecurring && (
                  <div className="grid grid-cols-2 gap-3 border-t border-zinc-800 pt-3">
                    <div>
                      <label className="text-[10px] text-zinc-400 font-bold uppercase block mb-1">Frequency</label>
                      <select
                        value={expenseForm.recurrenceFrequency}
                        onChange={(e) => setExpenseForm({ ...expenseForm, recurrenceFrequency: e.target.value })}
                        className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 h-9 text-xs text-zinc-200 focus:outline-none"
                      >
                        <option value="monthly">Monthly</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] text-zinc-400 font-bold uppercase block mb-1">End Date (Optional)</label>
                      <Input 
                        type="date"
                        value={expenseForm.recurrenceEndDate}
                        onChange={(e) => setExpenseForm({ ...expenseForm, recurrenceEndDate: e.target.value })}
                        className="bg-zinc-900 border-zinc-700 text-xs text-zinc-200 h-9 font-mono"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="text-[10px] text-zinc-400 font-bold uppercase block mb-1">Note / Description (Optional)</label>
                <Input 
                  placeholder="e.g. Monthly shop rent payment" 
                  value={expenseForm.note}
                  onChange={(e) => setExpenseForm({ ...expenseForm, note: e.target.value })}
                  className="bg-[#141416] border-zinc-700 text-xs text-zinc-200 h-10"
                />
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-3 border-t border-zinc-800/80">
              <Button 
                onClick={() => setShowExpenseModal(false)} 
                variant="outline" 
                className="border-zinc-800 text-zinc-400 text-xs h-9 rounded-xl cursor-pointer"
              >
                Cancel
              </Button>
              <Button 
                onClick={() => {
                  if (!expenseForm.amount || Number(expenseForm.amount) <= 0) {
                    toast.error("Please enter a valid amount greater than 0");
                    return;
                  }
                  expenseMutation.mutate({
                    category: expenseForm.category,
                    amount: Number(expenseForm.amount),
                    note: expenseForm.note,
                    isRecurring: expenseForm.isRecurring,
                    date: expenseForm.date,
                    recurrenceFrequency: expenseForm.isRecurring ? expenseForm.recurrenceFrequency : null,
                    recurrenceEndDate: expenseForm.isRecurring && expenseForm.recurrenceEndDate ? expenseForm.recurrenceEndDate : null,
                  });
                }}
                disabled={expenseMutation.isPending}
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs h-9 rounded-xl px-4 cursor-pointer font-semibold"
              >
                {expenseMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : editingExpense ? "Update Expense" : "Save Expense"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* RECORD REFUND OVERLAY MODAL */}
      {showRefundModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="border-b border-zinc-800 pb-3 flex justify-between items-center">
              <h3 className="text-sm font-bold text-zinc-200 flex items-center gap-1.5">
                <RotateCcw className="w-4 h-4 text-purple-400" /> Manual Payment Refund
              </h3>
              <button onClick={() => setShowRefundModal(false)} className="text-zinc-450 hover:text-white text-lg">×</button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-[10px] text-zinc-455 font-bold uppercase block mb-1">Target Payment Document ID</label>
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
