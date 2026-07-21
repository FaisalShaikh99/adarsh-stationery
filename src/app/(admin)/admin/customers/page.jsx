"use client";

import { useMemo, useState } from "react";
import axios from "axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, Loader2, RefreshCw, Search, Eye, AlertTriangle, Check, X, ShieldAlert } from "lucide-react";
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
    <div className="mx-auto w-full max-w-7xl space-y-6">
      
      {/* 1. TOP NAVBAR */}
      <div className="flex flex-wrap gap-3 justify-between items-center border-b border-zinc-800 pb-5">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white">Customer Directory</h1>
          <p className="mt-1 text-xs text-zinc-400">Manage buyer records, segments, duplicate logs, and statuses.</p>
        </div>
        <Button 
          onClick={() => refetch()} 
          disabled={isFetching} 
          variant="outline" 
          className="h-9 w-9 p-0 border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white shrink-0 rounded-xl hover:bg-zinc-800"
          title="Refresh customers list"
        >
          <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
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
          <div key={label} className="bg-[#0c0c0e] border border-zinc-800/80 p-5 rounded-2xl shadow-sm flex flex-col justify-between min-h-[105px]">
            <div>
              <p className="text-xs text-zinc-500 uppercase tracking-wider font-bold">{label}</p>
              <p className="text-2xl font-bold mt-2 font-mono tracking-tight text-white">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* 4. SEARCH & FILTERS CONTAINER */}
      <div className="bg-[#0c0c0e] border border-zinc-800 rounded-2xl p-4 sm:p-6 space-y-4 shadow-xl">
        <div className="flex flex-col gap-3 lg:flex-row items-center justify-between">
          <div className="flex items-center w-full bg-[#141416] border border-zinc-700 rounded-xl px-3.5 transition-all gap-2 h-11 focus-within:border-zinc-500 focus-within:ring-1 focus-within:ring-zinc-500">
            <Search className="h-4 w-4 text-zinc-500 shrink-0" />
            <Input 
              value={search} 
              onChange={resetPage(setSearch)} 
              placeholder="Search customers by name, phone, or email..." 
              className="flex-1 bg-transparent border-none text-zinc-300 placeholder-zinc-500 focus-visible:ring-0 focus-visible:ring-offset-0 focus:outline-none focus:ring-0 text-xs h-full p-0 shadow-none"
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
              className="h-11 bg-[#141416] border border-zinc-700 rounded-xl px-4 text-xs font-semibold text-zinc-300 hover:text-white hover:border-zinc-500 transition-all outline-none cursor-pointer w-full sm:w-auto sm:min-w-[180px]"
            >
              <option value="" className="bg-zinc-950 text-zinc-400">All tags</option>
              <option value="VIP" className="bg-zinc-950 text-zinc-200">VIP</option>
              <option value="New" className="bg-zinc-950 text-zinc-200">New</option>
              <option value="At Risk" className="bg-zinc-950 text-zinc-200">At Risk</option>
            </select>
            <select 
              value={status} 
              onChange={resetPage(setStatus)} 
              className="h-11 bg-[#141416] border border-zinc-700 rounded-xl px-4 text-xs font-semibold text-zinc-300 hover:text-white hover:border-zinc-500 transition-all outline-none cursor-pointer w-full sm:w-auto sm:min-w-[180px]"
            >
              <option value="" className="bg-zinc-950 text-zinc-400">All statuses</option>
              <option value="Active" className="bg-zinc-950 text-zinc-200">Active</option>
              <option value="Blocked" className="bg-zinc-950 text-zinc-200">Blocked</option>
            </select>
          </div>
        </div>

        {/* Spelling Ribbon Suggestion */}
        {spellingSuggestion && (
          <div className="text-xs text-zinc-400 bg-blue-500/10 border border-blue-500/20 px-3 py-1.5 rounded-lg w-fit mx-auto">
            Did you mean:{" "}
            <button
              type="button"
              onClick={() => {
                setSearch(spellingSuggestion);
                setPage(1);
              }}
              className="text-blue-400 font-semibold hover:underline"
            >
              {spellingSuggestion}
            </button>
            {" "}?
          </div>
        )}

        {/* 5. DATA TABLE */}
        {/* 👤 CRM CUSTOMER CARDS GRID */}
        {isLoading ? (
          <div className="flex h-48 items-center justify-center bg-[#0c0c0e]/30 border border-zinc-800 rounded-2xl">
            <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
          </div>
        ) : customers.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center p-12 border border-dashed border-zinc-800 bg-[#0c0c0e]/30 rounded-2xl space-y-2 min-h-[200px]">
            <p className="font-semibold text-zinc-400">No customers match these filters.</p>
            <p className="text-xs text-zinc-500">Try adjusting your search query or segments filter.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {customers.map((customer) => (
              <div 
                key={customer._id}
                onClick={() => router.push(`/admin/customers/${customer._id}`)}
                className={`bg-zinc-900/30 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/10 rounded-2xl p-5 flex flex-col justify-between transition-all duration-300 relative group cursor-pointer ${
                  customer.status === "Blocked" ? "opacity-60 bg-rose-950/5 border-rose-900/10" : ""
                }`}
              >
                {/* Header: Tags & Status Switch */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex flex-wrap gap-1.5">
                    {customer.tags && customer.tags.length > 0 ? (
                      customer.tags.map((item) => (
                        <span key={item} className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${tagClasses[item] || "bg-zinc-800 text-zinc-450 border-zinc-700"}`}>
                          {item}
                        </span>
                      ))
                    ) : (
                      <span className="text-zinc-600 text-[10px] uppercase font-bold tracking-widest font-mono">Standard</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <Switch
                      checked={customer.status === "Active"}
                      onCheckedChange={() => toggleStatusMutation.mutate(customer._id)}
                      disabled={toggleStatusMutation.isPending}
                      className="data-[state=checked]:bg-emerald-600 scale-75"
                      aria-label="Toggle status"
                    />
                    <span className={`text-[9px] font-bold uppercase ${customer.status === "Active" ? "text-emerald-400" : "text-rose-400"}`}>
                      {customer.status || "Active"}
                    </span>
                  </div>
                </div>

                {/* Profile Block */}
                <div className="flex items-center gap-4 py-2 border-b border-zinc-900 pb-4 mb-4">
                  <div className="w-11 h-11 rounded-full bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-base font-bold text-indigo-400 capitalize shrink-0 shadow-inner">
                    {customer.name ? customer.name[0] : "C"}
                  </div>
                  
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-zinc-100 truncate capitalize text-xs group-hover:text-white transition-colors">
                      {customer.name}
                    </h3>
                    <p className="text-[11px] text-zinc-400 font-mono mt-0.5 truncate">{customer.email || "No Email Provided"}</p>
                    <p className="text-[10px] text-zinc-500 font-mono mt-0.5">{customer.phone || "No Phone"}</p>
                  </div>
                </div>

                {/* Metrics Row */}
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div className="space-y-1">
                    <p className="text-[9px] text-zinc-500 uppercase tracking-wider font-bold">Total Orders</p>
                    <p className="font-bold font-mono text-zinc-200 text-xs">
                      {String(customer.orderCount || 0).padStart(2, '0')}
                    </p>
                  </div>
                  <div className="space-y-1 text-right">
                    <p className="text-[9px] text-zinc-500 uppercase tracking-wider font-bold">Lifetime Spent</p>
                    <p className="font-bold font-mono text-blue-400 text-xs">
                      {formatCurrency(customer.totalSpent || 0)}
                    </p>
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
