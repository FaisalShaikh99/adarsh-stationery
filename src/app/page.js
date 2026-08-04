"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import axios from "axios";
import { 
  Sparkles, 
  ArrowRight, 
  LayoutDashboard, 
  Package,
  Boxes,
  CreditCard,
  Settings,
  ShoppingBag,
  TrendingUp,
  ShieldCheck,
  Zap,
  Building2,
  CheckCircle2
} from "lucide-react";

export default function Home() {
  const router = useRouter();

  // Navigation Loading Overlay State
  const [isNavigating, setIsNavigating] = useState(false);
  const [navStatusText, setNavStatusText] = useState("Opening Module...");

  // Live Business Metrics & Store Settings State
  const [metrics, setMetrics] = useState({
    formattedRevenue: "₹12.0k",
    totalOrders: 10,
    growthPct: "+12.4%",
    totalProducts: 156,
    totalCustomers: 890,
    recentOrdersStream: [],
    lowStockWatchlist: [],
    categoryBreakdown: [],
    storeSettings: {
      storeName: "Adarsh Stationery",
      contactEmail: "support@adarshstationery.com",
      contactPhone: "+91 98765 43210",
      storeAddress: "123 Stationery Plaza, Main Market, Mumbai, MH - 400001"
    }
  });

  // Fetch Live Metrics & Store Settings
  useEffect(() => {
    async function fetchSummary() {
      try {
        const res = await axios.get("/api/public/summary");
        if (res.data?.success && res.data?.data) {
          setMetrics(prev => ({ ...prev, ...res.data.data }));
        }
      } catch (err) {
        console.error("Failed to fetch live summary metrics:", err);
      }
    }
    fetchSummary();
  }, []);

  // Handle Card Click Navigation with Loading Overlay
  const handleOpenSection = (destinationPath, sectionName) => {
    if (isNavigating) return;
    setIsNavigating(true);
    setNavStatusText(`Loading ${sectionName}...`);

    setTimeout(() => {
      router.push(destinationPath);
    }, 800);
  };

  // Section Cards Configuration
  const adminModules = [
    {
      id: "dashboard",
      title: "Sales & Operations Pulse",
      description: "Real-time revenue, order volume & weekly growth analytics.",
      href: "/admin/dashboard",
      badge: "Analytics",
      primaryMetric: metrics.formattedRevenue || "₹12.0k",
      metricLabel: "Net Revenue",
      subMetric: `${metrics.growthPct || "+12.4%"} Growth`,
      icon: LayoutDashboard,
      accentGradient: "from-purple-600 to-indigo-600",
      badgeStyle: "bg-purple-100 text-purple-700 border-purple-200"
    },
    {
      id: "products",
      title: "Products & SKU Catalog",
      description: "Manage product SKUs, pricing matrix, barcodes & categories.",
      href: "/admin/products",
      badge: "Catalog",
      primaryMetric: `${metrics.totalProducts || 156} SKUs`,
      metricLabel: "Active SKUs",
      subMetric: `${metrics.categoryBreakdown?.length || 4} Categories`,
      icon: Package,
      accentGradient: "from-blue-600 to-cyan-600",
      badgeStyle: "bg-blue-100 text-blue-700 border-blue-200"
    },
    {
      id: "orders",
      title: "Orders Feed & Fulfillment",
      description: "Customer order dispatches, shipping status & PDF invoice printing.",
      href: "/admin/orders",
      badge: "Fulfillment",
      primaryMetric: `${metrics.totalOrders || 10} Orders`,
      metricLabel: "Order Volume",
      subMetric: "Dispatch Ready",
      icon: ShoppingBag,
      accentGradient: "from-fuchsia-600 to-pink-600",
      badgeStyle: "bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200"
    },
    {
      id: "inventory",
      title: "Inventory Depletion Monitor",
      description: "Low-stock alert watcher, stock depletion & automatic reorders.",
      href: "/admin/inventory",
      badge: "Stock Control",
      primaryMetric: `${metrics.lowStockWatchlist?.length || 0} Alerts`,
      metricLabel: "Depletion Watchlist",
      subMetric: "Threshold Watcher",
      icon: Boxes,
      accentGradient: "from-amber-500 to-orange-600",
      badgeStyle: "bg-amber-100 text-amber-800 border-amber-200"
    },
    {
      id: "payments",
      title: "Payments & Financial Audit",
      description: "Razorpay payouts, gross margins & bank log reconciliation.",
      href: "/admin/payments",
      badge: "Finance",
      primaryMetric: metrics.growthPct || "+12.4%",
      metricLabel: "Settlement Rate",
      subMetric: "Gateway Matched",
      icon: CreditCard,
      accentGradient: "from-emerald-600 to-teal-600",
      badgeStyle: "bg-emerald-100 text-emerald-700 border-emerald-200"
    },
    {
      id: "settings",
      title: "System & Store Setup",
      description: "SuperAdmin security access, store details & webhook health.",
      href: "/admin/settings",
      badge: "System Admin",
      primaryMetric: "SuperAdmin",
      metricLabel: "Access Role",
      subMetric: "Verified Active",
      icon: Settings,
      accentGradient: "from-rose-600 to-pink-600",
      badgeStyle: "bg-rose-100 text-rose-700 border-rose-200"
    }
  ];

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#33105B_0%,#4A056D_35%,#702594_70%,#29084B_100%)] text-white font-sans selection:bg-purple-300 selection:text-purple-950 flex flex-col justify-between p-4 sm:p-6 md:p-10 relative overflow-x-hidden">
      
      {/* Ambient Background Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.12),transparent_40%),radial-gradient(circle_at_bottom_right,rgba(0,0,0,0.35),transparent_50%)] pointer-events-none" />

      {/* 🌟 NAVIGATION LOADING OVERLAY */}
      {isNavigating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-purple-950/90 backdrop-blur-2xl animate-in fade-in duration-300 p-6">
          <div className="flex flex-col items-center max-w-sm w-full space-y-6 text-center animate-in zoom-in-95 duration-300">
            <div className="w-20 h-20 rounded-3xl bg-white border border-purple-200 shadow-2xl flex items-center justify-center p-3">
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
              <div className="flex items-center justify-center gap-2 text-xs font-black uppercase tracking-wider text-purple-200">
                <Sparkles className="w-4 h-4 animate-spin text-fuchsia-300" />
                <span>{navStatusText}</span>
              </div>
              <h2 className="text-xl font-black text-white tracking-tight">Adarsh Stationery Suite</h2>
            </div>
            <div className="w-full bg-purple-900/60 rounded-full h-2 overflow-hidden p-0.5 border border-purple-400/30">
              <div className="h-full bg-gradient-to-r from-fuchsia-400 via-purple-300 to-indigo-300 rounded-full animate-pulse w-full" />
            </div>
          </div>
        </div>
      )}

      {/* 🌟 HEADER & BRANDING */}
      <header className="relative z-10 max-w-6xl mx-auto w-full pt-4 pb-8 space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-white/15 pb-6 text-center sm:text-left">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white p-2.5 shadow-2xl border-2 border-white/30 flex items-center justify-center shrink-0">
              <Image
                src="/logo-icon.png"
                alt="Adarsh Stationery Logo"
                width={1024}
                height={1024}
                priority
                className="w-full h-full object-contain mix-blend-multiply"
              />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">ADARSH STATIONERY MART</h1>
              <p className="text-xs sm:text-sm text-purple-200 font-medium">Business Management Executive Suite</p>
            </div>
          </div>

          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-bold text-purple-100 shrink-0">
            <Zap className="w-4 h-4 text-amber-300" />
            <span>SuperAdmin Terminal Active</span>
          </div>
        </div>
      </header>

      {/* 🌟 RESPONSIVE ADMIN MODULES GRID */}
      <section className="relative z-10 max-w-6xl mx-auto w-full my-auto py-2">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {adminModules.map((mod) => {
            const Icon = mod.icon;

            return (
              <div
                key={mod.id}
                onClick={() => handleOpenSection(mod.href, mod.title)}
                className="group relative bg-white text-gray-900 rounded-3xl p-6 sm:p-7 border border-purple-100 shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col justify-between overflow-hidden"
              >
                {/* Accent Top Gradient Line */}
                <div className={`absolute top-0 left-0 right-0 h-2 bg-gradient-to-r ${mod.accentGradient}`} />

                <div className="space-y-4">
                  {/* Card Header & Badge */}
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-2xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-700 group-hover:scale-110 group-hover:bg-purple-700 group-hover:text-white transition-all duration-300 shrink-0">
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className={`text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full border ${mod.badgeStyle}`}>
                      {mod.badge}
                    </span>
                  </div>

                  {/* Module Title & Description */}
                  <div>
                    <h3 className="text-lg font-extrabold text-gray-900 group-hover:text-purple-700 transition-colors">
                      {mod.title}
                    </h3>
                    <p className="text-xs text-zinc-600 font-medium mt-1 line-clamp-2">
                      {mod.description}
                    </p>
                  </div>

                  {/* Primary Metric Preview Box */}
                  <div className="p-3.5 rounded-2xl bg-purple-50/70 border border-purple-100/80 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-wider text-purple-700">{mod.metricLabel}</p>
                      <p className="text-xl font-black text-gray-900 tracking-tight mt-0.5">{mod.primaryMetric}</p>
                    </div>
                    <span className="text-xs font-extrabold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                      {mod.subMetric}
                    </span>
                  </div>
                </div>

                {/* Card Action Footer */}
                <div className="pt-4 border-t border-zinc-100 mt-4 flex items-center justify-between">
                  <span className="text-xs font-semibold text-zinc-500">Module Direct Link</span>
                  <button className="py-2 px-3.5 rounded-xl bg-purple-700 text-white font-extrabold text-xs flex items-center gap-1.5 group-hover:bg-purple-800 transition-colors">
                    <span>Open Module</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 🌟 FOOTER */}
      <footer className="relative z-10 max-w-6xl mx-auto w-full text-center py-6 border-t border-white/10 text-xs text-purple-200 font-medium flex flex-col sm:flex-row items-center justify-between gap-3">
        <p>© {new Date().getFullYear()} Adarsh Stationery Mart. All rights reserved.</p>
        <div className="flex items-center gap-2 text-purple-100">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>Adarsh Admin Executive Suite</span>
        </div>
      </footer>

    </main>
  );
}