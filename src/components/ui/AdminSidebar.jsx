"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { 
  LayoutDashboard, 
  ShoppingBag, 
  LayoutGrid, 
  Package, 
  Truck, 
  Users, 
  CreditCard, 
  Settings, 
  User, 
  PenTool,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Search,
  X,
  Store,
  Layers,
  Sparkles
} from "lucide-react";

export default function AdminSidebar({ 
  isCollapsed, 
  setIsCollapsed,
  isMobileOpen,
  setIsMobileOpen
}) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [searchQuery, setSearchQuery] = useState("");
  const [openGroups, setOpenGroups] = useState({});

  // 1. Persist collapsed state using localStorage
  useEffect(() => {
    try {
      const savedState = localStorage.getItem("adarsh_admin_sidebar_collapsed");
      if (savedState !== null) {
        setIsCollapsed(savedState === "true");
      }
    } catch (e) {
      console.warn("Could not read sidebar preference from localStorage", e);
    }
  }, [setIsCollapsed]);

  const toggleCollapse = () => {
    const nextState = !isCollapsed;
    setIsCollapsed(nextState);
    try {
      localStorage.setItem("adarsh_admin_sidebar_collapsed", String(nextState));
    } catch (e) {
      console.warn("Could not save sidebar preference to localStorage", e);
    }
  };

  // Structured Navigation Groups
  const navigationGroups = [
    {
      id: "dashboard",
      title: "Dashboard",
      icon: LayoutDashboard,
      links: [
        { name: "Overview", href: "/admin/dashboard", icon: LayoutDashboard }
      ]
    },
    {
      id: "catalog",
      title: "Catalog",
      icon: ShoppingBag,
      links: [
        { name: "Products", href: "/admin/products", icon: ShoppingBag },
        { name: "Categories", href: "/admin/categories", icon: LayoutGrid },
        { name: "Brands", href: "/admin/brands", icon: Layers }
      ]
    },
    {
      id: "operations",
      title: "Operations",
      icon: Package,
      links: [
        { name: "Inventory", href: "/admin/inventory", icon: Package },
        { name: "Orders", href: "/admin/orders", icon: Truck },
        { name: "Customers", href: "/admin/customers", icon: Users }
      ]
    },
    {
      id: "finance",
      title: "Finance",
      icon: CreditCard,
      links: [
        { name: "Payments", href: "/admin/payments", icon: CreditCard }
      ]
    },
    {
      id: "team",
      title: "Team",
      icon: Users,
      links: [
        { name: "Team Members", href: "/admin/team-members", icon: Users, requireSuperAdmin: true }
      ]
    },
    
    {
      id: "account",
      title: "Account",
      icon: User,
      links: [
        { name: "Profile", href: "/admin/profile", icon: User }
      ]
    }
  ];

  // Auto-expand group accordion if active path matches any child link
  useEffect(() => {
    const activeMap = {};
    navigationGroups.forEach(group => {
      const hasActive = group.links.some(l => l.href === pathname);
      if (hasActive) {
        activeMap[group.id] = true;
      }
    });
    setOpenGroups(prev => ({ ...activeMap, ...prev }));
  }, [pathname]);

  const toggleGroupAccordion = (groupId) => {
    setOpenGroups(prev => ({
      ...prev,
      [groupId]: !prev[groupId]
    }));
  };

  // Find active group for left rail highlight
  const activeGroupId = navigationGroups.find(g => 
    g.links.some(l => l.href === pathname)
  )?.id || "dashboard";

  // Filter links when user types into main sidebar search
  const filterGroupLinks = (group) => {
    if (!searchQuery.trim()) return group.links;
    return group.links.filter(l => 
      l.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  return (
    <>
      {/* ========================================================================= */}
      {/* MOBILE BACKDROP & DRAWER (< lg viewports) */}
      {/* ========================================================================= */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md lg:hidden animate-in fade-in duration-200"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* ========================================================================= */}
      {/* TWO-LEVEL SIDEBAR CONTAINER */}
      {/* ========================================================================= */}
      <aside 
        className={`fixed top-0 bottom-0 left-0 z-40 flex transition-all duration-300 ease-in-out ${
          isMobileOpen 
            ? "translate-x-0" 
            : "-translate-x-full lg:translate-x-0"
        }`}
      >
        
        {/* ----------------------------------------------------------------------- */}
        {/* LEVEL 1: LEFT RAIL (Fixed 68px Width, Icon Only) */}
        {/* ----------------------------------------------------------------------- */}
        <div className="w-[68px] min-h-screen bg-zinc-950 border-r border-zinc-800/80 flex flex-col justify-between items-center py-4 px-2 z-50 shrink-0 select-none">
          
          {/* Top Brand Logo Icon */}
          <div className="flex flex-col items-center gap-6">
            <Link 
              href="/admin/dashboard" 
              className="group relative flex items-center justify-center"
              title="Adarsh Stationery Admin"
            >
              <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-orange-500 flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform duration-200">
                <PenTool className="h-5 w-5 text-white" />
              </div>
              <span className="absolute left-14 bg-zinc-900 text-white text-xs font-semibold px-2.5 py-1.5 rounded-lg shadow-xl border border-zinc-800 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 whitespace-nowrap z-50">
                Adarsh Stationery
              </span>
            </Link>

            {/* Left Rail Navigation Category Icons */}
            <nav className="flex flex-col items-center gap-2">
              {navigationGroups.map((group) => {
                const visibleLinks = group.links.filter(
                  link => !link.requireSuperAdmin || session?.user?.role === "superadmin"
                );
                if (visibleLinks.length === 0) return null;

                const GroupIcon = group.icon;
                const isGroupActive = activeGroupId === group.id;

                return (
                  <button
                    key={group.id}
                    onClick={() => {
                      if (isCollapsed) setIsCollapsed(false);
                      setOpenGroups(prev => ({ ...prev, [group.id]: true }));
                    }}
                    className={`relative p-3 rounded-xl transition-all duration-200 group cursor-pointer ${
                      isGroupActive
                        ? "bg-blue-600/15 text-blue-400 shadow-sm shadow-blue-500/10"
                        : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/80"
                    }`}
                    title={group.title}
                  >
                    {/* Active Left Indicator Bar */}
                    {isGroupActive && (
                      <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
                    )}

                    <GroupIcon className={`h-5 w-5 transition-transform group-hover:scale-110 ${isGroupActive ? "text-blue-400" : "text-zinc-400 group-hover:text-zinc-200"}`} />

                    {/* Tooltip on Hover */}
                    <span className="absolute left-16 bg-zinc-900 text-zinc-100 text-xs font-semibold px-2.5 py-1.5 rounded-xl shadow-2xl border border-zinc-800 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 whitespace-nowrap z-50">
                      {group.title}
                    </span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Bottom Left Rail Actions: Settings Shortcut & Collapse Button */}
          <div className="flex flex-col items-center gap-3 w-full">
            
            <Link
              href="/admin/settings"
              className="p-2.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-900 border border-zinc-800/80 transition-colors cursor-pointer"
              title="Store Settings"
            >
              <Settings className="h-4 w-4" />
            </Link>

            {/* Toggle Main Sidebar Collapse Button */}
            <button
              onClick={toggleCollapse}
              className="hidden lg:flex p-2.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-900 border border-zinc-800/80 transition-colors cursor-pointer"
              title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            >
              {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </button>

          </div>

        </div>

        {/* ----------------------------------------------------------------------- */}
        {/* LEVEL 2: MAIN SIDEBAR PANEL (240px Width, Collapsible & Scrollable) */}
        {/* ----------------------------------------------------------------------- */}
        <div 
          className={`w-[240px] min-h-screen bg-zinc-950/95 backdrop-blur-xl border-r border-zinc-800/80 flex flex-col justify-between transition-all duration-300 ease-in-out z-40 select-none ${
            isCollapsed 
              ? "w-0 opacity-0 pointer-events-none border-none" 
              : "w-[240px] opacity-100"
          }`}
        >
          {/* Main Sidebar Header & Search */}
          <div className="p-4 border-b border-zinc-800/80 space-y-3 shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-xs font-bold uppercase tracking-widest text-orange-400 flex items-center gap-1">
                  <Sparkles className="h-3 w-3" /> Workspace
                </span>
                <h2 className="text-base font-extrabold text-white tracking-tight leading-snug">
                  Adarsh Panel
                </h2>
              </div>
              
              {/* Mobile Close Button */}
              <button 
                onClick={() => setIsMobileOpen(false)}
                className="lg:hidden text-zinc-400 hover:text-white p-1 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* In-Sidebar Navigation Search Filter */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-500" />
              <input
                type="text"
                placeholder="Quick jump..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-zinc-900/90 border border-zinc-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-blue-500/80 transition-colors"
              />
            </div>
          </div>

          {/* Main Sidebar Scrollable Content */}
          <div className="flex-1 overflow-y-auto px-3 py-4 space-y-4 custom-scrollbar overscroll-contain">
            {navigationGroups.map((group) => {
              const visibleLinks = filterGroupLinks(group).filter(
                link => !link.requireSuperAdmin || session?.user?.role === "superadmin"
              );
              if (visibleLinks.length === 0) return null;

              const isAccordionOpen = searchGroupMatching(group, searchQuery) || !!openGroups[group.id];
              const GroupIcon = group.icon;

              return (
                <div key={group.id} className="space-y-1">
                  
                  {/* Group Header Accordion Trigger */}
                  <button
                    onClick={() => toggleGroupAccordion(group.id)}
                    className="w-full flex items-center justify-between px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-zinc-400 hover:text-zinc-200 transition-colors group cursor-pointer rounded-lg hover:bg-zinc-900/50"
                  >
                    <span className="flex items-center gap-2">
                      <GroupIcon className="h-3.5 w-3.5 text-zinc-400 group-hover:text-zinc-200" />
                      {group.title}
                    </span>
                    <ChevronDown className={`h-3.5 w-3.5 text-zinc-400 transition-transform duration-200 ${isAccordionOpen ? "rotate-180 text-zinc-300" : ""}`} />
                  </button>

                  {/* Accordion Collapsible Links List */}
                  {isAccordionOpen && (
                    <div className="space-y-1 pl-2 animate-in fade-in duration-200">
                      {visibleLinks.map((link) => {
                        const Icon = link.icon;
                        const isActive = pathname === link.href;

                        return (
                          <Link
                            key={link.href}
                            href={link.href}
                            onClick={() => setIsMobileOpen(false)}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all duration-200 group relative ${
                              isActive
                                ? "bg-blue-600/15 text-blue-400 font-semibold border-l-4 border-blue-500 shadow-sm shadow-blue-500/10 pl-3.5"
                                : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900/80 hover:translate-x-1"
                            }`}
                          >
                            <Icon className={`h-4 w-4 shrink-0 transition-transform group-hover:scale-110 ${isActive ? "text-blue-400" : "text-zinc-400 group-hover:text-zinc-200"}`} />
                            <span className="truncate">{link.name}</span>
                          </Link>
                        );
                      })}
                    </div>
                  )}

                </div>
              );
            })}
          </div>

          {/* Main Sidebar Footer: Settings Shortcut */}
          <div className="p-3 border-t border-zinc-900 bg-zinc-950/60 shrink-0">
            <Link 
              href="/admin/settings"
              onClick={() => setIsMobileOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900/80 border border-zinc-800/60 transition-all group"
            >
              <Settings className="h-4 w-4 text-zinc-400 group-hover:text-zinc-200 group-hover:rotate-45 transition-transform shrink-0" />
              <span className="truncate">Store Settings</span>
            </Link>
          </div>

        </div>

      </aside>
    </>
  );
}

// Helper to auto-open group when searching
function searchGroupMatching(group, query) {
  if (!query.trim()) return false;
  return group.links.some(l => l.name.toLowerCase().includes(query.toLowerCase()));
}