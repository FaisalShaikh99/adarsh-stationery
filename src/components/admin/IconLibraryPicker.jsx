import React, { useState, useEffect } from "react";
import { Search, ArrowLeft, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const DEFAULT_ICONS = [
  "tabler:pencil",
  "tabler:notebook",
  "tabler:paperclip",
  "tabler:stapler",
  "tabler:highlight",
  "tabler:sticker",
  "tabler:eraser",
  "tabler:ruler",
  "tabler:scissors",
  "tabler:calculator",
  "tabler:backpack",
  "tabler:mail",
  "guidance:paper",
  "jam:glue",
  "game-icons:school-bag",
  "mdi:color",
  "wpf:ball-point-pen",
  "gridicons:ink"
];

export default function IconLibraryPicker({
  onSelect,
  onClose
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [icons, setIcons] = useState(DEFAULT_ICONS);
  const [isLoading, setIsLoading] = useState(false);
  const [failedIcons, setFailedIcons] = useState(new Set());

  // Input debouncing (400ms)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 400);

    return () => {
      clearTimeout(handler);
    };
  }, [searchQuery]);

  // Fetch search results from Iconify API
  useEffect(() => {
    const fetchIcons = async () => {
      const query = debouncedQuery.trim();
      if (query.length < 2) {
        setIcons(DEFAULT_ICONS);
        return;
      }

      setIsLoading(true);
      try {
        const res = await fetch(`https://api.iconify.design/search?query=${encodeURIComponent(query)}&limit=48`);
        if (res.ok) {
          const data = await res.json();
          setIcons(data.icons || []);
        } else {
          setIcons([]);
        }
      } catch (err) {
        console.error("Failed to search Iconify library:", err);
        setIcons([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchIcons();
  }, [debouncedQuery]);

  const handleImageError = (iconId) => {
    setFailedIcons((prev) => {
      const next = new Set(prev);
      next.add(iconId);
      return next;
    });
  };

  const handleIconClick = (iconId) => {
    const [prefix, name] = iconId.split(":");
    const iconUrl = `https://api.iconify.design/${prefix}/${name}.svg?color=%234F46E5`;
    if (onSelect) {
      onSelect(iconUrl);
    }
  };

  // Filter out failed icons
  const visibleIcons = icons.filter((id) => !failedIcons.has(id));

  return (
    <div className="space-y-4 bg-zinc-900 border border-zinc-800 p-4 rounded-xl text-white">
      {/* Top Header Row with Back Button */}
      <div className="flex items-center justify-between border-b border-zinc-850 pb-2">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            onClick={onClose}
            className="text-zinc-400 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-semibold tracking-wide uppercase text-zinc-300">
            Browse Icon Library
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-xs text-zinc-500 hover:text-zinc-300 underline"
        >
          Cancel
        </button>
      </div>

      {/* Search Input Box */}
      <div className="relative flex items-center">
        <Search className="absolute left-3 h-4 w-4 text-zinc-500 pointer-events-none" />
        <Input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search icons e.g. paper, pen, box..."
          className="pl-9 bg-zinc-950 border-zinc-800 text-white rounded-xl focus-visible:ring-blue-500 w-full"
        />
      </div>

      {/* Grid container */}
      <div className="max-h-[260px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 text-zinc-500 gap-2">
            <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
            <span className="text-xs">Searching Iconify catalog...</span>
          </div>
        ) : visibleIcons.length === 0 ? (
          <div className="text-center py-12 text-zinc-500 text-sm">
            No icons found, try another search term.
          </div>
        ) : (
          <div className="grid grid-cols-6 gap-2">
            {visibleIcons.map((iconId) => {
              const [prefix, name] = iconId.split(":");
              const iconUrl = `https://api.iconify.design/${prefix}/${name}.svg?color=%234F46E5`;
              const readableLabel = name.replace(/-/g, " ");

              return (
                <button
                  key={iconId}
                  type="button"
                  onClick={() => handleIconClick(iconId)}
                  title={readableLabel}
                  className="group flex flex-col items-center justify-center p-2 border border-zinc-800/80 bg-zinc-950/40 hover:bg-zinc-900 hover:border-zinc-700 hover:scale-105 rounded-xl transition-all aspect-square text-zinc-400 hover:text-white"
                >
                  <img
                    src={iconUrl}
                    alt={readableLabel}
                    onError={() => handleImageError(iconId)}
                    className="w-10 h-10 object-contain group-hover:scale-110 transition-transform p-0.5"
                    referrerPolicy="no-referrer"
                  />
                  <span className="text-[8px] text-zinc-500 group-hover:text-zinc-300 font-medium text-center line-clamp-1 mt-1.5 w-full truncate capitalize">
                    {readableLabel}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
