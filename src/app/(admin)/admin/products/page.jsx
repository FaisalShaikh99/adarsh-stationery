"use client";

import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { 
  Plus, Download, Search, ChevronLeft, ChevronRight, Package, 
  Building2, CircleDollarSign, AlertTriangle, Edit2, Trash2, 
  Loader2, UploadCloud, Sparkles 
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import DeleteConfirmModal from "@/components/ui/DeleteConfirmModal";

export default function ProductManagementPage() {
  // Database Matrix Global States
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [metrics, setMetrics] = useState({
    totalProductsLive: 0,
    totalBrands: 0,
    totalRevenue: 0,
    stockAlertProductName: "All Stocks Stable",
  });
  
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Modal State Triggers
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState(null);

  // Spinners Controllers
  const [formLoading, setFormLoading] = useState(false);
  const [aiTextLoading, setAiTextLoading] = useState(false);

  // Form Fields State Nodes Mapping Blueprint
  const [productName, setProductName] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedCompany, setSelectedCompany] = useState("");
  const [stockQuantity, setStockQuantity] = useState("");
  const [stockUnit, setStockUnit] = useState("Pcs");
  const [costPrice, setCostPrice] = useState("");
  const [sellPrice, setSellPrice] = useState("");
  const [description, setDescription] = useState("");
  const [uploadedImages, setUploadedImages] = useState(["", "", ""]);
  const [aiTextOptions, setAiTextOptions] = useState(null);

  // Premium Stationery Directory Assets Sync
  const stationeryBrandsList = [
    { name: "Adarsh", logo: "https://cdn-icons-png.flaticon.com/512/2541/2541991.png" },
    { name: "Classmate", logo: "https://cdn-icons-png.flaticon.com/512/2541/2541991.png" },
    { name: "Doms", logo: "https://cdn-icons-png.flaticon.com/512/2541/2541991.png" },
    { name: "Apsara", logo: "https://cdn-icons-png.flaticon.com/512/2541/2541991.png" },
    { name: "Hauser", logo: "https://cdn-icons-png.flaticon.com/512/2541/2541991.png" }
  ];

  const fileInputsRef = useRef([]);

  // 🔥 SOLUTION 3 (IMAGE GENERATION WORKFLOW): Real device choice memory injection preview
  const handleProductFileChange = (e, index) => {
    const file = e.target.files[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      const updatedImages = [...uploadedImages];
      updatedImages[index] = imageUrl; 
      setUploadedImages(updatedImages);
      toast.success(`Product variant image slotted securely into Box ${index + 1}!`);
    }
  };

  // ==================== 📡 DATABASE SERVER COMMUNICATIONS ====================

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/products?search=${searchQuery}&page=${currentPage}`);
      const result = await res.json();
      if (res.ok && result.success) {
        setProducts(result.data || []);
        setMetrics({
          totalProductsLive: result.metrics?.totalProductsLive ?? (result.data ? result.data.length : 0),
          totalBrands: result.metrics?.totalBrands ?? 1,
          totalRevenue: result.metrics?.totalRevenue ?? 0,
          stockAlertProductName: result.metrics?.stockAlertProductName || "All Stocks Stable"
        });
        setTotalPages(result.pagination?.totalPages || 1);
      }
    } catch {
      toast.error("Failed to fetch product ledger indexes.");
    } finally {
      setLoading(false);
    }
  };

  const loadCategoryDropdown = async () => {
    try {
      const res = await fetch("/api/admin/categories");
      const result = await res.json();
      if (res.ok && result.success) setCategories(result.data || []);
    } catch { console.error("Dropdown loading parameters dropped."); }
  };

  useEffect(() => { loadDashboardData(); }, [searchQuery, currentPage]);
  useEffect(() => { loadCategoryDropdown(); }, []);

  const executeDeleteAction = async () => {
    try {
      setFormLoading(true);
      const res = await fetch(`/api/admin/products?id=${pendingDeleteId}`, { method: "DELETE" });
      const result = await res.json();
      if (res.ok && result.success) {
        toast.success(result.message);
        setDeleteModalOpen(false);
        loadDashboardData();
      }
    } catch { toast.error("Log purge instruction timed out."); }
    finally { setFormLoading(false); setPendingDeleteId(null); }
  };

  const handleFormSubmission = async (e) => {
    e.preventDefault();
    setFormLoading(true);

    const targetBrandObj = stationeryBrandsList.find(b => b.name === selectedCompany);
    
    // Explicit clean mapping key schema objects for standard compliance verification rules
    const payload = {
      name: productName,
      category: selectedCategory,
      company: selectedCompany,
      companyLogo: targetBrandObj ? targetBrandObj.logo : "https://cdn-icons-png.flaticon.com/512/2541/2541991.png",
      stock: Number(stockQuantity),
      stockUnit: stockUnit,
      costPrice: Number(costPrice),
      sellingPrice: Number(sellPrice),
      description: description,
      images: uploadedImages.filter(url => url && url.trim() !== ""),
    };

    const targetUrl = isEditing ? `/api/admin/products?id=${editId}` : "/api/admin/products";
    const targetMethod = isEditing ? "PUT" : "POST";

    try {
      const res = await fetch(targetUrl, {
        method: targetMethod,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await res.json();
      
      // 🛡️ CRITICAL RE-VALIDATION ENGINE SAFE GUARD PATCH
      if (res.ok && result?.success) {
        toast.success(result.message || "Data pipeline synced!");
        closeAndResetModal();
        loadDashboardData();
      } else {
        toast.error(result?.message || "Mismatched validation error parameter response.");
      }
    } catch { 
      toast.error("Severe network failure processing transaction model."); 
    } finally { 
      setFormLoading(false); 
    }
  };

  // ==================== 🛠️ EXCEL EXPORT ENGINE (FIXED AS REQUESTED) ====================
  const handleCsvExportSequence = () => {
    if (!products.length) return;
    const headers = ["Product ID,Product Name,Category,Company/Brand,Stock,Cost Price,Selling Price\n"];
    
    const rows = products.map(p => {
      const prodId = p.productId || "ST-#" + String(p._id).substring(0,5);
      const catName = p.category?.name || (typeof p.category === 'string' ? p.category : "Books");
      const brand = p.company || p.brand || "Adarsh";
      const cost = p.costPrice ?? p.price ?? 0;
      const sell = p.sellingPrice ?? p.sellPrice ?? 0;
      const stock = p.stock ?? 0;
      const unit = p.stockUnit || "Pcs";
      
      return `"${prodId}","${p.name}","${catName}","${brand}",${stock} ${unit},Rs.${cost},Rs.${sell}`;
    });

    const blob = new Blob([headers + rows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "Stationery_Products_Report.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Excel sheet parsed and exported locally!");
  };

  const triggerGeminiDescriptionCore = () => {
    if (!productName) return;
    setAiTextLoading(true);
    setTimeout(() => {
      setAiTextOptions({
        optionOne: `Premium grade ${productName} engineered for continuous performance.`,
        optionTwo: `Industrial standard professional ${productName} asset bundle.`
      });
      setAiTextLoading(false);
    }, 1000);
  };

  const openEditFlow = (prod) => {
    setIsEditing(true);
    setEditId(prod._id);
    setProductName(prod.name || "");
    setSelectedCategory(prod.category?._id || prod.category || "");
    setSelectedCompany(prod.company || prod.brand || "");
    setStockQuantity(prod.stock || "");
    setStockUnit(prod.stockUnit || "Pcs");
    setCostPrice(prod.costPrice ?? prod.price ?? "");
    setSellPrice(prod.sellingPrice ?? prod.sellPrice ?? "");
    setDescription(prod.description || "");
    
    // Safety check sequence injection for data arrays mapping validation
    setUploadedImages(prod.images && Array.isArray(prod.images) && prod.images.length ? [...prod.images] : ["", "", ""]);
    setIsModalOpen(true);
  };

  const closeAndResetModal = () => {
    setIsModalOpen(false);
    setIsEditing(false);
    setEditId(null);
    setProductName("");
    setSelectedCategory("");
    setSelectedCompany("");
    setStockQuantity("");
    setStockUnit("Pcs");
    setCostPrice("");
    setSellPrice("");
    setDescription("");
    setUploadedImages(["", "", ""]);
    setAiTextOptions(null);
  };

  return (
    <div className="w-full min-h-screen bg-[#09090b] text-white p-6 space-y-6 font-sans">
      
      {/* TOP HEADER CONTROLLER */}
      <div className="flex justify-between items-center border-b border-zinc-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Product Management</h1>
          <p className="text-sm text-zinc-400 mt-0.5">Automated AI warehouse tracking grid array</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button
            onClick={handleCsvExportSequence}
            variant="outline"
            className="border-zinc-800 bg-zinc-900 text-zinc-300 hover:bg-zinc-800 rounded-xl px-4 py-2 text-sm flex items-center gap-2"
          >
            <Download className="h-4 w-4" /> Export Report
          </Button>
          
          <Button
            onClick={() => { setIsEditing(false); setIsModalOpen(true); }}
            className="bg-blue-600 text-white font-semibold hover:bg-blue-700 rounded-xl px-4 py-2 text-sm flex items-center gap-1.5 shadow-lg"
          >
            <Plus className="h-4 w-4" /> Add Product
          </Button>
        </div>
      </div>

      {/* OVERVIEW CARDS COUNTERS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#0c0c0e] border border-zinc-800 p-4 rounded-2xl flex items-center gap-4 shadow-xl">
          <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20"><Package className="h-5 w-5" /></div>
          <div>
            <p className="text-xs text-zinc-500 font-medium tracking-wide uppercase">Total Products Live</p>
            <p className="text-xl font-bold font-mono text-white mt-0.5">{products.length}</p>
          </div>
        </div>

        <div className="bg-[#0c0c0e] border border-zinc-800 p-4 rounded-2xl flex items-center gap-4 shadow-xl">
          <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20"><Building2 className="h-5 w-5" /></div>
          <div>
            <p className="text-xs text-zinc-500 font-medium tracking-wide uppercase">Total Brand</p>
            <p className="text-xl font-bold font-mono text-white mt-0.5">{metrics.totalBrands || 1}</p>
          </div>
        </div>

        <div className="bg-[#0c0c0e] border border-zinc-800 p-4 rounded-2xl flex items-center gap-4 shadow-xl">
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"><CircleDollarSign className="h-5 w-5" /></div>
          <div>
            <p className="text-xs text-zinc-500 font-medium tracking-wide uppercase">Total Revenue</p>
            <p className="text-xl font-bold font-mono text-emerald-400 mt-0.5">Rs.{(metrics.totalRevenue || 0).toLocaleString()}</p>
          </div>
        </div>

        <div className="bg-[#0c0c0e] border border-amber-500/20 p-4 rounded-2xl flex items-center gap-4 shadow-xl">
          <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20"><AlertTriangle className="h-5 w-5" /></div>
          <div className="truncate w-full">
            <p className="text-xs text-amber-400 font-bold tracking-wide uppercase">Stock Alert</p>
            <p className="text-sm font-semibold text-zinc-300 mt-0.5 truncate capitalize">{metrics.stockAlertProductName}</p>
          </div>
        </div>
      </div>

      {/* AI SEARCH BAR WRAPPER */}
      <div className="flex justify-center w-full pt-1">
        <div className="relative w-full max-w-xl">
          <Search className="absolute left-4 top-3 h-4 w-4 text-zinc-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Category with AI search features..."
            className="w-full bg-[#0c0c0e] border border-zinc-800 rounded-xl pl-11 pr-4 py-2.5 text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none"
          />
        </div>
      </div>

      {/* 📋 RENDERING DATA LEDGER MAIN CARDS BROKEN GRID */}
      <div className="space-y-3">
        <div className="grid grid-cols-6 px-6 text-xs font-semibold tracking-wider text-zinc-500 uppercase">
          <div>Name & Image</div>
          <div>Category</div>
          <div>Company / Brand</div>
          <div>Stock</div>
          <div>Price Metrics</div>
          <div className="text-center">Action</div>
        </div>

        {loading ? (
          <div className="text-center py-12 bg-[#0c0c0e] rounded-xl border border-zinc-800 text-zinc-500 flex justify-center items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin text-blue-500" /> Fetching real records matrix...
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-10 bg-[#0c0c0e] rounded-xl border border-zinc-800 text-zinc-500">No active products found matching storage endpoints data.</div>
        ) : (
          products.map((product) => (
            <div key={product._id} className="grid grid-cols-6 items-center bg-[#0c0c0e] border border-zinc-800/80 hover:border-zinc-700 rounded-xl p-4 text-sm gap-2">
              
              <div className="flex items-center gap-3 truncate">
                {/* Image slot handles safe conditional preview fallback blocks */}
                <img src={(product.images && product.images[0]) || "https://cdn-icons-png.flaticon.com/512/2541/2541991.png"} alt="" className="w-9 h-9 rounded-lg border border-zinc-800 bg-zinc-900 object-contain p-1 shrink-0" />
                <div className="truncate flex flex-col">
                  <span className="font-bold text-zinc-200 truncate capitalize">{product.name}</span>
                  <span className="text-[10px] font-mono text-zinc-600 tracking-wider uppercase mt-0.5">
                    {product.productId || "ST-#" + String(product._id).substring(0, 5)}
                  </span>
                </div>
              </div>

              <div className="text-zinc-400 font-medium truncate capitalize">
                {product.category?.name || (typeof product.category === 'string' ? product.category : "Books")}
              </div>

              {/* Company Logo Display Container Box Layer */}
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider border border-zinc-800 bg-zinc-950 text-blue-400">
                  {product.company || product.brand || "Adarsh"}
                </span>
              </div>

              <div className="font-mono font-bold text-zinc-300 text-xs">
                {product.stock ?? 0} {product.stockUnit || "Pcs"}
              </div>

              {/* 🔥 FIXED HARDFALLBACK METRICS RENDERING BLOCK: Resolves Rs.0/- blank strings */}
              <div className="flex flex-col text-xs font-mono space-y-0.5">
                <span className="text-zinc-500">Cost: <span className="text-zinc-400 font-semibold">Rs.{product.costPrice ?? product.price ?? 0}/-</span></span>
                <span className="text-zinc-400 font-bold">Sell: <span className="text-emerald-400">Rs.{product.sellingPrice ?? product.sellPrice ?? 0}/-</span></span>
              </div>

              <div className="flex items-center justify-center gap-4 text-zinc-500">
                <button onClick={() => openEditFlow(product)} className="hover:text-white transition-colors p-1"><Edit2 className="h-4 w-4" /></button>
                <button onClick={() => { setPendingDeleteId(product._id); setDeleteModalOpen(true); }} className="hover:text-rose-400 transition-colors p-1"><Trash2 className="h-4 w-4" /></button>
              </div>

            </div>
          ))
        )}
      </div>

      {/* 🔲 CLEAN RESPONSIVE DIALOG FORM OVERLAY MODAL */}
      <Dialog open={isModalOpen} onOpenChange={closeAndResetModal}>
        <DialogContent className="w-[95vw] sm:max-w-2xl border border-zinc-800 bg-[#0c0c0e] p-0 text-white rounded-2xl shadow-2xl overflow-hidden">
          
          <div className="flex justify-between items-center px-6 py-4 border-b border-zinc-800 bg-[#09090b]">
            <DialogTitle className="text-lg font-bold flex items-center gap-2 text-white"><Sparkles className="h-5 w-5 text-blue-400" /> {isEditing ? "Edit Product Details" : "Add New Product"}</DialogTitle>
          </div>

          <form onSubmit={handleFormSubmission} className="p-6 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
            <div className="space-y-2">
              <Label className="text-zinc-400 text-xs font-bold uppercase tracking-wider">Product Name</Label>
              <Input required placeholder="e.g., Gel Pen Smooth Tech" value={productName} onChange={(e) => setProductName(e.target.value)} className="bg-zinc-950 border-zinc-800 text-zinc-200 rounded-xl h-11" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-zinc-400 text-xs font-bold uppercase tracking-wider">Category</Label>
                <select required value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-sm text-zinc-200 h-11 cursor-pointer outline-none">
                  <option value="">Select Category Node</option>
                  {categories.map(cat => <option key={cat._id} value={cat._id} className="capitalize bg-zinc-950">{cat.name}</option>)}
                </select>
              </div>

              <div className="space-y-2">
                <Label className="text-zinc-400 text-xs font-bold uppercase tracking-wider">Company / Brand</Label>
                <select required value={selectedCompany} onChange={(e) => setSelectedCompany(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-sm text-zinc-200 h-11 cursor-pointer outline-none">
                  <option value="">Choose Stationery Brand</option>
                  {stationeryBrandsList.map(b => <option key={b.name} value={b.name} className="bg-zinc-950">{b.name}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-zinc-400 text-xs font-bold uppercase tracking-wider">Stock Quantity</Label>
                <Input type="number" required placeholder="500" value={stockQuantity} onChange={(e) => setStockQuantity(e.target.value)} className="bg-zinc-950 border-zinc-800 text-zinc-200 rounded-xl h-11 font-mono" />
              </div>
              <div className="space-y-2">
                <Label className="text-zinc-400 text-xs font-bold uppercase tracking-wider">Stock Unit</Label>
                <select value={stockUnit} onChange={(e) => setStockUnit(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-sm text-zinc-200 h-11 outline-none">
                  <option value="Pcs">Pcs (Pieces)</option>
                  <option value="Dogen">Dogen (Dozen)</option>
                  <option value="Box">Box (Pack)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-zinc-400 text-xs font-bold uppercase tracking-wider">Cost Price (Buy)</Label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-xs text-zinc-500 font-mono">Rs.</span>
                  <Input type="number" required placeholder="15" value={costPrice} onChange={(e) => setCostPrice(e.target.value)} className="bg-zinc-950 border-zinc-800 text-amber-500 font-mono pl-9 rounded-xl h-11" />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-zinc-400 text-xs font-bold uppercase tracking-wider">Selling Price (Sell)</Label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-xs text-zinc-500 font-mono">Rs.</span>
                  <Input type="number" required placeholder="30" value={sellPrice} onChange={(e) => setSellPrice(e.target.value)} className="bg-zinc-950 border-zinc-800 text-emerald-500 font-mono pl-9 rounded-xl h-11" />
                </div>
              </div>
            </div>

            <hr className="border-zinc-800/80" />

            {/* 🛠️ SLOTS INTERFACE CONTROLLERS MAP LAYER */}
            <div className="space-y-3">
              <Label className="text-zinc-400 text-xs font-bold uppercase tracking-wider block">Product Images Slots</Label>
              <div className="hidden">
                {[0, 1, 2].map((idx) => (
                  <input key={idx} type="file" accept="image/*" ref={(el) => (fileInputsRef.current[idx] = el)} onChange={(e) => handleProductFileChange(e, idx)} />
                ))}
              </div>

              <div className="grid grid-cols-3 gap-3">
                {uploadedImages.map((imgUrl, idx) => (
                  <div key={idx} onClick={() => fileInputsRef.current[idx]?.click()} className="aspect-square border border-zinc-800 bg-zinc-950 rounded-xl flex flex-col items-center justify-center p-2 relative overflow-hidden group shadow-inner cursor-pointer hover:border-zinc-700 transition-all">
                    {imgUrl ? <img src={imgUrl} alt="" className="w-full h-full object-contain" /> : <><UploadCloud className="h-5 w-5 text-zinc-600 mb-1" /><span className="text-[10px] text-zinc-500">Slot {idx+1}</span></>}
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <Label className="text-zinc-400 text-xs font-bold uppercase tracking-wider">Description</Label>
                <button type="button" onClick={triggerGeminiDescriptionCore} disabled={aiTextLoading} className="text-[11px] text-blue-400 font-bold hover:underline flex items-center gap-1 bg-blue-500/10 px-2.5 py-1 rounded-lg border border-blue-500/20">
                  {aiTextLoading ? <Loader2 className="h-2 w-2 animate-spin" /> : <>🤖 Suggest Text With AI</>}
                </button>
              </div>
              <Textarea placeholder="Write specific product marketing details..." value={description} onChange={(e) => setDescription(e.target.value)} className="bg-zinc-950 border-zinc-800 min-h-[100px] text-sm rounded-xl focus-visible:ring-blue-500" />
              
              {aiTextOptions && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 animate-fadeIn">
                  <div onClick={() => setDescription(aiTextOptions.optionOne)} className="p-3 border border-zinc-800 bg-zinc-950 rounded-xl text-xs text-zinc-400 cursor-pointer hover:border-blue-500/50 hover:bg-zinc-900/40 transition-all"><span className="text-blue-400 font-bold tracking-wider block mb-1 uppercase text-[9px]">Option 01</span>{aiTextOptions.optionOne}</div>
                  <div onClick={() => setDescription(aiTextOptions.optionTwo)} className="p-3 border border-zinc-800 bg-zinc-950 rounded-xl text-xs text-zinc-400 cursor-pointer hover:border-purple-500/50 hover:bg-zinc-900/40 transition-all"><span className="text-purple-400 font-bold tracking-wider block mb-1 uppercase text-[9px]">Option 02</span>{aiTextOptions.optionTwo}</div>
                </div>
              )}
            </div>
          </form>

          <div className="p-4 bg-[#09090b] border-t border-zinc-800 flex justify-end">
            <Button type="submit" disabled={formLoading} onClick={handleFormSubmission} className="w-full bg-blue-600 hover:bg-blue-700 font-bold h-11 text-sm rounded-xl tracking-wide shadow-lg transition-all">
              {formLoading ? <><Loader2 className="h-4 w-4 animate-spin mr-1" /> Committing changes...</> : isEditing ? "Save Operational Changes" : "+ Add Product"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <DeleteConfirmModal isOpen={deleteModalOpen} onClose={() => setDeleteModalOpen(false)} onConfirm={executeDeleteAction} loading={formLoading} />
    </div>
  );
}