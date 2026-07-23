"use client";

import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

export function AdminFormSkeleton() {
  return (
    <div className="w-full space-y-6 max-w-4xl mx-auto animate-in fade-in duration-300">
      {/* Form Page Header Skeleton */}
      <div className="space-y-2 border-b border-zinc-800/80 pb-5">
        <Skeleton className="h-8 w-56 bg-zinc-800/80 rounded-lg" />
        <Skeleton className="h-4 w-96 bg-zinc-900/80 rounded-md" />
      </div>

      {/* Tabs Skeleton */}
      <div className="flex items-center gap-3 border-b border-zinc-800/60 pb-3">
        <Skeleton className="h-10 w-28 bg-zinc-800/70 rounded-xl" />
        <Skeleton className="h-10 w-28 bg-zinc-900/50 rounded-xl" />
        <Skeleton className="h-10 w-28 bg-zinc-900/50 rounded-xl" />
      </div>

      {/* Main Form Content Card */}
      <div className="p-6 rounded-3xl bg-zinc-900/30 border border-zinc-800/60 space-y-6">
        {/* Avatar/Header row */}
        <div className="flex items-center gap-4">
          <Skeleton className="h-16 w-16 rounded-full bg-zinc-800/80" />
          <div className="space-y-2">
            <Skeleton className="h-5 w-40 bg-zinc-800/80 rounded" />
            <Skeleton className="h-3.5 w-60 bg-zinc-900/60 rounded" />
          </div>
        </div>

        {/* Input fields grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
          {[1, 2, 3, 4].map((field) => (
            <div key={field} className="space-y-2">
              <Skeleton className="h-4 w-28 bg-zinc-800/70 rounded" />
              <Skeleton className="h-11 w-full bg-zinc-900/60 rounded-xl border border-zinc-800/40" />
            </div>
          ))}
        </div>

        {/* Action Button */}
        <div className="flex justify-end pt-4">
          <Skeleton className="h-11 w-36 bg-blue-600/30 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
