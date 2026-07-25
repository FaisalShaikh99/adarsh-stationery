"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { 
  LayoutDashboard, 
  ShoppingBag, 
  Package, 
  Users, 
  CreditCard, 
  Settings, 
  User, 
  X,
  Layers,
  FolderTree,
  Tag,
  Shield,
  ChevronRight,
  Sparkles,
  Store,
  LogOut
} from "lucide-react";

export default function AdminSidebar({ 
  isMobileOpen,
  setIsMobileOpen
}) {
  const pathname = usePathname();
  const { data: session } = useSession();

  const navItems = [
    { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
    { name: "Products Catalog", href: "/admin/products", icon: Package },
    { name: "Categories Matrix", href: "/admin/categories", icon: FolderTree },
    { name: "Brands Taxonomy", href: "/admin/brands", icon: Tag },
    { name: "Orders Feed", href: "/admin/orders", icon: ShoppingBag },
    { name: "Customer Directory", href: "/admin/customers", icon: Users },
    { name: "Inventory Control", href: "/admin/inventory", icon: Layers },
    { name: "Payments & Revenue", href: "/admin/payments", icon: CreditCard },
    { name: "Team Members", href: "/admin/team-members", icon: Shield, requireSuperAdmin: true },
    { name: "My Profile", href: "/admin/profile", icon: User },
    { name: "Store Settings", href: "/admin/settings", icon: Settings },
  ];

  const visibleLinks = navItems.filter(
    item => !item.requireSuperAdmin || session?.user?.role === "superadmin"
  );

  return (
    <>
      {/* MOBILE BACKDROP & SLIDE-OUT DRAWER */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs lg:hidden animate-in fade-in duration-200"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* 🌟 BEAUTIFUL PURPLE & LIGHT YELLOW SAAS SIDEBAR */}
      <aside 
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-gradient-to-b from-[#5B2C8F] via-[#4A056D] to-[#35044F] text-white p-4 flex flex-col justify-between transition-transform duration-300 ease-in-out shadow-2xl ${
          isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="space-y-6">
          
          {/* SIDEBAR HEADER: VERY BIG HD TRANSPARENT LOGO & LIGHT YELLOW BADGE */}
          <div className="flex items-center justify-between pb-4 border-b border-purple-400/30">
            <Link 
              href="/admin/dashboard" 
              onClick={() => setIsMobileOpen(false)} 
              className="flex items-center gap-3 group"
            >
              <div className="relative shrink-0 p-1 rounded-2xl bg-white/10 backdrop-blur-md group-hover:scale-105 transition-transform duration-200">
                <img 
                  src="/logo.png" 
                  alt="Adarsh Stationery Mart" 
                  className="w-14 h-14 object-contain drop-shadow-md" 
                />
              </div>

              <div className="flex flex-col min-w-0">
                <span className="font-black text-base text-white tracking-tight leading-snug truncate">
                  Adarsh Stationery
                </span>
                <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-full bg-[#FDF0A6] text-[#4A056D] border border-[#FEE685] w-fit shadow-2xs mt-0.5">
                  Mart SaaS Admin
                </span>
              </div>
            </Link>

            <button
              onClick={() => setIsMobileOpen(false)}
              className="lg:hidden p-1.5 rounded-xl text-purple-200 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* NAVIGATION LIST */}
          <nav className="space-y-1.5 custom-scrollbar max-h-[calc(100vh-190px)] overflow-y-auto pr-1">
            <div className="text-[10px] font-black uppercase tracking-wider text-[#FDF0A6] px-3 mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#E8C547]" /> Main Menu
            </div>

            {visibleLinks.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMobileOpen(false)}
                  className={`flex items-center justify-between px-3.5 py-3 rounded-2xl text-sm transition-all duration-200 group ${
                    isActive
                      ? "bg-white text-[#4A056D] font-black shadow-lg shadow-purple-950/40 border-l-4 border-[#E8C547] translate-x-1"
                      : "text-purple-100 hover:text-white hover:bg-white/10 font-bold"
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className={`p-1.5 rounded-xl transition-colors ${
                      isActive ? "bg-[#FDF0A6] text-[#4A056D]" : "bg-white/10 text-purple-200 group-hover:text-white group-hover:bg-white/20"
                    }`}>
                      <Icon className="w-5 h-5 shrink-0" />
                    </div>
                    <span className="truncate">{item.name}</span>
                  </div>

                  {isActive ? (
                    <span className="w-2 h-2 rounded-full bg-[#E8C547] shadow-xs" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-purple-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                  )}
                </Link>
              );
            })}
          </nav>

        </div>

        {/* SIDEBAR FOOTER: ADMIN USER PROFILE & QUICK TOGGLE */}
        <div className="pt-4 border-t border-purple-400/30">
          <div className="flex items-center justify-between p-2 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10">
            <div className="flex items-center gap-2.5 min-w-0">
              {session?.user?.image ? (
                <img 
                  src={session.user.image} 
                  alt="Profile" 
                  className="w-10 h-10 rounded-xl border border-white/30 object-cover shrink-0"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-10 h-10 rounded-xl bg-[#FDF0A6] text-[#4A056D] font-black flex items-center justify-center text-sm shrink-0">
                  {session?.user?.name ? session.user.name[0].toUpperCase() : "A"}
                </div>
              )}
              <div className="min-w-0">
                <p className="text-xs font-black text-white truncate">{session?.user?.name || "Admin User"}</p>
                <p className="text-[10px] text-purple-200 font-mono truncate">{session?.user?.role || "Staff"}</p>
              </div>
            </div>

            <Link 
              href="/admin/settings"
              onClick={() => setIsMobileOpen(false)}
              className="p-2 rounded-xl text-purple-200 hover:text-white hover:bg-white/20 transition-colors"
              title="Settings"
            >
              <Settings className="w-4.5 h-4.5" />
            </Link>
          </div>
        </div>

      </aside>
    </>
  );
}