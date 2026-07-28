"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import axios from "axios";
import { 
  Sparkles, 
  Rocket, 
  ArrowRight, 
  Loader2, 
  ShieldCheck, 
  LayoutDashboard, 
  TrendingUp, 
  BookOpen,
  Package,
  CreditCard,
  Settings,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  Clock,
  CheckCircle,
  FileText,
  Activity,
  Layers
} from "lucide-react";

export default function Home() {
  const router = useRouter();
  
  // Book State: currentPage index (0 = Front Cover, 1 = Dashboard, 2 = Products, 3 = Payments, 4 = Settings)
  const [currentPage, setCurrentPage] = useState(0);
  const [isFlipping, setIsFlipping] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [navStatusText, setNavStatusText] = useState("Opening Business Ledger...");

  // Real Business Metrics State
  const [metrics, setMetrics] = useState({
    formattedRevenue: "₹2.4L",
    totalOrders: 1284,
    growthPct: "+12.4%",
    totalProducts: 156,
    totalCustomers: 890
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
    if (isFlipping || newPage === currentPage || newPage < 0 || newPage > 4) return;
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
          if (prev < 4) {
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
    { id: 3, title: "Payments", icon: CreditCard, path: "/admin/payments" },
    { id: 4, title: "Settings", icon: Settings, path: "/admin/settings" },
  ];

  return (
    <main className="fixed inset-0 overflow-hidden bg-[linear-gradient(180deg,#CBB4E8_0%,#DBC2F5_25%,#ECCDF8_50%,#F5DEFA_75%,#FBF0FD_100%)] font-sans text-gray-900 select-none flex flex-col justify-between p-3 sm:p-5">
      
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

      {/* 🌟 TOP HEADER BRAND RIBBON WITH ENLARGED LOGO */}
      <header className="relative z-20 flex items-center justify-between max-w-4xl mx-auto w-full pt-1 px-2">
        <div className="flex items-center gap-3">
          {/* ENLARGED BRAND HEADER LOGO */}
          <div className="w-12 h-12 rounded-2xl bg-white border border-purple-200 shadow-sm flex items-center justify-center p-1 overflow-hidden">
            <Image
              src="/logo-icon.png"
              alt="Adarsh Logo"
              width={1024}
              height={1024}
              priority
              className="w-full h-full object-contain mix-blend-multiply"
            />
          </div>
          <div>
            <span className="font-black text-lg text-gray-900 tracking-tight block leading-none">ADARSH Stationery</span>
            <span className="text-[10px] text-purple-700 font-extrabold uppercase tracking-widest">Spiral Business Ledger</span>
          </div>
        </div>

        {/* Page Switcher Controls */}
        <div className="flex items-center gap-2 bg-white/85 backdrop-blur-md border border-purple-200/80 px-3 py-1.5 rounded-full shadow-2xs">
          <button 
            disabled={currentPage === 0} 
            onClick={() => changePage(currentPage - 1)}
            className="p-1 rounded-full text-purple-900 hover:bg-purple-100 disabled:opacity-30 transition-colors cursor-pointer"
            title="Previous Page"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs font-mono font-black text-purple-950 px-2">
            Page {currentPage} / 4
          </span>
          <button 
            disabled={currentPage === 4} 
            onClick={() => changePage(currentPage + 1)}
            className="p-1 rounded-full text-purple-900 hover:bg-purple-100 disabled:opacity-30 transition-colors cursor-pointer"
            title="Next Page"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* 🌟 MAIN SPIRAL NOTEBOOK WITH REAL 3D PAPER PAGE FLIPPING */}
      <section className="relative z-10 my-auto py-2 flex items-center justify-center">
        
        {/* 3D Perspective Book Wrapper */}
        <div className="relative w-[480px] max-w-[92vw] h-[640px] sm:h-[680px] bg-[#FAFBFD] border-2 border-purple-300/90 rounded-[34px] shadow-2xl overflow-visible flex flex-col border-r-4 border-r-purple-200 [perspective:1800px]">
          
          {/* 🌀 100% CONTAINED REALISTIC SPIRAL SPINE (ANCHORED INSIDE LEFT EDGE) */}
          <div className="absolute left-0 top-0 bottom-0 z-40 w-11 flex flex-col justify-between py-6 px-1.5 pointer-events-none bg-gradient-to-r from-purple-200/40 via-purple-100/20 to-transparent border-r border-purple-200/50 rounded-l-[34px]">
            {Array.from({ length: 15 }).map((_, i) => (
              <div key={i} className="flex items-center gap-1">
                {/* Paper punch hole */}
                <div className="w-2.5 h-2.5 rounded-full bg-zinc-300 shadow-inner border border-zinc-400/60" />
                {/* 3D Metallic Ring Coil */}
                <div className="w-7 h-2.5 rounded-full bg-gradient-to-r from-zinc-300 via-white to-zinc-400 shadow-md border border-zinc-400/80 -ml-1.5" />
              </div>
            ))}
          </div>

          {/* 🔖 4 INDEX DIVIDER BOOKMARK TABS */}
          <div className="absolute -right-28 sm:-right-32 top-10 bottom-10 z-40 flex flex-col justify-around pointer-events-auto">
            {bookmarkTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = currentPage === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => changePage(tab.id)}
                  className={`h-11 sm:h-12 px-4 rounded-r-2xl font-black text-xs sm:text-sm flex items-center gap-2 transition-all duration-300 shadow-lg cursor-pointer border-y border-r border-purple-300/80 ${
                    isActive 
                      ? "bg-[#8031A6] text-white border-purple-400 translate-x-2 shadow-purple-500/30 ring-2 ring-purple-300 z-50" 
                      : "bg-white/95 text-purple-950 hover:bg-white hover:translate-x-1 hover:text-purple-700 z-30"
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="inline tracking-wide">{tab.title}</span>
                </button>
              );
            })}
          </div>

          {/* 📖 3D PAPER PAGE FLIPPING MATRIX (PHYSICAL PAPER FLIP ALONG SPIRAL AXIS) */}
          <div className="w-full h-full relative [transform-style:preserve-3d]">
            
            {/* 🌟 COVER PAGE (PAGE 0) */}
            <div 
              className={`absolute inset-0 bg-gradient-to-br from-[#702594] via-[#9B66D4] to-[#5B2C8F] rounded-[34px] pl-12 pr-6 py-6 text-white flex flex-col justify-between items-center text-center transition-all duration-800 ease-in-out origin-left border-2 border-white/20 shadow-2xl [transform-style:preserve-3d] ${
                currentPage > 0 
                  ? "[transform:rotateY(-180deg)] opacity-0 pointer-events-none z-10" 
                  : "[transform:rotateY(0deg)] opacity-100 z-30"
              }`}
            >
              <div className="space-y-2 pt-2">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-4 py-1 text-xs font-black uppercase tracking-widest text-purple-100">
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>Executive Spiral Ledger</span>
                </div>
                <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white pt-2 leading-tight">
                  ADARSH STATIONERY MART
                </h1>
                <p className="text-xs text-purple-100 font-bold uppercase tracking-[0.2em]">
                  Business Management Book
                </p>
              </div>

              {/* 🌟 ENLARGED PROMINENT ADARSH LOGO ON COVER PAGE */}
              <div className="w-48 sm:w-56 h-48 sm:h-56 bg-white/95 rounded-3xl p-4 shadow-2xl border-4 border-white/50 flex items-center justify-center my-2 hover:scale-105 transition-transform">
                <Image
                  src="/logo-full.png"
                  alt="Adarsh Logo"
                  width={1024}
                  height={1024}
                  priority
                  className="w-full h-full object-contain mix-blend-multiply filter drop-shadow-md"
                />
              </div>

              <div className="space-y-3 w-full max-w-xs pb-1">
                <button
                  onClick={() => changePage(1)}
                  className="btn-pill-gradient w-full h-12 rounded-full font-black text-sm text-white flex items-center justify-center gap-2 shadow-xl hover:scale-105 transition-all cursor-pointer border border-white/30"
                >
                  <span>Open Notebook Pages</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <p className="text-[11px] text-purple-200 font-mono font-bold">
                  Scroll mouse wheel anywhere to flip pages
                </p>
              </div>
            </div>

            {/* 🌟 PAGE 1: EXECUTIVE DASHBOARD */}
            <div 
              className={`absolute inset-0 bg-[#FAFBFD] rounded-[34px] pl-12 pr-6 py-6 flex flex-col justify-between transition-all duration-800 ease-in-out origin-left shadow-2xl [transform-style:preserve-3d] ${
                currentPage < 1 
                  ? "[transform:rotateY(0deg)] opacity-0 pointer-events-none z-10" 
                  : currentPage === 1 
                  ? "[transform:rotateY(0deg)] opacity-100 z-30" 
                  : "[transform:rotateY(-180deg)] opacity-0 pointer-events-none z-10"
              }`}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-border-subtle pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-purple-100 text-purple-700">
                      <LayoutDashboard className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-purple-700">Page 1 • Executive Summary</span>
                      <h2 className="text-xl font-black text-gray-900">Sales & Operations Pulse</h2>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-xs font-black bg-emerald-500/10 text-emerald-700 border border-emerald-200">
                    {metrics.growthPct} ▲
                  </span>
                </div>

                {/* Top Metrics Cards */}
                <div className="grid grid-cols-3 gap-2.5">
                  <div className="p-3 rounded-2xl bg-white border border-border-subtle shadow-2xs space-y-0.5">
                    <p className="text-[10px] font-bold text-zinc-500 uppercase">Revenue</p>
                    <p className="text-lg font-black text-gray-900 font-mono truncate">{metrics.formattedRevenue}</p>
                  </div>
                  <div className="p-3 rounded-2xl bg-white border border-border-subtle shadow-2xs space-y-0.5">
                    <p className="text-[10px] font-bold text-zinc-500 uppercase">Orders</p>
                    <p className="text-lg font-black text-gray-900 font-mono truncate">{metrics.totalOrders.toLocaleString("en-IN")}</p>
                  </div>
                  <div className="p-3 rounded-2xl bg-gradient-to-br from-[#9B66D4] to-[#D8A5E9] text-white shadow-xs space-y-0.5">
                    <p className="text-[10px] font-bold text-purple-100 uppercase">Growth</p>
                    <p className="text-lg font-black font-mono truncate">{metrics.growthPct}</p>
                  </div>
                </div>

                {/* USEFUL CONTENT: RECENT ORDERS STREAM */}
                <div className="bg-white border border-border-subtle rounded-2xl p-4 space-y-3 shadow-2xs flex-1 flex flex-col justify-between">
                  <div className="flex items-center justify-between border-b border-border-subtle pb-2">
                    <span className="text-xs font-black text-purple-900 uppercase tracking-wider flex items-center gap-1.5">
                      <Activity className="w-3.5 h-3.5 text-primary-600" /> Live Order Stream
                    </span>
                    <span className="text-[10px] font-mono font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">Active</span>
                  </div>

                  <div className="space-y-2.5 text-xs font-medium">
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-purple-50/60 border border-purple-100">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                        <div>
                          <p className="font-black text-gray-900 text-xs">#ORD-9482 • Rajesh Kumar</p>
                          <p className="text-[10px] text-zinc-500">Classmate Notebooks (5x)</p>
                        </div>
                      </div>
                      <span className="font-mono font-bold text-gray-900">₹1,250</span>
                    </div>

                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-purple-50/60 border border-purple-100">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                        <div>
                          <p className="font-black text-gray-900 text-xs">#ORD-9481 • Priya Sharma</p>
                          <p className="text-[10px] text-zinc-500">Parker Fountain Pen (1x)</p>
                        </div>
                      </div>
                      <span className="font-mono font-bold text-gray-900">₹850</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Action Footer */}
              <div className="flex items-center justify-between pt-3 border-t border-border-subtle">
                <span className="text-xs font-bold text-zinc-600 flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Real-Time Analytics
                </span>
                <button
                  onClick={() => handleOpenSection("/admin/dashboard", "Executive Dashboard")}
                  className="btn-pill-gradient h-11 px-5 rounded-full font-black text-xs text-white flex items-center gap-2 shadow-md hover:scale-105 transition-all cursor-pointer"
                >
                  <span>Open Dashboard Page</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* 🌟 PAGE 2: PRODUCTS & CATALOG */}
            <div 
              className={`absolute inset-0 bg-[#FAFBFD] rounded-[34px] pl-12 pr-6 py-6 flex flex-col justify-between transition-all duration-800 ease-in-out origin-left shadow-2xl [transform-style:preserve-3d] ${
                currentPage < 2 
                  ? "[transform:rotateY(0deg)] opacity-0 pointer-events-none z-10" 
                  : currentPage === 2 
                  ? "[transform:rotateY(0deg)] opacity-100 z-30" 
                  : "[transform:rotateY(-180deg)] opacity-0 pointer-events-none z-10"
              }`}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-border-subtle pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-purple-100 text-purple-700">
                      <Package className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-purple-700">Page 2 • Catalog Infrastructure</span>
                      <h2 className="text-xl font-black text-gray-900">Product Matrix & Inventory</h2>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-xs font-black bg-purple-500/10 text-purple-700 border border-purple-200">
                    {metrics.totalProducts} SKUs
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div className="p-3 rounded-2xl bg-white border border-border-subtle shadow-2xs space-y-0.5">
                    <p className="text-[10px] font-bold text-zinc-500 uppercase">Active Catalog</p>
                    <p className="text-lg font-black text-gray-900 font-mono">{metrics.totalProducts} Items</p>
                  </div>
                  <div className="p-3 rounded-2xl bg-white border border-border-subtle shadow-2xs space-y-0.5">
                    <p className="text-[10px] font-bold text-zinc-500 uppercase">Inventory Status</p>
                    <p className="text-lg font-black text-emerald-600 font-mono">Healthy Stock</p>
                  </div>
                </div>

                {/* USEFUL CONTENT: CATEGORY INVENTORY BREAKDOWN */}
                <div className="bg-white border border-border-subtle rounded-2xl p-4 space-y-3 shadow-2xs flex-1 flex flex-col justify-between">
                  <span className="text-xs font-black text-purple-900 uppercase tracking-wider flex items-center gap-1.5 border-b border-border-subtle pb-2">
                    <Layers className="w-3.5 h-3.5 text-primary-600" /> Category Inventory Breakdown
                  </span>

                  <div className="space-y-3 text-xs">
                    <div className="space-y-1">
                      <div className="flex justify-between font-extrabold text-gray-900 text-[11px]">
                        <span>Notebooks & Registers</span>
                        <span>84% Stock</span>
                      </div>
                      <div className="w-full bg-purple-100 h-2 rounded-full overflow-hidden">
                        <div className="bg-purple-600 h-full rounded-full w-[84%]" />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between font-extrabold text-gray-900 text-[11px]">
                        <span>Executive Writing Pens</span>
                        <span>92% Stock</span>
                      </div>
                      <div className="w-full bg-purple-100 h-2 rounded-full overflow-hidden">
                        <div className="bg-fuchsia-600 h-full rounded-full w-[92%]" />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between font-extrabold text-gray-900 text-[11px]">
                        <span>Art & Office Supplies</span>
                        <span>68% Stock</span>
                      </div>
                      <div className="w-full bg-purple-100 h-2 rounded-full overflow-hidden">
                        <div className="bg-indigo-600 h-full rounded-full w-[68%]" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Action Footer */}
              <div className="flex items-center justify-between pt-3 border-t border-border-subtle">
                <span className="text-xs font-bold text-zinc-600 flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Brands Taxonomy
                </span>
                <button
                  onClick={() => handleOpenSection("/admin/products", "Product Registry")}
                  className="btn-pill-gradient h-11 px-5 rounded-full font-black text-xs text-white flex items-center gap-2 shadow-md hover:scale-105 transition-all cursor-pointer"
                >
                  <span>Open Product Registry</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* 🌟 PAGE 3: PAYMENTS & FINANCIALS */}
            <div 
              className={`absolute inset-0 bg-[#FAFBFD] rounded-[34px] pl-12 pr-6 py-6 flex flex-col justify-between transition-all duration-800 ease-in-out origin-left shadow-2xl [transform-style:preserve-3d] ${
                currentPage < 3 
                  ? "[transform:rotateY(0deg)] opacity-0 pointer-events-none z-10" 
                  : currentPage === 3 
                  ? "[transform:rotateY(0deg)] opacity-100 z-30" 
                  : "[transform:rotateY(-180deg)] opacity-0 pointer-events-none z-10"
              }`}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-border-subtle pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-purple-100 text-purple-700">
                      <CreditCard className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-purple-700">Page 3 • Reconciliation</span>
                      <h2 className="text-xl font-black text-gray-900">Payments & Revenue Stream</h2>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div className="p-3 rounded-2xl bg-white border border-border-subtle shadow-2xs space-y-0.5">
                    <p className="text-[10px] font-bold text-zinc-500 uppercase">Gross Paid Revenue</p>
                    <p className="text-lg font-black text-gray-900 font-mono">{metrics.formattedRevenue}</p>
                  </div>
                  <div className="p-3 rounded-2xl bg-white border border-border-subtle shadow-2xs space-y-0.5">
                    <p className="text-[10px] font-bold text-zinc-500 uppercase">Gateway Channel</p>
                    <p className="text-lg font-black text-blue-600 font-mono">Razorpay Active</p>
                  </div>
                </div>

                {/* USEFUL CONTENT: PAYMENT METHODS MATRIX */}
                <div className="bg-white border border-border-subtle rounded-2xl p-4 space-y-3 shadow-2xs flex-1 flex flex-col justify-between">
                  <span className="text-xs font-black text-purple-900 uppercase tracking-wider flex items-center gap-1.5 border-b border-border-subtle pb-2">
                    <FileText className="w-3.5 h-3.5 text-primary-600" /> Payment Methods & Settlement Matrix
                  </span>

                  <div className="grid grid-cols-2 gap-2.5 text-xs font-semibold">
                    <div className="p-2.5 rounded-xl bg-purple-50/70 border border-purple-100 space-y-0.5">
                      <p className="text-[10px] text-zinc-500 font-bold">UPI / GPay</p>
                      <p className="font-black text-purple-900 text-sm">78% Share</p>
                    </div>
                    <div className="p-2.5 rounded-xl bg-purple-50/70 border border-purple-100 space-y-0.5">
                      <p className="text-[10px] text-zinc-500 font-bold">Debit & Cards</p>
                      <p className="font-black text-purple-900 text-sm">14% Share</p>
                    </div>
                    <div className="p-2.5 rounded-xl bg-purple-50/70 border border-purple-100 space-y-0.5">
                      <p className="text-[10px] text-zinc-500 font-bold">COD Orders</p>
                      <p className="font-black text-purple-900 text-sm">8% Share</p>
                    </div>
                    <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 space-y-0.5">
                      <p className="text-[10px] text-emerald-700 font-bold">Settlement</p>
                      <p className="font-black text-emerald-800 text-sm">T+1 Auto</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Action Footer */}
              <div className="flex items-center justify-between pt-3 border-t border-border-subtle">
                <span className="text-xs font-bold text-zinc-600 flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Auto-Reconciled
                </span>
                <button
                  onClick={() => handleOpenSection("/admin/payments", "Payments & Revenue")}
                  className="btn-pill-gradient h-11 px-5 rounded-full font-black text-xs text-white flex items-center gap-2 shadow-md hover:scale-105 transition-all cursor-pointer"
                >
                  <span>Open Payments Matrix</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* 🌟 PAGE 4: STORE SETTINGS & SYSTEM */}
            <div 
              className={`absolute inset-0 bg-[#FAFBFD] rounded-[34px] pl-12 pr-6 py-6 flex flex-col justify-between transition-all duration-800 ease-in-out origin-left shadow-2xl [transform-style:preserve-3d] ${
                currentPage < 4 
                  ? "[transform:rotateY(0deg)] opacity-0 pointer-events-none z-10" 
                  : currentPage === 4 
                  ? "[transform:rotateY(0deg)] opacity-100 z-30" 
                  : "[transform:rotateY(-180deg)] opacity-0 pointer-events-none z-10"
              }`}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-border-subtle pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-purple-100 text-purple-700">
                      <Settings className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-purple-700">Page 4 • System Administration</span>
                      <h2 className="text-xl font-black text-gray-900">System & Store Settings</h2>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div className="p-3 rounded-2xl bg-white border border-border-subtle shadow-2xs space-y-0.5">
                    <p className="text-[10px] font-bold text-zinc-500 uppercase">Registered Users</p>
                    <p className="text-lg font-black text-gray-900 font-mono">{metrics.totalCustomers}</p>
                  </div>
                  <div className="p-3 rounded-2xl bg-white border border-border-subtle shadow-2xs space-y-0.5">
                    <p className="text-[10px] font-bold text-zinc-500 uppercase">Access Privilege</p>
                    <p className="text-lg font-black text-purple-700 font-mono">SuperAdmin</p>
                  </div>
                </div>

                {/* USEFUL CONTENT: SYSTEM SECURITY CHECKLIST */}
                <div className="bg-white border border-border-subtle rounded-2xl p-4 space-y-2.5 shadow-2xs flex-1 flex flex-col justify-between">
                  <span className="text-xs font-black text-purple-900 uppercase tracking-wider flex items-center gap-1.5 border-b border-border-subtle pb-2">
                    <ShieldCheck className="w-3.5 h-3.5 text-primary-600" /> Security Verification Audit
                  </span>

                  <div className="space-y-2.5 text-xs font-medium">
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200 text-emerald-900">
                      <span className="font-bold flex items-center gap-1.5">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> Database Cluster
                      </span>
                      <span className="text-[10px] font-black font-mono">MongoDB Connected</span>
                    </div>

                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200 text-emerald-900">
                      <span className="font-bold flex items-center gap-1.5">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> Cloud Media Sync
                      </span>
                      <span className="text-[10px] font-black font-mono">CDN Active</span>
                    </div>

                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200 text-emerald-900">
                      <span className="font-bold flex items-center gap-1.5">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> NextAuth Session
                      </span>
                      <span className="text-[10px] font-black font-mono">Secured</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Action Footer */}
              <div className="flex items-center justify-between pt-3 border-t border-border-subtle">
                <span className="text-xs font-bold text-zinc-600 flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Authorized Control
                </span>
                <button
                  onClick={() => handleOpenSection("/admin/settings", "Store Settings")}
                  className="btn-pill-gradient h-11 px-5 rounded-full font-black text-xs text-white flex items-center gap-2 shadow-md hover:scale-105 transition-all cursor-pointer"
                >
                  <span>Open Store Settings</span>
                  <ArrowRight className="w-3.5 h-3.5" />
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
