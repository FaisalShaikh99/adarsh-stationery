"use client";

import { useMemo, useState } from "react";
import axios from "axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, ChevronDown, Loader2, RefreshCw, Search, Check, Users, ShieldAlert, ArrowUpRight, TrendingUp } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import useFuzzySearch from "@/hooks/useFuzzySearch";
import VoiceSearchButton from "@/components/ui/voice-search-button";

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

  // Custom Dropdown Popover Drawers Open States
  const [isTagDropdownOpen, setIsTagDropdownOpen] = useState(false);
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);

  // Queries
  const queryParams = useMemo(() => ({ page, limit: 9, search, status, tag }), [page, search, status, tag]);
  
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
  const stats = statsResponse || { totalCustomers: 6, vipCount: 1, newCount: 5, atRiskCount: 0 };

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
    <div className="w-full max-w-full space-y-6 text-gray-900 overflow-x-hidden font-sans pb-12">
      
      {/* 1. PAGE HEADER */}
      <div className="flex flex-wrap gap-4 justify-between items-center border-b border-border-subtle pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-primary-600 text-white shadow-md ring-4 ring-primary-100">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-gray-900">Customer Directory & CRM</h1>
              <p className="text-xs sm:text-sm text-zinc-600 font-medium">
                Manage buyer profiles, customer segmentation, order history, and account access.
              </p>
            </div>
          </div>
        </div>
        <Button 
          onClick={() => refetch()} 
          disabled={isFetching} 
          variant="outline" 
          className="rounded-2xl border-border-subtle bg-white text-gray-900 hover:bg-primary-50 text-xs sm:text-sm font-bold h-11 px-5 cursor-pointer shadow-2xs btn-modern shrink-0"
          title="Refresh customers list"
        >
          <RefreshCw className={`mr-2 h-4 w-4 text-primary-600 ${isFetching ? "animate-spin" : ""}`} />
          <span>Refresh Directory</span>
        </Button>
      </div>

      {/* 2. TOP MAIN COUNTER BOXES (MATCHING USER'S SCREENSHOT GRADIENTS & WAVE SVG) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        
        {/* Box 1: Total Customers (Primary Amethyst Gradient) */}
        <div className="rounded-2xl sm:rounded-[26px] bg-gradient-to-br from-[#9B66D4] via-[#B885E2] to-[#D8A5E9] p-3.5 sm:p-6 text-white shadow-md flex flex-col justify-between group hover:shadow-xl transition-all duration-300">
          <div className="flex items-start justify-between">
            <h2 className="text-xl sm:text-3xl lg:text-4xl font-black font-mono tracking-tight text-white">{stats.totalCustomers}</h2>
            <span className="text-[10px] sm:text-xs font-black font-mono bg-white/20 backdrop-blur-md px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-lg sm:rounded-xl text-white border border-white/30 flex items-center gap-1 shadow-2xs">
              +12% ▲
            </span>
          </div>
          <div>
            <p className="text-[11px] sm:text-xs md:text-sm font-bold text-white/90 mt-1.5 sm:mt-2 truncate">Registered Customers</p>
            {/* Smooth Wave Graph SVG */}
            <svg className="w-full h-6 sm:h-8 opacity-80 mt-2 sm:mt-3 text-white" viewBox="0 0 100 25" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M0 18 Q20 5 40 16 T80 10 T100 14" />
            </svg>
          </div>
        </div>

        {/* Box 2: VIP Customers (Coral Rose Mesh Gradient) */}
        <div className="rounded-2xl sm:rounded-[26px] bg-gradient-to-br from-rose-500 via-pink-500 to-orange-400 p-3.5 sm:p-6 text-white shadow-md flex flex-col justify-between group hover:shadow-xl transition-all duration-300">
          <div className="flex items-start justify-between">
            <h2 className="text-xl sm:text-3xl lg:text-4xl font-black font-mono tracking-tight text-white">{stats.vipCount}</h2>
            <span className="text-[10px] sm:text-xs font-black font-mono bg-white/20 backdrop-blur-md px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-lg sm:rounded-xl text-white border border-white/30 flex items-center gap-1 shadow-2xs">
              +5% ▲
            </span>
          </div>
          <div>
            <p className="text-[11px] sm:text-xs md:text-sm font-bold text-white/90 mt-1.5 sm:mt-2 truncate">VIP Customers</p>
            {/* Smooth Wave Graph SVG */}
            <svg className="w-full h-6 sm:h-8 opacity-80 mt-2 sm:mt-3 text-white" viewBox="0 0 100 25" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M0 15 Q25 22 50 8 T100 12" />
            </svg>
          </div>
        </div>

        {/* Box 3: New Customers (Cyan Sky Mesh Gradient) */}
        <div className="rounded-2xl sm:rounded-[26px] bg-gradient-to-br from-cyan-500 via-teal-500 to-emerald-400 p-3.5 sm:p-6 text-white shadow-md flex flex-col justify-between group hover:shadow-xl transition-all duration-300">
          <div className="flex items-start justify-between">
            <h2 className="text-xl sm:text-3xl lg:text-4xl font-black font-mono tracking-tight text-white">{stats.newCount}</h2>
            <span className="text-[10px] sm:text-xs font-black font-mono bg-white/20 backdrop-blur-md px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-lg sm:rounded-xl text-white border border-white/30 flex items-center gap-1 shadow-2xs">
              +8% ▲
            </span>
          </div>
          <div>
            <p className="text-[11px] sm:text-xs md:text-sm font-bold text-white/90 mt-1.5 sm:mt-2 truncate">New (This Month)</p>
            {/* Smooth Wave Graph SVG */}
            <svg className="w-full h-6 sm:h-8 opacity-80 mt-2 sm:mt-3 text-white" viewBox="0 0 100 25" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M0 20 Q30 4 60 18 T100 6" />
            </svg>
          </div>
        </div>

        {/* Box 4: At Risk Customers (Deep Purple Violet Gradient) */}
        <div className="rounded-2xl sm:rounded-[26px] bg-gradient-to-br from-indigo-600 via-purple-600 to-violet-500 p-3.5 sm:p-6 text-white shadow-md flex flex-col justify-between group hover:shadow-xl transition-all duration-300">
          <div className="flex items-start justify-between">
            <h2 className="text-xl sm:text-3xl lg:text-4xl font-black font-mono tracking-tight text-white">{stats.atRiskCount}</h2>
            <span className="text-[10px] sm:text-xs font-black font-mono bg-white/20 backdrop-blur-md px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-lg sm:rounded-xl text-white border border-white/30 flex items-center gap-1 shadow-2xs">
              0% ➖
            </span>
          </div>
          <div>
            <p className="text-[11px] sm:text-xs md:text-sm font-bold text-white/90 mt-1.5 sm:mt-2 truncate">At Risk / Inactive</p>
            {/* Smooth Wave Graph SVG */}
            <svg className="w-full h-6 sm:h-8 opacity-80 mt-2 sm:mt-3 text-white" viewBox="0 0 100 25" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M0 12 Q20 18 50 10 T100 16" />
            </svg>
          </div>
        </div>

      </div>

      {/* 3. SEARCH & CUSTOM FLOATING DROPDOWN DRAWERS CONTAINER */}
      <div className="bg-bg-surface border border-border-subtle rounded-[26px] p-4 sm:p-6 space-y-4 shadow-xs">
        <div className="flex flex-col gap-3 lg:flex-row items-center justify-between">
          <div className="flex items-center w-full bg-white border border-border-subtle rounded-2xl px-4 transition-all gap-2.5 h-11 focus-within:border-primary-400 focus-within:ring-1 focus-within:ring-primary-400 shadow-2xs">
            <Search className="h-4 w-4 text-zinc-400 shrink-0" />
            <Input 
              value={search} 
              onChange={resetPage(setSearch)} 
              placeholder="Search customers by name, phone, or email..." 
              className="flex-1 bg-transparent border-none text-gray-900 placeholder-zinc-400 focus-visible:ring-0 focus-visible:ring-offset-0 focus:outline-none focus:ring-0 text-xs font-bold h-full p-0 shadow-none"
            />
            <VoiceSearchButton 
              onResult={(text) => {
                setSearch(text);
                setPage(1);
              }} 
              className="shrink-0 h-8 w-8 text-primary-600"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto shrink-0">
            
            {/* Custom Tag Floating Popover Drawer */}
            <div className="relative shrink-0 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setIsTagDropdownOpen(!isTagDropdownOpen)}
                className="bg-white border border-border-subtle rounded-2xl h-11 px-4 text-xs font-bold text-gray-900 hover:border-primary-400 transition-all flex items-center justify-between gap-2.5 cursor-pointer w-full sm:min-w-[170px] shadow-2xs"
              >
                <span className="truncate">{tag || "All tags"}</span>
                <ChevronDown className={`w-4 h-4 text-zinc-400 transition-transform duration-200 ${isTagDropdownOpen ? "rotate-180 text-primary-600" : ""}`} />
              </button>
              {isTagDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsTagDropdownOpen(false)} />
                  <div className="absolute left-0 sm:right-0 top-12 w-52 bg-white/95 backdrop-blur-2xl border border-border-subtle rounded-2xl p-2 shadow-xl z-50 space-y-1 text-gray-900 animate-in fade-in-50 zoom-in-95 duration-150 font-sans">
                    {[
                      { label: "All tags", value: "" },
                      { label: "VIP", value: "VIP" },
                      { label: "New", value: "New" },
                      { label: "At Risk", value: "At Risk" }
                    ].map((opt) => (
                      <button
                        type="button"
                        key={opt.value}
                        onClick={() => { setTag(opt.value); setPage(1); setIsTagDropdownOpen(false); }}
                        className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs transition-all cursor-pointer flex items-center justify-between ${
                          tag === opt.value ? "bg-primary-50 text-primary-700 font-black" : "text-gray-900 hover:bg-primary-50/60 font-bold"
                        }`}
                      >
                        <span>{opt.label}</span>
                        {tag === opt.value && <Check className="w-3.5 h-3.5 text-primary-600" />}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Custom Status Floating Popover Drawer */}
            <div className="relative shrink-0 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
                className="bg-white border border-border-subtle rounded-2xl h-11 px-4 text-xs font-bold text-gray-900 hover:border-primary-400 transition-all flex items-center justify-between gap-2.5 cursor-pointer w-full sm:min-w-[170px] shadow-2xs"
              >
                <span className="truncate">{status || "All statuses"}</span>
                <ChevronDown className={`w-4 h-4 text-zinc-400 transition-transform duration-200 ${isStatusDropdownOpen ? "rotate-180 text-primary-600" : ""}`} />
              </button>
              {isStatusDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsStatusDropdownOpen(false)} />
                  <div className="absolute right-0 top-12 w-52 bg-white/95 backdrop-blur-2xl border border-border-subtle rounded-2xl p-2 shadow-xl z-50 space-y-1 text-gray-900 animate-in fade-in-50 zoom-in-95 duration-150 font-sans">
                    {[
                      { label: "All statuses", value: "" },
                      { label: "Active", value: "Active" },
                      { label: "Blocked", value: "Blocked" }
                    ].map((opt) => (
                      <button
                        type="button"
                        key={opt.value}
                        onClick={() => { setStatus(opt.value); setPage(1); setIsStatusDropdownOpen(false); }}
                        className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs transition-all cursor-pointer flex items-center justify-between ${
                          status === opt.value ? "bg-primary-50 text-primary-700 font-black" : "text-gray-900 hover:bg-primary-50/60 font-bold"
                        }`}
                      >
                        <span>{opt.label}</span>
                        {status === opt.value && <Check className="w-3.5 h-3.5 text-primary-600" />}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

          </div>
        </div>

        {/* Spelling Ribbon Suggestion */}
        {spellingSuggestion && (
          <div className="text-xs text-primary-700 bg-primary-50 border border-primary-200 px-3 py-1.5 rounded-xl w-fit mx-auto font-bold shadow-2xs">
            Did you mean:{" "}
            <button
              type="button"
              onClick={() => {
                setSearch(spellingSuggestion);
                setPage(1);
              }}
              className="text-primary-700 font-black hover:underline"
            >
              {spellingSuggestion}
            </button>
            {" "}?
          </div>
        )}

        {/* 4. CRM CUSTOMER CARDS GRID (ENHANCED CARD HOVER & BOLD TYPOGRAPHY) */}
        {isLoading ? (
          <div className="flex h-48 items-center justify-center bg-white border border-border-subtle rounded-2xl">
            <Loader2 className="h-6 w-6 animate-spin text-primary-600" />
          </div>
        ) : customers.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center p-12 border border-dashed border-border-subtle bg-white rounded-2xl space-y-2 min-h-[220px]">
            <p className="font-black text-gray-900 text-sm">No customer profiles match these filters.</p>
            <p className="text-xs text-zinc-500 font-medium">Try adjusting your search query or tag segments filter.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {customers.map((customer) => (
              <div 
                key={customer._id}
                onClick={() => router.push(`/admin/customers/${customer._id}`)}
                className={`bg-white border border-border-subtle hover:border-primary-400 hover:shadow-xl rounded-[26px] p-6 flex flex-col justify-between transition-all duration-300 relative group cursor-pointer text-gray-900 hover:-translate-y-1 ${
                  customer.status === "Blocked" ? "opacity-75 bg-rose-50/40 border-rose-200" : ""
                }`}
              >
                {/* Subtle Purple Ambient Overlay on Hover */}
                <div className="absolute inset-0 bg-gradient-to-r from-primary-500/0 via-primary-500/0 to-primary-500/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-[26px] pointer-events-none" />

                {/* Header: Tags & Status Switch */}
                <div className="flex justify-between items-start mb-4 relative z-10">
                  <div className="flex flex-wrap gap-1.5">
                    {customer.tags && customer.tags.length > 0 ? (
                      customer.tags.map((item) => (
                        <span key={item} className="px-3 py-1 rounded-xl text-xs font-black border bg-primary-50 text-primary-700 border-primary-200 shadow-2xs">
                          {item}
                        </span>
                      ))
                    ) : (
                      <span className="px-3 py-1 rounded-xl text-xs font-bold bg-zinc-100 text-zinc-700 border border-zinc-200">Standard</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <Switch
                      checked={customer.status === "Active"}
                      onCheckedChange={() => toggleStatusMutation.mutate(customer._id)}
                      className="data-[state=checked]:bg-emerald-600 data-[state=unchecked]:bg-zinc-300 scale-90 cursor-pointer"
                    />
                    <span className={`text-xs font-black uppercase ${customer.status === "Active" ? "text-emerald-600" : "text-rose-600"}`}>
                      {customer.status}
                    </span>
                  </div>
                </div>

                {/* Info Block (BOLD & ENLARGED CUSTOMER DATA) */}
                <div className="flex items-center gap-3.5 py-2 relative z-10">
                  <div className="w-12 h-12 rounded-2xl bg-primary-100 border border-primary-200 flex items-center justify-center text-base font-black text-primary-700 capitalize shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                    {customer.name ? customer.name[0] : "C"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-black text-gray-900 truncate capitalize text-sm sm:text-base tracking-tight group-hover:text-primary-700 transition-colors">
                      {customer.name}
                    </h3>
                    <p className="text-xs text-zinc-600 font-mono font-bold truncate mt-0.5">{customer.email || "No Email Provided"}</p>
                    <p className="text-xs text-zinc-600 font-mono font-bold truncate">{customer.phone || "No Phone Registered"}</p>
                  </div>
                </div>

                {/* Footer Metrics */}
                <div className="mt-4 border-t border-border-subtle pt-3.5 flex items-center justify-between font-mono relative z-10">
                  <div>
                    <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-black block font-sans">Total Orders</span>
                    <span className="font-black text-gray-900 text-sm sm:text-base">{String(customer.orderCount || 0).padStart(2, "0")}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-black block font-sans">Lifetime Spent</span>
                    <span className="font-black text-emerald-600 text-sm sm:text-base">{formatCurrency(customer.totalSpent)}</span>
                  </div>
                </div>

              </div>
            ))}
          </div>
        )}

        {/* 5. HIGH-CONTRAST PAGINATION */}
        <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-gray-900 font-bold border-t border-border-subtle pt-5 mt-6 gap-4">
          <span className="text-zinc-600 font-bold text-xs">{pagination.total} Total Registered Customers</span>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              disabled={page <= 1} 
              onClick={() => setPage((current) => current - 1)} 
              className="h-10 px-4 rounded-2xl border border-border-subtle bg-white text-gray-900 font-black text-xs hover:bg-primary-50 hover:border-primary-300 disabled:opacity-40 transition-all cursor-pointer shadow-2xs flex items-center gap-1.5" 
              title="Previous page"
            >
              <ChevronLeft className="h-4 w-4 text-primary-600" />
              <span>Prev</span>
            </Button>

            <span className="px-3 py-2 rounded-2xl bg-primary-50 border border-primary-200 text-primary-700 font-black text-xs font-mono">
              Page {pagination.page} of {pagination.totalPages || 1}
            </span>

            <Button 
              variant="outline" 
              disabled={page >= (pagination.totalPages || 1)} 
              onClick={() => setPage((current) => current + 1)} 
              className="h-10 px-4 rounded-2xl border border-border-subtle bg-white text-gray-900 font-black text-xs hover:bg-primary-50 hover:border-primary-300 disabled:opacity-40 transition-all cursor-pointer shadow-2xs flex items-center gap-1.5" 
              title="Next page"
            >
              <span>Next</span>
              <ChevronRight className="h-4 w-4 text-primary-600" />
            </Button>
          </div>
        </div>

      </div>

    </div>
  );
}
