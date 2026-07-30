"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Check, Search, Plus } from "lucide-react";

export function CustomSelect({ 
  options = [], 
  value, 
  onChange, 
  placeholder = "-- Choose Option --", 
  className = "",
  searchable = true,
  onAddNew = null,
  addLabel = "Option"
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const containerRef = useRef(null);
  const searchInputRef = useRef(null);

  const selectedOption = options.find(opt => String(opt.value) === String(value));

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && searchable && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      setSearchTerm("");
    }
  }, [isOpen, searchable]);

  const filteredOptions = options.filter(opt =>
    opt.label.toLowerCase().includes(searchTerm.trim().toLowerCase())
  );

  const exactMatchExists = options.some(
    opt => opt.label.trim().toLowerCase() === searchTerm.trim().toLowerCase()
  );

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-white border border-border-subtle hover:border-primary-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 rounded-2xl h-11 px-4 text-xs font-bold text-gray-900 flex items-center justify-between transition-all cursor-pointer shadow-2xs outline-none group"
      >
        <span className={selectedOption ? "text-gray-900 font-extrabold truncate" : "text-zinc-400 font-normal"}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown className={`w-4 h-4 text-zinc-500 transition-transform duration-200 shrink-0 ${isOpen ? "rotate-180 text-primary-600" : "group-hover:text-primary-600"}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1.5 z-50 bg-white/95 backdrop-blur-2xl border border-border-subtle rounded-2xl p-2 shadow-2xl max-h-64 overflow-y-auto space-y-1 custom-scrollbar animate-in fade-in zoom-in-95 duration-150">
          
          {/* Search Bar */}
          {searchable && (
            <div className="relative mb-1.5 px-1">
              <Search className="absolute left-3.5 top-2.5 w-3.5 h-3.5 text-zinc-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={`Search or add new ${addLabel.toLowerCase()}...`}
                className="w-full bg-zinc-50 border border-border-subtle rounded-xl h-8 pl-8 pr-3 text-xs font-semibold text-gray-900 placeholder-zinc-400 focus:outline-none focus:border-primary-400 focus:bg-white transition-all"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          )}

          {/* Options Feed */}
          <div className="space-y-0.5 max-h-40 overflow-y-auto custom-scrollbar">
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-2 text-xs text-zinc-400 text-center font-medium">
                No matching {addLabel.toLowerCase()}s found
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = String(opt.value) === String(value);
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      onChange(opt.value);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      isSelected
                        ? "bg-primary-50 text-primary-700 font-black border border-primary-100 shadow-2xs"
                        : "text-gray-800 hover:bg-primary-50/60 hover:text-primary-700"
                    }`}
                  >
                    <span className="truncate">{opt.label}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-primary-600 shrink-0" />}
                  </button>
                );
              })
            )}
          </div>

          {/* "+ Add [typed value]" Quick Add Button */}
          {onAddNew && searchTerm.trim().length > 0 && !exactMatchExists && (
            <div className="pt-1 border-t border-border-subtle mt-1">
              <button
                type="button"
                onClick={() => {
                  onAddNew(searchTerm.trim());
                  setIsOpen(false);
                }}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 text-xs font-black transition-all cursor-pointer shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                <span className="truncate">Add "{searchTerm.trim()}"</span>
              </button>
            </div>
          )}

        </div>
      )}
    </div>
  );
}
