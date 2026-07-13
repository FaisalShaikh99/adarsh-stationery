"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axiosClient from "@/lib/axios";
import { toast } from "sonner";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import BrandTable from "./BrandTable"; 
import BrandFormModal from "./BrandFormModal";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

// Categories fetch karne ke liye pipeline helper
const fetchCategories = async () => {
  const response = await axiosClient.get("/api/admin/categories");
  return response.data || [];
};

export default function BrandManagementPage() {
  const queryClient = useQueryClient();

  // 1. Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  // 2. Modal & Delete Dialog States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState(null);
  
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState(null);

  // 3. Categories Fetch via TanStack Query
  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
  });

  // 4. Delete Mutation using TanStack Query & Axios
  const { mutate: deleteBrand } = useMutation({
    mutationFn: async (id) => {
      return axiosClient.delete(`/api/admin/brands?id=${id}`);
    },
    onSuccess: (res) => {
      toast.success(res.message || "Brand profile retired safely.");
      queryClient.invalidateQueries({ queryKey: ["brands"] }); // Real-time table refresh!
      setDeleteDialogOpen(false);
      setPendingDeleteId(null);
    },
    onError: (err) => {
      toast.error(err.message || "Deletion request rejected by safeguard script.");
    }
  });

  const handleEdit = (brand) => {
    setEditingBrand(brand);
    setIsModalOpen(true);
  };

  const handleDeleteTrigger = (id) => {
    setPendingDeleteId(id);
    setDeleteDialogOpen(true);
  };

  return (
    <div className="w-full min-h-screen bg-[#09090b] text-white p-6 space-y-6 font-sans">
      
      {/* 
       1. TOP NAVBAR ELEMENT CONTROLS */}
      <div className="flex justify-between items-center border-b border-zinc-800 pb-5">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold tracking-tight">Brand & Manufacturer Profiles</h1>
          <span className="text-xs bg-zinc-800 text-zinc-400 px-3 py-1 rounded-lg border border-zinc-700 font-medium">Registry Node</span>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            onClick={() => { setEditingBrand(null); setIsModalOpen(true); }} 
            className="bg-white text-black font-semibold hover:bg-zinc-200 rounded-xl px-4 h-9 text-xs shadow-md"
          >
            <Plus className="w-4 h-4 mr-1 stroke-3"/> Add New Brand
          </Button>
        </div>
      </div>

      {/* 🔍 2. SEARCH ARCHITECTURE & CAT-FILTER BAR */}
      <div className="bg-[#0c0c0e] border border-zinc-800 rounded-2xl p-6 space-y-4 shadow-xl">
        <div className="flex flex-col md:flex-row items-center gap-3">
          
          <div className="relative w-full">
            <Search className="absolute left-3 top-3.5 h-4 w-4 text-zinc-500" />
            <Input 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Brand Registry Index..."
              className="bg-[#141416] border-zinc-700 rounded-xl h-11 pl-10 text-zinc-300 placeholder-zinc-500 focus-visible:ring-zinc-600 transition-all"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-[#141416] border border-zinc-700 rounded-xl h-11 px-4 text-sm text-zinc-300 focus:outline-none focus:border-zinc-500 min-w-45 cursor-pointer appearance-none"
            style={{
              backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%23a1a1aa' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 12 15 18 9'></polyline></svg>")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 12px center',
              backgroundSize: '14px'
            }}
          >
            <option value="all">All Categories</option>
            {categories.map(cat => (
              <option key={cat._id} value={cat._id}>{cat.name}</option>
            ))}
          </select>
        </div>

        {/* 📊 3. BRAND DATA TABLE MATRIX */}
        <BrandTable 
          categoryFilter={categoryFilter} 
          searchQuery={searchQuery} 
          onEdit={handleEdit}
          onDelete={handleDeleteTrigger}
        />
      </div>

      {/* 🪄 4. AI POWERED FORM MODAL COMPONENT */}
      <BrandFormModal 
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingBrand(null); }}
        editingBrand={editingBrand}
        categories={categories}
      />

      {/* 🛡️ 5. SAFEGUARD DELETION REJECTION SHIELD */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-zinc-900 border border-zinc-800 text-white rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Retire Brand Profile Registry?</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              Are you absolutely sure you want to drop this brand profile flag? Safeguard scripts will automatically block this sequence if active structural items under inventory matrices depend on this brand pointer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-zinc-800 text-zinc-300 rounded-xl border-zinc-700">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => deleteBrand(pendingDeleteId)} 
              className="bg-rose-600 hover:bg-rose-700 font-bold rounded-xl"
            >
              Destroy Profile Node
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}