import { Edit2, Trash2, PhoneCall, Globe, Package, Layers, Plus } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

export default function BrandTable({ brands, isLoading, onEdit, onDelete, onAddClick }) {
  if (isLoading) {
    return (
      <div className="text-center py-12 text-zinc-550 font-medium">
        <LoadingSpinner size={140} label="Loading profiles..." className="mx-auto" />
      </div>
    );
  }

  if (!brands || brands.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center p-12 border border-dashed border-zinc-800 bg-zinc-900/10 rounded-2xl space-y-4 min-h-[300px]">
        <div className="w-12 h-12 rounded-full bg-zinc-900 flex items-center justify-center border border-zinc-800 text-zinc-500">
          <Layers className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-zinc-200">No brand profiles registered</h3>
          <p className="text-xs text-zinc-500 max-w-sm">No brands match your filter or search query. Create a new brand profile registry to associate catalog assets.</p>
        </div>
        {onAddClick && (
          <Button 
            onClick={onAddClick}
            className="bg-white text-black font-semibold hover:bg-zinc-200 rounded-xl px-4 h-9 text-xs cursor-pointer shadow-md"
          >
            <Plus className="w-4 h-4 mr-1.5" /> Add New Brand
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-900/10">
      <Table className="min-w-[900px]">
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
            <TableRow key={b._id} className="border-b border-zinc-800/60 hover:bg-zinc-900/20 transition-colors align-middle text-xs">
              {/* Sr No. */}
              <TableCell className="font-mono text-zinc-500 py-3 text-xs">{index + 1}</TableCell>
              
              {/* Logo */}
              <TableCell className="py-3">
                <div className="w-11 h-11 relative rounded-xl bg-white border border-zinc-800 p-0.5 flex items-center justify-center shadow-sm">
                  <img 
                    src={b.logo || "https://placehold.co/100"} 
                    className="w-full h-full object-contain rounded-lg" 
                    alt={b.name} 
                    referrerPolicy="no-referrer"
                  />
                </div>
              </TableCell>

              {/* Brand Flag / Identity */}
              <TableCell className="py-3">
                <div className="space-y-0.5">
                  <h3 className="font-bold tracking-tight text-xs text-zinc-100 capitalize">{b.name}</h3>
                  {b.description ? (
                    <p className="text-[11px] text-zinc-450 line-clamp-2 max-w-xs font-normal leading-relaxed">{b.description}</p>
                  ) : (
                    <p className="text-[11px] text-zinc-600 italic font-normal">No summary description registered.</p>
                  )}
                </div>
              </TableCell>

              {/* Catalog & Categories */}
              <TableCell className="py-3">
                <div className="space-y-1.5">
                  {/* Product Count Pill */}
                  <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 text-[10px] font-semibold font-mono">
                    <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
                    {b.productCount || 0} Products
                  </div>
                  
                  {/* Associated Categories List */}
                  <div className="space-y-0.5">
                    <p className="text-[9px] text-zinc-500 uppercase tracking-wider font-bold">Associated Categories</p>
                    <div className="flex flex-wrap gap-1">
                      {b.categories?.map((cat) => (
                        <span key={cat._id} className="text-[9px] bg-blue-500/10 text-blue-400 border border-blue-500/20 px-1.5 py-0.2 rounded font-medium capitalize">
                          {cat.name}
                        </span>
                      ))}
                      {(!b.categories || b.categories.length === 0) && (
                        <span className="text-[9px] text-zinc-500 italic">No categories mapped</span>
                      )}
                    </div>
                  </div>
                </div>
              </TableCell>

              {/* Channels Metadata */}
              <TableCell className="space-y-1 text-[11px] text-zinc-400 py-3">
                {b.primaryContact && (
                  <p className="flex items-center gap-1.5 text-zinc-300">
                    <PhoneCall className="w-3 h-3 text-zinc-500 shrink-0"/> 
                    <span className="font-mono">{b.primaryContact}</span>
                  </p>
                )}
                {b.websiteURL && (
                  <a 
                    href={b.websiteURL} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="flex items-center gap-1.5 text-blue-400 hover:text-blue-300 transition-colors hover:underline"
                  >
                    <Globe className="w-3 h-3 shrink-0"/> 
                    <span>Web Profile</span>
                  </a>
                )}
                {!b.primaryContact && !b.websiteURL && (
                  <span className="text-zinc-650 italic text-[10px]">No metadata channels</span>
                )}
              </TableCell>

              {/* Actions */}
              <TableCell className="text-center py-3">
                <div className="flex justify-center gap-2">
                  <Button onClick={() => onEdit(b)} variant="ghost" className="p-1 h-7 w-7 text-zinc-400 hover:text-white hover:bg-zinc-800/40 rounded-lg transition-all">
                    <Edit2 className="w-3.5 h-3.5"/>
                  </Button>
                  <Button onClick={() => onDelete(b._id)} variant="ghost" className="p-1 h-7 w-7 text-zinc-550 hover:text-rose-455 hover:bg-rose-950/20 rounded-lg transition-all">
                    <Trash2 className="w-3.5 h-3.5"/>
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