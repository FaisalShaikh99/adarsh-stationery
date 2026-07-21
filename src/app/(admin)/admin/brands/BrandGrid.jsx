"use client";

import { Edit2, Trash2, PhoneCall, Globe, Package, Layers, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function BrandGrid({ brands, isLoading, onEdit, onDelete, onAddClick }) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 py-10">
        {[1, 2, 3].map((n) => (
          <div key={n} className="bg-[#0c0c0e] border border-zinc-800/80 rounded-2xl p-6 space-y-4 animate-pulse">
            <div className="w-20 h-20 bg-zinc-800 rounded-2xl mx-auto" />
            <div className="h-6 bg-zinc-800 rounded-md w-3/4 mx-auto" />
            <div className="h-4 bg-zinc-800 rounded-md w-1/2 mx-auto" />
            <div className="h-10 bg-zinc-800 rounded-md w-full" />
          </div>
        ))}
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
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {brands.map((b) => (
        <div 
          key={b._id} 
          className="bg-zinc-900/40 border border-zinc-850 rounded-2xl p-4 flex flex-col justify-between hover:border-zinc-700 hover:bg-zinc-900/60 transition-all duration-300 group shadow-lg"
        >
          <div className="space-y-3">
            {/* Logo Container */}
            <div className="relative w-16 h-16 mx-auto rounded-2xl bg-white border border-zinc-850 flex items-center justify-center p-2 overflow-hidden shadow-md group-hover:scale-105 transition-transform duration-300">
              <img 
                src={b.logo || "https://placehold.co/100"} 
                alt={b.name} 
                className="h-full w-full object-contain"
                referrerPolicy="no-referrer"
              />
            </div>

            {/* Info Section */}
            <div className="text-center space-y-1">
              <h3 className="font-bold text-zinc-100 text-sm capitalize tracking-tight line-clamp-1">{b.name}</h3>
              {b.description ? (
                <p className="text-[11px] text-zinc-450 line-clamp-2 px-1 min-h-[28px] leading-snug">{b.description}</p>
              ) : (
                <p className="text-[11px] text-zinc-600 italic px-1 min-h-[28px]">No description registered for this profile.</p>
              )}
            </div>

            {/* Product Count Pill */}
            <div className="flex justify-center">
              <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 text-[10px] font-semibold font-mono">
                <Package className="w-3 h-3 shrink-0" />
                <span>{b.productCount || 0} Products</span>
              </div>
            </div>

            {/* Associated Categories */}
            <div className="border-t border-zinc-800/80 pt-2.5 space-y-1">
              <p className="text-[9px] text-zinc-500 uppercase tracking-wider font-bold flex items-center gap-1">
                <Layers className="w-3 h-3 text-zinc-500" /> Associated Categories
              </p>
              <div className="flex flex-wrap gap-1 max-h-[80px] overflow-y-auto custom-scrollbar p-0.5">
                {b.categories?.map((cat) => (
                  <span 
                    key={cat._id} 
                    className="text-[9px] bg-blue-500/10 text-blue-400 border border-blue-500/20 px-1.5 py-0.2 rounded font-medium capitalize"
                  >
                    {cat.name}
                  </span>
                ))}
                {(!b.categories || b.categories.length === 0) && (
                  <span className="text-[9px] text-zinc-650 italic">No categories mapped</span>
                )}
              </div>
            </div>
          </div>

          {/* Bottom Channels & Actions */}
          <div className="border-t border-zinc-800/80 pt-3 mt-4 space-y-2.5">
            {/* Phone/URL Metadatas */}
            <div className="flex items-center justify-between text-[11px] px-0.5">
              {b.primaryContact ? (
                <span className="flex items-center gap-1 text-zinc-400 font-mono">
                  <PhoneCall className="w-3.5 h-3.5 text-zinc-550 shrink-0" />
                  {b.primaryContact}
                </span>
              ) : (
                <span className="text-zinc-650 italic text-[10px]">No contact info</span>
              )}

              {b.websiteURL ? (
                <a 
                  href={b.websiteURL} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="flex items-center gap-1 text-blue-450 hover:text-blue-400 transition-colors hover:underline"
                >
                  <Globe className="w-3 h-3 shrink-0" />
                  Web Profile
                </a>
              ) : (
                <span className="text-zinc-650 italic text-[10px]">No website URL</span>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-1.5 border-t border-zinc-850/50 pt-2.5">
              <Button 
                onClick={() => onEdit(b)} 
                variant="outline" 
                className="flex-1 h-8 border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-white rounded-lg text-xs font-semibold gap-1"
              >
                <Edit2 className="w-3 h-3" /> Edit
              </Button>
              <Button 
                onClick={() => onDelete(b._id)} 
                variant="ghost" 
                className="h-8 w-8 p-0 text-zinc-500 hover:text-rose-400 hover:bg-rose-950/15 rounded-lg transition-all"
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
