"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner"; 
import { Loader2, Search, RotateCw, Ban } from "lucide-react";
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
  const { data: session, status } = useSession();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingTarget, setPendingTarget] = useState(null);

  const { register, handleSubmit: handleFormSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(adminInviteSchema),
    mode: "onBlur",
    defaultValues: {
      email: "",
      role: "staff",
      message: ""
    }
  });

  const { 
    data: teamData, 
    isLoading: teamLoading, 
    isRefetching: isRefreshing, 
    refetch: refetchTeam 
  } = useQuery({
    queryKey: ["teamMembers"],
    queryFn: async () => {
      const response = await axios.get("/api/admin/team");
      return response.data?.data || [];
    },
    enabled: status === "authenticated",
    refetchOnMount: true
  });

  const team = teamData || [];

  const handleRefresh = async () => {
    try {
      await refetchTeam();
      toast.success("Team data refreshed successfully!");
    } catch {
      toast.error("Something went wrong while fetching team.");
    }
  };

  const toggleBlockMutation = useMutation({
    mutationFn: async (id) => {
      const response = await axios.patch(`/api/admin/toggle-block?id=${id}`);
      return response.data;
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["teamMembers"] });
      const previousTeam = queryClient.getQueryData(["teamMembers"]);

      queryClient.setQueryData(["teamMembers"], (old) => {
        if (!old) return old;
        const currentData = Array.isArray(old) ? old : (old.data || []);
        
        const toggled = currentData.map((m) => {
          if (m._id === id) {
            return { ...m, isBlocked: !m.isBlocked };
          }
          return m;
        });

        if (Array.isArray(old)) return toggled;
        return { ...old, data: toggled };
      });

      return { previousTeam };
    },
    onError: (err, id, context) => {
      if (context?.previousTeam) {
        queryClient.setQueryData(["teamMembers"], context.previousTeam);
      }
      toast.error(err.response?.data?.message || "Action failed.");
    },
    onSuccess: (data) => {
      toast.success(data.message);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["teamMembers"] });
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
      <div className="flex h-screen items-center justify-center bg-zinc-950 text-white">
        <h1 className="text-xl font-bold text-red-500">403 - Access Denied. Only Superadmin can access this page.</h1>
      </div>
    );
  }

  if (teamLoading) {
    return (
      <div className="fixed inset-0 bg-zinc-950 z-50 flex items-center justify-center">
        <LoadingSpinner size={240} label="Loading team catalog..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 p-8 text-white font-sans">
      
      <div className="flex justify-between items-center border-b border-zinc-800 pb-5">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white">Team Members</h1>
          <p className="mt-1 text-xs text-zinc-400">
            Manage admin staff accounts, system roles, and operational access ({String(team.length).padStart(2, '0')} total members).
          </p>
        </div>

        <div className="text-right flex flex-col items-end gap-2">
          <span className="text-sm font-medium text-zinc-400">Super Admin : <span className="text-white font-semibold">{session?.user?.name || "Admin"}</span></span>
          {session?.user?.role === "superadmin" && (
            <Button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl px-4" onClick={() => setIsOpen(true)}>
              + Invite new Member
            </Button>
          )}
        </div>
      </div>

      <div className="mt-6 flex justify-center items-center gap-3 w-full max-w-xl mx-auto">
        <div className="flex-1 flex items-center bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 transition-all gap-2 h-11 focus-within:border-zinc-700 focus-within:ring-1 focus-within:ring-zinc-700">
          <Search className="h-4 w-4 text-zinc-500 shrink-0" />
          <Input 
            type="text" placeholder="Search..." value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent border-none text-zinc-200 placeholder-zinc-500 focus-visible:ring-0 focus-visible:ring-offset-0 focus:outline-none focus:ring-0 text-xs h-full p-0 shadow-none"
          />
          <VoiceSearchButton 
            onResult={(text) => setSearchQuery(text)} 
            className="shrink-0 h-8 w-8"
          />
        </div>
        
        <button 
          onClick={handleRefresh}
          disabled={isRefreshing || teamLoading}
          className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all active:scale-95 disabled:opacity-40 shrink-0"
          title="Refresh Team Data"
        >
          <RotateCw className={`h-4 w-4 ${isRefreshing ? "animate-spin text-blue-400" : ""}`} />
        </button>
      </div>

      {/* 👥 TEAM DIRECTORY VISUAL CARDS WORKSPACE */}
      {teamLoading ? (
        <div className="flex h-48 items-center justify-center bg-zinc-900/40 border border-zinc-800 rounded-2xl mt-6">
          <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
        </div>
      ) : filteredTeam.length === 0 ? (
        <div className="mt-6 flex flex-col items-center justify-center text-center p-12 border border-dashed border-zinc-800 bg-[#0c0c0e]/30 rounded-2xl space-y-3 min-h-[250px]">
          <p className="font-semibold text-zinc-400">No workers found matching your search.</p>
          {session?.user?.role === "superadmin" && (
            <Button
              onClick={() => setIsOpen(true)}
              className="bg-white text-black font-semibold hover:bg-zinc-200 rounded-xl px-4 h-9 text-xs cursor-pointer shadow-md"
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
              className={`bg-zinc-900/30 border border-zinc-800 hover:border-zinc-700 rounded-2xl p-5 flex flex-col justify-between transition-all duration-300 relative group ${
                member.isBlocked ? "opacity-60 bg-rose-950/5 border-rose-900/20" : ""
              }`}
            >
              {/* Header: Role & Block Switch */}
              <div className="flex justify-between items-center mb-4">
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border ${
                  member.role === 'superadmin' 
                    ? 'bg-purple-500/10 text-purple-400 border-purple-500/25' 
                    : member.role === 'admin' 
                      ? 'bg-blue-500/10 text-blue-400 border-blue-500/25' 
                      : 'bg-zinc-850 text-zinc-400 border-zinc-700'
                }`}>
                  {member.role}
                </span>

                <div>
                  {member.role === "superadmin" ? (
                    <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest select-none">Master</span>
                  ) : (toggleBlockMutation.isPending && toggleBlockMutation.variables === member._id) ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-500" />
                  ) : (
                    <div className="flex items-center gap-2">
                      <Switch 
                        checked={!member.isBlocked}
                        onCheckedChange={() => handleToggleClick(member._id, member.name, member.isBlocked)}
                        className="data-[state=checked]:bg-emerald-600 data-[state=unchecked]:bg-zinc-700 scale-75"
                      />
                      <span className={`text-[9px] font-bold uppercase ${member.isBlocked ? "text-rose-400" : "text-emerald-400"}`}>
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
                      className="w-11 h-11 rounded-full object-cover border border-zinc-800 bg-white p-0.5" 
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-11 h-11 rounded-full bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-sm font-bold text-blue-400 capitalize">
                      {member.name ? member.name[0] : "W"}
                    </div>
                  )}
                  {/* Status Indicator Dot */}
                  {!member.isBlocked && (
                    <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-zinc-950 ${
                      member.isActive ? "bg-emerald-500 animate-pulse" : "bg-rose-500"
                    }`} />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <h3 className="font-bold text-zinc-100 truncate capitalize text-xs flex items-center">
                    {member.name || "Invite Pending"}
                    {member.isBlocked && (
                      <span className="ml-2 text-[8px] bg-rose-500/20 text-rose-400 border border-rose-500/30 px-1 py-0.2 rounded font-bold uppercase tracking-wider">
                        Suspended
                      </span>
                    )}
                  </h3>
                  <p className="text-[11px] text-zinc-400 font-mono truncate mt-0.5">{member.email}</p>
                </div>
              </div>

              {/* Bottom: Last Login */}
              <div className="mt-4 border-t border-zinc-900 pt-3 flex items-center justify-between text-[10px] text-zinc-500">
                <span className="font-medium">Last Login:</span>
                <span className="font-mono text-zinc-400">{formatLastLogin(member.lastLogin)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent className="bg-zinc-900 border border-zinc-800 text-white rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-zinc-100">
              {pendingTarget?.isBlocked ? "Confirm Account Unblock" : "Confirm Account Suspension"}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              Are you sure you want to {pendingTarget?.isBlocked ? "unblock" : "block"} <span className="text-white font-semibold capitalize">&quot;{pendingTarget?.name}&quot;</span>? 
              {pendingTarget?.isBlocked 
                ? " This will immediately restore their full operational access back to the system dashboard panels." 
                : " This structural block revokes all control dashboard permissions instantly."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-zinc-800 text-zinc-300 border-zinc-700 hover:bg-zinc-700 hover:text-white rounded-xl">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={executeToggleBlock}
              className={`rounded-xl text-white font-bold ${pendingTarget?.isBlocked ? "bg-emerald-600 hover:bg-emerald-700" : "bg-rose-600 hover:bg-rose-700"}`}
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4 mb-4">
              <h2 className="text-xl font-bold text-white">New Member Invitation</h2>
              <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)} className="text-zinc-400 hover:text-white">✕</Button>
            </div>
            <form onSubmit={handleFormSubmit(onSubmit)} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-zinc-400">Email Address</Label>
                <Input id="email" type="email" placeholder="name@example.com" {...register("email")} className="bg-zinc-950 border-zinc-800 text-white rounded-xl" />
                {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
              </div>
              <div className="space-y-2">
                <Label className="text-zinc-400">Select System Role</Label>
                <select {...register("role")} className="flex h-10 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-white cursor-pointer"><option value="admin">Admin</option><option value="staff">Staff</option></select>
                {errors.role && <p className="text-xs text-red-500 mt-1">{errors.role.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="message" className="text-zinc-400">Personal Note (Optional)</Label>
                <Textarea id="message" placeholder="Type an optional message..." {...register("message")} className="bg-zinc-950 border-zinc-800 text-white rounded-xl resize-none" />
                {errors.message && <p className="text-xs text-red-500 mt-1">{errors.message.message}</p>}
              </div>
              <Button type="submit" disabled={inviteMutation.isPending} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl h-11">{inviteMutation.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending...</> : "Send Invitation"}</Button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}