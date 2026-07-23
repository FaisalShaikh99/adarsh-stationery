"use client";

import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

export function AdminTableSkeleton({ title = "Loading Management..." }) {
  return (
    <div className="w-full space-y-6 animate-in fade-in duration-300">
      {/* Header section skeleton */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800/80 pb-5">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64 bg-zinc-800/60 rounded-lg" />
          <Skeleton className="h-4 w-96 bg-zinc-900/80 rounded-md" />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-28 bg-zinc-800/50 rounded-xl" />
          <Skeleton className="h-10 w-36 bg-blue-600/20 rounded-xl" />
        </div>
      </div>

      {/* KPI / Stats cards row skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="p-4 rounded-2xl bg-zinc-900/40 border border-zinc-800/60 space-y-3">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-24 bg-zinc-800/60 rounded" />
              <Skeleton className="h-8 w-8 rounded-xl bg-zinc-800/50" />
            </div>
            <Skeleton className="h-7 w-20 bg-zinc-800/80 rounded-md" />
            <Skeleton className="h-3 w-32 bg-zinc-900/60 rounded" />
          </div>
        ))}
      </div>

      {/* Controls & Search bar skeleton */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-zinc-900/30 border border-zinc-800/50">
        <Skeleton className="h-10 w-full sm:w-80 bg-zinc-800/60 rounded-xl" />
        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <Skeleton className="h-10 w-24 bg-zinc-800/50 rounded-xl" />
          <Skeleton className="h-10 w-28 bg-zinc-800/50 rounded-xl" />
        </div>
      </div>

      {/* Table grid skeleton */}
      <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/20 overflow-hidden shadow-inner">
        <div className="p-4 bg-zinc-900/60 border-b border-zinc-800/80 flex items-center justify-between">
          <Skeleton className="h-5 w-40 bg-zinc-800/60 rounded" />
          <Skeleton className="h-5 w-24 bg-zinc-800/60 rounded" />
        </div>
        <div className="divide-y divide-zinc-800/40">
          {[1, 2, 3, 4, 5, 6].map((row) => (
            <div key={row} className="p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3.5 flex-1">
                <Skeleton className="h-10 w-10 rounded-xl bg-zinc-800/70 shrink-0" />
                <div className="space-y-1.5 flex-1">
                  <Skeleton className="h-4 w-48 bg-zinc-800/80 rounded" />
                  <Skeleton className="h-3 w-32 bg-zinc-900/60 rounded" />
                </div>
              </div>
              <Skeleton className="h-6 w-20 bg-zinc-800/40 rounded-full" />
              <Skeleton className="h-4 w-24 bg-zinc-800/50 rounded hidden md:block" />
              <Skeleton className="h-8 w-8 rounded-lg bg-zinc-800/40" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
