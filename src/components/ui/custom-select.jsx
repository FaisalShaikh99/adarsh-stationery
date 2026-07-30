"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";

export function CustomSelect({ 
  options = [], 
  value, 
  onChange, 
  placeholder = "-- Choose Option --", 
  className = "" 
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

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
        <div className="absolute top-full left-0 right-0 mt-1.5 z-50 bg-white/95 backdrop-blur-2xl border border-border-subtle rounded-2xl p-1.5 shadow-2xl max-h-56 overflow-y-auto space-y-0.5 custom-scrollbar animate-in fade-in zoom-in-95 duration-150">
          {options.length === 0 ? (
            <div className="px-3 py-2 text-xs text-zinc-400 text-center font-medium">No options available</div>
          ) : (
            options.map((opt) => {
              const isSelected = String(opt.value) === String(value);
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
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
      )}
    </div>
  );
}
