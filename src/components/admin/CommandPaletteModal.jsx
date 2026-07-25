"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { 
  TrendingUp, 
  Package, 
  Layers, 
  ShoppingBag, 
  Users, 
  CreditCard, 
  Shield, 
  Settings, 
  FolderTree, 
  Tag,
  Loader2,
  Search,
  ExternalLink
} from "lucide-react";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from "@/components/ui/command";
import { useQuickAddStore } from "@/store/useQuickAddStore";

const ADMIN_PAGES = [
  { name: "Dashboard", href: "/admin/dashboard", icon: TrendingUp },
  { name: "Products", href: "/admin/products", icon: Package },
  { name: "Categories", href: "/admin/categories", icon: FolderTree },
  { name: "Brands", href: "/admin/brands", icon: Tag },
  { name: "Orders", href: "/admin/orders", icon: ShoppingBag },
  { name: "Customers", href: "/admin/customers", icon: Users },
  { name: "Inventory", href: "/admin/inventory", icon: Layers },
  { name: "Payments", href: "/admin/payments", icon: CreditCard },
  { name: "Team Members", href: "/admin/team-members", icon: Shield },
  { name: "Settings", href: "/admin/settings", icon: Settings },
];

export default function CommandPaletteModal() {
  const router = useRouter();
  const { isCommandPaletteOpen, setCommandPaletteOpen } = useQuickAddStore();

  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState({
    products: [],
    orders: [],
    customers: [],
  });

  // Global Ctrl+K / Cmd+K listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCommandPaletteOpen(!isCommandPaletteOpen);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isCommandPaletteOpen, setCommandPaletteOpen]);

  // Debounced search logic for live API results (products, orders, customers)
  useEffect(() => {
    if (!query || query.trim().length < 2) {
      setSearchResults({ products: [], orders: [], customers: [] });
      setIsSearching(false);
      return;
    }

    setIsSearching(true);

    const timer = setTimeout(async () => {
      try {
        const [prodRes, orderRes, custRes] = await Promise.allSettled([
          axios.get("/api/admin/products", { params: { search: query, limit: 4 } }),
          axios.get("/api/admin/orders", { params: { search: query, limit: 4 } }),
          axios.get("/api/admin/customers", { params: { search: query, limit: 4 } }),
        ]);

        const products = prodRes.status === "fulfilled" ? prodRes.value.data?.data?.products || [] : [];
        const orders = orderRes.status === "fulfilled" ? orderRes.value.data?.data?.orders || [] : [];
        const customers = custRes.status === "fulfilled" ? custRes.value.data?.data?.customers || [] : [];

        setSearchResults({
          products: products.slice(0, 4),
          orders: orders.slice(0, 4),
          customers: customers.slice(0, 4),
        });
      } catch (err) {
        console.error("Command palette search error:", err);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = useCallback(
    (href) => {
      setCommandPaletteOpen(false);
      setQuery("");
      if (href) {
        router.push(href);
      }
    },
    [router, setCommandPaletteOpen]
  );

  const hasLiveResults =
    searchResults.products.length > 0 ||
    searchResults.orders.length > 0 ||
    searchResults.customers.length > 0;

  return (
    <CommandDialog open={isCommandPaletteOpen} onOpenChange={setCommandPaletteOpen}>
      <CommandInput
        placeholder="Type an admin page, product, order #, or customer name... (Ctrl+K)"
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        {isSearching && (
          <div className="flex items-center justify-center py-6 text-xs text-zinc-500 gap-2 font-mono">
            <Loader2 className="w-4 h-4 animate-spin text-primary-600" />
            <span>Searching live inventory, orders & customers...</span>
          </div>
        )}

        <CommandEmpty>No matching pages or records found.</CommandEmpty>

        {/* SECTION 1: PAGES */}
        <CommandGroup heading="Pages & Modules">
          {ADMIN_PAGES.map((page) => {
            const Icon = page.icon;
            return (
              <CommandItem key={page.href} onSelect={() => handleSelect(page.href)}>
                <div className="w-6 h-6 rounded-lg bg-primary-50 border border-primary-200 text-primary-600 flex items-center justify-center shrink-0">
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <span className="font-extrabold text-gray-900">{page.name}</span>
                <span className="ml-auto font-mono text-[10px] text-zinc-500">{page.href}</span>
              </CommandItem>
            );
          })}
        </CommandGroup>

        {/* SECTION 2: LIVE SEARCH RESULTS */}
        {hasLiveResults && <CommandSeparator />}

        {searchResults.products.length > 0 && (
          <CommandGroup heading="Products">
            {searchResults.products.map((prod) => (
              <CommandItem key={prod._id} onSelect={() => handleSelect(`/admin/products`)}>
                <div className="w-6 h-6 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 flex items-center justify-center shrink-0">
                  <Package className="w-3.5 h-3.5" />
                </div>
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="font-bold text-gray-900 truncate">{prod.name}</span>
                  <span className="text-[10px] text-zinc-500 font-mono">
                    Stock: {prod.stock || 0} • ₹{prod.sellingPrice}
                  </span>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-zinc-400 ml-auto shrink-0" />
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {searchResults.orders.length > 0 && (
          <CommandGroup heading="Orders">
            {searchResults.orders.map((order) => (
              <CommandItem key={order._id} onSelect={() => handleSelect(`/admin/orders/${order._id}`)}>
                <div className="w-6 h-6 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-600 flex items-center justify-center shrink-0">
                  <ShoppingBag className="w-3.5 h-3.5" />
                </div>
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="font-mono font-bold text-gray-900">#{order.orderNumber}</span>
                  <span className="text-[10px] text-zinc-500">
                    Status: <span className="text-blue-600 font-semibold">{order.status}</span> • ₹{order.totalAmount}
                  </span>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-zinc-400 ml-auto shrink-0" />
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {searchResults.customers.length > 0 && (
          <CommandGroup heading="Customers">
            {searchResults.customers.map((cust) => (
              <CommandItem key={cust._id} onSelect={() => handleSelect(`/admin/customers/${cust._id}`)}>
                <div className="w-6 h-6 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-600 flex items-center justify-center shrink-0">
                  <Users className="w-3.5 h-3.5" />
                </div>
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="font-bold text-gray-900 truncate">{cust.name}</span>
                  <span className="text-[10px] text-zinc-500 font-mono">{cust.phone}</span>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-zinc-400 ml-auto shrink-0" />
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}
