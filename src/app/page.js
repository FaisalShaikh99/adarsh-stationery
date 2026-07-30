"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import axios from "axios";
import { 
  Sparkles, 
  ArrowRight, 
  ShieldCheck, 
  LayoutDashboard, 
  BookOpen,
  Package,
  Boxes,
  CreditCard,
  Settings,
  CheckCircle2,
  Clock,
  CheckCircle,
  FileText,
  Activity,
  Layers,
  AlertTriangle,
  Tag,
  ShoppingBag,
  Users,
  UserCheck,
  Award,
  Building2,
  Heart,
  ChevronLeft
} from "lucide-react";

// Dynamically import HTMLFlipBook with ssr: false to prevent Next.js Webpack CJS bundling errors
const HTMLFlipBook = dynamic(() => import("react-pageflip"), { 
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center text-purple-700 font-bold text-sm">
      Loading Notebook Pages...
    </div>
  )
});

// ForwardRef Page component required by react-pageflip
const FlipPage = React.forwardRef(({ children, className = "" }, ref) => {
  return (
    <div ref={ref} className={`w-full h-full bg-[#FAFBFD] shadow-inner select-none overflow-hidden ${className}`}>
      {children}
    </div>
  );
});

FlipPage.displayName = "FlipPage";

export default function Home() {
  const router = useRouter();
  const bookRef = useRef(null);

  // Client Mounting State (Prevents SSR module factory errors)
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Book State: currentPage index (0 = Cover, 1 = Dashboard, 2 = Products, 3 = Inventory, 4 = Payments, 5 = Settings)
  const [currentPage, setCurrentPage] = useState(0);
  const [isNavigating, setIsNavigating] = useState(false);
  const [navStatusText, setNavStatusText] = useState("Opening Business Ledger...");

  // Real Business Metrics State
  const [metrics, setMetrics] = useState({
    formattedRevenue: "₹2.4L",
    totalOrders: 1284,
    growthPct: "+12.4%",
    totalProducts: 156,
    totalCustomers: 890,
    recentOrdersStream: [],
    lowStockWatchlist: [],
    categoryBreakdown: []
  });

  // Fetch Live Summary Metrics
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

  // Sync bookmark tab click with react-pageflip instance & handle boundary loop
  const changePage = (newPage) => {
    let target = newPage;
    if (target < 0) target = 5;
    if (target > 5) target = 0;

    if (bookRef.current && bookRef.current.pageFlip) {
      bookRef.current.pageFlip().flip(target);
    } else {
      setCurrentPage(target);
    }
  };

  // Wheel-triggered page flips with reduced hover sensitivity & boundary looping
  useEffect(() => {
    let lastScrollTime = 0;
    const handleWheel = (e) => {
      e.preventDefault();
      const now = Date.now();
      if (now - lastScrollTime < 750 || isNavigating) return;

      if (e.deltaY > 15) {
        lastScrollTime = now;
        if (bookRef.current && bookRef.current.pageFlip) {
          const instance = bookRef.current.pageFlip();
          const current = instance.getCurrentPageIndex();
          if (current >= 5) {
            instance.flip(0);
          } else {
            instance.flipNext();
          }
        }
      } else if (e.deltaY < -15) {
        lastScrollTime = now;
        if (bookRef.current && bookRef.current.pageFlip) {
          const instance = bookRef.current.pageFlip();
          const current = instance.getCurrentPageIndex();
          if (current <= 0) {
            instance.flip(5);
          } else {
            instance.flipPrev();
          }
        }
      }
    };

    window.addEventListener("wheel", handleWheel, { passive: false });
    return () => window.removeEventListener("wheel", handleWheel);
  }, [isNavigating]);

  // Navigate to Admin Section
  const handleOpenSection = (destinationPath, sectionName) => {
    if (isNavigating) return;
    setIsNavigating(true);
    setNavStatusText(`Loading ${sectionName}...`);

    setTimeout(() => {
      router.push(destinationPath);
    }, 1500);
  };

  const bookmarkTabs = [
    { id: 1, title: "Dashboard", icon: LayoutDashboard },
    { id: 2, title: "Products", icon: Package },
    { id: 3, title: "Inventory", icon: Boxes },
    { id: 4, title: "Payments", icon: CreditCard },
    { id: 5, title: "Settings", icon: Settings },
  ];

  return (
    <main className="fixed inset-0 overflow-hidden bg-[linear-gradient(180deg,#CBB4E8_0%,#DBC2F5_25%,#ECCDF8_50%,#F5DEFA_75%,#FBF0FD_100%)] font-sans text-gray-900 select-none flex flex-col justify-between p-2 sm:p-5 md:p-8">
      
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

      {/* 🌟 MAIN SINGLE-PAGE SPIRAL NOTEBOOK CONTAINER (FLUSH MOBILE BOUNDS) */}
      <section className="relative z-10 my-auto py-1 sm:py-2 flex items-center justify-center flex-1 w-full">
        
        {/* Notebook Outer Container - Tight Flush Fit On Mobile & Desktop */}
        <div className="relative w-[94vw] max-w-[480px] sm:max-w-[540px] lg:max-w-[560px] lg:w-[85vw] h-[520px] xs:h-[560px] sm:h-[640px] lg:h-[660px] rounded-[30px] sm:rounded-[34px] shadow-2xl flex flex-col transition-all duration-500 overflow-hidden">
          
          {/* 🌀 SPIRAL SPINE ANCHORED INSIDE LEFT EDGE */}
          <div className="absolute left-0 top-0 bottom-0 z-40 w-9 sm:w-11 lg:w-13 flex flex-col justify-between py-5 sm:py-6 px-1 pointer-events-none bg-gradient-to-r from-purple-200/40 via-purple-100/20 to-transparent border-r border-purple-200/50 rounded-l-[30px] sm:rounded-l-[34px]">
            {Array.from({ length: 16 }).map((_, i) => (
              <div key={i} className="flex items-center gap-1">
                <div className="w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full bg-zinc-300 shadow-inner border border-zinc-400/60" />
                <div className="w-5 sm:w-7 lg:w-8 h-2 sm:h-2.5 rounded-full bg-gradient-to-r from-zinc-300 via-white to-zinc-400 shadow-md border border-zinc-400/80 -ml-1" />
              </div>
            ))}
          </div>

          {/* 🔖 5 INDEX DIVIDER BOOKMARK TABS */}
          <div className="absolute -right-24 sm:-right-32 lg:-right-36 top-6 bottom-6 z-40 flex flex-col justify-around pointer-events-auto">
            {bookmarkTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = currentPage === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => changePage(tab.id)}
                  className={`h-9 sm:h-11 px-2.5 sm:px-4 rounded-r-2xl font-black text-[11px] sm:text-xs flex items-center gap-1.5 transition-all duration-300 shadow-lg cursor-pointer border-y border-r border-purple-300/80 ${
                    isActive 
                      ? "bg-[#8031A6] text-white border-purple-400 translate-x-2 shadow-purple-500/30 ring-2 ring-purple-300 z-50" 
                      : "bg-white/95 text-purple-950 hover:bg-white hover:translate-x-1 hover:text-purple-700 z-30"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                  <span className="inline tracking-wide">{tab.title}</span>
                </button>
              );
            })}
          </div>

          {/* 📖 REACT-PAGEFLIP CANVAS CONTAINER - SINGLE PAGE PORTRAIT MODE */}
          <div className="w-full h-full relative rounded-[30px] sm:rounded-[34px] overflow-hidden">
            {isMounted && (
              <HTMLFlipBook
                ref={bookRef}
                width={480}
                height={640}
                size="stretch"
                minWidth={280}
                maxWidth={560}
                minHeight={420}
                maxHeight={800}
                maxShadowOpacity={0.2}
                flippingTime={600}
                showCover={false}
                usePortrait={true}
                mobileScrollSupport={true}
                onFlip={(e) => setCurrentPage(e.data)}
                className="w-full h-full shadow-2xl"
                style={{ margin: "0 auto" }}
              >
                
                {/* PAGE 0: COVER PAGE */}
                <FlipPage className="p-0">
                  <div className="relative w-full h-full bg-gradient-to-br from-[#702594] via-[#9B66D4] to-[#5B2C8F] rounded-[30px] sm:rounded-[34px] pl-10 sm:pl-14 lg:pl-16 pr-5 sm:pr-8 lg:pr-12 py-5 sm:py-8 text-white flex flex-col justify-between items-center text-center border-2 border-white/20 shadow-2xl">
                    
                    {/* 🌟 LOGO POSITIONED IN TOP-RIGHT CORNER */}
                    <div className="absolute top-4 right-4 sm:top-6 sm:right-6 w-12 sm:w-16 h-12 sm:h-16 bg-white/95 rounded-2xl p-1.5 sm:p-2.5 shadow-xl border-2 border-white/40 flex items-center justify-center z-20 hover:scale-105 transition-transform">
                      <Image
                        src="/logo-icon.png"
                        alt="Adarsh Logo"
                        width={1024}
                        height={1024}
                        priority
                        className="w-full h-full object-contain mix-blend-multiply filter drop-shadow-xs"
                      />
                    </div>

                    <div className="w-full flex justify-start pt-1">
                      <div className="inline-flex items-center gap-1.5 rounded-full border border-white/30 bg-white/10 px-3 py-1 text-[10px] sm:text-xs font-black uppercase tracking-widest text-purple-100">
                        <Sparkles className="w-3 h-3 text-amber-300" />
                        <span>Executive Spiral Ledger</span>
                      </div>
                    </div>

                    {/* 🌟 CENTERED BRAND HEADING & TITLE */}
                    <div className="my-auto space-y-3 px-2 text-center flex flex-col items-center justify-center">
                      <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight drop-shadow-md">
                        ADARSH STATIONERY MART
                      </h1>
                      <p className="text-[10px] sm:text-xs lg:text-sm text-purple-100 font-bold uppercase tracking-[0.2em] max-w-xs">
                        Business Management Book & Inventory Register
                      </p>
                    </div>

                    {/* COMPACT OPEN BUTTON */}
                    <div className="space-y-2 w-full max-w-xs pb-1">
                      <button
                        onClick={() => changePage(1)}
                        className="btn-pill-gradient w-full h-9 sm:h-10 rounded-full font-black text-xs text-white flex items-center justify-center gap-2 shadow-lg hover:scale-105 transition-all cursor-pointer border border-white/30"
                      >
                        <span>Open Notebook Pages</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                      <p className="text-[10px] sm:text-[11px] text-purple-200 font-mono font-bold">
                        Scroll mouse wheel anywhere to flip pages
                      </p>
                    </div>
                  </div>
                </FlipPage>

                {/* PAGE 1: EXECUTIVE DASHBOARD */}
                <FlipPage>
                  <div className="w-full h-full pl-10 sm:pl-14 lg:pl-16 pr-5 sm:pr-8 lg:pr-12 py-5 sm:py-8 flex flex-col justify-between overflow-y-auto">
                    <div className="space-y-4 lg:space-y-6">
                      <div className="flex items-center justify-between border-b border-border-subtle pb-3">
                        <div className="flex items-center gap-2.5">
                          <div className="p-2 lg:p-2.5 rounded-xl bg-purple-100 text-purple-700 shrink-0">
                            <LayoutDashboard className="w-5 h-5 lg:w-6 lg:h-6" />
                          </div>
                          <div>
                            <span className="text-[10px] lg:text-xs font-black uppercase tracking-wider text-purple-700">Page 1 • Executive Summary</span>
                            <h2 className="text-lg sm:text-xl lg:text-2xl font-black text-gray-900">Sales & Operations Pulse</h2>
                          </div>
                        </div>
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-black bg-emerald-500/10 text-emerald-700 border border-emerald-200 shrink-0">
                          {metrics.growthPct} ▲
                        </span>
                      </div>

                      {/* STAT CARDS WITH RESPONSIVE UN-TRUNCATED TYPOGRAPHY */}
                      <div className="grid grid-cols-3 gap-2 sm:gap-3">
                        <div className="p-2 sm:p-3 rounded-2xl bg-white border border-border-subtle shadow-2xs space-y-0.5 min-w-0">
                          <p className="text-[9px] sm:text-xs font-bold text-zinc-500 uppercase tracking-wider truncate">Revenue</p>
                          <p className="text-sm sm:text-lg lg:text-xl font-black text-gray-900 font-mono tracking-tight whitespace-nowrap overflow-hidden text-ellipsis">{metrics.formattedRevenue}</p>
                        </div>
                        <div className="p-2 sm:p-3 rounded-2xl bg-white border border-border-subtle shadow-2xs space-y-0.5 min-w-0">
                          <p className="text-[9px] sm:text-xs font-bold text-zinc-500 uppercase tracking-wider truncate">Orders</p>
                          <p className="text-sm sm:text-lg lg:text-xl font-black text-gray-900 font-mono tracking-tight whitespace-nowrap overflow-hidden text-ellipsis">{metrics.totalOrders.toLocaleString("en-IN")}</p>
                        </div>
                        <div className="p-2 sm:p-3 rounded-2xl bg-gradient-to-br from-[#9B66D4] to-[#D8A5E9] text-white shadow-xs space-y-0.5 min-w-0">
                          <p className="text-[9px] sm:text-xs font-bold text-purple-100 uppercase tracking-wider truncate">Growth</p>
                          <p className="text-sm sm:text-lg lg:text-xl font-black text-white font-mono tracking-tight whitespace-nowrap overflow-hidden text-ellipsis">{metrics.growthPct}</p>
                        </div>
                      </div>

                      <div className="bg-white border border-border-subtle rounded-2xl p-3 sm:p-4 lg:p-5 space-y-3 shadow-2xs flex-1 flex flex-col justify-between">
                        <div className="flex items-center justify-between border-b border-border-subtle pb-2">
                          <span className="text-xs lg:text-sm font-black text-purple-900 uppercase tracking-wider flex items-center gap-1.5">
                            <Activity className="w-3.5 h-3.5 lg:w-4 lg:h-4 text-primary-600" /> Live Order Stream
                          </span>
                          <span className="text-[9px] sm:text-[10px] font-mono font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">Active</span>
                        </div>

                        <div className="grid grid-cols-1 gap-2 text-xs font-medium">
                          <div className="flex items-center justify-between p-2 sm:p-3 rounded-xl bg-purple-50/60 border border-purple-100">
                            <div className="flex items-center gap-2 min-w-0 pr-2">
                              <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              <div className="min-w-0">
                                <p className="font-black text-gray-900 text-xs truncate">#ORD-9482 • Rajesh</p>
                                <p className="text-[9px] sm:text-xs text-zinc-500 truncate">Classmate (5x)</p>
                              </div>
                            </div>
                            <span className="font-mono font-black text-gray-900 text-xs sm:text-sm shrink-0">₹1,250</span>
                          </div>

                          <div className="flex items-center justify-between p-2 sm:p-3 rounded-xl bg-purple-50/60 border border-purple-100">
                            <div className="flex items-center gap-2 min-w-0 pr-2">
                              <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                              <div className="min-w-0">
                                <p className="font-black text-gray-900 text-xs truncate">#ORD-9481 • Priya</p>
                                <p className="text-[9px] sm:text-xs text-zinc-500 truncate">Parker Pen (1x)</p>
                              </div>
                            </div>
                            <span className="font-mono font-black text-gray-900 text-xs sm:text-sm shrink-0">₹850</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-border-subtle mt-3">
                      <span className="text-[11px] font-bold text-zinc-600 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> Analytics
                      </span>
                      <button
                        onClick={() => handleOpenSection("/admin/dashboard", "Executive Dashboard")}
                        className="btn-pill-gradient h-8 sm:h-9 px-3 sm:px-4 rounded-full font-black text-[11px] sm:text-xs text-white flex items-center gap-1 shadow-sm hover:scale-105 transition-all cursor-pointer"
                      >
                        <span>Open Page</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </FlipPage>

                {/* PAGE 2: PRODUCTS & CATALOG */}
                <FlipPage>
                  <div className="w-full h-full pl-10 sm:pl-14 lg:pl-16 pr-5 sm:pr-8 lg:pr-12 py-5 sm:py-8 flex flex-col justify-between overflow-y-auto">
                    <div className="space-y-4 lg:space-y-6">
                      <div className="flex items-center justify-between border-b border-border-subtle pb-3">
                        <div className="flex items-center gap-2.5">
                          <div className="p-2 lg:p-2.5 rounded-xl bg-purple-100 text-purple-700 shrink-0">
                            <Package className="w-5 h-5 lg:w-6 lg:h-6" />
                          </div>
                          <div>
                            <span className="text-[10px] lg:text-xs font-black uppercase tracking-wider text-purple-700">Page 2 • Catalog</span>
                            <h2 className="text-lg sm:text-xl lg:text-2xl font-black text-gray-900">Product Matrix</h2>
                          </div>
                        </div>
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-black bg-purple-500/10 text-purple-700 border border-purple-200 shrink-0">
                          {metrics.totalProducts} SKUs
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 sm:gap-3">
                        <div className="p-2.5 sm:p-3 rounded-2xl bg-white border border-border-subtle shadow-2xs space-y-0.5 min-w-0">
                          <p className="text-[9px] sm:text-xs font-bold text-zinc-500 uppercase tracking-wider truncate">Active Catalog</p>
                          <p className="text-sm sm:text-lg font-black text-gray-900 font-mono tracking-tight truncate">{metrics.totalProducts} Items</p>
                        </div>
                        <div className="p-2.5 sm:p-3 rounded-2xl bg-white border border-border-subtle shadow-2xs space-y-0.5 min-w-0">
                          <p className="text-[9px] sm:text-xs font-bold text-zinc-500 uppercase tracking-wider truncate">Stock Status</p>
                          <p className="text-sm sm:text-lg font-black text-emerald-600 font-mono tracking-tight truncate">Healthy Stock</p>
                        </div>
                      </div>

                      <div className="bg-white border border-border-subtle rounded-2xl p-3 sm:p-4 space-y-2.5 shadow-2xs">
                        <span className="text-xs font-black text-purple-900 uppercase tracking-wider flex items-center gap-1.5 border-b border-border-subtle pb-2">
                          <Layers className="w-3.5 h-3.5 text-primary-600" /> Category Breakdown
                        </span>

                        <div className="space-y-2.5 text-xs">
                          <div className="space-y-1">
                            <div className="flex justify-between font-extrabold text-gray-900 text-[10px] sm:text-xs">
                              <span>Notebooks & Registers</span>
                              <span>84% Stock</span>
                            </div>
                            <div className="w-full bg-purple-100 h-2 rounded-full overflow-hidden">
                              <div className="bg-purple-600 h-full rounded-full w-[84%]" />
                            </div>
                          </div>

                          <div className="space-y-1">
                            <div className="flex justify-between font-extrabold text-gray-900 text-[10px] sm:text-xs">
                              <span>Executive Pens</span>
                              <span>92% Stock</span>
                            </div>
                            <div className="w-full bg-purple-100 h-2 rounded-full overflow-hidden">
                              <div className="bg-fuchsia-600 h-full rounded-full w-[92%]" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-border-subtle mt-3">
                      <span className="text-[11px] font-bold text-zinc-600 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> Taxonomy
                      </span>
                      <button
                        onClick={() => handleOpenSection("/admin/products", "Product Registry")}
                        className="btn-pill-gradient h-8 sm:h-9 px-3 sm:px-4 rounded-full font-black text-[11px] sm:text-xs text-white flex items-center gap-1 shadow-sm hover:scale-105 transition-all cursor-pointer"
                      >
                        <span>Open Page</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </FlipPage>

                {/* PAGE 3: INVENTORY WAREHOUSE REGISTER */}
                <FlipPage>
                  <div className="w-full h-full pl-10 sm:pl-14 lg:pl-16 pr-5 sm:pr-8 lg:pr-12 py-5 sm:py-8 flex flex-col justify-between overflow-y-auto">
                    <div className="space-y-4 lg:space-y-6">
                      <div className="flex items-center justify-between border-b border-border-subtle pb-3">
                        <div className="flex items-center gap-2.5">
                          <div className="p-2 lg:p-2.5 rounded-xl bg-amber-100 text-amber-800 shrink-0">
                            <Boxes className="w-5 h-5 lg:w-6 lg:h-6" />
                          </div>
                          <div>
                            <span className="text-[10px] lg:text-xs font-black uppercase tracking-wider text-amber-800">Page 3 • Inventory</span>
                            <h2 className="text-lg sm:text-xl lg:text-2xl font-black text-gray-900">Warehouse Stock</h2>
                          </div>
                        </div>
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-black bg-amber-500/10 text-amber-800 border border-amber-200 shrink-0">
                          Stock Audit
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-2 sm:gap-3">
                        <div className="p-2 sm:p-3 rounded-2xl bg-white border border-border-subtle shadow-2xs space-y-0.5 min-w-0">
                          <p className="text-[9px] sm:text-xs font-bold text-zinc-500 uppercase tracking-wider truncate">SKUs</p>
                          <p className="text-sm sm:text-lg font-black text-gray-900 font-mono tracking-tight truncate">{metrics.totalProducts}</p>
                        </div>
                        <div className="p-2 sm:p-3 rounded-2xl bg-white border border-border-subtle shadow-2xs space-y-0.5 min-w-0">
                          <p className="text-[9px] sm:text-xs font-bold text-zinc-500 uppercase tracking-wider truncate">Health</p>
                          <p className="text-sm sm:text-lg font-black text-emerald-600 font-mono tracking-tight truncate">Synced</p>
                        </div>
                        <div className="p-2 sm:p-3 rounded-2xl bg-amber-50 border border-amber-200 shadow-2xs space-y-0.5 min-w-0">
                          <p className="text-[9px] sm:text-xs font-bold text-amber-800 uppercase tracking-wider truncate">Min</p>
                          <p className="text-sm sm:text-lg font-black text-amber-900 font-mono tracking-tight truncate">≤ 10 Units</p>
                        </div>
                      </div>

                      <div className="bg-white border border-border-subtle rounded-2xl p-3 sm:p-4 space-y-2.5 shadow-2xs">
                        <span className="text-xs font-black text-amber-950 uppercase tracking-wider flex items-center gap-1.5 border-b border-border-subtle pb-2">
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-600" /> Reorder Watchlist
                        </span>

                        <div className="grid grid-cols-1 gap-2 text-xs">
                          <div className="p-2 rounded-xl bg-rose-50/80 border border-rose-200 flex items-center justify-between">
                            <div className="min-w-0">
                              <span className="text-[9px] font-black text-rose-700 uppercase">Critical</span>
                              <p className="font-extrabold text-gray-900 text-xs truncate">Classmate 200p Register</p>
                            </div>
                            <p className="text-xs font-mono font-black text-rose-800 shrink-0 ml-2">3 left</p>
                          </div>

                          <div className="p-2 rounded-xl bg-amber-50/80 border border-amber-200 flex items-center justify-between">
                            <div className="min-w-0">
                              <span className="text-[9px] font-black text-amber-800 uppercase">Low</span>
                              <p className="font-extrabold text-gray-900 text-xs truncate">Reynolds Pen Pack (10x)</p>
                            </div>
                            <p className="text-xs font-mono font-black text-amber-900 shrink-0 ml-2">5 left</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-border-subtle mt-3">
                      <span className="text-[11px] font-bold text-zinc-600 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> Stock Alerts
                      </span>
                      <button
                        onClick={() => handleOpenSection("/admin/inventory", "Inventory Manager")}
                        className="btn-pill-gradient h-8 sm:h-9 px-3 sm:px-4 rounded-full font-black text-[11px] sm:text-xs text-white flex items-center gap-1 shadow-sm hover:scale-105 transition-all cursor-pointer"
                      >
                        <span>Open Page</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </FlipPage>

                {/* PAGE 4: PAYMENTS & FINANCIALS */}
                <FlipPage>
                  <div className="w-full h-full pl-10 sm:pl-14 lg:pl-16 pr-5 sm:pr-8 lg:pr-12 py-5 sm:py-8 flex flex-col justify-between overflow-y-auto">
                    <div className="space-y-4 lg:space-y-6">
                      <div className="flex items-center justify-between border-b border-border-subtle pb-3">
                        <div className="flex items-center gap-2.5">
                          <div className="p-2 lg:p-2.5 rounded-xl bg-purple-100 text-purple-700 shrink-0">
                            <CreditCard className="w-5 h-5 lg:w-6 lg:h-6" />
                          </div>
                          <div>
                            <span className="text-[10px] lg:text-xs font-black uppercase tracking-wider text-purple-700">Page 4 • Finance</span>
                            <h2 className="text-lg sm:text-xl lg:text-2xl font-black text-gray-900">Payments & Revenue</h2>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 sm:gap-3">
                        <div className="p-2.5 sm:p-3 rounded-2xl bg-white border border-border-subtle shadow-2xs space-y-0.5 min-w-0">
                          <p className="text-[9px] sm:text-xs font-bold text-zinc-500 uppercase tracking-wider truncate">Gross Revenue</p>
                          <p className="text-sm sm:text-lg font-black text-gray-900 font-mono tracking-tight truncate">{metrics.formattedRevenue}</p>
                        </div>
                        <div className="p-2.5 sm:p-3 rounded-2xl bg-white border border-border-subtle shadow-2xs space-y-0.5 min-w-0">
                          <p className="text-[9px] sm:text-xs font-bold text-zinc-500 uppercase tracking-wider truncate">Gateway</p>
                          <p className="text-sm sm:text-lg font-black text-blue-600 font-mono tracking-tight truncate">Razorpay</p>
                        </div>
                      </div>

                      <div className="bg-white border border-border-subtle rounded-2xl p-3 sm:p-4 space-y-2.5 shadow-2xs">
                        <span className="text-xs font-black text-purple-900 uppercase tracking-wider flex items-center gap-1.5 border-b border-border-subtle pb-2">
                          <FileText className="w-3.5 h-3.5 text-primary-600" /> Settlement Breakdown
                        </span>

                        <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
                          <div className="p-2 rounded-xl bg-purple-50/70 border border-purple-100 space-y-0.5">
                            <p className="text-[9px] text-zinc-500 font-bold">UPI / GPay</p>
                            <p className="font-black text-purple-900 text-xs sm:text-sm">78% Share</p>
                          </div>
                          <div className="p-2 rounded-xl bg-purple-50/70 border border-purple-100 space-y-0.5">
                            <p className="text-[9px] text-zinc-500 font-bold">Debit Cards</p>
                            <p className="font-black text-purple-900 text-xs sm:text-sm">14% Share</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-border-subtle mt-3">
                      <span className="text-[11px] font-bold text-zinc-600 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> Reconciled
                      </span>
                      <button
                        onClick={() => handleOpenSection("/admin/payments", "Payments & Revenue")}
                        className="btn-pill-gradient h-8 sm:h-9 px-3 sm:px-4 rounded-full font-black text-[11px] sm:text-xs text-white flex items-center gap-1 shadow-sm hover:scale-105 transition-all cursor-pointer"
                      >
                        <span>Open Page</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </FlipPage>

                {/* PAGE 5: STORE SETTINGS & SYSTEM */}
                <FlipPage>
                  <div className="w-full h-full pl-10 sm:pl-14 lg:pl-16 pr-5 sm:pr-8 lg:pr-12 py-5 sm:py-8 flex flex-col justify-between overflow-y-auto">
                    <div className="space-y-4 lg:space-y-6">
                      <div className="flex items-center justify-between border-b border-border-subtle pb-3">
                        <div className="flex items-center gap-2.5">
                          <div className="p-2 lg:p-2.5 rounded-xl bg-purple-100 text-purple-700 shrink-0">
                            <Settings className="w-5 h-5 lg:w-6 lg:h-6" />
                          </div>
                          <div>
                            <span className="text-[10px] lg:text-xs font-black uppercase tracking-wider text-purple-700">Page 5 • Settings</span>
                            <h2 className="text-lg sm:text-xl lg:text-2xl font-black text-gray-900">System & Admin</h2>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 sm:gap-3">
                        <div className="p-2.5 sm:p-3 rounded-2xl bg-white border border-border-subtle shadow-2xs space-y-0.5 min-w-0">
                          <p className="text-[9px] sm:text-xs font-bold text-zinc-500 uppercase tracking-wider truncate">Registered</p>
                          <p className="text-sm sm:text-lg font-black text-gray-900 font-mono tracking-tight truncate">{metrics.totalCustomers} Users</p>
                        </div>
                        <div className="p-2.5 sm:p-3 rounded-2xl bg-white border border-border-subtle shadow-2xs space-y-0.5 min-w-0">
                          <p className="text-[9px] sm:text-xs font-bold text-zinc-500 uppercase tracking-wider truncate">Privilege</p>
                          <p className="text-sm sm:text-lg font-black text-purple-700 font-mono tracking-tight truncate">SuperAdmin</p>
                        </div>
                      </div>

                      <div className="bg-white border border-border-subtle rounded-2xl p-3 sm:p-4 space-y-2 shadow-2xs">
                        <span className="text-xs font-black text-purple-900 uppercase tracking-wider flex items-center gap-1.5 border-b border-border-subtle pb-2">
                          <ShieldCheck className="w-3.5 h-3.5 text-primary-600" /> Security Audit
                        </span>

                        <div className="grid grid-cols-1 gap-1.5 text-xs font-medium">
                          <div className="flex items-center justify-between p-2 rounded-xl bg-emerald-50/70 border border-emerald-200 text-emerald-900">
                            <span className="font-bold flex items-center gap-1 shrink-0">
                              <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> MongoDB
                            </span>
                            <span className="text-[10px] font-black font-mono shrink-0">Connected</span>
                          </div>

                          <div className="flex items-center justify-between p-2 rounded-xl bg-emerald-50/70 border border-emerald-200 text-emerald-900">
                            <span className="font-bold flex items-center gap-1 shrink-0">
                              <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> CDN Sync
                            </span>
                            <span className="text-[10px] font-black font-mono shrink-0">Active</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-border-subtle mt-3">
                      <span className="text-[11px] font-bold text-zinc-600 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> Control
                      </span>
                      <button
                        onClick={() => handleOpenSection("/admin/settings", "Store Settings")}
                        className="btn-pill-gradient h-8 sm:h-9 px-3 sm:px-4 rounded-full font-black text-[11px] sm:text-xs text-white flex items-center gap-1 shadow-sm hover:scale-105 transition-all cursor-pointer"
                      >
                        <span>Open Page</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </FlipPage>

              </HTMLFlipBook>
            )}
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
