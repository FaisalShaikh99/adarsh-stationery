"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner"; 
import { Loader2, Search, RotateCw, Ban, Shield } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { adminInviteSchema } from "@/schemas/invite.schema";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import VoiceSearchButton from "@/components/ui/voice-search-button";

const formatLastLogin = (dateString) => {
  if (!dateString) return "Never logged in";
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Never logged in";
    return `${date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} at ${date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}`;
  } catch { return "Never logged in"; }
};

export default function TeamMembersPage() {
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (searchParams.get("action") === "new") {
      setIsOpen(true);
    }
  }, [searchParams]);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingTarget, setPendingTarget] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { register, handleSubmit: handleFormSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(adminInviteSchema),
    defaultValues: { email: "", role: "staff", message: "" }
  });

  const { data: team = [], isLoading: teamLoading, refetch: refetchTeam } = useQuery({
    queryKey: ["teamMembers"],
    queryFn: async () => {
      const response = await axios.get("/api/admin/team-members");
      return response.data?.data || [];
    },
    staleTime: 60 * 1000,
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetchTeam();
    toast.success("Team directory re-synced");
    setIsRefreshing(false);
  };

  const toggleBlockMutation = useMutation({
    mutationFn: async (id) => {
      const response = await axios.patch(`/api/admin/team-members/${id}/toggle-block`);
      return response.data;
    },
    onSuccess: (data) => {
      toast.success(data.message || "Account status updated");
      queryClient.invalidateQueries({ queryKey: ["teamMembers"] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Status update failed");
    }
  });

  const executeToggleBlock = async () => {
    if (!pendingTarget) return;
    const { id } = pendingTarget;
    setConfirmOpen(false);
    toggleBlockMutation.mutate(id, {
      onSettled: () => {
        setPendingTarget(null);
      }
    });
  };

  const inviteMutation = useMutation({
    mutationFn: async (data) => {
      const response = await axios.post("/api/admin/invite", data);
      return response.data;
    },
    onSuccess: (data) => {
      toast.success(data.message || "Invitation sent!");
      setIsOpen(false);
      reset({ email: "", role: "staff", message: "" });
      queryClient.invalidateQueries({ queryKey: ["teamMembers"] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Invitation failed.");
    }
  });

  const onSubmit = (data) => {
    inviteMutation.mutate(data);
  };

  const handleToggleClick = (id, name, isBlocked) => {
    setPendingTarget({ id, name, isBlocked });
    setConfirmOpen(true);
  };

  const filteredTeam = team.filter((member) => 
    member.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (status === "authenticated" && session?.user?.role !== "superadmin") {
    return (
      <div className="flex h-[70vh] items-center justify-center text-gray-900">
        <h1 className="text-xl font-bold text-rose-600">403 - Access Denied. Only Superadmin can access this page.</h1>
      </div>
    );
  }

  if (teamLoading) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <LoadingSpinner size={240} label="Loading team catalog..." />
      </div>
    );
  }

  return (
    <div className="w-full max-w-full min-h-screen text-gray-900 p-2 sm:p-4 space-y-6 font-sans overflow-x-hidden">
      
      {/* 1. UNIQUE HAZED PURPLE GRADIENT TOP CONTAINER UI */}
      <div className="hazed-purple-banner p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-3">
            <Shield className="h-7 w-7 text-accent shrink-0" /> Team Members & Roles
          </h1>
          <p className="mt-1 text-sm text-purple-100 font-semibold max-w-2xl">
            Manage admin staff accounts, system roles, and operational access ({String(team.length).padStart(2, '0')} active members).
          </p>
        </div>

        <div className="text-right flex flex-col md:flex-row items-end md:items-center gap-3 shrink-0">
          {session?.user?.role === "superadmin" && (
            <Button className="bg-white text-primary-800 font-black hover:bg-primary-50 rounded-xl px-4 h-10 text-sm shadow-md cursor-pointer btn-modern" onClick={() => setIsOpen(true)}>
              + Invite New Member
            </Button>
          )}
        </div>
      </div>

      <div className="mt-6 flex justify-center items-center gap-3 w-full max-w-xl mx-auto">
        <div className="flex-1 flex items-center bg-bg-surface border border-border-subtle rounded-xl px-3.5 transition-all gap-2 h-11 focus-within:border-primary-400 focus-within:ring-1 focus-within:ring-primary-400 shadow-xs">
          <Search className="h-4 w-4 text-zinc-400 shrink-0" />
          <Input 
            type="text" placeholder="Search team members by name or email..." value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent border-none text-gray-900 placeholder-zinc-400 focus-visible:ring-0 focus-visible:ring-offset-0 focus:outline-none focus:ring-0 text-xs h-full p-0 shadow-none"
          />
          <VoiceSearchButton 
            onResult={(text) => setSearchQuery(text)} 
            className="shrink-0 h-8 w-8"
          />
        </div>
        
        <button 
          onClick={handleRefresh}
          disabled={isRefreshing || teamLoading}
          className="p-3.5 rounded-xl bg-bg-surface border border-border-subtle text-gray-900 hover:text-primary-600 hover:bg-primary-50 transition-all active:scale-95 disabled:opacity-40 shrink-0 shadow-xs cursor-pointer btn-modern"
          title="Refresh Team Data"
        >
          <RotateCw className={`h-4 w-4 text-primary-600 ${isRefreshing ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* 👥 TEAM DIRECTORY VISUAL CARDS WORKSPACE */}
      {teamLoading ? (
        <div className="flex h-48 items-center justify-center bg-bg-surface border border-border-subtle rounded-2xl mt-6">
          <Loader2 className="h-6 w-6 animate-spin text-primary-600" />
        </div>
      ) : filteredTeam.length === 0 ? (
        <div className="mt-6 flex flex-col items-center justify-center text-center p-12 border border-dashed border-border-subtle bg-bg-surface rounded-2xl space-y-3 min-h-[250px]">
          <p className="font-semibold text-zinc-600 text-sm">No workers found matching your search.</p>
          {session?.user?.role === "superadmin" && (
            <Button
              onClick={() => setIsOpen(true)}
              className="bg-primary-600 text-white font-semibold hover:bg-primary-700 rounded-xl px-4 h-9 text-xs cursor-pointer shadow-xs btn-modern"
            >
              + Invite New Member
            </Button>
          )}
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTeam.map((member) => (
            <div 
              key={member._id}
              className={`bg-bg-surface border border-border-subtle hover:border-primary-300 rounded-2xl p-5 flex flex-col justify-between transition-all duration-300 relative group shadow-xs ${
                member.isBlocked ? "opacity-75 bg-rose-50/40 border-rose-200" : ""
              }`}
            >
              {/* Header: Role & Block Switch */}
              <div className="flex justify-between items-center mb-4">
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                  member.role === 'superadmin' 
                    ? 'bg-purple-500/10 text-purple-700 border-purple-500/25' 
                    : member.role === 'admin' 
                      ? 'bg-primary-50 text-primary-700 border-primary-200' 
                      : 'bg-zinc-100 text-zinc-700 border-zinc-200'
                }`}>
                  {member.role}
                </span>

                <div>
                  {member.role === "superadmin" ? (
                    <span className="text-[10px] text-zinc-500 font-extrabold uppercase tracking-widest select-none">Master</span>
                  ) : (toggleBlockMutation.isPending && toggleBlockMutation.variables === member._id) ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-primary-600" />
                  ) : (
                    <div className="flex items-center gap-2">
                      <Switch 
                        checked={!member.isBlocked}
                        onCheckedChange={() => handleToggleClick(member._id, member.name, member.isBlocked)}
                        className="data-[state=checked]:bg-emerald-600 data-[state=unchecked]:bg-zinc-300 scale-75 cursor-pointer"
                      />
                      <span className={`text-[10px] font-bold uppercase ${member.isBlocked ? "text-rose-600" : "text-emerald-600"}`}>
                        {member.isBlocked ? "Blocked" : "Active"}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Profile Block */}
              <div className="flex items-center gap-4 py-2">
                <div className="relative shrink-0">
                  {member.image ? (
                    <img 
                      src={member.image} 
                      alt={member.name} 
                      className="w-11 h-11 rounded-full object-cover border border-border-subtle bg-white p-0.5 shadow-xs" 
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-11 h-11 rounded-full bg-primary-100 border border-primary-200 flex items-center justify-center text-sm font-extrabold text-primary-700 capitalize">
                      {member.name ? member.name[0] : "W"}
                    </div>
                  )}
                  {/* Status Indicator Dot */}
                  {!member.isBlocked && (
                    <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white ${
                      member.isActive ? "bg-emerald-500 animate-pulse" : "bg-rose-500"
                    }`} />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <h3 className="font-extrabold text-gray-900 truncate capitalize text-xs flex items-center">
                    {member.name || "Invite Pending"}
                    {member.isBlocked && (
                      <span className="ml-2 text-[8px] bg-rose-500/10 text-rose-600 border border-rose-500/20 px-1 py-0.2 rounded font-bold uppercase tracking-wider">
                        Suspended
                      </span>
                    )}
                  </h3>
                  <p className="text-[11px] text-zinc-600 font-mono truncate mt-0.5">{member.email}</p>
                </div>
              </div>

              {/* Bottom: Last Login */}
              <div className="mt-4 border-t border-border-subtle pt-3 flex items-center justify-between text-[10px] text-zinc-500">
                <span className="font-medium">Last Login:</span>
                <span className="font-mono text-gray-900 font-semibold">{formatLastLogin(member.lastLogin)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent className="bg-white/95 backdrop-blur-2xl border border-border-subtle text-gray-900 rounded-2xl shadow-xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-gray-900 font-bold">
              {pendingTarget?.isBlocked ? "Confirm Account Unblock" : "Confirm Account Suspension"}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-600">
              Are you sure you want to {pendingTarget?.isBlocked ? "unblock" : "block"} <span className="text-gray-900 font-extrabold capitalize">&quot;{pendingTarget?.name}&quot;</span>? 
              {pendingTarget?.isBlocked 
                ? " This will immediately restore their full operational access back to the system dashboard panels." 
                : " This structural block revokes all control dashboard permissions instantly."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-bg-surface text-gray-900 border-border-subtle hover:bg-primary-50 rounded-xl cursor-pointer">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={executeToggleBlock}
              className={`rounded-xl text-white font-bold cursor-pointer ${pendingTarget?.isBlocked ? "bg-emerald-600 hover:bg-emerald-700" : "bg-rose-600 hover:bg-rose-700"}`}
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl border border-border-subtle bg-white/95 backdrop-blur-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border-subtle pb-4">
              <h2 className="text-lg font-bold text-gray-900">New Member Invitation</h2>
              <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)} className="text-zinc-500 hover:text-gray-900 rounded-lg cursor-pointer">✕</Button>
            </div>
            <form onSubmit={handleFormSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-zinc-700 text-xs font-semibold">Email Address</Label>
                <Input id="email" type="email" placeholder="name@example.com" {...register("email")} className="bg-white border-border-subtle text-gray-900 rounded-xl text-xs" />
                {errors.email && <p className="text-xs text-rose-500 mt-1">{errors.email.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label className="text-zinc-700 text-xs font-semibold">Select System Role</Label>
                <select {...register("role")} className="flex h-10 w-full rounded-xl border border-border-subtle bg-white px-3 py-2 text-xs text-gray-900 cursor-pointer"><option value="admin">Admin</option><option value="staff">Staff</option></select>
                {errors.role && <p className="text-xs text-rose-500 mt-1">{errors.role.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="message" className="text-zinc-700 text-xs font-semibold">Personal Note (Optional)</Label>
                <Textarea id="message" placeholder="Type an optional message..." {...register("message")} className="bg-white border-border-subtle text-gray-900 rounded-xl resize-none text-xs" />
                {errors.message && <p className="text-xs text-rose-500 mt-1">{errors.message.message}</p>}
              </div>
              <Button type="submit" disabled={inviteMutation.isPending} className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl h-11 btn-modern cursor-pointer">{inviteMutation.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending...</> : "Send Invitation"}</Button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}