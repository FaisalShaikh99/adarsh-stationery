"use client";

import React, { useState } from "react";
import { useSession } from "next-auth/react";
import { User, Shield, Key, Mail, CheckCircle2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import EditProfileModal from "@/components/admin/EditProfileModal";

export default function ProfilePage() {
  const { data: session } = useSession();
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);

  return (
    <div className="w-full max-w-full space-y-6 text-gray-900 animate-in fade-in duration-300 overflow-x-hidden">
      {/* 1. UNIQUE HAZED PURPLE GRADIENT TOP CONTAINER UI */}
      <div className="hazed-purple-banner p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-3">
            <User className="h-7 w-7 text-accent shrink-0" /> Admin Profile Credentials
          </h1>
          <p className="mt-1 text-sm text-purple-100 font-semibold max-w-2xl">
            View and manage your personal account credentials, security access, and system privileges.
          </p>
        </div>

        <Button
          onClick={() => setIsEditProfileOpen(true)}
          className="bg-white text-primary-800 font-black hover:bg-primary-50 rounded-xl text-sm px-4 h-10 shadow-md flex items-center gap-2 cursor-pointer btn-modern shrink-0"
        >
          <Pencil className="h-4 w-4 text-primary-600" /> Edit Profile
        </Button>
      </div>

      <div className="p-6 rounded-3xl bg-bg-surface border border-border-subtle space-y-6 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border-subtle pb-6">
          <div className="flex items-center gap-4">
            {session?.user?.image ? (
              <img 
                src={session.user.image} 
                alt="Profile" 
                className="w-16 h-16 rounded-2xl border border-border-subtle object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-primary-600 flex items-center justify-center text-xl font-bold text-white shadow-xs">
                {session?.user?.name ? session.user.name[0].toUpperCase() : "A"}
              </div>
            )}

            <div className="space-y-1">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                {session?.user?.name || "Admin User"}
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              </h2>
              <p className="text-xs text-zinc-500 flex items-center gap-1.5 font-mono">
                <Mail className="h-3.5 w-3.5 text-zinc-400" /> {session?.user?.email || "admin@adarsh.com"}
              </p>
              <span className="inline-block px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-primary-50 text-primary-700 border border-primary-200 rounded-md mt-1">
                Role: {session?.user?.role || "Staff"}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-2xl bg-primary-50/60 border border-primary-100 space-y-1">
            <span className="text-zinc-500 font-medium">Account Access</span>
            <p className="text-gray-900 font-semibold flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary-600" /> Active System Admin
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-primary-50/60 border border-primary-100 space-y-1">
            <span className="text-zinc-500 font-medium">Authentication Method</span>
            <p className="text-gray-900 font-semibold flex items-center gap-2">
              <Key className="h-4 w-4 text-primary-600" /> NextAuth Session
            </p>
          </div>
        </div>
      </div>

      <EditProfileModal 
        isOpen={isEditProfileOpen}
        onClose={() => setIsEditProfileOpen(false)}
      />
    </div>
  );
}
