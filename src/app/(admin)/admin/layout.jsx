"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation"; 
import AdminSidebar from "@/components/ui/AdminSidebar";
import AdminHeader from "@/components/ui/AdminHeader";
import CommandPaletteModal from "@/components/admin/CommandPaletteModal";

export default function AdminLayout({ children }) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const pathname = usePathname();

  // Restore sidebar collapsed preference from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("admin_sidebar_collapsed");
      if (saved !== null) {
        setIsSidebarCollapsed(saved === "true");
      }
    } catch (e) {
      console.error("LocalStorage read error:", e);
    }
  }, []);

  const toggleSidebar = () => {
    setIsSidebarCollapsed((prev) => {
      const nextState = !prev;
      try {
        localStorage.setItem("admin_sidebar_collapsed", String(nextState));
      } catch (e) {
        console.error("LocalStorage write error:", e);
      }
      return nextState;
    });
  };

  const isLoginPage = pathname === "/admin/sign-in";

  if (isLoginPage) {
    return (
      <div className="min-h-screen text-gray-900">
        <main>{children}</main>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-gray-900 flex flex-col bg-[#FAFBFD]">
      
      {/* 🌟 Slim Circular Icon Rail Sidebar with Toggle Switch */}
      <AdminSidebar 
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
        isSidebarCollapsed={isSidebarCollapsed}
        onToggleSidebar={toggleSidebar}
      />

      {/* Main Content & Floating Header Container (Expands when sidebar is closed) */}
      <div className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ease-in-out ${
        isSidebarCollapsed ? "lg:pl-5 sm:lg:pl-6" : "lg:pl-24"
      }`}>
        {/* Floating Glass Header with Scroll Auto-Hiding & Header Logo */}
        <AdminHeader 
          onToggleMobileDrawer={() => setIsMobileOpen(!isMobileOpen)}
          isSidebarCollapsed={isSidebarCollapsed}
          onToggleSidebar={toggleSidebar}
        />

        {/* Page Content Body Container (Expands to fill 100% available space when sidebar is closed) */}
        <main className="flex-1 p-3 sm:p-5 md:p-6 w-full max-w-full transition-all duration-300">
          {children}
        </main>
      </div>

      {/* Global Command Palette (Ctrl+K) */}
      <CommandPaletteModal />

    </div>
  );
}