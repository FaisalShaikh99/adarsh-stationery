"use client";

import { useState, useRef } from "react";
import { toast } from "sonner";
import { Loader2, Trash2, Edit2, Sparkles, UploadCloud, Search } from "lucide-react";
import IconLibraryPicker from "@/components/admin/IconLibraryPicker";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

// Shadcn UI Components
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { categoryCreateSchema } from "@/schemas/category.schema";
import useFuzzySearch from "@/hooks/useFuzzySearch";
import VoiceSearchButton from "@/components/ui/voice-search-button";

export default function CategoryManagementPage() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef(null);

  // States
  const [searchQuery, setSearchQuery] = useState("");
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState(null);
  
  const [uploadMode, setUploadMode] = useState("manual");

  const [editingCategory, setEditingCategory] = useState(null); // null = add mode, object = edit mode

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
  const categoryName = watch("name");

  // React Query Fetch categories
  const { 
    data: categoriesData, 
    isLoading: categoriesLoading, 
    refetch: refetchCategories 
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

  const { results: filteredCategories, suggestion: spellingSuggestion } = useFuzzySearch(
    categories,
    searchQuery,
    "name"
  );



  if (categoriesLoading) {
    return (
      <div className="fixed inset-0 bg-[#09090b] z-50 flex items-center justify-center">
        <LoadingSpinner size={240} label="Loading categories catalog..." />
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-[#09090b] text-white p-6 space-y-6 font-sans">
      
      {/* Top Header Grid Section */}
      <div className="flex justify-between items-center border-b border-zinc-800 pb-5">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white">Categories</h1>
          <p className="mt-1 text-xs text-zinc-400">
            Organize stationery product categories ({String(categories.length).padStart(2, "0")} active categories).
          </p>
        </div>
        
        <Button
          onClick={openCreateModal}
          className="bg-white text-black font-semibold hover:bg-zinc-200 rounded-xl px-4 py-2 text-sm shadow-md"
        >
          + Add Category
        </Button>
      </div>

      {/* Workspace Area Table Arena */}
      <div className="bg-[#0c0c0e] border border-zinc-800 rounded-2xl p-6 space-y-4 shadow-xl">
        
        {/* Wireframe Input Search Box */}
        <div className="flex flex-col items-center justify-center w-full space-y-2">
          <div className="flex items-center w-full max-w-md bg-[#141416] border border-zinc-700 rounded-xl px-3.5 transition-all gap-2 h-11 focus-within:border-zinc-500 focus-within:ring-1 focus-within:ring-zinc-500">
            <Search className="h-4 w-4 text-zinc-500 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search..."
              className="flex-1 bg-transparent border-none text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 h-full py-0 shadow-none"
            />
            <VoiceSearchButton 
              onResult={(text) => setSearchQuery(text)} 
              className="shrink-0 h-8 w-8"
            />
          </div>

          {/* ✨ Smart Did You Mean Ribbon Suggestion Box */}
          {spellingSuggestion && (
            <div className="text-xs text-zinc-400 bg-blue-500/10 border border-blue-500/20 px-3 py-1.5 rounded-lg">
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
        </div>
        {/* 📊 CATEGORY VISUAL WORKSPACE CARDS */}
        {categoriesLoading ? (
          <div className="flex h-48 items-center justify-center bg-[#0c0c0e]/30 border border-zinc-800 rounded-2xl">
            <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center p-12 border border-dashed border-zinc-800 bg-[#0c0c0e]/30 rounded-2xl space-y-3 min-h-[200px]">
            <p className="text-sm font-semibold text-zinc-400">No categories found matching search criteria.</p>
            <Button
              onClick={openCreateModal}
              className="bg-white text-black font-semibold hover:bg-zinc-200 rounded-xl px-4 h-9 text-xs cursor-pointer shadow-md"
            >
              + Add New Category
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredCategories.map((category) => (
              <div 
                key={category._id}
                className={`bg-zinc-900/40 border border-zinc-800 hover:border-zinc-700 rounded-2xl p-5 transition-all duration-300 relative group flex flex-col justify-between ${
                  !category.isActive ? "opacity-60 bg-zinc-950/20" : ""
                }`}
              >
                {/* Status Switch & Actions */}
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-2">
                    {((statusToggleMutation.isPending && statusToggleMutation.variables === category._id) || (deleteMutation.isPending && deleteMutation.variables === category._id)) ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-500" />
                    ) : (
                      <>
                        <Switch 
                          checked={category.isActive}
                          onCheckedChange={() => handleStatusToggle(category._id)}
                          className="data-[state=checked]:bg-emerald-600 scale-75"
                        />
                        <span className={`text-[9px] font-bold uppercase ${category.isActive ? "text-emerald-400" : "text-zinc-500"}`}>
                          {category.isActive ? "Active" : "Disabled"}
                        </span>
                      </>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => openEditModal(category)}
                      className="text-zinc-400 hover:text-white transition-colors p-1.5 hover:bg-zinc-800 rounded-lg cursor-pointer"
                      title="Edit Category"
                    >
                      <Edit2 className="h-3 w-3" />
                    </button>
                    <button 
                      onClick={() => triggerDeleteCheck(category._id)}
                      className="text-zinc-550 text-zinc-500 hover:text-rose-400 transition-colors p-1.5 hover:bg-zinc-800 rounded-lg cursor-pointer"
                      title="Delete Category"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>

                {/* Center Content: Icon & Name */}
                <div className="flex flex-col items-center text-center space-y-3 py-2">
                  <div className="w-12 h-12 rounded-2xl bg-white border border-zinc-800 p-1 flex items-center justify-center shadow-inner overflow-hidden shrink-0">
                    <img 
                      src={category.image} 
                      alt="" 
                      className="w-full h-full object-contain" 
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-bold tracking-tight text-xs text-zinc-100 capitalize hover:text-white transition-colors">
                      {category.name}
                    </h3>
                    <p className="text-[10px] text-zinc-550 text-zinc-550 text-zinc-500 font-mono">
                      {new Date(category.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                </div>

                {/* Bottom Stats: Product count */}
                <div className="mt-4 border-t border-zinc-900 pt-3 flex justify-center">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono tracking-wide ${category.totalProducts > 0 ? "bg-blue-500/10 text-blue-400 border border-blue-500/15" : "bg-zinc-800/80 text-zinc-500 border border-zinc-800"}`}>
                    {String(category.totalProducts).padStart(2, '0')} Products
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 🔲 COMPOSITE MULTI-OPERATIONAL DIALOG BOX FORMS */}
      <Dialog open={isModalOpen} onOpenChange={(val) => !val && closeAndResetModal()}>
        <DialogContent className="w-full max-w-md border border-zinc-800 bg-zinc-900 p-6 text-white rounded-2xl shadow-2xl">
          <DialogHeader className="border-b border-zinc-800 pb-4 mb-4">
            <DialogTitle className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-blue-400" /> {editingCategory ? "Edit Category Details" : "New Category"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleFormSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="categoryName" className="text-zinc-400 text-xs font-semibold tracking-wider uppercase">Category Name</Label>
              <Input
                id="categoryName"
                type="text"
                placeholder="Enter Category name"
                {...register("name")}
                className="bg-zinc-950 border-zinc-800 text-white rounded-xl focus-visible:ring-blue-500 w-full"
              />
              {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
            </div>

            {/* Unified Preview Container - ALWAYS renders based on selectedImage (imageUrl) */}
            {selectedImage && (
              <div className="space-y-2">
                <Label className="text-zinc-400 text-xs font-semibold tracking-wider uppercase">Current Icon Preview</Label>
                <div className="flex items-center gap-3 p-3 bg-zinc-950/40 border border-zinc-800 rounded-xl w-fit">
                  <img 
                    src={selectedImage} 
                    alt="Selected category preview" 
                    className="w-10 h-10 rounded-xl object-contain bg-white border border-zinc-800 p-0.5"
                    referrerPolicy="no-referrer"
                  />
                  <div>
                    <p className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider font-mono truncate max-w-[180px]">
                      {selectedImage.includes("api.iconify.design") ? "Library Icon (SVG)" : selectedImage.startsWith("data:") ? "Manual Upload (Base64)" : "Saved Icon URL"}
                    </p>
                    <button
                      type="button"
                      onClick={() => setValue("imageUrl", "")}
                      className="text-[10px] text-rose-400 hover:text-rose-300 font-semibold underline mt-0.5 block text-left"
                    >
                      Remove Icon
                    </button>
                  </div>
                </div>
              </div>
            )}

            {uploadMode === "manual" && (
              <div className="space-y-2">
                <Label className="text-zinc-400 text-xs font-semibold tracking-wider uppercase">Local Device Storage Uploader</Label>
                <input 
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden"
                />
                <div 
                  onClick={() => fileInputRef.current.click()}
                  className="border border-dashed border-zinc-700 rounded-xl p-5 bg-zinc-950/40 text-center flex flex-col items-center justify-center gap-2 hover:bg-zinc-950/80 transition-all cursor-pointer min-h-[100px]"
                >
                  <UploadCloud className="h-5 w-5 text-zinc-500" />
                  <span className="text-xs text-zinc-400">
                    {selectedImage ? "Click to replace file manually" : "Click to upload manual icon file"}
                  </span>
                </div>
                
                <div className="pt-1 text-center">
                  <button
                    type="button"
                    onClick={() => setUploadMode("picker")}
                    className="text-xs text-blue-400 hover:text-blue-300 transition-colors underline"
                  >
                    Or browse icon library instead
                  </button>
                </div>
              </div>
            )}

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

            <Button 
              type="submit" 
              disabled={categoryFormMutation.isPending} 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl h-11 shadow-lg shadow-blue-600/10"
            >
              {categoryFormMutation.isPending ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Transmitting Document...</>
              ) : editingCategory ? (
                "Save Operational Changes"
              ) : (
                "Add Category"
              )}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* 🛡️ STRICT PRODUCT BLOCK GUARD SHIELD */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-zinc-900 border border-zinc-800 text-white rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-zinc-100">Confirm Asset Removal</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              Are you absolutely sure you want to drop this category item? System rules prevent deletion if live stationery items are linked to this record node.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-zinc-800 text-zinc-300 border-zinc-700 hover:bg-zinc-700 rounded-xl">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={executeDeleteNode} 
              className="rounded-xl bg-rose-600 hover:bg-rose-700 font-bold text-white"
            >
              Destroy Record
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}