"use client";

import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="w-full min-h-screen bg-[#09090b] text-white p-6 space-y-6">
      {/* Top Header Row Layout */}
      <div className="flex justify-between items-center border-b border-zinc-800 pb-5">
        <Skeleton className="h-7 w-64 bg-zinc-800" />
        <Skeleton className="h-9 w-32 bg-zinc-800 rounded-xl" />
      </div>

      {/* Filter Bar Row Layout */}
      <div className="bg-[#0c0c0e] border border-zinc-800 rounded-2xl p-6 space-y-4">
        <div className="flex gap-3">
          <Skeleton className="h-11 w-full bg-zinc-800 rounded-xl" />
          <Skeleton className="h-11 w-48 bg-zinc-800 rounded-xl" />
          <Skeleton className="h-11 w-11 bg-zinc-800 rounded-xl" />
        </div>

        {/* Table Dummy Layout Rows using your shadcn Skeleton */}
        <div className="border border-zinc-800 rounded-xl overflow-hidden space-y-2 p-4 bg-zinc-900/10">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 h-12">
              <Skeleton className="h-5 w-8 bg-zinc-800" />
              <Skeleton className="h-10 w-10 bg-zinc-800 rounded-xl" />
              <Skeleton className="h-5 w-32 bg-zinc-800" />
              <Skeleton className="h-5 w-48 bg-zinc-800" />
              <Skeleton className="h-8 w-24 bg-zinc-800 rounded-lg ml-auto" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}