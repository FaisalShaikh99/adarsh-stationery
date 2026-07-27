"use client";

import { useMemo, useState } from "react";
import axios from "axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, Loader2, RefreshCw, Search, Eye, AlertTriangle, Check, X, ShieldAlert, Users } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import useFuzzySearch from "@/hooks/useFuzzySearch";
import VoiceSearchButton from "@/components/ui/voice-search-button";

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

export default function CustomersPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [tag, setTag] = useState("");

  // Queries
  const queryParams = useMemo(() => ({ page, limit: 10, search, status, tag }), [page, search, status, tag]);
  
  const { data: customersResponse, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["customers", queryParams],
    queryFn: async () => (await axios.get("/api/admin/customers", { params: queryParams })).data.data,
  });

  const { data: statsResponse } = useQuery({
    queryKey: ["customer-stats"],
    queryFn: async () => (await axios.get("/api/admin/customers/stats")).data.data,
  });

  const { data: spellingTargets } = useQuery({
    queryKey: ["customer-spelling-targets"],
    queryFn: async () => (await axios.get("/api/admin/customers?all=true")).data.data?.customers || [],
    staleTime: 60 * 1000,
  });

  // Mutations
  const toggleStatusMutation = useMutation({
    mutationFn: (id) => axios.patch(`/api/admin/customers/${id}/status`),
    onSuccess: (response) => {
      toast.success(response.data.message || "Customer status updated.");
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["customer-stats"] });
      queryClient.invalidateQueries({ queryKey: ["customer-spelling-targets"] });
    },
    onError: (error) => toast.error(error.response?.data?.message || "Unable to update customer status."),
  });

  const customers = customersResponse?.customers || [];
  const pagination = customersResponse?.pagination || { page: 1, totalPages: 1, total: 0 };
  const stats = statsResponse || { totalCustomers: 0, vipCount: 0, newCount: 0, atRiskCount: 0 };

  const resetPage = (setter) => (event) => {
    setter(event.target.value);
    setPage(1);
  };

  // Client-side fuzzy spelling suggestion helper
  const { suggestion: spellingSuggestion } = useFuzzySearch(
    spellingTargets || [],
    search,
    ["name", "phone", "email"]
  );

  return (
    <div className="w-full max-w-full space-y-6 text-gray-900 overflow-x-hidden">
      
      {/* 1. CLEAN PAGE HEADER */}
      <div className="flex flex-wrap gap-4 justify-between items-center border-b border-border-subtle pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-primary-50 border border-primary-100 text-primary-600">
              <Users className="h-5 w-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-gray-900">Customer Directory & CRM</h1>
          </div>
          <p className="mt-1 text-xs sm:text-sm text-zinc-600 font-medium">
            Manage buyer profiles, customer segmentation, order history, and account access.
          </p>
        </div>
        <Button 
          onClick={() => refetch()} 
          disabled={isFetching} 
          variant="outline" 
          className="rounded-xl border-border-subtle bg-bg-surface text-gray-900 hover:bg-primary-50 text-xs sm:text-sm font-semibold h-10 px-4 cursor-pointer shadow-xs btn-modern shrink-0"
          title="Refresh customers list"
        >
          <RefreshCw className={`mr-2 h-4 w-4 text-primary-600 ${isFetching ? "animate-spin" : ""}`} />
          <span>Refresh Directory</span>
        </Button>
      </div>

      {/* 3. STATS CARDS GRID */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          ["Total Customers", stats.totalCustomers],
          ["VIP Customers", stats.vipCount],
          ["New Customers", stats.newCount],
          ["At Risk Customers", stats.atRiskCount],
        ].map(([label, value]) => (
          <div key={label} className="bg-bg-surface border border-border-subtle p-5 rounded-2xl shadow-xs flex flex-col justify-between min-h-[105px]">
            <div>
              <p className="text-xs text-zinc-500 uppercase tracking-wider font-bold">{label}</p>
              <p className="text-2xl font-bold mt-2 font-mono tracking-tight text-gray-900">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* 4. SEARCH & FILTERS CONTAINER */}
      <div className="bg-bg-surface border border-border-subtle rounded-2xl p-4 sm:p-6 space-y-4 shadow-xs">
        <div className="flex flex-col gap-3 lg:flex-row items-center justify-between">
          <div className="flex items-center w-full bg-bg-surface border border-border-subtle rounded-xl px-3.5 transition-all gap-2 h-11 focus-within:border-primary-400 focus-within:ring-1 focus-within:ring-primary-400">
            <Search className="h-4 w-4 text-zinc-400 shrink-0" />
            <Input 
              value={search} 
              onChange={resetPage(setSearch)} 
              placeholder="Search customers by name, phone, or email..." 
              className="flex-1 bg-transparent border-none text-xs text-gray-900 placeholder-zinc-400 focus-visible:ring-0 focus-visible:ring-offset-0 focus:outline-none focus:ring-0 text-xs h-full p-0 shadow-none"
            />
            <VoiceSearchButton 
              onResult={(text) => {
                setSearch(text);
                setPage(1);
              }} 
              className="shrink-0 h-8 w-8"
            />
          </div>
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto shrink-0">
            <select 
              value={tag} 
              onChange={resetPage(setTag)} 
              className="h-11 bg-bg-surface border border-border-subtle rounded-xl px-4 text-xs font-semibold text-gray-900 hover:border-primary-300 transition-all outline-none cursor-pointer w-full sm:w-auto sm:min-w-[180px] shadow-xs"
            >
              <option value="" className="bg-white text-gray-900">All tags</option>
              <option value="VIP" className="bg-white text-gray-900">VIP</option>
              <option value="New" className="bg-white text-gray-900">New</option>
              <option value="At Risk" className="bg-white text-gray-900">At Risk</option>
            </select>
            <select 
              value={status} 
              onChange={resetPage(setStatus)} 
              className="h-11 bg-bg-surface border border-border-subtle rounded-xl px-4 text-xs font-semibold text-gray-900 hover:border-primary-300 transition-all outline-none cursor-pointer w-full sm:w-auto sm:min-w-[180px] shadow-xs"
            >
              <option value="" className="bg-white text-gray-900">All statuses</option>
              <option value="Active" className="bg-white text-gray-900">Active</option>
              <option value="Blocked" className="bg-white text-gray-900">Blocked</option>
            </select>
          </div>
        </div>

        {/* Spelling Ribbon Suggestion */}
        {spellingSuggestion && (
          <div className="text-xs text-primary-700 bg-primary-50 border border-primary-200 px-3 py-1.5 rounded-lg w-fit mx-auto font-medium">
            Did you mean:{" "}
            <button
              type="button"
              onClick={() => {
                setSearch(spellingSuggestion);
                setPage(1);
              }}
              className="text-primary-700 font-extrabold hover:underline"
            >
              {spellingSuggestion}
            </button>
            {" "}?
          </div>
        )}

        {/* 5. DATA TABLE */}
        {/* 👤 CRM CUSTOMER CARDS GRID */}
        {isLoading ? (
          <div className="flex h-48 items-center justify-center bg-bg-surface border border-border-subtle rounded-2xl">
            <Loader2 className="h-6 w-6 animate-spin text-primary-600" />
          </div>
        ) : customers.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center p-12 border border-dashed border-border-subtle bg-bg-surface rounded-2xl space-y-2 min-h-[200px]">
            <p className="font-semibold text-gray-900 text-sm">No customers match these filters.</p>
            <p className="text-xs text-zinc-500">Try adjusting your search query or segments filter.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {customers.map((customer) => (
              <div 
                key={customer._id}
                onClick={() => router.push(`/admin/customers/${customer._id}`)}
                className={`bg-bg-surface border border-border-subtle hover:border-primary-300 rounded-2xl p-5 flex flex-col justify-between transition-all duration-300 relative group cursor-pointer shadow-xs text-gray-900 ${
                  customer.status === "Blocked" ? "opacity-75 bg-rose-50/40 border-rose-200" : ""
                }`}
              >
                {/* Header: Tags & Status Switch */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex flex-wrap gap-1.5">
                    {customer.tags && customer.tags.length > 0 ? (
                      customer.tags.map((item) => (
                        <span key={item} className="px-2.5 py-0.5 rounded-full text-[9px] font-bold border bg-primary-50 text-primary-700 border-primary-200">
                          {item}
                        </span>
                      ))
                    ) : (
                      <span className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest font-mono">Standard</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <Switch
                      checked={customer.status === "Active"}
                      onCheckedChange={() => toggleStatusMutation.mutate(customer._id)}
                      className="data-[state=checked]:bg-emerald-600 data-[state=unchecked]:bg-zinc-300 scale-75 cursor-pointer"
                    />
                    <span className={`text-[9px] font-bold uppercase ${customer.status === "Active" ? "text-emerald-600" : "text-rose-600"}`}>
                      {customer.status}
                    </span>
                  </div>
                </div>

                {/* Info Block */}
                <div className="flex items-center gap-3 py-2">
                  <div className="w-10 h-10 rounded-full bg-primary-100 border border-primary-200 flex items-center justify-center text-sm font-extrabold text-primary-700 capitalize shrink-0">
                    {customer.name ? customer.name[0] : "C"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-extrabold text-gray-900 truncate capitalize text-xs">{customer.name}</h3>
                    <p className="text-[11px] text-zinc-500 font-mono truncate">{customer.email || "No Email Provided"}</p>
                    <p className="text-[11px] text-zinc-500 font-mono truncate">{customer.phone || "No Phone Registered"}</p>
                  </div>
                </div>

                {/* Footer Metrics */}
                <div className="mt-4 border-t border-border-subtle pt-3 flex items-center justify-between text-[11px] font-mono">
                  <div>
                    <span className="text-[9px] text-zinc-500 uppercase tracking-wider font-bold block font-sans">Total Orders</span>
                    <span className="font-extrabold text-gray-900">{String(customer.orderCount || 0).padStart(2, "0")}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] text-zinc-500 uppercase tracking-wider font-bold block font-sans">Lifetime Spent</span>
                    <span className="font-extrabold text-emerald-600">{formatCurrency(customer.totalSpent)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 6. PAGINATION */}
        <div className="flex items-center justify-between text-xs text-zinc-500 font-mono border-t border-zinc-800/80 pt-5 mt-4">
          <span>{pagination.total} total customers</span>
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
