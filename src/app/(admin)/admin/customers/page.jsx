"use client";

import { useMemo, useState } from "react";
import axios from "axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, Loader2, RefreshCw, Search, Eye, AlertTriangle, Check, X, ShieldAlert } from "lucide-react";
import Link from "next/link";
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
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [tag, setTag] = useState("");
  const [isDuplicateModalOpen, setIsDuplicateModalOpen] = useState(false);
  const [isBannerDismissed, setIsBannerDismissed] = useState(false);
  const [ignoredPrimaryIds, setIgnoredPrimaryIds] = useState(new Set());

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

  const { data: duplicatesResponse } = useQuery({
    queryKey: ["customer-duplicates"],
    queryFn: async () => (await axios.get("/api/admin/customers/duplicates")).data.data,
  });

  // Mutations
  const toggleStatusMutation = useMutation({
    mutationFn: (id) => axios.patch(`/api/admin/customers/${id}/status`),
    onSuccess: (response) => {
      toast.success(response.data.message || "Customer status updated.");
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["customer-stats"] });
    },
    onError: (error) => toast.error(error.response?.data?.message || "Unable to update customer status."),
  });

  const mergeMutation = useMutation({
    mutationFn: ({ primaryId, duplicateIds }) => axios.post("/api/admin/customers/merge", { primaryId, duplicateIds }),
    onSuccess: (response) => {
      toast.success(response.data.message || "Customers merged successfully.");
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["customer-stats"] });
      queryClient.invalidateQueries({ queryKey: ["customer-duplicates"] });
    },
    onError: (error) => toast.error(error.response?.data?.message || "Unable to merge customer profiles."),
  });

  const customers = customersResponse?.customers || [];
  const pagination = customersResponse?.pagination || { page: 1, totalPages: 1, total: 0 };
  const stats = statsResponse || { totalCustomers: 0, vipCount: 0, newCount: 0, atRiskCount: 0 };
  
  // Filter active duplicate groups that have not been ignored in the local UI
  const activeDuplicateGroups = useMemo(() => {
    if (!duplicatesResponse) return [];
    return duplicatesResponse.filter(group => !ignoredPrimaryIds.has(group.primary._id));
  }, [duplicatesResponse, ignoredPrimaryIds]);

  const resetPage = (setter) => (event) => {
    setter(event.target.value);
    setPage(1);
  };

  // Client-side fuzzy spelling suggestion helper
  const { suggestion: spellingSuggestion } = useFuzzySearch(
    customersResponse?.customers || [],
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

      {/* 2. DUPLICATES ALERT BANNER */}
      {activeDuplicateGroups.length > 0 && !isBannerDismissed && (
        <div className="flex items-center justify-between gap-4 bg-amber-500/10 border border-amber-500/25 p-4 rounded-2xl animate-fade-in shadow-lg">
          <div className="flex items-center gap-3">
            <div className="bg-amber-500/20 p-2 rounded-xl text-amber-300">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-zinc-100">
                {activeDuplicateGroups.length} possible duplicate customer profiles detected
              </p>
              <p className="text-xs text-zinc-400 mt-0.5">
                Profiles with similar names and matching cities or pin codes have been flagged.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={() => setIsDuplicateModalOpen(true)}
              className="bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs rounded-xl px-4 py-2 h-auto"
            >
              Review duplicates
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setIsBannerDismissed(true)}
              className="text-zinc-500 hover:text-zinc-300 hover:bg-transparent h-8 w-8"
              title="Dismiss warning"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

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
          <Table>
            <TableHeader className="bg-zinc-900/40">
              <TableRow className="border-b border-zinc-800 hover:bg-transparent">
                <TableHead className="font-semibold text-zinc-400">Customer Name</TableHead>
                <TableHead className="font-semibold text-zinc-400">Phone</TableHead>
                <TableHead className="font-semibold text-zinc-400">Email</TableHead>
                <TableHead className="font-semibold text-zinc-400">Order Count</TableHead>
                <TableHead className="font-semibold text-zinc-400">Total Spent</TableHead>
                <TableHead className="font-semibold text-zinc-400">Tags</TableHead>
                <TableHead className="font-semibold text-zinc-400">Status</TableHead>
                <TableHead className="font-semibold text-zinc-400 text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-48 text-center text-zinc-450">
                    <Loader2 className="mx-auto h-5 w-5 animate-spin text-zinc-500" />
                  </TableCell>
                </TableRow>
              ) : customers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-48 text-center text-sm text-zinc-500">
                    No customers match these filters.
                  </TableCell>
                </TableRow>
              ) : customers.map((customer) => (
                <TableRow key={customer._id} className="border-b border-zinc-800/60 hover:bg-zinc-900/20 transition-colors">
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
                  <TableCell className="py-4">
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
                  <TableCell className="py-4 text-center">
                    <Link href={`/admin/customers/${customer._id}`} passHref>
                      <Button variant="ghost" className="p-1 h-auto text-zinc-450 hover:text-white hover:bg-transparent transition-colors" title="View Customer Details">
                        <Eye className="w-4.5 h-4.5" />
                      </Button>
                    </Link>
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

      {/* 7. DUPLICATE REVIEW DIALOG MODAL */}
      <Dialog open={isDuplicateModalOpen} onOpenChange={setIsDuplicateModalOpen}>
        <DialogContent className="max-w-[92vw] w-full sm:max-w-4xl bg-zinc-950 border border-zinc-800 text-white rounded-[32px] overflow-hidden shadow-2xl p-6">
          <DialogHeader className="border-b border-zinc-900 pb-4">
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-amber-400" />
              Review Possible Duplicates
            </DialogTitle>
            <DialogDescription className="text-zinc-400 text-xs">
              Mergable customer accounts with matching locations and spelling similarities. Primary accounts absorb order counts, spends, and historical dates before candidate removal.
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[60vh] overflow-y-auto py-4 space-y-6 custom-scrollbar pr-1">
            {activeDuplicateGroups.length === 0 ? (
              <div className="text-center py-8 text-zinc-500">
                <Check className="h-8 w-8 text-emerald-400 mx-auto mb-2" />
                <p className="font-semibold text-sm">All duplication alerts resolved!</p>
              </div>
            ) : (
              activeDuplicateGroups.map((group) => (
                <div key={group.primary._id} className="border border-zinc-800/80 rounded-2xl bg-zinc-900/10 p-5 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Primary column card */}
                    <div className="border border-blue-500/25 bg-blue-500/5 p-4 rounded-xl relative space-y-2.5">
                      <span className="absolute top-3 right-3 bg-blue-500/20 text-blue-400 border border-blue-500/30 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider font-mono">
                        Primary Suggestion
                      </span>
                      <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Name</p>
                      <p className="text-base font-bold text-zinc-100">{group.primary.name}</p>
                      
                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-800/60 text-xs">
                        <div>
                          <p className="text-zinc-500 font-medium">Phone</p>
                          <p className="font-semibold font-mono text-zinc-350">{group.primary.phone}</p>
                        </div>
                        <div>
                          <p className="text-zinc-500 font-medium">Location</p>
                          <p className="font-semibold text-zinc-350 truncate">{group.primary.city || "—"} ({group.primary.pincode || "—"})</p>
                        </div>
                        <div className="mt-1">
                          <p className="text-zinc-500 font-medium">Order Count</p>
                          <p className="font-bold text-zinc-200">{group.primary.orderCount}</p>
                        </div>
                        <div className="mt-1">
                          <p className="text-zinc-500 font-medium">Total Spent</p>
                          <p className="font-bold text-zinc-200">{formatCurrency(group.primary.totalSpent)}</p>
                        </div>
                      </div>
                    </div>

                    {/* Candidate(s) column card */}
                    <div className="space-y-3">
                      {group.candidates.map((candidate) => (
                        <div key={candidate._id} className="border border-zinc-800 bg-zinc-900/40 p-4 rounded-xl space-y-2.5 relative">
                          <span className="absolute top-3 right-3 bg-zinc-800 text-zinc-400 border border-zinc-700/60 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider font-mono">
                            Candidate
                          </span>
                          <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Name</p>
                          <p className="text-base font-bold text-zinc-200">{candidate.name}</p>
                          
                          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-800/60 text-xs">
                            <div>
                              <p className="text-zinc-500 font-medium">Phone</p>
                              <p className="font-semibold font-mono text-zinc-350">{candidate.phone}</p>
                            </div>
                            <div>
                              <p className="text-zinc-500 font-medium">Location</p>
                              <p className="font-semibold text-zinc-350 truncate">{candidate.city || "—"} ({candidate.pincode || "—"})</p>
                            </div>
                            <div className="mt-1">
                              <p className="text-zinc-500 font-medium">Order Count</p>
                              <p className="font-semibold text-zinc-300">{candidate.orderCount}</p>
                            </div>
                            <div className="mt-1">
                              <p className="text-zinc-500 font-medium">Total Spent</p>
                              <p className="font-semibold text-zinc-300">{formatCurrency(candidate.totalSpent)}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Actions row for this specific duplicate group */}
                  <div className="flex flex-wrap items-center justify-end gap-3 border-t border-zinc-900 pt-4 mt-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setIgnoredPrimaryIds(prev => {
                          const next = new Set(prev);
                          next.add(group.primary._id);
                          return next;
                        });
                        toast.info(`Duplicate alert ignored for "${group.primary.name}".`);
                      }}
                      className="text-zinc-450 hover:text-zinc-300 text-xs rounded-xl hover:bg-zinc-900 px-4"
                    >
                      Not a duplicate, ignore
                    </Button>
                    <Button
                      size="sm"
                      disabled={mergeMutation.isPending}
                      onClick={() => mergeMutation.mutate({
                        primaryId: group.primary._id,
                        duplicateIds: group.candidates.map(c => c._id)
                      })}
                      className="bg-white text-black font-semibold text-xs rounded-xl hover:bg-zinc-200 px-4 flex items-center gap-1.5"
                    >
                      {mergeMutation.isPending ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Check className="h-3 w-3 stroke-3" />
                      )}
                      Merge Profiles
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>

          <DialogFooter className="border-t border-zinc-900 pt-4 mt-2">
            <Button
              onClick={() => setIsDuplicateModalOpen(false)}
              className="bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 text-xs font-semibold rounded-xl px-5 h-10 w-full sm:w-auto"
            >
              Close Panel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
