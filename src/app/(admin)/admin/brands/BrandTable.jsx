"use client";

import { useQuery } from "@tanstack/react-query";
import axiosClient from "@/lib/axios";
import { Loader2, Edit2, Trash2, PhoneCall, Globe } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";

// Axios dynamic data fetcher function
const fetchBrandsData = async (category, search) => {
  // Axios client direct unpacked response bhejega (.json() ki jhanjhat nahi)
  const response = await axiosClient.get(`/api/admin/brands?category=${category}&search=${search}`);
  return response.data || [];
};

export default function BrandTable({ categoryFilter, searchQuery, onEdit, onDelete }) {
  
  // 🌟 TanStack Query Magic Injection!
  const { data: brands, isLoading } = useQuery({
    queryKey: ["brands", categoryFilter, searchQuery], // Dependency array: inke badalte hi auto-fetch chalega
    queryFn: () => fetchBrandsData(categoryFilter, searchQuery),
  });

  if (isLoading) {
    return (
      <div className="text-center h-32 text-zinc-500 flex items-center justify-center gap-2">
        <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
        Synchronizing brand profile caches...
      </div>
    );
  }

  if (!brands || brands.length === 0) {
    return (
      <div className="text-center h-24 text-zinc-500 font-medium flex items-center justify-center">
        No matching manufacturer or brand profiles registered.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-900/10">
      <Table>
        <TableHeader className="bg-zinc-900/40">
          <TableRow className="border-b border-zinc-800">
            <TableHead className="w-16 font-semibold text-zinc-400">Sr No.</TableHead>
            <TableHead className="font-semibold text-zinc-400">Logo</TableHead>
            <TableHead className="font-semibold text-zinc-400">Brand Flag</TableHead>
            <TableHead className="font-semibold text-zinc-400">Associated Category Chains</TableHead>
            <TableHead className="font-semibold text-zinc-400">Channels Metadata</TableHead>
            <TableHead className="text-center w-32 font-semibold text-zinc-400">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {brands.map((b, index) => (
            <TableRow key={b._id} className="border-b border-zinc-800/60 hover:bg-zinc-900/20 transition-colors">
              <TableCell className="font-mono text-zinc-500">{index + 1}</TableCell>
              <TableCell>
                <img 
                  src={b.logo || "https://placehold.co/100"} 
                  className="w-10 h-10 object-contain rounded-xl bg-white border border-zinc-800 p-1" 
                  alt="" 
                />
              </TableCell>
              <TableCell className="font-semibold text-zinc-100 tracking-wide capitalize">{b.name}</TableCell>
              <TableCell className="max-w-xs">
                <div className="flex flex-wrap gap-1">
                  {b.categories?.map((cat) => (
                    <span key={cat._id} className="text-[10px] bg-zinc-800 text-zinc-400 border border-zinc-700/60 px-2 py-0.5 rounded-md font-medium capitalize">
                      {cat.name}
                    </span>
                  ))}
                </div>
              </TableCell>
              <TableCell className="space-y-1 text-xs text-zinc-400">
                {b.primaryContact && <p className="flex items-center gap-1.5"><PhoneCall className="w-3 h-3 text-zinc-500"/> {b.primaryContact}</p>}
                {b.websiteURL && <a href={b.websiteURL} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-blue-400 hover:underline"><Globe className="w-3 h-3"/> Web Profile</a>}
              </TableCell>
              <TableCell className="text-center">
                <div className="flex justify-center gap-3">
                  <Button onClick={() => onEdit(b)} variant="ghost" className="p-1 h-auto text-zinc-400 hover:text-white transition-colors">
                    <Edit2 className="w-4 h-4"/>
                  </Button>
                  <Button onClick={() => onDelete(b._id)} variant="ghost" className="p-1 h-auto text-zinc-500 hover:text-rose-400 transition-colors">
                    <Trash2 className="w-4 h-4"/>
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}