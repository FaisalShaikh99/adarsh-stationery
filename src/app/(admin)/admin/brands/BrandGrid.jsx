"use client";

import { Edit2, Trash2, PhoneCall, Globe, Package, Layers, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function BrandGrid({ brands, isLoading, onEdit, onDelete, onAddClick }) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 py-10">
        {[1, 2, 3].map((n) => (
          <div key={n} className="bg-white border border-border-subtle rounded-[24px] p-6 space-y-4 animate-pulse">
            <div className="w-20 h-20 bg-primary-50 rounded-2xl mx-auto" />
            <div className="h-6 bg-primary-50 rounded-md w-3/4 mx-auto" />
            <div className="h-4 bg-primary-50 rounded-md w-1/2 mx-auto" />
            <div className="h-10 bg-primary-50 rounded-md w-full" />
          </div>
        ))}
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
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {brands.map((b) => (
        <div 
          key={b._id} 
          className="bg-white border border-border-subtle hover:border-primary-400 rounded-[24px] p-5 flex flex-col justify-between transition-all duration-300 group shadow-2xs hover:shadow-md text-gray-900"
        >
          <div className="space-y-3">
            {/* Logo Container */}
            <div className="relative w-16 h-16 mx-auto rounded-2xl bg-white border border-border-subtle flex items-center justify-center p-2 overflow-hidden shadow-xs group-hover:scale-105 transition-transform duration-300">
              <img 
                src={b.logo || "https://placehold.co/100"} 
                alt={b.name} 
                className="h-full w-full object-contain"
                referrerPolicy="no-referrer"
                onError={(e) => { e.target.src = "https://placehold.co/100"; }}
              />
            </div>

            {/* Info Section */}
            <div className="text-center space-y-1">
              <h3 className="font-black text-gray-900 text-sm capitalize tracking-tight line-clamp-1">{b.name}</h3>
              {b.description ? (
                <p className="text-xs text-zinc-600 font-medium line-clamp-2 px-1 min-h-[32px] leading-snug">{b.description}</p>
              ) : (
                <p className="text-xs text-zinc-400 italic font-medium px-1 min-h-[32px]">No description registered for this profile.</p>
              )}
            </div>

            {/* Product Count Pill */}
            <div className="flex justify-center">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-black shadow-2xs">
                <Package className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
                <span>{b.productCount || 0} Products</span>
              </div>
            </div>

            {/* Associated Categories */}
            <div className="border-t border-border-subtle pt-3 space-y-1.5">
              <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-zinc-400" /> Associated Categories
              </p>
              <div className="flex flex-wrap gap-1.5 max-h-[85px] overflow-y-auto custom-scrollbar p-0.5">
                {b.categories?.map((cat) => (
                  <span 
                    key={cat._id} 
                    className="text-xs bg-primary-50 text-primary-700 border border-primary-200 px-2 py-0.5 rounded-lg font-bold capitalize shadow-2xs"
                  >
                    {cat.name}
                  </span>
                ))}
                {(!b.categories || b.categories.length === 0) && (
                  <span className="text-xs text-zinc-400 italic font-medium">No categories mapped</span>
                )}
              </div>
            </div>
          </div>

          {/* Card Footer Actions */}
          <div className="flex items-center justify-end gap-2 border-t border-border-subtle pt-3 mt-4">
            <Button 
              onClick={() => onEdit(b)} 
              variant="outline" 
              className="h-8 px-3 border-border-subtle bg-bg-surface text-gray-900 hover:text-primary-700 hover:bg-primary-50 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer shadow-2xs btn-modern"
            >
              <Edit2 className="w-3.5 h-3.5 text-primary-600" /> Edit
            </Button>
            <Button 
              onClick={() => onDelete(b._id)} 
              variant="ghost" 
              className="h-8 w-8 p-0 text-rose-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
