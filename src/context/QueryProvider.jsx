"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

export default function QueryProvider({ children }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 5, // 5 mint tak data ekdam fresh mana jayega (No unnecessary fetch)
            refetchOnWindowFocus: false, // Dad jab doosre tab se wapas dashboard par aayenge toh faltu reload nahi hoga
            retry: 3, // Agar internet jhatka khaye toh automatic 3 baar retry karega
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}