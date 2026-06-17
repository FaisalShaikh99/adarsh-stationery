"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner"; 
import { Loader2, Search, Trash2, Ban } from "lucide-react";

// 🚨 SHADCN ALERT DIALOG IMPORTS (image_88f23a.png ke folder structure ke hisab se path)
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
    const dateOptions = { day: '2-digit', month: 'short', year: 'numeric' };
    const formattedDate = date.toLocaleDateString('en-IN', dateOptions);
    const timeOptions = { hour: '2-digit', minute: '2-digit', hour12: true };
    const formattedTime = date.toLocaleTimeString('en-IN', timeOptions);
    return `${formattedDate} at ${formattedTime}`;
  } catch (error) {
    return "Never logged in";
  }
};

export default function TeamMembersPage() {
  const { data: session, status } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false); 
  const [teamLoading, setTeamLoading] = useState(true); 
  const [team, setTeam] = useState([]); 
  const [searchQuery, setSearchQuery] = useState("");

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [selectedMember, setSelectedMember] = useState({ id: "", name: "", role: "" });

  const [formData, setFormData] = useState({
    email: "",
    role: "staff",
    message: "",
  });

  const fetchTeamMembers = async () => {
    try {
      setTeamLoading(true);
      const response = await fetch("/api/admin/team");
      const result = await response.json();
      if (response.ok) {
        setTeam(result.data || []); 
      } else {
        toast.error(result.message || "Failed to load team members.");
      }
    } catch (error) {
      console.error("Fetch team error:", error);
      toast.error("Something went wrong while fetching team.");
    } finally {
      setTeamLoading(false);
    }
  };

  useEffect(() => {
    if (status === "authenticated") {
      fetchTeamMembers();
    }
  }, [status]);

  const openDeletePopup = (id, name, role) => {
    if (role === "superadmin") {
      toast.error("Superadmin cannot be deleted!");
      return;
    }
    setSelectedMember({ id, name, role });
    setIsDeleteOpen(true);
  };

  const executeDeleteMember = async () => {
    try {
      setDeleteLoading(true);
      const response = await fetch(`/api/admin/delete?id=${selectedMember.id}`, {
        method: "DELETE",
      });
      const result = await response.json();

      if (response.ok) {
        toast.success(`${selectedMember.name} removed successfully!`);
        setIsDeleteOpen(false); // Popup close karo
        fetchTeamMembers(); // Table refresh karo
      } else {
        toast.error(result.message || "Failed to delete member.");
      }
    } catch (error) {
      toast.error("Something went wrong during deletion.");
    } finally {
      setDeleteLoading(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-950 text-white">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        <span className="ml-3 text-zinc-400 font-medium">Loading session...</span>
      </div>
    );
  }

  const userRole = session?.user?.role;
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
      toast.success(result.message || "Invitation sent successfully!");
      setIsOpen(false);
      setFormData({ email: "", role: "staff", message: "" });
      fetchTeamMembers();
    } catch (error) {
      console.error("Client Submit Error:", error);
      toast.error(error.message || "Failed to send invitation.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 p-8 text-white font-sans">
      
      {/* Header Section */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-5">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Team Members</h1>
          <p className="text-sm text-zinc-400 mt-1">
            Total Members : <span className="text-blue-400 font-mono font-bold text-base">{String(team.length).padStart(4, '0')}</span>
          </p>
        </div>
        <div className="text-right flex flex-col items-end gap-2">
          <span className="text-sm font-medium text-zinc-400">
            Super Admin : <span className="text-white font-semibold">{session?.user?.name || "Faisal"}</span>
          </span>
          {userRole === "superadmin" && (
            <Button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl px-4" onClick={() => setIsOpen(true)}>
              + Invite new Member
            </Button>
          )}
        </div>
      </div>

      {/* Search Input Row */}
      <div className="mt-6 flex justify-center">
        <div className="relative w-full max-w-xl">
          <Search className="absolute left-4 top-3 h-4 w-4 text-zinc-500" />
          <Input 
            type="text" placeholder="Search workers by name or email..." value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-11 pr-4 py-5 w-full bg-zinc-900 border-zinc-800 text-zinc-200 rounded-full placeholder:text-zinc-500 focus-visible:ring-blue-500 transition-all"
          />
        </div>
      </div>

      {/* Table Structure */}
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
              <th className="p-4 text-center w-24">delete btn</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800 text-zinc-300">
            {teamLoading ? (
              <tr>
                <td colSpan="8" className="p-8 text-center text-zinc-500">
                  <div className="flex items-center justify-center gap-2"><Loader2 className="h-5 w-5 animate-spin text-blue-500" /><span>Fetching workers...</span></div>
                </td>
              </tr>
            ) : filteredTeam.length === 0 ? (
              <tr>
                <td colSpan="8" className="p-8 text-center text-zinc-500">No workers found matching your search.</td>
              </tr>
            ) : (
              filteredTeam.map((member, index) => (
                <tr key={member._id} className="hover:bg-zinc-900/40 transition-colors">
                  <td className="p-4 text-center font-medium text-zinc-500">{index + 1}</td>
                  <td className="p-4">
                    {member.image ? (
                      <img src={member.image} alt={member.name} className="w-9 h-9 rounded-full object-cover border border-zinc-800" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-sm font-bold text-blue-400 capitalize">{member.name ? member.name[0] : "W"}</div>
                    )}
                  </td>
                  <td className="p-4 capitalize font-medium text-white">{member.name || "N/A"}</td>
                  <td className="p-4 text-zinc-400 font-mono text-sm">{member.email}</td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 text-xs font-semibold rounded-md uppercase tracking-wider border ${
                      member.role === 'superadmin' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' : member.role === 'admin' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'
                    }`}>{member.role}</span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <span className={`w-3 h-3 rounded-sm border ${member.isActive ? 'bg-emerald-500/20 border-emerald-500' : 'bg-rose-500/20 border-rose-500'}`}></span>
                      <span className={member.isActive ? "text-emerald-400 font-medium" : "text-rose-400 font-medium"}>{member.isActive ? 'Active' : 'Inactive'}</span>
                    </div>
                  </td>
                  <td className="p-4 text-xs text-zinc-400 font-mono">{formatLastLogin(member.lastLogin)}</td>
                  
              
                  <td className="p-4 text-center">
                    {member.role === "superadmin" ? (
                      <div className="flex justify-center text-zinc-600 cursor-not-allowed"><Ban className="h-4 w-4" /></div>
                    ) : (
                      <button 
                        onClick={() => openDeletePopup(member._id, member.name, member.role)}
                        className="text-zinc-500 hover:text-rose-400 transition-colors p-1 rounded-md hover:bg-rose-500/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

  
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-md p-6 text-white shadow-2xl animate-in fade-in zoom-in-95 duration-150">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold text-zinc-100 flex items-center gap-2">
              <span className="p-2 rounded-xl bg-rose-500/10 text-rose-400"><Trash2 className="h-5 w-5" /></span>
              Confirm Removal
            </AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400 text-sm mt-2 leading-relaxed">
              Are you sure to delete <span className="text-white font-bold capitalize">"{selectedMember.name}"</span> from Adarsh Stationery? This action cannot be undone and they will immediately lose access to the admin panel.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-6 flex gap-3 justify-end">
            {/* Cancel Button */}
            <AlertDialogCancel 
              onClick={() => setIsDeleteOpen(false)}
              className="bg-zinc-800 border-zinc-700 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded-xl px-4 py-2 font-medium transition-all"
            >
              Cancel
            </AlertDialogCancel>
            
            {/* Delete Confirmation Button */}
            <Button
              onClick={executeDeleteMember}
              disabled={deleteLoading}
              className="bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl px-5 py-2 flex items-center gap-2 transition-all shadow-lg shadow-rose-600/10"
            >
              {deleteLoading ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Removing...</>
              ) : (
                "Delete"
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ========== INVITATION MODAL FORM ========== */}
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
              <Button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl h-11">{loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending Email...</> : "Send Invitation Email"}</Button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}