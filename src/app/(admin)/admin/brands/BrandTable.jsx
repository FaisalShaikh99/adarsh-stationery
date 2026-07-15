"use client";

import { Edit2, Trash2, PhoneCall, Globe, Package, Layers } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

export default function BrandTable({ brands, isLoading, onEdit, onDelete }) {
  if (isLoading) {
    return (
      <div className="text-center py-12 text-zinc-550 font-medium">
        <LoadingSpinner size={140} label="Loading profiles..." className="mx-auto" />
      </div>
    );
  }

  if (!brands || brands.length === 0) {
    return (
      <div className="text-center h-32 text-zinc-500 font-medium flex items-center justify-center border border-dashed border-zinc-800 rounded-xl bg-zinc-900/5">
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
            <TableHead className="w-24 font-semibold text-zinc-400">Logo</TableHead>
            <TableHead className="font-semibold text-zinc-400">Brand Identity</TableHead>
            <TableHead className="font-semibold text-zinc-400 min-w-[280px]">Catalog & Categories</TableHead>
            <TableHead className="font-semibold text-zinc-400 min-w-[180px]">Channels Metadata</TableHead>
            <TableHead className="text-center w-32 font-semibold text-zinc-400">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {brands.map((b, index) => (
            <TableRow key={b._id} className="border-b border-zinc-800/60 hover:bg-zinc-900/20 transition-colors align-middle">
              {/* Sr No. */}
              <TableCell className="font-mono text-zinc-500 py-6 text-sm">{index + 1}</TableCell>
              
              {/* Logo */}
              <TableCell className="py-6">
                <div className="w-16 h-16 relative rounded-2xl bg-white border border-zinc-800 p-1 flex items-center justify-center shadow-sm">
                  <img 
                    src={b.logo || "https://placehold.co/100"} 
                    className="w-full h-full object-contain rounded-xl" 
                    alt={b.name} 
                    referrerPolicy="no-referrer"
                  />
                </div>
              </TableCell>

              {/* Brand Flag / Identity */}
              <TableCell className="py-6">
                <div className="space-y-1">
                  <h3 className="font-bold tracking-tight text-base text-zinc-100 capitalize">{b.name}</h3>
                  {b.description ? (
                    <p className="text-xs text-zinc-450 line-clamp-2 max-w-xs font-normal leading-relaxed">{b.description}</p>
                  ) : (
                    <p className="text-xs text-zinc-600 italic font-normal">No summary description registered.</p>
                  )}
                </div>
              </TableCell>

              {/* Catalog & Categories */}
              <TableCell className="py-6">
                <div className="space-y-2.5">
                  {/* Product Count Pill */}
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 text-xs font-semibold font-mono">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    {b.productCount || 0} Products
                  </div>
                  
                  {/* Associated Categories List */}
                  <div className="space-y-1">
                    <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold">Associated Categories</p>
                    <div className="flex flex-wrap gap-1.5">
                      {b.categories?.map((cat) => (
                        <span key={cat._id} className="text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded-md font-medium capitalize">
                          {cat.name}
                        </span>
                      ))}
                      {(!b.categories || b.categories.length === 0) && (
                        <span className="text-[10px] text-zinc-500 italic">No categories mapped</span>
                      )}
                    </div>
                  </div>
                </div>
              </TableCell>

              {/* Channels Metadata */}
              <TableCell className="space-y-1.5 text-xs text-zinc-400 py-6">
                {b.primaryContact && (
                  <p className="flex items-center gap-2 text-zinc-300">
                    <PhoneCall className="w-3.5 h-3.5 text-zinc-500 shrink-0"/> 
                    <span className="font-mono">{b.primaryContact}</span>
                  </p>
                )}
                {b.websiteURL && (
                  <a 
                    href={b.websiteURL} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors hover:underline"
                  >
                    <Globe className="w-3.5 h-3.5 shrink-0"/> 
                    <span>Web Profile</span>
                  </a>
                )}
                {!b.primaryContact && !b.websiteURL && (
                  <span className="text-zinc-650 italic text-[11px]">No metadata channels</span>
                )}
              </TableCell>

              {/* Actions */}
              <TableCell className="text-center py-6">
                <div className="flex justify-center gap-3">
                  <Button onClick={() => onEdit(b)} variant="ghost" className="p-2 h-auto text-zinc-400 hover:text-white hover:bg-zinc-800/40 rounded-xl transition-all">
                    <Edit2 className="w-4 h-4"/>
                  </Button>
                  <Button onClick={() => onDelete(b._id)} variant="ghost" className="p-2 h-auto text-zinc-550 hover:text-rose-450 hover:bg-rose-950/20 rounded-xl transition-all">
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