"use client";

import { useState } from "react";
import { usePathname } from "next/navigation"; 
import AdminSidebar from "@/components/ui/AdminSidebar";
import AdminHeader from "@/components/ui/AdminHeader";

export default function AdminLayout({ children }) {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const pathname = usePathname();

  const isLoginPage = pathname === "/admin/sign-in";

  if (isLoginPage) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white">
        <main>{children}</main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col">
      
      {/* Two-Level Admin Sidebar Component */}
      <AdminSidebar 
        isCollapsed={isCollapsed} 
        setIsCollapsed={setIsCollapsed}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
      />

      {/* Main Content & Sticky Header Container */}
      <div 
        className={`flex-1 flex flex-col min-h-screen bg-gradient-to-b from-zinc-950 via-zinc-950 to-zinc-900/60 transition-all duration-300 ease-in-out ${
          isCollapsed 
            ? "lg:pl-[68px]" 
            : "lg:pl-[308px]"
        }`}
      >
        {/* Sticky Header */}
        <AdminHeader 
          onToggleMobileDrawer={() => setIsMobileOpen(!isMobileOpen)}
          isCollapsed={isCollapsed}
          setIsCollapsed={setIsCollapsed}
        />

        {/* Page Content Body */}
        <main className="flex-1 p-4 md:p-6 max-w-[1400px] w-full mx-auto">
          {children}
        </main>
      </div>

    </div>
  );
}