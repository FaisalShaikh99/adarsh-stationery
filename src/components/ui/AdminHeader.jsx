"use client";

import React from "react";
import { usePathname, useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { 
  Search, 
  Menu, 
  Plus, 
  ChevronRight, 
  User, 
  Settings, 
  LogOut, 
  Package,
  FolderTree,
  Tag,
  UserPlus,
  Bell,
  CheckCheck,
  ShoppingBag,
  AlertTriangle,
  UserCheck,
  RefreshCw,
  Clock
} from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";

const getNotifMeta = (type) => {
  switch (type) {
    case "new_order":
      return { icon: ShoppingBag, color: "text-blue-600", bg: "bg-blue-50 border-blue-200" };
    case "low_stock":
      return { icon: AlertTriangle, color: "text-rose-600", bg: "bg-rose-50 border-rose-200" };
    case "new_customer":
      return { icon: UserCheck, color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-200" };
    case "order_status_change":
      return { icon: RefreshCw, color: "text-purple-600", bg: "bg-purple-50 border-purple-200" };
    default:
      return { icon: Bell, color: "text-primary-600", bg: "bg-primary-50 border-primary-200" };
  }
};

const getRelativeTime = (dateString) => {
  if (!dateString) return "";
  const now = new Date();
  const past = new Date(dateString);
  const diffMs = now - past;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffSec < 60) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay === 1) return "Yesterday";
  return past.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
};

export default function AdminHeader({ onToggleMobileDrawer }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  const setCommandPaletteOpen = (open) => {
    window.dispatchEvent(
      new KeyboardEvent("keydown", { key: "k", ctrlKey: true, bubbles: true })
    );
  };

  const { data: unreadCount = 0 } = useQuery({
    queryKey: ["notifications-unread-count"],
    queryFn: async () => {
      const res = await axios.get("/api/admin/notifications/unread-count");
      return res.data?.data?.count || 0;
    },
    refetchInterval: 30 * 1000,
    staleTime: 10 * 1000,
  });

  const { data: notifications = [], refetch: refetchNotifications } = useQuery({
    queryKey: ["notifications-feed"],
    queryFn: async () => {
      const res = await axios.get("/api/admin/notifications?limit=15");
      return res.data?.data?.notifications || [];
    },
    staleTime: 15 * 1000,
  });

  const markAsReadMutation = useMutation({
    mutationFn: (id) => axios.patch(`/api/admin/notifications/${id}/read`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications-unread-count"] });
      queryClient.invalidateQueries({ queryKey: ["notifications-feed"] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => axios.patch("/api/admin/notifications/read-all"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications-unread-count"] });
      queryClient.invalidateQueries({ queryKey: ["notifications-feed"] });
    },
  });

  const handleNotifClick = (notif) => {
    if (!notif.isRead) {
      markAsReadMutation.mutate(notif._id);
    }
    if (notif.link) {
      router.push(notif.link);
    }
  };

  const getBreadcrumbs = () => {
    if (!pathname || pathname === "/admin") {
      return [{ label: "Dashboard", href: "/admin/dashboard", isLast: true }];
    }

    const segments = pathname.split("/").filter(Boolean);
    const breadcrumbMap = {
      admin: "Admin",
      dashboard: "Dashboard",
      products: "Products Catalog",
      categories: "Categories Matrix",
      brands: "Brands Taxonomy",
      orders: "Orders Feed",
      customers: "Customer Directory",
      payments: "Payments & Revenue",
      inventory: "Inventory Monitor",
      "team-members": "Team Members",
      profile: "My Profile",
      settings: "Store Settings",
      "sign-in": "Sign In",
    };

    let accumPath = "";
    return segments.map((seg, index) => {
      accumPath += `/${seg}`;
      const label = breadcrumbMap[seg] || (seg.length > 10 ? `${seg.slice(0, 8)}...` : seg);
      return { label, href: accumPath, isLast: index === segments.length - 1 };
    });
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <header className="sticky top-3 z-30 mx-3 sm:mx-6 my-2 bg-white/85 backdrop-blur-2xl border border-border-subtle rounded-[26px] px-4 md:px-6 py-2.5 transition-all duration-300 shadow-md">
      <div className="flex items-center justify-between gap-4">
        
        {/* Left Side: Mobile Drawer Trigger + Breadcrumbs */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleMobileDrawer}
            className="lg:hidden p-2 rounded-full text-zinc-700 hover:text-gray-900 hover:bg-primary-50 border border-border-subtle transition-colors cursor-pointer"
            aria-label="Toggle Navigation Drawer"
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Breadcrumb Trail */}
          <nav className="flex items-center gap-2 text-sm text-zinc-600 font-bold bg-white/90 border border-border-subtle px-4 py-1.5 rounded-full shadow-2xs">
            {breadcrumbs.map((crumb, idx) => (
              <React.Fragment key={crumb.href}>
                {idx > 0 && <ChevronRight className="h-4 w-4 text-zinc-400 shrink-0" />}
                <span className={crumb.isLast ? "text-gray-900 font-black text-xs sm:text-sm" : "hover:text-gray-900 transition-colors text-xs"}>
                  {crumb.label}
                </span>
              </React.Fragment>
            ))}
          </nav>
        </div>

        {/* Right Side: Pill-Styled Interactive Controls */}
        <div className="flex items-center gap-3">
          
          {/* Search Pill */}
          <button 
            onClick={() => setCommandPaletteOpen(true)}
            className="hidden md:flex items-center gap-2.5 px-4 h-10 rounded-full bg-white border border-border-subtle text-zinc-600 text-xs sm:text-sm font-semibold hover:border-primary-400 transition-all cursor-pointer shadow-2xs btn-modern"
            title="Press Ctrl+K to search"
          >
            <Search className="h-4 w-4 text-primary-600 shrink-0" />
            <span className="text-zinc-600 font-medium">Search store...</span>
            <kbd className="ml-2 px-2 py-0.5 text-xs font-black text-primary-700 bg-primary-50 border border-primary-200 rounded-full">⌘K</kbd>
          </button>
          
          <button 
            onClick={() => setCommandPaletteOpen(true)}
            className="md:hidden w-10 h-10 rounded-full bg-white border border-border-subtle flex items-center justify-center text-zinc-700 hover:text-gray-900 hover:bg-primary-50 transition-all cursor-pointer shadow-2xs"
            title="Search store"
            aria-label="Search store"
          >
            <Search className="h-4.5 w-4.5 text-primary-600" />
          </button>

          {/* "+ Quick Add" Pill */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button 
                className="bg-primary-600 hover:bg-primary-700 text-white text-xs sm:text-sm font-black px-4.5 h-10 rounded-full flex items-center gap-2 cursor-pointer shadow-sm btn-modern outline-none"
                title="Quick Add Actions"
              >
                <Plus className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                <span className="hidden sm:inline">Quick Add</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 p-2 bg-white/95 backdrop-blur-2xl border border-border-subtle text-gray-900 rounded-2xl shadow-xl space-y-1">
              <div className="px-2 py-1 text-xs font-black uppercase tracking-wider text-primary-700">Create New</div>
              <DropdownMenuItem 
                onClick={() => router.push("/admin/products?action=new")} 
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-gray-900 hover:text-primary-700 hover:bg-primary-50 cursor-pointer"
              >
                <Package className="w-4.5 h-4.5 text-emerald-600" />
                <span>New Product</span>
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => router.push("/admin/categories?action=new")} 
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-gray-900 hover:text-primary-700 hover:bg-primary-50 cursor-pointer"
              >
                <FolderTree className="w-4.5 h-4.5 text-purple-600" />
                <span>New Category</span>
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => router.push("/admin/brands?action=new")} 
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-gray-900 hover:text-primary-700 hover:bg-primary-50 cursor-pointer"
              >
                <Tag className="w-4.5 h-4.5 text-amber-600" />
                <span>New Brand</span>
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => router.push("/admin/team-members?action=new")} 
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-gray-900 hover:text-primary-700 hover:bg-primary-50 cursor-pointer"
              >
                <UserPlus className="w-4.5 h-4.5 text-blue-600" />
                <span>Invite Team Member</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Notification Bell Pill */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button 
                onClick={() => refetchNotifications()}
                className="relative w-10 h-10 rounded-full bg-white border border-border-subtle flex items-center justify-center text-zinc-700 hover:text-gray-900 hover:bg-primary-50 transition-all cursor-pointer shadow-2xs outline-none" 
                title="Notifications"
              >
                <Bell className="h-4.5 w-4.5 text-primary-600" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-600 text-white font-mono text-[10px] font-black flex items-center justify-center ring-2 ring-white animate-pulse">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent 
              align="end" 
              className="w-80 sm:w-96 max-h-[85vh] p-0 bg-white/95 backdrop-blur-2xl border border-border-subtle text-gray-900 rounded-2xl shadow-2xl overflow-hidden font-sans flex flex-col"
            >
              <div className="p-4 px-4 border-b border-border-subtle bg-primary-50/70 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-black text-gray-900 tracking-tight">Notifications</h3>
                  {unreadCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-rose-500/10 text-rose-600 border border-rose-500/20">
                      {unreadCount} new
                    </span>
                  )}
                </div>

                {unreadCount > 0 && (
                  <button
                    onClick={() => markAllReadMutation.mutate()}
                    className="text-xs font-bold text-primary-600 hover:text-primary-700 flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <CheckCheck className="w-4 h-4" /> Mark all read
                  </button>
                )}
              </div>

              <div className="flex-1 overflow-y-auto divide-y divide-border-subtle custom-scrollbar max-h-[380px]">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-zinc-500 text-xs space-y-1">
                    <Bell className="w-7 h-7 text-zinc-400 mx-auto opacity-50" />
                    <p className="font-extrabold text-gray-900 text-sm">No notifications yet</p>
                    <p className="text-xs text-zinc-500">New orders and low stock alerts will appear here.</p>
                  </div>
                ) : (
                  notifications.map((notif) => {
                    const meta = getNotifMeta(notif.type);
                    const NotifIcon = meta.icon;

                    return (
                      <div
                        key={notif._id}
                        onClick={() => handleNotifClick(notif)}
                        className={`p-4 flex items-start gap-3 transition-colors cursor-pointer group ${
                          !notif.isRead 
                            ? "bg-primary-50/60 font-semibold" 
                            : "hover:bg-primary-50/30"
                        }`}
                      >
                        <div className={`p-2 rounded-xl border shrink-0 mt-0.5 ${meta.bg} ${meta.color}`}>
                          <NotifIcon className="w-4 h-4" />
                        </div>

                        <div className="flex-1 min-w-0 space-y-0.5">
                          <div className="flex items-center justify-between gap-2">
                            <h4 className={`text-xs truncate ${!notif.isRead ? "font-black text-gray-900" : "font-semibold text-zinc-700"}`}>
                              {notif.title}
                            </h4>
                            <span className="text-[10px] text-zinc-500 font-mono shrink-0 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {getRelativeTime(notif.createdAt)}
                            </span>
                          </div>
                          <p className="text-xs text-zinc-600 leading-snug line-clamp-2">
                            {notif.message}
                          </p>
                        </div>

                        {!notif.isRead && (
                          <span className="w-2.5 h-2.5 rounded-full bg-primary-600 shrink-0 mt-1.5" />
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User Profile Pill */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2.5 px-2.5 h-10 rounded-full bg-white border border-border-subtle hover:bg-primary-50 transition-all outline-none cursor-pointer group text-left shadow-2xs">
                <div className="relative shrink-0">
                  {session?.user?.image ? (
                    <img 
                      src={session.user.image} 
                      alt="Profile" 
                      className="w-7 h-7 rounded-full border border-border-subtle object-cover shadow-2xs"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-primary-600 flex items-center justify-center text-[10px] font-black text-white shadow-2xs">
                      {session?.user?.name ? session.user.name[0].toUpperCase() : "A"}
                    </div>
                  )}
                  <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-white" />
                </div>

                <div className="hidden sm:flex flex-col text-left">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-black text-gray-900 truncate max-w-[130px]">
                      {session?.user?.name || "Admin User"}
                    </span>
                    <span className={`px-2 py-0.5 text-[9px] font-black uppercase tracking-wider rounded-full border ${
                      session?.user?.role === "superadmin"
                        ? "bg-amber-500/10 text-amber-700 border-amber-500/25"
                        : "bg-primary-50 text-primary-700 border-primary-200"
                    }`}>
                      {session?.user?.role || "Staff"}
                    </span>
                  </div>
                </div>
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-64 p-2 bg-white/95 backdrop-blur-2xl border border-border-subtle text-gray-900 rounded-2xl shadow-xl space-y-1">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-primary-50/70 border border-primary-100">
                {session?.user?.image ? (
                  <img 
                    src={session.user.image} 
                    alt="Profile" 
                    className="w-11 h-11 rounded-full border border-border-subtle object-cover shrink-0"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-11 h-11 rounded-full bg-primary-600 flex items-center justify-center text-base font-black text-white shrink-0">
                    {session?.user?.name ? session.user.name[0].toUpperCase() : "A"}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-sm font-black text-gray-900 truncate">{session?.user?.name || "Admin User"}</p>
                  <p className="text-xs text-zinc-600 font-mono truncate">{session?.user?.email || "admin@adarsh.com"}</p>
                </div>
              </div>

              <div className="h-[1px] bg-border-subtle my-1" />

              <DropdownMenuItem 
                onClick={() => router.push("/admin/profile")}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-gray-900 hover:text-primary-700 hover:bg-primary-50 cursor-pointer"
              >
                <User className="w-4.5 h-4.5 text-primary-600" /> My Profile
              </DropdownMenuItem>

              <DropdownMenuItem 
                onClick={() => router.push("/admin/settings")}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-gray-900 hover:text-primary-700 hover:bg-primary-50 cursor-pointer"
              >
                <Settings className="w-4.5 h-4.5 text-primary-600" /> Store Settings
              </DropdownMenuItem>

              <div className="h-[1px] bg-border-subtle my-1" />

              <DropdownMenuItem 
                onClick={() => signOut({ callbackUrl: "/admin/sign-in" })}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-rose-600 hover:bg-rose-50 cursor-pointer"
              >
                <LogOut className="w-4.5 h-4.5 text-rose-600" /> Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

        </div>

      </div>
    </header>
  );
}
