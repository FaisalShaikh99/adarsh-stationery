import { Edit2, Trash2, PhoneCall, Globe, Package, Layers, Plus } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

export default function BrandTable({ brands, isLoading, onEdit, onDelete, onAddClick }) {
  if (isLoading) {
    return (
      <div className="text-center py-12 text-zinc-500 font-medium">
        <LoadingSpinner size={140} label="Loading profiles..." className="mx-auto" />
      </div>
    );
  }

  if (!brands || brands.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center p-12 border-2 border-dashed border-border-subtle bg-white rounded-[24px] space-y-4 min-h-[300px]">
        <div className="w-14 h-14 rounded-2xl bg-primary-50 flex items-center justify-center border border-primary-200 text-primary-600 shadow-2xs">
          <Layers className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-black text-gray-900">No brand profiles registered</h3>
          <p className="text-xs text-zinc-600 max-w-sm font-medium">No brands match your filter or search query. Create a new brand profile registry to associate catalog assets.</p>
        </div>
        {onAddClick && (
          <Button 
            onClick={onAddClick}
            className="bg-primary-600 text-white font-black hover:bg-primary-700 rounded-2xl px-5 h-10 text-xs cursor-pointer shadow-md btn-modern"
          >
            <Plus className="w-4 h-4 mr-1.5" /> Add New Brand
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-[24px] border border-border-subtle bg-white shadow-2xs">
      <Table className="min-w-[900px] text-xs font-sans">
        <TableHeader className="bg-primary-50/90 border-b border-border-subtle">
          <TableRow className="border-b border-border-subtle uppercase text-xs">
            <TableHead className="w-16 font-black text-primary-900">Sr No.</TableHead>
            <TableHead className="w-24 font-black text-primary-900">Logo</TableHead>
            <TableHead className="font-black text-primary-900">Brand Identity</TableHead>
            <TableHead className="font-black text-primary-900 min-w-[280px]">Catalog & Categories</TableHead>
            <TableHead className="font-black text-primary-900 min-w-[180px]">Channels Metadata</TableHead>
            <TableHead className="text-center w-36 font-black text-primary-900">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {brands.map((b, index) => (
            <TableRow key={b._id} className="border-b border-border-subtle hover:bg-primary-50/50 transition-colors align-middle text-xs bg-white">
              {/* Sr No. */}
              <TableCell className="font-mono text-zinc-600 py-3.5 text-xs sm:text-sm font-bold">{index + 1}</TableCell>
              
              {/* Logo */}
              <TableCell className="py-3.5">
                <div className="w-12 h-12 relative rounded-xl bg-white border border-border-subtle p-1 flex items-center justify-center shadow-2xs">
                  <img 
                    src={b.logo || "https://placehold.co/100"} 
                    alt={b.name}
                    className="w-full h-full object-contain rounded-lg"
                    referrerPolicy="no-referrer"
                    onError={(e) => { e.target.src = "https://placehold.co/100"; }}
                  />
                </div>
              </TableCell>

              {/* Brand Identity */}
              <TableCell className="py-3.5 max-w-[260px]">
                <div className="space-y-1">
                  <h4 className="font-black text-gray-900 text-xs sm:text-sm tracking-tight capitalize">{b.name}</h4>
                  <p className="text-xs text-zinc-600 font-medium line-clamp-2 leading-relaxed">
                    {b.description || "No summary description registered."}
                  </p>
                </div>
              </TableCell>

              {/* Catalog & Categories */}
              <TableCell className="py-3.5">
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-black px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5 shadow-2xs">
                      <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                      {b.productCount || 0} Products
                    </span>
                  </div>
                  {b.categories && b.categories.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold block w-full">Associated Categories</span>
                      {b.categories.map((cat, idx) => {
                        const catName = typeof cat === "object" ? cat.name : cat;
                        return (
                          <span key={idx} className="text-xs px-2.5 py-1 rounded-lg bg-primary-50 text-primary-700 border border-primary-200 font-bold capitalize shadow-2xs">
                            {catName}
                          </span>
                        );
                      })}
                    </div>
                  ) : (
                    <span className="text-xs text-zinc-400 italic font-medium">No category mappings</span>
                  )}
                </div>
              </TableCell>

              {/* Channels Metadata */}
              <TableCell className="py-3.5 font-mono">
                <div className="space-y-1 text-xs">
                  {b.contactPhone ? (
                    <div className="flex items-center gap-1.5 text-gray-900 font-bold">
                      <PhoneCall className="w-3.5 h-3.5 text-primary-600 shrink-0" />
                      <span>{b.contactPhone}</span>
                    </div>
                  ) : null}
                  {b.website ? (
                    <a 
                      href={b.website.startsWith("http") ? b.website : `https://${b.website}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-primary-600 hover:underline hover:text-primary-700 font-bold transition-colors truncate max-w-[180px]"
                    >
                      <Globe className="w-3.5 h-3.5 text-primary-600 shrink-0" />
                      <span className="truncate">Web Profile</span>
                    </a>
                  ) : null}
                  {!b.contactPhone && !b.website && (
                    <span className="text-xs text-zinc-400 italic font-medium">No channel metadata</span>
                  )}
                </div>
              </TableCell>

              {/* Actions */}
              <TableCell className="text-center py-3.5">
                <div className="flex items-center justify-center gap-2">
                  <Button
                    onClick={() => onEdit(b)}
                    variant="outline"
                    className="h-8 px-2.5 border-border-subtle bg-bg-surface text-gray-900 hover:text-primary-700 hover:bg-primary-50 rounded-xl text-xs font-bold gap-1 cursor-pointer shadow-2xs"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-primary-600" /> Edit
                  </Button>
                  <Button
                    onClick={() => onDelete(b._id)}
                    variant="ghost"
                    className="h-8 w-8 p-0 text-rose-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
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