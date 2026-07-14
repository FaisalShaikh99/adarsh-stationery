"use client";

import React from "react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

export default function Loading() {
  return (
    <div className="w-full min-h-[70vh] flex flex-col items-center justify-center bg-transparent">
      <LoadingSpinner size={160} label="Loading brands catalog..." />
    </div>
  );
}