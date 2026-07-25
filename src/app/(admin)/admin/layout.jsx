"use client";

import { useState } from "react";
import { usePathname } from "next/navigation"; 
import AdminSidebar from "@/components/ui/AdminSidebar";
import AdminHeader from "@/components/ui/AdminHeader";
import CommandPaletteModal from "@/components/admin/CommandPaletteModal";

export default function AdminLayout({ children }) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const pathname = usePathname();

  const isLoginPage = pathname === "/admin/sign-in";

  if (isLoginPage) {
    return (
      <div className="min-h-screen text-gray-900">
        <main>{children}</main>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-gray-900 flex flex-col">
      
      {/* 🌟 Purple & Light Yellow SaaS Admin Sidebar */}
      <AdminSidebar 
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
      />

      {/* Main Content & Header Container (Offset by w-64 on desktop) */}
      <div className="flex-1 flex flex-col min-h-screen transition-all duration-300 ease-in-out lg:pl-64">
        {/* Sticky Glass Header */}
        <AdminHeader 
          onToggleMobileDrawer={() => setIsMobileOpen(!isMobileOpen)}
        />

        {/* Page Content Body Container */}
        <main className="flex-1 p-3 sm:p-5 md:p-6 w-full max-w-full">
          {children}
        </main>
      </div>

      {/* Global Command Palette (Ctrl+K) */}
      <CommandPaletteModal />

    </div>
  );
}