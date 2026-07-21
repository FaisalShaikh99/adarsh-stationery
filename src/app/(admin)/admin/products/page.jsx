"use client";
 
import { useState, useRef, useEffect } from "react";
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
  ChevronLeft,
  ChevronRight,
  Search,
  Bell,
  Percent,
  Send,
  Package
} from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Switch } from "@/components/ui/switch";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { productSchema } from "@/schemas/products.schema";
import useFuzzySearch from "@/hooks/useFuzzySearch";
import VoiceSearchButton from "@/components/ui/voice-search-button";
 
export default function ProductManagementPage() {
  const queryClient = useQueryClient();
  const fileInputRefs = useRef([]);

  // React Query Dropdown Data Queries (defined first for useForm values default sync)
  const { 
    data: categoriesData,
    isLoading: categoriesLoading
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
    data: brandsData,
    isLoading: brandsLoading
  } = useQuery({
    queryKey: ["brandsDropdown"],
    queryFn: async () => {
      const res = await axios.get("/api/admin/brands");
      return res.data?.data || [];
    },
    staleTime: 5 * 60 * 1000
  });
  const brands = brandsData || [];

  // States
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState(null);
  
  const [editingProduct, setEditingProduct] = useState(null); // null = add, product object = edit
  const [aiDescriptions, setAiDescriptions] = useState([]);
  const [viewMode, setViewMode] = useState("grid"); // default grid-first visual workspace
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState("All");
  const [selectedBrands, setSelectedBrands] = useState([]);
  const [brandSearchText, setBrandSearchText] = useState("");
  const [isBrandDropdownOpen, setIsBrandDropdownOpen] = useState(false);
  const [isEnhancingImage, setIsEnhancingImage] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Notify Customers States
  const [isNotifyModalOpen, setIsNotifyModalOpen] = useState(false);
  const [eligibleCustomers, setEligibleCustomers] = useState([]);
  const [isEligibleLoading, setIsEligibleLoading] = useState(false);
  const [discountPercentage, setDiscountPercentage] = useState("0");
  const [isDraftLoading, setIsDraftLoading] = useState(false);
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [isSendingNotifications, setIsSendingNotifications] = useState(false);
  const [sendSummary, setSendSummary] = useState("");

  const handleOpenNotifyModal = async () => {
    if (!editingProduct?._id) return;
    setIsNotifyModalOpen(true);
    setIsEligibleLoading(true);
    setEligibleCustomers([]);
    setEmailSubject("");
    setEmailBody("");
    setDiscountPercentage("0");
    setSendSummary("");
    
    try {
      const res = await axios.get(`/api/admin/products/${editingProduct._id}/eligible-customers`);
      setEligibleCustomers(res.data?.data || []);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load eligible customers.");
    } finally {
      setIsEligibleLoading(false);
    }
  };

  const handleGenerateDraft = async () => {
    const discNum = Number(discountPercentage);
    if (isNaN(discNum) || discNum < 0 || discNum > 100) {
      toast.error("Discount percentage must be between 0 and 100.");
      return;
    }
    
    setIsDraftLoading(true);
    try {
      const res = await axios.post(`/api/admin/products/${editingProduct._id}/draft-notification-email`, {
        discount: discNum
      });
      setEmailSubject(res.data?.data?.subject || "");
      setEmailBody(res.data?.data?.body || "");
      toast.success("AI draft generated successfully!");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to generate AI email draft.");
    } finally {
      setIsDraftLoading(false);
    }
  };

  const handleSendNotifications = async () => {
    if (!emailSubject.trim() || !emailBody.trim()) {
      toast.error("Subject and Body are required.");
      return;
    }
    
    setIsSendingNotifications(true);
    try {
      const res = await axios.post(`/api/admin/products/${editingProduct._id}/send-notification`, {
        subject: emailSubject,
        body: emailBody,
        customerIds: eligibleCustomers.map(c => c._id),
        discount: Number(discountPercentage) || 0
      });
      
      const { successCount, failedCount } = res.data?.data || {};
      const summary = `Sent to ${successCount} of ${eligibleCustomers.length} customers, ${failedCount} failed.`;
      setSendSummary(summary);
      toast.success("Notifications completed!");
      setTimeout(() => {
        setIsNotifyModalOpen(false);
      }, 3000);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to send notifications.");
    } finally {
      setIsSendingNotifications(false);
    }
  };

  // Reset pagination on filter parameter change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategoryFilter, selectedBrands]);

  // React Hook Form
  const { register, handleSubmit: handleFormSubmit, reset, setValue, watch, formState: { errors } } = useForm({
    resolver: zodResolver(productSchema),
    mode: "onBlur",
    values: editingProduct ? {
      name: editingProduct.name || "",
      category: editingProduct.category?._id || editingProduct.category || "",
      company: editingProduct.company?._id || editingProduct.company || "",
      stock: editingProduct.stock,
      stockUnit: editingProduct.stockUnit || "Pcs",
      costPrice: editingProduct.costPrice,
      sellingPrice: editingProduct.sellingPrice,
      description: editingProduct.description || "",
      images: editingProduct.images && editingProduct.images.length > 0 ? editingProduct.images : [""],
      isActive: editingProduct.isActive !== undefined ? editingProduct.isActive : true
    } : {
      name: "",
      category: categories[0]?._id || "",
      company: brands[0]?._id || "",
      stock: "",
      stockUnit: "Pcs",
      costPrice: "",
      sellingPrice: "",
      description: "",
      images: [""],
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
    },
    refetchOnMount: true
  });
  const products = productsData || [];

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

  const handleCsvExport = () => {
    if (filteredProducts.length === 0) {
      toast.error("No products available to export.");
      return;
    }

    const headers = [
      "Product Name",
      "Category",
      "Brand",
      "Stock",
      "Price",
      "Visibility",
      "Date Added"
    ];

    const rows = filteredProducts.map((p) => {
      const dateStr = p.createdAt
        ? new Date(p.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
        : "—";
      return [
        `"${p.name.replace(/"/g, '""')}"`,
        `"${(p.category?.name || "Uncategorized").replace(/"/g, '""')}"`,
        `"${(p.company?.name || "No Brand").replace(/"/g, '""')}"`,
        p.stock,
        p.sellingPrice,
        p.isVisible !== false ? "Visible" : "Hidden",
        `"${dateStr}"`
      ];
    });

    const csvContent = [
      headers.join(","),
      ...rows.map(r => r.join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const today = new Date().toISOString().slice(0, 10);
    
    link.setAttribute("href", url);
    link.setAttribute("download", `products-export-${today}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success("CSV export downloaded successfully!");
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

  const toggleVisibilityMutation = useMutation({
    mutationFn: async (id) => {
      const res = await axios.patch(`/api/admin/products/toggle-visibility?id=${id}`);
      return res.data;
    },
    onMutate: async (id) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["products"] });

      // Snapshot the current list
      const previousProducts = queryClient.getQueryData(["products"]);

      // Optimistically update products cache
      queryClient.setQueryData(["products"], (old) => {
        if (!old) return old;
        const currentData = Array.isArray(old) ? old : (old.data || []);
        
        const toggled = currentData.map((p) => {
          if (p._id === id) {
            return { ...p, isVisible: p.isVisible === false };
          }
          return p;
        });

        if (Array.isArray(old)) return toggled;
        return { ...old, data: toggled };
      });

      return { previousProducts };
    },
    onError: (err, id, context) => {
      // Roll back to previous cached list
      if (context?.previousProducts) {
        queryClient.setQueryData(["products"], context.previousProducts);
      }
      toast.error(err.response?.data?.message || "Visibility toggle failed.");
    },
    onSuccess: (data) => {
      toast.success(data.message);
    },
    onSettled: () => {
      // Re-synchronize with database in background
      queryClient.invalidateQueries({ queryKey: ["products"] });
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
      category: categories[0]?._id || "",
      company: brands[0]?._id || "",
      stock: "",
      stockUnit: "Pcs",
      costPrice: "",
      sellingPrice: "",
      description: "",
      images: [""],
      isActive: true
    });
    setIsModalOpen(true);
  };

  const openEditModal = (p) => {
    setEditingProduct(p);
    setAiDescriptions([]);
    reset({
      name: p.name,
      category: p.category?._id || p.category || "",
      company: p.company?._id || p.company || "",
      stock: p.stock,
      stockUnit: p.stockUnit || "Pcs",
      costPrice: p.costPrice,
      sellingPrice: p.sellingPrice,
      description: p.description || "",
      images: p.images && p.images.length > 0 ? p.images : [""],
      isActive: p.isActive !== undefined ? p.isActive : true
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
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
      images: [""],
      isActive: true
    });
  };

  const handleAiDescriptionGeneration = async () => {
    const nameVal = watchName?.trim();
    if (!nameVal) return toast.error("Enter product name first!");
    
    const categoryId = watch("category");
    const brandId = watch("company");
    const categoryObj = categories.find(c => c._id === categoryId);
    const brandObj = brands.find(b => b._id === brandId);

    setAiLoading(true);
    try {
      const response = await axios.post("/api/admin/ai-generate", {
        productName: nameVal,
        brand: brandObj?.name || "Generic",
        category: categoryObj?.name || "Stationery"
      }, { timeout: 8000 });
      
      if (response.data?.success && Array.isArray(response.data?.options)) {
        setAiDescriptions(response.data.options);
        toast.success("AI descriptions generated successfully!");
        return;
      }
    } catch (err) {
      console.warn("AI Generate API failed, falling back to local description generator", err);
    } finally {
      setAiLoading(false);
    }

    // Dynamic offline fallback generator to make sure different descriptions are generated every time
    const brandName = brandObj?.name || "Generic";
    const categoryName = categoryObj?.name || "Stationery";
    const adjectives = ["Premium", "Professional-grade", "Ergonomic", "Classic", "Deluxe", "Heavy-duty"];
    const verbs = ["crafted for smooth writing and drawing", "designed for daily workspace productivity", "engineered for high durability and precision", "perfect for school, office, and creative art projects"];
    
    // Choose 3 random combinations
    const fallbackOptions = [
      `${adjectives[Math.floor(Math.random() * adjectives.length)]} ${nameVal} by ${brandName}. This high-quality item is ${verbs[0]}, delivering maximum reliability and a superior feel.`,
      `${adjectives[Math.floor(Math.random() * adjectives.length)]} ${nameVal} is the ultimate addition to your ${categoryName} catalog. ${verbs[1]} and engineered to stand the test of time.`,
      `Bring professional results with ${brandName}'s ${adjectives[Math.floor(Math.random() * adjectives.length)]} ${nameVal}. Specifically ${verbs[2]} for students and professionals alike.`
    ];
    setAiDescriptions(fallbackOptions);
    toast.info("Offline fallback descriptions generated successfully.");
  };

  const handleImageEnhancement = async () => {
    const currentImg = watchImages[0];

    // Case 1: If user already uploaded a product photo, enhance it client-side to preserve colors, logo, and actual product
    if (currentImg && (currentImg.startsWith("data:image/") || currentImg.startsWith("http"))) {
      setIsEnhancingImage(true);
      const enhancementToast = toast.loading("Applying studio lighting and clarity filters to your photo...");

      try {
        const img = new Image();
        img.crossOrigin = "anonymous"; // bypass CORS for external URLs
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          canvas.width = img.width;
          canvas.height = img.height;

          // Draw original image
          ctx.drawImage(img, 0, 0);

          // Get image data
          const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imgData.data;

          // Apply studio enhancement: Brightness (+20), Contrast (+25), Saturation (+10)
          const brightness = 20;
          const contrast = 25;
          const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));

          for (let i = 0; i < data.length; i += 4) {
            // Brightness
            let r = data[i] + brightness;
            let g = data[i + 1] + brightness;
            let b = data[i + 2] + brightness;

            // Contrast
            r = factor * (r - 128) + 128;
            g = factor * (g - 128) + 128;
            b = factor * (b - 128) + 128;

            // Saturation boost
            const gray = 0.2989 * r + 0.587 * g + 0.114 * b;
            r = gray + 1.1 * (r - gray);
            g = gray + 1.1 * (g - gray);
            b = gray + 1.1 * (b - gray);

            // Clamp values
            data[i] = Math.min(255, Math.max(0, r));
            data[i + 1] = Math.min(255, Math.max(0, g));
            data[i + 2] = Math.min(255, Math.max(0, b));
          }

          // Put adjusted data back
          ctx.putImageData(imgData, 0, 0);

          // Convert back to base64 Data URL and save
          const enhancedDataUrl = canvas.toDataURL("image/jpeg", 0.95);
          const updated = [...watchImages];
          updated[0] = enhancedDataUrl;
          setValue("images", updated);

          toast.dismiss(enhancementToast);
          toast.success("Photo enhanced with studio lighting and contrast!");
        };
        img.onerror = () => {
          toast.dismiss(enhancementToast);
          toast.error("Could not load image format for enhancement.");
        };
        img.src = currentImg;
      } catch (err) {
        toast.dismiss(enhancementToast);
        toast.error("Failed to enhance photo. Please try again.");
      } finally {
        setIsEnhancingImage(false);
      }
      return;
    }

    // Case 2: If the slot is empty, generate a new mockup via Pollinations AI
    const nameVal = watchName?.trim();
    if (!nameVal) {
      toast.error("Please upload a photo first to enhance, or enter a Product Name to generate a mockup.");
      return;
    }

    setIsEnhancingImage(true);
    const enhancementToast = toast.loading("Generating professional product mockup via AI engine...");

    try {
      const categoryId = watch("category");
      const categoryObj = categories.find(c => c._id === categoryId);
      const categoryName = categoryObj?.name || "Stationery";
      const brandId = watch("company");
      const brandObj = brands.find(b => b._id === brandId);
      const brandName = brandObj?.name || "";

      const prompt = encodeURIComponent(
        `E-commerce product listing photo of a premium ${brandName} ${nameVal} ${categoryName}, clean white background, extremely attractive, modern marketing layout, conversion highlights, features list callouts, studio lighting, high resolution, stable diffusion, like amazon or flipkart`
      );
      
      const enhancedImageUrl = `https://image.pollinations.ai/prompt/${prompt}?nologo=true&private=true&width=1024&height=1024&seed=${Math.floor(Math.random() * 100008)}`;

      const updatedImages = [...watchImages];
      updatedImages[0] = enhancedImageUrl;
      setValue("images", updatedImages);
      
      toast.dismiss(enhancementToast);
      toast.success("AI product mockup generated successfully!");

    } catch (error) {
      toast.dismiss(enhancementToast);
      toast.error("AI image generation failed. Please try again.");
    } finally {
      setIsEnhancingImage(false);
    }
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
 
  const { results: fuzzyMatchedProducts, suggestion: spellingSuggestion } = useFuzzySearch(
    products,
    searchQuery,
    "name"
  );
 
  const filteredProducts = fuzzyMatchedProducts.filter(p => {
    const matchesCategory = selectedCategoryFilter === "All" || p.category?._id === selectedCategoryFilter || p.category === selectedCategoryFilter;
    const brandId = p.company?._id || p.company;
    const matchesBrand = selectedBrands.length === 0 || selectedBrands.includes(brandId?.toString());
    return matchesCategory && matchesBrand;
  });
 
  const metrics = [
    { title: "Product Counter", value: String(products.length).padStart(2, "0") },
    { title: "Revenue", value: "₹0", subtext: "Available after Orders module" },
    { title: "Total Sold", value: "0", subtext: "Available after Orders module" },
    { title: "Active Catalog", value: String(products.filter(p => p.isVisible !== false).length).padStart(2, "0") }
  ];

  const totalItems = filteredProducts.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );


  if (productsLoading || categoriesLoading || brandsLoading) {
    return (
      <div className="fixed inset-0 bg-[#09090b] z-50 flex items-center justify-center">
        <LoadingSpinner size={240} label="Loading products inventory..." />
      </div>
    );
  }

  return (
    <div className="w-full max-w-full min-h-screen bg-[#09090b] text-white p-4 sm:p-6 space-y-6 font-sans overflow-x-hidden">
 
      {/* 1. TOP NAVBAR / ROW METRICS */}
      <div className="flex flex-wrap gap-3 justify-between items-center border-b border-zinc-800 pb-5">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold tracking-tight">Product Management</h1>
          <span className="text-xs bg-zinc-800 text-zinc-400 px-3 py-1 rounded-lg border border-zinc-700 font-medium capitalize">{viewMode} view</span>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={handleCsvExport} variant="outline" className="border-zinc-800 bg-zinc-900 text-zinc-300 rounded-xl px-4 h-9 text-xs font-semibold"><Download className="w-3.5 h-3.5 mr-2" /> Export</Button>
          <Button onClick={openCreateModal} className="bg-white text-black font-semibold hover:bg-zinc-200 rounded-xl px-4 h-9 text-xs shadow-md"><Plus className="w-3.5 h-3.5 mr-1.5" /> Add New Product</Button>
        </div>
      </div>
 
      {/* 2. STATS CARDS GRID ROW */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {metrics.map((metric, i) => (
          <div key={i} className="bg-[#0c0c0e] border border-zinc-800/80 p-5 rounded-2xl shadow-sm flex flex-col justify-between min-h-[105px]">
            <div>
              <p className="text-xs text-zinc-500 uppercase tracking-wider font-bold">{metric.title}</p>
              <p className="text-2xl font-bold mt-2 font-mono tracking-tight text-white">{metric.value}</p>
            </div>
            {metric.subtext && (
              <span className="text-[10px] text-zinc-500 mt-1.5 block italic">{metric.subtext}</span>
            )}
          </div>
        ))}
      </div>
 
      {/* 3. SEARCH & REFRESH WORKSPACE LAYER */}
      <div className="bg-[#0c0c0e] border border-zinc-800 rounded-2xl p-4 sm:p-6 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full">
            <div className="flex items-center w-full bg-[#141416] border border-zinc-700 rounded-xl px-3.5 transition-all gap-2 h-11 focus-within:border-zinc-500 focus-within:ring-1 focus-within:ring-zinc-500">
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
            <Button onClick={handleRefreshAll} variant="outline" className="h-11 w-11 p-0 border-zinc-700 bg-zinc-900 shrink-0 rounded-xl hover:bg-zinc-800"><RefreshCw className="w-4 h-4" /></Button>
          </div>
          
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {/* 🏢 Brand/Company Dropdown Selector */}
            <div className="relative shrink-0 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setIsBrandDropdownOpen(!isBrandDropdownOpen)}
                className="bg-[#141416] border border-zinc-700 rounded-xl h-11 px-4 text-xs font-semibold text-zinc-300 hover:text-white hover:border-zinc-550 transition-all flex items-center justify-between gap-2 cursor-pointer w-full sm:min-w-[170px]"
              >
                <span className="truncate">
                  {selectedBrands.length === 0 
                    ? "All Brands/Companies" 
                    : selectedBrands.length === 1 
                      ? brands.find(b => b._id === selectedBrands[0])?.name || "1 Selected"
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
                  <div className="absolute right-0 top-12.5 w-64 bg-zinc-950 border border-zinc-800 rounded-2xl p-3 shadow-2xl z-50 space-y-2 mt-1">
                    <Input 
                      value={brandSearchText}
                      onChange={(e) => setBrandSearchText(e.target.value)}
                      placeholder="Search company name..."
                      className="h-8 bg-zinc-900 border-zinc-805 border-zinc-800 text-xs rounded-lg placeholder-zinc-650"
                    />
                    
                    <div className="max-h-48 overflow-y-auto space-y-1 custom-scrollbar py-1">
                      {selectedBrands.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setSelectedBrands([])}
                          className="w-full text-left text-[10px] text-rose-400 hover:underline px-2 py-0.5"
                        >
                          Clear Selection
                        </button>
                      )}

                      {brands
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

                      {brands.filter(b => b.name.toLowerCase().includes(brandSearchText.toLowerCase())).length === 0 && (
                        <p className="text-[11px] text-zinc-550 text-center py-2">No brands found.</p>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* View Mode Toggle Switcher */}
            <div className="flex items-center gap-1 bg-[#141416] border border-zinc-800 p-1 rounded-xl shrink-0 self-stretch sm:self-auto justify-center">
              <button
                type="button"
                onClick={() => setViewMode("table")}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === "table" ? "bg-zinc-800 text-white" : "text-zinc-500 hover:text-zinc-350"}`}
              >
                Table
              </button>
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === "grid" ? "bg-zinc-800 text-white" : "text-zinc-500 hover:text-zinc-350"}`}
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

        {/* 🏷️ Horizontal Category-wise View filter */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none border-b border-zinc-800/60">
          <button
            type="button"
            onClick={() => setSelectedCategoryFilter("All")}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all border ${selectedCategoryFilter === "All" ? "bg-white text-black border-white shadow-md scale-[1.02]" : "bg-zinc-900/50 text-zinc-400 border-zinc-805 border-zinc-800 hover:text-zinc-200"}`}
          >
            All Categories ({products.length})
          </button>
          {categories.map((cat) => {
            const count = products.filter(p => p.category?._id === cat._id || p.category === cat._id).length;
            return (
              <button
                key={cat._id}
                type="button"
                onClick={() => setSelectedCategoryFilter(cat._id)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all border ${selectedCategoryFilter === cat._id ? "bg-white text-black border-white shadow-md scale-[1.02]" : "bg-zinc-900/50 text-zinc-400 border-zinc-805 border-zinc-800 hover:text-zinc-200"}`}
              >
                <span className="capitalize">{cat.name}</span> ({count})
              </button>
            );
          })}
        </div>
 
        {/* 4. CORE INVENTORY DISPLAY (TABLE / GRID) */}
        {viewMode === "table" ? (
          <div className="overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-900/10">
            <Table className="min-w-[1000px]">
              <TableHeader className="bg-zinc-900/40">
                <TableRow className="border-b border-zinc-800">
                  <TableHead className="w-16 font-semibold text-zinc-400">Sr No.</TableHead>
                  <TableHead className="font-semibold text-zinc-400">Product Name</TableHead>
                  <TableHead className="font-semibold text-zinc-400">Category</TableHead>
                  <TableHead className="font-semibold text-zinc-400">Brand</TableHead>
                  <TableHead className="font-semibold text-zinc-400">Stock</TableHead>
                  <TableHead className="font-semibold text-zinc-400">Price</TableHead>
                  <TableHead className="font-semibold text-zinc-400">Visibility</TableHead>
                  <TableHead className="font-semibold text-zinc-400">Date Added</TableHead>
                  <TableHead className="text-center w-32 font-semibold text-zinc-400">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {productsLoading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-6 text-zinc-550 font-medium">
                      <LoadingSpinner size={140} label="Loading items..." className="mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : filteredProducts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="py-12 text-center text-zinc-500">
                      <div className="flex flex-col items-center justify-center space-y-4">
                        <p className="text-sm font-semibold text-zinc-400">No products found matching criteria.</p>
                        <Button
                          onClick={openCreateModal}
                          className="bg-white text-black font-semibold hover:bg-zinc-200 rounded-xl px-4 h-9 text-xs cursor-pointer shadow-md"
                        >
                          + Add New Product
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedProducts.map((p, index) => (
                    <TableRow key={p._id} className="border-b border-zinc-800/60 hover:bg-zinc-900/20 transition-colors">
                      <TableCell className="font-mono text-zinc-500 py-2.5">{(currentPage - 1) * itemsPerPage + index + 1}</TableCell>
                      <TableCell className="font-semibold capitalize py-2.5">
                        <div className="flex items-center gap-3">
                          {p.images?.[0] && (
                            <img 
                              src={p.images[0]} 
                              className="w-10 h-10 object-contain rounded-lg bg-white border border-zinc-800 p-0.5 shadow-sm shrink-0" 
                              alt={p.name} 
                              referrerPolicy="no-referrer"
                            />
                          )}
                          <span className="font-bold tracking-tight text-xs text-zinc-100 capitalize">{p.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-zinc-450 text-xs py-2.5">{p.category?.name || "Uncategorized"}</TableCell>
                      <TableCell className="py-2.5">
                        {p.company?.logo ? (
                          <img 
                            src={p.company.logo} 
                            className="w-10 h-10 object-contain rounded-lg bg-white border border-zinc-800 p-0.5 shadow-sm shrink-0" 
                            alt={p.company?.name} 
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <span className="text-[11px] font-mono text-zinc-500">{p.company?.name || "No Brand"}</span>
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-xs py-2.5">
                        <span className="text-emerald-450 text-emerald-400 font-bold">{p.stock}</span> {p.stockUnit}
                      </TableCell>
                      <TableCell className="font-mono text-xs py-2.5">₹{p.sellingPrice}/-</TableCell>
                      <TableCell className="py-2.5">
                        <div className="flex items-center gap-2">
                          <Switch 
                            checked={p.isVisible !== false}
                            onCheckedChange={() => toggleVisibilityMutation.mutate(p._id)}
                            className="data-[state=checked]:bg-emerald-600 scale-75"
                          />
                          <span className={`text-[9px] font-bold uppercase min-w-[50px] ${p.isVisible !== false ? "text-emerald-400" : "text-zinc-500"}`}>
                            {p.isVisible !== false ? "Visible" : "Hidden"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-[11px] text-zinc-450 py-2.5">
                        {p.createdAt ? (
                          new Date(p.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                        ) : "—"}
                      </TableCell>
                      <TableCell className="text-center py-2.5">
                        <div className="flex justify-center gap-3">
                          <Button onClick={() => openEditModal(p)} variant="ghost" className="p-1 h-auto text-zinc-400 hover:text-white transition-colors"><Edit2 className="w-3.5 h-3.5" /></Button>
                          <Button onClick={() => { setPendingDeleteId(p._id); setDeleteDialogOpen(true); }} variant="ghost" className="p-1 h-auto text-zinc-500 hover:text-rose-455 hover:text-rose-400 transition-colors"><Trash2 className="w-3.5 h-3.5" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        ) : (
          /* Grid View Cards Frame */
          <div className="space-y-6">
            {productsLoading ? (
              <div className="text-center py-12 text-zinc-550 font-medium">
                <LoadingSpinner size={160} label="Loading items..." className="mx-auto" />
              </div>
            ) : paginatedProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center p-12 border border-dashed border-zinc-800 bg-[#0c0c0e]/30 rounded-2xl space-y-4 min-h-[300px]">
                <div className="w-12 h-12 rounded-full bg-zinc-900 flex items-center justify-center border border-zinc-800 text-zinc-500">
                  <Package className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-zinc-200">No products found matching criteria</h3>
                  <p className="text-xs text-zinc-500 max-w-sm">No items match your search filters or catalog selection.</p>
                </div>
                <Button 
                  onClick={openCreateModal}
                  className="bg-white text-black font-semibold hover:bg-zinc-200 rounded-xl px-4 h-9 text-xs cursor-pointer shadow-md"
                >
                  + Add New Product
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {paginatedProducts.map((p) => {
                  const dateStr = p.createdAt
                    ? new Date(p.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                    : "—";

                  return (
                    <div key={p._id} className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-4 flex flex-col justify-between hover:border-zinc-700 hover:bg-zinc-900/60 transition-all group">
                      <div className="space-y-3">
                        {/* Product Image Frame */}
                        <div className="relative h-44 w-full bg-white rounded-xl border border-zinc-850 flex items-center justify-center p-3 overflow-hidden shadow-sm shrink-0">
                          {p.images?.[0] ? (
                            <img 
                              src={p.images[0]} 
                              alt={p.name} 
                              className="h-full w-full object-contain group-hover:scale-105 transition-transform" 
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="text-zinc-400 text-xs font-mono">No Image</div>
                          )}
                          {p.company?.logo && (
                            <img 
                              src={p.company.logo} 
                              alt="" 
                              className="absolute top-2.5 left-2.5 h-8 object-contain max-w-[85px] bg-white p-1 rounded-lg border border-zinc-200 shadow-sm" 
                              referrerPolicy="no-referrer"
                            />
                          )}
                        </div>

                        {/* Info Section */}
                        <div>
                          <span className="text-[10px] bg-zinc-800/80 text-zinc-400 px-2 py-0.5 rounded-md font-semibold tracking-wide uppercase">
                            {p.category?.name || "Uncategorized"}
                          </span>
                          <h3 className="font-bold text-zinc-100 mt-1.5 text-base capitalize line-clamp-1">{p.name}</h3>
                          <div className="flex items-center justify-between text-xs text-zinc-400 mt-2 font-mono">
                            <span>Stock: <span className="text-emerald-400 font-bold">{p.stock}</span> {p.stockUnit}</span>
                            <span className="text-zinc-500 text-[10px]">{dateStr}</span>
                          </div>
                        </div>
                      </div>

                      {/* Footer Controls */}
                      <div className="border-t border-zinc-800/80 pt-3 mt-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-base font-bold text-white font-mono">₹{p.sellingPrice}/-</span>
                          
                          {/* Visibility Switch */}
                          <div className="flex items-center gap-1.5">
                            <Switch 
                              checked={p.isVisible !== false}
                              onCheckedChange={() => toggleVisibilityMutation.mutate(p._id)}
                              className="data-[state=checked]:bg-emerald-600 scale-90"
                            />
                            <span className={`text-[9px] font-bold uppercase ${p.isVisible !== false ? "text-emerald-400" : "text-zinc-500"}`}>
                              {p.isVisible !== false ? "Visible" : "Hidden"}
                            </span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-end gap-2 border-t border-zinc-800/50 pt-2.5">
                          <Button 
                            onClick={() => openEditModal(p)} 
                            variant="outline" 
                            className="h-8 px-2.5 border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-white rounded-lg text-xs"
                          >
                            <Edit2 className="w-3.5 h-3.5 mr-1" /> Edit
                          </Button>
                          <Button 
                            onClick={() => { setPendingDeleteId(p._id); setDeleteDialogOpen(true); }} 
                            variant="ghost" 
                            className="h-8 px-2.5 text-zinc-500 hover:text-rose-400 hover:bg-rose-950/10 rounded-lg text-xs"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* 4.5 MODERN PAGINATION CONTROLS BAR */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-zinc-800/80 pt-5 mt-4">
            <p className="text-xs text-zinc-500 font-mono">
              Showing <span className="text-zinc-300 font-bold">{Math.min((currentPage - 1) * itemsPerPage + 1, totalItems)}</span> to{" "}
              <span className="text-zinc-300 font-bold">{Math.min(currentPage * itemsPerPage, totalItems)}</span> of{" "}
              <span className="text-zinc-300 font-bold">{totalItems}</span> products
            </p>
            
            <div className="flex items-center gap-1.5">
              {/* Previous Page */}
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                className="h-8 w-8 rounded-lg border border-zinc-800 bg-zinc-900/40 flex items-center justify-center text-zinc-400 hover:text-white disabled:opacity-30 disabled:hover:text-zinc-400 transition-all cursor-pointer hover:border-zinc-700"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {/* Numbered Pages */}
              {Array.from({ length: totalPages }, (_, idx) => {
                const pageNum = idx + 1;
                return (
                  <button
                    key={pageNum}
                    type="button"
                    onClick={() => setCurrentPage(pageNum)}
                    className={`h-8 min-w-8 px-2 rounded-lg text-xs font-bold transition-all border cursor-pointer ${currentPage === pageNum ? "bg-white text-black border-white" : "border-zinc-800 bg-zinc-900/20 text-zinc-400 hover:text-white hover:border-zinc-700"}`}
                  >
                    {pageNum}
                  </button>
                );
              })}

              {/* Next Page */}
              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                className="h-8 w-8 rounded-lg border border-zinc-800 bg-zinc-900/40 flex items-center justify-center text-zinc-400 hover:text-white disabled:opacity-30 disabled:hover:text-zinc-400 transition-all cursor-pointer hover:border-zinc-700"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
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
                                {/* Bulk Add URL Box */}
                  <div className="flex gap-2 items-center bg-slate-950 p-2.5 rounded-2xl border border-slate-800/80 mb-4">
                    <Input 
                      type="text" 
                      id="bulk-url-input"
                      placeholder="Paste image address (Google / URL)..." 
                      className="h-10 text-xs rounded-xl bg-slate-900 border-slate-800 text-slate-200 placeholder-slate-500 focus-visible:ring-1 focus-visible:ring-blue-500"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          const url = e.target.value.trim();
                          if (url) {
                            const updated = [...watchImages, url];
                            setValue("images", updated);
                            e.target.value = "";
                            toast.success("Image URL added successfully!");
                          }
                        }
                      }}
                    />
                    <Button
                      type="button"
                      className="h-10 px-3 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 shrink-0 flex items-center gap-1.5"
                      onClick={() => {
                        const inputEl = document.getElementById("bulk-url-input");
                        const url = inputEl?.value?.trim();
                        if (url) {
                          const updated = [...watchImages, url];
                          setValue("images", updated);
                          inputEl.value = "";
                          toast.success("Image URL added successfully!");
                        } else {
                          toast.error("Please paste a URL first.");
                        }
                      }}
                    >
                      <Plus className="w-3.5 h-3.5" /> Add URL
                    </Button>
                  </div>

                  {/* Grid layout of image slots */}
                  <div className="grid grid-cols-2 gap-3">
                    {watchImages.map((img, i) => (
                      <div key={i} className="relative aspect-square rounded-3xl border border-dashed border-slate-700 bg-slate-950 hover:bg-slate-900/60 overflow-hidden flex flex-col items-center justify-center p-2.5 transition-all">
                        <input
                          ref={(el) => (fileInputRefs.current[i] = el)}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleFileSelected(i, e)}
                        />
                        {img ? (
                          <>
                            <img src={img} className="h-full w-full object-contain rounded-2xl" alt="Product" />
                            <button
                              type="button"
                              onClick={(e) => handleRemoveImage(i, e)}
                              className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-950/90 text-white shadow-lg border border-slate-800 hover:text-rose-400 hover:scale-105 transition-all"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </>
                        ) : (
                          <div className="flex h-full w-full flex-col items-center justify-between py-1 text-center">
                            {/* Upload Trigger Click */}
                            <div 
                              onClick={() => triggerFilePicker(i)}
                              className="flex flex-col items-center gap-1 cursor-pointer w-full group py-2"
                            >
                              <UploadCloud className="h-6 w-6 text-slate-500 group-hover:text-blue-400 group-hover:scale-105 transition-all" />
                              <p className="text-xs font-semibold text-slate-400">Upload File</p>
                              <p className="text-[10px] text-slate-600">Slot {i + 1}</p>
                            </div>

                            {/* Paste URL for this Slot */}
                            <div className="w-full flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-xl p-1 mt-1" onClick={(e) => e.stopPropagation()}>
                              <Input 
                                type="text" 
                                id={`slot-url-input-${i}`}
                                placeholder="Paste slot URL..." 
                                className="h-6 text-[9px] rounded-lg bg-slate-950 border-none text-slate-200 placeholder-slate-500 w-full px-2 focus-visible:ring-0 focus-visible:ring-offset-0"
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    e.preventDefault();
                                    const url = e.target.value.trim();
                                    if (url) {
                                      const updated = [...watchImages];
                                      updated[i] = url;
                                      setValue("images", updated);
                                      toast.success("Slot URL loaded!");
                                    }
                                  }
                                }}
                              />
                              <Button
                                type="button"
                                size="sm"
                                className="h-6 px-2 bg-blue-600 text-white rounded-lg text-[9px] font-bold hover:bg-blue-700 shrink-0"
                                onClick={() => {
                                  const inputEl = document.getElementById(`slot-url-input-${i}`);
                                  const url = inputEl?.value?.trim();
                                  if (url) {
                                    const updated = [...watchImages];
                                    updated[i] = url;
                                    setValue("images", updated);
                                    toast.success("Slot URL loaded!");
                                  } else {
                                    toast.error("Paste image URL first.");
                                  }
                                }}
                              >
                                Load
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}

                    {/* Add Slot "+" Button */}
                    <div 
                      onClick={() => {
                        const updated = [...watchImages, ""];
                        setValue("images", updated);
                      }}
                      className="relative aspect-square border border-dashed border-slate-700 bg-slate-950 hover:bg-slate-900/60 hover:border-blue-500/80 rounded-3xl flex flex-col items-center justify-center cursor-pointer group transition-all"
                    >
                      <Plus className="h-6 w-6 text-slate-500 group-hover:text-blue-400 group-hover:scale-110 transition-all" />
                      <p className="text-xs font-semibold text-slate-450 mt-1.5 group-hover:text-slate-350">Add Slot</p>
                    </div>
                  </div>
                  {errors.images && <p className="text-xs text-red-500 mt-2">{errors.images.message}</p>}
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleImageEnhancement}
                    disabled={isEnhancingImage}
                    className="mt-4 w-full h-11 rounded-3xl border border-blue-700/50 bg-slate-950 text-sm text-blue-200 hover:bg-slate-900"
                  >
                    {isEnhancingImage ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin inline" />
                    ) : (
                      <Wand2 className="h-4 w-4 mr-2 inline" />
                    )}
                    {isEnhancingImage ? "Generating mockup..." : "Enhance product image"}
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
                    disabled={aiLoading}
                    className="mt-4 w-full h-11 rounded-3xl bg-blue-950 text-sm font-semibold text-blue-100 hover:bg-blue-900"
                  >
                    {aiLoading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin inline" />
                    ) : (
                      <Sparkles className="h-4 w-4 mr-2 inline" />
                    )}
                    {aiLoading ? "Generating..." : "Generate description"}
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
              {editingProduct && (
                <Button
                  type="button"
                  onClick={handleOpenNotifyModal}
                  className="mr-auto rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-sm px-4 py-2 flex items-center gap-1.5 shadow-lg shadow-amber-950/20"
                >
                  <Bell className="w-4 h-4" /> Notify Customers
                </Button>
              )}
              <Button
                type="button"
                variant="ghost"
                onClick={closeModal}
                className="rounded-2xl border border-slate-800 bg-slate-900/80 px-4 py-2 text-sm font-semibold text-slate-350 hover:bg-slate-800"
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

      {/* 5.5 NOTIFY CUSTOMERS MODAL */}
      <Dialog open={isNotifyModalOpen} onOpenChange={setIsNotifyModalOpen}>
        <DialogContent className="w-[92vw] sm:max-w-md md:max-w-3xl lg:max-w-4xl bg-zinc-950 border border-zinc-800 text-white rounded-[32px] overflow-hidden shadow-2xl p-6 flex flex-col max-h-[85vh] sm:max-h-[90vh]">
          <DialogHeader className="border-b border-zinc-800 pb-4 mb-4 shrink-0">
            <div className="flex items-center gap-2.5">
              <Bell className="text-amber-500 w-6 h-6 animate-bounce" />
              <DialogTitle className="text-xl font-bold tracking-wide">
                Notify Customers for Launch
              </DialogTitle>
            </div>
          </DialogHeader>

          {isEligibleLoading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3 my-auto shrink-0">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
              <p className="text-sm text-zinc-400">Scanning order histories for eligible category buyers...</p>
            </div>
          ) : (
            <>
              {/* Scrollable Container */}
              <div className="flex-1 min-h-0 overflow-y-auto pr-1 custom-scrollbar space-y-4 overflow-x-hidden">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 text-sm">
                  {/* Left Column: Customer analytics list (span 5 on desktop) */}
                  <div className="md:col-span-5 space-y-4">
                    {/* Recipient summary */}
                    <div className="w-full bg-zinc-900/40 border border-zinc-800 p-4.5 rounded-2xl flex items-center justify-between">
                      <div>
                        <h4 className="font-bold text-zinc-200 text-sm">Eligible Recipients</h4>
                        <p className="text-xs text-zinc-500 mt-0.5">Purchased from same category 2+ times.</p>
                      </div>
                      <span className={`px-4 py-1.5 rounded-full text-xs sm:text-sm font-bold font-mono ${eligibleCustomers.length > 0 ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-zinc-800 text-zinc-500 border border-zinc-700"}`}>
                        {eligibleCustomers.length} Buyers
                      </span>
                    </div>

                    {eligibleCustomers.length > 0 ? (
                      <div className="w-full border border-zinc-800 bg-zinc-900/10 p-4.5 rounded-2xl space-y-3">
                        <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Eligible Customer List</p>
                        <div className="max-h-36 md:max-h-80 overflow-y-auto space-y-2.5 pr-1 custom-scrollbar">
                          {eligibleCustomers.map((customer) => (
                            <div key={customer._id} className="flex justify-between items-center p-3 rounded-xl bg-zinc-950 border border-zinc-800/40">
                              <div className="space-y-0.5 min-w-0">
                                <p className="font-bold text-zinc-200 text-sm truncate capitalize">{customer.name}</p>
                                <p className="text-xs text-zinc-500 font-mono truncate">{customer.email}</p>
                              </div>
                              <span className="text-xs bg-blue-500/10 text-blue-400 border border-blue-500/20 px-3 py-1 rounded-full font-bold font-mono shrink-0">
                                {customer.qualifyingOrdersCount} Orders
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8 bg-zinc-900/20 border border-dashed border-zinc-800 rounded-2xl space-y-2">
                        <p className="text-sm text-rose-455 font-semibold">No eligible customers found for this category yet.</p>
                        <p className="text-xs text-zinc-550">Only customers with 2+ purchases in this category and a registered email will qualify.</p>
                      </div>
                    )}
                  </div>

                  {/* Right Column: Email composer (span 7 on desktop) */}
                  <div className="md:col-span-7 space-y-4">
                    {eligibleCustomers.length > 0 && (
                      <>
                        {/* Discount percentage input */}
                        <div className="w-full space-y-2">
                          <Label className="text-sm text-zinc-300 font-bold uppercase tracking-wider">Launch Discount Percentage (Optional)</Label>
                          <div className="flex gap-3">
                            <div className="relative flex-1">
                              <Input
                                type="number"
                                min="0"
                                max="100"
                                value={discountPercentage}
                                onChange={(e) => {
                                  let val = e.target.value;
                                  if (val !== "") {
                                    let num = Math.min(100, Math.max(0, Number(val)));
                                    setDiscountPercentage(String(num));
                                  } else {
                                    setDiscountPercentage("");
                                  }
                                }}
                                placeholder="e.g. 15"
                                className="bg-zinc-950 border border-zinc-800 rounded-xl h-12 pr-10 text-zinc-200 text-sm focus-visible:ring-1 focus-visible:ring-blue-500/20 focus-visible:border-blue-500/60 transition-all"
                              />
                              <Percent className="absolute right-3.5 top-3.5 w-5 h-5 text-zinc-550" />
                            </div>
                            <Button
                              type="button"
                              onClick={handleGenerateDraft}
                              disabled={isDraftLoading || isSendingNotifications}
                              className="bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-350 hover:text-white rounded-xl px-5 h-12 text-sm font-bold flex items-center gap-2 cursor-pointer shrink-0 transition-all"
                            >
                              {isDraftLoading ? (
                                <Loader2 className="w-4.5 h-4.5 animate-spin" />
                              ) : (
                                <Sparkles className="w-4.5 h-4.5" />
                              )}
                              Generate AI Draft
                            </Button>
                          </div>
                        </div>

                        {/* AI Editor fields - Always visible for manual entry */}
                        <div className="w-full space-y-3.5 pt-2.5 border-t border-zinc-800">
                          <div className="space-y-2">
                            <Label className="text-sm text-zinc-300 font-bold uppercase tracking-wider">Email Subject</Label>
                            <Input
                              type="text"
                              value={emailSubject}
                              onChange={(e) => setEmailSubject(e.target.value)}
                              placeholder="e.g. Exclusive Launch: New Stationery Arrivals!"
                              className="bg-zinc-950 border border-zinc-800 rounded-xl h-12 text-zinc-200 text-sm font-semibold focus-visible:ring-1 focus-visible:ring-blue-500/20 focus-visible:border-blue-500/60 transition-all"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-sm text-zinc-300 font-bold uppercase tracking-wider">Email Body Copy</Label>
                            <Textarea
                              value={emailBody}
                              onChange={(e) => setEmailBody(e.target.value)}
                              placeholder="Hello [Customer Name],&#10;&#10;Write your custom email announcement here, or click the 'Generate AI Draft' button above to let AI automatically compose a tailored copy..."
                              className="bg-zinc-950 border border-zinc-800 rounded-xl min-h-[180px] md:min-h-[260px] text-zinc-200 text-sm leading-relaxed resize-none p-4 focus-visible:ring-1 focus-visible:ring-blue-500/20 focus-visible:border-blue-500/60 transition-all"
                            />
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Progress Summary */}
              {sendSummary && (
                <div className="bg-amber-500/10 border border-amber-500/25 p-3 rounded-2xl text-center text-xs text-amber-300 font-bold font-mono shrink-0">
                  {sendSummary}
                </div>
              )}

              {/* Modal footer controls */}
              <div className="border-t border-zinc-800 pt-4 flex items-center justify-end gap-3 mt-4 shrink-0">
                <Button
                  type="button"
                  variant="ghost"
                  disabled={isSendingNotifications}
                  onClick={() => setIsNotifyModalOpen(false)}
                  className="rounded-xl border border-zinc-800 bg-zinc-900 px-5 py-2.5 text-sm font-bold text-zinc-350 hover:bg-zinc-800 h-12 transition-all"
                >
                  Cancel
                </Button>
                {eligibleCustomers.length > 0 && (
                  <Button
                    type="button"
                    onClick={handleSendNotifications}
                    disabled={isSendingNotifications || isDraftLoading || !emailSubject.trim() || !emailBody.trim()}
                    className="rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 shadow-md flex items-center gap-2 cursor-pointer h-12 transition-all"
                  >
                    {isSendingNotifications ? (
                      <Loader2 className="w-4.5 h-4.5 animate-spin" />
                    ) : (
                      <Send className="w-4.5 h-4.5" />
                    )}
                    {isSendingNotifications ? "Delivering..." : "Send Launch Notifications"}
                  </Button>
                )}
              </div>
            </>
          )}
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
 