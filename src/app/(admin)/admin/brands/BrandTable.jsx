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
      <div className="flex flex-col items-center justify-center text-center p-12 border border-dashed border-border-subtle bg-bg-surface rounded-2xl space-y-4 min-h-[300px]">
        <div className="w-12 h-12 rounded-full bg-primary-50 flex items-center justify-center border border-primary-200 text-primary-600">
          <Layers className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-gray-900">No brand profiles registered</h3>
          <p className="text-xs text-zinc-500 max-w-sm">No brands match your filter or search query. Create a new brand profile registry to associate catalog assets.</p>
        </div>
        {onAddClick && (
          <Button 
            onClick={onAddClick}
            className="bg-primary-600 text-white font-semibold hover:bg-primary-700 rounded-xl px-4 h-9 text-xs cursor-pointer shadow-xs btn-modern"
          >
            <Plus className="w-4 h-4 mr-1.5" /> Add New Brand
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-border-subtle bg-bg-surface shadow-xs">
      <Table className="min-w-[900px] text-xs">
        <TableHeader className="bg-primary-50/90 border-b border-border-subtle">
          <TableRow className="border-b border-border-subtle uppercase text-[11px]">
            <TableHead className="w-16 font-extrabold text-primary-800">Sr No.</TableHead>
            <TableHead className="w-24 font-extrabold text-primary-800">Logo</TableHead>
            <TableHead className="font-extrabold text-primary-800">Brand Identity</TableHead>
            <TableHead className="font-extrabold text-primary-800 min-w-[280px]">Catalog & Categories</TableHead>
            <TableHead className="font-extrabold text-primary-800 min-w-[180px]">Channels Metadata</TableHead>
            <TableHead className="text-center w-32 font-extrabold text-primary-800">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {brands.map((b, index) => (
            <TableRow key={b._id} className="border-b border-border-subtle hover:bg-primary-50/50 transition-colors align-middle text-xs bg-white/70">
              {/* Sr No. */}
              <TableCell className="font-mono text-zinc-600 py-3 text-xs font-bold">{index + 1}</TableCell>
              
              {/* Logo */}
              <TableCell className="py-3">
                <div className="w-11 h-11 relative rounded-xl bg-white border border-border-subtle p-1 flex items-center justify-center shadow-xs">
                  <img 
                    src={b.logo || "https://placehold.co/100"} 
                    alt={b.name}
                    className="w-full h-full object-contain rounded-lg"
                    onError={(e) => { e.target.src = "https://placehold.co/100"; }}
                  />
                </div>
              </TableCell>

              {/* Brand Identity */}
              <TableCell className="py-3 max-w-[240px]">
                <div className="space-y-0.5">
                  <h4 className="font-extrabold text-gray-900 text-xs tracking-tight">{b.name}</h4>
                  <p className="text-[11px] text-zinc-500 line-clamp-2 leading-relaxed">
                    {b.description || "No summary description registered."}
                  </p>
                </div>
              </TableCell>

              {/* Catalog & Categories */}
              <TableCell className="py-3">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      {b.productCount || 0} Products
                    </span>
                  </div>
                  {b.categories && b.categories.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      <span className="text-[9px] text-zinc-500 uppercase tracking-wider font-bold block w-full">Associated Categories</span>
                      {b.categories.map((cat, idx) => {
                        const catName = typeof cat === "object" ? cat.name : cat;
                        return (
                          <span key={idx} className="text-[10px] px-1.5 py-0.5 rounded bg-primary-50 text-primary-700 border border-primary-200 font-medium">
                            {catName}
                          </span>
                        );
                      })}
                    </div>
                  ) : (
                    <span className="text-[10px] text-zinc-400 italic">No category mappings</span>
                  )}
                </div>
              </TableCell>

              {/* Channels Metadata */}
              <TableCell className="py-3 font-mono">
                <div className="space-y-1 text-[11px]">
                  {b.contactPhone ? (
                    <div className="flex items-center gap-1 text-zinc-600">
                      <PhoneCall className="w-3 h-3 text-zinc-400 shrink-0" />
                      <span>{b.contactPhone}</span>
                    </div>
                  ) : null}
                  {b.website ? (
                    <a 
                      href={b.website.startsWith("http") ? b.website : `https://${b.website}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-primary-600 hover:underline hover:text-primary-700 transition-colors truncate max-w-[180px]"
                    >
                      <Globe className="w-3 h-3 text-primary-600 shrink-0" />
                      <span className="truncate">Web Profile</span>
                    </a>
                  ) : null}
                  {!b.contactPhone && !b.website && (
                    <span className="text-[10px] text-zinc-400 italic">No channel metadata</span>
                  )}
                </div>
              </TableCell>

              {/* Actions */}
              <TableCell className="text-center py-3">
                <div className="flex items-center justify-center gap-1.5">
                  <Button
                    onClick={() => onEdit(b)}
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-zinc-600 hover:text-gray-900 hover:bg-primary-50 rounded-lg cursor-pointer"
                    title="Edit Brand Profile"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    onClick={() => onDelete(b._id)}
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-rose-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                    title="Delete Brand Profile"
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