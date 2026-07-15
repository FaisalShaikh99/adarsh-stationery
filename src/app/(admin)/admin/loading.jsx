"use client";

import React from "react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

export default function AdminGlobalLoading() {
  return (
    <div className="w-full min-h-[80vh] flex flex-col items-center justify-center bg-transparent">
      <LoadingSpinner size={240} label="Loading Adarsh Stationery portal..." />
    </div>
  );
}
