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
    <div className="space-y-6 max-w-4xl animate-in fade-in duration-300">
      <div className="border-b border-zinc-800/80 pb-5 flex flex-wrap justify-between items-center gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <User className="h-5 w-5 text-blue-400" /> Admin Profile
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            View and manage your personal account credentials and system privileges.
          </p>
        </div>

        <Button
          onClick={() => setIsEditProfileOpen(true)}
          className="bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl text-xs px-4 h-9 shadow-md flex items-center gap-2 cursor-pointer"
        >
          <Pencil className="h-3.5 w-3.5" /> Edit Profile
        </Button>
      </div>

      <div className="p-6 rounded-3xl bg-zinc-900/30 border border-zinc-800/60 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-800/60 pb-6">
          <div className="flex items-center gap-4">
            {session?.user?.image ? (
              <img 
                src={session.user.image} 
                alt="Profile" 
                className="w-16 h-16 rounded-2xl border border-zinc-700 object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-orange-500 flex items-center justify-center text-xl font-bold text-white shadow-lg shadow-blue-500/20">
                {session?.user?.name ? session.user.name[0].toUpperCase() : "A"}
              </div>
            )}

            <div className="space-y-1">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                {session?.user?.name || "Admin User"}
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              </h2>
              <p className="text-xs text-zinc-400 flex items-center gap-1.5 font-mono">
                <Mail className="h-3.5 w-3.5 text-zinc-500" /> {session?.user?.email || "admin@adarsh.com"}
              </p>
              <span className="inline-block px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-md mt-1">
                Role: {session?.user?.role || "Staff"}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800/60 space-y-1">
            <span className="text-zinc-500 font-medium">Account Access</span>
            <p className="text-zinc-200 font-semibold flex items-center gap-2">
              <Shield className="h-4 w-4 text-orange-400" /> Active System Admin
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800/60 space-y-1">
            <span className="text-zinc-500 font-medium">Authentication Method</span>
            <p className="text-zinc-200 font-semibold flex items-center gap-2">
              <Key className="h-4 w-4 text-blue-400" /> NextAuth Session
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
