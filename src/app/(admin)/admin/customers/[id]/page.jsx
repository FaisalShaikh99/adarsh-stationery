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
  Active: "bg-emerald-500/10 text-emerald-700 border border-emerald-500/25 font-bold",
  Blocked: "bg-rose-500/10 text-rose-700 border border-rose-500/25 font-bold",
};

const tagClasses = {
  VIP: "bg-amber-500/10 text-amber-700 border border-amber-500/25 font-bold",
  New: "bg-blue-500/10 text-blue-700 border border-blue-500/25 font-bold",
  "At Risk": "bg-rose-500/10 text-rose-700 border border-rose-500/25 font-bold",
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
    <div className="w-full max-w-full space-y-6 p-4 animate-pulse">
      <div className="h-8 bg-primary-50 rounded-xl w-64"></div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 bg-bg-surface border border-border-subtle rounded-2xl"></div>
        ))}
      </div>
      <div className="h-64 bg-bg-surface border border-border-subtle rounded-2xl"></div>
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

  const { data: insightData, isLoading: isInsightLoading } = useQuery({
    queryKey: ["customer-insight", id],
    queryFn: async () => {
      if (!id) return null;
      const res = await axios.get(`/api/admin/customers/${id}/insight`);
      return res.data?.data;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
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
      toast.success(res.data?.message || "Customer status toggled!");
      queryClient.invalidateQueries({ queryKey: ["customer-detail", id] });
      queryClient.invalidateQueries({ queryKey: ["customers"] });
    },
    onError: (err) => toast.error(err.response?.data?.message || "Unable to update status."),
  });

  if (isLoading) return <CustomerDetailSkeleton />;

  if (error || !customer) {
    return (
      <div className="w-full max-w-full py-12 text-center space-y-4 text-gray-900">
        <h1 className="text-xl font-bold">Customer Profile Not Found</h1>
        <p className="text-zinc-500 text-sm">We couldn't retrieve details for the requested Customer ID.</p>
        <Link href="/admin/customers" passHref>
          <Button variant="outline" className="border-border-subtle bg-bg-surface text-gray-900 rounded-xl px-4 py-2 text-xs font-semibold btn-modern">
            <ArrowLeft className="w-4 h-4 mr-2 text-primary-600" /> Back to Customers
          </Button>
        </Link>
      </div>
    );
  }

  const orders = customer.orders || [];

  return (
    <div className="w-full max-w-full space-y-6 text-gray-900 font-sans p-2 sm:p-4 overflow-x-hidden">
      
      {/* 1. HEADER SECTION */}
      <div className="flex flex-wrap gap-4 justify-between items-start border-b border-border-subtle pb-5">
        <div className="space-y-2">
          <Link href="/admin/customers" className="flex items-center gap-1.5 text-zinc-500 hover:text-primary-600 transition-colors text-xs font-bold uppercase tracking-wider mb-2">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Customers
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-xl font-extrabold tracking-tight text-gray-900">{customer.name}</h1>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${statusClasses[customer.status] || "bg-zinc-100 text-zinc-700 border-zinc-200"}`}>
              {customer.status}
            </span>
          </div>
          <p className="text-xs text-zinc-500 flex items-center gap-1.5 pt-0.5 font-mono">
            ID: {customer._id}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-bg-surface border border-border-subtle px-3 py-1.5 rounded-xl shadow-xs">
            <Switch
              checked={customer.status === "Active"}
              onCheckedChange={() => {
                if (customer.status === "Active") setBlockDialogOpen(true);
                else toggleStatusMutation.mutate();
              }}
              className="data-[state=checked]:bg-emerald-600 scale-75 cursor-pointer"
            />
            <span className="text-xs font-bold text-gray-900">
              {customer.status === "Active" ? "Account Active" : "Account Blocked"}
            </span>
          </div>
        </div>
      </div>

      {/* 2. KPI METRICS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-bg-surface border border-border-subtle p-5 rounded-2xl shadow-xs space-y-1">
          <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold block">Lifetime Spent</span>
          <p className="text-2xl font-extrabold font-mono text-emerald-600">{formatCurrency(customer.totalSpent)}</p>
          <p className="text-[11px] text-zinc-500">Gross revenue generated</p>
        </div>

        <div className="bg-bg-surface border border-border-subtle p-5 rounded-2xl shadow-xs space-y-1">
          <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold block">Total Orders</span>
          <p className="text-2xl font-extrabold font-mono text-primary-600">{customer.orderCount || 0}</p>
          <p className="text-[11px] text-zinc-500">Completed order checkouts</p>
        </div>

        <div className="bg-bg-surface border border-border-subtle p-5 rounded-2xl shadow-xs space-y-1">
          <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold block">Average Order Value</span>
          <p className="text-2xl font-extrabold font-mono text-gray-900">{formatCurrency(customer.avgOrderValue)}</p>
          <p className="text-[11px] text-zinc-500">Revenue per transaction</p>
        </div>

        <div className="bg-bg-surface border border-border-subtle p-5 rounded-2xl shadow-xs space-y-1">
          <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold block">Customer Since</span>
          <p className="text-lg font-bold font-mono text-gray-900 mt-1">{formatDate(customer.createdAt)}</p>
          <p className="text-[11px] text-zinc-500">Registration timestamp</p>
        </div>
      </div>

      {/* 3. MAIN DETAILS CONTENT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN: CONTACT & ADDRESS DETAILS */}
        <div className="space-y-6">
          <div className="bg-bg-surface border border-border-subtle rounded-2xl p-5 space-y-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-border-subtle pb-3">
              <h3 className="text-xs font-extrabold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                <User className="w-4 h-4 text-primary-600" /> Contact Details
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditingContact(!isEditingContact)}
                className="h-7 px-2 text-[11px] text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-lg cursor-pointer"
              >
                <Pencil className="w-3 h-3 mr-1" /> Edit
              </Button>
            </div>

            {!isEditingContact ? (
              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-zinc-500 text-[11px]">Email Address</span>
                  <p className="font-mono text-gray-900 font-semibold mt-0.5">{customer.email || "No email provided"}</p>
                </div>
                <div>
                  <span className="text-zinc-500 text-[11px]">Phone Number</span>
                  <p className="font-mono text-gray-900 font-semibold mt-0.5">{customer.phone || "No phone registered"}</p>
                </div>
              </div>
            ) : (
              <form 
                onSubmit={handleSubmitContact((data) => updateContactMutation.mutate(data))}
                className="space-y-3 pt-1"
              >
                <div>
                  <label className="text-[10px] text-zinc-500 uppercase font-bold">Name</label>
                  <input 
                    {...registerContact("name")}
                    defaultValue={customer.name}
                    className="w-full bg-white border border-border-subtle rounded-xl p-2 text-xs text-gray-900 mt-1"
                  />
                  {contactErrors.name && <p className="text-[10px] text-rose-500 mt-0.5">{contactErrors.name.message}</p>}
                </div>
                <div>
                  <label className="text-[10px] text-zinc-500 uppercase font-bold">Email</label>
                  <input 
                    {...registerContact("email")}
                    defaultValue={customer.email}
                    className="w-full bg-white border border-border-subtle rounded-xl p-2 text-xs text-gray-900 mt-1"
                  />
                  {contactErrors.email && <p className="text-[10px] text-rose-500 mt-0.5">{contactErrors.email.message}</p>}
                </div>
                <div>
                  <label className="text-[10px] text-zinc-500 uppercase font-bold">Phone</label>
                  <input 
                    {...registerContact("phone")}
                    defaultValue={customer.phone}
                    className="w-full bg-white border border-border-subtle rounded-xl p-2 text-xs text-gray-900 mt-1"
                  />
                  {contactErrors.phone && <p className="text-[10px] text-rose-500 mt-0.5">{contactErrors.phone.message}</p>}
                </div>
                <div className="flex gap-2 pt-2">
                  <Button type="submit" disabled={updateContactMutation.isPending} size="sm" className="bg-primary-600 text-white font-bold text-xs rounded-xl flex-1 btn-modern cursor-pointer">
                    Save Changes
                  </Button>
                  <Button type="button" onClick={() => setIsEditingContact(false)} variant="outline" size="sm" className="border-border-subtle text-gray-900 text-xs rounded-xl cursor-pointer">
                    Cancel
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: ORDERS HISTORY */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-bg-surface border border-border-subtle rounded-2xl p-5 space-y-4 shadow-xs">
            <h3 className="text-xs font-extrabold text-gray-900 uppercase tracking-wider flex items-center gap-1.5 border-b border-border-subtle pb-3">
              <ShoppingBag className="w-4 h-4 text-primary-600" /> Order History ({orders.length})
            </h3>

            {orders.length === 0 ? (
              <p className="text-xs text-zinc-500 py-6 text-center">No order records found for this buyer profile.</p>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-border-subtle bg-white">
                <Table className="min-w-[500px] text-xs">
                  <TableHeader className="bg-primary-50/90 border-b border-border-subtle">
                    <TableRow className="uppercase text-[10px]">
                      <TableHead className="font-bold text-primary-800">Order ID</TableHead>
                      <TableHead className="font-bold text-primary-800">Date</TableHead>
                      <TableHead className="font-bold text-primary-800">Status</TableHead>
                      <TableHead className="text-right font-bold text-primary-800">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map((o) => (
                      <TableRow key={o._id} className="border-b border-border-subtle text-gray-900">
                        <TableCell className="font-mono font-bold text-primary-700 py-3">
                          <Link href={`/admin/orders/${o._id}`} className="hover:underline flex items-center gap-1">
                            {o.orderNumber} <Eye className="w-3 h-3 text-zinc-400" />
                          </Link>
                        </TableCell>
                        <TableCell className="font-mono text-zinc-600 py-3">{formatDate(o.createdAt)}</TableCell>
                        <TableCell className="py-3">
                          <span className="bg-primary-50 text-primary-700 border border-primary-200 px-2 py-0.5 rounded text-[10px] font-bold">
                            {o.status}
                          </span>
                        </TableCell>
                        <TableCell className="text-right font-mono font-extrabold text-emerald-600 py-3">{formatCurrency(o.totalAmount)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </div>

      </div>

      <AlertDialog open={blockDialogOpen} onOpenChange={setBlockDialogOpen}>
        <AlertDialogContent className="bg-white/95 backdrop-blur-2xl border border-border-subtle text-gray-900 rounded-2xl shadow-xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-gray-900 font-bold">Block Customer Profile</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-600">
              Are you sure you want to block <strong className="text-gray-900">{customer.name}</strong>? Blocked customers will be restricted from placing new orders.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-bg-surface text-gray-900 border-border-subtle hover:bg-primary-50 rounded-xl cursor-pointer">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => {
                setBlockDialogOpen(false);
                toggleStatusMutation.mutate();
              }}
              className="bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl cursor-pointer"
            >
              Confirm Block
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}
