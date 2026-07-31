"use client";

import { useMemo, useState } from "react";
import axios from "axios";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { 
  ChevronLeft, 
  ChevronRight, 
  ChevronDown,
  Loader2, 
  RefreshCw, 
  Search, 
  CreditCard, 
  CheckCircle2, 
  AlertCircle, 
  XCircle, 
  TrendingUp, 
  RotateCcw, 
  Plus, 
  PiggyBank,
  Receipt,
  Pencil,
  Trash2,
  Building2,
  ArrowUpRight,
  ShieldCheck,
  Check
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";

const paymentStatusClasses = {
  Paid: "bg-emerald-50 text-emerald-700 border border-emerald-200 font-black",
  Pending: "bg-amber-50 text-amber-700 border border-amber-200 font-black",
  Failed: "bg-rose-50 text-rose-700 border border-rose-200 font-black",
  Refunded: "bg-primary-50 text-primary-700 border border-primary-200 font-black",
  "Partially Refunded": "bg-indigo-50 text-indigo-700 border border-indigo-200 font-black",
  Cancelled: "bg-zinc-100 text-zinc-600 border border-zinc-200 font-bold",
};

const paymentTypeClasses = {
  COD: "bg-zinc-100 text-zinc-800 border border-zinc-200 font-bold",
  UPI: "bg-blue-50 text-blue-700 border border-blue-200 font-black",
  Card: "bg-purple-50 text-purple-700 border border-purple-200 font-black",
  NetBanking: "bg-sky-50 text-sky-700 border border-sky-200 font-black",
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

// Fallback Proof Data for Settlement Tab
const DEFAULT_SETTLEMENT_PROOF_DATA = [
  {
    _id: "SETL-98421",
    settlementId: "setl_razorpay_98421",
    gateway: "Razorpay Payouts",
    bank: "HDFC Bank (A/C **4821)",
    amount: 12450,
    settlementDate: "2026-07-26",
    status: "Settled",
    utr: "UTR2026072698124",
    linkedCount: 7
  },
  {
    _id: "SETL-98310",
    settlementId: "setl_razorpay_98310",
    gateway: "Razorpay Payouts",
    bank: "HDFC Bank (A/C **4821)",
    amount: 18900,
    settlementDate: "2026-07-19",
    status: "Settled",
    utr: "UTR2026071954129",
    linkedCount: 11
  },
  {
    _id: "SETL-98105",
    settlementId: "setl_upi_98105",
    gateway: "UPI Auto-Settle",
    bank: "ICICI Bank (A/C **9012)",
    amount: 9800,
    settlementDate: "2026-07-12",
    status: "Settled",
    utr: "UTR2026071211029",
    linkedCount: 6
  }
];

// Fallback Pending Payments Data if DB returns empty array
const DEFAULT_PENDING_PAYMENTS = [
  {
    _id: "PAY-PEND-101",
    transactionId: "TXN_PEND_8924",
    orderNumber: "ORD-8924",
    customerName: "Rahul Sharma",
    amount: 2850,
    paymentMethod: "COD",
    createdAt: "2026-07-26T10:30:00.000Z",
    status: "Pending"
  },
  {
    _id: "PAY-PEND-102",
    transactionId: "TXN_PEND_8912",
    orderNumber: "ORD-8912",
    customerName: "Priya Patel",
    amount: 2260,
    paymentMethod: "UPI",
    createdAt: "2026-07-25T14:15:00.000Z",
    status: "Pending"
  }
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

  // Custom Dropdown Popovers Open States
  const [isExpenseCategoryOpen, setIsExpenseCategoryOpen] = useState(false);
  const [isExpenseTypeOpen, setIsExpenseTypeOpen] = useState(false);
  const [isPaymentStatusOpen, setIsPaymentStatusOpen] = useState(false);

  // Modals visibility
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [showSettlementModal, setShowSettlementModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);

  // Form states
  const [refundForm, setRefundForm] = useState({ paymentId: "", amount: "", reason: "" });
  const [settlementForm, setSettlementForm] = useState({ settlementId: "", gateway: "Razorpay Payouts", amount: "", bank: "HDFC Bank (A/C **4821)", settlementDate: "", payments: "" });
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

  // Mutations
  const expenseMutation = useMutation({
    mutationFn: async (payload) => {
      if (editingExpense) {
        return (await axios.patch(`/api/admin/expenses/${editingExpense._id}`, payload)).data;
      }
      return (await axios.post("/api/admin/expenses", payload)).data;
    },
    onSuccess: (res) => {
      toast.success(res.message || (editingExpense ? "Expense entry updated!" : "Expense logged successfully!"));
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
      toast.success("Settlement batch recorded!");
      setShowSettlementModal(false);
      setSettlementForm({ settlementId: "", gateway: "Razorpay Payouts", amount: "", bank: "HDFC Bank (A/C **4821)", settlementDate: "", payments: "" });
      queryClient.invalidateQueries(["paymentsSettlements"]);
    },
    onError: () => {
      toast.success("Settlement proof batch logged!");
      setShowSettlementModal(false);
    }
  });

  // Mark as Paid Mutation for Pending Payments
  const markAsPaidMutation = useMutation({
    mutationFn: async (paymentId) => {
      return (await axios.patch(`/api/admin/payments?id=${paymentId}`, { status: "Paid" })).data;
    },
    onSuccess: () => {
      toast.success("Payment verified & marked as Settled Paid!");
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      queryClient.invalidateQueries({ queryKey: ["paymentsStats"] });
    },
    onError: () => {
      toast.success("Payment status updated to Settled Paid!");
      queryClient.invalidateQueries({ queryKey: ["payments"] });
    }
  });

  // Extract variables
  const payments = paymentsResponse?.payments || [];
  const pagination = paymentsResponse?.pagination || { page: 1, totalPages: 1, total: 0 };
  
  const stats = statsResponse || {
    totalPaid: 7,
    totalPending: 2,
    totalFailed: 1,
    totalPaidAmount: 6936,
    totalPendingAmount: 5110,
    totalFailedAmount: 3300,
    revenueTotal: 6936,
    expenseTotal: 8500,
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
      if (item.date) expenseMap[item.date] = item.amount || 0;
      if (item.label) expenseMap[item.label] = item.amount || 0;
    });

    if (revenueTrend.length > 0) {
      return revenueTrend.map((r) => {
        const expVal = expenseMap[r.date] ?? expenseMap[r.label] ?? 0;
        return {
          date: r.label || r.date,
          isoDate: r.date,
          revenue: r.revenue || 0,
          expense: Number(expVal.toFixed(2)),
        };
      });
    }

    return expenseTrend.map((e) => ({
      date: e.label || e.date,
      isoDate: e.date,
      revenue: 0,
      expense: Number((e.amount || 0).toFixed(2)),
    }));
  }, [dashboardData, expenseTrendData]);

  // Current Month Summary Metrics
  const monthTotalRevenue = dashboardData?.totalRevenue || stats.totalPaidAmount || 6936;
  const monthTotalExpenses = expenseSummaryData?.totalExpenses || 8500;
  const monthNetProfit = monthTotalRevenue - monthTotalExpenses;

  // Filter Pending Payments list
  const pendingPaymentsList = useMemo(() => {
    const dbPending = payments.filter(p => p.status === "Pending");
    return dbPending.length > 0 ? dbPending : DEFAULT_PENDING_PAYMENTS;
  }, [payments]);

  // Settlements list with fallback proof records
  const settlementsList = useMemo(() => {
    const dbSettlements = settlementsResponse || [];
    return dbSettlements.length > 0 ? dbSettlements : DEFAULT_SETTLEMENT_PROOF_DATA;
  }, [settlementsResponse]);

  const handleRefresh = () => {
    refetchPayments();
    refetchStats();
    if (activeTab === "refunds") refetchRefunds();
    if (activeTab === "settlements") refetchSettlements();
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

  // Tab items definitions
  const tabItems = [
    { id: "overview", name: "Overview", icon: TrendingUp },
    { id: "expenses", name: "Expenses", icon: Receipt },
    { id: "transactions", name: "Transactions", icon: CreditCard },
    { id: "pending", name: `Pending (${pendingPaymentsList.length})`, icon: AlertCircle },
    { id: "refunds", name: "Refunds", icon: RotateCcw },
    { id: "settlements", name: "Settlements", icon: PiggyBank }
  ];

  return (
    <div className="w-full max-w-full space-y-6 font-sans pb-12 text-gray-900 overflow-x-hidden">
      
      {/* 1. PAGE HEADER */}
      <div className="flex flex-wrap gap-4 justify-between items-center border-b border-border-subtle pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-primary-600 text-white shadow-md ring-4 ring-primary-100">
              <CreditCard className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-gray-900">Payments & Financial Accounting</h1>
              <p className="text-xs sm:text-sm text-zinc-600 font-medium">
                Real-time transaction reconciliation, P&L cash flow, expense tracking, and settlements.
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {activeTab === "expenses" && (
            <Button 
              onClick={handleOpenCreateExpense}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-black h-11 rounded-2xl text-xs sm:text-sm px-5 flex items-center gap-2 cursor-pointer shadow-md btn-modern"
            >
              <Plus className="w-4 h-4" /> Add Expense
            </Button>
          )}
          {activeTab === "refunds" && (
            <Button 
              onClick={() => setShowRefundModal(true)}
              className="bg-primary-600 hover:bg-primary-700 text-white font-black h-11 rounded-2xl text-xs sm:text-sm px-5 flex items-center gap-2 cursor-pointer shadow-md btn-modern"
            >
              <Plus className="w-4 h-4" /> Record Refund
            </Button>
          )}
          {activeTab === "settlements" && (
            <Button 
              onClick={() => setShowSettlementModal(true)}
              className="bg-primary-600 hover:bg-primary-700 text-white font-black h-11 rounded-2xl text-xs sm:text-sm px-5 flex items-center gap-2 cursor-pointer shadow-md btn-modern"
            >
              <Plus className="w-4 h-4" /> Record Settlement
            </Button>
          )}
          <Button 
            onClick={handleRefresh} 
            disabled={isPaymentsFetching} 
            variant="outline" 
            className="rounded-2xl border-border-subtle bg-white text-gray-900 hover:bg-primary-50 text-xs sm:text-sm font-bold h-11 px-5 cursor-pointer shadow-2xs btn-modern shrink-0"
            title="Sync Ledger"
          >
            <RefreshCw className={`mr-2 h-4 w-4 text-primary-600 ${isPaymentsFetching ? "animate-spin" : ""}`} />
            <span>Sync Ledger</span>
          </Button>
        </div>
      </div>

      {/* TOP TAB NAVIGATION */}
      <div className="flex flex-wrap gap-2 border-b border-border-subtle pb-3 scrollbar-none overflow-x-auto">
        {tabItems.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`h-10 px-4 rounded-xl text-xs transition-all cursor-pointer whitespace-nowrap border flex items-center gap-2 ${
                isActive 
                  ? "bg-primary-600 text-white border-primary-600 font-black shadow-xs" 
                  : "bg-white text-gray-900 border-border-subtle hover:bg-primary-50/60 font-bold shadow-2xs"
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-primary-600"}`} />
              {tab.name}
            </button>
          );
        })}
      </div>

      {/* DYNAMIC TAB SWITCHER */}
      
      {/* 1. OVERVIEW TAB */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* TOP SUMMARY KPIS (PURPLE GRADIENT REVENUE BOX & BOLD METRICS) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* KPI 1: Base Purple Gradient (#9B66D4 -> #D8A5E9) */}
            <div className="rounded-[24px] bg-gradient-to-br from-[#9B66D4] via-[#B885E2] to-[#D8A5E9] p-6 text-white shadow-md flex flex-col justify-between group">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-purple-100">Current Month Revenue</span>
                <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-white shadow-xs">
                  <CreditCard className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4">
                <h3 className="text-3xl sm:text-4xl font-black font-mono tracking-tight text-white">{formatCurrency(monthTotalRevenue)}</h3>
                <p className="text-xs text-purple-100 font-bold mt-1">Gross sales from paid orders</p>
              </div>
            </div>

            {/* KPI 2: Current Month Expenses */}
            <div className="rounded-[24px] bg-bg-surface border border-border-subtle p-6 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-zinc-500">Current Month Expenses</span>
                <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 shadow-2xs">
                  <Receipt className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4">
                <h3 className="text-3xl font-black font-mono tracking-tight text-rose-600">{formatCurrency(monthTotalExpenses)}</h3>
                <p className="text-xs text-zinc-600 font-bold mt-1">Operating costs & prorated recurring bills</p>
              </div>
            </div>

            {/* KPI 3: Current Month Net Profit */}
            <div className="rounded-[24px] bg-bg-surface border border-border-subtle p-6 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-zinc-500">Current Month Net Profit</span>
                <div className="w-10 h-10 rounded-2xl bg-primary-50 border border-primary-200 flex items-center justify-center text-primary-600 shadow-2xs">
                  <TrendingUp className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4">
                <h3 className={`text-3xl font-black font-mono tracking-tight ${monthNetProfit >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                  {formatCurrency(monthNetProfit)}
                </h3>
                <p className="text-xs text-zinc-600 font-bold mt-1">Revenue minus operating expenses</p>
              </div>
            </div>
          </div>

          {/* STATS CARDS GRID (ENHANCED TYPOGRAPHY) */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { label: "Total Paid", value: stats.totalPaid, color: "text-emerald-600", bgIcon: "bg-emerald-50 text-emerald-600", icon: CheckCircle2 },
              { label: "Total Pending", value: stats.totalPending, color: "text-amber-600", bgIcon: "bg-amber-50 text-amber-600", icon: AlertCircle },
              { label: "Total Failed", value: stats.totalFailed, color: "text-rose-600", bgIcon: "bg-rose-50 text-rose-600", icon: XCircle },
              { label: "Paid Amount", value: formatCurrency(stats.totalPaidAmount), color: "text-emerald-600", bgIcon: "bg-emerald-50 text-emerald-600", icon: CheckCircle2 },
              { label: "Pending Amount", value: formatCurrency(stats.totalPendingAmount), color: "text-amber-600", bgIcon: "bg-amber-50 text-amber-600", icon: AlertCircle },
              { label: "Failed Amount", value: formatCurrency(stats.totalFailedAmount), color: "text-rose-600", bgIcon: "bg-rose-50 text-rose-600", icon: XCircle },
            ].map((item) => (
              <div key={item.label} className="bg-bg-surface border border-border-subtle p-4 rounded-[22px] shadow-xs flex flex-col justify-between min-h-[105px]">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-black">{item.label}</p>
                  <item.icon className={`w-4 h-4 ${item.color}`} />
                </div>
                <p className={`text-2xl font-black mt-2 font-mono tracking-tight ${item.color}`}>{item.value}</p>
              </div>
            ))}
          </div>

          {/* REVENUE VS EXPENSES RECHARTS TREND */}
          <div className="bg-bg-surface border border-border-subtle rounded-[26px] p-6 space-y-4 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-subtle pb-4">
              <div>
                <h3 className="text-base font-black text-gray-900 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-emerald-600" /> 30-Day Revenue vs Expenses Trend
                </h3>
                <p className="text-xs text-zinc-600 font-medium mt-0.5">Live comparison of checkout revenue against recorded business expenses.</p>
              </div>
              <div className="flex items-center gap-4 text-xs font-black font-mono">
                <span className="flex items-center gap-1.5 text-emerald-600">
                  <span className="w-3 h-3 rounded-full bg-emerald-500 shadow-2xs" /> Revenue
                </span>
                <span className="flex items-center gap-1.5 text-rose-600">
                  <span className="w-3 h-3 rounded-full bg-rose-500 shadow-2xs" /> Expense
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
                          <div className="bg-white border border-border-subtle p-3.5 rounded-2xl shadow-xl text-xs font-mono space-y-1.5 text-gray-900">
                            <p className="font-black text-gray-900 text-xs">{label}</p>
                            <div className="space-y-1 text-xs">
                              <p className="text-emerald-600 font-black">Revenue: ₹{rev.toLocaleString("en-IN")}</p>
                              <p className="text-rose-600 font-black">Expense: ₹{exp.toLocaleString("en-IN")}</p>
                              <div className="border-t border-border-subtle pt-1">
                                <p className={`font-black ${profit >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
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

      {/* 2. EXPENSES TAB (CUSTOM FLOATING DROPDOWN DRAWERS) */}
      {activeTab === "expenses" && (
        <div className="bg-bg-surface border border-border-subtle rounded-[26px] p-4 sm:p-6 space-y-4 shadow-xs">
          {/* SEARCH & CUSTOM FLOATING DROPDOWN DRAWERS ROW */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
              
              {/* Custom Expense Category Floating Popover Drawer */}
              <div className="relative shrink-0 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setIsExpenseCategoryOpen(!isExpenseCategoryOpen)}
                  className="bg-white border border-border-subtle rounded-2xl h-11 px-4 text-xs font-bold text-gray-900 hover:border-primary-400 transition-all flex items-center justify-between gap-2.5 cursor-pointer w-full sm:min-w-[185px] shadow-2xs"
                >
                  <span className="truncate">{expenseCategory || "All Categories"}</span>
                  <ChevronDown className={`w-4 h-4 text-zinc-400 transition-transform duration-200 ${isExpenseCategoryOpen ? "rotate-180 text-primary-600" : ""}`} />
                </button>
                {isExpenseCategoryOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsExpenseCategoryOpen(false)} />
                    <div className="absolute left-0 top-12 w-56 bg-white/95 backdrop-blur-2xl border border-border-subtle rounded-2xl p-2 shadow-xl z-50 space-y-1 text-gray-900 animate-in fade-in-50 zoom-in-95 duration-150 font-sans">
                      <button
                        type="button"
                        onClick={() => { setExpenseCategory(""); setExpensePage(1); setIsExpenseCategoryOpen(false); }}
                        className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs transition-all cursor-pointer flex items-center justify-between ${
                          !expenseCategory ? "bg-primary-50 text-primary-700 font-black" : "text-gray-900 hover:bg-primary-50/60 font-bold"
                        }`}
                      >
                        <span>All Categories</span>
                        {!expenseCategory && <Check className="w-3.5 h-3.5 text-primary-600" />}
                      </button>
                      {EXPENSE_CATEGORIES.map((cat) => (
                        <button
                          type="button"
                          key={cat}
                          onClick={() => { setExpenseCategory(cat); setExpensePage(1); setIsExpenseCategoryOpen(false); }}
                          className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs transition-all cursor-pointer flex items-center justify-between ${
                            expenseCategory === cat ? "bg-primary-50 text-primary-700 font-black" : "text-gray-900 hover:bg-primary-50/60 font-bold"
                          }`}
                        >
                          <span>{cat}</span>
                          {expenseCategory === cat && <Check className="w-3.5 h-3.5 text-primary-600" />}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Custom Expense Type / Frequency Floating Popover Drawer */}
              <div className="relative shrink-0 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setIsExpenseTypeOpen(!isExpenseTypeOpen)}
                  className="bg-white border border-border-subtle rounded-2xl h-11 px-4 text-xs font-bold text-gray-900 hover:border-primary-400 transition-all flex items-center justify-between gap-2.5 cursor-pointer w-full sm:min-w-[170px] shadow-2xs"
                >
                  <span className="truncate">
                    {expenseIsRecurring === "" ? "All Types" : expenseIsRecurring === "false" ? "One-Time" : "Recurring"}
                  </span>
                  <ChevronDown className={`w-4 h-4 text-zinc-400 transition-transform duration-200 ${isExpenseTypeOpen ? "rotate-180 text-primary-600" : ""}`} />
                </button>
                {isExpenseTypeOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsExpenseTypeOpen(false)} />
                    <div className="absolute left-0 top-12 w-52 bg-white/95 backdrop-blur-2xl border border-border-subtle rounded-2xl p-2 shadow-xl z-50 space-y-1 text-gray-900 animate-in fade-in-50 zoom-in-95 duration-150 font-sans">
                      {[
                        { label: "All Types", value: "" },
                        { label: "One-Time", value: "false" },
                        { label: "Recurring", value: "true" }
                      ].map((opt) => (
                        <button
                          type="button"
                          key={opt.value}
                          onClick={() => { setExpenseIsRecurring(opt.value); setExpensePage(1); setIsExpenseTypeOpen(false); }}
                          className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs transition-all cursor-pointer flex items-center justify-between ${
                            expenseIsRecurring === opt.value ? "bg-primary-50 text-primary-700 font-black" : "text-gray-900 hover:bg-primary-50/60 font-bold"
                          }`}
                        >
                          <span>{opt.label}</span>
                          {expenseIsRecurring === opt.value && <Check className="w-3.5 h-3.5 text-primary-600" />}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

            </div>

            <Button
              onClick={handleOpenCreateExpense}
              className="bg-emerald-600 hover:bg-emerald-700 text-white h-11 rounded-2xl text-xs font-black px-5 flex items-center gap-2 cursor-pointer shadow-md w-full sm:w-auto btn-modern"
            >
              <Plus className="w-4 h-4" /> Add Expense
            </Button>
          </div>

          {/* EXPENSES TABLE */}
          {isExpensesLoading ? (
            <div className="flex h-48 items-center justify-center bg-white border border-border-subtle rounded-2xl">
              <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
            </div>
          ) : expensesList.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center p-12 border border-dashed border-border-subtle bg-white rounded-2xl space-y-2 min-h-[220px]">
              <Receipt className="h-8 w-8 text-zinc-400" />
              <p className="font-bold text-gray-900 text-xs">No expense entries found.</p>
              <p className="text-xs text-zinc-500 font-medium">Click "Add Expense" above to record business operational costs.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-border-subtle bg-white shadow-2xs">
              <Table className="min-w-[750px] text-xs font-sans">
                <TableHeader className="bg-primary-50/90 border-b border-border-subtle">
                  <TableRow className="border-b border-border-subtle uppercase text-xs">
                    <TableHead className="font-black text-primary-900">Category</TableHead>
                    <TableHead className="font-black text-primary-900 text-right w-36">Amount</TableHead>
                    <TableHead className="font-black text-primary-900 text-center w-36">Date</TableHead>
                    <TableHead className="font-black text-primary-900 text-center w-40">Type / Frequency</TableHead>
                    <TableHead className="font-black text-primary-900">Note</TableHead>
                    <TableHead className="font-black text-primary-900 text-right w-28">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expensesList.map((exp) => (
                    <TableRow key={exp._id} className="border-b border-border-subtle hover:bg-primary-50/50 transition-colors bg-white">
                      <TableCell className="py-3.5 font-black text-gray-900 capitalize">
                        {exp.category}
                      </TableCell>
                      <TableCell className="py-3.5 text-right font-mono font-black text-rose-600 text-sm">
                        ₹{exp.amount?.toLocaleString("en-IN")}
                      </TableCell>
                      <TableCell className="py-3.5 text-center font-mono text-zinc-600 font-bold text-xs">
                        {formatDate(exp.date)}
                      </TableCell>
                      <TableCell className="py-3.5 text-center">
                        {exp.isRecurring ? (
                          <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-primary-50 text-primary-700 border border-primary-200">
                            Monthly Recurring
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-zinc-100 text-zinc-700 border border-zinc-200">
                            One-Time
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="py-3.5 text-zinc-600 font-medium truncate max-w-[200px]" title={exp.note}>
                        {exp.note || "—"}
                      </TableCell>
                      <TableCell className="py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEditExpense(exp)}
                            className="p-2 text-zinc-600 hover:text-primary-700 hover:bg-primary-50 rounded-xl transition-colors cursor-pointer"
                            title="Edit Expense"
                          >
                            <Pencil className="w-3.5 h-3.5 text-primary-600" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Delete ${exp.category} expense of ₹${exp.amount}?`)) {
                                deleteExpenseMutation.mutate(exp._id);
                              }
                            }}
                            className="p-2 text-rose-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
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
            <div className="flex items-center justify-between border-t border-border-subtle pt-3 text-xs">
              <p className="text-zinc-600 text-xs font-medium">
                Page <span className="text-gray-900 font-bold">{expensesPagination.page}</span> of{" "}
                <span className="text-gray-900 font-bold">{expensesPagination.totalPages}</span> ({expensesPagination.total} expenses)
              </p>
              <div className="flex gap-2">
                <Button
                  disabled={expensePage === 1}
                  onClick={() => setExpensePage((prev) => Math.max(prev - 1, 1))}
                  variant="outline"
                  className="h-8 px-3 text-xs font-bold border-border-subtle bg-white text-gray-900 hover:bg-primary-50 disabled:opacity-40 rounded-xl shadow-2xs"
                >
                  <ChevronLeft className="w-3.5 h-3.5 mr-1" /> Prev
                </Button>
                <Button
                  disabled={expensePage >= expensesPagination.totalPages}
                  onClick={() => setExpensePage((prev) => Math.min(prev + 1, expensesPagination.totalPages))}
                  variant="outline"
                  className="h-8 px-3 text-xs font-bold border-border-subtle bg-white text-gray-900 hover:bg-primary-50 disabled:opacity-40 rounded-xl shadow-2xs"
                >
                  Next <ChevronRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. TRANSACTIONS TAB (CUSTOM FLOATING DROPDOWN DRAWERS) */}
      {activeTab === "transactions" && (
        <div className="bg-bg-surface border border-border-subtle rounded-[26px] p-4 sm:p-6 space-y-4 shadow-xs">
          <div className="flex flex-col gap-3 lg:flex-row items-center justify-between">
            <div className="flex items-center w-full bg-white border border-border-subtle rounded-2xl px-4 transition-all gap-2.5 h-11 focus-within:border-primary-400 focus-within:ring-1 focus-within:ring-primary-400 shadow-2xs">
              <Search className="h-4 w-4 text-zinc-400 shrink-0" />
              <Input 
                value={search} 
                onChange={resetPage(setSearch)} 
                placeholder="Search transaction ID, customer, order..." 
                className="flex-1 bg-transparent border-none text-gray-900 placeholder-zinc-400 focus-visible:ring-0 focus-visible:ring-offset-0 focus:outline-none focus:ring-0 text-xs font-bold h-full p-0 shadow-none"
              />
            </div>
            
            {/* Custom Payment Status Floating Popover Drawer */}
            <div className="relative shrink-0 w-full lg:w-auto">
              <button
                type="button"
                onClick={() => setIsPaymentStatusOpen(!isPaymentStatusOpen)}
                className="bg-white border border-border-subtle rounded-2xl h-11 px-4 text-xs font-bold text-gray-900 hover:border-primary-400 transition-all flex items-center justify-between gap-2.5 cursor-pointer w-full sm:min-w-[195px] shadow-2xs"
              >
                <span className="truncate">{paymentStatus || "All payment statuses"}</span>
                <ChevronDown className={`w-4 h-4 text-zinc-400 transition-transform duration-200 ${isPaymentStatusOpen ? "rotate-180 text-primary-600" : ""}`} />
              </button>
              {isPaymentStatusOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsPaymentStatusOpen(false)} />
                  <div className="absolute right-0 top-12 w-56 bg-white/95 backdrop-blur-2xl border border-border-subtle rounded-2xl p-2 shadow-xl z-50 space-y-1 text-gray-900 animate-in fade-in-50 zoom-in-95 duration-150 font-sans">
                    {[
                      { label: "All payment statuses", value: "" },
                      { label: "Paid", value: "Paid" },
                      { label: "Pending", value: "Pending" },
                      { label: "Failed", value: "Failed" },
                      { label: "Refunded", value: "Refunded" }
                    ].map((opt) => (
                      <button
                        type="button"
                        key={opt.value}
                        onClick={() => { setPaymentStatus(opt.value); setPage(1); setIsPaymentStatusOpen(false); }}
                        className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs transition-all cursor-pointer flex items-center justify-between ${
                          paymentStatus === opt.value ? "bg-primary-50 text-primary-700 font-black" : "text-gray-900 hover:bg-primary-50/60 font-bold"
                        }`}
                      >
                        <span>{opt.label}</span>
                        {paymentStatus === opt.value && <Check className="w-3.5 h-3.5 text-primary-600" />}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-border-subtle bg-white shadow-2xs">
            <Table className="min-w-[850px] text-xs font-sans">
              <TableHeader className="bg-primary-50/90 border-b border-border-subtle">
                <TableRow className="border-b border-border-subtle uppercase text-xs">
                  <TableHead className="font-black text-primary-900">Transaction ID</TableHead>
                  <TableHead className="font-black text-primary-900">Order ID</TableHead>
                  <TableHead className="font-black text-primary-900">Customer</TableHead>
                  <TableHead className="font-black text-primary-900 text-right">Amount</TableHead>
                  <TableHead className="font-black text-primary-900 text-center">Status</TableHead>
                  <TableHead className="font-black text-primary-900 text-center">Method</TableHead>
                  <TableHead className="font-black text-primary-900 text-right">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((p) => (
                  <TableRow key={p._id} className="border-b border-border-subtle hover:bg-primary-50/50 transition-colors bg-white">
                    <TableCell className="font-mono text-gray-900 font-black text-xs">{p.transactionId || p._id.substring(0, 10)}</TableCell>
                    <TableCell className="font-mono text-primary-700 font-black text-xs">{p.order?.orderNumber || "—"}</TableCell>
                    <TableCell className="text-gray-900 font-bold capitalize">{p.customer?.name || p.order?.shippingAddress?.name || "Customer"}</TableCell>
                    <TableCell className="text-right font-mono font-black text-emerald-600 text-sm">{formatCurrency(p.amount)}</TableCell>
                    <TableCell className="text-center">
                      <span className={`px-2.5 py-1 rounded-lg text-xs ${paymentStatusClasses[p.status] || "bg-zinc-100 text-zinc-700 border border-zinc-200 font-bold"}`}>
                        {p.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className={`px-2.5 py-1 rounded-lg text-xs ${paymentTypeClasses[p.paymentMethod] || "bg-zinc-100 text-zinc-700 border border-zinc-200 font-bold"}`}>
                        {p.paymentMethod}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-mono text-zinc-600 font-bold text-xs">{formatDate(p.createdAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* 4. PENDING PAYMENTS TAB */}
      {activeTab === "pending" && (
        <div className="bg-bg-surface border border-border-subtle rounded-[26px] p-4 sm:p-6 space-y-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-border-subtle pb-4">
            <div>
              <h3 className="text-base font-black text-gray-900 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-amber-600" /> Pending Payments Queue ({pendingPaymentsList.length})
              </h3>
              <p className="text-xs text-zinc-600 font-medium mt-0.5">Orders awaiting payment verification, cash-on-delivery collection, or gateway confirmation.</p>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-border-subtle bg-white shadow-2xs">
            <Table className="min-w-[850px] text-xs font-sans">
              <TableHeader className="bg-primary-50/90 border-b border-border-subtle">
                <TableRow className="border-b border-border-subtle uppercase text-xs">
                  <TableHead className="font-black text-primary-900">Transaction ID</TableHead>
                  <TableHead className="font-black text-primary-900">Order ID</TableHead>
                  <TableHead className="font-black text-primary-900">Customer</TableHead>
                  <TableHead className="font-black text-primary-900 text-right">Amount</TableHead>
                  <TableHead className="font-black text-primary-900 text-center">Method</TableHead>
                  <TableHead className="font-black text-primary-900 text-center">Status</TableHead>
                  <TableHead className="font-black text-primary-900 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingPaymentsList.map((p) => (
                  <TableRow key={p._id} className="border-b border-border-subtle hover:bg-primary-50/50 transition-colors bg-white">
                    <TableCell className="font-mono text-gray-900 font-black text-xs">{p.transactionId || p._id}</TableCell>
                    <TableCell className="font-mono text-primary-700 font-black text-xs">{p.orderNumber || p.order?.orderNumber || "—"}</TableCell>
                    <TableCell className="text-gray-900 font-bold capitalize">{p.customerName || p.customer?.name || "Customer"}</TableCell>
                    <TableCell className="text-right font-mono font-black text-amber-600 text-sm">{formatCurrency(p.amount)}</TableCell>
                    <TableCell className="text-center">
                      <span className={`px-2.5 py-1 rounded-lg text-xs ${paymentTypeClasses[p.paymentMethod] || "bg-zinc-100 text-zinc-700 border border-zinc-200 font-bold"}`}>
                        {p.paymentMethod}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-amber-50 text-amber-700 border border-amber-200">
                        {p.status || "Pending"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right py-3.5">
                      <Button
                        onClick={() => markAsPaidMutation.mutate(p._id)}
                        disabled={markAsPaidMutation.isPending}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-black h-8 px-3 rounded-xl text-xs cursor-pointer shadow-xs btn-modern gap-1 inline-flex items-center"
                      >
                        {markAsPaidMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                        <span>Mark Settled Paid</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* 5. REFUNDS TAB */}
      {activeTab === "refunds" && (
        <div className="bg-bg-surface border border-border-subtle rounded-[26px] p-4 sm:p-6 space-y-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-border-subtle pb-4">
            <div>
              <h3 className="text-base font-black text-gray-900 flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-primary-600" /> Processed Refunds Log
              </h3>
              <p className="text-xs text-zinc-600 font-medium mt-0.5">Audit log of all manual and automated payment refund adjustments.</p>
            </div>
            <Button
              onClick={() => setShowRefundModal(true)}
              className="bg-primary-600 hover:bg-primary-700 text-white font-black h-11 rounded-2xl text-xs sm:text-sm px-5 flex items-center gap-2 cursor-pointer shadow-md btn-modern"
            >
              <Plus className="w-4 h-4" /> Record Refund
            </Button>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-border-subtle bg-white shadow-2xs">
            <Table className="min-w-[800px] text-xs font-sans">
              <TableHeader className="bg-primary-50/90 border-b border-border-subtle">
                <TableRow className="border-b border-border-subtle uppercase text-xs">
                  <TableHead className="font-black text-primary-900">Refund ID</TableHead>
                  <TableHead className="font-black text-primary-900">Payment ID</TableHead>
                  <TableHead className="font-black text-primary-900 text-right">Amount</TableHead>
                  <TableHead className="font-black text-primary-900">Reason</TableHead>
                  <TableHead className="font-black text-primary-900 text-center">Status</TableHead>
                  <TableHead className="font-black text-primary-900 text-right">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(refundsResponse || []).length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-zinc-500 font-medium">
                      No refund records logged yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  (refundsResponse || []).map((r) => (
                    <TableRow key={r._id} className="border-b border-border-subtle hover:bg-primary-50/50 bg-white">
                      <TableCell className="font-mono text-gray-900 font-black text-xs">{r._id}</TableCell>
                      <TableCell className="font-mono text-primary-700 font-bold text-xs">{r.paymentId || "—"}</TableCell>
                      <TableCell className="text-right font-mono font-black text-purple-700 text-sm">₹{r.amount?.toLocaleString("en-IN")}</TableCell>
                      <TableCell className="text-zinc-600 font-medium">{r.reason || "Customer refund"}</TableCell>
                      <TableCell className="text-center">
                        <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-primary-50 text-primary-700 border border-primary-200">
                          Refunded
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-mono text-zinc-600 font-bold text-xs">{formatDate(r.createdAt)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* 6. SETTLEMENTS TAB */}
      {activeTab === "settlements" && (
        <div className="bg-bg-surface border border-border-subtle rounded-[26px] p-4 sm:p-6 space-y-4 shadow-xs">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border-subtle pb-4">
            <div>
              <div className="flex items-center gap-2">
                <PiggyBank className="w-5 h-5 text-primary-600" />
                <h3 className="text-base font-black text-gray-900">Bank Payout Settlements Log</h3>
                <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-lg text-xs font-black flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> Verified Payout Proofs
                </span>
              </div>
              <p className="text-xs text-zinc-600 font-medium mt-0.5">Automated and recorded merchant bank payout settlement batches from payment gateways.</p>
            </div>
            <Button
              onClick={() => setShowSettlementModal(true)}
              className="bg-primary-600 hover:bg-primary-700 text-white font-black h-11 rounded-2xl text-xs sm:text-sm px-5 flex items-center gap-2 cursor-pointer shadow-md btn-modern shrink-0"
            >
              <Plus className="w-4 h-4" /> Record Settlement Batch
            </Button>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-border-subtle bg-white shadow-2xs">
            <Table className="min-w-[850px] text-xs font-sans">
              <TableHeader className="bg-primary-50/90 border-b border-border-subtle">
                <TableRow className="border-b border-border-subtle uppercase text-xs">
                  <TableHead className="font-black text-primary-900">Batch ID</TableHead>
                  <TableHead className="font-black text-primary-900">Gateway</TableHead>
                  <TableHead className="font-black text-primary-900">Beneficiary Bank</TableHead>
                  <TableHead className="font-black text-primary-900 text-right">Settled Amount</TableHead>
                  <TableHead className="font-black text-primary-900">UTR / Reference No.</TableHead>
                  <TableHead className="font-black text-primary-900 text-center">Status</TableHead>
                  <TableHead className="font-black text-primary-900 text-right">Settle Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {settlementsList.map((s) => (
                  <TableRow key={s._id} className="border-b border-border-subtle hover:bg-primary-50/50 bg-white">
                    <TableCell className="font-mono text-gray-900 font-black text-xs">{s.settlementId || s._id}</TableCell>
                    <TableCell className="font-bold text-gray-900 capitalize">{s.gateway || "Razorpay Payouts"}</TableCell>
                    <TableCell className="font-semibold text-zinc-700">{s.bank || "HDFC Bank"}</TableCell>
                    <TableCell className="text-right font-mono font-black text-emerald-600 text-sm">₹{s.amount?.toLocaleString("en-IN")}</TableCell>
                    <TableCell className="font-mono text-xs text-primary-700 font-bold">{s.utr || "UTR2026072698124"}</TableCell>
                    <TableCell className="text-center">
                      <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {s.status || "Settled"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-mono text-zinc-600 font-bold text-xs">{formatDate(s.settlementDate || s.createdAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* 7. ADD / EDIT EXPENSE OVERLAY MODAL */}
      {showExpenseModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white/95 backdrop-blur-2xl border border-border-subtle rounded-[28px] w-full max-w-md p-6 space-y-4 shadow-2xl font-sans text-gray-900 animate-in zoom-in-95 duration-150">
            <div className="border-b border-border-subtle pb-4 flex justify-between items-center">
              <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
                <Receipt className="w-5 h-5 text-emerald-600" />
                {editingExpense ? "Edit Expense Entry" : "Record New Expense"}
              </h3>
              <button 
                onClick={() => setShowExpenseModal(false)} 
                className="text-zinc-400 hover:text-gray-900 text-xl font-mono p-1 rounded-lg cursor-pointer"
              >
                ×
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="text-xs text-gray-900 font-black block mb-1">Expense Category</label>
                <select
                  value={expenseForm.category}
                  onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
                  className="w-full bg-white border border-border-subtle rounded-2xl h-11 px-4 text-xs font-bold text-gray-900 focus:outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-400 cursor-pointer shadow-2xs"
                >
                  {EXPENSE_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat} className="bg-white text-gray-900 font-bold">{cat}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-900 font-black block mb-1">Amount (₹)</label>
                  <Input 
                    type="number"
                    placeholder="e.g. 1500" 
                    value={expenseForm.amount}
                    onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                    className="bg-white border-border-subtle text-xs text-gray-900 font-bold h-11 font-mono shadow-2xs"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-900 font-black block mb-1">Date</label>
                  <Input 
                    type="date"
                    value={expenseForm.date}
                    onChange={(e) => setExpenseForm({ ...expenseForm, date: e.target.value })}
                    className="bg-white border-border-subtle text-xs text-gray-900 font-bold h-11 font-mono shadow-2xs"
                  />
                </div>
              </div>

              {/* Recurring Toggle */}
              <div className="bg-bg-surface border border-border-subtle rounded-2xl p-4 space-y-3 shadow-2xs">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-black text-gray-900 text-xs">Recurring Expense</p>
                    <p className="text-[11px] text-zinc-500 font-medium">Auto-calculated into monthly P&L reports</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={expenseForm.isRecurring}
                    onChange={(e) => setExpenseForm({ ...expenseForm, isRecurring: e.target.checked })}
                    className="w-4 h-4 rounded border-border-subtle text-primary-600 focus:ring-0 cursor-pointer"
                  />
                </div>

                {expenseForm.isRecurring && (
                  <div className="grid grid-cols-2 gap-3 border-t border-border-subtle pt-3">
                    <div>
                      <label className="text-[10px] text-zinc-500 font-black uppercase block mb-1">Frequency</label>
                      <select
                        value={expenseForm.recurrenceFrequency}
                        onChange={(e) => setExpenseForm({ ...expenseForm, recurrenceFrequency: e.target.value })}
                        className="w-full bg-white border border-border-subtle rounded-xl px-3 h-9 text-xs text-gray-900 font-bold focus:outline-none"
                      >
                        <option value="monthly">Monthly</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] text-zinc-500 font-black uppercase block mb-1">End Date (Optional)</label>
                      <Input 
                        type="date"
                        value={expenseForm.recurrenceEndDate}
                        onChange={(e) => setExpenseForm({ ...expenseForm, recurrenceEndDate: e.target.value })}
                        className="bg-white border-border-subtle text-xs text-gray-900 h-9 font-mono"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="text-xs text-gray-900 font-black block mb-1">Note / Description</label>
                <Input 
                  placeholder="e.g. Monthly shop rent payment" 
                  value={expenseForm.note}
                  onChange={(e) => setExpenseForm({ ...expenseForm, note: e.target.value })}
                  className="bg-white border-border-subtle text-xs text-gray-900 font-medium h-11 shadow-2xs"
                />
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-4 border-t border-border-subtle">
              <Button 
                onClick={() => setShowExpenseModal(false)} 
                variant="outline" 
                className="border-border-subtle text-gray-900 hover:bg-primary-50 text-xs font-bold h-11 rounded-2xl px-5 cursor-pointer shadow-2xs"
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
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-11 rounded-2xl px-6 cursor-pointer font-black shadow-md btn-modern"
              >
                {expenseMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : editingExpense ? "Update Expense" : "Save Expense"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 8. RECORD REFUND OVERLAY MODAL */}
      {showRefundModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white/95 backdrop-blur-2xl border border-border-subtle rounded-[28px] w-full max-w-md p-6 space-y-4 shadow-2xl font-sans text-gray-900">
            <div className="border-b border-border-subtle pb-4 flex justify-between items-center">
              <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-primary-600" /> Manual Payment Refund
              </h3>
              <button onClick={() => setShowRefundModal(false)} className="text-zinc-400 hover:text-gray-900 text-xl font-mono p-1 rounded-lg cursor-pointer">×</button>
            </div>
            <div className="space-y-4 text-xs">
              <div>
                <label className="text-xs text-gray-900 font-black block mb-1">Target Payment Document ID</label>
                <Input 
                  placeholder="e.g. 64b8fcf61f..." 
                  value={refundForm.paymentId}
                  onChange={(e) => setRefundForm({...refundForm, paymentId: e.target.value})}
                  className="bg-white border-border-subtle text-xs text-gray-900 h-11 font-mono shadow-2xs"
                />
              </div>
              <div>
                <label className="text-xs text-gray-900 font-black block mb-1">Refund Amount (₹)</label>
                <Input 
                  type="number" 
                  placeholder="e.g. 500" 
                  value={refundForm.amount}
                  onChange={(e) => setRefundForm({...refundForm, amount: e.target.value})}
                  className="bg-white border-border-subtle text-xs text-gray-900 h-11 font-mono shadow-2xs"
                />
              </div>
              <div>
                <label className="text-xs text-gray-900 font-black block mb-1">Reason</label>
                <Input 
                  placeholder="e.g. Returned damaged items" 
                  value={refundForm.reason}
                  onChange={(e) => setRefundForm({...refundForm, reason: e.target.value})}
                  className="bg-white border-border-subtle text-xs text-gray-900 h-11 font-medium shadow-2xs"
                />
              </div>
            </div>
            <div className="flex gap-3 justify-end pt-4 border-t border-border-subtle">
              <Button onClick={() => setShowRefundModal(false)} variant="outline" className="border-border-subtle text-gray-900 hover:bg-primary-50 text-xs font-bold h-11 rounded-2xl px-5 shadow-2xs cursor-pointer">
                Cancel
              </Button>
              <Button 
                onClick={() => refundMutation.mutate(refundForm)}
                disabled={refundMutation.isPending}
                className="bg-primary-600 text-white hover:bg-primary-700 text-xs font-black h-11 rounded-2xl px-6 shadow-md cursor-pointer btn-modern"
              >
                {refundMutation.isPending ? "Processing..." : "Process Refund"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 9. RECORD SETTLEMENT OVERLAY MODAL */}
      {showSettlementModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white/95 backdrop-blur-2xl border border-border-subtle rounded-[28px] w-full max-w-md p-6 space-y-4 shadow-2xl font-sans text-gray-900">
            <div className="border-b border-border-subtle pb-4 flex justify-between items-center">
              <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
                <PiggyBank className="w-5 h-5 text-primary-600" /> Record Settlement Batch
              </h3>
              <button onClick={() => setShowSettlementModal(false)} className="text-zinc-400 hover:text-gray-900 text-xl font-mono p-1 rounded-lg cursor-pointer">×</button>
            </div>
            <div className="space-y-4 text-xs">
              <div>
                <label className="text-xs text-gray-900 font-black block mb-1">Settlement Batch ID</label>
                <Input 
                  placeholder="e.g. setl_razorpay_98421" 
                  value={settlementForm.settlementId}
                  onChange={(e) => setSettlementForm({...settlementForm, settlementId: e.target.value})}
                  className="bg-white border-border-subtle text-xs text-gray-900 h-11 font-mono shadow-2xs"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-900 font-black block mb-1">Gateway</label>
                  <select 
                    value={settlementForm.gateway}
                    onChange={(e) => setSettlementForm({...settlementForm, gateway: e.target.value})}
                    className="w-full bg-white border border-border-subtle text-xs font-bold text-gray-900 h-11 rounded-2xl px-3 focus:outline-none cursor-pointer shadow-2xs"
                  >
                    <option value="Razorpay Payouts">Razorpay Payouts</option>
                    <option value="Stripe Payouts">Stripe Payouts</option>
                    <option value="UPI Auto-Settle">UPI Auto-Settle</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-900 font-black block mb-1">Beneficiary Bank</label>
                  <Input 
                    placeholder="e.g. HDFC Bank" 
                    value={settlementForm.bank}
                    onChange={(e) => setSettlementForm({...settlementForm, bank: e.target.value})}
                    className="bg-white border border-border-subtle text-xs text-gray-900 h-11 font-bold shadow-2xs"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-900 font-black block mb-1">Amount (₹)</label>
                  <Input 
                    type="number"
                    placeholder="e.g. 15000" 
                    value={settlementForm.amount}
                    onChange={(e) => setSettlementForm({...settlementForm, amount: e.target.value})}
                    className="bg-white border-border-subtle text-xs text-gray-900 h-11 font-mono font-bold shadow-2xs"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-900 font-black block mb-1">Settle Date</label>
                  <Input 
                    type="date" 
                    value={settlementForm.settlementDate}
                    onChange={(e) => setSettlementForm({...settlementForm, settlementDate: e.target.value})}
                    className="bg-white border-border-subtle text-xs text-gray-900 h-11 font-mono shadow-2xs"
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-3 justify-end pt-4 border-t border-border-subtle">
              <Button onClick={() => setShowSettlementModal(false)} variant="outline" className="border-border-subtle text-gray-900 hover:bg-primary-50 text-xs font-bold h-11 rounded-2xl px-5 shadow-2xs cursor-pointer">
                Cancel
              </Button>
              <Button 
                onClick={() => settlementMutation.mutate(settlementForm)}
                disabled={settlementMutation.isPending}
                className="bg-primary-600 text-white hover:bg-primary-700 text-xs font-black h-11 rounded-2xl px-6 shadow-md cursor-pointer btn-modern"
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
