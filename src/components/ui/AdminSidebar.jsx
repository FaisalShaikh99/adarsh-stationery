"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
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
  LogOut,
  PanelLeftClose,
  PanelLeftOpen
} from "lucide-react";

export default function AdminSidebar({ 
  isMobileOpen,
  setIsMobileOpen,
  isSidebarCollapsed = false,
  onToggleSidebar
}) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [hoveredGroupId, setHoveredGroupId] = useState(null);
  const leaveTimerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (leaveTimerRef.current) clearTimeout(leaveTimerRef.current);
    };
  }, []);

  const handleMouseEnter = (groupId) => {
    if (leaveTimerRef.current) clearTimeout(leaveTimerRef.current);
    setHoveredGroupId(groupId);
  };

  const handleMouseLeave = () => {
    leaveTimerRef.current = setTimeout(() => {
      setHoveredGroupId(null);
    }, 200);
  };

  const handleGroupClick = (groupId) => {
    setHoveredGroupId(prev => (prev === groupId ? null : groupId));
  };

  const navigationGroups = [
    {
      id: "dashboard",
      title: "Analytics & Overview",
      icon: LayoutDashboard,
      links: [
        { name: "Executive Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
        { name: "Payments & Revenue", href: "/admin/payments", icon: CreditCard },
      ]
    },
    {
      id: "catalog",
      title: "Catalog Infrastructure",
      icon: Package,
      links: [
        { name: "Product Registry", href: "/admin/products", icon: Package },
        { name: "Category Matrix", href: "/admin/categories", icon: FolderTree },
        { name: "Brands Taxonomy", href: "/admin/brands", icon: Tag },
        { name: "Inventory Monitor", href: "/admin/inventory", icon: Layers },
      ]
    },
    {
      id: "sales",
      title: "Sales & Fulfillment",
      icon: ShoppingBag,
      links: [
        { name: "Orders Feed", href: "/admin/orders", icon: ShoppingBag },
        { name: "Customer Directory", href: "/admin/customers", icon: Users },
      ]
    },
    {
      id: "administration",
      title: "System Administration",
      icon: Shield,
      links: [
        { name: "Team Members", href: "/admin/team-members", icon: Shield, requireSuperAdmin: true },
        { name: "Store Settings", href: "/admin/settings", icon: Settings },
      ]
    }
  ];

  const activeGroupId = navigationGroups.find(g => 
    g.links.some(l => l.href === pathname)
  )?.id || "dashboard";

  return (
    <>
      {/* MOBILE BACKDROP */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs lg:hidden animate-in fade-in duration-200"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* MOBILE DRAWER */}
      <div 
        className={`fixed top-0 bottom-0 left-0 z-50 w-[320px] max-w-[88vw] bg-white/95 backdrop-blur-2xl border-r border-border-subtle p-5 flex flex-col justify-between overflow-y-auto lg:hidden transition-transform duration-300 ease-in-out shadow-2xl ${
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="space-y-6 flex-1 flex flex-col justify-between">
          <div className="space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-border-subtle">
              <Link 
                href="/" 
                onClick={() => setIsMobileOpen(false)} 
                className="w-[82%] rounded-2xl bg-gradient-to-b from-[#F8F9FE] to-[#ECEFFA] border border-purple-200/60 p-2 shadow-2xs overflow-hidden flex items-center justify-center hover:scale-102 transition-transform"
              >
                <Image
                  src="/logo-full.png"
                  alt="Adarsh Stationery Mart"
                  width={1024}
                  height={1024}
                  quality={95}
                  priority
                  className="w-44 h-auto max-h-16 object-contain mix-blend-multiply rounded-xl"
                />
              </Link>
              <button
                onClick={() => setIsMobileOpen(false)}
                className="p-2 rounded-full text-zinc-500 hover:text-gray-900 hover:bg-primary-50 transition-colors cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-6">
              {navigationGroups.map((group) => {
                const visibleLinks = group.links.filter(
                  l => !l.requireSuperAdmin || session?.user?.role === "superadmin"
                );
                const GroupIcon = group.icon;

                return (
                  <div key={group.id} className="space-y-2">
                    <div className="text-xs font-black uppercase tracking-wider text-primary-700 flex items-center gap-2 px-2">
                      <GroupIcon className="w-4 h-4 text-primary-600" />
                      {group.title}
                    </div>
                    <div className="space-y-1 pl-1">
                      {visibleLinks.map((link) => {
                        const Icon = link.icon;
                        const isLinkActive = pathname === link.href;

                        return (
                          <Link
                            key={link.href}
                            href={link.href}
                            onClick={() => setIsMobileOpen(false)}
                            className={`flex items-center justify-between px-3.5 py-3 rounded-2xl text-sm transition-colors ${
                              isLinkActive
                                ? "bg-primary-100 text-primary-700 font-black border-l-4 border-primary-600 shadow-2xs"
                                : "text-gray-900 hover:text-primary-700 hover:bg-primary-50 font-bold"
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <Icon className={`w-5 h-5 shrink-0 ${isLinkActive ? "text-primary-600" : "text-zinc-500"}`} />
                              <span className="truncate">{link.name}</span>
                            </div>
                            {isLinkActive && <ChevronRight className="w-4 h-4 text-primary-600 shrink-0" />}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* MOBILE PROFILE & LOGOUT SECTION */}
          <div className="pt-4 border-t border-border-subtle space-y-3 mt-auto">
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-primary-50/70 border border-primary-100">
              {session?.user?.image ? (
                <img 
                  src={session.user.image} 
                  alt="Profile" 
                  className="w-10 h-10 rounded-full border border-border-subtle object-cover shrink-0"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-primary-600 flex items-center justify-center text-sm font-black text-white shrink-0">
                  {session?.user?.name ? session.user.name[0].toUpperCase() : "A"}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-xs font-black text-gray-900 truncate">{session?.user?.name || "Admin User"}</p>
                <p className="text-[11px] text-zinc-600 font-mono truncate">{session?.user?.email || "admin@adarsh.com"}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Link
                href="/admin/profile"
                onClick={() => setIsMobileOpen(false)}
                className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-white border border-border-subtle text-xs font-bold text-gray-900 hover:bg-primary-50 transition-colors"
              >
                <User className="w-4 h-4 text-primary-600" /> Profile
              </Link>
              <button
                onClick={() => {
                  setIsMobileOpen(false);
                  signOut({ callbackUrl: "/admin/sign-in" });
                }}
                className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-600 hover:bg-rose-100 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4 text-rose-600" /> Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 🌟 DRAWING 1: PURPLE VERTICAL EDGE TAB BUTTON WHEN SIDEBAR IS COLLAPSED */}
      {isSidebarCollapsed && onToggleSidebar && (
        <button
          onClick={onToggleSidebar}
          className="hidden lg:flex fixed left-0 top-1/2 -translate-y-1/2 z-50 w-3.5 sm:w-4 h-16 sm:h-20 bg-[#702594] hover:bg-[#8031A6] text-white rounded-r-xl shadow-xl border-y border-r border-purple-400 items-center justify-center cursor-pointer transition-all duration-300 hover:w-5.5 group animate-in slide-in-from-left duration-200"
          title="Open Sidebar"
          aria-label="Open Sidebar"
        >
          <ChevronRight className="w-3.5 h-3.5 text-purple-100 group-hover:translate-x-0.5 transition-transform" />
        </button>
      )}

      {/* 🌟 DRAWING 2: DESKTOP FULL-HEIGHT SIDEBAR RAIL WITH TOP PURPLE TOGGLE BUTTON */}
      <aside 
        className={`hidden lg:flex fixed top-3.5 bottom-3.5 left-4 z-40 w-14 sm:w-16 bg-white/95 backdrop-blur-2xl border border-border-subtle rounded-[32px] flex-col justify-between items-center py-3.5 px-1.5 select-none shadow-md transition-all duration-300 ease-in-out ${
          isSidebarCollapsed ? "-translate-x-28 opacity-0 pointer-events-none" : "translate-x-0 opacity-100"
        }`}
      >
        
        {/* TOP SECTION: PURPLE TOGGLE BUTTON (DRAWING 2) + STACKED NAVIGATION ICON BUTTONS */}
        <nav className="flex flex-col items-center gap-3 w-full">
          
          {/* 🌟 DRAWING 2: TOP PURPLE SIDEBAR TOGGLE BUTTON */}
          {onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-purple-100 text-purple-700 hover:bg-purple-200 border border-purple-200 transition-all cursor-pointer flex items-center justify-center shadow-2xs mb-1 group"
              title="Close Sidebar"
              aria-label="Close Sidebar"
            >
              <PanelLeftClose className="w-5.5 h-5.5 text-purple-800 group-hover:scale-105 transition-transform" />
            </button>
          )}

          {navigationGroups.map((group) => {
            const GroupIcon = group.icon;
            const isGroupActive = activeGroupId === group.id;
            const isHovered = hoveredGroupId === group.id;

            const visibleLinks = group.links.filter(
              l => !l.requireSuperAdmin || session?.user?.role === "superadmin"
            );

            return (
              <div 
                key={group.id} 
                className="relative w-full flex justify-center"
                onMouseEnter={() => handleMouseEnter(group.id)}
                onMouseLeave={handleMouseLeave}
              >
                {/* ICON NAVIGATION CAPSULE BUTTON */}
                <button
                  onClick={() => handleGroupClick(group.id)}
                  className={`w-11 h-11 sm:w-12 sm:h-12 rounded-2xl transition-all duration-200 cursor-pointer flex items-center justify-center relative ${
                    isGroupActive
                      ? "bg-primary-600 text-white font-bold shadow-md shadow-primary-600/30 ring-4 ring-primary-100 scale-105"
                      : "bg-white border border-border-subtle text-zinc-700 hover:text-primary-700 hover:bg-primary-50 hover:border-primary-300 hover:scale-105 shadow-2xs"
                  }`}
                  title={group.title}
                  aria-label={group.title}
                >
                  <GroupIcon className={`h-5 w-5 sm:h-5.5 sm:w-5.5 transition-transform ${isGroupActive ? "text-white" : "text-zinc-600"}`} />
                </button>

                {/* HOVER FLYOUT SUBMENU PANEL */}
                {isHovered && (
                  <div 
                    className="absolute left-16 top-0 bg-white/95 backdrop-blur-2xl border border-border-subtle shadow-2xl rounded-2xl p-3 min-w-[220px] space-y-1.5 z-50 animate-in fade-in zoom-in-95 duration-150"
                    onMouseEnter={() => handleMouseEnter(group.id)}
                    onMouseLeave={handleMouseLeave}
                  >
                    <div className="px-3 py-1.5 border-b border-border-subtle flex items-center justify-between mb-1">
                      <span className="text-xs font-black uppercase tracking-wider text-primary-700 flex items-center gap-2">
                        <GroupIcon className="w-4 h-4 text-primary-600" />
                        {group.title}
                      </span>
                    </div>

                    <div className="space-y-1">
                      {visibleLinks.map((link) => {
                        const Icon = link.icon;
                        const isLinkActive = pathname === link.href;

                        return (
                          <Link
                            key={link.href}
                            href={link.href}
                            onClick={() => {
                              setHoveredGroupId(null);
                            }}
                            className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs transition-all duration-150 ${
                              isLinkActive
                                ? "bg-primary-100 text-primary-700 font-black border-l-4 border-primary-600 pl-3 shadow-2xs"
                                : "text-gray-900 hover:text-primary-700 hover:bg-primary-50 font-bold"
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <Icon className={`h-4.5 w-4.5 shrink-0 ${isLinkActive ? "text-primary-600" : "text-zinc-500"}`} />
                              <span className="truncate">{link.name}</span>
                            </div>
                            {isLinkActive && <ChevronRight className="h-3.5 w-3.5 text-primary-600 shrink-0" />}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                )}

              </div>
            );
          })}
        </nav>

        {/* BOTTOM SECTION: CIRCULAR STORE SETTINGS BUTTON */}
        <div className="w-full flex justify-center pt-2 border-t border-border-subtle">
          <div 
            className="relative w-full flex justify-center"
            onMouseEnter={() => handleMouseEnter("settings")}
            onMouseLeave={handleMouseLeave}
          >
            <Link
              href="/admin/settings"
              className={`w-11 h-11 sm:w-12 sm:h-12 rounded-full transition-all duration-200 cursor-pointer flex items-center justify-center ${
                pathname === "/admin/settings"
                  ? "bg-primary-600 text-white shadow-md ring-3 ring-primary-200"
                  : "bg-white/90 border border-border-subtle text-zinc-700 hover:text-primary-700 hover:bg-primary-50 shadow-2xs"
              }`}
              title="Store Settings"
            >
              <Settings className="h-5.5 w-5.5" />
            </Link>

            {hoveredGroupId === "settings" && (
              <div 
                className="absolute left-16 bottom-0 bg-white/95 backdrop-blur-2xl border border-border-subtle shadow-2xl rounded-2xl p-3 min-w-[210px] z-50 animate-in fade-in zoom-in-95 duration-150"
                onMouseEnter={() => handleMouseEnter("settings")}
                onMouseLeave={handleMouseLeave}
              >
                <div className="px-2.5 py-1 text-xs font-black uppercase tracking-wider text-primary-700 flex items-center gap-2 border-b border-border-subtle pb-2 mb-1">
                  <Settings className="w-4 h-4 text-primary-600" /> Store Administration
                </div>
                <Link
                  href="/admin/settings"
                  onClick={() => {
                    setHoveredGroupId(null);
                  }}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-extrabold transition-colors ${
                    pathname === "/admin/settings"
                      ? "bg-primary-100 text-primary-700 font-black"
                      : "text-gray-900 hover:text-primary-700 hover:bg-primary-50"
                  }`}
                >
                  <Settings className="w-4.5 h-4.5 text-primary-600" />
                  <span>Store Settings</span>
                </Link>
              </div>
            )}
          </div>
        </div>

      </aside>
    </>
  );
}