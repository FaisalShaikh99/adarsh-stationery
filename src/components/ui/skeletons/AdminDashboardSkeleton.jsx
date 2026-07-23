"use client";

import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

export function AdminDashboardSkeleton() {
  return (
    <div className="w-full space-y-6 animate-in fade-in duration-300">
      {/* Dashboard Top Banner Skeleton */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-zinc-900/80 via-zinc-900/40 to-zinc-900/80 border border-zinc-800/80 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-72 bg-zinc-800/80 rounded-xl" />
          <Skeleton className="h-4 w-96 bg-zinc-800/40 rounded-md" />
        </div>
        <Skeleton className="h-10 w-36 bg-blue-600/20 rounded-xl" />
      </div>

      {/* Stats Cards 4-Column Grid Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {[1, 2, 3, 4].map((item) => (
          <div key={item} className="p-5 rounded-2xl bg-zinc-900/40 border border-zinc-800/60 space-y-3 shadow-sm">
            <div className="flex justify-between items-center">
              <Skeleton className="h-4 w-28 bg-zinc-800/60 rounded" />
              <Skeleton className="h-9 w-9 rounded-xl bg-zinc-800/60" />
            </div>
            <Skeleton className="h-8 w-24 bg-zinc-800/80 rounded-lg" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-12 bg-emerald-500/20 rounded" />
              <Skeleton className="h-3 w-28 bg-zinc-900/60 rounded" />
            </div>
          </div>
        ))}
      </div>

      {/* Main Charts & Activity Row Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Large Chart Container */}
        <div className="lg:col-span-2 p-6 rounded-3xl bg-zinc-900/30 border border-zinc-800/60 space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Skeleton className="h-6 w-44 bg-zinc-800/80 rounded" />
              <Skeleton className="h-3 w-60 bg-zinc-900/60 rounded" />
            </div>
            <Skeleton className="h-8 w-28 bg-zinc-800/50 rounded-lg" />
          </div>
          <Skeleton className="h-64 w-full bg-zinc-800/30 rounded-2xl" />
        </div>

        {/* Side Stat Container */}
        <div className="p-6 rounded-3xl bg-zinc-900/30 border border-zinc-800/60 space-y-4">
          <Skeleton className="h-6 w-36 bg-zinc-800/80 rounded" />
          <div className="space-y-3 pt-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="p-3.5 rounded-xl bg-zinc-900/50 border border-zinc-800/40 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-8 w-8 rounded-lg bg-zinc-800/60" />
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-24 bg-zinc-800/70 rounded" />
                    <Skeleton className="h-3 w-16 bg-zinc-900/50 rounded" />
                  </div>
                </div>
                <Skeleton className="h-5 w-16 bg-zinc-800/60 rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
