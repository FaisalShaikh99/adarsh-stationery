"use client";

import { useState } from "react";
import Link from "next/link";
import axios from "axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { 
  Download, 
  Loader2, 
  Calendar, 
  User, 
  Phone, 
  MapPin, 
  CreditCard, 
  Clock,
  Mail,
  X,
  ExternalLink,
  Package,
  Sparkles,
  CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { jsPDF } from "jspdf";

const statusClasses = {
  Pending: "bg-amber-100 text-amber-900 border border-amber-300 font-black",
  Confirmed: "bg-sky-100 text-sky-900 border border-sky-300 font-black",
  Shipped: "bg-purple-100 text-purple-900 border border-purple-300 font-black",
  Delivered: "bg-emerald-100 text-emerald-900 border border-emerald-300 font-black",
  Cancelled: "bg-rose-100 text-rose-900 border border-rose-300 font-black",
};

const paymentStatusClasses = {
  Paid: "bg-emerald-100 text-emerald-900 border border-emerald-300 font-black",
  Pending: "bg-amber-100 text-amber-900 border border-amber-300 font-black",
  Failed: "bg-rose-100 text-rose-900 border border-rose-300 font-black",
};

const allowedTransitions = {
  Pending: ["Confirmed", "Cancelled"],
  Confirmed: ["Shipped", "Cancelled"],
  Shipped: ["Delivered", "Cancelled"],
  Delivered: [],
  Cancelled: [],
};

function formatCurrency(amount) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount || 0);
}

function formatDate(dateString) {
  if (!dateString) return "—";
  return new Date(dateString).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function OrderDetailDrawer({ orderId, isOpen, onClose }) {
  const queryClient = useQueryClient();

  const { data: order, isLoading, error } = useQuery({
    queryKey: ["order", orderId],
    queryFn: async () => {
      if (!orderId) return null;
      const res = await axios.get(`/api/admin/orders/${orderId}`);
      return res.data?.data;
    },
    enabled: !!orderId && isOpen,
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, nextStatus }) => axios.patch(`/api/admin/orders/${id}/status`, { status: nextStatus }),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["order", orderId] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardData"] });
      toast.success(response.data?.message || "Order status updated!");
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to update order status");
    },
  });

  if (!isOpen) return null;

  const handleDownloadInvoice = () => {
    if (!order) return;
    const doc = new jsPDF();

    // 1. TOP LEFT: COMPANY BRANDING
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(155, 102, 212); // Brand Purple
    doc.text("ADARSH STATIONERY", 14, 18);

    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.setFont("helvetica", "normal");
    doc.text("Official Tax Invoice", 14, 24);
    doc.text(`Invoice Date: ${new Date().toLocaleDateString("en-IN")}`, 14, 29);

    // 2. TOP RIGHT CORNER: LOGO BADGE (x=150, y=8, w=46, h=18)
    doc.setFillColor(245, 243, 255);
    doc.roundedRect(150, 8, 46, 18, 3, 3, "F");
    doc.setDrawColor(216, 165, 233);
    doc.roundedRect(150, 8, 46, 18, 3, 3, "D");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(126, 34, 206);
    doc.text("ADARSH LOGO", 173, 16, { align: "center" });
    doc.setFontSize(7);
    doc.setTextColor(107, 33, 168);
    doc.text("STATIONERY MART", 173, 21, { align: "center" });

    // Divider Line
    doc.setDrawColor(220, 220, 225);
    doc.line(14, 34, 196, 34);

    // 3. INVOICE ORDER & SHIPPING DETAILS
    doc.setTextColor(30, 30, 35);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text(`Order Ref: ${order.orderNumber}`, 14, 43);
    doc.text(`Payment Method: ${order.paymentMethod || "COD"}`, 14, 48);

    doc.setFont("helvetica", "bold");
    doc.text("Customer & Shipping Address:", 110, 43);
    doc.setFont("helvetica", "normal");
    doc.text(`${order.customer?.name || "Customer"}`, 110, 48);
    doc.text(`${order.shippingAddress?.street || ""}`, 110, 53);
    doc.text(`${order.shippingAddress?.city || ""}, ${order.shippingAddress?.state || ""} - ${order.shippingAddress?.postalCode || ""}`, 110, 58);

    let y = 70;
    doc.setFont("helvetica", "bold");
    doc.text("Item", 14, y);
    doc.text("Qty", 120, y);
    doc.text("Price", 150, y);
    doc.text("Total", 180, y);
    doc.line(14, y + 2, 196, y + 2);

    y += 8;
    doc.setFont("helvetica", "normal");
    order.items?.forEach((item) => {
      const title = item.product?.name || item.productName || "Product Item";
      const qty = item.quantity || 1;
      const price = item.pricePerUnit || item.price || 0;
      const total = qty * price;

      doc.text(title.slice(0, 45), 14, y);
      doc.text(`${qty}`, 120, y);
      doc.text(`INR ${price}`, 150, y);
      doc.text(`INR ${total}`, 180, y);
      y += 6;

      if (y > 270) {
        doc.addPage();
        y = 20;
      }
    });

    doc.line(14, y - 2, 196, y - 2);

    y += 6;
    doc.setFont("helvetica", "bold");
    doc.text("Grand Total:", 150, y, { align: "right" });
    doc.text(`INR ${order.totalAmount.toFixed(2)}`, 190, y, { align: "right" });

    doc.setFont("helvetica", "italic");
    doc.setFontSize(8);
    doc.text("Thank you for shopping with Adarsh Stationery!", 14, 280);

    doc.save(`invoice-${order.orderNumber}.pdf`);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end font-sans">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity animate-in fade-in duration-200" 
        onClick={onClose} 
      />

      {/* Drawer Container */}
      <div className="relative w-full sm:w-[88vw] lg:w-[48%] max-w-[720px] bg-gradient-to-br from-[#9B66D4] via-[#B885E2] to-[#D8A5E9] border-l border-white/30 h-full flex flex-col shadow-2xl z-10 animate-in slide-in-from-right duration-300 text-white sm:rounded-l-[36px] overflow-hidden">
        
        {/* FIXED DRAWER HEADER */}
        <div className="flex items-center justify-between border-b border-white/25 p-3.5 sm:p-6 shrink-0 bg-white/10 backdrop-blur-xl sticky top-0 z-20">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 pr-1">
            <div>
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2.5">
                <h3 className="text-lg sm:text-2xl font-black text-white font-mono tracking-tight truncate">{order?.orderNumber || "Loading Order..."}</h3>
                {order && (
                  <span className={`px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-xl text-[10px] sm:text-xs ${statusClasses[order.status] || "bg-white/20 text-white font-bold"}`}>
                    {order.status}
                  </span>
                )}
              </div>
              {order && (
                <p className="text-[11px] sm:text-xs text-purple-100 font-bold flex items-center gap-1.5 mt-0.5">
                  <Calendar className="w-3.5 h-3.5 text-white shrink-0" /> Placed on {formatDate(order.createdAt)}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {order && (
              <>
                <Button 
                  onClick={handleDownloadInvoice} 
                  className="bg-white text-purple-950 font-black rounded-2xl px-3 sm:px-4 h-9 sm:h-10 text-[11px] sm:text-xs hover:bg-purple-50 transition-all shadow-md shrink-0 flex items-center gap-1 cursor-pointer btn-modern"
                >
                  <Download className="w-3.5 h-3.5 text-purple-700" /> <span className="hidden xs:inline">Tax Invoice</span>
                </Button>
                <Link
                  href={`/admin/orders/${order._id}`}
                  className="p-1.5 sm:p-2 text-white/90 hover:text-white hover:bg-white/20 rounded-xl transition-colors cursor-pointer"
                  title="Open standalone page"
                >
                  <ExternalLink className="w-4 h-4 sm:w-5 sm:h-5" />
                </Link>
              </>
            )}
            <button 
              onClick={onClose} 
              className="p-1.5 sm:p-2 rounded-xl text-white/90 hover:text-white hover:bg-white/20 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>
        </div>

        {/* SCROLLABLE DRAWER CONTENT */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6 custom-scrollbar">
          {isLoading ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-white" />
            </div>
          ) : error || !order ? (
            <div className="p-8 text-center text-white font-black text-sm bg-rose-500/20 rounded-2xl border border-rose-400">
              Failed to load order record.
            </div>
          ) : (
            <>
              {/* STATUS TRANSITION PANEL */}
              <div className="bg-white/95 backdrop-blur-2xl border border-white/60 rounded-[24px] p-5 space-y-3 shadow-xl text-gray-900">
                <span className="text-xs text-purple-950 font-black uppercase tracking-wider block">Update Order Status</span>
                {allowedTransitions[order.status]?.length > 0 ? (
                  <div className="flex flex-wrap gap-2.5 items-center">
                    {allowedTransitions[order.status].map((next) => (
                      <Button
                        key={next}
                        onClick={() => statusMutation.mutate({ id: order._id, nextStatus: next })}
                        disabled={statusMutation.isPending}
                        className="bg-primary-600 text-white hover:bg-primary-700 font-black rounded-2xl px-4 h-10 text-xs shadow-md cursor-pointer btn-modern"
                      >
                        Mark as {next}
                      </Button>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-zinc-600 font-bold">Order status is terminal ({order.status}).</p>
                )}
              </div>

              {/* CUSTOMER INFORMATION CARD */}
              <div className="bg-white/95 backdrop-blur-2xl border border-white/60 rounded-[24px] p-5 space-y-3 shadow-xl text-gray-900">
                <span className="text-xs text-purple-950 font-black uppercase tracking-wider flex items-center gap-2">
                  <User className="w-4 h-4 text-purple-700" /> Customer Information
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-sans pt-2">
                  <div>
                    <span className="text-zinc-500 font-bold text-xs uppercase tracking-wider block">Full Name</span>
                    <p className="font-black text-gray-900 capitalize text-sm sm:text-base mt-0.5">{order.customer?.name || order.shippingAddress?.name || "Customer"}</p>
                  </div>
                  <div>
                    <span className="text-zinc-500 font-bold text-xs uppercase tracking-wider block">Email Address</span>
                    <p className="font-mono text-zinc-700 font-bold text-xs sm:text-sm mt-0.5">{order.customer?.email || "—"}</p>
                  </div>
                  <div>
                    <span className="text-zinc-500 font-bold text-xs uppercase tracking-wider block">Phone Number</span>
                    <p className="font-mono text-zinc-700 font-bold text-xs sm:text-sm mt-0.5">{order.customer?.phone || order.shippingAddress?.phone || "—"}</p>
                  </div>
                </div>
              </div>

              {/* SHIPPING ADDRESS CARD */}
              <div className="bg-white/95 backdrop-blur-2xl border border-white/60 rounded-[24px] p-5 space-y-3 shadow-xl text-gray-900">
                <span className="text-xs text-purple-950 font-black uppercase tracking-wider flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-purple-700" /> Delivery Address
                </span>
                <div className="text-xs sm:text-sm space-y-1 text-zinc-700 leading-relaxed font-sans pt-1">
                  <p className="font-black text-gray-900 text-sm sm:text-base">{order.shippingAddress?.fullName || order.shippingAddress?.name || order.customer?.name}</p>
                  <p className="font-semibold">{order.shippingAddress?.street || order.shippingAddress?.addressLine1}</p>
                  <p className="font-semibold">{order.shippingAddress?.city}, {order.shippingAddress?.state} - {order.shippingAddress?.postalCode || order.shippingAddress?.pincode}</p>
                  {(order.shippingAddress?.phoneNumber || order.shippingAddress?.phone) && (
                    <p className="font-mono font-bold text-xs text-zinc-600 mt-1">
                      Phone: {order.shippingAddress.phoneNumber || order.shippingAddress.phone}
                    </p>
                  )}
                </div>
              </div>

              {/* ORDERED ITEMS TABLE */}
              <div className="bg-white/95 backdrop-blur-2xl border border-white/60 rounded-[24px] p-5 space-y-3 shadow-xl text-gray-900">
                <span className="text-xs text-purple-950 font-black uppercase tracking-wider block">Ordered Stationery Items</span>
                <div className="overflow-x-auto rounded-2xl border border-border-subtle bg-white shadow-2xs">
                  <Table className="min-w-[480px] text-xs font-sans">
                    <TableHeader className="bg-primary-50/90 border-b border-border-subtle">
                      <TableRow className="uppercase text-xs">
                        <TableHead className="font-black text-primary-900">Product</TableHead>
                        <TableHead className="text-center font-black text-primary-900">Qty</TableHead>
                        <TableHead className="text-right font-black text-primary-900">Price</TableHead>
                        <TableHead className="text-right font-black text-primary-900">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {order.items?.map((item, idx) => {
                        const itemPrice = item.pricePerUnit || item.price || 0;
                        const subtotal = item.subtotal || (item.quantity * itemPrice) || 0;

                        return (
                          <TableRow key={idx} className="border-b border-border-subtle text-gray-900 bg-white">
                            <TableCell className="py-3">
                              <div className="flex items-center gap-2.5">
                                <div className="w-10 h-10 rounded-xl bg-white border border-border-subtle p-0.5 shrink-0 flex items-center justify-center overflow-hidden shadow-2xs">
                                  {item.product?.images?.[0] ? (
                                    <img src={item.product.images[0]} alt="" className="w-full h-full object-contain" />
                                  ) : (
                                    <span className="text-[8px] text-zinc-400">No img</span>
                                  )}
                                </div>
                                <span className="font-black text-xs sm:text-sm text-gray-900 truncate max-w-[200px]">{item.product?.name || item.productName || "Product"}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-center font-mono font-black py-3 text-xs sm:text-sm">{item.quantity}</TableCell>
                            <TableCell className="text-right font-mono font-bold py-3 text-zinc-600 text-xs sm:text-sm">₹{itemPrice}</TableCell>
                            <TableCell className="text-right font-mono font-black py-3 text-emerald-600 text-xs sm:text-sm">₹{subtotal}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* PAYMENT & FINANCIAL SUMMARY */}
              <div className="bg-white/95 backdrop-blur-2xl border border-white/60 rounded-[24px] p-5 space-y-3 shadow-xl text-gray-900">
                <span className="text-xs text-purple-950 font-black uppercase tracking-wider flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-purple-700" /> Financial Reconciliation
                </span>
                <div className="space-y-2.5 text-xs sm:text-sm font-mono border-t border-border-subtle pt-3">
                  <div className="flex justify-between text-zinc-600">
                    <span className="font-bold font-sans">Payment Method</span>
                    <span className="font-black text-gray-900">{order.paymentMethod || "COD"}</span>
                  </div>
                  <div className="flex justify-between text-zinc-600">
                    <span className="font-bold font-sans">Payment Status</span>
                    <span className={`px-2.5 py-0.5 rounded-lg text-xs ${paymentStatusClasses[order.paymentStatus] || "bg-zinc-100 text-zinc-700"}`}>
                      {order.paymentStatus}
                    </span>
                  </div>
                  <div className="flex justify-between text-base sm:text-lg font-black text-gray-900 pt-3 border-t border-border-subtle">
                    <span className="font-sans font-black">Grand Total Amount</span>
                    <span className="text-emerald-600 font-black font-mono">{formatCurrency(order.totalAmount)}</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

      </div>
    </div>
  );
}
