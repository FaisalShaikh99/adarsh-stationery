"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axiosClient from "@/lib/axios";
import { toast } from "sonner";
import { Plus, Search, RefreshCw, Tag, Building2, Package, Layers, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import BrandTable from "./BrandTable"; 
import BrandGrid from "./BrandGrid";
import BrandFormModal from "./BrandFormModal";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import useFuzzySearch from "@/hooks/useFuzzySearch";
import VoiceSearchButton from "@/components/ui/voice-search-button";

// Categories fetch helper
const fetchCategories = async () => {
  const response = await axiosClient.get("/api/admin/categories");
  return response.data || [];
};

export default function BrandManagementPage() {
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  // 1. Filter & View States
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [selectedBrands, setSelectedBrands] = useState([]);
  const [brandSearchText, setBrandSearchText] = useState("");
  const [isBrandDropdownOpen, setIsBrandDropdownOpen] = useState(false);
  const [viewMode, setViewMode] = useState("table");

  // 2. Modal & Delete Dialog States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState(null);

  useEffect(() => {
    if (searchParams.get("action") === "new") {
      setEditingBrand(null);
      setIsModalOpen(true);
    }
  }, [searchParams]);

  // 3. Categories Fetch
  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
  });

  // 4. Fetch all active brands once
  const { data: brands = [], isLoading: brandsLoading } = useQuery({
    queryKey: ["brands"],
    queryFn: async () => {
      const response = await axiosClient.get("/api/admin/brands");
      return response.data || [];
    },
    refetchOnMount: true,
  });

  const allBrands = brands;
  const allBrandsLoading = brandsLoading;

  // 6. Delete Mutation
  const { mutate: deleteBrand } = useMutation({
    mutationFn: async (id) => {
      return axiosClient.delete(`/api/admin/brands?id=${id}`);
    },
    onSuccess: (res) => {
      toast.success(res.message || "Brand profile retired safely.");
      queryClient.invalidateQueries({ queryKey: ["brands"] });
      setDeleteDialogOpen(false);
      setPendingDeleteId(null);
    },
    onError: (err) => {
      toast.error(err.message || "Deletion request rejected by safeguard script.");
    }
  });

  const handleEdit = (brand) => {
    setEditingBrand(brand);
    setIsModalOpen(true);
  };

  const handleDeleteTrigger = (id) => {
    setPendingDeleteId(id);
    setDeleteDialogOpen(true);
  };

  const handleRefreshAll = () => {
    queryClient.invalidateQueries({ queryKey: ["brands"] });
    toast.success("Sync complete! Brand registries updated.");
  };

  const { results: fuzzyMatchedBrands, suggestion: spellingSuggestion } = useFuzzySearch(
    brands,
    searchQuery,
    "name"
  );

  // Client-side category and brand filtering on fuzzy-matched results
  const filteredBrands = fuzzyMatchedBrands.filter((b) => {
    const matchesCategory =
      categoryFilter === "all" ||
      b.categories?.some((c) => (c._id || c) === categoryFilter);

    const matchesBrand =
      selectedBrands.length === 0 ||
      selectedBrands.includes(b._id);

    return matchesCategory && matchesBrand;
  });

  // Stats Calculations
  const totalBrands = allBrands.length;
  const totalProducts = allBrands.reduce((sum, b) => sum + (b.productCount || 0), 0);
  const totalCategories = categories.length;
  const avgProducts = totalBrands > 0 ? (totalProducts / totalBrands).toFixed(1) : 0;

  if (brandsLoading || categoriesLoading || allBrandsLoading) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <LoadingSpinner size={240} label="Loading brands catalog..." />
      </div>
    );
  }

  return (
    <div className="w-full max-w-full min-h-screen text-gray-900 p-2 sm:p-4 space-y-6 font-sans overflow-x-hidden">
      
      {/* 1. PAGE HEADER */}
      <div className="flex flex-wrap gap-4 justify-between items-center border-b border-border-subtle pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-primary-600 text-white shadow-md ring-4 ring-primary-100">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-gray-900">Brands & Manufacturers</h1>
              <p className="text-xs sm:text-sm text-zinc-600 font-medium">
                Stationery brand profiles, manufacturers, and catalog links ({String(totalBrands).padStart(2, "0")} active profiles)
              </p>
            </div>
          </div>
        </div>

        <Button 
          onClick={() => { setEditingBrand(null); setIsModalOpen(true); }} 
          className="bg-primary-600 hover:bg-primary-700 text-white font-black rounded-2xl px-5 h-11 text-xs sm:text-sm shadow-md cursor-pointer btn-modern shrink-0 flex items-center gap-2"
        >
          <Plus className="w-4.5 h-4.5" /> Add New Brand
        </Button>
      </div>

      {/* 2. STATS CARDS ROW (PURPLE GRADIENT & ENHANCED TYPOGRAPHY) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Base Purple Gradient (#9B66D4 -> #D8A5E9) */}
        <div className="rounded-[24px] bg-gradient-to-br from-[#9B66D4] via-[#B885E2] to-[#D8A5E9] p-5 text-white shadow-md flex flex-col justify-between group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-purple-100">Total Brands</span>
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-white shadow-xs">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl sm:text-4xl font-black font-mono tracking-tight text-white">{String(totalBrands).padStart(2, "0")}</h3>
            <p className="text-xs text-purple-100 font-bold mt-1">Registered manufacturer profiles</p>
          </div>
        </div>

        {/* KPI 2: Total Products */}
        <div className="rounded-[24px] bg-bg-surface border border-border-subtle p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-zinc-500">Total Products</span>
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shadow-2xs">
              <Package className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-black font-mono tracking-tight text-gray-900">{String(totalProducts).padStart(2, "0")}</h3>
            <p className="text-xs text-emerald-600 font-bold mt-1">Active catalog items linked</p>
          </div>
        </div>

        {/* KPI 3: Total Categories */}
        <div className="rounded-[24px] bg-bg-surface border border-border-subtle p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-zinc-500">Total Categories</span>
            <div className="w-10 h-10 rounded-2xl bg-primary-50 border border-primary-200 flex items-center justify-center text-primary-600 shadow-2xs">
              <Layers className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-black font-mono tracking-tight text-gray-900">{String(totalCategories).padStart(2, "0")}</h3>
            <p className="text-xs text-primary-700 font-bold mt-1">Operative category mappings</p>
          </div>
        </div>

        {/* KPI 4: Avg. Products / Brand */}
        <div className="rounded-[24px] bg-bg-surface border border-border-subtle p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-zinc-500">Avg Products</span>
            <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shadow-2xs">
              <BarChart3 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-black font-mono tracking-tight text-gray-900">{avgProducts}</h3>
            <p className="text-xs text-amber-700 font-bold mt-1">Density per brand registry</p>
          </div>
        </div>
      </div>

      {/* 3. SEARCH ARCHITECTURE & FILTER BAR */}
      <div className="bg-bg-surface border border-border-subtle rounded-[26px] p-4 sm:p-6 space-y-4 shadow-xs">
        
        {/* Controls Row */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full">
            <div className="flex items-center w-full bg-white border border-border-subtle rounded-2xl px-4 transition-all gap-2.5 h-11 focus-within:border-primary-400 focus-within:ring-1 focus-within:ring-primary-400 shadow-2xs">
              <Search className="h-4 w-4 text-zinc-400 shrink-0" />
              <Input 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search brand profiles..."
                className="flex-1 bg-transparent border-none text-xs font-bold text-gray-900 placeholder-zinc-400 focus-visible:ring-0 focus-visible:ring-offset-0 focus:outline-none focus:ring-0 text-xs h-full p-0 shadow-none"
              />
              <VoiceSearchButton 
                onResult={(text) => setSearchQuery(text)} 
                className="shrink-0 h-7 w-7 text-primary-600"
              />
            </div>
            <Button onClick={handleRefreshAll} variant="outline" className="h-11 w-11 p-0 border-border-subtle bg-white shrink-0 rounded-2xl hover:bg-primary-50 btn-modern shadow-2xs"><RefreshCw className="w-4 h-4 text-primary-600" /></Button>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {/* Brand Dropdown Selector */}
            <div className="relative shrink-0 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setIsBrandDropdownOpen(!isBrandDropdownOpen)}
                className="bg-white border border-border-subtle rounded-2xl h-11 px-4 text-xs font-bold text-gray-900 hover:border-primary-400 transition-all flex items-center justify-between gap-2 cursor-pointer w-full sm:min-w-[190px] shadow-2xs"
              >
                <span className="truncate">
                  {selectedBrands.length === 0 
                    ? "All Brands/Companies" 
                    : selectedBrands.length === 1 
                      ? allBrands.find(b => b._id === selectedBrands[0])?.name || "1 Selected"
                      : `${selectedBrands.length} Selected`
                  }
                </span>
                <span className="text-[10px] text-zinc-400">▼</span>
              </button>

              {isBrandDropdownOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setIsBrandDropdownOpen(false)} 
                  />
                  <div className="absolute right-0 top-12 w-64 bg-white/95 backdrop-blur-2xl border border-border-subtle rounded-2xl p-3 shadow-xl z-50 space-y-2 mt-1 text-gray-900">
                    <Input 
                      value={brandSearchText}
                      onChange={(e) => setBrandSearchText(e.target.value)}
                      placeholder="Search company..."
                      className="h-9 bg-white border border-border-subtle text-xs font-medium text-gray-900 rounded-xl placeholder-zinc-400 focus-visible:ring-1 focus-visible:ring-primary-400"
                    />
                    
                    <div className="max-h-48 overflow-y-auto space-y-1 custom-scrollbar py-1">
                      {selectedBrands.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setSelectedBrands([])}
                          className="w-full text-left text-[11px] text-rose-600 hover:underline px-2 py-1 font-bold"
                        >
                          Clear Selection
                        </button>
                      )}

                      {allBrands
                        .filter(b => b.name.toLowerCase().includes(brandSearchText.toLowerCase()))
                        .map((brand) => {
                          const isChecked = selectedBrands.includes(brand._id);
                          return (
                            <label 
                              key={brand._id}
                              className="flex items-center gap-2 px-2.5 py-2 rounded-xl hover:bg-primary-50 cursor-pointer text-xs text-gray-900 font-bold transition-colors select-none"
                            >
                              <input 
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => {
                                  if (isChecked) {
                                    setSelectedBrands(prev => prev.filter(id => id !== brand._id));
                                  } else {
                                    setSelectedBrands(prev => [...prev, brand._id]);
                                  }
                                }}
                                className="rounded border-border-subtle text-primary-600 focus:ring-0 focus:ring-offset-0 w-3.5 h-3.5 cursor-pointer"
                              />
                              <span className="truncate capitalize">{brand.name}</span>
                            </label>
                          );
                        })
                      }
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 bg-white border border-border-subtle p-1 rounded-2xl shrink-0 justify-center shadow-2xs">
              <button
                type="button"
                onClick={() => setViewMode("table")}
                className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  viewMode === "table" 
                    ? "bg-primary-600 text-white shadow-xs" 
                    : "text-zinc-600 hover:text-gray-900 hover:bg-primary-50"
                }`}
              >
                Table
              </button>
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  viewMode === "grid" 
                    ? "bg-primary-600 text-white shadow-xs" 
                    : "text-zinc-600 hover:text-gray-900 hover:bg-primary-50"
                }`}
              >
                Grid
              </button>
            </div>
          </div>
        </div>

        {/* 🏷️ CATEGORY FILTER TABS (HIGH CONTRAST COLORFUL PILLS) */}
        <div className="border-t border-border-subtle pt-3">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            <button
              onClick={() => setCategoryFilter("all")}
              className={`px-4 py-2 rounded-xl text-xs transition-all cursor-pointer shrink-0 border ${
                categoryFilter === "all"
                  ? "bg-primary-600 text-white border-primary-600 font-black shadow-xs"
                  : "bg-white text-gray-900 border-border-subtle hover:bg-primary-50/60 font-bold shadow-2xs"
              }`}
            >
              All Categories ({allBrands.length})
            </button>
            {categories.map((cat) => {
              const count = allBrands.filter(b => b.categories?.some(c => (c._id || c) === cat._id)).length;
              return (
                <button
                  key={cat._id}
                  onClick={() => setCategoryFilter(cat._id)}
                  className={`px-4 py-2 rounded-xl text-xs transition-all cursor-pointer shrink-0 border ${
                    categoryFilter === cat._id
                      ? "bg-primary-600 text-white border-primary-600 font-black shadow-xs"
                      : "bg-white text-gray-900 border-border-subtle hover:bg-primary-50/60 font-bold shadow-2xs"
                  }`}
                >
                  {cat.name} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {/* Smart Fuzzy Suggestion */}
        {spellingSuggestion && (
          <div className="text-xs text-primary-700 bg-primary-50 border border-primary-200 px-3.5 py-2 rounded-xl font-medium flex items-center gap-2">
            <span>Did you mean:</span>
            <button
              type="button"
              onClick={() => setSearchQuery(spellingSuggestion)}
              className="text-primary-800 font-black underline capitalize cursor-pointer hover:text-primary-900"
            >
              {spellingSuggestion}
            </button>
          </div>
        )}

        {/* Main Content Arena */}
        {viewMode === "table" ? (
          <BrandTable 
            brands={filteredBrands} 
            isLoading={allBrandsLoading}
            onEdit={handleEdit}
            onDelete={handleDeleteTrigger}
            onAddClick={() => { setEditingBrand(null); setIsModalOpen(true); }}
          />
        ) : (
          <BrandGrid 
            brands={filteredBrands} 
            isLoading={allBrandsLoading}
            onEdit={handleEdit}
            onDelete={handleDeleteTrigger}
            onAddClick={() => { setEditingBrand(null); setIsModalOpen(true); }}
          />
        )}
      </div>

      {/* 4. ADD / EDIT BRAND FORM MODAL */}
      <BrandFormModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        editingBrand={editingBrand}
        categories={categories}
      />

      {/* 5. DELETE DIALOG */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-white border border-border-subtle text-gray-900 rounded-[28px] p-6 shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-black text-gray-900">Retire Brand Registry Node</AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-zinc-600 font-medium">
              Are you sure you want to delete this brand profile? This action will remove manufacturer metadata and associated link tags across active product catalogs.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4 gap-2">
            <AlertDialogCancel className="bg-white text-gray-900 border border-border-subtle hover:bg-primary-50 rounded-2xl text-xs font-bold px-4 h-10 cursor-pointer shadow-2xs">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => pendingDeleteId && deleteBrand(pendingDeleteId)} 
              className="rounded-2xl bg-rose-600 hover:bg-rose-700 font-black text-white text-xs px-5 h-10 cursor-pointer shadow-xs"
            >
              Retire Profile
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}