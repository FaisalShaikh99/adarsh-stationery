"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axiosClient from "@/lib/axios";
import { toast } from "sonner";
import { Plus, Search, RefreshCw } from "lucide-react";
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

  // 3. Categories Fetch
  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
  });

  // 4. Fetch all active brands once (filtering will be done client-side to prevent screen-jerking and input focus loss)
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
      queryClient.invalidateQueries({ queryKey: ["brands"] }); // Real-time tables refresh!
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
    // 1. Filter by category if one is selected
    const matchesCategory =
      categoryFilter === "all" ||
      b.categories?.some((c) => (c._id || c) === categoryFilter);

    // 2. Filter by selected brands if any are checked
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
      <div className="fixed inset-0 bg-[#09090b] z-50 flex items-center justify-center">
        <LoadingSpinner size={240} label="Loading brands catalog..." />
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-[#09090b] text-white p-6 space-y-6 font-sans">
      
      {/* 1. TOP NAVBAR ELEMENT CONTROLS */}
      <div className="flex justify-between items-center border-b border-zinc-800 pb-5">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold tracking-tight">Brand & Manufacturer Profiles</h1>
          <span className="text-xs bg-zinc-800 text-zinc-400 px-3 py-1 rounded-lg border border-zinc-700 font-medium">Registry Node</span>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            onClick={() => { setEditingBrand(null); setIsModalOpen(true); }} 
            className="bg-white text-black font-semibold hover:bg-zinc-200 rounded-xl px-4 h-9 text-xs shadow-md"
          >
            <Plus className="w-4 h-4 mr-1 stroke-3"/> Add New Brand
          </Button>
        </div>
      </div>

      {/* 2. STATS CARDS ROW */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[#0c0c0e] border border-zinc-800/80 p-5 rounded-2xl shadow-sm flex flex-col justify-between min-h-[105px]">
          <div>
            <p className="text-xs text-zinc-500 uppercase tracking-wider font-bold">Total Brands</p>
            <p className="text-2xl font-bold mt-2 font-mono tracking-tight text-white">{String(totalBrands).padStart(2, "0")}</p>
          </div>
          <span className="text-[10px] text-zinc-550 mt-1.5 block italic">Registered manufacturer profiles</span>
        </div>
        <div className="bg-[#0c0c0e] border border-zinc-800/80 p-5 rounded-2xl shadow-sm flex flex-col justify-between min-h-[105px]">
          <div>
            <p className="text-xs text-zinc-500 uppercase tracking-wider font-bold">Total Products</p>
            <p className="text-2xl font-bold mt-2 font-mono tracking-tight text-white">{String(totalProducts).padStart(2, "0")}</p>
          </div>
          <span className="text-[10px] text-zinc-550 mt-1.5 block italic">Active catalog items linked</span>
        </div>
        <div className="bg-[#0c0c0e] border border-zinc-800/80 p-5 rounded-2xl shadow-sm flex flex-col justify-between min-h-[105px]">
          <div>
            <p className="text-xs text-zinc-500 uppercase tracking-wider font-bold">Total Categories</p>
            <p className="text-2xl font-bold mt-2 font-mono tracking-tight text-white">{String(totalCategories).padStart(2, "0")}</p>
          </div>
          <span className="text-[10px] text-zinc-550 mt-1.5 block italic">Operative category mappings</span>
        </div>
        <div className="bg-[#0c0c0e] border border-zinc-800/80 p-5 rounded-2xl shadow-sm flex flex-col justify-between min-h-[105px]">
          <div>
            <p className="text-xs text-zinc-500 uppercase tracking-wider font-bold">Avg. Products / Brand</p>
            <p className="text-2xl font-bold mt-2 font-mono tracking-tight text-white">{avgProducts}</p>
          </div>
          <span className="text-[10px] text-zinc-555 text-zinc-500 mt-1.5 block italic">Density per brand registry</span>
        </div>
      </div>

      {/* 🔍 3. SEARCH ARCHITECTURE & FILTER BAR */}
      <div className="bg-[#0c0c0e] border border-zinc-800 rounded-2xl p-6 space-y-4 shadow-xl">
        
        {/* Controls Row */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full">
            <div className="flex items-center w-full bg-[#141416] border border-zinc-700 rounded-xl px-3.5 transition-all gap-2 h-10 focus-within:border-zinc-500 focus-within:ring-1 focus-within:ring-zinc-500">
              <Search className="h-4 w-4 text-zinc-500 shrink-0" />
              <Input 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className="flex-1 bg-transparent border-none text-zinc-300 placeholder-zinc-500 focus-visible:ring-0 focus-visible:ring-offset-0 focus:outline-none focus:ring-0 text-xs h-full p-0 shadow-none"
              />
              <VoiceSearchButton 
                onResult={(text) => setSearchQuery(text)} 
                className="shrink-0 h-8 w-8"
              />
            </div>
            <Button onClick={handleRefreshAll} variant="outline" className="h-10 w-10 p-0 border-zinc-700 bg-[#141416] shrink-0 rounded-xl hover:bg-zinc-850"><RefreshCw className="w-4 h-4" /></Button>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {/* 🏢 Brand/Company Dropdown Selector */}
            <div className="relative shrink-0 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setIsBrandDropdownOpen(!isBrandDropdownOpen)}
                className="bg-[#141416] border border-zinc-700 rounded-xl h-10 px-4 text-xs font-semibold text-zinc-300 hover:text-white hover:border-zinc-550 transition-all flex items-center justify-between gap-2 cursor-pointer w-full sm:min-w-[170px]"
              >
                <span className="truncate">
                  {selectedBrands.length === 0 
                    ? "All Brands/Companies" 
                    : selectedBrands.length === 1 
                      ? allBrands.find(b => b._id === selectedBrands[0])?.name || "1 Selected"
                      : `${selectedBrands.length} Selected`
                  }
                </span>
                <span className="text-[9px] text-zinc-500">▼</span>
              </button>

              {isBrandDropdownOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setIsBrandDropdownOpen(false)} 
                  />
                  <div className="absolute right-0 top-11.5 w-64 bg-zinc-950 border border-zinc-800 rounded-2xl p-3 shadow-2xl z-50 space-y-2 mt-1">
                    <Input 
                      value={brandSearchText}
                      onChange={(e) => setBrandSearchText(e.target.value)}
                      placeholder="Search company name..."
                      className="h-8 bg-zinc-900 border-zinc-808 border-zinc-800 text-xs rounded-lg placeholder-zinc-650"
                    />
                    
                    <div className="max-h-48 overflow-y-auto space-y-1 custom-scrollbar py-1">
                      {selectedBrands.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setSelectedBrands([])}
                          className="w-full text-left text-[10px] text-rose-450 hover:underline px-2 py-0.5"
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
                              className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-zinc-900 cursor-pointer text-xs text-zinc-350 hover:text-white transition-colors select-none"
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
                                className="rounded border-zinc-800 bg-zinc-900 text-blue-600 focus:ring-0 focus:ring-offset-0 w-3.5 h-3.5"
                              />
                              <span className="truncate capitalize">{brand.name}</span>
                            </label>
                          );
                        })
                      }

                      {allBrands.filter(b => b.name.toLowerCase().includes(brandSearchText.toLowerCase())).length === 0 && (
                        <p className="text-[11px] text-zinc-550 text-center py-2">No brands found.</p>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* View Mode Toggle Switcher */}
            <div className="flex items-center gap-1 bg-[#141416] border border-zinc-800 p-1 rounded-xl shrink-0 w-full sm:w-auto justify-center">
              <button
                type="button"
                onClick={() => setViewMode("table")}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === "table" ? "bg-zinc-800 text-white" : "text-zinc-550 text-zinc-500 hover:text-zinc-300"}`}
              >
                Table
              </button>
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === "grid" ? "bg-zinc-800 text-white" : "text-zinc-550 text-zinc-500 hover:text-zinc-300"}`}
              >
                Grid
              </button>
            </div>
          </div>
        </div>

        {/* ✨ Smart Did You Mean Ribbon Suggestion Box */}
        {spellingSuggestion && (
          <div className="text-xs text-zinc-400 bg-blue-500/10 border border-blue-500/20 px-3 py-1.5 rounded-lg w-fit mx-auto">
            Did you mean:{" "}
            <button
              type="button"
              onClick={() => setSearchQuery(spellingSuggestion)}
              className="text-blue-400 font-semibold hover:underline capitalize"
            >
              {spellingSuggestion}
            </button>
            {" "}?
          </div>
        )}

        {/* 🏷️ Horizontal Category-wise filter scrollbar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2.5 scrollbar-none border-b border-zinc-800/80">
          <button
            type="button"
            onClick={() => setCategoryFilter("all")}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all border ${categoryFilter === "all" ? "bg-white text-black border-white shadow-md scale-[1.02]" : "bg-zinc-900/50 text-zinc-400 border-zinc-850 hover:text-zinc-200"}`}
          >
            All Categories ({allBrands.length})
          </button>
          {categories.map((cat) => {
            const count = allBrands.filter(b => b.categories?.some(c => (c._id || c) === cat._id)).length;
            return (
              <button
                key={cat._id}
                type="button"
                onClick={() => setCategoryFilter(cat._id)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all border ${categoryFilter === cat._id ? "bg-white text-black border-white shadow-md scale-[1.02]" : "bg-zinc-900/50 text-zinc-400 border-zinc-855 border-zinc-850 hover:text-zinc-200"}`}
              >
                <span className="capitalize">{cat.name}</span> ({count})
              </button>
            );
          })}
        </div>

        {/* 📊 BRAND DISPLAY PORTAL */}
        {viewMode === "table" ? (
          <BrandTable 
            brands={filteredBrands} 
            isLoading={brandsLoading || allBrandsLoading} 
            onEdit={handleEdit}
            onDelete={handleDeleteTrigger}
            onAddClick={() => { setEditingBrand(null); setIsModalOpen(true); }}
          />
        ) : (
          <BrandGrid 
            brands={filteredBrands} 
            isLoading={brandsLoading || allBrandsLoading} 
            onEdit={handleEdit}
            onDelete={handleDeleteTrigger}
            onAddClick={() => { setEditingBrand(null); setIsModalOpen(true); }}
          />
        )}
      </div>

      {/* 🪄 AI POWERED FORM MODAL COMPONENT */}
      <BrandFormModal 
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingBrand(null); }}
        editingBrand={editingBrand}
        categories={categories}
      />

      {/* 🛡️ SAFEGUARD DELETION REJECTION SHIELD */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-zinc-900 border border-zinc-800 text-white rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Retire Brand Profile Registry?</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              Are you absolutely sure you want to drop this brand profile flag? Safeguard scripts will automatically block this sequence if active structural items under inventory matrices depend on this brand pointer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-zinc-800 text-zinc-300 rounded-xl border-zinc-700">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => deleteBrand(pendingDeleteId)} 
              className="bg-rose-600 hover:bg-rose-700 font-bold rounded-xl"
            >
              Destroy Profile Node
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}