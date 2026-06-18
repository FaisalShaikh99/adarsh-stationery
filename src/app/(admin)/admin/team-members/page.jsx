"use client";

import { useState, useEffect } from "react";
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
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false); 
  const [teamLoading, setTeamLoading] = useState(true); 
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [team, setTeam] = useState([]); 
  const [searchQuery, setSearchQuery] = useState("");
  const [actionLoadingId, setActionLoadingId] = useState("");

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingTarget, setPendingTarget] = useState(null);

  const [formData, setFormData] = useState({ email: "", role: "staff", message: "" });

  const fetchTeamMembers = async (silent = false) => {
    try {
      if (!silent) setTeamLoading(true);
      else setIsRefreshing(true);

      const response = await fetch("/api/admin/team");
      const result = await response.json();
      if (response.ok) {
        setTeam(result.data || []); 
        if (silent) toast.success("Team data refreshed successfully!");
      } else {
        toast.error(result.message || "Failed to load team data.");
      }
    } catch {
      toast.error("Something went wrong while fetching team.");
    } finally {
      setTeamLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (status === "authenticated") fetchTeamMembers();
  }, [status]);

  const handleToggleClick = (id, name, isBlocked) => {
    setPendingTarget({ id, name, isBlocked });
    setConfirmOpen(true);
  };

  const executeToggleBlock = async () => {
    if (!pendingTarget) return;
    const { id } = pendingTarget;

    try {
      setConfirmOpen(false);
      setActionLoadingId(id);
      const response = await fetch(`/api/admin/team/toggle-block?id=${id}`, {
        method: "PATCH",
      });
      const result = await response.json();

      if (response.ok) {
        toast.success(result.message);
        fetchTeamMembers(false);
      } else {
        toast.error(result.message || "Action failed.");
      }
    } catch {
      toast.error("Server error encountered.");
    } finally {
      setActionLoadingId("");
      setPendingTarget(null);
    }
  };

  if (status === "loading") {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-950">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  const filteredTeam = team.filter((member) => 
    member.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch("/api/admin/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Something went wrong");
      toast.success(result.message || "Invitation sent!");
      setIsOpen(false);
      setFormData({ email: "", role: "staff", message: "" });
      fetchTeamMembers();
    } catch (error) {
      toast.error(error.message || "Invitation failed.");
    } finally { setLoading(false); }
  };

  if (status === "authenticated" && session?.user?.role !== "superadmin") {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-950 text-white">
        <h1 className="text-xl font-bold text-red-500">403 - Access Denied. Only Superadmin can access this page.</h1>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 p-8 text-white font-sans">
      
      <div className="flex items-center justify-between border-b border-zinc-800 pb-5">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Team Members</h1>
          <p className="text-sm text-zinc-400 mt-1.5">
            Total Members : <span className="text-blue-400 font-mono font-bold text-base">{String(team.length).padStart(4, '0')}</span>
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
        <div className="relative flex-1">
          <Search className="absolute left-4 top-3.5 h-4 w-4 text-zinc-500" />
          <Input 
            type="text" placeholder="Search workers by name or email..." value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-11 pr-4 py-5 w-full bg-zinc-900 border-zinc-800 text-zinc-200 rounded-xl focus-visible:ring-blue-500 transition-all"
          />
        </div>
        
        <button 
          onClick={() => fetchTeamMembers(true)}
          disabled={isRefreshing || teamLoading}
          className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all active:scale-95 disabled:opacity-40 shrink-0"
          title="Refresh Team Data"
        >
          <RotateCw className={`h-4 w-4 ${isRefreshing ? "animate-spin text-blue-400" : ""}`} />
        </button>
      </div>

      <div className="mt-6 overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-900/50">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-zinc-800 bg-zinc-900/80 text-sm font-semibold text-zinc-400">
              <th className="p-4 w-16 text-center">no</th>
              <th className="p-4 w-20">Avtar</th>
              <th className="p-4">name</th>
              <th className="p-4">Email</th>
              <th className="p-4">Role</th>
              <th className="p-4">status</th>
              <th className="p-4">Last Login</th>
              <th className="p-4 text-center w-32">Access Control</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800 text-zinc-300">
            {teamLoading ? (
              <tr>
                <td colSpan="8" className="p-8 text-center text-zinc-500">
                  <div className="flex items-center justify-center gap-2"><Loader2 className="h-5 w-5 animate-spin text-blue-500" /><span>Loading workers...</span></div>
                </td>
              </tr>
            ) : filteredTeam.length === 0 ? (
              <tr><td colSpan="8" className="p-8 text-center text-zinc-500">No workers found matching your search.</td></tr>
            ) : (
              filteredTeam.map((member, index) => (
                <tr key={member._id} className={`hover:bg-zinc-900/40 transition-colors ${member.isBlocked ? "opacity-50 bg-rose-950/5" : ""}`}>
                  <td className="p-4 text-center font-medium text-zinc-500">{index + 1}</td>
                  <td className="p-4">
                    {member.image ? (
                      <img src={member.image} alt={member.name} className="w-9 h-9 rounded-full object-cover border border-zinc-800" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-sm font-bold text-blue-400 capitalize">{member.name ? member.name[0] : "W"}</div>
                    )}
                  </td>
                  <td className="p-4 capitalize font-medium text-white">
                    {member.name || "N/A"} 
                    {member.isBlocked && <span className="ml-2 text-[10px] bg-rose-500/20 text-rose-400 border border-rose-500/30 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">Blocked</span>}
                  </td>
                  <td className="p-4 text-zinc-400 font-mono text-sm">{member.email}</td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 text-xs font-semibold rounded-md uppercase border ${
                      member.role === 'superadmin' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' : member.role === 'admin' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'
                    }`}>{member.role}</span>
                  </td>
                  <td className="p-4">
                    {member.isBlocked ? (
                      <div className="flex items-center gap-2 text-zinc-500 font-medium text-sm">
                        <span className="w-3 h-3 rounded-sm border border-zinc-700 bg-zinc-800"></span>
                        Suspended
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className={`w-3 h-3 rounded-sm border ${member.isActive ? 'bg-emerald-500/20 border-emerald-500' : 'bg-rose-500/20 border-rose-500'}`}></span>
                        <span className={member.isActive ? "text-emerald-400 font-medium text-sm" : "text-rose-400 font-medium text-sm"}>{member.isActive ? 'Active' : 'Inactive'}</span>
                      </div>
                    )}
                  </td>
                  <td className="p-4 text-xs text-zinc-400 font-mono">{formatLastLogin(member.lastLogin)}</td>
                  <td className="p-4 text-center">
                    {member.role === "superadmin" ? (
                      <div className="flex justify-center text-zinc-600"><Ban className="h-4 w-4" /></div>
                    ) : actionLoadingId === member._id ? (
                      <div className="flex justify-center"><Loader2 className="h-4 w-4 animate-spin text-blue-500" /></div>
                    ) : (
                      <div className="flex items-center justify-center gap-3">
                        <Switch 
                          checked={!member.isBlocked}
                          onCheckedChange={() => handleToggleClick(member._id, member.name, member.isBlocked)}
                          className="data-[state=checked]:bg-emerald-600 data-[state=unchecked]:bg-zinc-700"
                        />
                        <span className={`text-xs font-bold tracking-wider uppercase min-w-[50px] text-left ${member.isBlocked ? "text-rose-400" : "text-emerald-400"}`}>
                          {member.isBlocked ? "Blocked" : "Active"}
                        </span>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent className="bg-zinc-900 border border-zinc-800 text-white rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-zinc-100">
              {pendingTarget?.isBlocked ? "Confirm Account Unblock" : "Confirm Account Suspension"}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              Are you sure you want to {pendingTarget?.isBlocked ? "unblock" : "block"} <span className="text-white font-semibold capitalize">"{pendingTarget?.name}"</span>? 
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
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-zinc-400">Email Address</Label>
                <Input id="email" type="email" required placeholder="name@example.com" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="bg-zinc-950 border-zinc-800 text-white rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label className="text-zinc-400">Select System Role</Label>
                <select value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })} className="flex h-10 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-white cursor-pointer"><option value="admin">Admin</option><option value="staff">Staff</option></select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="message" className="text-zinc-400">Personal Note (Optional)</Label>
                <Textarea id="message" placeholder="Type an optional message..." value={formData.message} onChange={(e) => setFormData({ ...formData, message: e.target.value })} className="bg-zinc-950 border-zinc-800 text-white rounded-xl resize-none" />
              </div>
              <Button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl h-11">{loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending...</> : "Send Invitation"}</Button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}