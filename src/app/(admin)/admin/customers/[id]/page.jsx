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
  Pencil,
  DollarSign
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
  Active: "bg-emerald-50 text-emerald-700 border border-emerald-200 font-black",
  Blocked: "bg-rose-50 text-rose-700 border border-rose-200 font-black",
};

const orderStatusClasses = {
  Pending: "bg-amber-50 text-amber-700 border border-amber-200 font-black",
  Confirmed: "bg-sky-50 text-sky-700 border border-sky-200 font-black",
  Shipped: "bg-purple-50 text-purple-700 border border-purple-200 font-black",
  Delivered: "bg-emerald-50 text-emerald-700 border border-emerald-200 font-black",
  Cancelled: "bg-rose-50 text-rose-700 border border-rose-200 font-black",
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
    <div className="w-full max-w-full space-y-6 p-4 animate-pulse font-sans">
      <div className="h-8 bg-primary-50 rounded-xl w-64"></div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-28 bg-white border border-border-subtle rounded-[26px]"></div>
        ))}
      </div>
      <div className="h-64 bg-white border border-border-subtle rounded-[26px]"></div>
    </div>
  );
}

export default function CustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id;
  const queryClient = useQueryClient();

  const [isEditingContact, setIsEditingContact] = useState(false);
  const [blockDialogOpen, setBlockDialogOpen] = useState(false);

  const { data: customer, isLoading, error } = useQuery({
    queryKey: ["customer-detail", id],
    queryFn: async () => {
      if (!id) return null;
      const res = await axios.get(`/api/admin/customers/${id}`);
      return res.data?.data;
    },
    enabled: !!id,
  });

  const {
    register: registerContact,
    handleSubmit: handleSubmitContact,
    formState: { errors: contactErrors },
    reset: resetContactForm,
  } = useForm({
    resolver: zodResolver(customerContactSchema),
  });

  const updateContactMutation = useMutation({
    mutationFn: (data) => axios.patch(`/api/admin/customers/${id}`, data),
    onSuccess: (res) => {
      toast.success("Contact details updated successfully!");
      setIsEditingContact(false);
      queryClient.invalidateQueries({ queryKey: ["customer-detail", id] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to update contact info.");
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: () => axios.patch(`/api/admin/customers/${id}/toggle-status`),
    onSuccess: (res) => {
      toast.success(res.data?.message || "Customer status updated!");
      queryClient.invalidateQueries({ queryKey: ["customer-detail", id] });
      queryClient.invalidateQueries({ queryKey: ["customers"] });
    },
    onError: (err) => toast.error(err.response?.data?.message || "Unable to update status."),
  });

  if (isLoading) return <CustomerDetailSkeleton />;

  if (error || !customer) {
    return (
      <div className="w-full max-w-full py-12 text-center space-y-4 text-gray-900 font-sans">
        <h1 className="text-xl font-black">Customer Profile Not Found</h1>
        <p className="text-zinc-600 text-sm font-medium">We couldn't retrieve details for the requested Customer ID.</p>
        <Link href="/admin/customers" passHref>
          <Button variant="outline" className="border-border-subtle bg-white text-gray-900 rounded-2xl px-5 py-2.5 text-xs font-black shadow-2xs btn-modern">
            <ArrowLeft className="w-4 h-4 mr-2 text-primary-600" /> Back to Customer Directory
          </Button>
        </Link>
      </div>
    );
  }

  const orders = customer.orders || [];

  return (
    <div className="w-full max-w-full space-y-6 text-gray-900 font-sans pb-12 overflow-x-hidden">
      
      {/* 1. HEADER SECTION */}
      <div className="flex flex-wrap gap-4 justify-between items-center border-b border-border-subtle pb-5">
        <div className="space-y-1.5">
          <Link href="/admin/customers" className="inline-flex items-center gap-1.5 text-zinc-600 hover:text-primary-700 transition-colors text-xs font-black uppercase tracking-wider">
            <ArrowLeft className="w-4 h-4 text-primary-600" /> Back to Customers
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-xl sm:text-3xl font-black tracking-tight text-gray-900">{customer.name}</h1>
            <span className={`px-3 py-1 rounded-xl text-xs ${statusClasses[customer.status] || "bg-zinc-100 text-zinc-700"}`}>
              {customer.status}
            </span>
          </div>
          <p className="text-xs text-zinc-600 font-bold font-mono">
            ID: {customer._id}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-3 bg-white border border-border-subtle px-4 py-2.5 rounded-2xl shadow-2xs">
            <Switch
              checked={customer.status === "Active"}
              onCheckedChange={() => {
                if (customer.status === "Active") setBlockDialogOpen(true);
                else toggleStatusMutation.mutate();
              }}
              className="data-[state=checked]:bg-emerald-600 scale-90 cursor-pointer"
            />
            <span className="text-xs font-black text-gray-900">
              {customer.status === "Active" ? "Account Active" : "Account Blocked"}
            </span>
          </div>
        </div>
      </div>

      {/* 2. TOP KPI COUNTER CARDS (SIGNATURE AMETHYST-LAVENDER GRADIENT & BOLD NUMBERS) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* KPI 1: Lifetime Spent (Base Purple Mesh Gradient #9B66D4 -> #D8A5E9) */}
        <div className="rounded-[26px] bg-gradient-to-br from-[#9B66D4] via-[#B885E2] to-[#D8A5E9] p-6 text-white shadow-md flex flex-col justify-between group hover:shadow-xl transition-all duration-300">
          <div className="flex items-start justify-between">
            <h2 className="text-3xl sm:text-4xl font-black font-mono tracking-tight text-white">{formatCurrency(customer.totalSpent)}</h2>
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-white shadow-xs">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div>
            <p className="text-xs sm:text-sm font-bold text-white/90 mt-2">Lifetime Customer Spend</p>
            {/* Smooth Wave Graph SVG */}
            <svg className="w-full h-8 opacity-80 mt-3 text-white" viewBox="0 0 100 25" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M0 18 Q20 5 40 16 T80 10 T100 14" />
            </svg>
          </div>
        </div>

        {/* KPI 2: Total Orders */}
        <div className="rounded-[26px] bg-bg-surface border border-border-subtle p-6 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-zinc-500">Total Orders</span>
            <div className="w-10 h-10 rounded-2xl bg-primary-50 border border-primary-200 flex items-center justify-center text-primary-600 shadow-2xs">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-black font-mono tracking-tight text-gray-900">{customer.orderCount || 0}</h3>
            <p className="text-xs text-zinc-600 font-bold mt-1">Completed order checkouts</p>
          </div>
        </div>

        {/* KPI 3: Average Order Value */}
        <div className="rounded-[26px] bg-bg-surface border border-border-subtle p-6 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-zinc-500">Average Order Value</span>
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shadow-2xs">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-black font-mono tracking-tight text-emerald-600">{formatCurrency(customer.avgOrderValue)}</h3>
            <p className="text-xs text-zinc-600 font-bold mt-1">Revenue per transaction</p>
          </div>
        </div>

        {/* KPI 4: Customer Since */}
        <div className="rounded-[26px] bg-bg-surface border border-border-subtle p-6 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-zinc-500">Customer Since</span>
            <div className="w-10 h-10 rounded-2xl bg-cyan-50 border border-cyan-200 flex items-center justify-center text-cyan-600 shadow-2xs">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-xl sm:text-2xl font-black font-mono tracking-tight text-gray-900">{formatDate(customer.createdAt)}</h3>
            <p className="text-xs text-zinc-600 font-bold mt-1">Registration timestamp</p>
          </div>
        </div>

      </div>

      {/* 3. MAIN DETAILS RESPONSIVE CONTENT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN: CONTACT DETAILS */}
        <div className="space-y-6">
          <div className="bg-bg-surface border border-border-subtle rounded-[26px] p-6 space-y-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-border-subtle pb-3.5">
              <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider flex items-center gap-2">
                <User className="w-4 h-4 text-primary-600" /> Contact Details
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditingContact(!isEditingContact)}
                className="h-8 px-3 text-xs text-primary-600 font-bold hover:text-primary-700 hover:bg-primary-50 rounded-xl cursor-pointer"
              >
                <Pencil className="w-3.5 h-3.5 mr-1" /> Edit
              </Button>
            </div>

            {!isEditingContact ? (
              <div className="space-y-4 text-xs sm:text-sm font-sans pt-1">
                <div>
                  <span className="text-zinc-500 font-black text-xs uppercase tracking-wider block">Email Address</span>
                  <p className="font-mono text-gray-900 font-bold text-xs sm:text-sm mt-0.5">{customer.email || "No email provided"}</p>
                </div>
                <div>
                  <span className="text-zinc-500 font-black text-xs uppercase tracking-wider block">Phone Number</span>
                  <p className="font-mono text-gray-900 font-bold text-xs sm:text-sm mt-0.5">{customer.phone || "No phone registered"}</p>
                </div>
              </div>
            ) : (
              <form 
                onSubmit={handleSubmitContact((data) => updateContactMutation.mutate(data))}
                className="space-y-3.5 pt-1"
              >
                <div>
                  <label className="text-xs text-gray-900 uppercase font-black block">Full Name</label>
                  <input 
                    {...registerContact("name")}
                    defaultValue={customer.name}
                    className="w-full bg-white border border-border-subtle rounded-2xl p-3 text-xs sm:text-sm font-bold text-gray-900 mt-1 focus:outline-none focus:border-primary-400 shadow-2xs"
                  />
                  {contactErrors.name && <p className="text-xs text-rose-600 font-bold mt-1">{contactErrors.name.message}</p>}
                </div>
                <div>
                  <label className="text-xs text-gray-900 uppercase font-black block">Email Address</label>
                  <input 
                    {...registerContact("email")}
                    defaultValue={customer.email}
                    className="w-full bg-white border border-border-subtle rounded-2xl p-3 text-xs sm:text-sm font-bold text-gray-900 mt-1 focus:outline-none focus:border-primary-400 shadow-2xs"
                  />
                  {contactErrors.email && <p className="text-xs text-rose-600 font-bold mt-1">{contactErrors.email.message}</p>}
                </div>
                <div>
                  <label className="text-xs text-gray-900 uppercase font-black block">Phone Number</label>
                  <input 
                    {...registerContact("phone")}
                    defaultValue={customer.phone}
                    className="w-full bg-white border border-border-subtle rounded-2xl p-3 text-xs sm:text-sm font-bold text-gray-900 mt-1 focus:outline-none focus:border-primary-400 shadow-2xs"
                  />
                  {contactErrors.phone && <p className="text-xs text-rose-600 font-bold mt-1">{contactErrors.phone.message}</p>}
                </div>
                <div className="flex gap-2.5 pt-2">
                  <Button type="submit" disabled={updateContactMutation.isPending} className="bg-primary-600 text-white font-black text-xs h-10 rounded-2xl flex-1 btn-modern cursor-pointer">
                    Save Changes
                  </Button>
                  <Button type="button" onClick={() => setIsEditingContact(false)} variant="outline" className="border-border-subtle text-gray-900 font-bold text-xs h-10 rounded-2xl cursor-pointer">
                    Cancel
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: ORDERS HISTORY */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-bg-surface border border-border-subtle rounded-[26px] p-6 space-y-4 shadow-xs">
            <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider flex items-center gap-2 border-b border-border-subtle pb-3.5">
              <ShoppingBag className="w-4 h-4 text-primary-600" /> Customer Order History ({orders.length})
            </h3>

            {orders.length === 0 ? (
              <p className="text-xs text-zinc-500 font-bold py-8 text-center">No order records found for this buyer profile.</p>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-border-subtle bg-white shadow-2xs">
                <Table className="min-w-[550px] text-xs font-sans">
                  <TableHeader className="bg-primary-50/90 border-b border-border-subtle">
                    <TableRow className="uppercase text-xs">
                      <TableHead className="font-black text-primary-900">Order ID</TableHead>
                      <TableHead className="font-black text-primary-900">Date</TableHead>
                      <TableHead className="font-black text-primary-900">Status</TableHead>
                      <TableHead className="text-right font-black text-primary-900">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map((o) => (
                      <TableRow key={o._id} className="border-b border-border-subtle text-gray-900 hover:bg-primary-50/50 transition-colors bg-white">
                        <TableCell className="font-mono font-black text-xs sm:text-sm text-gray-900 py-3.5">
                          <Link href={`/admin/orders/${o._id}`} className="hover:text-primary-700 flex items-center gap-1.5 transition-colors">
                            <span>{o.orderNumber}</span> <Eye className="w-3.5 h-3.5 text-zinc-400" />
                          </Link>
                        </TableCell>
                        <TableCell className="font-mono text-zinc-700 font-bold text-xs sm:text-sm py-3.5">{formatDate(o.createdAt)}</TableCell>
                        <TableCell className="py-3.5">
                          <span className={`px-3 py-1 rounded-xl text-xs ${orderStatusClasses[o.status] || "bg-zinc-100 text-zinc-700"}`}>
                            {o.status}
                          </span>
                        </TableCell>
                        <TableCell className="text-right font-mono font-black text-emerald-600 text-xs sm:text-sm py-3.5">{formatCurrency(o.totalAmount)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* BLOCK CONFIRMATION DIALOG */}
      <AlertDialog open={blockDialogOpen} onOpenChange={setBlockDialogOpen}>
        <AlertDialogContent className="bg-white/95 backdrop-blur-2xl border border-border-subtle text-gray-900 rounded-[28px] p-6 shadow-2xl font-sans">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-gray-900 font-black text-lg">Block Customer Profile</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-600 text-xs sm:text-sm font-medium">
              Are you sure you want to block <strong className="text-gray-900">{customer.name}</strong>? Blocked customers will be restricted from placing new orders.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="pt-2">
            <AlertDialogCancel className="bg-white text-gray-900 border-border-subtle hover:bg-primary-50 rounded-2xl font-bold cursor-pointer">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => {
                setBlockDialogOpen(false);
                toggleStatusMutation.mutate();
              }}
              className="bg-rose-600 hover:bg-rose-700 text-white font-black rounded-2xl cursor-pointer shadow-md"
            >
              Confirm Block
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}
