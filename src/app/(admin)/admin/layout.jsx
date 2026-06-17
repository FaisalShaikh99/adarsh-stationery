"use client";

import { useState } from "react";
import { usePathname } from "next/navigation"; // 👈 URL check karne ke liye import kiya
import AdminSidebar from "@/components/ui/AdminSidebar";

export default function AdminLayout({ children }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const pathname = usePathname(); // 👈 Current URL path nikaala

  // 🛡️ Check karo ki kya user login page par hai?
  const isLoginPage = pathname === "/admin/sign-in";

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex overflow-x-hidden">
      
      {/* 🚀 Agar Login page NAHI hai, sirf tabhi sidebar dikhao */}
      {!isLoginPage && (
        <AdminSidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      )}

      {/* 💻 Main Content Layout Spacing */}
      <div 
        className={`flex-1 min-h-screen bg-gradient-to-b from-zinc-950 via-zinc-950 to-zinc-900/60 transition-all duration-300 ease-in-out ${
          isLoginPage 
            ? "pl-0" // 👈 Login page par koi sidebar nahi hai, toh padding ZERO (Full Screen)
            : isCollapsed 
            ? "pl-20" 
            : "pl-64"
        }`}
      >
        <main className={isLoginPage ? "" : "p-8"}>
          {children}
        </main>
      </div>

    </div>
  );
}