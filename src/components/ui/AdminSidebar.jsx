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
  Sparkles,
  FolderTree,
  Tag,
  Shield
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
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    try {
      localStorage.setItem("adarsh_admin_sidebar_collapsed", String(newState));
    } catch (e) {
      console.warn("Could not write sidebar preference to localStorage", e);
    }
  };

  // 2. Multi-level navigation groups taxonomy
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
        { name: "Products Registry", href: "/admin/products", icon: Package },
        { name: "Categories Matrix", href: "/admin/categories", icon: FolderTree },
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
      icon: Settings,
      links: [
        { name: "Team Members", href: "/admin/team-members", icon: Shield, requireSuperAdmin: true },
        { name: "My Profile", href: "/admin/profile", icon: User },
        { name: "Store Settings", href: "/admin/settings", icon: Settings },
      ]
    }
  ];

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
        <div className="w-[68px] min-h-screen bg-bg-surface border-r border-border-default flex flex-col justify-between items-center py-4 px-2 z-50 shrink-0 select-none">
          
          {/* Top Brand Logo Icon */}
          <div className="flex flex-col items-center gap-6">
            <Link 
              href="/admin/dashboard" 
              className="group relative flex items-center justify-center"
              title="Adarsh Stationery Admin"
            >
              <div className="h-10 w-10 rounded-2xl bg-accent-gradient flex items-center justify-center shadow-lg shadow-accent/20 group-hover:scale-105 transition-transform duration-200">
                <PenTool className="h-5 w-5 text-white" />
              </div>
              <span className="absolute left-14 bg-bg-surface text-text-primary text-xs font-semibold px-2.5 py-1.5 rounded-lg shadow-xl border border-border-default opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 whitespace-nowrap z-50">
                Adarsh Stationery
              </span>
            </Link>

            {/* Level 1 Group Icons Rail */}
            <nav className="flex flex-col items-center gap-2">
              {navigationGroups.map((group) => {
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
                        ? "bg-accent/15 text-accent shadow-sm"
                        : "text-text-muted hover:text-text-primary hover:bg-bg-surface-hover"
                    }`}
                    title={group.title}
                  >
                    {/* Active Left Indicator Bar */}
                    {isGroupActive && (
                      <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-accent shadow-[0_0_8px_rgba(99,102,241,0.8)]" />
                    )}

                    <GroupIcon className={`h-5 w-5 transition-transform group-hover:scale-110 ${isGroupActive ? "text-accent" : "text-text-muted group-hover:text-text-primary"}`} />

                    {/* Tooltip on Hover */}
                    <span className="absolute left-16 bg-bg-surface text-text-primary text-xs font-semibold px-2.5 py-1.5 rounded-xl shadow-2xl border border-border-default opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 whitespace-nowrap z-50">
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
              className="p-2.5 rounded-xl text-text-muted hover:text-text-primary hover:bg-bg-surface-hover border border-border-default transition-colors cursor-pointer"
              title="Store Settings"
            >
              <Settings className="h-4 w-4" />
            </Link>

            {/* Toggle Main Sidebar Collapse Button */}
            <button
              onClick={toggleCollapse}
              className="hidden lg:flex p-2.5 rounded-xl text-text-muted hover:text-text-primary hover:bg-bg-surface-hover border border-border-default transition-colors cursor-pointer"
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
          className={`w-[240px] min-h-screen bg-bg-surface/95 backdrop-blur-xl border-r border-border-default flex flex-col justify-between transition-all duration-300 ease-in-out z-40 select-none ${
            isCollapsed 
              ? "w-0 opacity-0 pointer-events-none border-none" 
              : "w-[240px] opacity-100"
          }`}
        >
          {/* Main Sidebar Header & Search */}
          <div className="p-4 border-b border-border-default space-y-3 shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-xs font-bold uppercase tracking-widest text-accent flex items-center gap-1">
                  <Sparkles className="h-3 w-3" /> Workspace
                </span>
                <h2 className="text-base font-extrabold text-text-primary tracking-tight leading-snug">
                  Adarsh Panel
                </h2>
              </div>
              
              {/* Mobile Close Button */}
              <button 
                onClick={() => setIsMobileOpen(false)}
                className="lg:hidden text-text-muted hover:text-text-primary p-1 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* In-Sidebar Navigation Search Filter */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-text-muted" />
              <input
                type="text"
                placeholder="Quick jump..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-bg-surface-hover border border-border-default rounded-xl pl-9 pr-3 py-1.5 text-xs text-text-primary placeholder-text-muted focus:outline-none focus:border-accent transition-colors"
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
                    className="w-full flex items-center justify-between px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-text-muted hover:text-text-primary transition-colors group cursor-pointer rounded-lg hover:bg-bg-surface-hover"
                  >
                    <span className="flex items-center gap-2">
                      <GroupIcon className="h-3.5 w-3.5 text-text-muted group-hover:text-text-primary" />
                      {group.title}
                    </span>
                    <ChevronDown className={`h-3.5 w-3.5 text-text-muted transition-transform duration-200 ${isAccordionOpen ? "rotate-180 text-text-primary" : ""}`} />
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
                                ? "bg-accent/15 text-accent font-semibold border-l-4 border-accent shadow-sm pl-3.5"
                                : "text-text-muted hover:text-text-primary hover:bg-bg-surface-hover hover:translate-x-1"
                            }`}
                          >
                            <Icon className={`h-4 w-4 shrink-0 transition-transform group-hover:scale-110 ${isActive ? "text-accent" : "text-text-muted group-hover:text-text-primary"}`} />
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
          <div className="p-3 border-t border-border-default bg-bg-surface shrink-0">
            <Link 
              href="/admin/settings"
              onClick={() => setIsMobileOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium text-text-muted hover:text-text-primary hover:bg-bg-surface-hover border border-border-default transition-all group"
            >
              <Settings className="h-4 w-4 text-text-muted group-hover:text-text-primary group-hover:rotate-45 transition-transform shrink-0" />
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