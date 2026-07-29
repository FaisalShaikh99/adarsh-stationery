"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import axios from "axios";
import { 
  Sparkles, 
  ArrowRight, 
  Loader2, 
  ShieldCheck, 
  LayoutDashboard, 
  TrendingUp, 
  BookOpen,
  Package,
  Boxes,
  CreditCard,
  Settings,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  Clock,
  CheckCircle,
  FileText,
  Activity,
  Layers,
  AlertTriangle
} from "lucide-react";

export default function Home() {
  const router = useRouter();
  
  // Book State: currentPage index (0 = Front Cover, 1 = Dashboard, 2 = Products, 3 = Inventory, 4 = Payments, 5 = Settings)
  const [currentPage, setCurrentPage] = useState(0);
  const [isFlipping, setIsFlipping] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [navStatusText, setNavStatusText] = useState("Opening Business Ledger...");

  // Real Business Metrics State (Fetched directly from MongoDB)
  const [metrics, setMetrics] = useState({
    formattedRevenue: "₹0",
    totalOrders: 0,
    growthPct: "+0%",
    totalProducts: 0,
    totalCustomers: 0,
    recentOrdersStream: [],
    lowStockWatchlist: [],
    categoryBreakdown: []
  });

  // Fetch Live Real Metrics on Component Mount
  useEffect(() => {
    async function fetchSummary() {
      try {
        const res = await axios.get("/api/public/summary");
        if (res.data?.success && res.data?.data) {
          setMetrics(res.data.data);
        }
      } catch (err) {
        console.error("Failed to fetch live summary metrics:", err);
      }
    }
    fetchSummary();
  }, []);

  // Handle Page Turn Flip
  const changePage = (newPage) => {
    if (isFlipping || newPage === currentPage || newPage < 0 || newPage > 5) return;
    setIsFlipping(true);
    setCurrentPage(newPage);
    setTimeout(() => {
      setIsFlipping(false);
    }, 800);
  };

  // 🌟 PREVENT WEBPAGE SCROLLING & SCROLL ONLY BOOK PAGES (PASSIVE: FALSE)
  useEffect(() => {
    let lastScrollTime = 0;
    const handleWheel = (e) => {
      // Lock viewport scrolling completely so only book pages flip!
      e.preventDefault();

      const now = Date.now();
      if (now - lastScrollTime < 800 || isNavigating) return;

      if (e.deltaY > 15) {
        lastScrollTime = now;
        setCurrentPage((prev) => {
          if (prev < 5) {
            setIsFlipping(true);
            setTimeout(() => setIsFlipping(false), 800);
            return prev + 1;
          }
          return prev;
        });
      } else if (e.deltaY < -15) {
        lastScrollTime = now;
        setCurrentPage((prev) => {
          if (prev > 0) {
            setIsFlipping(true);
            setTimeout(() => setIsFlipping(false), 800);
            return prev - 1;
          }
          return prev;
        });
      }
    };

    window.addEventListener("wheel", handleWheel, { passive: false });
    return () => window.removeEventListener("wheel", handleWheel);
  }, [isNavigating]);

  // Navigate to Specific Page Section
  const handleOpenSection = (destinationPath, sectionName) => {
    if (isNavigating) return;
    setIsNavigating(true);
    setNavStatusText(`Loading ${sectionName}...`);

    setTimeout(() => {
      router.push(destinationPath);
    }, 1600);
  };

  const bookmarkTabs = [
    { id: 1, title: "Dashboard", icon: LayoutDashboard, path: "/admin/dashboard" },
    { id: 2, title: "Products", icon: Package, path: "/admin/products" },
    { id: 3, title: "Inventory", icon: Boxes, path: "/admin/inventory" },
    { id: 4, title: "Payments", icon: CreditCard, path: "/admin/payments" },
    { id: 5, title: "Settings", icon: Settings, path: "/admin/settings" },
  ];

  return (
    <main className="fixed inset-0 overflow-hidden bg-[linear-gradient(180deg,#CBB4E8_0%,#DBC2F5_25%,#ECCDF8_50%,#F5DEFA_75%,#FBF0FD_100%)] font-sans text-gray-900 select-none flex flex-col justify-between p-3 sm:p-5 md:p-8">
      
      {/* Ambient Lighting Overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(223,67,240,0.18),transparent_40%),radial-gradient(circle_at_bottom_right,rgba(155,102,212,0.22),transparent_45%)] pointer-events-none" />

      {/* 🌟 PAGE NAVIGATION OVERLAY */}
      {isNavigating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/92 backdrop-blur-2xl animate-in fade-in duration-500 p-6">
          <div className="flex flex-col items-center max-w-sm w-full space-y-6 text-center animate-in zoom-in-95 duration-500">
            <div className="w-24 h-24 rounded-3xl bg-white border border-purple-200 shadow-2xl flex items-center justify-center p-3">
              <Image
                src="/logo-icon.png"
                alt="Adarsh Logo"
                width={1024}
                height={1024}
                priority
                className="w-full h-full object-contain mix-blend-multiply"
              />
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-center gap-2 text-xs font-black uppercase tracking-wider text-purple-700">
                <Sparkles className="w-4 h-4 animate-spin text-fuchsia-600" />
                <span>{navStatusText}</span>
              </div>
              <h2 className="text-2xl font-black text-gray-900 tracking-tight">Adarsh Stationery Suite</h2>
            </div>
            <div className="w-full bg-purple-100 rounded-full h-2.5 overflow-hidden p-0.5 border border-purple-200">
              <div className="h-full bg-gradient-to-r from-[#DF43F0] via-[#A851E8] to-[#7B3BE0] rounded-full animate-pulse w-full" />
            </div>
          </div>
        </div>
      )}

      {/* 🌟 MAIN SPIRAL REGISTER - RESPONSIVE SCALABLE BOOK (WIDE ON DESKTOP) */}
      <section className="relative z-10 my-auto py-2 flex items-center justify-center flex-1 w-full">
        
        {/* 3D Perspective Book Wrapper */}
        <div className="relative w-[96vw] max-w-[1240px] h-[85vh] max-h-[880px] min-h-[600px] bg-[#FAFBFD] border-2 border-purple-300/90 rounded-[34px] shadow-2xl overflow-visible flex flex-col border-r-4 border-r-purple-200 [perspective:1800px]">
          
          {/* 🌀 100% CONTAINED REALISTIC SPIRAL SPINE (ANCHORED INSIDE LEFT EDGE) */}
          <div className="absolute left-0 top-0 bottom-0 z-40 w-12 sm:w-14 flex flex-col justify-between py-6 px-1.5 sm:px-2 pointer-events-none bg-gradient-to-r from-purple-200/40 via-purple-100/20 to-transparent border-r border-purple-200/50 rounded-l-[34px]">
            {Array.from({ length: 18 }).map((_, i) => (
              <div key={i} className="flex items-center gap-1">
                {/* Paper punch hole */}
                <div className="w-2.5 sm:w-3 h-2.5 sm:h-3 rounded-full bg-zinc-300 shadow-inner border border-zinc-400/60" />
                {/* 3D Metallic Ring Coil */}
                <div className="w-7 sm:w-9 h-2.5 sm:h-3 rounded-full bg-gradient-to-r from-zinc-300 via-white to-zinc-400 shadow-md border border-zinc-400/80 -ml-1.5" />
              </div>
            ))}
          </div>

          {/* 🔖 5 INDEX DIVIDER BOOKMARK TABS */}
          <div className="absolute -right-28 sm:-right-36 lg:-right-40 top-8 bottom-8 z-40 flex flex-col justify-around pointer-events-auto">
            {bookmarkTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = currentPage === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => changePage(tab.id)}
                  className={`h-11 sm:h-13 px-3.5 sm:px-5 rounded-r-2xl font-black text-xs sm:text-sm lg:text-base flex items-center gap-2 sm:gap-2.5 transition-all duration-300 shadow-lg cursor-pointer border-y border-r border-purple-300/80 ${
                    isActive 
                      ? "bg-[#8031A6] text-white border-purple-400 translate-x-2 shadow-purple-500/30 ring-2 ring-purple-300 z-50" 
                      : "bg-white/95 text-purple-950 hover:bg-white hover:translate-x-1 hover:text-purple-700 z-30"
                  }`}
                >
                  <Icon className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
                  <span className="inline tracking-wide">{tab.title}</span>
                </button>
              );
            })}
          </div>

          {/* 📖 3D PAPER PAGE FLIPPING MATRIX */}
          <div className="w-full h-full relative [transform-style:preserve-3d]">
            
            {/* 🌟 COVER PAGE (PAGE 0) */}
            <div 
              className={`absolute inset-0 bg-gradient-to-br from-[#702594] via-[#9B66D4] to-[#5B2C8F] rounded-[34px] pl-14 sm:pl-16 pr-6 sm:pr-10 py-8 text-white flex flex-col justify-between items-center text-center transition-all duration-800 ease-in-out origin-left border-2 border-white/20 shadow-2xl [transform-style:preserve-3d] ${
                currentPage === 0
                  ? "[transform:rotateY(0deg)] opacity-100 z-30 pointer-events-auto"
                  : "[transform:rotateY(-180deg)] opacity-100 z-20 pointer-events-none"
              }`}
            >
              <div className="space-y-3 pt-4">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-5 py-1.5 text-xs sm:text-sm font-black uppercase tracking-widest text-purple-100">
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Executive Business Ledger</span>
                </div>
                <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight text-white pt-2 leading-tight">
                  ADARSH STATIONERY MART
                </h1>
                <p className="text-xs sm:text-sm text-purple-100 font-bold uppercase tracking-[0.25em]">
                  Business Management Book & Inventory Register
                </p>
              </div>

              {/* ENLARGED PROMINENT ADARSH LOGO ON COVER PAGE */}
              <div className="w-48 sm:w-64 md:w-72 h-48 sm:h-64 md:h-72 bg-white/95 rounded-3xl p-5 shadow-2xl border-4 border-white/50 flex items-center justify-center my-3 hover:scale-105 transition-transform">
                <Image
                  src="/logo-full.png"
                  alt="Adarsh Logo"
                  width={1024}
                  height={1024}
                  priority
                  className="w-full h-full object-contain mix-blend-multiply filter drop-shadow-md"
                />
              </div>

              <div className="space-y-3 w-full max-w-sm pb-3">
                <button
                  onClick={() => changePage(1)}
                  className="btn-pill-gradient w-full h-13 rounded-full font-black text-base text-white flex items-center justify-center gap-2.5 shadow-xl hover:scale-105 transition-all cursor-pointer border border-white/30"
                >
                  <span>Open Notebook Pages</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
                <p className="text-xs text-purple-200 font-mono font-bold">
                  Scroll mouse wheel anywhere to flip pages
                </p>
              </div>
            </div>

            {/* 🌟 PAGE 1: EXECUTIVE DASHBOARD */}
            <div 
              className={`absolute inset-0 bg-[#FAFBFD] rounded-[34px] pl-14 sm:pl-16 pr-6 sm:pr-10 py-6 sm:py-8 flex flex-col justify-between transition-all duration-800 ease-in-out origin-left shadow-2xl [transform-style:preserve-3d] ${
                currentPage === 1
                  ? "[transform:rotateY(0deg)] opacity-100 z-30 pointer-events-auto"
                  : currentPage > 1
                  ? "[transform:rotateY(-180deg)] opacity-100 z-20 pointer-events-none"
                  : "[transform:rotateY(0deg)] opacity-100 z-10 pointer-events-none"
              }`}
            >
              <div className="space-y-5 overflow-y-auto pr-1">
                <div className="flex items-center justify-between border-b border-border-subtle pb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-2xl bg-purple-100 text-purple-700">
                      <LayoutDashboard className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-purple-700">Page 1 • Executive Summary</span>
                      <h2 className="text-xl sm:text-2xl font-black text-gray-900">Sales & Operations Pulse</h2>
                    </div>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs sm:text-sm font-black bg-emerald-500/10 text-emerald-700 border border-emerald-200">
                    {metrics.growthPct} ▲
                  </span>
                </div>

                {/* Real Metrics Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                  <div className="p-4 rounded-2xl bg-white border border-border-subtle shadow-2xs space-y-1">
                    <p className="text-xs font-bold text-zinc-500 uppercase">Gross Revenue</p>
                    <p className="text-2xl font-black text-gray-900 font-mono">{metrics.formattedRevenue}</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-white border border-border-subtle shadow-2xs space-y-1">
                    <p className="text-xs font-bold text-zinc-500 uppercase">Total Orders</p>
                    <p className="text-2xl font-black text-gray-900 font-mono">{metrics.totalOrders.toLocaleString("en-IN")}</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-[#9B66D4] to-[#D8A5E9] text-white shadow-xs space-y-1">
                    <p className="text-xs font-bold text-purple-100 uppercase font-mono">Revenue Growth</p>
                    <p className="text-2xl font-black font-mono">{metrics.growthPct}</p>
                  </div>
                </div>

                {/* Live Real Order Stream Table */}
                <div className="bg-white border border-border-subtle rounded-2xl p-4 sm:p-5 space-y-3 shadow-2xs flex-1 flex flex-col justify-between">
                  <div className="flex items-center justify-between border-b border-border-subtle pb-2">
                    <span className="text-xs sm:text-sm font-black text-purple-900 uppercase tracking-wider flex items-center gap-2">
                      <Activity className="w-4 h-4 text-primary-600" /> Live Real Order Activity Stream
                    </span>
                    <span className="text-xs font-mono font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">Real Database</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-medium">
                    {metrics.recentOrdersStream && metrics.recentOrdersStream.length > 0 ? (
                      metrics.recentOrdersStream.map((order, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-purple-50/60 border border-purple-100">
                          <div className="flex items-center gap-2.5 min-w-0 pr-2">
                            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                            <div className="min-w-0">
                              <p className="font-black text-gray-900 text-xs sm:text-sm truncate">{order.orderNumber} • {order.customerName}</p>
                              <p className="text-[11px] text-zinc-500 truncate">{order.itemName}</p>
                            </div>
                          </div>
                          <span className="font-mono font-bold text-gray-900 text-sm shrink-0">₹{order.totalAmount.toLocaleString("en-IN")}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-zinc-500 text-center py-4 col-span-2 font-semibold">No recent order records populated.</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Bottom Action Footer */}
              <div className="flex items-center justify-between pt-3 border-t border-border-subtle">
                <span className="text-xs font-bold text-zinc-600 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Real Database Metrics
                </span>
                <button
                  onClick={() => handleOpenSection("/admin/dashboard", "Executive Dashboard")}
                  className="btn-pill-gradient h-11 px-6 rounded-full font-black text-xs sm:text-sm text-white flex items-center gap-2 shadow-md hover:scale-105 transition-all cursor-pointer"
                >
                  <span>Open Dashboard Page</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* 🌟 PAGE 2: PRODUCTS & CATALOG */}
            <div 
              className={`absolute inset-0 bg-[#FAFBFD] rounded-[34px] pl-14 sm:pl-16 pr-6 sm:pr-10 py-6 sm:py-8 flex flex-col justify-between transition-all duration-800 ease-in-out origin-left shadow-2xl [transform-style:preserve-3d] ${
                currentPage === 2
                  ? "[transform:rotateY(0deg)] opacity-100 z-30 pointer-events-auto"
                  : currentPage > 2
                  ? "[transform:rotateY(-180deg)] opacity-100 z-20 pointer-events-none"
                  : "[transform:rotateY(0deg)] opacity-100 z-10 pointer-events-none"
              }`}
            >
              <div className="space-y-5 overflow-y-auto pr-1">
                <div className="flex items-center justify-between border-b border-border-subtle pb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-2xl bg-purple-100 text-purple-700">
                      <Package className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-purple-700">Page 2 • Catalog Infrastructure</span>
                      <h2 className="text-xl sm:text-2xl font-black text-gray-900">Product Matrix & Inventory</h2>
                    </div>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs sm:text-sm font-black bg-purple-500/10 text-purple-700 border border-purple-200">
                    {metrics.totalProducts} Active SKUs
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-4 rounded-2xl bg-white border border-border-subtle shadow-2xs space-y-1">
                    <p className="text-xs font-bold text-zinc-500 uppercase">Active Catalog</p>
                    <p className="text-2xl font-black text-gray-900 font-mono">{metrics.totalProducts} Items</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-white border border-border-subtle shadow-2xs space-y-1">
                    <p className="text-xs font-bold text-zinc-500 uppercase">Registered Customers</p>
                    <p className="text-2xl font-black text-purple-700 font-mono">{metrics.totalCustomers} Buyers</p>
                  </div>
                </div>

                {/* Real Category Matrix Allocation */}
                <div className="bg-white border border-border-subtle rounded-2xl p-4 sm:p-5 space-y-4 shadow-2xs flex-1">
                  <span className="text-xs sm:text-sm font-black text-purple-900 uppercase tracking-wider flex items-center gap-2 border-b border-border-subtle pb-2">
                    <Layers className="w-4 h-4 text-primary-600" /> Database Category Matrix
                  </span>

                  <div className="space-y-3.5 text-xs sm:text-sm">
                    {metrics.categoryBreakdown && metrics.categoryBreakdown.length > 0 ? (
                      metrics.categoryBreakdown.map((cat, idx) => (
                        <div key={idx} className="space-y-1">
                          <div className="flex justify-between font-extrabold text-gray-900 text-xs sm:text-sm">
                            <span>{cat.name}</span>
                            <span>{cat.count} SKUs ({cat.pct}%)</span>
                          </div>
                          <div className="w-full bg-purple-100 h-2.5 rounded-full overflow-hidden">
                            <div 
                              className="bg-purple-600 h-full rounded-full transition-all duration-500" 
                              style={{ width: `${cat.pct}%` }} 
                            />
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-zinc-500 text-center py-4 font-semibold">No category data recorded in database.</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Bottom Action Footer */}
              <div className="flex items-center justify-between pt-3 border-t border-border-subtle">
                <span className="text-xs font-bold text-zinc-600 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Brands Taxonomy
                </span>
                <button
                  onClick={() => handleOpenSection("/admin/products", "Product Registry")}
                  className="btn-pill-gradient h-11 px-6 rounded-full font-black text-xs sm:text-sm text-white flex items-center gap-2 shadow-md hover:scale-105 transition-all cursor-pointer"
                >
                  <span>Open Product Registry</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* 🌟 PAGE 3: INVENTORY WAREHOUSE LEDGER */}
            <div 
              className={`absolute inset-0 bg-[#FAFBFD] rounded-[34px] pl-14 sm:pl-16 pr-6 sm:pr-10 py-6 sm:py-8 flex flex-col justify-between transition-all duration-800 ease-in-out origin-left shadow-2xl [transform-style:preserve-3d] ${
                currentPage === 3
                  ? "[transform:rotateY(0deg)] opacity-100 z-30 pointer-events-auto"
                  : currentPage > 3
                  ? "[transform:rotateY(-180deg)] opacity-100 z-20 pointer-events-none"
                  : "[transform:rotateY(0deg)] opacity-100 z-10 pointer-events-none"
              }`}
            >
              <div className="space-y-5 overflow-y-auto pr-1">
                <div className="flex items-center justify-between border-b border-border-subtle pb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-2xl bg-amber-100 text-amber-800">
                      <Boxes className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-amber-800">Page 3 • Warehouse Stock</span>
                      <h2 className="text-xl sm:text-2xl font-black text-gray-900">Inventory & Reorder Register</h2>
                    </div>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs sm:text-sm font-black bg-amber-500/10 text-amber-800 border border-amber-200">
                    Live Stock Audit
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-4 rounded-2xl bg-white border border-border-subtle shadow-2xs space-y-1">
                    <p className="text-xs font-bold text-zinc-500 uppercase">Managed SKUs</p>
                    <p className="text-2xl font-black text-gray-900 font-mono">{metrics.totalProducts} Items</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-white border border-border-subtle shadow-2xs space-y-1">
                    <p className="text-xs font-bold text-zinc-500 uppercase">Stock Health</p>
                    <p className="text-2xl font-black text-emerald-600 font-mono">Real-Time Sync</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 shadow-2xs space-y-1">
                    <p className="text-xs font-bold text-amber-800 uppercase">Low Stock Alert</p>
                    <p className="text-2xl font-black text-amber-900 font-mono">Threshold ≤ 10</p>
                  </div>
                </div>

                {/* Real Low-Stock Watchlist Stream */}
                <div className="bg-white border border-border-subtle rounded-2xl p-4 sm:p-5 space-y-3 shadow-2xs flex-1">
                  <span className="text-xs sm:text-sm font-black text-amber-950 uppercase tracking-wider flex items-center gap-2 border-b border-border-subtle pb-2">
                    <AlertTriangle className="w-4 h-4 text-rose-600" /> Database Stock Watchlist
                  </span>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                    {metrics.lowStockWatchlist && metrics.lowStockWatchlist.length > 0 ? (
                      metrics.lowStockWatchlist.map((item, idx) => (
                        <div key={idx} className={`p-3 rounded-xl border flex flex-col justify-between ${
                          item.isCritical ? "bg-rose-50/80 border-rose-200" : "bg-amber-50/80 border-amber-200"
                        }`}>
                          <div>
                            <span className={`text-[10px] font-black uppercase ${item.isCritical ? "text-rose-700" : "text-amber-800"}`}>
                              {item.isCritical ? "Critical Low" : "Low Stock"}
                            </span>
                            <p className="font-extrabold text-gray-900 text-xs sm:text-sm mt-0.5 truncate">{item.name}</p>
                          </div>
                          <p className={`text-xs font-mono font-black mt-2 ${item.isCritical ? "text-rose-800" : "text-amber-900"}`}>
                            {item.stock} units remaining
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-emerald-700 font-bold text-center py-4 col-span-3">All inventory stock levels are healthy.</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Bottom Action Footer */}
              <div className="flex items-center justify-between pt-3 border-t border-border-subtle">
                <span className="text-xs font-bold text-zinc-600 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Automated Stock Alerts
                </span>
                <button
                  onClick={() => handleOpenSection("/admin/inventory", "Inventory Manager")}
                  className="btn-pill-gradient h-11 px-6 rounded-full font-black text-xs sm:text-sm text-white flex items-center gap-2 shadow-md hover:scale-105 transition-all cursor-pointer"
                >
                  <span>Open Inventory Page</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* 🌟 PAGE 4: PAYMENTS & FINANCIALS */}
            <div 
              className={`absolute inset-0 bg-[#FAFBFD] rounded-[34px] pl-14 sm:pl-16 pr-6 sm:pr-10 py-6 sm:py-8 flex flex-col justify-between transition-all duration-800 ease-in-out origin-left shadow-2xl [transform-style:preserve-3d] ${
                currentPage === 4
                  ? "[transform:rotateY(0deg)] opacity-100 z-30 pointer-events-auto"
                  : currentPage > 4
                  ? "[transform:rotateY(-180deg)] opacity-100 z-20 pointer-events-none"
                  : "[transform:rotateY(0deg)] opacity-100 z-10 pointer-events-none"
              }`}
            >
              <div className="space-y-5 overflow-y-auto pr-1">
                <div className="flex items-center justify-between border-b border-border-subtle pb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-2xl bg-purple-100 text-purple-700">
                      <CreditCard className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-purple-700">Page 4 • Financial Settlement</span>
                      <h2 className="text-xl sm:text-2xl font-black text-gray-900">Payments & Revenue Stream</h2>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-4 rounded-2xl bg-white border border-border-subtle shadow-2xs space-y-1">
                    <p className="text-xs font-bold text-zinc-500 uppercase">Gross Paid Revenue</p>
                    <p className="text-2xl font-black text-gray-900 font-mono">{metrics.formattedRevenue}</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-white border border-border-subtle shadow-2xs space-y-1">
                    <p className="text-xs font-bold text-zinc-500 uppercase">Payment Gateway</p>
                    <p className="text-2xl font-black text-blue-600 font-mono">Razorpay Active</p>
                  </div>
                </div>

                {/* PAYMENT METHODS MATRIX */}
                <div className="bg-white border border-border-subtle rounded-2xl p-4 sm:p-5 space-y-4 shadow-2xs flex-1">
                  <span className="text-xs sm:text-sm font-black text-purple-900 uppercase tracking-wider flex items-center gap-2 border-b border-border-subtle pb-2">
                    <FileText className="w-4 h-4 text-primary-600" /> Payment Methods & Settlement Matrix
                  </span>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-semibold">
                    <div className="p-3 rounded-xl bg-purple-50/70 border border-purple-100 space-y-1">
                      <p className="text-[10px] text-zinc-500 font-bold uppercase">UPI / GPay</p>
                      <p className="font-black text-purple-900 text-base">78% Share</p>
                    </div>
                    <div className="p-3 rounded-xl bg-purple-50/70 border border-purple-100 space-y-1">
                      <p className="text-[10px] text-zinc-500 font-bold uppercase">Debit & Cards</p>
                      <p className="font-black text-purple-900 text-base">14% Share</p>
                    </div>
                    <div className="p-3 rounded-xl bg-purple-50/70 border border-purple-100 space-y-1">
                      <p className="text-[10px] text-zinc-500 font-bold uppercase">COD Orders</p>
                      <p className="font-black text-purple-900 text-base">8% Share</p>
                    </div>
                    <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 space-y-1">
                      <p className="text-[10px] text-emerald-700 font-bold uppercase">Settlement</p>
                      <p className="font-black text-emerald-800 text-base">T+1 Auto</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Action Footer */}
              <div className="flex items-center justify-between pt-3 border-t border-border-subtle">
                <span className="text-xs font-bold text-zinc-600 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Auto-Reconciled
                </span>
                <button
                  onClick={() => handleOpenSection("/admin/payments", "Payments & Revenue")}
                  className="btn-pill-gradient h-11 px-6 rounded-full font-black text-xs sm:text-sm text-white flex items-center gap-2 shadow-md hover:scale-105 transition-all cursor-pointer"
                >
                  <span>Open Payments Matrix</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* 🌟 PAGE 5: STORE SETTINGS & SYSTEM */}
            <div 
              className={`absolute inset-0 bg-[#FAFBFD] rounded-[34px] pl-14 sm:pl-16 pr-6 sm:pr-10 py-6 sm:py-8 flex flex-col justify-between transition-all duration-800 ease-in-out origin-left shadow-2xl [transform-style:preserve-3d] ${
                currentPage === 5
                  ? "[transform:rotateY(0deg)] opacity-100 z-30 pointer-events-auto"
                  : currentPage > 5
                  ? "[transform:rotateY(-180deg)] opacity-100 z-20 pointer-events-none"
                  : "[transform:rotateY(0deg)] opacity-100 z-10 pointer-events-none"
              }`}
            >
              <div className="space-y-5 overflow-y-auto pr-1">
                <div className="flex items-center justify-between border-b border-border-subtle pb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-2xl bg-purple-100 text-purple-700">
                      <Settings className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-purple-700">Page 5 • System Administration</span>
                      <h2 className="text-xl sm:text-2xl font-black text-gray-900">System & Store Settings</h2>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-4 rounded-2xl bg-white border border-border-subtle shadow-2xs space-y-1">
                    <p className="text-xs font-bold text-zinc-500 uppercase">Registered Customers</p>
                    <p className="text-2xl font-black text-gray-900 font-mono">{metrics.totalCustomers}</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-white border border-border-subtle shadow-2xs space-y-1">
                    <p className="text-xs font-bold text-zinc-500 uppercase">Access Privilege</p>
                    <p className="text-2xl font-black text-purple-700 font-mono">SuperAdmin</p>
                  </div>
                </div>

                {/* SECURITY CHECKLIST */}
                <div className="bg-white border border-border-subtle rounded-2xl p-4 sm:p-5 space-y-3 shadow-2xs flex-1">
                  <span className="text-xs sm:text-sm font-black text-purple-900 uppercase tracking-wider flex items-center gap-2 border-b border-border-subtle pb-2">
                    <ShieldCheck className="w-4 h-4 text-primary-600" /> Security Verification Audit
                  </span>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs font-medium">
                    <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50/70 border border-emerald-200 text-emerald-900">
                      <span className="font-bold flex items-center gap-1.5">
                        <CheckCircle className="w-4 h-4 text-emerald-600" /> Database Cluster
                      </span>
                      <span className="text-[10px] font-black font-mono">MongoDB Active</span>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50/70 border border-emerald-200 text-emerald-900">
                      <span className="font-bold flex items-center gap-1.5">
                        <CheckCircle className="w-4 h-4 text-emerald-600" /> Cloud Media Sync
                      </span>
                      <span className="text-[10px] font-black font-mono">CDN Active</span>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50/70 border border-emerald-200 text-emerald-900">
                      <span className="font-bold flex items-center gap-1.5">
                        <CheckCircle className="w-4 h-4 text-emerald-600" /> NextAuth Session
                      </span>
                      <span className="text-[10px] font-black font-mono">Secured</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Action Footer */}
              <div className="flex items-center justify-between pt-3 border-t border-border-subtle">
                <span className="text-xs font-bold text-zinc-600 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Authorized Control
                </span>
                <button
                  onClick={() => handleOpenSection("/admin/settings", "Store Settings")}
                  className="btn-pill-gradient h-11 px-6 rounded-full font-black text-xs sm:text-sm text-white flex items-center gap-2 shadow-md hover:scale-105 transition-all cursor-pointer"
                >
                  <span>Open Store Settings</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

          </div>

        </div>

      </section>

      {/* 🌟 FOOTER SCROLL INDICATOR */}
      <footer className="relative z-20 max-w-4xl mx-auto w-full flex items-center justify-between text-xs text-purple-900/80 font-bold px-2">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-purple-700" />
          <span>Scroll Mouse Wheel Anywhere to Turn 3D Paper Pages</span>
        </div>
        <div className="flex items-center gap-2.5">
          {bookmarkTabs.map((p) => (
            <button
              key={p.id}
              onClick={() => changePage(p.id)}
              className={`w-2.5 h-2.5 rounded-full transition-all cursor-pointer ${
                currentPage === p.id ? "bg-purple-700 scale-125 ring-2 ring-purple-300" : "bg-purple-300 hover:bg-purple-400"
              }`}
              title={`Go to ${p.title}`}
            />
          ))}
        </div>
      </footer>

    </main>
  );
}
