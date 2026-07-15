"use client";

import { Edit2, Trash2, PhoneCall, Globe, Package, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function BrandGrid({ brands, isLoading, onEdit, onDelete }) {
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
      <div className="text-center py-20 text-zinc-550 border border-dashed border-zinc-800 rounded-2xl bg-zinc-900/10 font-medium">
        No matching manufacturer or brand profiles registered.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {brands.map((b) => (
        <div 
          key={b._id} 
          className="bg-zinc-900/40 border border-zinc-850 rounded-2xl p-5 flex flex-col justify-between hover:border-zinc-700 hover:bg-zinc-900/60 transition-all duration-300 group shadow-lg"
        >
          <div className="space-y-4">
            {/* Logo Container */}
            <div className="relative w-24 h-24 mx-auto rounded-3xl bg-white border border-zinc-850 flex items-center justify-center p-3 overflow-hidden shadow-md group-hover:scale-105 transition-transform duration-300">
              <img 
                src={b.logo || "https://placehold.co/100"} 
                alt={b.name} 
                className="h-full w-full object-contain"
                referrerPolicy="no-referrer"
              />
            </div>

            {/* Info Section */}
            <div className="text-center space-y-1.5">
              <h3 className="font-bold text-zinc-100 text-lg capitalize tracking-tight line-clamp-1">{b.name}</h3>
              {b.description ? (
                <p className="text-xs text-zinc-450 line-clamp-2 px-2 min-h-[32px] leading-relaxed">{b.description}</p>
              ) : (
                <p className="text-xs text-zinc-600 italic px-2 min-h-[32px]">No description registered for this profile.</p>
              )}
            </div>

            {/* Product Count Pill */}
            <div className="flex justify-center">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 text-xs font-semibold font-mono">
                <Package className="w-3.5 h-3.5 shrink-0" />
                <span>{b.productCount || 0} Products</span>
              </div>
            </div>

            {/* Associated Categories */}
            <div className="border-t border-zinc-800/80 pt-3 space-y-1.5">
              <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold flex items-center gap-1">
                <Layers className="w-3 h-3 text-zinc-500" /> Associated Categories
              </p>
              <div className="flex flex-wrap gap-1.5 max-h-[80px] overflow-y-auto custom-scrollbar p-0.5">
                {b.categories?.map((cat) => (
                  <span 
                    key={cat._id} 
                    className="text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded-md font-medium capitalize"
                  >
                    {cat.name}
                  </span>
                ))}
                {(!b.categories || b.categories.length === 0) && (
                  <span className="text-[10px] text-zinc-650 italic">No categories mapped</span>
                )}
              </div>
            </div>
          </div>

          {/* Bottom Channels & Actions */}
          <div className="border-t border-zinc-800/80 pt-4 mt-5 space-y-3.5">
            {/* Phone/URL Metadatas */}
            <div className="flex items-center justify-between text-xs px-1">
              {b.primaryContact ? (
                <span className="flex items-center gap-1.5 text-zinc-400 font-mono">
                  <PhoneCall className="w-3.5 h-3.5 text-zinc-550 shrink-0" />
                  {b.primaryContact}
                </span>
              ) : (
                <span className="text-zinc-650 italic text-[11px]">No contact info</span>
              )}

              {b.websiteURL ? (
                <a 
                  href={b.websiteURL} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="flex items-center gap-1 text-blue-450 hover:text-blue-400 transition-colors hover:underline"
                >
                  <Globe className="w-3.5 h-3.5 shrink-0" />
                  Web Profile
                </a>
              ) : (
                <span className="text-zinc-650 italic text-[11px]">No website URL</span>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 border-t border-zinc-850/50 pt-3">
              <Button 
                onClick={() => onEdit(b)} 
                variant="outline" 
                className="flex-1 h-9 border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-white rounded-xl text-xs font-semibold gap-1.5"
              >
                <Edit2 className="w-3.5 h-3.5" /> Edit
              </Button>
              <Button 
                onClick={() => onDelete(b._id)} 
                variant="ghost" 
                className="h-9 w-9 p-0 text-zinc-500 hover:text-rose-400 hover:bg-rose-950/15 rounded-xl transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
