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
        <div className="overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-900/10">
          <Table className="min-w-[1000px]">
            <TableHeader className="bg-zinc-900/40">
              <TableRow className="border-b border-zinc-800 hover:bg-transparent">
                <TableHead className="font-semibold text-zinc-400">Customer Name</TableHead>
                <TableHead className="font-semibold text-zinc-400">Phone</TableHead>
                <TableHead className="font-semibold text-zinc-400">Email</TableHead>
                <TableHead className="font-semibold text-zinc-400">Order Count</TableHead>
                <TableHead className="font-semibold text-zinc-400">Total Spent</TableHead>
                <TableHead className="font-semibold text-zinc-400">Tags</TableHead>
                <TableHead className="font-semibold text-zinc-400">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-48 text-center text-zinc-450">
                    <Loader2 className="mx-auto h-5 w-5 animate-spin text-zinc-500" />
                  </TableCell>
                </TableRow>
              ) : customers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-12 text-center text-sm text-zinc-500">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <p className="font-semibold text-zinc-400">No customers match these filters.</p>
                      <p className="text-xs text-zinc-550 text-zinc-500">Try adjusting your search query or segments filter.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : customers.map((customer) => (
                <TableRow 
                  key={customer._id} 
                  onClick={() => router.push(`/admin/customers/${customer._id}`)}
                  className="border-b border-zinc-800/60 hover:bg-zinc-900/20 transition-colors cursor-pointer"
                >
                  <TableCell className="py-4 font-semibold text-zinc-200">
                    {customer.name}
                  </TableCell>
                  <TableCell className="py-4 text-zinc-300 font-mono text-xs">
                    {customer.phone}
                  </TableCell>
                  <TableCell className="py-4 text-zinc-300 text-xs">
                    {customer.email || <span className="text-zinc-650">—</span>}
                  </TableCell>
                  <TableCell className="py-4 text-zinc-300 font-mono">
                    {customer.orderCount}
                  </TableCell>
                  <TableCell className="py-4 text-zinc-100 font-mono">
                    {formatCurrency(customer.totalSpent)}
                  </TableCell>
                  <TableCell className="py-4">
                    <div className="flex flex-wrap gap-1.5">
                      {customer.tags && customer.tags.length > 0 ? (
                        customer.tags.map((item) => (
                          <span key={item} className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${tagClasses[item] || "bg-zinc-800 text-zinc-450 border-zinc-700"}`}>
                            {item}
                          </span>
                        ))
                      ) : (
                        <span className="text-zinc-650 text-xs">—</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="py-4" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center">
                      <Switch
                        checked={customer.status === "Active"}
                        onCheckedChange={() => toggleStatusMutation.mutate(customer._id)}
                        disabled={toggleStatusMutation.isPending}
                        className="data-[state=checked]:bg-emerald-600 scale-90"
                        aria-label="Toggle status"
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

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
