"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner"; 
import { Loader2 } from "lucide-react"; 

export default function TeamMembersPage() {
  const { data: session, status } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false); 

  const [formData, setFormData] = useState({
    email: "",
    role: "staff",
    message: "",
  });

  if (status === "loading") {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-950 text-white">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        <span className="ml-3 text-zinc-400 font-medium">Loading session...</span>
      </div>
    );
  }

  const userRole = session?.user?.role;

  console.log("Role : ",userRole)
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

      console.log("Result " , result)
      if (!response.ok) {
        throw new Error(result.message || "Something went wrong");
      }

      toast.success(result.message || "Invitation sent successfully!");
      setIsOpen(false);
      setFormData({ email: "", role: "staff", message: "" }); // Reset form
      
    } catch (error) {
      console.error("Client Submit Error:", error);
      toast.error(error.message || "Failed to send invitation.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 p-8 text-white font-sans">
      
      <div className="flex items-center justify-between border-b border-zinc-800 pb-5">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Team Members</h1>
          <p className="text-sm text-zinc-400 mt-1">Manage your store staff and access controls.</p>
        </div>

        {userRole === "superadmin" && (
          <Button
            onClick={() => setIsOpen(true)}
            size="lg"
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md transition-all active:scale-95"
          >
            + Invite Member
          </Button>
        )}
      </div>

      <div className="mt-8 overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-900/50">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-zinc-800 bg-zinc-900 text-sm font-semibold text-zinc-400">
              <th className="p-4">No.</th>
              <th className="p-4">Avatar</th>
              <th className="p-4">Name</th>
              <th className="p-4">Email</th>
              <th className="p-4">Role</th>
              <th className="p-4">Status</th>
              <th className="p-4">Last-Login</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800 text-zinc-300">
            <tr className="hover:bg-zinc-900/40 transition-colors">
              <td className="p-4">1</td>
              <td className="p-4">
                <div className="w-8 h-8 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-xs font-bold text-blue-400">
                  {session?.user?.name ? session.user.name[0].toUpperCase() : "A"}
                </div>
              </td>
              <td className="p-4 capitalize">{session?.user?.name || "Adarsh Proprietor"}</td>
              <td className="p-4 text-zinc-400">{session?.user?.email || "owner@adarsh.com"}</td>
              <td className="p-4">
                <span className="px-2 py-1 text-xs font-semibold rounded-md bg-purple-500/10 text-purple-400 border border-purple-500/20 uppercase tracking-wider">
                  {userRole || "superadmin"}
                </span>
              </td>
              <td className="p-4">
                <div className="flex items-center gap-2 text-green-400 text-sm">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                  Active
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ========== CUSTOM MODAL USING SHADCN COMPONENTS ========== */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4 mb-4">
              <h2 className="text-xl font-bold text-white">New Member Invitation</h2>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setIsOpen(false)}
                className="text-zinc-400 hover:text-white"
              >
                ✕
              </Button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              
              {/* Email via Shadcn Input */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-zinc-400">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="bg-zinc-950 border-zinc-800 text-white placeholder:text-zinc-600 focus-visible:ring-blue-500 rounded-xl"
                />
              </div>

              {/* Role Select Dropdown */}
              <div className="space-y-2">
                <Label className="text-zinc-400">Select System Role</Label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="flex h-10 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-white outline-none focus:border-blue-500 transition-all cursor-pointer"
                >
                  <option value="admin">Admin</option>
                  <option value="staff">Staff</option>
                </select>
              </div>

              {/* Custom Message via Shadcn Textarea */}
              <div className="space-y-2">
                <Label htmlFor="message" className="text-zinc-400">Personal Note (Optional)</Label>
                <Textarea
                  id="message"
                  placeholder="Type an optional message for the invitee..."
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="bg-zinc-950 border-zinc-800 text-white placeholder:text-zinc-600 focus-visible:ring-blue-500 rounded-xl resize-none"
                />
              </div>

              {/* Submit Button with Loading State */}
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl h-11 transition-all"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending Email...
                  </>
                ) : (
                  "Send Invitation Email"
                )}
              </Button>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}