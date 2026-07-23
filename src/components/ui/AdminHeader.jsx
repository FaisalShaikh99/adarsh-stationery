"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { 
  Menu, 
  ChevronRight, 
  Search, 
  Bell, 
  Sun, 
  Moon, 
  LogOut,
  User,
  Shield,
  Sparkles,
  Pencil,
  Settings
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import EditProfileModal from "@/components/admin/EditProfileModal";

export default function AdminHeader({ onToggleMobileDrawer, isCollapsed, setIsCollapsed }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [mounted, setMounted] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("/api/admin/auth/logout", { method: "POST" });
    } catch (error) {
      console.error("Logout status update error:", error);
    } finally {
      signOut({ callbackUrl: "/admin/sign-in" });
    }
  };

  // Format breadcrumbs dynamically from pathname
  const getBreadcrumbs = () => {
    if (!pathname) return [{ label: "Admin", href: "/admin/dashboard" }];
    const segments = pathname.split("/").filter(Boolean);
    
    // Map of path key to clean breadcrumb label
    const nameMap = {
      admin: "Admin",
      dashboard: "Dashboard",
      products: "Products",
      categories: "Categories",
      brands: "Brands",
      inventory: "Inventory",
      orders: "Orders",
      customers: "Customers",
      payments: "Payments",
      "team-members": "Team Members",
      settings: "Settings",
      profile: "Profile"
    };

    return segments.map((segment, index) => {
      const href = "/" + segments.slice(0, index + 1).join("/");
      const label = nameMap[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);
      return { label, href, isLast: index === segments.length - 1 };
    });
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <header className="sticky top-0 z-20 w-full bg-zinc-950/85 backdrop-blur-xl border-b border-zinc-800/80 px-4 md:px-6 py-3 transition-all duration-300">
      <div className="flex items-center justify-between gap-4">
        
        {/* Left Side: Mobile Drawer Trigger + Breadcrumb Trail */}
        <div className="flex items-center gap-3">
          {/* Mobile Sidebar Drawer Toggle Button */}
          <button
            onClick={onToggleMobileDrawer}
            className="lg:hidden p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-900 border border-zinc-800/80 transition-colors cursor-pointer"
            aria-label="Toggle Mobile Navigation"
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Dynamic Breadcrumb Navigation */}
          <div className="flex flex-col">
            <nav className="flex items-center gap-1.5 text-xs text-zinc-400 font-medium">
              {breadcrumbs.map((crumb, idx) => (
                <React.Fragment key={crumb.href}>
                  {idx > 0 && <ChevronRight className="h-3 w-3 text-zinc-600 shrink-0" />}
                  <span className={crumb.isLast ? "text-zinc-200 font-semibold" : "hover:text-zinc-300 transition-colors"}>
                    {crumb.label}
                  </span>
                </React.Fragment>
              ))}
            </nav>
          </div>
        </div>

        {/* Right Side: Quick Actions, Theme Toggle, User Profile */}
        <div className="flex items-center gap-2.5 sm:gap-4">
          
          {/* Minimal Search Bar Hint */}
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-900/80 border border-zinc-800 text-zinc-400 text-xs hover:border-zinc-700 transition-colors cursor-default">
            <Search className="h-3.5 w-3.5 text-zinc-500" />
            <span className="text-zinc-400">Search store...</span>
            <kbd className="ml-2 px-1.5 py-0.5 text-[10px] font-semibold text-zinc-500 bg-zinc-800 border border-zinc-700/60 rounded">⌘K</kbd>
          </div>

          {/* Minimal Notification Icon Badge */}
          <div className="relative p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-900 border border-zinc-800/60 transition-colors cursor-pointer" title="Notifications">
            <Bell className="h-4 w-4" />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-blue-500 ring-2 ring-zinc-950 animate-pulse" />
          </div>

          {/* Theme Toggle Button */}
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-900 border border-zinc-800/60 transition-colors cursor-pointer"
            title="Toggle theme mode"
          >
            {isDarkMode ? <Moon className="h-4 w-4 text-blue-400" /> : <Sun className="h-4 w-4 text-amber-400" />}
          </button>

          <div className="h-5 w-[1px] bg-zinc-800 hidden sm:block" />

          {/* User Profile Dropdown Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-3 pl-1 p-1 rounded-2xl hover:bg-zinc-900/80 transition-colors outline-none cursor-pointer group text-left">
                <div className="relative shrink-0">
                  {session?.user?.image ? (
                    <img 
                      src={session.user.image} 
                      alt="Profile" 
                      className="w-9 h-9 rounded-full border border-zinc-700/80 object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-600 via-indigo-600 to-orange-500 flex items-center justify-center text-xs font-bold text-white shadow-md shadow-blue-500/10">
                      {session?.user?.name ? session.user.name[0].toUpperCase() : "A"}
                    </div>
                  )}
                  <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-zinc-950" />
                </div>

                <div className="hidden sm:flex flex-col text-left">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-zinc-100 truncate max-w-[120px]">
                      {session?.user?.name || "Admin User"}
                    </span>
                    <span className={`px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded-md border ${
                      session?.user?.role === "superadmin"
                        ? "bg-orange-500/10 text-orange-400 border-orange-500/20"
                        : session?.user?.role === "admin"
                          ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                          : "bg-zinc-800 text-zinc-400 border-zinc-700"
                    }`}>
                      {session?.user?.role || "Staff"}
                    </span>
                  </div>
                  <span className="text-[11px] text-zinc-400 font-medium truncate max-w-[150px]">
                    {session?.user?.email || "admin@adarsh.com"}
                  </span>
                </div>
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-64 p-2 bg-zinc-950 border border-zinc-800/90 text-white rounded-2xl shadow-2xl space-y-1">
              {/* Profile Card Header */}
              <div className="flex items-center gap-3 p-2 rounded-xl bg-zinc-900/50 border border-zinc-800/60">
                {session?.user?.image ? (
                  <img 
                    src={session.user.image} 
                    alt="Profile" 
                    className="w-10 h-10 rounded-full border border-zinc-700 object-cover shrink-0"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 via-indigo-600 to-orange-500 flex items-center justify-center text-sm font-bold text-white shrink-0">
                    {session?.user?.name ? session.user.name[0].toUpperCase() : "A"}
                  </div>
                )}
                <div className="truncate min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-white truncate">
                      {session?.user?.name || "Admin User"}
                    </span>
                    <span className={`px-1.5 py-0.2 text-[8px] font-bold uppercase tracking-wider rounded border ${
                      session?.user?.role === "superadmin"
                        ? "bg-orange-500/10 text-orange-400 border-orange-500/20"
                        : "bg-blue-500/10 text-blue-400 border-blue-500/20"
                    }`}>
                      {session?.user?.role || "Staff"}
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400 truncate mt-0.5 font-mono">
                    {session?.user?.email || "admin@adarsh.com"}
                  </p>
                </div>
              </div>

              <DropdownMenuSeparator className="bg-zinc-800/80 my-1" />

              <DropdownMenuItem 
                onClick={() => setIsEditProfileOpen(true)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-zinc-200 hover:text-white hover:bg-zinc-900/80 cursor-pointer"
              >
                <Pencil className="h-4 w-4 text-blue-400 shrink-0" />
                <span>Edit Profile</span>
              </DropdownMenuItem>

              <DropdownMenuItem asChild>
                <Link 
                  href="/admin/settings"
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-zinc-200 hover:text-white hover:bg-zinc-900/80 cursor-pointer"
                >
                  <Settings className="h-4 w-4 text-zinc-400 shrink-0" />
                  <span>Store Settings</span>
                </Link>
              </DropdownMenuItem>

              <DropdownMenuItem 
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-zinc-200 hover:text-white hover:bg-zinc-900/80 cursor-pointer"
              >
                {isDarkMode ? (
                  <>
                    <Moon className="h-4 w-4 text-blue-400 shrink-0" />
                    <span>Dark Theme (Active)</span>
                  </>
                ) : (
                  <>
                    <Sun className="h-4 w-4 text-amber-400 shrink-0" />
                    <span>Light Theme</span>
                  </>
                )}
              </DropdownMenuItem>

              <DropdownMenuSeparator className="bg-zinc-800/80 my-1" />

              <DropdownMenuItem 
                onClick={handleLogout}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 cursor-pointer"
              >
                <LogOut className="h-4 w-4 shrink-0" />
                <span>Logout</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

        </div>

      </div>

      {/* Edit Profile Modal */}
      <EditProfileModal 
        isOpen={isEditProfileOpen}
        onClose={() => setIsEditProfileOpen(false)}
      />
    </header>
  );
}
