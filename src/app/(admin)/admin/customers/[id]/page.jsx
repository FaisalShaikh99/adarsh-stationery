"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { 
  ChevronLeft, 
  Loader2, 
  Calendar, 
  User, 
  Phone, 
  MapPin, 
  CreditCard, 
  ArrowLeft, 
  Mail, 
  ShoppingBag, 
  Tag, 
  TrendingUp,
  Eye,
  RefreshCw,
  Sparkles,
  ShieldAlert,
  Pencil
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from "@/components/ui/alert-dialog";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { customerContactSchema } from "@/schemas/customer.schema";

const statusClasses = {
  Active: "bg-emerald-500/10 text-emerald-300 border border-emerald-500/25",
  Blocked: "bg-rose-500/10 text-rose-300 border border-rose-500/25",
};

const orderStatusClasses = {
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

const tagClasses = {
  VIP: "bg-amber-500/10 text-amber-300 border border-amber-500/25",
  New: "bg-emerald-500/10 text-emerald-300 border border-emerald-500/25",
  "At Risk": "bg-rose-500/10 text-rose-300 border border-rose-500/25",
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
  });
}

function CustomerDetailSkeleton() {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 animate-pulse">
      <div className="flex flex-wrap gap-3 justify-between items-center border-b border-zinc-800 pb-5">
        <div className="space-y-2">
          <div className="h-4 w-24 bg-zinc-800 rounded" />
          <div className="h-8 w-48 bg-zinc-800 rounded" />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <div className="h-48 bg-[#0c0c0e] border border-zinc-800 rounded-2xl p-6" />
          <div className="h-32 bg-[#0c0c0e] border border-zinc-800 rounded-2xl p-6" />
          <div className="h-64 bg-[#0c0c0e] border border-zinc-800 rounded-2xl p-6" />
        </div>
        <div className="space-y-6">
          <div className="h-64 bg-[#0c0c0e] border border-zinc-800 rounded-2xl p-6" />
        </div>
      </div>
    </div>
  );
}

export default function CustomerDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [blockDialogOpen, setBlockDialogOpen] = useState(false);
  const [isEditingContact, setIsEditingContact] = useState(false);

  // Queries
  const { data: customer, isLoading, error } = useQuery({
    queryKey: ["customer", id],
    queryFn: async () => {
      const res = await axios.get(`/api/admin/customers/${id}`);
      return res.data?.data;
    },
    enabled: !!id,
  });

  const { 
    data: insightData, 
    isLoading: isInsightLoading, 
    isError: isInsightError, 
    refetch: refetchInsight 
  } = useQuery({
    queryKey: ["customer-insight", id],
    queryFn: async () => {
      const res = await axios.get(`/api/admin/customers/${id}/insight`);
      return res.data?.data;
    },
    enabled: !!id && customer?.orderCount > 0,
    retry: 1,
  });

  const { register, handleSubmit: handleFormSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(customerContactSchema),
    mode: "onBlur",
    values: customer ? {
      email: customer.email || "",
      phone: customer.phone || "",
    } : {
      email: "",
      phone: "",
    }
  });

  const updateContactMutation = useMutation({
    mutationFn: (data) => axios.patch(`/api/admin/customers/${id}/contact`, data),
    onSuccess: (response) => {
      toast.success(response.data?.message || "Customer contact details updated.");
      setIsEditingContact(false);
      queryClient.invalidateQueries({ queryKey: ["customer", id] });
      queryClient.invalidateQueries({ queryKey: ["customers"] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Unable to update customer contact details.");
    },
  });

  const onSubmitContact = (data) => {
    updateContactMutation.mutate(data);
  };

  // Mutations
  const toggleStatusMutation = useMutation({
    mutationFn: () => axios.patch(`/api/admin/customers/${id}/status`),
    onSuccess: (response) => {
      toast.success(response.data?.message || "Customer status updated.");
      queryClient.invalidateQueries({ queryKey: ["customer", id] });
      queryClient.invalidateQueries({ queryKey: ["customers"] });
    },
    onError: (error) => toast.error(error.response?.data?.message || "Unable to update customer status."),
  });

  const insightMutation = useMutation({
    mutationFn: async () => {
      const res = await axios.get(`/api/admin/customers/${id}/insight?regenerate=true`);
      return res.data?.data;
    },
    onSuccess: (data) => {
      toast.success("AI Buyer Insight regenerated successfully.");
      queryClient.setQueryData(["customer-insight", id], data);
    },
    onError: (error) => toast.error(error.response?.data?.message || "Failed to generate AI buyer insight."),
  });

  if (isLoading) return <CustomerDetailSkeleton />;

  if (error || !customer) {
    return (
      <div className="mx-auto w-full max-w-7xl py-12 text-center space-y-4">
        <h1 className="text-xl font-bold text-white">Customer Profile Not Found</h1>
        <p className="text-zinc-400 text-sm">We couldn't retrieve details for the requested Customer ID.</p>
        <Link href="/admin/customers" passHref>
          <Button variant="outline" className="border-zinc-800 bg-zinc-900 text-zinc-300 rounded-xl px-4 py-2 text-xs font-semibold">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Customers
          </Button>
        </Link>
      </div>
    );
  }

  const orders = customer.orders || [];

  const handleToggleStatusClick = () => {
    // If Active, require block confirmation
    if (customer.status === "Active") {
      setBlockDialogOpen(true);
    } else {
      toggleStatusMutation.mutate();
    }
  };

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      
      {/* 1. HEADER SECTION */}
      <div className="flex flex-wrap gap-4 justify-between items-start border-b border-zinc-800 pb-5">
        <div className="space-y-2">
          <Link href="/admin/customers" className="flex items-center gap-1.5 text-zinc-500 hover:text-white transition-colors text-xs font-semibold uppercase tracking-wider mb-2">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Customers
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-xl font-bold tracking-tight text-white">{customer.name}</h1>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${statusClasses[customer.status] || "bg-zinc-800 text-zinc-400 border-zinc-700"}`}>
              {customer.status}
            </span>
          </div>
          <p className="text-xs text-zinc-400 flex items-center gap-1.5 pt-0.5 font-mono">
            ID: {customer._id}
          </p>
        </div>

        {/* Status switch toggle on header */}
        <div className="flex items-center gap-3 bg-[#0c0c0e] border border-zinc-800 px-4 py-2 rounded-xl">
          <span className="text-xs text-zinc-450 font-semibold uppercase tracking-wider">Status:</span>
          <Switch
            checked={customer.status === "Active"}
            onCheckedChange={handleToggleStatusClick}
            disabled={toggleStatusMutation.isPending}
            className="data-[state=checked]:bg-emerald-600 scale-90"
            aria-label="Toggle customer status"
          />
        </div>
      </div>

      {/* 2. DETAIL CARDS LAYOUT */}
      <div className="grid gap-6 md:grid-cols-3">
        
        {/* LEFT COLUMN: Personal Info, AI Insight, & Orders table */}
        <div className="md:col-span-2 space-y-6">
          
          {/* Customer profile & Location details */}
          <div className="bg-[#0c0c0e] border border-zinc-800/80 p-5 rounded-2xl shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-white flex items-center gap-2 uppercase tracking-wider text-zinc-400">
              <User className="w-4 h-4 text-zinc-500" /> Customer Information
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 text-xs border-t border-zinc-800/60 pt-4">
              {isEditingContact ? (
                <form onSubmit={handleFormSubmit(onSubmitContact)} className="sm:col-span-2 grid gap-4 sm:grid-cols-2 w-full">
                  <div className="space-y-1.5">
                    <label htmlFor="contact-email" className="text-zinc-500 font-bold uppercase tracking-wider block">Contact Email</label>
                    <div className="flex items-center gap-2 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-1.5 transition-all focus-within:border-zinc-500 focus-within:ring-1 focus-within:ring-zinc-500">
                      <Mail className="w-4 h-4 text-zinc-500 shrink-0" />
                      <input
                        id="contact-email"
                        type="text"
                        {...register("email")}
                        className="bg-transparent border-none text-zinc-200 placeholder-zinc-500 focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-sm w-full p-0"
                        placeholder="email@example.com"
                      />
                    </div>
                    {errors.email && <p className="text-xs text-rose-500 mt-1">{errors.email.message}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="contact-phone" className="text-zinc-500 font-bold uppercase tracking-wider block">Phone Number</label>
                    <div className="flex items-center gap-2 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-1.5 transition-all focus-within:border-zinc-500 focus-within:ring-1 focus-within:ring-zinc-500">
                      <Phone className="w-4 h-4 text-zinc-500 shrink-0" />
                      <input
                        id="contact-phone"
                        type="text"
                        {...register("phone")}
                        className="bg-transparent border-none text-zinc-200 placeholder-zinc-500 focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-sm w-full font-mono p-0"
                        placeholder="10 digit phone number"
                      />
                    </div>
                    {errors.phone && <p className="text-xs text-rose-500 mt-1">{errors.phone.message}</p>}
                  </div>
                  <div className="sm:col-span-2 flex items-center gap-2 justify-end">
                    <Button
                      type="button"
                      onClick={() => {
                        setIsEditingContact(false);
                        reset();
                      }}
                      variant="outline"
                      className="border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-xl px-3 py-1.5 text-xs font-semibold h-8"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={updateContactMutation.isPending}
                      className="bg-white text-black font-semibold hover:bg-zinc-250 rounded-xl px-3 py-1.5 text-xs h-8 flex items-center gap-1"
                    >
                      {updateContactMutation.isPending && (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      )}
                      Save
                    </Button>
                  </div>
                </form>
              ) : (
                <>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-zinc-500 font-bold uppercase tracking-wider">Contact Email</p>
                      <button
                        type="button"
                        onClick={() => setIsEditingContact(true)}
                        className="text-zinc-400 hover:text-white transition-colors p-1"
                        title="Edit contact info"
                      >
                        <Pencil className="w-3 h-3" />
                      </button>
                    </div>
                    <p className="mt-1 font-semibold text-zinc-200 text-sm flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-zinc-500" /> {customer.email || "—"}
                    </p>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-zinc-500 font-bold uppercase tracking-wider">Phone Number</p>
                      <button
                        type="button"
                        onClick={() => setIsEditingContact(true)}
                        className="text-zinc-400 hover:text-white transition-colors p-1"
                        title="Edit contact info"
                      >
                        <Pencil className="w-3 h-3" />
                      </button>
                    </div>
                    <p className="mt-1 font-semibold text-zinc-200 text-sm flex items-center gap-1.5 font-mono">
                      <Phone className="w-3.5 h-3.5 text-zinc-500" /> {customer.phone}
                    </p>
                  </div>
                </>
              )}

              <div className="sm:col-span-2">
                <p className="text-zinc-500 font-bold uppercase tracking-wider">Latest Address Registered</p>
                <div className="mt-1 text-zinc-200 flex items-start gap-1.5 leading-relaxed text-sm">
                  <MapPin className="w-4 h-4 text-zinc-500 mt-0.5 shrink-0" />
                  <div>
                    {customer.addressLine1 ? (
                      <>
                        <p>{customer.addressLine1}</p>
                        {customer.addressLine2 && <p>{customer.addressLine2}</p>}
                        <p>{customer.city}, {customer.state} - {customer.pincode}</p>
                      </>
                    ) : (
                      <p className="text-zinc-500 italic">No address registered yet.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* AI Insight Card */}
          <div className="bg-[#0c0c0e] border border-zinc-800/80 p-5 rounded-2xl shadow-sm space-y-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full blur-2xl pointer-events-none" />
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-white flex items-center gap-2 uppercase tracking-wider text-zinc-400">
                <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" /> AI Buyer Insight
              </h2>
              {customer.orderCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={isInsightLoading || insightMutation.isPending}
                  onClick={() => insightMutation.mutate()}
                  className="h-8 rounded-xl border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800 text-[10px] text-zinc-400 hover:text-white px-2.5 flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  {(isInsightLoading || insightMutation.isPending) ? (
                    <Loader2 className="h-3 w-3 animate-spin text-purple-450" />
                  ) : (
                    <RefreshCw className="h-3 w-3" />
                  )}
                  Regenerate
                </Button>
              )}
            </div>
            <div className="border-t border-zinc-800/60 pt-4">
              {isInsightLoading ? (
                <div className="flex items-center justify-center py-6 text-zinc-500 text-xs gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-purple-400" />
                  Analyzing order history metrics...
                </div>
              ) : isInsightError ? (
                <div className="flex flex-col items-center justify-center py-4 text-center space-y-2">
                  <p className="text-xs text-rose-450 font-semibold">Couldn't generate insight, try again.</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => refetchInsight()}
                    className="h-8 rounded-xl border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-850 text-[10px] text-zinc-400 hover:text-white px-3 flex items-center gap-1.5 cursor-pointer"
                  >
                    <RefreshCw className="h-3 w-3" /> Retry
                  </Button>
                </div>
              ) : customer.orderCount === 0 ? (
                <p className="text-xs text-zinc-550 italic">No order history yet.</p>
              ) : (
                <p className="text-xs leading-relaxed text-zinc-300 italic border-l-2 border-purple-500/35 pl-3.5 bg-purple-500/[0.02] py-2 rounded-r-lg">
                  "{insightData?.insight}"
                </p>
              )}
            </div>
          </div>

          {/* Order history table */}
          <div className="bg-[#0c0c0e] border border-zinc-800/80 p-5 rounded-2xl shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider text-zinc-400">Order History</h2>
            <div className="overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-900/10">
              <Table>
                <TableHeader className="bg-zinc-900/40">
                  <TableRow className="border-b border-zinc-800 hover:bg-transparent">
                    <TableHead className="font-semibold text-zinc-400">Order Number</TableHead>
                    <TableHead className="font-semibold text-zinc-400">Date</TableHead>
                    <TableHead className="font-semibold text-zinc-400">Items Count</TableHead>
                    <TableHead className="font-semibold text-zinc-400">Amount</TableHead>
                    <TableHead className="font-semibold text-zinc-400">Payment</TableHead>
                    <TableHead className="font-semibold text-zinc-400">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-32 text-center text-sm text-zinc-500">
                        No orders recorded for this customer yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    orders.map((order) => (
                      <TableRow 
                        key={order._id} 
                        onClick={() => router.push(`/admin/orders/${order._id}`)}
                        className="border-b border-zinc-800/60 hover:bg-zinc-900/20 transition-colors cursor-pointer"
                      >
                        <TableCell className="py-4 font-bold text-xs sm:text-sm text-zinc-100 font-mono">
                          {order.orderNumber}
                        </TableCell>
                        <TableCell className="py-4 text-xs text-zinc-400">
                          {formatDate(order.createdAt)}
                        </TableCell>
                        <TableCell className="py-4 text-zinc-300 font-mono text-xs sm:text-sm">
                          {order.items?.reduce((sum, item) => sum + item.quantity, 0) || 0}
                        </TableCell>
                        <TableCell className="py-4 text-zinc-100 font-mono text-xs sm:text-sm">
                          {formatCurrency(order.totalAmount)}
                        </TableCell>
                        <TableCell className="py-4 text-xs">
                          <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${paymentStatusClasses[order.paymentStatus] || "bg-zinc-800 text-zinc-450 border-zinc-700"}`}>
                            {order.paymentStatus}
                          </span>
                        </TableCell>
                        <TableCell className="py-4 text-xs">
                          <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${orderStatusClasses[order.status] || "bg-zinc-850 text-zinc-450 border-zinc-700"}`}>
                            {order.status}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Customer Spend Stats & Tags */}
        <div className="space-y-6">
          
          {/* Spend stats card */}
          <div className="bg-[#0c0c0e] border border-zinc-800/80 p-5 rounded-2xl shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-white flex items-center gap-2 uppercase tracking-wider text-zinc-400">
              <TrendingUp className="w-4 h-4 text-zinc-500" /> Account Metrics
            </h2>
            <div className="border-t border-zinc-800/60 pt-4 space-y-4 text-xs">
              <div className="flex justify-between py-1.5 border-b border-zinc-900 font-mono">
                <span className="text-zinc-500 font-sans">Total Spent</span>
                <span className="font-bold text-emerald-400 text-sm">{formatCurrency(customer.totalSpent)}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-zinc-900 font-mono">
                <span className="text-zinc-500 font-sans">Orders Placed</span>
                <span className="font-bold text-zinc-200 text-sm">{customer.orderCount}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-zinc-900 font-mono">
                <span className="text-zinc-500 font-sans">First Order</span>
                <span className="font-semibold text-zinc-350">{formatDate(customer.firstOrderDate)}</span>
              </div>
              <div className="flex justify-between py-1.5 font-mono">
                <span className="text-zinc-500 font-sans">Last Activity</span>
                <span className="font-semibold text-zinc-350">{formatDate(customer.lastOrderDate)}</span>
              </div>
            </div>
          </div>

          {/* Segment/Tag Assignment */}
          <div className="bg-[#0c0c0e] border border-zinc-800/80 p-5 rounded-2xl shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-white flex items-center gap-2 uppercase tracking-wider text-zinc-400">
              <Tag className="w-4 h-4 text-zinc-500" /> Segments & Tags
            </h2>
            <div className="border-t border-zinc-800/60 pt-4">
              <div className="flex flex-wrap gap-2">
                {customer.tags && customer.tags.length > 0 ? (
                  customer.tags.map((item) => (
                    <span key={item} className={`px-2.5 py-1 rounded-full text-xs font-bold border ${tagClasses[item] || "bg-zinc-850 text-zinc-450 border-zinc-700"}`}>
                      {item}
                    </span>
                  ))
                ) : (
                  <p className="text-xs text-zinc-500 italic">No segment tags assigned to this customer.</p>
                )}
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* 3. CONFIRM BLOCK CUSTOMER ALERT DIALOG */}
      <AlertDialog open={blockDialogOpen} onOpenChange={setBlockDialogOpen}>
        <AlertDialogContent className="bg-zinc-900 border border-zinc-800 text-white rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-rose-400">
              <ShieldAlert className="h-5 w-5" />
              Block Customer Account?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400 text-xs leading-relaxed">
              Are you absolutely sure you want to block this customer profile ("{customer.name}")? This action will set their status to Blocked in the directories.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-zinc-850 hover:bg-zinc-800 text-zinc-300 border-zinc-700/60 rounded-xl text-xs">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => {
                toggleStatusMutation.mutate();
                setBlockDialogOpen(false);
              }}
              className="bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs"
            >
              Confirm Block
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}
