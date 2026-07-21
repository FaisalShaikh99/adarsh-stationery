"use client";
 
import { useState, useRef, useEffect, useMemo } from "react";
import { toast } from "sonner";
import {
  Loader2,
  Plus,
  Download,
  RefreshCw,
  X,
  ChevronLeft,
  ChevronRight,
  Search,
  Package,
  TrendingUp,
  Coins,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  History,
  SlidersHorizontal,
  Eye,
} from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Switch } from "@/components/ui/switch";
 
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import useFuzzySearch from "@/hooks/useFuzzySearch";
import VoiceSearchButton from "@/components/ui/voice-search-button";
 
export default function InventoryManagementPage() {
  const queryClient = useQueryClient();
 
  // Fetch Dropdown data
  const { data: categoriesData } = useQuery({
    queryKey: ["categoriesDropdown"],
    queryFn: async () => {
      const res = await axios.get("/api/admin/categories");
      return res.data?.data || [];
    },
    staleTime: 5 * 60 * 1000
  });
  const categories = categoriesData || [];
 
  const { data: brandsData } = useQuery({
    queryKey: ["brandsDropdown"],
    queryFn: async () => {
      const res = await axios.get("/api/admin/brands");
      return res.data?.data || [];
    },
    staleTime: 5 * 60 * 1000
  });
  const brands = brandsData || [];
 
  // Core Products Query
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
 
  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState("All");
  const [selectedBrands, setSelectedBrands] = useState([]);
  const [brandSearchText, setBrandSearchText] = useState("");
  const [isBrandDropdownOpen, setIsBrandDropdownOpen] = useState(false);
  const [selectedStockStatus, setSelectedStockStatus] = useState("All");
  const [sortBy, setSortBy] = useState("name-asc");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
 
  // Inline edit & Optimistic UI states
  const [localOverrides, setLocalOverrides] = useState({});
  const [editingProductId, setEditingProductId] = useState(null);
  const [editValue, setEditValue] = useState("");
 
  // Drawer states
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedDetailProduct, setSelectedDetailProduct] = useState(null);
 
  // Stock Adjust Modal States
  const [isAdjustStockOpen, setIsAdjustStockOpen] = useState(false);
  const [selectedAdjustProduct, setSelectedAdjustProduct] = useState(null);
  const [adjustForm, setAdjustForm] = useState({ quantity: "1", type: "add", reason: "Physical count" });
 
  // History Modal States
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [selectedHistoryProduct, setSelectedHistoryProduct] = useState(null);
 
  const handleRefreshAll = async () => {
    try {
      await Promise.all([
        refetchProducts(),
        queryClient.invalidateQueries({ queryKey: ["categoriesDropdown"] }),
        queryClient.invalidateQueries({ queryKey: ["brandsDropdown"] })
      ]);
      toast.success("Inventory cache re-synced successfully!");
    } catch {
      toast.error("Failed to synchronize inventory parameters.");
    }
  };
 
  // Stock Level Adjustment Mutation (updating the product record stock attribute via PUT /api/admin/products)
  const adjustStockMutation = useMutation({
    mutationFn: async ({ product, quantity, type, reason }) => {
      let nextStock = product.stock || 0;
      const qtyNum = Number(quantity);
      if (type === "add") {
        nextStock += qtyNum;
      } else if (type === "subtract") {
        nextStock = Math.max(0, nextStock - qtyNum);
      } else if (type === "set") {
        nextStock = Math.max(0, qtyNum);
      }
 
      const response = await axios.put(`/api/admin/products?_id=${product._id}`, {
        name: product.name,
        category: product.category?._id || product.category,
        company: product.company?._id || product.company,
        stock: nextStock,
        stockUnit: product.stockUnit || "Pcs",
        costPrice: product.costPrice,
        sellingPrice: product.sellingPrice,
        description: product.description || "",
        images: product.images || [],
        isActive: product.isActive !== false
      });
 
      // Save logs in localStorage for localized auditing logs
      const logs = JSON.parse(localStorage.getItem(`stock_history_${product._id}`) || "[]");
      logs.unshift({
        type,
        quantity: qtyNum,
        reason,
        previousStock: product.stock || 0,
        newStock: nextStock,
        date: new Date().toISOString()
      });
      localStorage.setItem(`stock_history_${product._id}`, JSON.stringify(logs));
 
      return { response: response.data, updatedProduct: { ...product, stock: nextStock } };
    },
    onSuccess: (data) => {
      toast.success("Stock level updated successfully!");
      setIsAdjustStockOpen(false);
      
      // Update local override state to match
      setLocalOverrides(prev => {
        const updated = { ...prev };
        delete updated[data.updatedProduct._id];
        return updated;
      });
      
      queryClient.invalidateQueries({ queryKey: ["inventoryProducts"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      
      // Update local drawers if active
      if (selectedDetailProduct && selectedDetailProduct._id === data.updatedProduct._id) {
        setSelectedDetailProduct(data.updatedProduct);
      }
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to update stock level.");
    }
  });

  const handleOptimisticAdjust = (product, delta, type) => {
    const currentStock = localOverrides[product._id] !== undefined ? localOverrides[product._id] : (product.stock || 0);
    const newStock = type === "add" ? currentStock + delta : Math.max(0, currentStock - delta);
    
    // 1. Update UI optimistically
    setLocalOverrides(prev => ({
      ...prev,
      [product._id]: newStock
    }));
    
    // 2. Fire mutation
    adjustStockMutation.mutate({
      product: { ...product, stock: currentStock },
      quantity: delta,
      type,
      reason: "Rapid adjustment"
    }, {
      onError: (err) => {
        // Rollback
        setLocalOverrides(prev => ({
          ...prev,
          [product._id]: currentStock
        }));
      }
    });
  };

  const handleInlineStockSave = (product, targetStock) => {
    if (isNaN(targetStock) || targetStock < 0) {
      toast.error("Please enter a valid non-negative stock quantity.");
      return;
    }
    const currentStock = localOverrides[product._id] !== undefined ? localOverrides[product._id] : (product.stock || 0);
    if (targetStock === currentStock) {
      setEditingProductId(null);
      return;
    }
    
    const delta = Math.abs(targetStock - currentStock);
    const type = targetStock > currentStock ? "add" : "subtract";
    
    setEditingProductId(null);
    
    // 1. Update UI optimistically
    setLocalOverrides(prev => ({
      ...prev,
      [product._id]: targetStock
    }));
    
    // 2. Fire mutation
    adjustStockMutation.mutate({
      product: { ...product, stock: currentStock },
      quantity: delta,
      type,
      reason: "Manual inline override"
    }, {
      onError: (err) => {
        // Rollback
        setLocalOverrides(prev => ({
          ...prev,
          [product._id]: currentStock
        }));
      }
    });
  };
 
  const handleAdjustStockSubmit = (e) => {
    e.preventDefault();
    const qtyNum = Number(adjustForm.quantity);
    if (isNaN(qtyNum) || qtyNum <= 0) {
      toast.error("Please enter a valid quantity.");
      return;
    }
    adjustStockMutation.mutate({
      product: selectedAdjustProduct,
      quantity: qtyNum,
      type: adjustForm.type,
      reason: adjustForm.reason
    });
  };
 
  // Fetch Local Audit History
  const getProductHistory = (product) => {
    if (!product) return [];
    const localLogs = JSON.parse(localStorage.getItem(`stock_history_${product._id}`) || "[]");
    if (localLogs.length === 0) {
      return [
        {
          type: "initial",
          quantity: product.stock || 0,
          reason: "Initial baseline inventory count",
          previousStock: 0,
          newStock: product.stock || 0,
          date: product.createdAt || new Date().toISOString()
        }
      ];
    }
    return localLogs;
  };
 
  const handleCsvExport = () => {
    if (sortedProducts.length === 0) {
      toast.error("No products available to export.");
      return;
    }
 
    const headers = [
      "SKU",
      "Product Name",
      "Category",
      "Brand",
      "Current Stock",
      "Minimum Stock",
      "Cost Price",
      "Selling Price",
      "Inventory Value",
      "Stock Status",
      "Last Updated"
    ];
 
    const rows = sortedProducts.map((p) => {
      const sku = `PROD-${p._id.toString().slice(-6).toUpperCase()}`;
      const stockVal = p.stock || 0;
      const costVal = p.costPrice || 0;
      const invValue = stockVal * costVal;
      let status = "In Stock";
      if (stockVal === 0) status = "Out of Stock";
      else if (stockVal <= 10) status = "Low Stock";
      
      const updatedDate = p.updatedAt || p.createdAt || new Date();
      const dateStr = new Date(updatedDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
 
      return [
        sku,
        `"${p.name.replace(/"/g, '""')}"`,
        `"${(p.category?.name || "Uncategorized").replace(/"/g, '""')}"`,
        `"${(p.company?.name || "No Brand").replace(/"/g, '""')}"`,
        stockVal,
        10, // Min stock mocked
        costVal,
        p.sellingPrice || 0,
        invValue,
        status,
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
    link.setAttribute("download", `inventory-export-${today}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success("CSV export downloaded successfully!");
  };
 
  // Toggle Visibility Mutation
  const toggleVisibilityMutation = useMutation({
    mutationFn: async (id) => {
      const res = await axios.patch(`/api/admin/products/toggle-visibility?id=${id}`);
      return res.data;
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["products"] });
      const previousProducts = queryClient.getQueryData(["products"]);
 
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
      if (context?.previousProducts) {
        queryClient.setQueryData(["products"], context.previousProducts);
      }
      toast.error(err.response?.data?.message || "Visibility toggle failed.");
    },
    onSuccess: (data) => {
      toast.success(data.message);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    }
  });
 
  // Fuzzy Search Hook Binding
  const { results: fuzzyMatchedProducts, suggestion: spellingSuggestion } = useFuzzySearch(
    products,
    searchQuery,
    "name"
  );
 
  // Inventory Filtering Logic
  const filteredProducts = useMemo(() => {
    return fuzzyMatchedProducts.filter(p => {
      const matchesCategory = selectedCategoryFilter === "All" || p.category?._id === selectedCategoryFilter || p.category === selectedCategoryFilter;
      const brandId = p.company?._id || p.company;
      const matchesBrand = selectedBrands.length === 0 || selectedBrands.includes(brandId?.toString());
      
      const stock = p.stock || 0;
      let matchesStock = true;
      if (selectedStockStatus === "InStock") {
        matchesStock = stock > 10;
      } else if (selectedStockStatus === "LowStock") {
        matchesStock = stock > 0 && stock <= 10;
      } else if (selectedStockStatus === "OutOfStock") {
        matchesStock = stock === 0;
      } else if (selectedStockStatus === "ReorderRequired") {
        matchesStock = stock <= 10;
      }
 
      return matchesCategory && matchesBrand && matchesStock;
    });
  }, [fuzzyMatchedProducts, selectedCategoryFilter, selectedBrands, selectedStockStatus]);
 
  // Inventory Sorting Logic
  const sortedProducts = useMemo(() => {
    const list = [...filteredProducts];
    if (sortBy === "name-asc") {
      list.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === "name-desc") {
      list.sort((a, b) => b.name.localeCompare(a.name));
    } else if (sortBy === "stock-desc") {
      list.sort((a, b) => (b.stock || 0) - (a.stock || 0));
    } else if (sortBy === "stock-asc") {
      list.sort((a, b) => (a.stock || 0) - (b.stock || 0));
    } else if (sortBy === "value-desc") {
      list.sort((a, b) => {
        const valA = (a.stock || 0) * (a.costPrice || 0);
        const valB = (b.stock || 0) * (b.costPrice || 0);
        return valB - valA;
      });
    } else if (sortBy === "price-desc") {
      list.sort((a, b) => (b.sellingPrice || 0) - (a.sellingPrice || 0));
    }
    return list;
  }, [filteredProducts, sortBy]);
 
  // Dynamic Summary Metrics Calculations
  const summaryMetrics = useMemo(() => {
    const totalProducts = products.length;
    let totalValue = 0;
    let inStock = 0;
    let lowStock = 0;
    let outOfStock = 0;
 
    products.forEach((p) => {
      const stock = p.stock || 0;
      const cost = p.costPrice || 0;
      totalValue += stock * cost;
      
      if (stock > 10) inStock++;
      else if (stock > 0) lowStock++;
      else outOfStock++;
    });
 
    const reorderRequired = lowStock + outOfStock;
 
    return {
      totalProducts,
      totalValue,
      inStock,
      lowStock,
      outOfStock,
      reorderRequired
    };
  }, [products]);
 
  const totalItems = sortedProducts.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const paginatedProducts = sortedProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
 
  const formatCurrency = (val) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(val || 0);
  };
 
  // Loader Skeleton State
  if (productsLoading) {
    return (
      <div className="w-full max-w-full min-h-screen bg-[#09090b] text-white p-4 sm:p-6 space-y-6 font-sans overflow-x-hidden">
        {/* Skeleton Top Header */}
        <div className="flex justify-between items-center border-b border-zinc-800 pb-5 animate-pulse">
          <div className="space-y-2">
            <div className="h-6 w-56 bg-zinc-850 rounded-lg"></div>
            <div className="h-3 w-80 bg-zinc-850 rounded-lg"></div>
          </div>
          <div className="flex gap-3">
            <div className="h-9 w-32 bg-zinc-850 rounded-xl"></div>
          </div>
        </div>
        
        {/* Skeleton Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-[#0c0c0e] border border-zinc-850 p-4 rounded-2xl h-[105px] animate-pulse flex flex-col justify-between">
              <div className="h-3 w-20 bg-zinc-850 rounded"></div>
              <div className="h-6 w-24 bg-zinc-850 rounded mt-2"></div>
            </div>
          ))}
        </div>
 
        {/* Skeleton Table Container */}
        <div className="bg-[#0c0c0e] border border-zinc-800 rounded-2xl p-6 space-y-4 animate-pulse">
          <div className="h-11 w-full bg-zinc-900 rounded-xl"></div>
          <div className="space-y-3 pt-4">
            <div className="h-10 w-full bg-zinc-900 rounded-lg"></div>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-12 w-full bg-zinc-900/60 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }
 
  return (
    <div className="w-full max-w-full min-h-screen bg-[#09090b] text-white p-4 sm:p-6 space-y-6 font-sans overflow-x-hidden">
 
      {/* 1. TOP NAVBAR / ROW ACTION RIBBON */}
      <div className="flex flex-wrap gap-3 justify-between items-center border-b border-zinc-800 pb-5">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Package className="w-5 h-5 text-zinc-400" /> Inventory Control Center
          </h1>
          <p className="mt-1 text-xs text-zinc-400">Reconcile current stock counts, track minimum thresholds, and adjust inventory reserves.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={handleCsvExport} variant="outline" className="border-zinc-800 bg-zinc-900 text-zinc-300 rounded-xl px-4 h-9 text-xs font-semibold cursor-pointer">
            <Download className="w-3.5 h-3.5 mr-2" /> Export Inventory CSV
          </Button>
        </div>
      </div>
 
      {/* 2. SUMMARY DASHBOARD CARDS ROW */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Card 1: Total Products */}
        <div 
          onClick={() => setSelectedStockStatus("All")}
          className={`bg-[#0c0c0e] border p-4.5 rounded-2xl flex flex-col justify-between min-h-[105px] cursor-pointer transition-all duration-200 select-none ${
            selectedStockStatus === "All" ? "border-blue-500 bg-blue-950/10 shadow-[0_0_15px_rgba(59,130,246,0.15)]" : "border-zinc-850 hover:border-zinc-700"
          }`}
        >
          <div className="flex justify-between items-start">
            <span className="text-[10px] text-zinc-550 font-bold uppercase tracking-wider">Total Items</span>
            <Package className="w-4 h-4 text-zinc-500" />
          </div>
          <div className="mt-2.5">
            <p className="text-2xl font-bold font-mono tracking-tight text-white">{summaryMetrics.totalProducts}</p>
            <div className="flex items-center gap-1 text-[9px] text-emerald-400 font-semibold mt-1">
              <TrendingUp className="w-3 h-3" /> +1.2% catalogue growth
            </div>
          </div>
        </div>
 
        {/* Card 2: Total Inventory Value */}
        <div className="bg-[#0c0c0e] border border-zinc-850 p-4.5 rounded-2xl flex flex-col justify-between min-h-[105px] select-none">
          <div className="flex justify-between items-start">
            <span className="text-[10px] text-zinc-550 font-bold uppercase tracking-wider">Asset Value</span>
            <Coins className="w-4 h-4 text-zinc-500" />
          </div>
          <div className="mt-2.5">
            <p className="text-xl font-bold font-mono tracking-tight text-white truncate">{formatCurrency(summaryMetrics.totalValue)}</p>
            <div className="flex items-center gap-1 text-[9px] text-emerald-400 font-semibold mt-1">
              <TrendingUp className="w-3 h-3" /> Cost basis valuation
            </div>
          </div>
        </div>
 
        {/* Card 3: In Stock Products */}
        <div 
          onClick={() => setSelectedStockStatus("InStock")}
          className={`bg-[#0c0c0e] border p-4.5 rounded-2xl flex flex-col justify-between min-h-[105px] cursor-pointer transition-all duration-200 select-none ${
            selectedStockStatus === "InStock" ? "border-emerald-500 bg-emerald-950/10 shadow-[0_0_15px_rgba(16,185,129,0.15)]" : "border-zinc-850 hover:border-zinc-700"
          }`}
        >
          <div className="flex justify-between items-start">
            <span className="text-[10px] text-zinc-550 font-bold uppercase tracking-wider">In Stock</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2.5">
            <p className="text-2xl font-bold font-mono tracking-tight text-emerald-400">{summaryMetrics.inStock}</p>
            <div className="flex items-center gap-1 text-[9px] text-emerald-500/80 mt-1">
              {summaryMetrics.totalProducts > 0 
                ? `${Math.round((summaryMetrics.inStock / summaryMetrics.totalProducts) * 100)}% of catalogue`
                : "Healthy"
              }
            </div>
          </div>
        </div>
 
        {/* Card 4: Low Stock Products */}
        <div 
          onClick={() => setSelectedStockStatus("LowStock")}
          className={`bg-[#0c0c0e] border p-4.5 rounded-2xl flex flex-col justify-between min-h-[105px] cursor-pointer transition-all duration-200 select-none ${
            selectedStockStatus === "LowStock" ? "border-amber-500 bg-amber-950/10 shadow-[0_0_15px_rgba(245,158,11,0.15)]" : "border-zinc-850 hover:border-zinc-700"
          }`}
        >
          <div className="flex justify-between items-start">
            <span className="text-[10px] text-zinc-550 font-bold uppercase tracking-wider">Low Stock</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2.5">
            <p className="text-2xl font-bold font-mono tracking-tight text-amber-400">{summaryMetrics.lowStock}</p>
            <div className="flex items-center gap-1 text-[9px] text-amber-450 font-semibold mt-1">
              Restock priority alert
            </div>
          </div>
        </div>
 
        {/* Card 5: Out of Stock Products */}
        <div 
          onClick={() => setSelectedStockStatus("OutOfStock")}
          className={`bg-[#0c0c0e] border p-4.5 rounded-2xl flex flex-col justify-between min-h-[105px] cursor-pointer transition-all duration-205 select-none ${
            selectedStockStatus === "OutOfStock" ? "border-rose-500 bg-rose-950/10 shadow-[0_0_15px_rgba(244,63,94,0.15)]" : "border-zinc-850 hover:border-zinc-700"
          }`}
        >
          <div className="flex justify-between items-start">
            <span className="text-[10px] text-zinc-555 font-bold uppercase tracking-wider">Out of Stock</span>
            <XCircle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="mt-2.5">
            <p className="text-2xl font-bold font-mono tracking-tight text-rose-400">{summaryMetrics.outOfStock}</p>
            <div className="flex items-center gap-1 text-[9px] text-rose-400/90 font-semibold mt-1">
              Critical items flag
            </div>
          </div>
        </div>
 
        {/* Card 6: Reorder Required */}
        <div 
          onClick={() => setSelectedStockStatus("ReorderRequired")}
          className={`bg-[#0c0c0e] border p-4.5 rounded-2xl flex flex-col justify-between min-h-[105px] cursor-pointer transition-all duration-200 select-none ${
            selectedStockStatus === "ReorderRequired" ? "border-blue-500 bg-blue-950/10 shadow-[0_0_15px_rgba(59,130,246,0.15)]" : "border-zinc-850 hover:border-zinc-700"
          }`}
        >
          <div className="flex justify-between items-start">
            <span className="text-[10px] text-zinc-555 font-bold uppercase tracking-wider">Reorder Required</span>
            <RefreshCw className="w-4 h-4 text-blue-400 animate-spin-slow" />
          </div>
          <div className="mt-2.5">
            <p className="text-2xl font-bold font-mono tracking-tight text-blue-400">{summaryMetrics.reorderRequired}</p>
            <div className="flex items-center gap-1 text-[9px] text-blue-400/80 mt-1">
              Purchase suggestions
            </div>
          </div>
        </div>
      </div>
 
      {/* 3. FILTER BAR */}
      <div className="bg-[#0c0c0e] border border-zinc-800 rounded-2xl p-4 sm:p-6 space-y-4 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-1 items-center gap-3 min-w-[280px] max-w-2xl">
            <div className="flex items-center w-full bg-[#141416] border border-zinc-700 rounded-xl px-3.5 transition-all gap-2 h-11 focus-within:border-zinc-500 focus-within:ring-1 focus-within:ring-zinc-500">
              <Search className="h-4 w-4 text-zinc-500 shrink-0" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search inventory by item title or brand..."
                className="flex-1 bg-transparent border-none text-zinc-350 placeholder-zinc-500 focus-visible:ring-0 focus-visible:ring-offset-0 focus:outline-none focus:ring-0 text-xs h-full p-0 shadow-none"
              />
              <VoiceSearchButton 
                onResult={(text) => setSearchQuery(text)} 
                className="shrink-0 h-8 w-8"
              />
            </div>
            <Button onClick={handleRefreshAll} variant="outline" className="h-11 w-11 p-0 border-zinc-700 bg-zinc-900 shrink-0 rounded-xl hover:bg-zinc-800 cursor-pointer">
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">

 
            {/* Sorting Selector */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-[#141416] border border-zinc-750 border-zinc-800 rounded-xl h-11 px-3 text-xs font-semibold text-zinc-300 hover:text-white cursor-pointer select-none"
            >
              <option value="name-asc">Sort: A-Z Alphabetical</option>
              <option value="name-desc">Sort: Z-A Alphabetical</option>
              <option value="stock-desc">Sort: Stock (High to Low)</option>
              <option value="stock-asc">Sort: Stock (Low to High)</option>
              <option value="value-desc">Sort: Inventory Value (High to Low)</option>
              <option value="price-desc">Sort: Selling Price (High to Low)</option>
            </select>
 
            {/* Brand Dropdown Multi-selector */}
            <div className="relative shrink-0">
              <button
                type="button"
                onClick={() => setIsBrandDropdownOpen(!isBrandDropdownOpen)}
                className="bg-[#141416] border border-zinc-750 border-zinc-800 rounded-xl h-11 px-4 text-xs font-semibold text-zinc-300 hover:text-white hover:border-zinc-550 transition-all flex items-center justify-between gap-2 cursor-pointer min-w-[150px]"
              >
                <span className="truncate">
                  {selectedBrands.length === 0 
                    ? "All Brands" 
                    : selectedBrands.length === 1 
                      ? brands.find(b => b._id === selectedBrands[0])?.name || "1 Brand"
                      : `${selectedBrands.length} Brands`
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
                  <div className="absolute right-0 top-12 w-64 bg-zinc-950 border border-zinc-800 rounded-2xl p-3 shadow-2xl z-50 space-y-2 mt-1">
                    <Input 
                      value={brandSearchText}
                      onChange={(e) => setBrandSearchText(e.target.value)}
                      placeholder="Search company/brand..."
                      className="h-8 bg-zinc-900 border-zinc-800 text-xs rounded-lg placeholder-zinc-500"
                    />
                    
                    <div className="max-h-48 overflow-y-auto space-y-1 custom-scrollbar py-1">
                      {selectedBrands.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setSelectedBrands([])}
                          className="w-full text-left text-[10px] text-rose-455 hover:underline px-2 py-0.5"
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
                              <span className="truncate capitalize text-zinc-300">{brand.name}</span>
                            </label>
                          );
                        })
                      }
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
 
        {spellingSuggestion && (
          <div className="text-xs text-zinc-400 bg-blue-500/10 border border-blue-500/25 px-3 py-1.5 rounded-lg w-fit mx-auto">
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
 
        {/* Horizontal Category-wise View Tab Selection */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none border-b border-zinc-800/60">
          <button
            type="button"
            onClick={() => setSelectedCategoryFilter("All")}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all border cursor-pointer ${selectedCategoryFilter === "All" ? "bg-white text-black border-white shadow-md scale-[1.02]" : "bg-zinc-900/50 text-zinc-450 border-zinc-800 hover:text-zinc-200"}`}
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
                className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all border cursor-pointer ${selectedCategoryFilter === cat._id ? "bg-white text-black border-white shadow-md scale-[1.02]" : "bg-zinc-900/50 text-zinc-450 border-zinc-800 hover:text-zinc-200"}`}
              >
                <span className="capitalize">{cat.name}</span> ({count})
              </button>
            );
          })}
        </div>
 
        {/* 4. INVENTORY DATA TABLE */}
        {sortedProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center p-12 border border-dashed border-zinc-800 bg-[#0c0c0e]/30 rounded-2xl space-y-4 min-h-[300px]">
            <div className="w-12 h-12 rounded-full bg-zinc-900 flex items-center justify-center border border-zinc-800 text-zinc-500">
              <Package className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-zinc-200">No inventory products found</h3>
              <p className="text-xs text-zinc-500 max-w-sm">No items match your search filters or catalog selection.</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-900/10">
            <Table className="min-w-[1100px]">
              <TableHeader className="bg-zinc-900/40">
                <TableRow className="border-b border-zinc-800 text-[11px] uppercase tracking-wider text-zinc-400">
                  <TableHead className="font-semibold py-3 text-zinc-400">Product</TableHead>
                  <TableHead className="font-semibold py-3 text-zinc-400">SKU</TableHead>
                  <TableHead className="font-semibold py-3 text-zinc-400 text-right">Current Stock</TableHead>
                  <TableHead className="font-semibold py-3 text-zinc-400 text-right">Reserved Stock</TableHead>
                  <TableHead className="font-semibold py-3 text-zinc-400 text-right">Available Stock</TableHead>
                  <TableHead className="font-semibold py-3 text-zinc-400 text-right">Min Stock</TableHead>
                  <TableHead className="font-semibold py-3 text-zinc-400 text-right">Cost Price</TableHead>
                  <TableHead className="font-semibold py-3 text-zinc-400 text-right">Selling Price</TableHead>
                  <TableHead className="font-semibold py-3 text-zinc-400 text-right">Inventory Value</TableHead>
                  <TableHead className="font-semibold py-3 text-zinc-400">Supplier</TableHead>
          <TableHead className="font-semibold py-3 text-zinc-400 text-center">Status</TableHead>
                  <TableHead className="font-semibold py-3 text-zinc-400 text-center">Last Restocked</TableHead>
                  <TableHead className="font-semibold py-3 text-zinc-400 text-right w-28">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedProducts.map((p) => {
                  const stockVal = localOverrides[p._id] !== undefined ? localOverrides[p._id] : (p.stock || 0);
                  const costVal = p.costPrice || 0;
                  const sellVal = p.sellingPrice || 0;
                  const invVal = stockVal * costVal;
                  const sku = `PROD-${p._id.toString().slice(-6).toUpperCase()}`;
                  
                  const reservedVal = Math.round(stockVal * 0.1);
                  const availableVal = Math.max(0, stockVal - reservedVal);
                  
                  const lastUpdate = p.updatedAt || p.createdAt || new Date();
                  const lastUpdateStr = new Date(lastUpdate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });

                  return (
                    <TableRow key={p._id} className="border-b border-zinc-800/60 hover:bg-zinc-900/20 transition-colors text-xs animate-fadeIn">
                      {/* Product */}
                      <TableCell className="py-3">
                        <div className="flex items-center gap-3">
                          <div className="relative w-10 h-10 rounded-lg bg-white border border-zinc-800 p-0.5 shrink-0 flex items-center justify-center overflow-hidden">
                            {p.images?.[0] ? (
                              <img 
                                src={p.images[0]} 
                                className="w-full h-full object-contain" 
                                alt={p.name} 
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <span className="text-[8px] text-zinc-400 uppercase font-mono">No image</span>
                            )}
                          </div>
                          <div className="min-w-0">
                            <span className="font-bold text-zinc-100 block truncate capitalize hover:text-white transition-colors cursor-pointer" onClick={() => { setSelectedDetailProduct(p); setIsDrawerOpen(true); }}>
                              {p.name}
                            </span>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className={`w-1.5 h-1.5 rounded-full ${p.isVisible !== false ? "bg-emerald-400" : "bg-zinc-650"}`} />
                              <span className="text-[10px] text-zinc-500">{p.isVisible !== false ? "Visible" : "Hidden"}</span>
                            </div>
                          </div>
                        </div>
                      </TableCell>

                      {/* SKU */}
                      <TableCell className="font-mono font-bold text-zinc-400 py-3">{sku}</TableCell>
                      
                      {/* Current Stock with inline adjustments */}
                      <TableCell className="font-mono font-bold py-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5 select-none">
                          {editingProductId === p._id ? (
                            <input
                              type="number"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              className="w-16 h-7 bg-zinc-950 border border-zinc-700 rounded text-center text-xs font-mono font-bold text-white focus:outline-none focus:border-blue-500 shadow-inner"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  handleInlineStockSave(p, Number(editValue));
                                } else if (e.key === "Escape") {
                                  setEditingProductId(null);
                                }
                              }}
                              onBlur={() => {
                                setEditingProductId(null);
                              }}
                            />
                          ) : (
                            <>
                              <button 
                                onClick={() => handleOptimisticAdjust(p, 1, "subtract")}
                                className="w-5 h-5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center border border-zinc-700 active:scale-95 text-[10px] font-bold cursor-pointer"
                                title="Reduce by 1"
                              >
                                -
                              </button>
                              <span 
                                onClick={() => {
                                  setEditingProductId(p._id);
                                  setEditValue(String(stockVal));
                                }}
                                onDoubleClick={() => {
                                  setEditingProductId(p._id);
                                  setEditValue(String(stockVal));
                                }}
                                className={`w-8 text-center font-extrabold cursor-pointer hover:underline ${stockVal === 0 ? "text-rose-400 font-extrabold" : stockVal <= 10 ? "text-amber-400 font-extrabold" : "text-emerald-400 font-extrabold"}`}
                                title="Click or Double click to type value"
                              >
                                {stockVal}
                              </span>
                              <button 
                                onClick={() => handleOptimisticAdjust(p, 1, "add")}
                                className="w-5 h-5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center border border-zinc-700 active:scale-95 text-[10px] font-bold cursor-pointer"
                                title="Increase by 1"
                              >
                                +
                              </button>
                            </>
                          )}
                          <span className="text-zinc-500 font-normal text-[10px] w-6 text-left ml-0.5">{p.stockUnit || "Pcs"}</span>
                        </div>
                      </TableCell>

                      {/* Reserved Stock */}
                      <TableCell className="font-mono text-zinc-400 text-right py-3">
                        {reservedVal} <span className="text-[10px] text-zinc-600">{p.stockUnit || "Pcs"}</span>
                      </TableCell>

                      {/* Available Stock */}
                      <TableCell className="font-mono text-emerald-450 text-emerald-400 text-right py-3">
                        {availableVal} <span className="text-[10px] text-zinc-650">{p.stockUnit || "Pcs"}</span>
                      </TableCell>
                      
                      {/* Min Stock */}
                      <TableCell className="font-mono text-zinc-500 text-right py-3">10</TableCell>
                      
                      {/* Prices */}
                      <TableCell className="font-mono text-zinc-350 text-right py-3">{formatCurrency(costVal)}</TableCell>
                      <TableCell className="font-mono text-zinc-100 font-semibold text-right py-3">{formatCurrency(sellVal)}</TableCell>
                      <TableCell className="font-mono text-zinc-200 font-bold text-right py-3">{formatCurrency(invVal)}</TableCell>
                      
                      {/* Supplier */}
                      <TableCell className="text-zinc-350 capitalize py-3 truncate max-w-[120px]" title={p.company?.name || "No Brand"}>
                        {p.company?.name || "Direct Supplier"}
                      </TableCell>

                      {/* Status */}
                      <TableCell className="text-center py-3">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold whitespace-nowrap inline-flex items-center gap-1.5 ${
                          stockVal === 0 
                            ? "bg-rose-500/10 text-rose-400 border border-rose-500/25" 
                            : stockVal <= 10 
                              ? "bg-amber-500/10 text-amber-400 border border-amber-500/25" 
                              : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/25"
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            stockVal === 0 
                              ? "bg-rose-500 animate-pulse" 
                              : stockVal <= 10 
                                ? "bg-amber-500 animate-pulse" 
                                : "bg-emerald-500"
                          }`} />
                          {stockVal === 0 ? "Out of Stock" : stockVal <= 10 ? "Low Stock" : "In Stock"}
                        </span>
                      </TableCell>

                      {/* Last Restocked */}
                      <TableCell className="font-mono text-[10px] text-zinc-500 text-center py-3">{lastUpdateStr}</TableCell>

                      {/* Actions */}
                      <TableCell className="py-3 text-right">
                        <div className="flex justify-end items-center gap-1">
                          <Button 
                            onClick={() => { setSelectedDetailProduct(p); setIsDrawerOpen(true); }} 
                            variant="ghost" 
                            className="p-1.5 h-7 w-7 text-zinc-400 hover:text-white rounded-md cursor-pointer"
                            title="View product details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Button>
                          <Button 
                            onClick={() => { setSelectedAdjustProduct(p); setIsAdjustStockOpen(true); setAdjustForm({ quantity: "1", type: "add", reason: "Physical count" }); }} 
                            variant="ghost" 
                            className="p-1.5 h-7 w-7 text-zinc-400 hover:text-blue-400 rounded-md cursor-pointer"
                            title="Adjust Stock level"
                          >
                            <SlidersHorizontal className="w-3.5 h-3.5" />
                          </Button>
                          <Button 
                            onClick={() => { setSelectedHistoryProduct(p); setIsHistoryOpen(true); }} 
                            variant="ghost" 
                            className="p-1.5 h-7 w-7 text-zinc-400 hover:text-amber-400 rounded-md cursor-pointer"
                            title="View log history"
                          >
                            <History className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
 
        {/* PAGINATION PANEL */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-zinc-800/80 pt-5 mt-4">
            <p className="text-xs text-zinc-500 font-mono">
              Showing <span className="text-zinc-300 font-bold">{Math.min((currentPage - 1) * itemsPerPage + 1, totalItems)}</span> to{" "}
              <span className="text-zinc-300 font-bold">{Math.min(currentPage * itemsPerPage, totalItems)}</span> of{" "}
              <span className="text-zinc-300 font-bold">{totalItems}</span> products
            </p>
            
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                className="h-8 w-8 rounded-lg border border-zinc-800 bg-zinc-900/40 flex items-center justify-center text-zinc-400 hover:text-white disabled:opacity-30 disabled:hover:text-zinc-400 transition-all cursor-pointer hover:border-zinc-700"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
 
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
 
      {/* 5. PRODUCT DETAILS DRAWER */}
      {isDrawerOpen && selectedDetailProduct && (() => {
        const p = selectedDetailProduct;
        const sku = `PROD-${p._id.toString().slice(-6).toUpperCase()}`;
        const stockVal = p.stock || 0;
        const costVal = p.costPrice || 0;
        const sellVal = p.sellingPrice || 0;
        const invVal = stockVal * costVal;
        
        let statusText = "In Stock";
        let statusClass = "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
        if (stockVal === 0) {
          statusText = "Out of Stock";
          statusClass = "bg-rose-500/10 text-rose-455 border border-rose-500/20";
        } else if (stockVal <= 10) {
          statusText = "Low Stock";
          statusClass = "bg-amber-500/10 text-amber-400 border border-amber-500/20";
        }
 
        const marginAmt = sellVal - costVal;
        const marginPct = sellVal > 0 ? Math.round((marginAmt / sellVal) * 100) : 0;
 
        return (
          <div className="fixed inset-0 z-50 flex justify-end">
            <div className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity" onClick={() => setIsDrawerOpen(false)} />
            
            <div className="relative w-full max-w-lg bg-zinc-950 border-l border-zinc-850 p-6 overflow-y-auto space-y-6 shadow-2xl z-10 h-full flex flex-col justify-between">
              <div className="space-y-6">
                <div className="flex justify-between items-start border-b border-zinc-800 pb-4">
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-550 text-zinc-500">Asset Record Details</span>
                    <h2 className="text-lg font-bold text-white capitalize mt-0.5">{p.name}</h2>
                    <span className="text-xs font-mono text-zinc-500 mt-1 block">SKU: {sku}</span>
                  </div>
                  <button 
                    onClick={() => setIsDrawerOpen(false)}
                    className="p-1 text-zinc-400 hover:text-white bg-zinc-900 border border-zinc-800 rounded-lg cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
 
                <div className="bg-white border border-zinc-850 rounded-2xl p-4 flex items-center justify-center h-48 overflow-hidden relative">
                  {p.images?.[0] ? (
                    <img 
                      src={p.images[0]} 
                      alt="" 
                      className="max-h-full object-contain"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <span className="text-xs font-mono text-zinc-400 uppercase">No image uploaded</span>
                  )}
                  <span className={`absolute top-3 right-3 px-2 py-0.5 rounded-full text-[9px] font-bold ${statusClass}`}>
                    {statusText}
                  </span>
                </div>
 
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-zinc-900/30 border border-zinc-850 p-3 rounded-xl">
                    <span className="text-[10px] text-zinc-500 block uppercase font-semibold">Current Stock</span>
                    <span className="text-base font-bold font-mono text-zinc-200 mt-1 block">
                      {stockVal} <span className="text-xs text-zinc-500 font-normal">{p.stockUnit || "Pcs"}</span>
                    </span>
                  </div>
                  <div className="bg-zinc-900/30 border border-zinc-850 p-3 rounded-xl">
                    <span className="text-[10px] text-zinc-500 block uppercase font-semibold">Min Stock Threshold</span>
                    <span className="text-base font-bold font-mono text-zinc-500 mt-1 block">10 Pcs</span>
                  </div>
                  <div className="bg-zinc-900/30 border border-zinc-850 p-3 rounded-xl">
                    <span className="text-[10px] text-zinc-500 block uppercase font-semibold">Max Stock Threshold</span>
                    <span className="text-base font-bold font-mono text-zinc-500 mt-1 block">100 Pcs</span>
                  </div>
                  <div className="bg-zinc-900/30 border border-zinc-850 p-3 rounded-xl">
                    <span className="text-[10px] text-zinc-500 block uppercase font-semibold">Inventory Value</span>
                    <span className="text-base font-bold font-mono text-emerald-400 mt-1 block">{formatCurrency(invVal)}</span>
                  </div>
                </div>
 
                <div className="bg-[#0c0c0e] border border-zinc-800 p-4.5 rounded-2xl space-y-3">
                  <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wide">Pricing &amp; Asset Value Ledger</h4>
                  
                  <div className="grid grid-cols-3 gap-2 text-center border-b border-zinc-850 pb-3">
                    <div>
                      <span className="text-[9px] text-zinc-500 block uppercase">Cost Price</span>
                      <span className="text-sm font-mono font-bold text-zinc-450 mt-1 block">{formatCurrency(costVal)}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-zinc-500 block uppercase">Selling Price</span>
                      <span className="text-sm font-mono font-bold text-white mt-1 block">{formatCurrency(sellVal)}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-zinc-500 block uppercase">Gross Margin</span>
                      <span className="text-sm font-mono font-bold text-emerald-400 mt-1 block">{marginPct}%</span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center text-[11px] pt-1">
                    <span className="text-zinc-500">Gross Margin Profit (per unit)</span>
                    <span className="font-mono text-emerald-400 font-bold">+{formatCurrency(marginAmt)}</span>
                  </div>
                </div>
 
                <div className="border border-zinc-850 rounded-2xl p-4.5 space-y-2.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Brand Provider</span>
                    <span className="text-zinc-300 font-semibold capitalize">{p.company?.name || "No Brand"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Catalog Category</span>
                    <span className="text-zinc-300 font-semibold capitalize">{p.category?.name || "Uncategorized"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Last Supply Date</span>
                    <span className="text-zinc-300 font-mono">12-Jul-2026 (Mocked)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Last Sale Registry</span>
                    <span className="text-zinc-300 font-mono">20-Jul-2026 (Mocked)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Primary Supplier</span>
                    <span className="text-zinc-300 font-semibold">Adarsh Stationery Wholesale</span>
                  </div>
                </div>
              </div>
 
              <div className="border-t border-zinc-800 pt-4 flex gap-3 mt-6">
                <Button 
                  onClick={() => { setSelectedAdjustProduct(p); setIsAdjustStockOpen(true); setIsDrawerOpen(false); }}
                  variant="outline" 
                  className="flex-1 border-zinc-800 hover:border-zinc-700 bg-zinc-900 text-zinc-300 rounded-xl h-11 text-xs font-semibold cursor-pointer"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5 mr-2" /> Adjust Stock
                </Button>
                <Button 
                  onClick={() => setIsDrawerOpen(false)}
                  className="flex-1 bg-white text-black font-semibold hover:bg-zinc-200 rounded-xl h-11 text-xs shadow-md cursor-pointer"
                >
                  Close Details
                </Button>
              </div>
            </div>
          </div>
        );
      })()}
 
      {/* 6. ADJUST STOCK LEVEL MODAL */}
      <Dialog open={isAdjustStockOpen} onOpenChange={setIsAdjustStockOpen}>
        <DialogContent className="max-w-md w-full bg-zinc-950 border border-zinc-800 text-white rounded-3xl p-6 shadow-2xl">
          <DialogHeader className="border-b border-zinc-800 pb-3 mb-4">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="text-blue-500 w-5 h-5" />
              <DialogTitle className="text-base font-bold text-white">Adjust Stock Level</DialogTitle>
            </div>
          </DialogHeader>
 
          {selectedAdjustProduct && (
            <form onSubmit={handleAdjustStockSubmit} className="space-y-4">
              <div className="bg-zinc-900/40 border border-zinc-850 p-3.5 rounded-2xl flex items-center justify-between text-xs">
                <div>
                  <span className="text-zinc-500">Product Name</span>
                  <p className="font-bold text-zinc-200 mt-0.5 capitalize">{selectedAdjustProduct.name}</p>
                </div>
                <div className="text-right">
                  <span className="text-zinc-500">Current Stock</span>
                  <p className="font-bold font-mono text-zinc-200 mt-0.5">
                    {selectedAdjustProduct.stock} {selectedAdjustProduct.stockUnit || "Pcs"}
                  </p>
                </div>
              </div>
 
              <div className="space-y-1.5">
                <Label className="text-xs text-zinc-400 font-bold uppercase">Adjustment Type</Label>
                <select
                  value={adjustForm.type}
                  onChange={(e) => setAdjustForm(prev => ({ ...prev, type: e.target.value }))}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl h-11 px-3 text-xs text-zinc-200 focus:outline-none focus:border-blue-550 focus:ring-1 focus:ring-blue-550/20 cursor-pointer"
                >
                  <option value="add">Add Stock (+)</option>
                  <option value="subtract">Subtract Stock (-)</option>
                  <option value="set">Set Stock Count (=)</option>
                </select>
              </div>
 
              <div className="space-y-1.5">
                <Label className="text-xs text-zinc-400 font-bold uppercase">Adjustment Quantity</Label>
                <Input 
                  type="number" 
                  min="1"
                  value={adjustForm.quantity}
                  onChange={(e) => setAdjustForm(prev => ({ ...prev, quantity: e.target.value }))}
                  placeholder="Enter quantity"
                  className="bg-zinc-950 border border-zinc-800 h-11 text-xs rounded-xl focus-visible:ring-1 focus-visible:ring-blue-500"
                />
              </div>
 
              <div className="space-y-1.5">
                <Label className="text-xs text-zinc-400 font-bold uppercase">Reason of Adjustment</Label>
                <select
                  value={adjustForm.reason}
                  onChange={(e) => setAdjustForm(prev => ({ ...prev, reason: e.target.value }))}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl h-11 px-3 text-xs text-zinc-200 focus:outline-none focus:border-blue-550 focus:ring-1 focus:ring-blue-550/20 cursor-pointer"
                >
                  <option value="Physical count">Physical count check</option>
                  <option value="Received shipment">Received shipment supply</option>
                  <option value="Damaged goods">Damaged / Defective goods</option>
                  <option value="Return to supplier">Return to supplier</option>
                  <option value="Shrinkage">Shrinkage correction</option>
                </select>
              </div>
 
              <div className="border-t border-zinc-800 pt-4 flex gap-3 justify-end mt-2">
                <Button 
                  type="button" 
                  onClick={() => setIsAdjustStockOpen(false)}
                  variant="ghost"
                  className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 h-10 text-xs font-semibold text-zinc-350 cursor-pointer"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={adjustStockMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl px-5 h-10 text-xs shadow-md cursor-pointer"
                >
                  {adjustStockMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Save Adjustment"}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
 
      {/* 7. VIEW LOG HISTORY TIMELINE */}
      <Dialog open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
        <DialogContent className="max-w-md w-full bg-zinc-950 border border-zinc-800 text-white rounded-3xl p-6 shadow-2xl">
          <DialogHeader className="border-b border-zinc-800 pb-3 mb-4">
            <div className="flex items-center gap-2">
              <History className="text-amber-500 w-5 h-5" />
              <DialogTitle className="text-base font-bold text-white">Stock Adjustment History</DialogTitle>
            </div>
          </DialogHeader>
 
          {selectedHistoryProduct && (() => {
            const logs = getProductHistory(selectedHistoryProduct);
            return (
              <div className="space-y-4">
                <div className="bg-zinc-900/40 border border-zinc-850 p-3 rounded-xl flex items-center justify-between text-xs mb-2">
                  <span className="font-bold text-zinc-300 capitalize">{selectedHistoryProduct.name}</span>
                  <span className="font-mono text-zinc-450 text-zinc-500">SKU: PROD-{selectedHistoryProduct._id.toString().slice(-6).toUpperCase()}</span>
                </div>
 
                <div className="max-h-72 overflow-y-auto space-y-4 pr-1 custom-scrollbar">
                  {logs.map((log, idx) => {
                    const isAdd = log.type === "add" || log.type === "initial";
                    const isSub = log.type === "subtract";
                    const badgeClass = isAdd 
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                      : isSub 
                        ? "bg-rose-500/10 text-rose-455 border border-rose-500/20" 
                        : "bg-blue-500/10 text-blue-400 border border-blue-500/20";
                    
                    const dateStr = new Date(log.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
 
                    return (
                      <div key={idx} className="relative pl-6 border-l border-zinc-805 border-zinc-800 text-xs pb-1">
                        <span className={`absolute -left-1.5 top-1 w-3 h-3 rounded-full border border-zinc-950 ${isAdd ? "bg-emerald-500" : isSub ? "bg-rose-500" : "bg-blue-500"}`} />
                        
                        <div className="space-y-1">
                          <div className="flex justify-between items-center">
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${badgeClass} uppercase`}>
                              {log.type === "initial" ? "Registered" : log.type === "set" ? "Set Stock" : `${log.type} ${log.quantity}`}
                            </span>
                            <span className="font-mono text-[10px] text-zinc-500">{dateStr}</span>
                          </div>
                          
                          <p className="text-zinc-350">{log.reason}</p>
                          <div className="flex items-center gap-2 text-[10px] text-zinc-550 text-zinc-500 font-mono">
                            <span>Prev: {log.previousStock}</span>
                            <span>→</span>
                            <span className="text-zinc-300 font-bold">New: {log.newStock}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
 
                <div className="border-t border-zinc-800 pt-4 flex justify-end">
                  <Button 
                    onClick={() => setIsHistoryOpen(false)}
                    className="bg-zinc-900 border border-zinc-850 hover:bg-zinc-800 text-zinc-350 hover:text-white rounded-xl px-5 h-9 text-xs font-semibold cursor-pointer"
                  >
                    Close History
                  </Button>
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
 
    </div>
  );
}
