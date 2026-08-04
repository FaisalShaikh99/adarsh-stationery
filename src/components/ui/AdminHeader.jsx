"use client";

import React from "react";
import { usePathname, useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import Image from "next/image";
import Link from "next/link";
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
  Clock,
  X,
  PanelLeftClose,
  PanelLeftOpen
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

export default function AdminHeader({ 
  onToggleMobileDrawer,
  isSidebarCollapsed,
  onToggleSidebar
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  // Scroll direction state for auto-hiding header
  const [isHeaderVisible, setIsHeaderVisible] = React.useState(true);
  const lastScrollYRef = React.useRef(0);

  React.useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY < 15) {
        setIsHeaderVisible(true);
      } else if (currentScrollY > lastScrollYRef.current + 8) {
        // Scrolling Down -> Hide Header
        setIsHeaderVisible(false);
      } else if (currentScrollY < lastScrollYRef.current - 8) {
        // Scrolling Up -> Show Header
        setIsHeaderVisible(true);
      }
      lastScrollYRef.current = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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

  const dismissNotificationMutation = useMutation({
    mutationFn: (id) => axios.delete(`/api/admin/notifications/${id}`),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["notifications-feed"] });
      const previousNotifications = queryClient.getQueryData(["notifications-feed"]) || [];
      queryClient.setQueryData(["notifications-feed"], (old = []) => 
        old.filter((n) => n._id !== id)
      );
      return { previousNotifications };
    },
    onError: (err, id, context) => {
      if (context?.previousNotifications) {
        queryClient.setQueryData(["notifications-feed"], context.previousNotifications);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications-unread-count"] });
      queryClient.invalidateQueries({ queryKey: ["notifications-feed"] });
    },
  });

  const handleDismissNotif = (e, notifId) => {
    e.stopPropagation();
    dismissNotificationMutation.mutate(notifId);
  };

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
    <header 
      className={`sticky top-2 sm:top-3.5 z-30 w-[98%] sm:w-[96%] max-w-full mx-auto my-1 sm:my-2 bg-white/95 backdrop-blur-2xl border border-border-subtle rounded-2xl sm:rounded-[28px] px-2.5 sm:px-4 md:px-6 py-2 sm:py-2.5 transition-all duration-300 ease-in-out shadow-md ${
        isHeaderVisible ? "translate-y-0 opacity-100" : "-translate-y-28 opacity-0 pointer-events-none"
      }`}
    >
      <div className="flex items-center justify-between gap-2 sm:gap-4">
        
        {/* Left Side: Mobile Drawer Trigger + Breadcrumbs */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">

          {/* MOBILE DRAWER TRIGGER */}
          <button
            onClick={onToggleMobileDrawer}
            className="lg:hidden p-1.5 sm:p-2 rounded-full text-zinc-700 hover:text-gray-900 hover:bg-primary-50 border border-border-subtle transition-colors cursor-pointer shrink-0"
            aria-label="Toggle Navigation Drawer"
          >
            <Menu className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
          </button>

          {/* Breadcrumb Trail (Desktop Only) */}
          <nav className="hidden sm:flex items-center gap-2 text-xs sm:text-sm text-zinc-600 font-bold bg-white/90 border border-border-subtle px-3 sm:px-4 py-1 sm:py-1.5 rounded-full shadow-2xs min-w-0">
            {breadcrumbs.map((crumb, idx) => (
              <React.Fragment key={crumb.href}>
                {idx > 0 && <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-zinc-400 shrink-0" />}
                <span className={crumb.isLast ? "text-gray-900 font-black text-xs sm:text-sm truncate" : "hover:text-gray-900 transition-colors text-xs truncate"}>
                  {crumb.label}
                </span>
              </React.Fragment>
            ))}
          </nav>
        </div>

        {/* Right Side: Pill-Styled Interactive Controls (Only Menu, Search, +, Notifications on Mobile) */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          
          {/* Search Pill */}
          <button 
            onClick={() => setCommandPaletteOpen(true)}
            className="hidden md:flex items-center gap-2.5 px-3.5 sm:px-4 h-9 sm:h-10 rounded-full bg-white border border-border-subtle text-zinc-600 text-xs sm:text-sm font-semibold hover:border-primary-400 transition-all cursor-pointer shadow-2xs btn-modern"
            title="Press Ctrl+K to search"
          >
            <Search className="h-4 w-4 text-primary-600 shrink-0" />
            <span className="text-zinc-600 font-medium">Search store...</span>
            <kbd className="ml-1.5 px-2 py-0.5 text-xs font-black text-primary-700 bg-primary-50 border border-primary-200 rounded-full">⌘K</kbd>
          </button>
          
          <button 
            onClick={() => setCommandPaletteOpen(true)}
            className="md:hidden w-8.5 h-8.5 rounded-full bg-white border border-border-subtle flex items-center justify-center text-zinc-700 hover:text-gray-900 hover:bg-primary-50 transition-all cursor-pointer shadow-2xs"
            title="Search store"
            aria-label="Search store"
          >
            <Search className="h-4 w-4 text-primary-600" />
          </button>

          {/* "+ Quick Add" Pill */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button 
                className="btn-pill-gradient h-8.5 sm:h-10 px-3 sm:px-5 flex items-center gap-1.5 sm:gap-2 cursor-pointer outline-none font-black text-[11px] sm:text-xs"
                title="Quick Add Actions"
              >
                <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                <span className="hidden xs:inline">Quick Add</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52 sm:w-56 p-2 bg-white/95 backdrop-blur-2xl border border-border-subtle text-gray-900 rounded-2xl shadow-xl space-y-1">
              <div className="px-2 py-1 text-xs font-black uppercase tracking-wider text-primary-700">Create New</div>
              <DropdownMenuItem 
                onClick={() => router.push("/admin/products?action=new")} 
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-gray-900 hover:text-primary-700 hover:bg-primary-50 cursor-pointer"
              >
                <Package className="w-4 h-4 text-emerald-600" />
                <span>New Product</span>
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => router.push("/admin/categories?action=new")} 
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-gray-900 hover:text-primary-700 hover:bg-primary-50 cursor-pointer"
              >
                <FolderTree className="w-4 h-4 text-purple-600" />
                <span>New Category</span>
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => router.push("/admin/brands?action=new")} 
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-gray-900 hover:text-primary-700 hover:bg-primary-50 cursor-pointer"
              >
                <Tag className="w-4 h-4 text-amber-600" />
                <span>New Brand</span>
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => router.push("/admin/team-members?action=new")} 
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-gray-900 hover:text-primary-700 hover:bg-primary-50 cursor-pointer"
              >
                <UserPlus className="w-4 h-4 text-blue-600" />
                <span>Invite Team Member</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Notification Bell Pill */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button 
                onClick={() => refetchNotifications()}
                className="relative w-8.5 h-8.5 sm:w-10 sm:h-10 rounded-full bg-white border border-border-subtle flex items-center justify-center text-zinc-700 hover:text-gray-900 hover:bg-primary-50 transition-all cursor-pointer shadow-2xs outline-none shrink-0" 
                title="Notifications"
              >
                <Bell className="h-4 w-4 sm:h-4.5 sm:w-4.5 text-primary-600" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] sm:min-w-[18px] sm:h-[18px] px-1 rounded-full bg-rose-600 text-white font-mono text-[9px] sm:text-[10px] font-black flex items-center justify-center ring-2 ring-white animate-pulse">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent 
              align="end" 
              className="w-72 sm:w-96 max-h-[85vh] p-0 bg-white/95 backdrop-blur-2xl border border-border-subtle text-gray-900 rounded-2xl shadow-2xl overflow-hidden font-sans flex flex-col"
            >
              <div className="p-3 sm:p-4 border-b border-border-subtle bg-primary-50/70 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs sm:text-sm font-black text-gray-900 tracking-tight">Notifications</h3>
                  {unreadCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-bold bg-rose-500/10 text-rose-600 border border-rose-500/20">
                      {unreadCount} new
                    </span>
                  )}
                </div>

                {unreadCount > 0 && (
                  <button
                    onClick={() => markAllReadMutation.mutate()}
                    className="text-[11px] sm:text-xs font-bold text-primary-600 hover:text-primary-700 flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <CheckCheck className="w-3.5 h-3.5" /> Mark all read
                  </button>
                )}
              </div>

              <div className="flex-1 overflow-y-auto divide-y divide-border-subtle custom-scrollbar max-h-[380px]">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-zinc-500 text-xs space-y-1">
                    <Bell className="w-6 h-6 text-zinc-400 mx-auto opacity-50" />
                    <p className="font-extrabold text-gray-900 text-xs sm:text-sm">No notifications yet</p>
                    <p className="text-[11px] text-zinc-500">New orders and low stock alerts will appear here.</p>
                  </div>
                ) : (
                  notifications.map((notif) => {
                    const meta = getNotifMeta(notif.type);
                    const NotifIcon = meta.icon;

                    return (
                      <div
                        key={notif._id}
                        onClick={() => handleNotifClick(notif)}
                        className={`p-3 sm:p-4 flex items-start gap-2.5 transition-colors cursor-pointer group relative ${
                          !notif.isRead 
                            ? "bg-primary-50/60 font-semibold" 
                            : "hover:bg-primary-50/30"
                        }`}
                      >
                        <div className={`p-1.5 sm:p-2 rounded-xl border shrink-0 mt-0.5 ${meta.bg} ${meta.color}`}>
                          <NotifIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </div>

                        <div className="flex-1 min-w-0 space-y-0.5 pr-5">
                          <div className="flex items-center justify-between gap-2">
                            <h4 className={`text-xs truncate ${!notif.isRead ? "font-black text-gray-900" : "font-semibold text-zinc-700"}`}>
                              {notif.title}
                            </h4>
                            <span className="text-[9px] sm:text-[10px] text-zinc-500 font-mono shrink-0 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {getRelativeTime(notif.createdAt)}
                            </span>
                          </div>
                          <p className="text-[11px] sm:text-xs text-zinc-600 leading-snug line-clamp-2">
                            {notif.message}
                          </p>
                        </div>

                        <button
                          onClick={(e) => handleDismissNotif(e, notif._id)}
                          className="p-1 rounded-lg text-zinc-400 hover:text-rose-600 hover:bg-rose-50 transition-colors opacity-80 sm:opacity-0 group-hover:opacity-100 cursor-pointer shrink-0"
                          title="Dismiss notification"
                          aria-label="Dismiss notification"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>

                        {!notif.isRead && (
                          <span className="w-2 h-2 rounded-full bg-primary-600 shrink-0 mt-1.5 self-center" />
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Desktop Only Profile Pill (Hidden on Mobile) */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="hidden sm:flex items-center gap-2 px-1.5 sm:px-2.5 h-8.5 sm:h-10 rounded-full bg-white border border-border-subtle hover:bg-primary-50 transition-all outline-none cursor-pointer group text-left shadow-2xs shrink-0">
                <div className="relative shrink-0">
                  {session?.user?.image ? (
                    <img 
                      src={session.user.image} 
                      alt="Profile" 
                      className="w-6 h-6 sm:w-7 sm:h-7 rounded-full border border-border-subtle object-cover shadow-2xs"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-primary-600 flex items-center justify-center text-[10px] font-black text-white shadow-2xs">
                      {session?.user?.name ? session.user.name[0].toUpperCase() : "A"}
                    </div>
                  )}
                  <span className="absolute bottom-0 right-0 h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-emerald-500 ring-2 ring-white" />
                </div>

                <div className="flex flex-col text-left">
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

            <DropdownMenuContent align="end" className="w-60 sm:w-64 p-2 bg-white/95 backdrop-blur-2xl border border-border-subtle text-gray-900 rounded-2xl shadow-xl space-y-1">
              <div className="flex items-center gap-2.5 p-2.5 sm:p-3 rounded-xl bg-primary-50/70 border border-primary-100">
                {session?.user?.image ? (
                  <img 
                    src={session.user.image} 
                    alt="Profile" 
                    className="w-9 h-9 sm:w-11 sm:h-11 rounded-full border border-border-subtle object-cover shrink-0"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-primary-600 flex items-center justify-center text-sm sm:text-base font-black text-white shrink-0">
                    {session?.user?.name ? session.user.name[0].toUpperCase() : "A"}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm font-black text-gray-900 truncate">{session?.user?.name || "Admin User"}</p>
                  <p className="text-[11px] text-zinc-600 font-mono truncate">{session?.user?.email || "admin@adarsh.com"}</p>
                </div>
              </div>

              <div className="h-[1px] bg-border-subtle my-1" />

              <DropdownMenuItem 
                onClick={() => router.push("/admin/profile")}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-bold text-gray-900 hover:text-primary-700 hover:bg-primary-50 cursor-pointer"
              >
                <User className="w-4 h-4 text-primary-600" /> My Profile
              </DropdownMenuItem>

              <DropdownMenuItem 
                onClick={() => router.push("/admin/settings")}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-bold text-gray-900 hover:text-primary-700 hover:bg-primary-50 cursor-pointer"
              >
                <Settings className="w-4 h-4 text-primary-600" /> Store Settings
              </DropdownMenuItem>

              <div className="h-[1px] bg-border-subtle my-1" />

              <DropdownMenuItem 
                onClick={() => signOut({ callbackUrl: "/admin/sign-in" })}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-bold text-rose-600 hover:bg-rose-50 cursor-pointer"
              >
                <LogOut className="w-4 h-4 text-rose-600" /> Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

        </div>

      </div>
    </header>
  );
}
