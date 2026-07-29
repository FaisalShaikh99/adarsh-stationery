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
  ChevronDown,
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
import { Textarea } from "@/components/ui/textarea.jsx";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Switch } from "@/components/ui/switch";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { productSchema } from "@/schemas/products.schema";
import useFuzzySearch from "@/hooks/useFuzzySearch";
import VoiceSearchButton from "@/components/ui/voice-search-button";

function ProductManagementContent() {
  const searchParams = useSearchParams();
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

  useEffect(() => {
    if (searchParams.get("action") === "new") {
      setEditingProduct(null);
      setIsModalOpen(true);
    }
  }, [searchParams]);
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
      minStock: editingProduct.minStock !== undefined ? editingProduct.minStock : 10,
      supplier: editingProduct.supplier || "",
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
      minStock: 10,
      supplier: "",
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
          minStock: data.minStock,
          supplier: data.supplier,
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
      minStock: 10,
      supplier: "",
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
      minStock: p.minStock !== undefined ? p.minStock : 10,
      supplier: p.supplier || "",
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
      minStock: 10,
      supplier: "",
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
      <div className="flex h-[70vh] items-center justify-center">
        <LoadingSpinner size={240} label="Loading products inventory..." />
      </div>
    );
  }

  return (
    <div className="w-full max-w-full min-h-screen text-gray-900 p-2 sm:p-4 space-y-6 font-sans overflow-x-hidden">
 
      {/* 1. CLEAN PAGE HEADER */}
      <div className="flex flex-wrap gap-4 justify-between items-center border-b border-border-subtle pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-primary-50 border border-primary-100 text-primary-600">
              <Package className="h-5 w-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-gray-900">Products Catalog</h1>
            <span className="text-xs bg-primary-50 text-primary-700 px-3 py-1 rounded-lg border border-primary-200 font-bold capitalize">{viewMode} view</span>
          </div>
          <p className="mt-1 text-xs sm:text-sm text-zinc-600 font-medium">
            Manage product inventory, pricing, stock levels, and catalog items for Adarsh Stationery.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <Button onClick={handleCsvExport} variant="outline" className="border-border-subtle bg-bg-surface text-gray-900 hover:bg-primary-50 text-xs sm:text-sm font-semibold rounded-xl h-10 px-4 cursor-pointer shadow-xs btn-modern">
            <Download className="w-4 h-4 mr-2 text-primary-600" /> Export CSV
          </Button>
          <Button onClick={openCreateModal} className="bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl px-4 h-10 text-xs sm:text-sm shadow-xs cursor-pointer btn-modern">
            <Plus className="w-4 h-4 mr-2" /> Add New Product
          </Button>
        </div>
      </div>
 
      {/* 2. STATS CARDS GRID ROW */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Card 1: Product Counter (Custom #9B66D4 to #D8A5E9 Gradient) */}
        <div className="p-5 rounded-2xl bg-[linear-gradient(135deg,#9B66D4_0%,#B882E4_50%,#D8A5E9_100%)] text-white border border-purple-300/40 shadow-sm flex flex-col justify-between min-h-[110px]">
          <div className="flex items-center justify-between">
            <p className="text-xs text-purple-100 uppercase tracking-wider font-extrabold">Product Counter</p>
            <div className="p-2 rounded-xl bg-white/20 border border-white/30 text-white">
              <Package className="h-4.5 w-4.5" />
            </div>
          </div>
          <div>
            <p className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-white mt-2">
              {String(products.length).padStart(2, "0")}
            </p>
          </div>
        </div>

        {/* Card 2: Revenue (White Surface with Pink/Purple Icon) */}
        <div className="p-5 rounded-2xl bg-bg-surface border border-border-subtle shadow-xs flex flex-col justify-between min-h-[110px]">
          <div className="flex items-center justify-between">
            <p className="text-xs text-zinc-500 uppercase tracking-wider font-extrabold">Revenue</p>
            <div className="p-2 rounded-xl bg-pink-50 border border-pink-200 text-pink-600">
              <Sparkles className="h-4.5 w-4.5" />
            </div>
          </div>
          <div>
            <p className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-gray-900 mt-2">₹0</p>
            <span className="text-[10px] text-zinc-500 mt-1 block italic">Available after Orders module</span>
          </div>
        </div>

        {/* Card 3: Total Sold (White Surface with Purple Icon) */}
        <div className="p-5 rounded-2xl bg-bg-surface border border-border-subtle shadow-xs flex flex-col justify-between min-h-[110px]">
          <div className="flex items-center justify-between">
            <p className="text-xs text-zinc-500 uppercase tracking-wider font-extrabold">Total Sold</p>
            <div className="p-2 rounded-xl bg-purple-50 border border-purple-200 text-purple-600">
              <Wand2 className="h-4.5 w-4.5" />
            </div>
          </div>
          <div>
            <p className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-gray-900 mt-2">0</p>
            <span className="text-[10px] text-zinc-500 mt-1 block italic">Available after Orders module</span>
          </div>
        </div>

        {/* Card 4: Active Catalog (White Surface with Blue Icon) */}
        <div className="p-5 rounded-2xl bg-bg-surface border border-border-subtle shadow-xs flex flex-col justify-between min-h-[110px]">
          <div className="flex items-center justify-between">
            <p className="text-xs text-zinc-500 uppercase tracking-wider font-extrabold">Active Catalog</p>
            <div className="p-2 rounded-xl bg-blue-50 border border-blue-200 text-blue-600">
              <Plus className="h-4.5 w-4.5" />
            </div>
          </div>
          <div>
            <p className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-gray-900 mt-2">
              {String(products.filter(p => p.isVisible !== false).length).padStart(2, "0")}
            </p>
          </div>
        </div>
      </div>
 
      {/* 3. SEARCH & REFRESH WORKSPACE LAYER */}
      <div className="bg-bg-surface border border-border-subtle rounded-2xl p-4 sm:p-6 space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full">
            <div className="flex items-center w-full bg-bg-surface border border-border-subtle rounded-xl px-3.5 transition-all gap-2 h-11 focus-within:border-primary-400 focus-within:ring-1 focus-within:ring-primary-400">
              <Search className="h-4 w-4 text-zinc-400 shrink-0" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className="flex-1 bg-transparent border-none text-gray-900 placeholder-zinc-400 focus-visible:ring-0 focus-visible:ring-offset-0 focus:outline-none focus:ring-0 text-xs h-full p-0 shadow-none"
              />
              <VoiceSearchButton 
                onResult={(text) => setSearchQuery(text)} 
                className="shrink-0 h-8 w-8 text-primary-600"
              />
            </div>
            <Button onClick={handleRefreshAll} variant="outline" className="h-11 w-11 p-0 border-border-subtle bg-bg-surface text-gray-900 shrink-0 rounded-xl hover:bg-primary-50 btn-modern"><RefreshCw className="w-4 h-4 text-primary-600" /></Button>
          </div>
          
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {/* Brand Filter Dropdown Menu */}
            <div className="relative shrink-0 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setIsBrandDropdownOpen(!isBrandDropdownOpen)}
                className="w-full sm:w-auto flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-bg-surface border border-border-subtle text-xs font-semibold text-gray-900 hover:bg-primary-50 transition-colors shadow-xs"
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-zinc-500 font-normal">Brand:</span>
                  <span className="truncate max-w-[100px] text-primary-700 font-bold">
                    {selectedBrands.length === 0 ? "All Brands" : `${selectedBrands.length} Selected`}
                  </span>
                </div>
                <ChevronDown className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
              </button>

              {isBrandDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setIsBrandDropdownOpen(false)} />
                  <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white/95 backdrop-blur-2xl border border-border-subtle p-3 shadow-xl z-20 space-y-2 animate-in fade-in zoom-in-95 duration-150">
                    <div className="flex items-center justify-between pb-2 border-b border-border-subtle">
                      <span className="text-xs font-bold text-gray-900">Filter by Brand</span>
                      {selectedBrands.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setSelectedBrands([])}
                          className="text-[10px] text-rose-600 hover:underline font-semibold"
                        >
                          Reset
                        </button>
                      )}
                    </div>
                    <Input 
                      type="text"
                      placeholder="Search company name..."
                      value={brandSearchText}
                      onChange={(e) => setBrandSearchText(e.target.value)}
                      className="h-8 text-xs bg-white border-border-subtle text-gray-900 placeholder-zinc-400"
                    />
                    <div className="max-h-48 overflow-y-auto space-y-1 custom-scrollbar">
                      {brands
                        .filter(b => b.name.toLowerCase().includes(brandSearchText.toLowerCase()))
                        .map((brand) => {
                          const isChecked = selectedBrands.includes(brand._id);
                          return (
                            <label 
                              key={brand._id}
                              className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-primary-50 cursor-pointer text-xs text-gray-900 transition-colors select-none"
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
                                className="rounded border-border-subtle bg-white text-primary-600 focus:ring-0 w-3.5 h-3.5 cursor-pointer"
                              />
                              <span className="truncate capitalize font-semibold">{brand.name}</span>
                            </label>
                          );
                        })
                      }

                      {brands.filter(b => b.name.toLowerCase().includes(brandSearchText.toLowerCase())).length === 0 && (
                        <p className="text-[11px] text-zinc-500 text-center py-2">No brands found.</p>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* View Mode Toggle Switcher */}
            <div className="flex items-center gap-1 bg-bg-surface border border-border-subtle p-1 rounded-xl shrink-0 self-stretch sm:self-auto justify-center shadow-xs">
              <button
                type="button"
                onClick={() => setViewMode("table")}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${viewMode === "table" ? "bg-primary-600 text-white shadow-xs" : "text-zinc-600 hover:text-gray-900 hover:bg-primary-50/50"}`}
              >
                Table
              </button>
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${viewMode === "grid" ? "bg-primary-600 text-white shadow-xs" : "text-zinc-600 hover:text-gray-900 hover:bg-primary-50/50"}`}
              >
                Grid
              </button>
            </div>
          </div>
        </div>

        {/* ✨ Smart Did You Mean Ribbon Suggestion Box */}
        {spellingSuggestion && (
          <div className="text-xs text-primary-700 bg-primary-50 border border-primary-200 px-3 py-1.5 rounded-lg w-fit mx-auto font-medium">
            Did you mean:{" "}
            <button
              type="button"
              onClick={() => setSearchQuery(spellingSuggestion)}
              className="text-primary-700 font-extrabold hover:underline capitalize"
            >
              {spellingSuggestion}
            </button>
            {" "}?
          </div>
        )}

        {/* 🏷️ Horizontal Category-wise View filter */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none border-b border-border-subtle">
          <button
            type="button"
            onClick={() => setSelectedCategoryFilter("All")}
            className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all border cursor-pointer ${
              selectedCategoryFilter === "All" 
                ? "bg-primary-600 text-white border-primary-600 shadow-xs scale-[1.02]" 
                : "bg-white/80 text-gray-900 border-border-subtle hover:bg-primary-50/70"
            }`}
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
                className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all border cursor-pointer ${
                  selectedCategoryFilter === cat._id 
                    ? "bg-primary-600 text-white border-primary-600 shadow-xs scale-[1.02]" 
                    : "bg-white/80 text-gray-900 border-border-subtle hover:bg-primary-50/70"
                }`}
              >
                <span className="capitalize">{cat.name}</span> ({count})
              </button>
            );
          })}
        </div>
 
        {/* 4. CORE INVENTORY DISPLAY (TABLE / GRID) */}
        {viewMode === "table" ? (
          <div className="overflow-x-auto rounded-2xl border border-border-subtle bg-bg-surface shadow-xs">
            <Table className="min-w-[1100px] text-xs">
              <TableHeader className="bg-primary-50/90 border-b border-border-subtle">
                <TableRow className="border-b border-border-subtle uppercase text-[11px]">
                  <TableHead className="w-16 font-extrabold text-primary-800">Sr No.</TableHead>
                  <TableHead className="font-extrabold text-primary-800">Product Name</TableHead>
                  <TableHead className="font-extrabold text-primary-800">Category</TableHead>
                  <TableHead className="font-extrabold text-primary-800">Brand</TableHead>
                  <TableHead className="font-extrabold text-primary-800">Stock</TableHead>
                  <TableHead className="font-extrabold text-primary-800">Cost Price</TableHead>
                  <TableHead className="font-extrabold text-primary-800">Selling Price</TableHead>
                  <TableHead className="font-extrabold text-primary-800">Profit</TableHead>
                  <TableHead className="font-extrabold text-primary-800">Visibility</TableHead>
                  <TableHead className="font-extrabold text-primary-800">Date Added</TableHead>
                  <TableHead className="text-center w-32 font-extrabold text-primary-800">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {productsLoading ? (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center py-6 text-zinc-500 font-medium">
                      <LoadingSpinner size={140} label="Loading items..." className="mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : filteredProducts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={11} className="py-12 text-center text-zinc-500">
                      <div className="flex flex-col items-center justify-center space-y-4">
                        <p className="text-sm font-semibold text-gray-900">No products found matching criteria.</p>
                        <Button
                          onClick={openCreateModal}
                          className="bg-primary-600 text-white font-semibold hover:bg-primary-700 rounded-xl px-4 h-9 text-xs cursor-pointer shadow-xs btn-modern"
                        >
                          + Add New Product
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedProducts.map((p, index) => {
                    const cost = Number(p.costPrice || 0);
                    const selling = Number(p.sellingPrice || 0);
                    const profit = selling - cost;
                    const marginPercent = selling > 0 ? Number(((profit / selling) * 100).toFixed(0)) : 0;

                    let colorClass = "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
                    if (profit < 0) {
                      colorClass = "bg-rose-500/10 text-rose-600 border-rose-500/20";
                    } else if (marginPercent <= 15) {
                      colorClass = "bg-amber-500/10 text-amber-600 border-amber-500/20";
                    }

                    return (
                      <TableRow key={p._id} className="border-b border-border-subtle hover:bg-primary-50/50 transition-colors text-gray-900 bg-white/80">
                        <TableCell className="font-mono text-zinc-600 py-3 font-bold text-xs">{(currentPage - 1) * itemsPerPage + index + 1}</TableCell>
                        
                        {/* Product Name with Thumbnail */}
                        <TableCell className="py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-white border border-border-subtle p-1 flex items-center justify-center shrink-0 shadow-2xs">
                              {p.images?.[0] ? (
                                <img 
                                  src={p.images[0]} 
                                  alt={p.name} 
                                  className="w-full h-full object-contain rounded-lg"
                                  referrerPolicy="no-referrer"
                                />
                              ) : (
                                <Package className="w-5 h-5 text-zinc-400" />
                              )}
                            </div>
                            <span className="font-extrabold text-gray-900 text-xs sm:text-sm tracking-tight">{p.name}</span>
                          </div>
                        </TableCell>

                        {/* Category Tag */}
                        <TableCell className="py-3">
                          <span className="bg-primary-50 text-primary-700 border border-primary-200 px-2.5 py-1 rounded-lg text-xs font-black uppercase">
                            {p.category?.name || "Uncategorized"}
                          </span>
                        </TableCell>

                        {/* Brand with Logo */}
                        <TableCell className="py-3">
                          <div className="flex items-center gap-2">
                            {p.company?.logo ? (
                              <div className="w-7 h-7 rounded-lg bg-white border border-border-subtle p-0.5 flex items-center justify-center shrink-0 shadow-2xs">
                                <img src={p.company.logo} alt="" className="w-full h-full object-contain rounded" referrerPolicy="no-referrer" />
                              </div>
                            ) : null}
                            <span className="font-extrabold text-gray-900 text-xs sm:text-sm">{p.company?.name || "—"}</span>
                          </div>
                        </TableCell>

                        <TableCell className="py-3 font-mono font-black text-emerald-600 text-xs sm:text-sm">{p.stock} {p.stockUnit}</TableCell>
                        <TableCell className="font-mono text-xs sm:text-sm py-3 text-zinc-600 font-bold">₹{cost}/-</TableCell>
                        <TableCell className="font-mono text-xs sm:text-sm py-3 text-gray-900 font-black">₹{selling}/-</TableCell>
                        <TableCell className="font-mono text-xs py-3">
                          <span className={`inline-flex flex-col px-2.5 py-1 rounded-xl border text-xs ${colorClass}`}>
                            <span className="font-black">₹{profit}/-</span>
                            <span className="text-[10px] font-bold opacity-90">({marginPercent}%)</span>
                          </span>
                        </TableCell>
                        <TableCell className="py-3">
                          <div className="flex items-center gap-2">
                            <Switch 
                              checked={p.isVisible !== false}
                              onCheckedChange={() => toggleVisibilityMutation.mutate(p._id)}
                              className="data-[state=checked]:bg-emerald-600 scale-90 cursor-pointer"
                            />
                            <span className={`text-xs font-black uppercase min-w-[55px] ${p.isVisible !== false ? "text-emerald-600" : "text-zinc-500"}`}>
                              {p.isVisible !== false ? "Visible" : "Hidden"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-xs text-zinc-600 py-3 font-bold">
                          {p.createdAt ? (
                            new Date(p.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                          ) : "—"}
                        </TableCell>
                        <TableCell className="text-center py-3">
                          <div className="flex justify-center gap-2">
                            <Button onClick={() => openEditModal(p)} variant="outline" className="h-8 px-2.5 border-border-subtle bg-bg-surface text-gray-900 hover:text-primary-700 hover:bg-primary-50 rounded-xl text-xs font-bold gap-1 cursor-pointer"><Edit2 className="w-3.5 h-3.5 text-primary-600" /> Edit</Button>
                            <Button onClick={() => { setPendingDeleteId(p._id); setDeleteDialogOpen(true); }} variant="ghost" className="h-8 w-8 p-0 text-rose-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl cursor-pointer"><Trash2 className="w-3.5 h-3.5" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        ) : (
          /* Grid View Cards Frame */
          <div className="space-y-6">
            {productsLoading ? (
              <div className="text-center py-12 text-zinc-500 font-medium">
                <LoadingSpinner size={160} label="Loading items..." className="mx-auto" />
              </div>
            ) : paginatedProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center p-12 border border-dashed border-border-subtle bg-bg-surface rounded-2xl space-y-4 min-h-[300px]">
                <div className="w-12 h-12 rounded-full bg-primary-50 flex items-center justify-center border border-primary-200 text-primary-600">
                  <Package className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-gray-900">No products found matching criteria</h3>
                  <p className="text-xs text-zinc-500 max-w-sm">No items match your search filters or catalog selection.</p>
                </div>
                <Button 
                  onClick={openCreateModal}
                  className="bg-primary-600 text-white font-semibold hover:bg-primary-700 rounded-xl px-4 h-9 text-xs cursor-pointer shadow-xs btn-modern"
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

                  const costVal = p.costPrice || 0;
                  const sellVal = p.sellingPrice || 0;
                  const profitVal = sellVal - costVal;
                  const marginPct = sellVal > 0 ? Math.round((profitVal / sellVal) * 100) : 0;

                  let profitColorClass = "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
                  if (profitVal < 0) {
                    profitColorClass = "bg-rose-500/10 text-rose-600 border-rose-500/20";
                  } else if (marginPct <= 15) {
                    profitColorClass = "bg-amber-500/10 text-amber-600 border-amber-500/20";
                  }

                  return (
                    <div key={p._id} className="bg-bg-surface border border-border-subtle rounded-2xl p-4 flex flex-col justify-between hover:border-primary-300 transition-all group shadow-xs text-gray-900">
                      <div className="space-y-3">
                        {/* Product Image Frame */}
                        <div className="relative h-44 w-full bg-white rounded-xl border border-border-subtle flex items-center justify-center p-3 overflow-hidden shadow-xs shrink-0">
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
                              className="absolute top-2.5 left-2.5 h-8 object-contain max-w-[85px] bg-white p-1 rounded-lg border border-border-subtle shadow-xs" 
                              referrerPolicy="no-referrer"
                            />
                          )}
                        </div>

                        {/* Info Section */}
                        <div>
                          <span className="text-[10px] bg-primary-50 text-primary-700 border border-primary-200 px-2 py-0.5 rounded-md font-bold tracking-wide uppercase">
                            {p.category?.name || "Uncategorized"}
                          </span>
                          <h3 className="font-extrabold text-gray-900 mt-1.5 text-sm capitalize line-clamp-1">{p.name}</h3>
                          <div className="flex items-center justify-between text-xs text-zinc-600 mt-2 font-mono">
                            <span>Stock: <span className="text-emerald-600 font-bold">{p.stock}</span> {p.stockUnit}</span>
                            <span className="text-zinc-500 text-[10px]">{dateStr}</span>
                          </div>
                        </div>
                      </div>

                      {/* Footer Controls & Pricing */}
                      <div className="border-t border-border-subtle pt-3 mt-4 space-y-3">
                        {/* Pricing & Profit Card */}
                        <div className="bg-white/80 border border-border-subtle p-2.5 rounded-xl space-y-1">
                          <div className="flex items-center justify-between text-xs font-mono">
                            <span className="text-zinc-500">Cost: ₹{costVal}</span>
                            <span className="text-gray-900 font-extrabold text-sm">Sell: ₹{sellVal}</span>
                          </div>
                          <div className="flex items-center justify-between pt-1 border-t border-border-subtle/60 text-[11px] font-mono">
                            <span className="text-zinc-500 font-semibold">PROFIT</span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${profitColorClass}`}>
                              ₹{profitVal} ({marginPct}%)
                            </span>
                          </div>
                        </div>

                        {/* Visibility Switch */}
                        <div className="flex items-center justify-between pt-1">
                          <span className="text-xs font-black text-gray-900">Store Visibility</span>
                          <div className="flex items-center gap-2">
                            <Switch 
                              checked={p.isVisible !== false}
                              onCheckedChange={() => toggleVisibilityMutation.mutate(p._id)}
                              className="data-[state=checked]:bg-emerald-600 cursor-pointer"
                            />
                            <span className={`text-xs font-black uppercase min-w-[50px] ${p.isVisible !== false ? "text-emerald-600" : "text-zinc-500"}`}>
                              {p.isVisible !== false ? "Visible" : "Hidden"}
                            </span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-end gap-2 border-t border-border-subtle pt-3 mt-1">
                          <Button 
                            onClick={() => openEditModal(p)} 
                            variant="outline" 
                            className="h-8 px-3 border-border-subtle bg-bg-surface text-gray-900 hover:text-primary-700 hover:bg-primary-50 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer shadow-2xs btn-modern"
                          >
                            <Edit2 className="w-3.5 h-3.5 text-primary-600" /> Edit
                          </Button>
                          <Button 
                            onClick={() => { setPendingDeleteId(p._id); setDeleteDialogOpen(true); }} 
                            variant="ghost" 
                            className="h-8 w-8 p-0 text-rose-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all cursor-pointer"
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

      {/* 5. ADD / EDIT PRODUCT MODAL (LIGHT SAAS PURPLE THEME) */}
      <Dialog open={isModalOpen} onOpenChange={(val) => !val && closeModal()}>
        <DialogContent className="max-w-[95vw] w-full sm:max-w-4xl lg:max-w-6xl max-h-[92vh] overflow-y-auto bg-white/95 backdrop-blur-2xl border border-border-subtle text-gray-900 rounded-2xl sm:rounded-[28px] shadow-2xl flex flex-col p-0 font-sans custom-scrollbar">
 
          {/* Header */}
          <DialogHeader className="flex items-center justify-between gap-4 p-4 sm:p-5 border-b border-border-subtle bg-primary-50/80 shrink-0">
            <div className="flex items-center gap-2 sm:gap-2.5">
              <Sparkles className="text-primary-600 w-4.5 h-4.5 sm:w-5 sm:h-5" />
              <DialogTitle className="text-lg sm:text-xl font-black text-gray-900 tracking-tight">
                {editingProduct ? "Edit Product Profile" : "Add New Product"}
              </DialogTitle>
            </div>
          </DialogHeader>
 
          <form onSubmit={handleFormSubmit(onSubmit)} className="flex flex-col flex-1 min-h-0">
            <div className="flex flex-col lg:flex-row flex-1 min-h-0">
              <div className="lg:w-[58%] min-h-0 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
                <div className="rounded-2xl sm:rounded-[24px] border border-border-subtle bg-bg-surface p-4 sm:p-6 shadow-xs">
                  <div className="mb-5">
                    <p className="text-xs uppercase tracking-wider font-black text-primary-700">Product details</p>
                    <h2 className="mt-1 text-xl font-black text-gray-900">Basic product information</h2>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Name */}
                    <div className="space-y-2 sm:col-span-2">
                      <Label className="text-xs text-gray-900 font-black">Product Name</Label>
                      <Input
                        type="text"
                        placeholder="Enter Product Name"
                        {...register("name")}
                        className="bg-white border border-border-subtle rounded-2xl h-11 text-gray-900 text-xs font-semibold placeholder-zinc-400 focus-visible:ring-1 focus-visible:ring-primary-400 focus-visible:border-primary-400 transition-all shadow-2xs"
                      />
                      {errors.name && <p className="text-xs text-rose-600 font-bold mt-1">{errors.name.message}</p>}
                    </div>

                    {/* Category */}
                    <div className="space-y-2">
                      <Label className="text-xs text-gray-900 font-black">Select Category</Label>
                      <select
                        {...register("category")}
                        className="w-full bg-white border border-border-subtle rounded-2xl h-11 px-4 text-xs font-bold text-gray-900 focus:outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-400 transition-all appearance-none cursor-pointer shadow-2xs"
                        style={{
                          backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%2371717a' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 12 15 18 9'></polyline></svg>")`,
                          backgroundRepeat: 'no-repeat',
                          backgroundPosition: 'right 16px center',
                          backgroundSize: '14px'
                        }}
                      >
                        <option value="" className="bg-white text-zinc-500">-- Choose Option --</option>
                        {categories.map(opt => (
                          <option key={opt._id} value={opt._id} className="bg-white text-gray-900 font-bold">
                            {opt.name}
                          </option>
                        ))}
                      </select>
                      {errors.category && <p className="text-xs text-rose-600 font-bold mt-1">{errors.category.message}</p>}
                    </div>

                    {/* Brand */}
                    <div className="space-y-2">
                      <Label className="text-xs text-gray-900 font-black">Select Brand/Company</Label>
                      <select
                        {...register("company")}
                        className="w-full bg-white border border-border-subtle rounded-2xl h-11 px-4 text-xs font-bold text-gray-900 focus:outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-400 transition-all appearance-none cursor-pointer shadow-2xs"
                        style={{
                          backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%2371717a' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 12 15 18 9'></polyline></svg>")`,
                          backgroundRepeat: 'no-repeat',
                          backgroundPosition: 'right 16px center',
                          backgroundSize: '14px'
                        }}
                      >
                        <option value="" className="bg-white text-zinc-500">-- Choose Option --</option>
                        {brands.map(opt => (
                          <option key={opt._id} value={opt._id} className="bg-white text-gray-900 font-bold">
                            {opt.name}
                          </option>
                        ))}
                      </select>
                      {errors.company && <p className="text-xs text-rose-600 font-bold mt-1">{errors.company.message}</p>}
                    </div>

                    {/* Stock */}
                    <div className="space-y-2">
                      <Label className="text-xs text-gray-900 font-black">Enter Stock</Label>
                      <Input
                        type="number"
                        placeholder="0"
                        {...register("stock")}
                        className="bg-white border border-border-subtle rounded-2xl h-11 text-gray-900 text-xs font-semibold placeholder-zinc-400 focus-visible:ring-1 focus-visible:ring-primary-400 focus-visible:border-primary-400 transition-all shadow-2xs"
                      />
                      {errors.stock && <p className="text-xs text-rose-600 font-bold mt-1">{errors.stock.message}</p>}
                    </div>

                    {/* Units */}
                    <div className="space-y-2">
                      <Label className="text-xs text-gray-900 font-black">Select Units</Label>
                      <select
                        {...register("stockUnit")}
                        className="w-full bg-white border border-border-subtle rounded-2xl h-11 px-4 text-xs font-bold text-gray-900 focus:outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-400 transition-all appearance-none cursor-pointer shadow-2xs"
                        style={{
                          backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%2371717a' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 12 15 18 9'></polyline></svg>")`,
                          backgroundRepeat: 'no-repeat',
                          backgroundPosition: 'right 16px center',
                          backgroundSize: '14px'
                        }}
                      >
                        <option value="Pcs" className="bg-white text-gray-900 font-bold">Pcs</option>
                        <option value="Boxes" className="bg-white text-gray-900 font-bold">Boxes</option>
                      </select>
                      {errors.stockUnit && <p className="text-xs text-rose-600 font-bold mt-1">{errors.stockUnit.message}</p>}
                    </div>

                    {/* Cost Price */}
                    <div className="space-y-2">
                      <Label className="text-xs text-gray-900 font-black">Cost Price (₹)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        {...register("costPrice")}
                        className="bg-white border border-border-subtle rounded-2xl h-11 text-gray-900 text-xs font-semibold placeholder-zinc-400 focus-visible:ring-1 focus-visible:ring-primary-400 focus-visible:border-primary-400 transition-all shadow-2xs"
                      />
                      {errors.costPrice && <p className="text-xs text-rose-600 font-bold mt-1">{errors.costPrice.message}</p>}
                    </div>

                    {/* Selling Price */}
                    <div className="space-y-2">
                      <Label className="text-xs text-gray-900 font-black">Selling Price (₹)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        {...register("sellingPrice")}
                        className="bg-white border border-border-subtle rounded-2xl h-11 text-gray-900 text-xs font-semibold placeholder-zinc-400 focus-visible:ring-1 focus-visible:ring-primary-400 focus-visible:border-primary-400 transition-all shadow-2xs"
                      />
                      {errors.sellingPrice && <p className="text-xs text-rose-600 font-bold mt-1">{errors.sellingPrice.message}</p>}
                    </div>

                    {/* Min Stock Threshold */}
                    <div className="space-y-2">
                      <Label className="text-xs text-gray-900 font-black">Min Stock Threshold</Label>
                      <Input
                        type="number"
                        placeholder="10"
                        {...register("minStock")}
                        className="bg-white border border-border-subtle rounded-2xl h-11 text-gray-900 text-xs font-semibold placeholder-zinc-400 focus-visible:ring-1 focus-visible:ring-primary-400 focus-visible:border-primary-400 transition-all shadow-2xs"
                      />
                      {errors.minStock && <p className="text-xs text-rose-600 font-bold mt-1">{errors.minStock.message}</p>}
                    </div>

                    {/* Supplier / Vendor */}
                    <div className="space-y-2">
                      <Label className="text-xs text-gray-900 font-black">Supplier / Vendor</Label>
                      <Input
                        type="text"
                        placeholder="e.g. Navneet Supplies"
                        {...register("supplier")}
                        className="bg-white border border-border-subtle rounded-2xl h-11 text-gray-900 text-xs font-semibold placeholder-zinc-400 focus-visible:ring-1 focus-visible:ring-primary-400 focus-visible:border-primary-400 transition-all shadow-2xs"
                      />
                      {errors.supplier && <p className="text-xs text-rose-600 font-bold mt-1">{errors.supplier.message}</p>}
                    </div>
                  </div>
                </div>
              </div>
 
              <div className="lg:w-[42%] min-h-0 overflow-y-auto p-6 space-y-6">
                <div className="rounded-[24px] border border-border-subtle bg-bg-surface p-6 shadow-xs">
                  <div className="flex items-center justify-between gap-3 mb-4">
                    <div>
                      <p className="text-xs uppercase tracking-wider font-black text-primary-700">Product images</p>
                      <h3 className="mt-1 text-lg font-black text-gray-900">Upload gallery</h3>
                    </div>
                    <span className="rounded-full bg-primary-50 border border-primary-200 px-3 py-1 text-xs font-bold text-primary-700">Studio Enhancer</span>
                  </div>
                  {/* Bulk Add URL Box */}
                  <div className="flex gap-2 items-center bg-white p-2.5 rounded-2xl border border-border-subtle mb-4 shadow-2xs">
                    <Input 
                      type="text" 
                      id="bulk-url-input"
                      placeholder="Paste image address (Google / URL)..." 
                      className="h-9 text-xs rounded-xl bg-white border border-border-subtle text-gray-900 placeholder-zinc-400 focus-visible:ring-1 focus-visible:ring-primary-400"
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
                      className="h-9 px-3 bg-primary-600 text-white rounded-xl text-xs font-bold hover:bg-primary-700 shrink-0 flex items-center gap-1.5 cursor-pointer shadow-xs"
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
                      <div key={i} className="relative aspect-square rounded-2xl border-2 border-dashed border-border-subtle bg-white hover:border-primary-400 overflow-hidden flex flex-col items-center justify-center p-2.5 transition-all shadow-2xs">
                        <input
                          ref={(el) => (fileInputRefs.current[i] = el)}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleFileSelected(i, e)}
                        />
                        {img ? (
                          <>
                            <img src={img} className="h-full w-full object-contain rounded-xl" alt="Product" />
                            <button
                              type="button"
                              onClick={(e) => handleRemoveImage(i, e)}
                              className="absolute right-2.5 top-2.5 inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-gray-900 shadow-md border border-border-subtle hover:text-rose-600 hover:scale-105 transition-all cursor-pointer"
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
                              <UploadCloud className="h-6 w-6 text-zinc-400 group-hover:text-primary-600 group-hover:scale-105 transition-all" />
                              <p className="text-xs font-bold text-gray-900">Upload File</p>
                              <p className="text-[10px] text-zinc-500 font-mono">Slot {i + 1}</p>
                            </div>

                            {/* Paste URL for this Slot */}
                            <div className="w-full flex items-center gap-1 bg-primary-50/60 border border-border-subtle rounded-xl p-1 mt-1" onClick={(e) => e.stopPropagation()}>
                              <Input 
                                type="text" 
                                id={`slot-url-input-${i}`}
                                placeholder="Paste URL..." 
                                className="h-6 text-[9px] rounded-lg bg-white border border-border-subtle text-gray-900 placeholder-zinc-400 w-full px-2 focus-visible:ring-0 focus-visible:ring-offset-0"
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
                                className="h-6 px-2 bg-primary-600 text-white rounded-lg text-[9px] font-bold hover:bg-primary-700 shrink-0 cursor-pointer"
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
                      className="relative aspect-square border-2 border-dashed border-border-subtle bg-white hover:bg-primary-50/50 hover:border-primary-400 rounded-2xl flex flex-col items-center justify-center cursor-pointer group transition-all shadow-2xs"
                    >
                      <Plus className="h-6 w-6 text-zinc-400 group-hover:text-primary-600 group-hover:scale-110 transition-all" />
                      <p className="text-xs font-bold text-gray-900 mt-1.5">Add Slot</p>
                    </div>
                  </div>
                  {errors.images && <p className="text-xs text-rose-600 font-bold mt-2">{errors.images.message}</p>}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleImageEnhancement}
                    disabled={isEnhancingImage}
                    className="mt-4 w-full h-11 rounded-2xl border-border-subtle bg-white text-xs font-bold text-primary-700 hover:bg-primary-50 cursor-pointer btn-modern"
                  >
                    {isEnhancingImage ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin inline" />
                    ) : (
                      <Wand2 className="h-4 w-4 mr-2 inline text-primary-600" />
                    )}
                    {isEnhancingImage ? "Generating mockup..." : "Enhance product image"}
                  </Button>
                </div>
 
                <div className="rounded-[24px] border border-border-subtle bg-bg-surface p-6 shadow-xs">
                  <div className="mb-4">
                    <p className="text-xs uppercase tracking-wider font-black text-primary-700">Description</p>
                    <h3 className="mt-1 text-lg font-black text-gray-900">Product summary</h3>
                  </div>
                  <Textarea
                    {...register("description")}
                    placeholder="Write a short product description..."
                    className="min-h-[180px] w-full rounded-2xl border border-border-subtle bg-white px-4 py-3 text-xs text-gray-900 placeholder-zinc-400 focus-visible:border-primary-400 focus-visible:ring-1 focus-visible:ring-primary-400 resize-none font-medium shadow-2xs"
                  />
                  <Button
                    type="button"
                    onClick={handleAiDescriptionGeneration}
                    disabled={aiLoading}
                    className="mt-4 w-full h-11 rounded-2xl bg-primary-600 text-xs font-bold text-white hover:bg-primary-700 cursor-pointer shadow-xs btn-modern"
                  >
                    {aiLoading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin inline" />
                    ) : (
                      <Sparkles className="h-4 w-4 mr-2 inline" />
                    )}
                    {aiLoading ? "Generating..." : "Generate AI description"}
                  </Button>
                  {aiDescriptions.length > 0 && (
                    <div className="mt-4 space-y-3">
                      {aiDescriptions.map((desc, idx) => (
                        <div
                          key={idx}
                          onClick={() => setValue("description", desc)}
                          className="cursor-pointer rounded-2xl border border-border-subtle bg-white p-3.5 text-xs text-gray-900 transition hover:border-primary-400 hover:bg-primary-50/60 shadow-2xs font-medium leading-relaxed"
                        >
                          {desc}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
 
            <div className="shrink-0 border-t border-border-subtle bg-white/90 backdrop-blur-xl p-4 flex items-center justify-end gap-3">
              {editingProduct && (
                <Button
                  type="button"
                  onClick={handleOpenNotifyModal}
                  className="mr-auto rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs px-4.5 h-11 flex items-center gap-2 cursor-pointer shadow-xs"
                >
                  <Bell className="w-4 h-4" /> Notify Customers
                </Button>
              )}
              <Button
                type="button"
                variant="outline"
                onClick={closeModal}
                className="rounded-2xl border border-border-subtle bg-white px-5 h-11 text-xs font-bold text-gray-900 hover:bg-primary-50 cursor-pointer shadow-2xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={productFormMutation.isPending}
                className="rounded-2xl bg-primary-600 px-6 h-11 text-xs font-black text-white shadow-md hover:bg-primary-700 cursor-pointer btn-modern"
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

export default function ProductManagementPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <ProductManagementContent />
    </Suspense>
  );
}
