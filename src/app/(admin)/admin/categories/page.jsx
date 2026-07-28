"use client";

import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import { 
  Loader2, Trash2, Edit2, Sparkles, UploadCloud, Search, FolderTree, Plus, 
  Package, Layers, BarChart3, CheckCircle2, ArrowUpRight, Tag, Activity
} from "lucide-react";
import IconLibraryPicker from "@/components/admin/IconLibraryPicker";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

// Shadcn UI Components
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { Suspense } from "react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

function CategoryManagementContent() {
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const fileInputRef = useRef(null);

  // States
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all"); // 'all', 'active', 'disabled'
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState(null);
  
  const [uploadMode, setUploadMode] = useState("manual");
  const [editingCategory, setEditingCategory] = useState(null); // null = add mode, object = edit mode
  const [selectedInspectCategory, setSelectedInspectCategory] = useState(null); // For detail preview modal

  useEffect(() => {
    if (searchParams.get("action") === "new") {
      setEditingCategory(null);
      setIsModalOpen(true);
    }
  }, [searchParams]);

  // React Hook Form
  const { register, handleSubmit: handleFormSubmit, reset, setValue, watch, formState: { errors } } = useForm({
    resolver: zodResolver(categoryCreateSchema),
    mode: "onBlur",
    values: editingCategory ? {
      name: editingCategory.name || "",
      imageUrl: editingCategory.image || ""
    } : {
      name: "",
      imageUrl: ""
    }
  });

  const selectedImage = watch("imageUrl");

  // React Query Fetch categories
  const { 
    data: categoriesData, 
    isLoading: categoriesLoading, 
  } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const res = await axios.get("/api/admin/categories");
      return res.data?.data || [];
    },
    refetchOnMount: true
  });

  const categories = categoriesData || [];

  // Toggle status mutation
  const statusToggleMutation = useMutation({
    mutationFn: async (id) => {
      const res = await axios.patch(`/api/admin/categories?id=${id}`);
      return res.data;
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["categories"] });
      const previousCategories = queryClient.getQueryData(["categories"]);

      queryClient.setQueryData(["categories"], (old) => {
        if (!old) return old;
        const currentData = Array.isArray(old) ? old : (old.data || []);
        
        const toggled = currentData.map((c) => {
          if (c._id === id) {
            return { ...c, isActive: c.isActive === false };
          }
          return c;
        });

        if (Array.isArray(old)) return toggled;
        return { ...old, data: toggled };
      });

      return { previousCategories };
    },
    onError: (err, id, context) => {
      if (context?.previousCategories) {
        queryClient.setQueryData(["categories"], context.previousCategories);
      }
      toast.error(err.response?.data?.message || "Operation failed.");
    },
    onSuccess: (data) => {
      toast.success(data.message);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    }
  });

  const handleStatusToggle = (id) => {
    statusToggleMutation.mutate(id);
  };

  // Delete category mutation
  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const res = await axios.delete(`/api/admin/categories?id=${id}`);
      return res.data;
    },
    onSuccess: (data) => {
      toast.success(data.message);
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Deletion sequence rejected.");
    }
  });

  const triggerDeleteCheck = (id) => {
    setPendingDeleteId(id);
    setDeleteDialogOpen(true);
  };

  const executeDeleteNode = () => {
    if (!pendingDeleteId) return;
    setDeleteDialogOpen(false);
    deleteMutation.mutate(pendingDeleteId, {
      onSettled: () => {
        setPendingDeleteId(null);
      }
    });
  };

  // Form Submit Mutation
  const categoryFormMutation = useMutation({
    mutationFn: async (data) => {
      const targetUrl = editingCategory 
        ? `/api/admin/categories?id=${editingCategory._id}` 
        : "/api/admin/categories";
      const method = editingCategory ? "PUT" : "POST";
      
      const response = await axios({
        url: targetUrl,
        method,
        data: {
          name: data.name,
          imageUrl: data.imageUrl
        }
      });
      return response.data;
    },
    onSuccess: (data) => {
      toast.success(data.message);
      closeAndResetModal();
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Database validation failed.");
    }
  });

  const onSubmit = (data) => {
    categoryFormMutation.mutate(data);
  };

  const openCreateModal = () => {
    setEditingCategory(null);
    setUploadMode("manual");
    reset({
      name: "",
      imageUrl: ""
    });
    setIsModalOpen(true);
  };

  const openEditModal = (cat) => {
    setEditingCategory(cat);
    setUploadMode("manual");
    reset({
      name: cat.name,
      imageUrl: cat.image
    });
    setIsModalOpen(true);
  };

  const closeAndResetModal = () => {
    setIsModalOpen(false);
    setEditingCategory(null);
    setUploadMode("manual");
    reset({
      name: "",
      imageUrl: ""
    });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast.error("Please select a valid image file.");
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        setValue("imageUrl", reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const { results: fuzzyCategories, suggestion: spellingSuggestion } = useFuzzySearch(
    categories,
    searchQuery,
    "name"
  );

  // Filter based on status chips
  const filteredCategories = fuzzyCategories.filter(cat => {
    if (activeFilter === "active") return cat.isActive !== false;
    if (activeFilter === "disabled") return cat.isActive === false;
    return true;
  });

  // Calculate Metrics
  const totalCategoryCount = categories.length;
  const activeCount = categories.filter(c => c.isActive !== false).length;
  const disabledCount = totalCategoryCount - activeCount;
  const totalProductsAssigned = categories.reduce((sum, c) => sum + (c.totalProducts || 0), 0);
  const maxProductsInCategory = Math.max(...categories.map(c => c.totalProducts || 0), 1);

  if (categoriesLoading) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <LoadingSpinner size={240} label="Loading category taxonomy matrix..." />
      </div>
    );
  }

  return (
    <div className="w-full max-w-full min-h-screen text-gray-900 p-2 sm:p-4 space-y-6 font-sans overflow-x-hidden">
      
      {/* 1. TOP HEADER RIBBON */}
      <div className="flex flex-wrap gap-4 justify-between items-center border-b border-border-subtle pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-primary-600 text-white shadow-md ring-4 ring-primary-100">
              <FolderTree className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-gray-900">Category Flow Matrix</h1>
              <p className="text-xs sm:text-sm text-zinc-600 font-medium">
                Visual taxonomy ecosystem ({String(totalCategoryCount).padStart(2, "0")} active categories)
              </p>
            </div>
          </div>
        </div>

        <Button
          onClick={openCreateModal}
          className="bg-primary-600 hover:bg-primary-700 text-white font-black rounded-2xl px-5 h-11 text-xs sm:text-sm shadow-md cursor-pointer btn-modern shrink-0 flex items-center gap-2"
        >
          <Plus className="w-4.5 h-4.5" /> Add Category
        </Button>
      </div>

      {/* 2. STATS KPI MESH GRID */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        {/* KPI 1: Purple Gradient Base (#9B66D4 -> #D8A5E9) */}
        <div className="rounded-2xl sm:rounded-[24px] bg-gradient-to-br from-[#9B66D4] via-[#B885E2] to-[#D8A5E9] p-3.5 sm:p-5 text-white shadow-md relative overflow-hidden flex flex-col justify-between group">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-purple-100 truncate">Total Categories</span>
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-white shadow-xs shrink-0">
              <Layers className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
          <div className="mt-2.5 sm:mt-4">
            <h3 className="text-xl sm:text-3xl font-black font-mono tracking-tight text-white">{String(totalCategoryCount).padStart(2, '0')}</h3>
            <p className="text-[10px] sm:text-xs text-purple-100 font-medium mt-0.5 sm:mt-1 truncate">Taxonomy Nodes Active</p>
          </div>
        </div>

        {/* KPI 2: Active Store Catalogs */}
        <div className="rounded-2xl sm:rounded-[24px] bg-bg-surface border border-border-subtle p-3.5 sm:p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-zinc-500 truncate">Live Status</span>
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shadow-2xs shrink-0">
              <CheckCircle2 className="w-4 h-4 sm:w-5 sm:w-5" />
            </div>
          </div>
          <div className="mt-2.5 sm:mt-4">
            <h3 className="text-xl sm:text-3xl font-black font-mono tracking-tight text-gray-900">{String(activeCount).padStart(2, '0')}</h3>
            <p className="text-[10px] sm:text-xs text-emerald-600 font-bold mt-0.5 sm:mt-1 truncate">
              {totalCategoryCount > 0 ? Math.round((activeCount / totalCategoryCount) * 100) : 0}% Active Coverage
            </p>
          </div>
        </div>

        {/* KPI 3: Total Products Assigned */}
        <div className="rounded-2xl sm:rounded-[24px] bg-bg-surface border border-border-subtle p-3.5 sm:p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-zinc-500 truncate">Total Products</span>
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-primary-50 border border-primary-200 flex items-center justify-center text-primary-600 shadow-2xs shrink-0">
              <Package className="w-4 h-4 sm:w-5 sm:w-5" />
            </div>
          </div>
          <div className="mt-2.5 sm:mt-4">
            <h3 className="text-xl sm:text-3xl font-black font-mono tracking-tight text-gray-900">{totalProductsAssigned}</h3>
            <p className="text-[10px] sm:text-xs text-primary-700 font-bold mt-0.5 sm:mt-1 truncate">Catalog items linked</p>
          </div>
        </div>

        {/* KPI 4: Catalog Density */}
        <div className="rounded-2xl sm:rounded-[24px] bg-bg-surface border border-border-subtle p-3.5 sm:p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-zinc-500 truncate">Avg Density</span>
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shadow-2xs shrink-0">
              <BarChart3 className="w-4 h-4 sm:w-5 sm:w-5" />
            </div>
          </div>
          <div className="mt-2.5 sm:mt-4">
            <h3 className="text-xl sm:text-3xl font-black font-mono tracking-tight text-gray-900">
              {totalCategoryCount > 0 ? (totalProductsAssigned / totalCategoryCount).toFixed(1) : 0}
            </h3>
            <p className="text-[10px] sm:text-xs text-amber-600 font-bold mt-0.5 sm:mt-1 truncate">SKUs per category</p>
          </div>
        </div>
      </div>

      {/* 3. SEARCH & CONTROL CHIPS BAR */}
      <div className="bg-bg-surface border border-border-subtle rounded-[26px] p-4 space-y-4 shadow-xs">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Search Box */}
          <div className="flex items-center w-full md:max-w-md bg-white border border-border-subtle rounded-2xl px-4 transition-all gap-2.5 h-11 focus-within:border-primary-400 focus-within:ring-1 focus-within:ring-primary-400 shadow-2xs">
            <Search className="h-4 w-4 text-zinc-400 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search category taxonomy..."
              className="flex-1 bg-transparent border-none text-xs font-bold text-gray-900 placeholder-zinc-400 focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 h-full py-0 shadow-none"
            />
            <VoiceSearchButton 
              onResult={(text) => setSearchQuery(text)} 
              className="shrink-0 h-7 w-7 text-primary-600"
            />
          </div>

          {/* Filter Status Chips */}
          <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
            <button
              onClick={() => setActiveFilter("all")}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer shrink-0 border ${
                activeFilter === "all"
                  ? "bg-primary-600 text-white border-primary-600 shadow-xs"
                  : "bg-white text-zinc-600 border-border-subtle hover:border-primary-300"
              }`}
            >
              All Categories ({totalCategoryCount})
            </button>
            <button
              onClick={() => setActiveFilter("active")}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer shrink-0 border ${
                activeFilter === "active"
                  ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                  : "bg-white text-zinc-600 border-border-subtle hover:border-emerald-300"
              }`}
            >
              Active ({activeCount})
            </button>
            <button
              onClick={() => setActiveFilter("disabled")}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer shrink-0 border ${
                activeFilter === "disabled"
                  ? "bg-rose-600 text-white border-rose-600 shadow-xs"
                  : "bg-white text-zinc-600 border-border-subtle hover:border-rose-300"
              }`}
            >
              Disabled ({disabledCount})
            </button>
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

        {/* 4. MODULAR CATEGORY NODE FLOW MATRIX */}
        {filteredCategories.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center p-12 border-2 border-dashed border-border-subtle bg-white rounded-2xl space-y-3 min-h-[220px]">
            <FolderTree className="w-10 h-10 text-zinc-300" />
            <p className="text-sm font-bold text-gray-900">No categories found matching your search.</p>
            <Button
              onClick={openCreateModal}
              className="bg-primary-600 text-white font-black hover:bg-primary-700 rounded-2xl px-5 h-10 text-xs cursor-pointer shadow-md btn-modern"
            >
              + Create Category Node
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pt-2">
            {filteredCategories.map((category) => {
              const productCount = category.totalProducts || 0;
              const fillPercentage = Math.min(Math.round((productCount / maxProductsInCategory) * 100), 100);

              return (
                <div 
                  key={category._id}
                  className={`bg-white border border-border-subtle hover:border-primary-400 rounded-[24px] p-5 transition-all duration-300 relative group flex flex-col justify-between shadow-2xs hover:shadow-md ${
                    !category.isActive ? "opacity-60 bg-zinc-50/80" : ""
                  }`}
                >
                  {/* Top Header: Toggle & Actions */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {((statusToggleMutation.isPending && statusToggleMutation.variables === category._id) || (deleteMutation.isPending && deleteMutation.variables === category._id)) ? (
                        <Loader2 className="h-4 w-4 animate-spin text-primary-600" />
                      ) : (
                        <>
                          <Switch 
                            checked={category.isActive !== false}
                            onCheckedChange={() => handleStatusToggle(category._id)}
                            className="data-[state=checked]:bg-emerald-600 cursor-pointer scale-90"
                          />
                          <span className={`text-[11px] font-black uppercase tracking-wider ${category.isActive !== false ? "text-emerald-600" : "text-zinc-500"}`}>
                            {category.isActive !== false ? "Active" : "Disabled"}
                          </span>
                        </>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-1 opacity-90 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => openEditModal(category)}
                        className="text-zinc-600 hover:text-primary-700 transition-colors p-1.5 hover:bg-primary-50 rounded-xl cursor-pointer"
                        title="Edit Category"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => triggerDeleteCheck(category._id)}
                        className="text-zinc-600 hover:text-rose-600 transition-colors p-1.5 hover:bg-rose-50 rounded-xl cursor-pointer"
                        title="Delete Category"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Main Visual Node Box */}
                  <div 
                    onClick={() => setSelectedInspectCategory(category)}
                    className="flex flex-col items-center text-center space-y-3 py-3 cursor-pointer group/node"
                  >
                    <div className="w-16 h-16 rounded-2xl bg-primary-50/70 border border-primary-100 p-2.5 flex items-center justify-center shadow-xs overflow-hidden shrink-0 group-hover/node:scale-105 transition-transform">
                      {category.image ? (
                        <img 
                          src={category.image} 
                          alt="" 
                          className="w-full h-full object-contain" 
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <Tag className="w-8 h-8 text-primary-600" />
                      )}
                    </div>

                    <div className="space-y-1">
                      <h3 className="font-black text-sm text-gray-900 capitalize tracking-tight group-hover/node:text-primary-700 transition-colors">
                        {category.name}
                      </h3>
                      <p className="text-[11px] text-zinc-500 font-mono font-semibold">
                        Added {new Date(category.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                      </p>
                    </div>
                  </div>

                  {/* Dynamic Product Density Progress Bar */}
                  <div className="mt-3 border-t border-border-subtle pt-3 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] font-mono">
                      <span className="text-zinc-500 font-bold">Catalog Items</span>
                      <span className="font-black text-primary-700">{productCount} pcs</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-primary-50 border border-primary-100 overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-primary-500 to-[#9B66D4] rounded-full transition-all duration-500" 
                        style={{ width: `${fillPercentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 5. ADD / EDIT CATEGORY FORM MODAL (LIGHT SAAS PURPLE THEME) */}
      <Dialog open={isModalOpen} onOpenChange={(val) => !val && closeAndResetModal()}>
        <DialogContent className="w-full max-w-md border border-border-subtle bg-white/95 backdrop-blur-2xl p-0 text-gray-900 rounded-[28px] shadow-2xl overflow-hidden font-sans">
          <DialogHeader className="p-6 border-b border-border-subtle bg-primary-50/80 shrink-0">
            <DialogTitle className="text-xl font-black tracking-tight text-gray-900 flex items-center gap-2.5">
              <Sparkles className="h-5 w-5 text-primary-600" /> 
              {editingCategory ? "Edit Category Profile" : "Create Category Node"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleFormSubmit(onSubmit)} className="p-6 space-y-5">
            {/* Category Name Input */}
            <div className="space-y-2">
              <Label htmlFor="categoryName" className="text-xs text-gray-900 font-black">Category Name</Label>
              <Input
                id="categoryName"
                type="text"
                placeholder="e.g. Premium Notebooks & Journals"
                {...register("name")}
                className="bg-white border border-border-subtle text-gray-900 text-xs font-semibold rounded-2xl h-11 focus-visible:ring-1 focus-visible:ring-primary-400 focus-visible:border-primary-400 w-full shadow-2xs"
              />
              {errors.name && <p className="text-xs text-rose-600 font-bold mt-1">{errors.name.message}</p>}
            </div>

            {/* Icon Preview */}
            {selectedImage && (
              <div className="space-y-2">
                <Label className="text-xs text-gray-900 font-black">Category Icon Preview</Label>
                <div className="flex items-center gap-3 p-3 bg-primary-50/50 border border-primary-100 rounded-2xl shadow-2xs">
                  <img 
                    src={selectedImage} 
                    alt="Selected category preview" 
                    className="w-12 h-12 rounded-xl object-contain bg-white border border-border-subtle p-1 shadow-xs"
                    referrerPolicy="no-referrer"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-primary-800 font-black uppercase tracking-wider font-mono truncate">
                      {selectedImage.includes("api.iconify.design") ? "Library Vector Icon" : selectedImage.startsWith("data:") ? "Local File Upload" : "Saved Icon URL"}
                    </p>
                    <button
                      type="button"
                      onClick={() => setValue("imageUrl", "")}
                      className="text-[11px] text-rose-600 hover:text-rose-700 font-bold underline mt-0.5 block text-left cursor-pointer"
                    >
                      Remove Icon
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Manual File Upload */}
            {uploadMode === "manual" && (
              <div className="space-y-2">
                <Label className="text-xs text-gray-900 font-black">Icon Uploader</Label>
                <input 
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden"
                />
                <div 
                  onClick={() => fileInputRef.current.click()}
                  className="border-2 border-dashed border-border-subtle rounded-2xl p-6 bg-white text-center flex flex-col items-center justify-center gap-2 hover:bg-primary-50/40 hover:border-primary-400 transition-all cursor-pointer min-h-[110px] shadow-2xs"
                >
                  <UploadCloud className="h-6 w-6 text-zinc-400" />
                  <span className="text-xs font-bold text-gray-900">
                    {selectedImage ? "Click to replace icon image" : "Click to upload image file"}
                  </span>
                  <span className="text-[10px] text-zinc-500 font-mono">PNG, SVG, JPG or WebP</span>
                </div>
                
                <div className="pt-1 text-center">
                  <button
                    type="button"
                    onClick={() => setUploadMode("picker")}
                    className="text-xs text-primary-600 hover:text-primary-700 font-bold transition-colors underline cursor-pointer"
                  >
                    Or select from Icon Library
                  </button>
                </div>
              </div>
            )}

            {/* Icon Library Picker */}
            {uploadMode === "picker" && (
              <div className="space-y-2">
                <IconLibraryPicker
                  onSelect={(iconUrl) => {
                    setValue("imageUrl", iconUrl);
                    setUploadMode("manual");
                  }}
                  onClose={() => setUploadMode("manual")}
                />
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-border-subtle">
              <Button
                type="button"
                variant="outline"
                onClick={closeAndResetModal}
                className="rounded-2xl border border-border-subtle bg-white px-5 h-11 text-xs font-bold text-gray-900 hover:bg-primary-50 cursor-pointer shadow-2xs"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={categoryFormMutation.isPending} 
                className="bg-primary-600 hover:bg-primary-700 text-white font-black rounded-2xl h-11 px-6 text-xs shadow-md cursor-pointer btn-modern"
              >
                {categoryFormMutation.isPending ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin inline" /> Saving...</>
                ) : editingCategory ? (
                  "Save changes"
                ) : (
                  "Add Category"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* 6. CATEGORY INSPECT DETAIL MODAL */}
      <Dialog open={!!selectedInspectCategory} onOpenChange={(open) => !open && setSelectedInspectCategory(null)}>
        {selectedInspectCategory && (
          <DialogContent className="w-full max-w-sm border border-border-subtle bg-white/95 backdrop-blur-2xl p-6 text-gray-900 rounded-[28px] shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-primary-50 border border-primary-200 p-2 flex items-center justify-center shrink-0 shadow-xs">
                {selectedInspectCategory.image ? (
                  <img src={selectedInspectCategory.image} alt="" className="w-full h-full object-contain" />
                ) : (
                  <Tag className="w-6 h-6 text-primary-600" />
                )}
              </div>
              <div>
                <h3 className="font-black text-lg text-gray-900 capitalize">{selectedInspectCategory.name}</h3>
                <span className={`text-xs font-black uppercase ${selectedInspectCategory.isActive !== false ? "text-emerald-600" : "text-zinc-500"}`}>
                  {selectedInspectCategory.isActive !== false ? "Active Store Category" : "Disabled Category"}
                </span>
              </div>
            </div>

            <div className="bg-bg-surface border border-border-subtle p-3.5 rounded-2xl space-y-2 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-zinc-500">Products Count:</span>
                <span className="font-black text-primary-700">{selectedInspectCategory.totalProducts || 0} items</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Created Date:</span>
                <span className="font-bold text-gray-900">{new Date(selectedInspectCategory.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <Button
                onClick={() => {
                  const cat = selectedInspectCategory;
                  setSelectedInspectCategory(null);
                  openEditModal(cat);
                }}
                className="flex-1 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-2xl h-10 text-xs cursor-pointer shadow-xs btn-modern"
              >
                <Edit2 className="w-3.5 h-3.5 mr-1" /> Edit Category
              </Button>
            </div>
          </DialogContent>
        )}
      </Dialog>

      {/* 7. DELETE CONFIRMATION DIALOG */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-white border border-border-subtle text-gray-900 rounded-[28px] p-6 shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-black text-gray-900">Confirm Category Deletion</AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-zinc-600 font-medium">
              Are you sure you want to delete this category? If there are active stationery products assigned to this category, deletion will be blocked by system safety rules.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4 gap-2">
            <AlertDialogCancel className="bg-white text-gray-900 border border-border-subtle hover:bg-primary-50 rounded-2xl text-xs font-bold px-4 h-10 cursor-pointer shadow-2xs">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={executeDeleteNode} 
              className="rounded-2xl bg-rose-600 hover:bg-rose-700 font-black text-white text-xs px-5 h-10 cursor-pointer shadow-xs"
            >
              Delete Category
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}

export default function CategoryManagementPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <CategoryManagementContent />
    </Suspense>
  );
}