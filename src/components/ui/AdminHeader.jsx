"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTheme } from "next-themes";
import axios from "axios";
import { toast } from "sonner";
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
  Settings,
  ShoppingBag,
  AlertTriangle,
  UserPlus,
  RefreshCw,
  CheckCheck,
  BellOff,
  Package,
  Plus,
  FolderTree,
  Tag
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import EditProfileModal from "@/components/admin/EditProfileModal";
import { useQuickAddStore } from "@/store/useQuickAddStore";

function formatTimeAgo(dateString) {
  if (!dateString) return "";
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);

  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
}

function getNotificationIcon(type) {
  switch (type) {
    case "new_order":
      return (
        <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 flex items-center justify-center shrink-0">
          <ShoppingBag className="w-4 h-4" />
        </div>
      );
    case "low_stock":
      return (
        <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-400 flex items-center justify-center shrink-0">
          <AlertTriangle className="w-4 h-4" />
        </div>
      );
    case "new_customer":
      return (
        <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/25 text-purple-400 flex items-center justify-center shrink-0">
          <UserPlus className="w-4 h-4" />
        </div>
      );
    case "order_status_change":
      return (
        <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/25 text-blue-400 flex items-center justify-center shrink-0">
          <RefreshCw className="w-4 h-4" />
        </div>
      );
    default:
      return (
        <div className="w-8 h-8 rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-400 flex items-center justify-center shrink-0">
          <Bell className="w-4 h-4" />
        </div>
      );
  }
}

export default function AdminHeader({ onToggleMobileDrawer, isCollapsed, setIsCollapsed }) {
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const { setCommandPaletteOpen } = useQuickAddStore();
  const { theme, setTheme, resolvedTheme } = useTheme();

  const [mounted, setMounted] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // 1. Fetch unread count badge (polling every 30s)
  const { data: unreadData } = useQuery({
    queryKey: ["adminUnreadCount"],
    queryFn: async () => (await axios.get("/api/admin/notifications/unread-count")).data.data,
    refetchInterval: 30 * 1000,
    staleTime: 10 * 1000,
  });

  const unreadCount = unreadData?.unreadCount || 0;

  // 2. Fetch recent notifications (top 15)
  const { data: notificationsData, isLoading: isNotificationsLoading } = useQuery({
    queryKey: ["adminNotificationsList"],
    queryFn: async () => (await axios.get("/api/admin/notifications", { params: { limit: 15 } })).data.data,
    refetchInterval: 30 * 1000,
    staleTime: 10 * 1000,
  });

  const notifications = notificationsData?.notifications || [];

  // Mutations
  const markReadMutation = useMutation({
    mutationFn: async (id) => {
      return (await axios.patch(`/api/admin/notifications/${id}/read`)).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminUnreadCount"] });
      queryClient.invalidateQueries({ queryKey: ["adminNotificationsList"] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      return (await axios.patch("/api/admin/notifications/mark-all-read")).data;
    },
    onSuccess: () => {
      toast.success("All notifications marked as read");
      queryClient.invalidateQueries({ queryKey: ["adminUnreadCount"] });
      queryClient.invalidateQueries({ queryKey: ["adminNotificationsList"] });
    },
  });

  const handleNotificationClick = async (notif) => {
    if (!notif.isRead) {
      markReadMutation.mutate(notif._id);
    }
    if (notif.link) {
      router.push(notif.link);
    }
  };

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
    <header className="sticky top-0 z-20 w-full bg-bg-surface/90 backdrop-blur-xl border-b border-border-default px-4 md:px-6 py-3 transition-all duration-300">
      <div className="flex items-center justify-between gap-4">
        
        {/* Left Side: Mobile Drawer Trigger + Breadcrumb Trail */}
        <div className="flex items-center gap-3">
          {/* Mobile Sidebar Drawer Toggle Button */}
          <button
            onClick={onToggleMobileDrawer}
            className="lg:hidden p-2 rounded-xl text-text-muted hover:text-text-primary hover:bg-bg-surface-hover border border-border-default transition-colors cursor-pointer"
            aria-label="Toggle Mobile Navigation"
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Dynamic Breadcrumb Navigation */}
          <div className="flex flex-col">
            <nav className="flex items-center gap-1.5 text-xs text-text-muted font-medium">
              {breadcrumbs.map((crumb, idx) => (
                <React.Fragment key={crumb.href}>
                  {idx > 0 && <ChevronRight className="h-3 w-3 text-text-subtle shrink-0" />}
                  <span className={crumb.isLast ? "text-text-primary font-semibold" : "hover:text-text-primary transition-colors"}>
                    {crumb.label}
                  </span>
                </React.Fragment>
              ))}
            </nav>
          </div>
        </div>

        {/* Right Side: Quick Actions, Theme Toggle, User Profile */}
        <div className="flex items-center gap-2.5 sm:gap-4">
          
          {/* Search Bar Trigger -> Opens Command Palette (Ctrl+K) */}
          <button 
            onClick={() => setCommandPaletteOpen(true)}
            className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-bg-surface-hover border border-border-default text-text-muted text-xs hover:border-border-hover transition-colors cursor-pointer"
            title="Press Ctrl+K to search"
          >
            <Search className="h-3.5 w-3.5 text-text-muted" />
            <span className="text-text-muted">Search store...</span>
            <kbd className="ml-2 px-1.5 py-0.5 text-[10px] font-semibold text-text-muted bg-bg-surface border border-border-default rounded">⌘K</kbd>
          </button>

          {/* "+ Quick Add" Dropdown Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button 
                className="bg-accent-gradient hover:opacity-95 text-white text-xs font-semibold px-3 py-1.5 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-md transition-all outline-none"
                title="Quick Add Actions"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Quick Add</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52 p-2 bg-zinc-950 border border-zinc-800/90 text-white rounded-2xl shadow-2xl space-y-1">
              <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-zinc-500">Create New</div>
              <DropdownMenuItem 
                onClick={() => router.push("/admin/products?action=new")} 
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-zinc-200 hover:text-white hover:bg-zinc-900 cursor-pointer"
              >
                <Package className="w-4 h-4 text-emerald-400" />
                <span>New Product</span>
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => router.push("/admin/categories?action=new")} 
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-zinc-200 hover:text-white hover:bg-zinc-900 cursor-pointer"
              >
                <FolderTree className="w-4 h-4 text-purple-400" />
                <span>New Category</span>
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => router.push("/admin/brands?action=new")} 
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-zinc-200 hover:text-white hover:bg-zinc-900 cursor-pointer"
              >
                <Tag className="w-4 h-4 text-amber-400" />
                <span>New Brand</span>
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => router.push("/admin/team-members?action=new")} 
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-zinc-200 hover:text-white hover:bg-zinc-900 cursor-pointer"
              >
                <UserPlus className="w-4 h-4 text-blue-400" />
                <span>Invite Team Member</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Real Notification Bell & Dropdown Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button 
                className="relative p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-900 border border-zinc-800/60 transition-colors cursor-pointer outline-none" 
                title="Notifications"
              >
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white font-mono text-[10px] font-bold flex items-center justify-center ring-2 ring-zinc-950 animate-pulse">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent 
              align="end" 
              className="w-80 sm:w-96 max-h-[85vh] p-0 bg-zinc-950 border border-zinc-800/90 text-white rounded-2xl shadow-2xl overflow-hidden font-sans flex flex-col"
            >
              {/* Dropdown Header */}
              <div className="p-3.5 px-4 border-b border-zinc-800/80 bg-zinc-900/50 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-bold text-white tracking-tight">Notifications</h3>
                  {unreadCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                      {unreadCount} new
                    </span>
                  )}
                </div>

                {unreadCount > 0 && (
                  <button
                    onClick={() => markAllReadMutation.mutate()}
                    disabled={markAllReadMutation.isPending}
                    className="text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <CheckCheck className="w-3.5 h-3.5" /> Mark all read
                  </button>
                )}
              </div>

              {/* Scrollable Notifications Feed */}
              <div className="overflow-y-auto max-h-[380px] divide-y divide-zinc-800/50 custom-scrollbar">
                {isNotificationsLoading ? (
                  <div className="p-8 text-center text-xs text-zinc-500">
                    Loading notifications...
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="p-8 text-center space-y-2">
                    <BellOff className="w-8 h-8 text-zinc-600 mx-auto" />
                    <p className="text-xs font-semibold text-zinc-400">No notifications yet</p>
                    <p className="text-[11px] text-zinc-500">Store alerts and updates will appear here.</p>
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif._id}
                      onClick={() => handleNotificationClick(notif)}
                      className={`p-3 px-4 flex items-start gap-3 transition-colors cursor-pointer ${
                        !notif.isRead 
                          ? "bg-zinc-900/70 hover:bg-zinc-900" 
                          : "hover:bg-zinc-900/40 opacity-80 hover:opacity-100"
                      }`}
                    >
                      {getNotificationIcon(notif.type)}

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className={`text-xs font-bold truncate ${!notif.isRead ? "text-white" : "text-zinc-300"}`}>
                            {notif.title}
                          </p>
                          <span className="text-[10px] text-zinc-500 font-mono shrink-0">
                            {formatTimeAgo(notif.createdAt)}
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-400 mt-0.5 line-clamp-2 leading-relaxed">
                          {notif.message}
                        </p>
                      </div>

                      {!notif.isRead && (
                        <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0 mt-1.5 ring-2 ring-blue-500/20" />
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* Dropdown Footer */}
              {notifications.length > 0 && (
                <div className="p-2.5 bg-zinc-900/30 border-t border-zinc-800/80 text-center shrink-0">
                  <span className="text-[10px] text-zinc-500 font-medium">
                    Showing latest notifications
                  </span>
                </div>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Theme Toggle Button */}
          <button
            onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-900 border border-zinc-800/60 transition-colors cursor-pointer"
            title={`Theme: ${theme || "system"} (Click to switch)`}
          >
            {mounted && resolvedTheme === "dark" ? (
              <Moon className="h-4 w-4 text-blue-400" />
            ) : (
              <Sun className="h-4 w-4 text-amber-400" />
            )}
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
                onClick={() => setTheme(theme === "dark" ? "light" : theme === "light" ? "system" : "dark")}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-zinc-200 hover:text-white hover:bg-zinc-900/80 cursor-pointer"
              >
                {mounted && resolvedTheme === "dark" ? (
                  <>
                    <Moon className="h-4 w-4 text-blue-400 shrink-0" />
                    <span>Theme: {theme === "system" ? "System (Dark)" : "Dark"}</span>
                  </>
                ) : (
                  <>
                    <Sun className="h-4 w-4 text-amber-400 shrink-0" />
                    <span>Theme: {theme === "system" ? "System (Light)" : "Light"}</span>
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
