"use client";
 
import { useState, useMemo } from "react";
import { toast } from "sonner";
import {
  Download,
  RefreshCw,
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
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import useFuzzySearch from "@/hooks/useFuzzySearch";
import VoiceSearchButton from "@/components/ui/voice-search-button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
 
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
 
  // Core Inventory Computed Products Query
  const { 
    data: productsData, 
    isLoading: productsLoading, 
    refetch: refetchProducts 
  } = useQuery({
    queryKey: ["inventoryProducts"],
    queryFn: async () => {
      const res = await axios.get("/api/admin/products/inventory");
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
 
  // Stock Level Adjustment Mutation
  const adjustStockMutation = useMutation({
    mutationFn: async ({ product, quantity, type, reason }) => {
      let currentStock = product.currentStock !== undefined ? product.currentStock : (product.stock || 0);
      let nextStock = currentStock;
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
        minStock: product.minStock,
        supplier: product.supplier,
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
        previousStock: currentStock,
        newStock: nextStock,
        date: new Date().toISOString()
      });
      localStorage.setItem(`stock_history_${product._id}`, JSON.stringify(logs));
 
      return { response: response.data, updatedProduct: { ...product, currentStock: nextStock, stock: nextStock } };
    },
    onSuccess: (data) => {
      toast.success("Stock level updated successfully!");
      setIsAdjustStockOpen(false);
      
      setLocalOverrides(prev => {
        const updated = { ...prev };
        delete updated[data.updatedProduct._id];
        return updated;
      });
      
      queryClient.invalidateQueries({ queryKey: ["inventoryProducts"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      
      if (selectedDetailProduct && selectedDetailProduct._id === data.updatedProduct._id) {
        setSelectedDetailProduct(data.updatedProduct);
      }
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to update stock level.");
    }
  });

  const handleOptimisticAdjust = (product, delta, type) => {
    const currentStock = localOverrides[product._id] !== undefined ? localOverrides[product._id] : (product.currentStock || product.stock || 0);
    const newStock = type === "add" ? currentStock + delta : Math.max(0, currentStock - delta);
    
    setLocalOverrides(prev => ({
      ...prev,
      [product._id]: newStock
    }));
    
    adjustStockMutation.mutate({
      product: { ...product, currentStock },
      quantity: delta,
      type,
      reason: "Rapid adjustment"
    }, {
      onError: () => {
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
    const currentStock = localOverrides[product._id] !== undefined ? localOverrides[product._id] : (product.currentStock || product.stock || 0);
    if (targetStock === currentStock) {
      setEditingProductId(null);
      return;
    }
    
    const delta = Math.abs(targetStock - currentStock);
    const type = targetStock > currentStock ? "add" : "subtract";
    
    setEditingProductId(null);
    
    setLocalOverrides(prev => ({
      ...prev,
      [product._id]: targetStock
    }));
    
    adjustStockMutation.mutate({
      product: { ...product, currentStock },
      quantity: delta,
      type,
      reason: "Manual inline override"
    }, {
      onError: () => {
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
          quantity: product.currentStock || product.stock || 0,
          reason: "Initial baseline inventory count",
          previousStock: 0,
          newStock: product.currentStock || product.stock || 0,
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
      "Reserved Stock",
      "Available Stock",
      "Minimum Stock",
      "Cost Price",
      "Selling Price",
      "Inventory Value",
      "Supplier",
      "Stock Status",
      "Last Restocked"
    ];
 
    const rows = sortedProducts.map((p) => {
      const sku = p.productId || `PROD-${p._id.toString().slice(-6).toUpperCase()}`;
      const stockVal = localOverrides[p._id] !== undefined ? localOverrides[p._id] : (p.currentStock || p.stock || 0);
      const reservedVal = p.reservedStock || 0;
      const availableVal = stockVal - reservedVal;
      const minStockVal = p.minStock !== undefined ? p.minStock : 10;
      const costVal = p.costPrice || 0;
      const invValue = stockVal * costVal;
      const supplierVal = p.supplier || p.company?.name || "Direct Supplier";
      
      let status = "In Stock";
      if (availableVal <= 0) status = "Out of Stock";
      else if (availableVal <= minStockVal) status = "Low Stock";
      
      const restockedDate = p.lastRestocked
        ? new Date(p.lastRestocked).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
        : "—";

      return [
        sku,
        `"${p.name.replace(/"/g, '""')}"`,
        `"${(p.category?.name || "Uncategorized").replace(/"/g, '""')}"`,
        `"${(p.company?.name || "No Brand").replace(/"/g, '""')}"`,
        stockVal,
        reservedVal,
        availableVal,
        minStockVal,
        costVal,
        p.sellingPrice || 0,
        invValue,
        `"${supplierVal.replace(/"/g, '""')}"`,
        status,
        `"${restockedDate}"`
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
      
      const stock = localOverrides[p._id] !== undefined ? localOverrides[p._id] : (p.currentStock || p.stock || 0);
      const minStock = p.minStock !== undefined ? p.minStock : 10;
      const available = stock - (p.reservedStock || 0);

      let matchesStock = true;
      if (selectedStockStatus === "InStock") {
        matchesStock = available > minStock;
      } else if (selectedStockStatus === "LowStock") {
        matchesStock = available > 0 && available <= minStock;
      } else if (selectedStockStatus === "OutOfStock") {
        matchesStock = available <= 0;
      } else if (selectedStockStatus === "ReorderRequired") {
        matchesStock = available <= minStock;
      }
 
      return matchesCategory && matchesBrand && matchesStock;
    });
  }, [fuzzyMatchedProducts, selectedCategoryFilter, selectedBrands, selectedStockStatus, localOverrides]);
 
  // Inventory Sorting Logic
  const sortedProducts = useMemo(() => {
    const list = [...filteredProducts];
    if (sortBy === "name-asc") {
      list.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === "name-desc") {
      list.sort((a, b) => b.name.localeCompare(a.name));
    } else if (sortBy === "stock-desc") {
      list.sort((a, b) => ((b.currentStock || b.stock || 0) - (a.currentStock || a.stock || 0)));
    } else if (sortBy === "stock-asc") {
      list.sort((a, b) => ((a.currentStock || a.stock || 0) - (b.currentStock || b.stock || 0)));
    } else if (sortBy === "value-desc") {
      list.sort((a, b) => {
        const valA = (a.currentStock || a.stock || 0) * (a.costPrice || 0);
        const valB = (b.currentStock || b.stock || 0) * (b.costPrice || 0);
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
      const stock = localOverrides[p._id] !== undefined ? localOverrides[p._id] : (p.currentStock || p.stock || 0);
      const minStock = p.minStock !== undefined ? p.minStock : 10;
      const available = stock - (p.reservedStock || 0);
      const cost = p.costPrice || 0;
      totalValue += stock * cost;
      
      if (available > minStock) inStock++;
      else if (available > 0) lowStock++;
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
  }, [products, localOverrides]);
 
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
 
  if (productsLoading) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <LoadingSpinner size={240} label="Loading inventory catalog..." />
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
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-gray-900">Inventory Control Center</h1>
          </div>
          <p className="mt-1 text-xs sm:text-sm text-zinc-600 font-medium">
            Reconcile live stock levels, reserved allocation, reorder points, and supplier valuations.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <Button onClick={handleCsvExport} variant="outline" className="border-border-subtle bg-bg-surface text-gray-900 hover:bg-primary-50 text-xs sm:text-sm font-semibold rounded-xl h-10 px-4 cursor-pointer shadow-xs btn-modern">
            <Download className="w-4 h-4 mr-2 text-primary-600" /> Export Inventory CSV
          </Button>
        </div>
      </div>
 
      {/* 2. SUMMARY DASHBOARD CARDS ROW */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-4">
        {/* Card 1: Total Products */}
        <div 
          onClick={() => setSelectedStockStatus("All")}
          className={`bg-bg-surface border p-4.5 rounded-2xl flex flex-col justify-between min-h-[105px] cursor-pointer transition-all duration-200 select-none shadow-xs ${
            selectedStockStatus === "All" ? "border-primary-500 bg-primary-50/40" : "border-border-subtle hover:border-primary-300"
          }`}
        >
          <div className="flex justify-between items-start">
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Total Items</span>
            <Package className="w-4 h-4 text-primary-600" />
          </div>
          <div className="mt-2.5">
            <p className="text-2xl font-bold font-mono tracking-tight text-gray-900">{summaryMetrics.totalProducts}</p>
            <div className="flex items-center gap-1 text-[9px] text-primary-600 font-semibold mt-1">
              <TrendingUp className="w-3 h-3" /> Catalogue items
            </div>
          </div>
        </div>

        {/* Card 2: Total Inventory Value */}
        <div className="bg-bg-surface border border-border-subtle p-4.5 rounded-2xl flex flex-col justify-between min-h-[105px] select-none shadow-xs">
          <div className="flex justify-between items-start">
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Asset Value</span>
            <Coins className="w-4 h-4 text-primary-600" />
          </div>
          <div className="mt-2.5">
            <p className="text-xl font-bold font-mono tracking-tight text-gray-900 truncate">{formatCurrency(summaryMetrics.totalValue)}</p>
            <div className="flex items-center gap-1 text-[9px] text-emerald-600 font-semibold mt-1">
              <TrendingUp className="w-3 h-3" /> Cost basis valuation
            </div>
          </div>
        </div>v>
 
        {/* Card 3: In Stock Products */}
        <div 
          onClick={() => setSelectedStockStatus("InStock")}
          className={`bg-bg-surface border p-4.5 rounded-2xl flex flex-col justify-between min-h-[105px] cursor-pointer transition-all duration-200 select-none shadow-xs ${
            selectedStockStatus === "InStock" ? "border-emerald-500 bg-emerald-50/40" : "border-border-subtle hover:border-primary-300"
          }`}
        >
          <div className="flex justify-between items-start">
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">In Stock</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2.5">
            <p className="text-2xl font-bold font-mono tracking-tight text-emerald-600">{summaryMetrics.inStock}</p>
            <div className="flex items-center gap-1 text-[9px] text-emerald-600 font-semibold mt-1">
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
          className={`bg-bg-surface border p-4.5 rounded-2xl flex flex-col justify-between min-h-[105px] cursor-pointer transition-all duration-200 select-none shadow-xs ${
            selectedStockStatus === "LowStock" ? "border-amber-500 bg-amber-50/40" : "border-border-subtle hover:border-primary-300"
          }`}
        >
          <div className="flex justify-between items-start">
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Low Stock</span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-2.5">
            <p className="text-2xl font-bold font-mono tracking-tight text-amber-600">{summaryMetrics.lowStock}</p>
            <div className="flex items-center gap-1 text-[9px] text-amber-600 font-semibold mt-1">
              Restock priority alert
            </div>
          </div>
        </div>
 
        {/* Card 5: Out of Stock Products */}
        <div 
          onClick={() => setSelectedStockStatus("OutOfStock")}
          className={`bg-bg-surface border p-4.5 rounded-2xl flex flex-col justify-between min-h-[105px] cursor-pointer transition-all duration-200 select-none shadow-xs ${
            selectedStockStatus === "OutOfStock" ? "border-rose-500 bg-rose-50/40" : "border-border-subtle hover:border-primary-300"
          }`}
        >
          <div className="flex justify-between items-start">
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Out of Stock</span>
            <XCircle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="mt-2.5">
            <p className="text-2xl font-bold font-mono tracking-tight text-rose-600">{summaryMetrics.outOfStock}</p>
            <div className="flex items-center gap-1 text-[9px] text-rose-600 font-semibold mt-1">
              Critical items flag
            </div>
          </div>
        </div>
 
        {/* Card 6: Reorder Required */}
        <div 
          onClick={() => setSelectedStockStatus("ReorderRequired")}
          className={`bg-bg-surface border p-4.5 rounded-2xl flex flex-col justify-between min-h-[105px] cursor-pointer transition-all duration-200 select-none shadow-xs ${
            selectedStockStatus === "ReorderRequired" ? "border-primary-500 bg-primary-50/40" : "border-border-subtle hover:border-primary-300"
          }`}
        >
          <div className="flex justify-between items-start">
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Reorder Required</span>
            <RefreshCw className="w-4 h-4 text-primary-600" />
          </div>
          <div className="mt-2.5">
            <p className="text-2xl font-bold font-mono tracking-tight text-primary-600">{summaryMetrics.reorderRequired}</p>
            <div className="flex items-center gap-1 text-[9px] text-primary-600 font-semibold mt-1">
              Purchase suggestions
            </div>
          </div>
        </div>
      </div>
 
      {/* 3. FILTER BAR */}
      <div className="bg-bg-surface border border-border-subtle rounded-2xl p-4 sm:p-6 space-y-4 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-1 items-center gap-3 min-w-[280px] max-w-2xl">
            <div className="flex items-center w-full bg-white border border-border-subtle rounded-xl px-3.5 transition-all gap-2 h-11 focus-within:border-primary-400 focus-within:ring-1 focus-within:ring-primary-400 shadow-xs">
              <Search className="h-4 w-4 text-zinc-400 shrink-0" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search inventory by item title or brand..."
                className="flex-1 bg-transparent border-none text-gray-900 placeholder-zinc-400 focus-visible:ring-0 focus-visible:ring-offset-0 focus:outline-none focus:ring-0 text-xs h-full p-0 shadow-none"
              />
              <VoiceSearchButton 
                onResult={(text) => setSearchQuery(text)} 
                className="shrink-0 h-8 w-8"
              />
            </div>
            <Button onClick={handleRefreshAll} variant="outline" className="h-11 w-11 p-0 border-border-subtle bg-bg-surface shrink-0 rounded-xl hover:bg-primary-50 text-primary-600 cursor-pointer btn-modern">
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            {/* Sorting Selector */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-white border border-border-subtle rounded-xl h-11 px-3 text-xs font-semibold text-gray-900 hover:border-primary-300 cursor-pointer select-none shadow-xs"
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
                className="bg-white border border-border-subtle rounded-xl h-11 px-4 text-xs font-semibold text-gray-900 hover:border-primary-300 transition-all flex items-center justify-between gap-2 cursor-pointer min-w-[150px] shadow-xs"
              >
                <span className="truncate">
                  {selectedBrands.length === 0 
                    ? "All Brands" 
                    : selectedBrands.length === 1 
                      ? brands.find(b => b._id === selectedBrands[0])?.name || "1 Brand"
                      : `${selectedBrands.length} Brands`
                  }
                </span>
                <span className="text-[9px] text-zinc-400">▼</span>
              </button>
 
              {isBrandDropdownOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setIsBrandDropdownOpen(false)} 
                  />
                  <div className="absolute right-0 top-12 w-64 bg-white/95 backdrop-blur-2xl border border-border-subtle rounded-2xl p-3 shadow-xl z-50 space-y-2 mt-1">
                    <Input 
                      value={brandSearchText}
                      onChange={(e) => setBrandSearchText(e.target.value)}
                      placeholder="Search company/brand..."
                      className="h-8 bg-white border-border-subtle text-xs text-gray-900 rounded-lg placeholder-zinc-400"
                    />
                    
                    <div className="max-h-48 overflow-y-auto space-y-1 custom-scrollbar py-1">
                      {selectedBrands.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setSelectedBrands([])}
                          className="w-full text-left text-[10px] text-rose-600 hover:underline px-2 py-0.5 font-bold"
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
                              className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-primary-50 cursor-pointer text-xs text-gray-900 transition-colors select-none font-semibold"
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
                              <span className="truncate capitalize text-gray-900">{brand.name}</span>
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
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none border-b border-border-subtle">
          <button
            type="button"
            onClick={() => setSelectedCategoryFilter("All")}
            className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all border cursor-pointer ${selectedCategoryFilter === "All" ? "bg-primary-600 text-white border-primary-600 shadow-xs" : "bg-white text-gray-900 border-border-subtle hover:bg-primary-50"}`}
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
                className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all border cursor-pointer ${selectedCategoryFilter === cat._id ? "bg-primary-600 text-white border-primary-600 shadow-xs" : "bg-white text-gray-900 border-border-subtle hover:bg-primary-50"}`}
              >
                <span className="capitalize">{cat.name}</span> ({count})
              </button>
            );
          })}
        </div>
 
        {/* 4. INVENTORY DATA TABLE */}
        {sortedProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center p-12 border border-dashed border-border-subtle bg-bg-surface rounded-2xl space-y-4 min-h-[300px]">
            <div className="w-12 h-12 rounded-full bg-primary-50 flex items-center justify-center border border-primary-100 text-primary-600">
              <Package className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-gray-900">No inventory products found</h3>
              <p className="text-xs text-zinc-500 max-w-sm">No items match your search filters or catalog selection.</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-border-subtle bg-bg-surface shadow-xs">
            <Table className="min-w-[1300px]">
              <TableHeader className="bg-primary-50/80 sticky top-0 z-10 backdrop-blur-md">
                <TableRow className="border-b border-border-subtle text-xs uppercase tracking-wider text-primary-900">
                  <TableHead className="font-extrabold py-3.5 text-primary-900 text-left min-w-[200px]">Product</TableHead>
                  <TableHead className="font-extrabold py-3.5 text-primary-900 text-left w-28">SKU</TableHead>
                  <TableHead className="font-extrabold py-3.5 text-primary-900 text-right w-36">Current Stock</TableHead>
                  <TableHead className="font-extrabold py-3.5 text-primary-900 text-right w-32">Reserved Stock</TableHead>
                  <TableHead className="font-extrabold py-3.5 text-primary-900 text-right w-32">Available Stock</TableHead>
                  <TableHead className="font-extrabold py-3.5 text-primary-900 text-right w-24">Min Stock</TableHead>
                  <TableHead className="font-extrabold py-3.5 text-primary-900 text-right w-28">Cost Price</TableHead>
                  <TableHead className="font-extrabold py-3.5 text-primary-900 text-right w-28">Selling Price</TableHead>
                  <TableHead className="font-extrabold py-3.5 text-primary-900 text-right w-32">Inventory Value</TableHead>
                  <TableHead className="font-extrabold py-3.5 text-primary-900 text-left w-32">Supplier</TableHead>
                  <TableHead className="font-extrabold py-3.5 text-primary-900 text-center w-28">Status</TableHead>
                  <TableHead className="font-extrabold py-3.5 text-primary-900 text-center w-32">Last Restocked</TableHead>
                  <TableHead className="font-extrabold py-3.5 text-primary-900 text-right w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedProducts.map((p) => {
                  const stockVal = localOverrides[p._id] !== undefined ? localOverrides[p._id] : (p.currentStock || p.stock || 0);
                  const reservedVal = p.reservedStock || 0;
                  const availableVal = stockVal - reservedVal;
                  const minStockVal = p.minStock !== undefined ? p.minStock : 10;
                  const costVal = p.costPrice || 0;
                  const sellVal = p.sellingPrice || 0;
                  const invVal = stockVal * costVal;
                  const sku = p.productId || `PROD-${p._id.toString().slice(-6).toUpperCase()}`;
                  const supplier = p.supplier || p.company?.name || "Direct Supplier";
                  
                  const statusText = p.status || (availableVal <= 0 ? "Out of Stock" : availableVal <= minStockVal ? "Low Stock" : "In Stock");

                  const restockedDateStr = p.lastRestocked 
                    ? new Date(p.lastRestocked).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                    : "—";

                  return (
                    <TableRow key={p._id} className="border-b border-border-subtle hover:bg-primary-50/40 transition-colors text-xs text-gray-900">
                      {/* Product */}
                      <TableCell className="py-3 text-left min-w-[200px]">
                        <div className="flex items-center gap-3">
                          <div className="relative w-10 h-10 rounded-xl bg-white border border-border-subtle p-0.5 shrink-0 flex items-center justify-center overflow-hidden shadow-2xs">
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
                            <span className="font-extrabold text-gray-900 block truncate capitalize hover:text-primary-700 transition-colors cursor-pointer" onClick={() => { setSelectedDetailProduct(p); setIsDrawerOpen(true); }}>
                              {p.name}
                            </span>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className={`w-1.5 h-1.5 rounded-full ${p.isVisible !== false ? "bg-emerald-500" : "bg-zinc-400"}`} />
                              <span className="text-[10px] text-zinc-500 font-semibold">{p.isVisible !== false ? "Visible" : "Hidden"}</span>
                            </div>
                          </div>
                        </div>
                      </TableCell>

                      {/* SKU */}
                      <TableCell className="font-mono font-bold text-zinc-600 py-3 text-left w-28">{sku}</TableCell>
                      
                      {/* Current Stock */}
                      <TableCell className="font-mono font-bold py-3 text-right w-36" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5 select-none">
                          {editingProductId === p._id ? (
                            <input
                              type="number"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              className="w-16 h-7 bg-white border border-primary-400 rounded-lg text-center text-xs font-mono font-bold text-gray-900 focus:outline-none focus:ring-1 focus:ring-primary-400 shadow-2xs"
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
                                className="w-6 h-6 rounded-lg bg-primary-50 hover:bg-primary-100 text-primary-700 flex items-center justify-center border border-primary-200 active:scale-95 text-xs font-black cursor-pointer shadow-2xs"
                                title="Reduce by 1"
                              >
                                -
                              </button>
                              <span 
                                onClick={() => {
                                  setEditingProductId(p._id);
                                  setEditValue(String(stockVal));
                                }}
                                className={`w-8 text-center font-black cursor-pointer hover:underline ${stockVal === 0 ? "text-rose-600" : stockVal <= minStockVal ? "text-amber-600" : "text-emerald-600"}`}
                                title="Click to type value"
                              >
                                {stockVal}
                              </span>
                              <button 
                                onClick={() => handleOptimisticAdjust(p, 1, "add")}
                                className="w-6 h-6 rounded-lg bg-primary-50 hover:bg-primary-100 text-primary-700 flex items-center justify-center border border-primary-200 active:scale-95 text-xs font-black cursor-pointer shadow-2xs"
                                title="Increase by 1"
                              >
                                +
                              </button>
                            </>
                          )}
                          <span className="text-zinc-500 font-semibold text-[10px] w-6 text-left ml-0.5">{p.stockUnit || "Pcs"}</span>
                        </div>
                      </TableCell>

                      {/* Reserved Stock */}
                      <TableCell className="font-mono text-amber-600 text-right py-3 font-extrabold w-32">
                        {reservedVal} <span className="text-[10px] text-zinc-500">{p.stockUnit || "Pcs"}</span>
                      </TableCell>

                      {/* Available Stock */}
                      <TableCell className="font-mono text-emerald-600 text-right py-3 font-black w-32">
                        {availableVal} <span className="text-[10px] text-zinc-500">{p.stockUnit || "Pcs"}</span>
                      </TableCell>
                      
                      {/* Min Stock */}
                      <TableCell className="font-mono text-zinc-600 text-right py-3 w-24 font-bold">{minStockVal}</TableCell>
                      
                      {/* Prices & Value */}
                      <TableCell className="font-mono text-zinc-600 text-right py-3 w-28 font-medium">₹{costVal}</TableCell>
                      <TableCell className="font-mono text-gray-900 font-bold text-right py-3 w-28">₹{sellVal}</TableCell>
                      <TableCell className="font-mono text-gray-900 font-black text-right py-3 w-32">{formatCurrency(invVal)}</TableCell>
                      
                      {/* Supplier */}
                      <TableCell className="text-zinc-700 font-semibold capitalize py-3 truncate text-left w-32" title={supplier}>
                        {supplier}
                      </TableCell>

                      {/* Status */}
                      <TableCell className="text-center py-3 w-28">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-extrabold whitespace-nowrap inline-flex items-center gap-1.5 ${
                          statusText === "Out of Stock" 
                            ? "bg-rose-50 text-rose-600 border border-rose-200" 
                            : statusText === "Low Stock" 
                              ? "bg-amber-50 text-amber-600 border border-amber-200" 
                              : "bg-emerald-50 text-emerald-600 border border-emerald-200"
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            statusText === "Out of Stock" 
                              ? "bg-rose-500 animate-pulse" 
                              : statusText === "Low Stock" 
                                ? "bg-amber-500 animate-pulse" 
                                : "bg-emerald-500"
                          }`} />
                          {statusText}
                        </span>
                      </TableCell>

                      {/* Last Restocked */}
                      <TableCell className="font-mono text-xs text-zinc-600 font-semibold text-center py-3 w-32">{restockedDateStr}</TableCell>

                      {/* Actions */}
                      <TableCell className="py-3 text-right w-24">
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
        const sku = p.productId || `PROD-${p._id.toString().slice(-6).toUpperCase()}`;
        const stockVal = localOverrides[p._id] !== undefined ? localOverrides[p._id] : (p.currentStock || p.stock || 0);
        const costVal = p.costPrice || 0;
        const sellVal = p.sellingPrice || 0;
        const invVal = stockVal * costVal;
        
        let statusText = p.status || "In Stock";
        let statusClass = "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
        if (statusText === "Out of Stock") {
          statusClass = "bg-rose-500/10 text-rose-400 border border-rose-500/20";
        } else if (statusText === "Low Stock") {
          statusClass = "bg-amber-500/10 text-amber-400 border border-amber-500/20";
        }
 
        const marginAmt = sellVal - costVal;
        const marginPct = sellVal > 0 ? Math.round((marginAmt / sellVal) * 100) : 0;

        return (
          <div className="fixed inset-0 z-50 flex justify-end">
            <div className="fixed inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setIsDrawerOpen(false)} />
            <div className="relative w-full max-w-md bg-[#0c0c0e] border-l border-zinc-800 h-full p-6 overflow-y-auto space-y-6 shadow-2xl z-10">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
                <div>
                  <span className="text-[10px] text-zinc-500 font-mono font-bold">{sku}</span>
                  <h3 className="text-lg font-bold text-white capitalize">{p.name}</h3>
                </div>
                <button onClick={() => setIsDrawerOpen(false)} className="text-zinc-500 hover:text-white p-1 rounded-lg">✕</button>
              </div>

              <div className="space-y-4">
                <div className="h-48 w-full bg-white rounded-2xl p-4 flex items-center justify-center border border-zinc-800">
                  {p.images?.[0] ? (
                    <img src={p.images[0]} alt={p.name} className="h-full object-contain" referrerPolicy="no-referrer" />
                  ) : (
                    <span className="text-zinc-400 font-mono text-xs">No image</span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                  <div className="bg-zinc-900/40 border border-zinc-800/80 p-3 rounded-xl">
                    <span className="text-zinc-500 text-[10px] block font-sans">Current Stock</span>
                    <span className="text-white font-bold text-sm mt-0.5 block">{stockVal} {p.stockUnit || "Pcs"}</span>
                  </div>
                  <div className="bg-zinc-900/40 border border-zinc-800/80 p-3 rounded-xl">
                    <span className="text-zinc-500 text-[10px] block font-sans">Available Stock</span>
                    <span className="text-emerald-400 font-bold text-sm mt-0.5 block">{(stockVal - (p.reservedStock || 0))} {p.stockUnit || "Pcs"}</span>
                  </div>
                  <div className="bg-zinc-900/40 border border-zinc-800/80 p-3 rounded-xl">
                    <span className="text-zinc-500 text-[10px] block font-sans">Reserved Stock</span>
                    <span className="text-amber-400 font-bold text-sm mt-0.5 block">{p.reservedStock || 0} {p.stockUnit || "Pcs"}</span>
                  </div>
                  <div className="bg-zinc-900/40 border border-zinc-800/80 p-3 rounded-xl">
                    <span className="text-zinc-500 text-[10px] block font-sans">Min Stock Threshold</span>
                    <span className="text-zinc-300 font-bold text-sm mt-0.5 block">{p.minStock !== undefined ? p.minStock : 10}</span>
                  </div>
                </div>

                <div className="bg-zinc-900/40 border border-zinc-800/80 p-4 rounded-xl space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Cost Price</span>
                    <span className="font-mono text-zinc-300">₹{costVal}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Selling Price</span>
                    <span className="font-mono text-zinc-100 font-bold">₹{sellVal}</span>
                  </div>
                  <div className="flex justify-between border-t border-zinc-800 pt-2">
                    <span className="text-zinc-400">Profit Margin</span>
                    <span className="font-mono text-emerald-400 font-bold">₹{marginAmt} ({marginPct}%)</span>
                  </div>
                  <div className="flex justify-between border-t border-zinc-800 pt-2">
                    <span className="text-zinc-400">Inventory Asset Value</span>
                    <span className="font-mono text-white font-bold">{formatCurrency(invVal)}</span>
                  </div>
                </div>

                <div className="bg-zinc-900/40 border border-zinc-800/80 p-4 rounded-xl space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Supplier</span>
                    <span className="text-zinc-200 font-semibold">{p.supplier || p.company?.name || "Direct Supplier"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Status</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${statusClass}`}>{statusText}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Last Restocked</span>
                    <span className="font-mono text-zinc-300">
                      {p.lastRestocked ? new Date(p.lastRestocked).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : "—"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* 6. ADJUST STOCK MODAL */}
      <Dialog open={isAdjustStockOpen} onOpenChange={setIsAdjustStockOpen}>
        <DialogContent className="bg-[#0c0c0e] border border-zinc-800 text-white rounded-2xl max-w-sm p-6 space-y-4">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-white">Adjust Stock Level</DialogTitle>
          </DialogHeader>
          {selectedAdjustProduct && (
            <form onSubmit={handleAdjustStockSubmit} className="space-y-4 text-xs">
              <div>
                <p className="text-zinc-400 font-bold capitalize">{selectedAdjustProduct.name}</p>
                <p className="text-zinc-500 text-[10px]">Current Stock: <span className="text-emerald-400 font-mono font-bold">{selectedAdjustProduct.currentStock || selectedAdjustProduct.stock || 0}</span></p>
              </div>

              <div className="space-y-1">
                <label className="text-zinc-400 font-semibold">Adjustment Type</label>
                <select
                  value={adjustForm.type}
                  onChange={(e) => setAdjustForm(prev => ({ ...prev, type: e.target.value }))}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl h-10 px-3 text-xs text-zinc-200 outline-none"
                >
                  <option value="add">Add Stock (+)</option>
                  <option value="subtract">Reduce Stock (-)</option>
                  <option value="set">Set Fixed Total (=)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-zinc-400 font-semibold">Quantity</label>
                <Input
                  type="number"
                  min="1"
                  value={adjustForm.quantity}
                  onChange={(e) => setAdjustForm(prev => ({ ...prev, quantity: e.target.value }))}
                  className="bg-zinc-900 border-zinc-700 text-zinc-100 h-10 rounded-xl"
                />
              </div>

              <div className="space-y-1">
                <label className="text-zinc-400 font-semibold">Reason</label>
                <Input
                  type="text"
                  value={adjustForm.reason}
                  onChange={(e) => setAdjustForm(prev => ({ ...prev, reason: e.target.value }))}
                  placeholder="e.g. Shipment received, Damage writeoff"
                  className="bg-zinc-900 border-zinc-700 text-zinc-100 h-10 rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setIsAdjustStockOpen(false)} className="border-zinc-800 bg-zinc-900 text-zinc-400 h-9 text-xs rounded-xl">Cancel</Button>
                <Button type="submit" disabled={adjustStockMutation.isPending} className="bg-white text-black hover:bg-zinc-200 h-9 text-xs font-bold rounded-xl">
                  {adjustStockMutation.isPending ? "Saving..." : "Save Adjustment"}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* 7. AUDIT LOG HISTORY MODAL */}
      <Dialog open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
        <DialogContent className="bg-[#0c0c0e] border border-zinc-800 text-white rounded-2xl max-w-md p-6 space-y-4">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-white">Stock Adjustment Audit Log</DialogTitle>
          </DialogHeader>
          {selectedHistoryProduct && (
            <div className="space-y-3">
              <p className="text-xs text-zinc-400 font-bold capitalize">{selectedHistoryProduct.name}</p>
              <div className="max-h-60 overflow-y-auto space-y-2 border-t border-zinc-800/80 pt-3 text-xs">
                {getProductHistory(selectedHistoryProduct).map((log, idx) => (
                  <div key={idx} className="bg-zinc-900/40 border border-zinc-800/60 p-3 rounded-xl flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-zinc-200 capitalize">{log.reason || "Manual update"}</p>
                      <p className="text-[10px] text-zinc-500 font-mono mt-0.5">{new Date(log.date).toLocaleString('en-IN')}</p>
                    </div>
                    <div className="text-right font-mono">
                      <span className={`font-bold ${log.type === "add" ? "text-emerald-400" : log.type === "subtract" ? "text-rose-400" : "text-blue-400"}`}>
                        {log.type === "add" ? `+${log.quantity}` : log.type === "subtract" ? `-${log.quantity}` : log.quantity}
                      </span>
                      <span className="text-[10px] text-zinc-500 block">Stock: {log.newStock}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
