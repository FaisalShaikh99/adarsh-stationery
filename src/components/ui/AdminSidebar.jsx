"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { 
  LayoutDashboard, 
  Users, 
  ShoppingBag, 
  FileText, 
  Settings, 
  LogOut,
  PenTool,
  ChevronLeft,
  ChevronRight,
  Loader2,
  LayoutGrid
} from "lucide-react";
import { useState } from "react";

export default function AdminSidebar({ isCollapsed, setIsCollapsed }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      const response = await fetch("/api/admin/auth/logout", {
        method: "POST",
      });
      if (!response.ok) {
        console.error("Failed to set status to inactive on backend");
      }
    } catch (error) {
      console.error("Logout status update error:", error);
    } finally {
      signOut({ callbackUrl: "/admin/sign-in" });
    }
  };

  const navLinks = [
    { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
    { name: "Team Members", href: "/admin/team-members", icon: Users, requireSuperAdmin: true },
    { name: "Category Management", href: "/admin/categories", icon: LayoutGrid},
    { name: "Products & Stock", href: "/admin/products", icon: ShoppingBag },
    { name: "Brands & Manufactors", href: "/admin/brands", icon: ShoppingBag },
    { name: "Invoices / Orders", href: "/admin/orders", icon: FileText },
    { name: "Store Settings", href: "/admin/settings", icon: Settings },
  ];

  return (
    <aside 
      className={`min-h-screen bg-zinc-950 border-r border-zinc-800 flex flex-col justify-between p-4 fixed left-0 top-0 z-40 transition-all duration-300 ease-in-out ${
        isCollapsed ? "w-20" : "w-64"
      }`}
    >
      <div className="space-y-8 relative">
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-7 top-2 bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white p-1 rounded-full shadow-md z-50 transition-colors duration-200"
        >
          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>

        <div className="flex items-center gap-3 px-2 overflow-hidden">
          <div className="h-9 w-9 shrink-0 rounded-xl bg-gradient-to-br from-blue-500 via-indigo-600 to-orange-500 flex items-center justify-center shadow-lg shadow-blue-500/10">
            <PenTool className="h-5 w-5 text-white" />
          </div>
          
          {!isCollapsed && (
            <div className="transition-all duration-200 animate-in fade-in duration-300">
              <h2 className="text-lg font-bold tracking-tight text-white leading-none">Adarsh</h2>
              <span className="text-[11px] font-semibold text-orange-400 uppercase tracking-widest">Stationery</span>
            </div>
          )}
        </div>

        <nav className="space-y-1.5">
          {navLinks.map((link) => {
            if (link.requireSuperAdmin && session?.user?.role !== "superadmin") {
              return null;
            }

            const Icon = link.icon;
            const isActive = pathname === link.href;

            return (
              <Link
                key={link.href}
                href={link.href}
                title={isCollapsed ? link.name : ""}
                className={`flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-medium transition-all duration-200 group relative ${
                  isActive
                    ? "bg-gradient-to-r from-blue-600/10 via-indigo-600/5 to-transparent text-blue-400 border-l-2 border-blue-500 shadow-[inset_10px_0_15px_-10px_rgba(59,130,246,0.15)]"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50"
                }`}
              >
                <Icon className={`h-4 w-4 shrink-0 transition-transform group-hover:scale-105 ${isActive ? "text-blue-400" : "text-zinc-400 group-hover:text-zinc-300"}`} />
                
                {!isCollapsed && (
                  <span className="truncate transition-all duration-200 animate-in fade-in duration-200">
                    {link.name}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="border-t border-zinc-900 pt-4 space-y-4 overflow-hidden">
        <div className="flex items-center gap-3 px-2 py-1">
          {session?.user?.image ? (
            <img 
              src={session.user.image} 
              alt="Profile" 
              className="w-9 h-9 shrink-0 rounded-full border border-zinc-800"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-9 h-9 shrink-0 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-sm font-bold uppercase text-white">
              {session?.user?.name ? session.user.name[0] : "A"}
            </div>
          )}
          
          {!isCollapsed && (
            <div className="truncate max-w-[140px] animate-in fade-in duration-200">
              <p className="text-sm font-semibold text-zinc-200 truncate">{session?.user?.name || "Admin"}</p>
              <p className="text-[11px] text-zinc-500 uppercase tracking-wider font-medium">{session?.user?.role || "Staff"}</p>
            </div>
          )}
        </div>

        <button
          onClick={handleLogout} 
          disabled={isLoggingOut}
          className="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-medium text-rose-400 hover:bg-rose-500/5 transition-colors group disabled:opacity-50"
        >
          {isLoggingOut ? (
            <Loader2 className="h-4 w-4 shrink-0 animate-spin text-rose-400" />
          ) : (
            <LogOut className="h-4 w-4 shrink-0 text-rose-400 transition-transform group-hover:-translate-x-0.5" />
          )}
          {!isCollapsed && (
            <span className="animate-in fade-in duration-200">
              {isLoggingOut ? "Logging out..." : "Logout Account"}
            </span>
          )}
        </button>
      </div>
    </aside>
  );
}