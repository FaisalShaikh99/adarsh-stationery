"use client";

import React, { useState, useRef, useEffect } from "react";
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
  ChevronRight
} from "lucide-react";

export default function AdminSidebar({ 
  isMobileOpen,
  setIsMobileOpen
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
        { name: "My Profile", href: "/admin/profile", icon: User },
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
        className={`fixed top-0 bottom-0 left-0 z-50 w-[300px] max-w-[85vw] bg-white/95 backdrop-blur-2xl border-r border-border-subtle p-5 flex flex-col justify-between overflow-y-auto lg:hidden transition-transform duration-300 ease-in-out shadow-2xl ${
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-border-subtle">
            <Link href="/admin/dashboard" onClick={() => setIsMobileOpen(false)} className="flex items-center gap-3">
              <img src="/logo.png" alt="Adarsh Stationery Mart" className="w-14 h-14 object-contain drop-shadow-md shrink-0" />
              <div className="flex flex-col">
                <span className="font-black text-base text-gray-900 tracking-tight">Adarsh Stationery</span>
                <span className="text-xs text-primary-700 font-extrabold">Mart Control Panel</span>
              </div>
            </Link>
            <button
              onClick={() => setIsMobileOpen(false)}
              className="p-2 rounded-full text-zinc-500 hover:text-gray-900 hover:bg-primary-50 transition-colors"
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
      </div>

      {/* 🌟 DESKTOP SLIM RAIL SIDEBAR (LARGER HD LOGO & CIRCULAR BUTTONS) */}
      <aside className="hidden lg:flex fixed top-0 bottom-0 left-0 z-40 w-20 bg-white/75 backdrop-blur-xl border-r border-border-subtle flex-col justify-between items-center py-5 px-2 select-none shadow-2xs">
        
        {/* Top Section: LARGER & CLEARER HD STORE LOGO */}
        <div className="flex flex-col items-center gap-6 w-full">
          
          {/* Separate Standalone Adarsh Logo Container */}
          <div className="relative flex justify-center w-full pb-4 mb-1 border-b border-border-subtle/80">
            <Link 
              href="/admin/dashboard" 
              className="w-14 h-14 rounded-2xl flex items-center justify-center p-1.5 hover:scale-105 transition-transform duration-200 bg-white border border-border-subtle shadow-xs group"
              title="Adarsh Stationery Mart"
            >
              <img 
                src="/logo.png" 
                alt="Adarsh Stationery Mart" 
                className="w-full h-full object-contain filter drop-shadow-sm group-hover:drop-shadow-md transition-all" 
              />
            </Link>
          </div>

          {/* STACKED ICON NAVIGATION BUTTONS WITH ROUNDED CUT STYLING */}
          <nav className="flex flex-col items-center gap-4 w-full">
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
                  {/* ROUNDED CUT SQUIRCLE ICON BUTTON */}
                  <button
                    onClick={() => handleGroupClick(group.id)}
                    className={`w-12 h-12 rounded-2xl transition-all duration-200 cursor-pointer flex items-center justify-center relative ${
                      isGroupActive
                        ? "bg-primary-600 text-white font-bold shadow-md shadow-primary-600/30 ring-4 ring-primary-100 scale-105"
                        : "bg-white border border-border-subtle text-zinc-700 hover:text-primary-700 hover:bg-primary-50 hover:border-primary-300 hover:scale-105 shadow-2xs"
                    }`}
                    title={group.title}
                    aria-label={group.title}
                  >
                    <GroupIcon className={`h-5.5 w-5.5 transition-transform ${isGroupActive ? "text-white" : "text-zinc-600"}`} />
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
        </div>

        {/* Bottom Section: CIRCULAR SETTINGS BUTTON */}
        <div className="w-full flex justify-center pt-3 border-t border-border-subtle">
          <div 
            className="relative w-full flex justify-center"
            onMouseEnter={() => handleMouseEnter("settings")}
            onMouseLeave={handleMouseLeave}
          >
            <Link
              href="/admin/settings"
              className={`w-12 h-12 rounded-full transition-all duration-200 cursor-pointer flex items-center justify-center ${
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