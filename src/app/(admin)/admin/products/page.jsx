"use client";
 
import { useState, useRef } from "react";
import { toast } from "sonner";
import {
  Loader2,
  Trash2,
  Edit2,
  Sparkles,
  Plus,
  Download,
  RefreshCw,
  Wand2,
  UploadCloud,
  X,
} from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";

const parseNumberField = (value) => {
  if (value === "" || value === undefined || value === null) return undefined;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? value : parsed;
};

const productSchema = z.object({
  name: z.string().min(2, "Product name must be at least 2 characters long.").trim(),
  category: z.string().regex(/^[0-9a-fA-F]{24}$/, "Please select a valid Category."),
  company: z.string().regex(/^[0-9a-fA-F]{24}$/, "Please select a valid Brand/Company."),
  stock: z.preprocess(
    parseNumberField,
    z.number({ required_error: "Stock is required." }).min(0, "Stock quantity cannot be negative.")
  ),
  stockUnit: z.string().min(1, "Stock unit is required.").trim(),
  costPrice: z.preprocess(
    parseNumberField,
    z.number({ required_error: "Cost price is required." }).min(0, "Cost price cannot be negative.")
  ),
  sellingPrice: z.preprocess(
    parseNumberField,
    z.number({ required_error: "Selling price is required." }).min(0, "Selling price cannot be negative.")
  ),
  images: z.array(z.string()).refine((arr) => arr.some(img => img !== ""), {
    message: "At least one product image is required."
  }),
  description: z.string().optional(),
  isActive: z.boolean().optional().default(true)
});
 
export default function ProductManagementPage() {
  const queryClient = useQueryClient();
  const fileInputRefs = useRef([null, null, null]);

  // States
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState(null);
  
  const [editingProduct, setEditingProduct] = useState(null); // null = add, product object = edit
  const [aiDescriptions, setAiDescriptions] = useState([]);

  // React Hook Form
  const { register, handleSubmit: handleFormSubmit, reset, setValue, watch, formState: { errors } } = useForm({
    resolver: zodResolver(productSchema),
    mode: "onBlur",
    defaultValues: {
      name: "",
      category: "",
      company: "",
      stock: "",
      stockUnit: "Pcs",
      costPrice: "",
      sellingPrice: "",
      description: "",
      images: ["", "", ""],
      isActive: true
    }
  });

  const watchImages = watch("images");
  const watchName = watch("name");
  const watchDescription = watch("description");

  // React Query Fetch data
  const { 
    data: productsData, 
    isLoading: productsLoading, 
    refetch: refetchProducts 
  } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const res = await axios.get("/api/admin/products");
      return res.data?.data || [];
    }
  });
  const products = productsData || [];

  const { 
    data: categoriesData 
  } = useQuery({
    queryKey: ["categoriesDropdown"],
    queryFn: async () => {
      const res = await axios.get("/api/admin/categories");
      return res.data?.data || [];
    },
    staleTime: 5 * 60 * 1000
  });
  const categories = categoriesData || [];

  const { 
    data: brandsData 
  } = useQuery({
    queryKey: ["brandsDropdown"],
    queryFn: async () => {
      const res = await axios.get("/api/admin/brands");
      return res.data?.data || [];
    },
    staleTime: 5 * 60 * 1000
  });
  const brands = brandsData || [];

  const handleRefreshAll = async () => {
    try {
      await Promise.all([
        refetchProducts(),
        queryClient.invalidateQueries({ queryKey: ["categoriesDropdown"] }),
        queryClient.invalidateQueries({ queryKey: ["brandsDropdown"] })
      ]);
      toast.success("Inventory cache synchronized successfully!");
    } catch {
      toast.error("Systems failed to synchronize inventory matrices.");
    }
  };

  const productFormMutation = useMutation({
    mutationFn: async (data) => {
      const url = editingProduct ? `/api/admin/products?_id=${editingProduct._id}` : "/api/admin/products";
      const method = editingProduct ? "PUT" : "POST";

      const response = await axios({
        url,
        method,
        data: {
          name: data.name,
          category: data.category,
          company: data.company,
          stock: data.stock,
          stockUnit: data.stockUnit,
          costPrice: data.costPrice,
          sellingPrice: data.sellingPrice,
          description: data.description || "",
          images: data.images.filter(img => img !== ""),
          isActive: data.isActive
        }
      });
      return response.data;
    },
    onSuccess: (data) => {
      toast.success(data.message);
      closeModal();
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Internal submission failure.");
    }
  });

  const onSubmit = (data) => {
    productFormMutation.mutate(data);
  };

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const res = await axios.delete(`/api/admin/products?_id=${id}`);
      return res.data;
    },
    onSuccess: (data) => {
      toast.success(data.message || "Product successfully deleted!");
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Delete failed, please try again.");
    }
  });

  const executeDelete = () => {
    if (!pendingDeleteId) return;
    setDeleteDialogOpen(false);
    deleteMutation.mutate(pendingDeleteId, {
      onSettled: () => {
        setPendingDeleteId(null);
      }
    });
  };

  const openCreateModal = () => {
    setEditingProduct(null);
    setAiDescriptions([]);
    reset({
      name: "",
      category: "",
      company: "",
      stock: "",
      stockUnit: "Pcs",
      costPrice: "",
      sellingPrice: "",
      description: "",
      images: ["", "", ""],
      isActive: true
    });
    setIsModalOpen(true);
  };

  const openEditModal = (p) => {
    setEditingProduct(p);
    setAiDescriptions([]);
    const productImages = (p.images || []).concat(["", "", ""]).slice(0, 3);
    reset({
      name: p.name,
      category: p.category?._id || p.category || "",
      company: p.company?._id || p.company || "",
      stock: p.stock,
      stockUnit: p.stockUnit || "Pcs",
      costPrice: p.costPrice,
      sellingPrice: p.sellingPrice,
      description: p.description || "",
      images: productImages,
      isActive: p.isActive !== undefined ? p.isActive : true
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
    setAiDescriptions([]);
    reset();
  };

  const handleAiDescriptionGeneration = () => {
    const nameVal = watchName?.trim();
    if (!nameVal) return toast.error("Enter product name first!");
    setAiDescriptions([
      `Premium quality ${nameVal} designed for ultimate everyday utility and high durability.`,
      `Fabulous looking ergonomic ${nameVal}. Perfect choice for retail and office setup environments.`
    ]);
  };
 
  const triggerFilePicker = (index) => {
    fileInputRefs.current[index]?.click();
  };
 
  const handleFileSelected = (index, e) => {
    const file = e.target.files?.[0];
    if (!file) return;
 
    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file.");
      return;
    }
 
    const reader = new FileReader();
    reader.onload = () => {
      const updatedImages = [...watchImages];
      updatedImages[index] = reader.result;
      setValue("images", updatedImages);
    };
    reader.readAsDataURL(file);
 
    e.target.value = "";
  };
 
  const handleRemoveImage = (index, e) => {
    e.stopPropagation();
    const updatedImages = [...watchImages];
    updatedImages[index] = "";
    setValue("images", updatedImages);
  };
 
  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
 
  return (
    <div className="w-full min-h-screen bg-[#09090b] text-white p-4 sm:p-6 space-y-6 font-sans">
 
      {/* 1. TOP NAVBAR / ROW METRICS */}
      <div className="flex flex-wrap gap-3 justify-between items-center border-b border-zinc-800 pb-5">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold tracking-tight">Product Management</h1>
          <span className="text-xs bg-zinc-800 text-zinc-400 px-3 py-1 rounded-lg border border-zinc-700 font-medium">Table view</span>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="border-zinc-800 bg-zinc-900 text-zinc-300 rounded-xl px-4 h-9 text-xs font-semibold"><Download className="w-3.5 h-3.5 mr-2" /> Export</Button>
          <Button onClick={openCreateModal} className="bg-white text-black font-semibold hover:bg-zinc-200 rounded-xl px-4 h-9 text-xs shadow-md"><Plus className="w-3.5 h-3.5 mr-1.5" /> Add New Product</Button>
        </div>
      </div>
 
      {/* 2. STATS CARDS GRID ROW */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {["Product Counter", "Revenue", "Total Sold", "Active Catalog"].map((metric, i) => (
          <div key={i} className="bg-[#0c0c0e] border border-zinc-800/80 p-5 rounded-2xl shadow-sm">
            <p className="text-xs text-zinc-500 uppercase tracking-wider font-bold">{metric}</p>
            <p className="text-2xl font-bold mt-2 font-mono tracking-tight">{i === 1 ? "₹45,250" : String(products.length + (i * 12)).padStart(2, '0')}</p>
          </div>
        ))}
      </div>
 
      {/* 3. SEARCH & REFRESH WORKSPACE LAYER */}
      <div className="bg-[#0c0c0e] border border-zinc-800 rounded-2xl p-4 sm:p-6 space-y-4 shadow-xl">
        <div className="flex items-center justify-between gap-4">
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search products..."
            className="bg-[#141416] border-zinc-700 rounded-xl h-11 text-zinc-300 placeholder-zinc-500 focus-visible:ring-zinc-600 transition-all"
          />
          <Button onClick={handleRefreshAll} variant="outline" className="h-11 w-11 p-0 border-zinc-700 bg-zinc-900 shrink-0 rounded-xl hover:bg-zinc-800"><RefreshCw className="w-4 h-4" /></Button>
        </div>
 
        {/* 4. CORE INVENTORY TABLE MATRIX */}
        <div className="overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-900/10">
          <Table>
            <TableHeader className="bg-zinc-900/40">
              <TableRow className="border-b border-zinc-800">
                <TableHead className="w-16 font-semibold text-zinc-400">Sr No.</TableHead>
                <TableHead className="font-semibold text-zinc-400">Product Name</TableHead>
                <TableHead className="font-semibold text-zinc-400">Category</TableHead>
                <TableHead className="font-semibold text-zinc-400">Company Logo</TableHead>
                <TableHead className="font-semibold text-zinc-400">Stock</TableHead>
                <TableHead className="font-semibold text-zinc-400">Price</TableHead>
                <TableHead className="text-center w-32 font-semibold text-zinc-400">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {productsLoading ? (
                <TableRow><TableCell colSpan={7} className="text-center h-32 text-zinc-500"><Loader2 className="w-5 h-5 animate-spin mx-auto mr-2 inline text-blue-500" />Loading items from network cluster...</TableCell></TableRow>
              ) : filteredProducts.map((p, index) => (
                <TableRow key={p._id} className="border-b border-zinc-800/60 hover:bg-zinc-900/20 transition-colors">
                  <TableCell className="font-mono text-zinc-500">{index + 1}</TableCell>
                  <TableCell className="font-semibold capitalize flex items-center gap-2">
                    {p.images?.[0] && <img src={p.images[0]} className="w-7 h-7 object-cover rounded bg-white border border-zinc-800" alt="" />}
                    {p.name}
                  </TableCell>
                  <TableCell className="text-zinc-400">{p.category?.name || "Uncategorized"}</TableCell>
                  <TableCell>
                    {p.company?.logo ? <img src={p.company.logo} className="h-5 object-contain max-w-[80px]" alt="" /> : <span className="text-xs font-mono text-zinc-600">No Brand</span>}
                  </TableCell>
                  <TableCell className="font-mono text-sm"><span className="text-emerald-400 font-bold">{p.stock}</span> {p.stockUnit}</TableCell>
                  <TableCell className="font-mono text-sm">₹{p.sellingPrice}/-</TableCell>
                  <TableCell className="text-center">
                    <div className="flex justify-center gap-3">
                      <Button onClick={() => openEditModal(p)} variant="ghost" className="p-1 h-auto text-zinc-400 hover:text-white transition-colors"><Edit2 className="w-4 h-4" /></Button>
                      <Button onClick={() => { setPendingDeleteId(p._id); setDeleteDialogOpen(true); }} variant="ghost" className="p-1 h-auto text-zinc-500 hover:text-rose-400 transition-colors"><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
 
      {/* 5. ADD / EDIT PRODUCT MODAL */}
      <Dialog open={isModalOpen} onOpenChange={(val) => !val && closeModal()}>
        <DialogContent className="max-w-[88vw] w-full sm:max-w-6xl bg-slate-950/95 border border-slate-800 text-white rounded-[32px] overflow-hidden shadow-[0_40px_120px_rgba(15,23,42,0.35)] flex flex-col max-h-[88vh]">
 
          {/* Header */}
          <DialogHeader className="flex items-center justify-between gap-4 p-5 border-b border-slate-800 bg-slate-950/95 shrink-0">
            <div className="flex items-center gap-2">
              <Sparkles className="text-blue-400 w-4 h-4" />
              <DialogTitle className="text-lg font-semibold text-white tracking-wide">
                {editingProduct ? "Edit Product" : "Add Product"}
              </DialogTitle>
            </div>
          </DialogHeader>
 
          <form onSubmit={handleFormSubmit(onSubmit)} className="flex flex-col flex-1 min-h-0">
            <div className="flex flex-col lg:flex-row flex-1 min-h-0">
              <div className="lg:w-[58%] min-h-0 overflow-y-auto p-6 space-y-6">
                <div className="rounded-[28px] border border-slate-800/80 bg-slate-900/95 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.16)]">
                  <div className="mb-5">
                    <p className="text-xs uppercase tracking-[0.3em] font-semibold text-slate-500">Product details</p>
                    <h2 className="mt-2 text-2xl font-semibold text-white">Basic product information</h2>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Name */}
                    <div className="space-y-2 sm:col-span-2">
                      <Label className="text-sm text-slate-300 font-semibold">Product Name</Label>
                      <Input
                        type="text"
                        placeholder="Enter Product Name"
                        {...register("name")}
                        className="bg-slate-950 border border-slate-800 rounded-3xl h-12 text-slate-200 placeholder-slate-500 focus-visible:ring-1 focus-visible:ring-blue-500/20 focus-visible:border-blue-500/60 transition-all"
                      />
                      {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
                    </div>

                    {/* Category */}
                    <div className="space-y-2">
                      <Label className="text-sm text-slate-300 font-semibold">Select Category</Label>
                      <select
                        {...register("category")}
                        className="w-full bg-slate-950 border border-slate-800 rounded-3xl h-12 px-4 text-sm text-slate-200 focus:outline-none focus:border-blue-500/70 focus:ring-1 focus:ring-blue-500/20 transition-all appearance-none cursor-pointer"
                        style={{
                          backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%23a1a1aa' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 12 15 18 9'></polyline></svg>")`,
                          backgroundRepeat: 'no-repeat',
                          backgroundPosition: 'right 16px center',
                          backgroundSize: '14px'
                        }}
                      >
                        <option value="" className="bg-slate-950 text-slate-500">-- Choose Option --</option>
                        {categories.map(opt => (
                          <option key={opt._id} value={opt._id} className="bg-slate-950 text-slate-200">
                            {opt.name}
                          </option>
                        ))}
                      </select>
                      {errors.category && <p className="text-xs text-red-500 mt-1">{errors.category.message}</p>}
                    </div>

                    {/* Brand */}
                    <div className="space-y-2">
                      <Label className="text-sm text-slate-300 font-semibold">Select Brand/Company</Label>
                      <select
                        {...register("company")}
                        className="w-full bg-slate-950 border border-slate-800 rounded-3xl h-12 px-4 text-sm text-slate-200 focus:outline-none focus:border-blue-500/70 focus:ring-1 focus:ring-blue-500/20 transition-all appearance-none cursor-pointer"
                        style={{
                          backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%23a1a1aa' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 12 15 18 9'></polyline></svg>")`,
                          backgroundRepeat: 'no-repeat',
                          backgroundPosition: 'right 16px center',
                          backgroundSize: '14px'
                        }}
                      >
                        <option value="" className="bg-slate-950 text-slate-500">-- Choose Option --</option>
                        {brands.map(opt => (
                          <option key={opt._id} value={opt._id} className="bg-slate-950 text-slate-200">
                            {opt.name}
                          </option>
                        ))}
                      </select>
                      {errors.company && <p className="text-xs text-red-500 mt-1">{errors.company.message}</p>}
                    </div>

                    {/* Stock */}
                    <div className="space-y-2">
                      <Label className="text-sm text-slate-300 font-semibold">Enter Stock</Label>
                      <Input
                        type="number"
                        placeholder="0"
                        {...register("stock")}
                        className="bg-slate-950 border border-slate-800 rounded-3xl h-12 text-slate-200 placeholder-slate-500 focus-visible:ring-1 focus-visible:ring-blue-500/20 focus-visible:border-blue-500/60 transition-all"
                      />
                      {errors.stock && <p className="text-xs text-red-500 mt-1">{errors.stock.message}</p>}
                    </div>

                    {/* Units */}
                    <div className="space-y-2">
                      <Label className="text-sm text-slate-300 font-semibold">Select Units</Label>
                      <select
                        {...register("stockUnit")}
                        className="w-full bg-slate-950 border border-slate-800 rounded-3xl h-12 px-4 text-sm text-slate-200 focus:outline-none focus:border-blue-500/70 focus:ring-1 focus:ring-blue-500/20 transition-all appearance-none cursor-pointer"
                        style={{
                          backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%23a1a1aa' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 12 15 18 9'></polyline></svg>")`,
                          backgroundRepeat: 'no-repeat',
                          backgroundPosition: 'right 16px center',
                          backgroundSize: '14px'
                        }}
                      >
                        <option value="Pcs" className="bg-slate-950 text-slate-200">Pcs</option>
                        <option value="Boxes" className="bg-slate-950 text-slate-200">Boxes</option>
                      </select>
                      {errors.stockUnit && <p className="text-xs text-red-500 mt-1">{errors.stockUnit.message}</p>}
                    </div>

                    {/* Cost Price */}
                    <div className="space-y-2">
                      <Label className="text-sm text-slate-300 font-semibold">Cost Price</Label>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        {...register("costPrice")}
                        className="bg-slate-950 border border-slate-800 rounded-3xl h-12 text-slate-200 placeholder-slate-500 focus-visible:ring-1 focus-visible:ring-blue-500/20 focus-visible:border-blue-500/60 transition-all"
                      />
                      {errors.costPrice && <p className="text-xs text-red-500 mt-1">{errors.costPrice.message}</p>}
                    </div>

                    {/* Selling Price */}
                    <div className="space-y-2">
                      <Label className="text-sm text-slate-300 font-semibold">Selling Price</Label>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        {...register("sellingPrice")}
                        className="bg-slate-950 border border-slate-800 rounded-3xl h-12 text-slate-200 placeholder-slate-500 focus-visible:ring-1 focus-visible:ring-blue-500/20 focus-visible:border-blue-500/60 transition-all"
                      />
                      {errors.sellingPrice && <p className="text-xs text-red-500 mt-1">{errors.sellingPrice.message}</p>}
                    </div>
                  </div>
                </div>
              </div>
 
              <div className="lg:w-[42%] min-h-0 overflow-y-auto p-6 space-y-6">
                <div className="rounded-[28px] border border-slate-800/80 bg-slate-900/95 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.16)]">
                  <div className="flex items-center justify-between gap-3 mb-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.3em] font-semibold text-slate-500">Product images</p>
                      <h3 className="mt-2 text-lg font-semibold text-white">Upload gallery</h3>
                    </div>
                    <span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-200">Enhance</span>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {watchImages.map((img, i) => (
                      <div key={i} className="relative aspect-square overflow-hidden rounded-3xl border border-dashed border-slate-700 bg-slate-950 cursor-pointer transition hover:border-blue-500/80 hover:bg-slate-900" onClick={() => triggerFilePicker(i)}>
                        <input
                          ref={(el) => (fileInputRefs.current[i] = el)}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleFileSelected(i, e)}
                        />
                        {img ? (
                          <img src={img} className="h-full w-full object-cover" alt="Product" />
                        ) : (
                          <div className="flex h-full flex-col items-center justify-center gap-2 px-2 text-center">
                            <UploadCloud className="h-5 w-5 text-slate-500" />
                            <p className="text-xs font-semibold text-slate-400">Upload</p>
                            <p className="text-[11px] text-slate-500">Slot {i + 1}</p>
                          </div>
                        )}
                        {img && (
                          <button
                            type="button"
                            onClick={(e) => handleRemoveImage(i, e)}
                            className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-950/90 text-white shadow-lg"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  {errors.images && <p className="text-xs text-red-500 mt-2">{errors.images.message}</p>}
                  <Button
                    type="button"
                    variant="secondary"
                    className="mt-4 w-full h-11 rounded-3xl border border-blue-700/50 bg-slate-950 text-sm text-blue-200 hover:bg-slate-900"
                  >
                    <Wand2 className="h-4 w-4" /> Enhance product image
                  </Button>
                </div>
 
                <div className="rounded-[28px] border border-slate-800/80 bg-slate-900/95 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.16)]">
                  <div className="mb-4">
                    <p className="text-xs uppercase tracking-[0.3em] font-semibold text-slate-500">Description</p>
                    <h3 className="mt-2 text-lg font-semibold text-white">Product summary</h3>
                  </div>
                  <Textarea
                    {...register("description")}
                    placeholder="Write a short product description..."
                    className="min-h-[210px] w-full rounded-3xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-200 placeholder-slate-500 focus-visible:border-blue-500/70 focus-visible:ring-1 focus-visible:ring-blue-500/20 resize-none"
                  />
                  <Button
                    type="button"
                    onClick={handleAiDescriptionGeneration}
                    className="mt-4 w-full h-11 rounded-3xl bg-blue-950 text-sm font-semibold text-blue-100 hover:bg-blue-900"
                  >
                    <Sparkles className="h-4 w-4" /> Generate description
                  </Button>
                  {aiDescriptions.length > 0 && (
                    <div className="mt-4 space-y-3">
                      {aiDescriptions.map((desc, idx) => (
                        <div
                          key={idx}
                          onClick={() => setValue("description", desc)}
                          className="cursor-pointer rounded-3xl border border-slate-800/70 bg-slate-950 p-4 text-sm text-slate-300 transition hover:border-blue-500/60 hover:bg-slate-900"
                        >
                          {desc}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
 
            <div className="shrink-0 border-t border-slate-800 bg-slate-950/95 p-4 flex items-center justify-end gap-3">
              <Button
                type="button"
                variant="ghost"
                onClick={closeModal}
                className="rounded-2xl border border-slate-800 bg-slate-900/80 px-4 py-2 text-sm font-semibold text-slate-300 hover:bg-slate-800"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={productFormMutation.isPending}
                className="rounded-2xl bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-950/30 hover:bg-blue-700"
              >
                {productFormMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : editingProduct ? (
                  "Save changes"
                ) : (
                  "Publish product"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
 
      {/* 6. DELETE CONFIRMATION */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-zinc-900 border border-zinc-800 text-white rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Removal</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">Are you sure you want to delete this product? This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-zinc-800 text-zinc-300 rounded-xl border-zinc-700">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={executeDelete} className="bg-rose-600 hover:bg-rose-700 font-bold rounded-xl">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
 
    </div>
  );
}
 