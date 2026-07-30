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
import { 
  Loader2, 
  Search, 
  RotateCw, 
  Shield, 
  ChevronDown, 
  Check, 
  Sparkles, 
  Mail, 
  ShieldCheck,
  Plus
} from "lucide-react";
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

const AI_ROLE_SUGGESTIONS = {
  superadmin: "Welcome to the executive team! As Superadmin, you have full administrative control, financial auditing, store settings access, and team permission management.",
  admin: "Welcome to Adarsh Stationery Admin Portal! You have full access to order processing, product management, customer CRM, and category matrix tools.",
  staff: "Welcome to the team! You have operational access to view customer orders, product catalogs, and dispatch statuses.",
  manager: "Welcome aboard! As Store Manager, your primary focus will be daily order fulfillment, inventory stock management, and customer relations.",
  inventory: "Welcome to the warehouse team! As Inventory Specialist, you have direct access to stock level adjustments, low-stock alerts, and brand cataloging."
};

const formatLastLogin = (dateString) => {
  if (!dateString) return "Never logged in";
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Never logged in";
    return `${date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} at ${date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}`;
  } catch { return "Never logged in"; }
};

import { Suspense } from "react";

function TeamMembersContent() {
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Custom Role Dropdown Open State
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);

  useEffect(() => {
    if (searchParams.get("action") === "new") {
      setIsOpen(true);
    }
  }, [searchParams]);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingTarget, setPendingTarget] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Role Change State & Mutation
  const [roleConfirmOpen, setRoleConfirmOpen] = useState(false);
  const [pendingRoleChange, setPendingRoleChange] = useState(null);

  const updateRoleMutation = useMutation({
    mutationFn: async ({ id, newRole }) => {
      const response = await axios.patch(`/api/admin/team/${id}`, { role: newRole });
      return response.data;
    },
    onSuccess: (data) => {
      toast.success(data.message || "Team member role updated successfully!");
      queryClient.invalidateQueries({ queryKey: ["teamMembers"] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Role update failed.");
    }
  });

  const executeRoleChange = () => {
    if (!pendingRoleChange) return;
    const { id, newRole } = pendingRoleChange;
    setRoleConfirmOpen(false);
    updateRoleMutation.mutate({ id, newRole }, {
      onSettled: () => {
        setPendingRoleChange(null);
      }
    });
  };

  const { register, handleSubmit: handleFormSubmit, reset, setValue, watch, formState: { errors } } = useForm({
    resolver: zodResolver(adminInviteSchema),
    defaultValues: { email: "", role: "admin", message: AI_ROLE_SUGGESTIONS.admin }
  });

  const selectedRole = watch("role") || "admin";

  const handleRoleSelect = (roleValue) => {
    setValue("role", roleValue, { shouldValidate: true });
    // Auto-inject AI suggested note for selected role
    const aiNote = AI_ROLE_SUGGESTIONS[roleValue] || AI_ROLE_SUGGESTIONS.admin;
    setValue("message", aiNote);
    setIsRoleDropdownOpen(false);
    toast.success(`Role set to ${roleValue.toUpperCase()}. AI invitation note updated!`);
  };

  const handleAutoInjectAINote = () => {
    const aiNote = AI_ROLE_SUGGESTIONS[selectedRole] || AI_ROLE_SUGGESTIONS.admin;
    setValue("message", aiNote);
    toast.success("✨ AI Invitation Note Generated & Injected!");
  };

  // Fetch real team members & invites from MongoDB via /api/admin/team
  const { data: teamData, isLoading: teamLoading, refetch: refetchTeam } = useQuery({
    queryKey: ["teamMembers"],
    queryFn: async () => {
      const response = await axios.get("/api/admin/team");
      const resPayload = response.data?.data;
      if (Array.isArray(resPayload)) return { teamMembers: resPayload, pendingInvites: [] };
      return {
        teamMembers: resPayload?.teamMembers || [],
        pendingInvites: resPayload?.pendingInvites || []
      };
    },
    staleTime: 30 * 1000,
  });

  const teamMembers = teamData?.teamMembers || [];
  const pendingInvites = teamData?.pendingInvites || [];

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetchTeam();
    toast.success("Database team directory re-synced");
    setIsRefreshing(false);
  };

  const toggleBlockMutation = useMutation({
    mutationFn: async (id) => {
      const response = await axios.patch(`/api/admin/team/${id}/toggle-block`);
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
      toast.success(data.message || "Invitation sent successfully!");
      setIsOpen(false);
      reset({ email: "", role: "admin", message: AI_ROLE_SUGGESTIONS.admin });
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

  const filteredMembers = teamMembers.filter((member) => 
    member.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.role?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (status === "authenticated" && session?.user?.role !== "superadmin") {
    return (
      <div className="flex h-[70vh] items-center justify-center text-gray-900 font-sans">
        <h1 className="text-xl font-black text-rose-600">403 - Access Denied. Only Superadmin can access team settings.</h1>
      </div>
    );
  }

  if (teamLoading) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <LoadingSpinner size={240} label="Loading MongoDB team catalog..." />
      </div>
    );
  }

  return (
    <div className="w-full max-w-full space-y-6 text-gray-900 font-sans pb-12 overflow-x-hidden">
      
      {/* 1. PAGE HEADER */}
      <div className="flex flex-wrap gap-4 justify-between items-center border-b border-border-subtle pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-primary-600 text-white shadow-md ring-4 ring-primary-100">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-gray-900">Team Members & Roles</h1>
              <p className="text-xs sm:text-sm text-zinc-600 font-medium">
                Manage admin staff accounts, system roles, and operational access ({String(teamMembers.length).padStart(2, '0')} active members in database).
              </p>
            </div>
          </div>
        </div>

        <div className="text-right flex flex-col md:flex-row items-end md:items-center gap-3 shrink-0">
          <Button 
            className="bg-primary-600 hover:bg-primary-700 text-white font-black rounded-2xl px-5 h-11 text-xs sm:text-sm shadow-md cursor-pointer btn-modern flex items-center gap-2" 
            onClick={() => {
              setValue("message", AI_ROLE_SUGGESTIONS[selectedRole] || AI_ROLE_SUGGESTIONS.admin);
              setIsOpen(true);
            }}
          >
            <Plus className="w-4 h-4" /> Invite New Member
          </Button>
        </div>
      </div>

      {/* 2. SEARCH & REFRESH BAR */}
      <div className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-xl mx-auto">
        <div className="flex-1 flex items-center w-full bg-white border border-border-subtle rounded-2xl px-4 transition-all gap-2.5 h-11 focus-within:border-primary-400 focus-within:ring-1 focus-within:ring-primary-400 shadow-2xs">
          <Search className="h-4 w-4 text-zinc-400 shrink-0" />
          <Input 
            type="text" 
            placeholder="Search team members by name, email, or role..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent border-none text-gray-900 placeholder-zinc-400 focus-visible:ring-0 focus-visible:ring-offset-0 focus:outline-none focus:ring-0 text-xs font-bold h-full p-0 shadow-none"
          />
          <VoiceSearchButton 
            onResult={(text) => setSearchQuery(text)} 
            className="shrink-0 h-8 w-8 text-primary-600"
          />
        </div>
        
        <button 
          onClick={handleRefresh}
          disabled={isRefreshing || teamLoading}
          className="p-3 rounded-2xl bg-white border border-border-subtle text-gray-900 hover:text-primary-600 hover:bg-primary-50 transition-all active:scale-95 disabled:opacity-40 shrink-0 shadow-2xs cursor-pointer btn-modern flex items-center justify-center h-11 w-11"
          title="Refresh Team Data"
        >
          <RotateCw className={`h-4 w-4 text-primary-600 ${isRefreshing ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* 3. DATABASE TEAM DIRECTORY CARDS */}
      {filteredMembers.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center p-12 border border-dashed border-border-subtle bg-white rounded-2xl space-y-3 min-h-[250px]">
          <p className="font-black text-gray-900 text-sm">No team members found in database matching your search.</p>
          <Button
            onClick={() => setIsOpen(true)}
            className="bg-primary-600 text-white font-black hover:bg-primary-700 rounded-2xl px-5 h-10 text-xs cursor-pointer shadow-md btn-modern"
          >
            + Invite New Member
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMembers.map((member) => (
            <div 
              key={member._id}
              className={`bg-white border border-border-subtle hover:border-primary-400 hover:shadow-xl rounded-[26px] p-6 flex flex-col justify-between transition-all duration-300 relative group cursor-pointer text-gray-900 hover:-translate-y-1 ${
                member.isBlocked ? "opacity-75 bg-rose-50/40 border-rose-200" : ""
              }`}
            >
              {/* Header: Role Dropdown / Badge & Block Switch */}
              <div className="flex justify-between items-center mb-4">
                {(() => {
                  const isSelf = (member.email === session?.user?.email) || (member._id === session?.user?.id);
                  const isSuperAdmin = session?.user?.role === "superadmin";

                  if (isSuperAdmin && !isSelf) {
                    return (
                      <div className="relative">
                        <select
                          value={member.role}
                          disabled={updateRoleMutation.isPending && updateRoleMutation.variables?.id === member._id}
                          onChange={(e) => {
                            const newRole = e.target.value;
                            if (newRole !== member.role) {
                              setPendingRoleChange({
                                id: member._id,
                                name: member.name || member.email,
                                currentRole: member.role,
                                newRole: newRole
                              });
                              setRoleConfirmOpen(true);
                            }
                          }}
                          className={`px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wider border shadow-2xs appearance-none pr-7 cursor-pointer outline-none transition-all ${
                            member.role === 'superadmin' 
                              ? 'bg-purple-50 text-purple-700 border-purple-200 hover:border-purple-400' 
                              : member.role === 'admin' 
                                ? 'bg-primary-50 text-primary-700 border-primary-200 hover:border-primary-400' 
                                : 'bg-zinc-100 text-zinc-700 border-zinc-200 hover:border-zinc-400'
                          }`}
                          style={{
                            backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%2371717a' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 12 15 18 9'></polyline></svg>")`,
                            backgroundRepeat: 'no-repeat',
                            backgroundPosition: 'right 8px center',
                            backgroundSize: '12px'
                          }}
                          title="Change team member role"
                        >
                          <option value="superadmin" className="bg-white text-purple-700 font-bold">SUPERADMIN</option>
                          <option value="admin" className="bg-white text-primary-700 font-bold">ADMIN</option>
                          <option value="staff" className="bg-white text-zinc-800 font-bold">STAFF</option>
                          <option value="manager" className="bg-white text-zinc-800 font-bold">STORE MANAGER</option>
                          <option value="inventory" className="bg-white text-zinc-800 font-bold">INVENTORY SPECIALIST</option>
                        </select>
                      </div>
                    );
                  }

                  return (
                    <span className={`px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wider border shadow-2xs ${
                      member.role === 'superadmin' 
                        ? 'bg-purple-50 text-purple-700 border-purple-200' 
                        : member.role === 'admin' 
                          ? 'bg-primary-50 text-primary-700 border-primary-200' 
                          : 'bg-zinc-100 text-zinc-700 border-zinc-200'
                    }`}>
                      {member.role} {isSelf && "(You)"}
                    </span>
                  );
                })()}

                <div>
                  {member.role === "superadmin" && ((member.email === session?.user?.email) || (member._id === session?.user?.id)) ? (
                    <span className="text-xs text-purple-700 font-black uppercase tracking-wider bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-200 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" /> Master
                    </span>
                  ) : (toggleBlockMutation.isPending && toggleBlockMutation.variables === member._id) ? (
                    <Loader2 className="h-4 w-4 animate-spin text-primary-600" />
                  ) : (
                    <div className="flex items-center gap-2">
                      <Switch 
                        checked={!member.isBlocked}
                        onCheckedChange={() => handleToggleClick(member._id, member.name, member.isBlocked)}
                        className="data-[state=checked]:bg-emerald-600 data-[state=unchecked]:bg-zinc-300 scale-90 cursor-pointer"
                      />
                      <span className={`text-xs font-black uppercase ${member.isBlocked ? "text-rose-600" : "text-emerald-600"}`}>
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
                      className="w-12 h-12 rounded-2xl object-cover border border-border-subtle bg-white p-0.5 shadow-2xs group-hover:scale-105 transition-transform" 
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-2xl bg-primary-100 border border-primary-200 flex items-center justify-center text-base font-black text-primary-700 capitalize shadow-2xs group-hover:scale-105 transition-transform">
                      {member.name ? member.name[0] : "W"}
                    </div>
                  )}
                  {!member.isBlocked && member.isActive && (
                    <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white bg-emerald-500 animate-pulse" />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <h3 className="font-black text-gray-900 truncate capitalize text-sm sm:text-base tracking-tight group-hover:text-primary-700 transition-colors flex items-center">
                    {member.name || "Admin User"}
                    {member.isBlocked && (
                      <span className="ml-2 text-[9px] bg-rose-50 text-rose-600 border border-rose-200 px-1.5 py-0.5 rounded font-black uppercase tracking-wider">
                        Suspended
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-zinc-600 font-mono font-bold truncate mt-0.5">{member.email}</p>
                </div>
              </div>

              {/* Bottom: Last Login */}
              <div className="mt-4 border-t border-border-subtle pt-3.5 flex items-center justify-between text-xs font-mono">
                <span className="text-zinc-500 font-bold font-sans text-[11px]">Last Active:</span>
                <span className="text-gray-900 font-bold text-xs">{formatLastLogin(member.lastLogin)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ROLE CHANGE CONFIRMATION MODAL */}
      <AlertDialog open={roleConfirmOpen} onOpenChange={setRoleConfirmOpen}>
        <AlertDialogContent className="bg-white/95 backdrop-blur-2xl border border-border-subtle text-gray-900 rounded-[28px] shadow-2xl p-6 font-sans">
          <AlertDialogHeader>
            <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-700 border border-purple-200 flex items-center justify-center mb-2">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <AlertDialogTitle className="text-gray-900 font-black text-lg">
              Confirm System Role Change
            </AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-600 text-xs font-medium mt-1">
              Are you sure you want to change the system role for <span className="text-gray-900 font-black capitalize">&quot;{pendingRoleChange?.name}&quot;</span> from <span className="text-purple-700 font-black uppercase">{pendingRoleChange?.currentRole}</span> to <span className="text-primary-700 font-black uppercase">{pendingRoleChange?.newRole}</span>?
              <br /><br />
              This will update their access permissions across the admin panel immediately.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="pt-4">
            <AlertDialogCancel className="bg-white text-gray-900 border-border-subtle hover:bg-primary-50 rounded-2xl cursor-pointer font-bold text-xs h-11 px-5">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={executeRoleChange}
              disabled={updateRoleMutation.isPending}
              className="rounded-2xl text-white font-black text-xs h-11 px-6 cursor-pointer shadow-md bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
            >
              {updateRoleMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirm Role Change"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* CONFIRMATION MODAL */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent className="bg-white/95 backdrop-blur-2xl border border-border-subtle text-gray-900 rounded-[28px] shadow-2xl p-6 font-sans">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-gray-900 font-black text-lg">
              {pendingTarget?.isBlocked ? "Confirm Account Unblock" : "Confirm Account Suspension"}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-600 text-xs font-medium mt-1">
              Are you sure you want to {pendingTarget?.isBlocked ? "unblock" : "block"} <span className="text-gray-900 font-black capitalize">&quot;{pendingTarget?.name}&quot;</span>? 
              {pendingTarget?.isBlocked 
                ? " This will immediately restore their full operational access back to the system dashboard." 
                : " This structural block revokes all control dashboard permissions instantly."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="pt-4">
            <AlertDialogCancel className="bg-white text-gray-900 border-border-subtle hover:bg-primary-50 rounded-2xl cursor-pointer font-bold text-xs h-11 px-5">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={executeToggleBlock}
              className={`rounded-2xl text-white font-black text-xs h-11 px-6 cursor-pointer shadow-md btn-modern ${pendingTarget?.isBlocked ? "bg-emerald-600 hover:bg-emerald-700" : "bg-rose-600 hover:bg-rose-700"}`}
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* NEW MEMBER INVITATION OVERLAY MODAL (CUSTOM ROLE DROPDOWN & AI NOTE INJECTOR) */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-[28px] border border-border-subtle bg-white/95 backdrop-blur-2xl p-6 shadow-2xl space-y-4 font-sans text-gray-900 animate-in zoom-in-95 duration-150">
            
            <div className="flex items-center justify-between border-b border-border-subtle pb-4">
              <div className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-primary-600" />
                <h2 className="text-lg font-black text-gray-900">New Member Invitation</h2>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)} className="text-zinc-400 hover:text-gray-900 text-xl font-mono p-1 rounded-lg cursor-pointer">✕</Button>
            </div>

            <form onSubmit={handleFormSubmit(onSubmit)} className="space-y-4 text-xs">
              
              {/* Email Input */}
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-gray-900 text-xs font-black block">Email Address</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="name@example.com" 
                  {...register("email")} 
                  className="bg-white border-border-subtle text-gray-900 rounded-2xl text-xs h-11 font-bold shadow-2xs" 
                />
                {errors.email && <p className="text-xs text-rose-600 font-bold mt-1">{errors.email.message}</p>}
              </div>

              {/* Custom Floating Popover Role Dropdown Drawer */}
              <div className="space-y-1.5">
                <Label className="text-gray-900 text-xs font-black block">Select System Role</Label>
                <div className="relative w-full">
                  <button
                    type="button"
                    onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
                    className="bg-white border border-border-subtle rounded-2xl h-11 px-4 text-xs font-bold text-gray-900 hover:border-primary-400 transition-all flex items-center justify-between gap-2.5 cursor-pointer w-full shadow-2xs"
                  >
                    <span className="capitalize font-black text-primary-700 bg-primary-50 px-2.5 py-0.5 rounded-lg border border-primary-200">
                      {selectedRole}
                    </span>
                    <ChevronDown className={`w-4 h-4 text-zinc-400 transition-transform duration-200 ${isRoleDropdownOpen ? "rotate-180 text-primary-600" : ""}`} />
                  </button>

                  {isRoleDropdownOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setIsRoleDropdownOpen(false)} />
                      <div className="absolute left-0 right-0 top-12 bg-white/95 backdrop-blur-2xl border border-border-subtle rounded-2xl p-2 shadow-xl z-50 space-y-1 text-gray-900 animate-in fade-in-50 zoom-in-95 duration-150 font-sans">
                        {[
                          { label: "Admin (Full System Access)", value: "admin" },
                          { label: "Staff (Operational Access)", value: "staff" },
                          { label: "Store Manager", value: "manager" },
                          { label: "Inventory Specialist", value: "inventory" }
                        ].map((r) => (
                          <button
                            type="button"
                            key={r.value}
                            onClick={() => handleRoleSelect(r.value)}
                            className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs transition-all cursor-pointer flex items-center justify-between ${
                              selectedRole === r.value ? "bg-primary-50 text-primary-700 font-black" : "text-gray-900 hover:bg-primary-50/60 font-bold"
                            }`}
                          >
                            <span>{r.label}</span>
                            {selectedRole === r.value && <Check className="w-3.5 h-3.5 text-primary-600" />}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* AI Personal Note Textarea with AI Inject Button */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="message" className="text-gray-900 text-xs font-black">Invitation Note</Label>
                  <button
                    type="button"
                    onClick={handleAutoInjectAINote}
                    className="text-[11px] font-black text-primary-700 hover:text-primary-800 bg-primary-50 border border-primary-200 px-2.5 py-1 rounded-xl flex items-center gap-1 cursor-pointer transition-all hover:bg-primary-100 shadow-2xs"
                  >
                    <Sparkles className="w-3 h-3 text-primary-600" />
                    <span>Auto-Suggest AI Note</span>
                  </button>
                </div>
                <Textarea 
                  id="message" 
                  placeholder="Type an optional invitation note..." 
                  {...register("message")} 
                  className="bg-white border-border-subtle text-gray-900 rounded-2xl resize-none text-xs font-medium h-24 shadow-2xs" 
                />
                {errors.message && <p className="text-xs text-rose-600 font-bold mt-1">{errors.message.message}</p>}
              </div>

              <div className="pt-2 flex gap-3">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsOpen(false)} 
                  className="w-1/3 border-border-subtle text-gray-900 hover:bg-primary-50 font-bold rounded-2xl h-11 text-xs cursor-pointer shadow-2xs"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={inviteMutation.isPending} 
                  className="flex-1 bg-primary-600 hover:bg-primary-700 text-white font-black rounded-2xl h-11 text-xs btn-modern cursor-pointer shadow-md"
                >
                  {inviteMutation.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending...</> : "Send Invitation"}
                </Button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}

export default function TeamMembersPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <TeamMembersContent />
    </Suspense>
  );
}