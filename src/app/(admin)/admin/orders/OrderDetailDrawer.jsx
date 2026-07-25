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
  ExternalLink
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { jsPDF } from "jspdf";

const statusClasses = {
  Pending: "bg-amber-500/10 text-amber-700 border border-amber-500/25 font-bold",
  Confirmed: "bg-sky-500/10 text-sky-700 border border-sky-500/25 font-bold",
  Shipped: "bg-purple-500/10 text-purple-700 border border-purple-500/25 font-bold",
  Delivered: "bg-emerald-500/10 text-emerald-700 border border-emerald-500/25 font-bold",
  Cancelled: "bg-rose-500/10 text-rose-700 border border-rose-500/25 font-bold",
};

const paymentStatusClasses = {
  Paid: "bg-emerald-500/10 text-emerald-700 border border-emerald-500/25 font-bold",
  Pending: "bg-amber-500/10 text-amber-700 border border-amber-500/25 font-bold",
  Failed: "bg-rose-500/10 text-rose-700 border border-rose-500/25 font-bold",
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
  });
}

export default function OrderDetailDrawer({ orderId, isOpen, onClose }) {
  const queryClient = useQueryClient();
  const [selectedNextStatus, setSelectedNextStatus] = useState("");

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
      setSelectedNextStatus("");
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to update order status");
    },
  });

  if (!isOpen) return null;

  const handleDownloadInvoice = () => {
    if (!order) return;
    const doc = new jsPDF();

    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text("ADARSH STATIONERY MART", 14, 20);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text("Official Tax Invoice", 14, 26);
    doc.text(`Invoice Date: ${new Date().toLocaleDateString("en-IN")}`, 14, 31);

    doc.line(14, 35, 196, 35);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text(`Order Ref: ${order.orderNumber}`, 14, 43);
    doc.text(`Payment Method: ${order.paymentMethod || "COD"}`, 14, 48);

    doc.setFont("helvetica", "bold");
    doc.text("Customer & Shipping Address:", 120, 43);
    doc.setFont("helvetica", "normal");
    doc.text(`${order.customer?.name || "Customer"}`, 120, 48);
    doc.text(`${order.shippingAddress?.street || ""}`, 120, 53);
    doc.text(`${order.shippingAddress?.city || ""}, ${order.shippingAddress?.state || ""} - ${order.shippingAddress?.postalCode || ""}`, 120, 58);

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
      const title = item.product?.name || "Product Item";
      const qty = item.quantity || 1;
      const price = item.price || 0;
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
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/30 backdrop-blur-xs transition-opacity animate-in fade-in duration-200" 
        onClick={onClose} 
      />

      {/* Drawer Container */}
      <div className="relative w-full lg:w-[45%] max-w-[700px] bg-white/95 backdrop-blur-2xl border-l border-border-subtle h-full flex flex-col shadow-2xl z-10 animate-in slide-in-from-right duration-300 text-gray-900">
        
        {/* FIXED DRAWER HEADER */}
        <div className="flex items-center justify-between border-b border-border-subtle p-5 shrink-0 bg-white/95 sticky top-0 z-20">
          <div className="flex items-center gap-3 min-w-0 pr-2">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-gray-900 tracking-tight">{order?.orderNumber || "Loading Order..."}</h3>
                {order && (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] ${statusClasses[order.status] || "bg-zinc-100 text-zinc-700 border-zinc-200"}`}>
                    {order.status}
                  </span>
                )}
              </div>
              {order && (
                <p className="text-[11px] text-zinc-500 flex items-center gap-1 mt-0.5">
                  <Calendar className="w-3 h-3 text-zinc-400" /> Placed on {formatDate(order.createdAt)}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {order && (
              <>
                <Button 
                  onClick={handleDownloadInvoice} 
                  variant="outline" 
                  className="border-border-subtle bg-bg-surface text-gray-900 rounded-xl px-3 h-8 text-xs font-semibold hover:bg-primary-50 transition-all shadow-xs shrink-0 flex items-center gap-1.5 cursor-pointer btn-modern"
                >
                  <Download className="w-3.5 h-3.5 text-primary-600" /> Invoice
                </Button>
                <Link
                  href={`/admin/orders/${order._id}`}
                  className="p-1.5 text-zinc-500 hover:text-gray-900 hover:bg-primary-50 rounded-lg transition-colors cursor-pointer"
                  title="Open standalone page"
                >
                  <ExternalLink className="w-4 h-4" />
                </Link>
              </>
            )}
            <button 
              onClick={onClose} 
              className="p-1.5 rounded-lg text-zinc-500 hover:text-gray-900 hover:bg-primary-50 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* SCROLLABLE DRAWER CONTENT */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar">
          {isLoading ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
            </div>
          ) : error || !order ? (
            <div className="p-8 text-center text-rose-600 font-semibold text-xs">
              Failed to load order record.
            </div>
          ) : (
            <>
              {/* STATUS TRANSITION PANEL */}
              <div className="bg-bg-surface border border-border-subtle rounded-2xl p-4 space-y-3 shadow-xs">
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Update Order Status</span>
                {allowedTransitions[order.status]?.length > 0 ? (
                  <div className="flex flex-wrap gap-2 items-center">
                    {allowedTransitions[order.status].map((next) => (
                      <Button
                        key={next}
                        onClick={() => statusMutation.mutate({ id: order._id, nextStatus: next })}
                        disabled={statusMutation.isPending}
                        className="bg-primary-600 text-white hover:bg-primary-700 rounded-xl px-3 h-8 text-xs font-bold shadow-xs cursor-pointer btn-modern"
                      >
                        Mark as {next}
                      </Button>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-zinc-500 font-medium">Order status is terminal ({order.status}).</p>
                )}
              </div>

              {/* CUSTOMER INFORMATION CARD */}
              <div className="bg-bg-surface border border-border-subtle rounded-2xl p-4 space-y-3 shadow-xs">
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-primary-600" /> Customer Information
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-zinc-500 text-[11px]">Full Name</span>
                    <p className="font-bold text-gray-900 capitalize mt-0.5">{order.customer?.name || "Customer unavailable"}</p>
                  </div>
                  <div>
                    <span className="text-zinc-500 text-[11px]">Email Address</span>
                    <p className="font-mono text-zinc-700 mt-0.5">{order.customer?.email || "—"}</p>
                  </div>
                  <div>
                    <span className="text-zinc-500 text-[11px]">Phone Number</span>
                    <p className="font-mono text-zinc-700 mt-0.5">{order.customer?.phone || "—"}</p>
                  </div>
                </div>
              </div>

              {/* SHIPPING ADDRESS CARD */}
              <div className="bg-bg-surface border border-border-subtle rounded-2xl p-4 space-y-3 shadow-xs">
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-primary-600" /> Shipping Address
                </span>
                <div className="text-xs space-y-1 text-zinc-700 leading-relaxed">
                  <p className="font-bold text-gray-900">{order.shippingAddress?.fullName || order.customer?.name}</p>
                  <p>{order.shippingAddress?.street}</p>
                  <p>{order.shippingAddress?.city}, {order.shippingAddress?.state} - {order.shippingAddress?.postalCode}</p>
                  {order.shippingAddress?.phoneNumber && <p className="font-mono text-[11px] text-zinc-600">Phone: {order.shippingAddress.phoneNumber}</p>}
                </div>
              </div>

              {/* ORDERED ITEMS TABLE */}
              <div className="bg-bg-surface border border-border-subtle rounded-2xl p-4 space-y-3 shadow-xs">
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Ordered Items</span>
                <div className="overflow-x-auto rounded-xl border border-border-subtle bg-white">
                  <Table className="min-w-[450px] text-xs">
                    <TableHeader className="bg-primary-50/90 border-b border-border-subtle">
                      <TableRow className="uppercase text-[10px]">
                        <TableHead className="font-bold text-primary-800">Product</TableHead>
                        <TableHead className="text-center font-bold text-primary-800">Qty</TableHead>
                        <TableHead className="text-right font-bold text-primary-800">Price</TableHead>
                        <TableHead className="text-right font-bold text-primary-800">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {order.items?.map((item, idx) => (
                        <TableRow key={idx} className="border-b border-border-subtle text-gray-900">
                          <TableCell className="py-2.5">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-lg bg-white border border-border-subtle p-0.5 shrink-0 flex items-center justify-center overflow-hidden">
                                {item.product?.images?.[0] ? (
                                  <img src={item.product.images[0]} alt="" className="w-full h-full object-contain" />
                                ) : (
                                  <span className="text-[8px] text-zinc-400">No img</span>
                                )}
                              </div>
                              <span className="font-bold text-xs truncate max-w-[180px]">{item.product?.name || "Product"}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-center font-mono font-bold py-2.5">{item.quantity}</TableCell>
                          <TableCell className="text-right font-mono py-2.5 text-zinc-600">₹{item.price}</TableCell>
                          <TableCell className="text-right font-mono font-bold py-2.5 text-gray-900">₹{item.quantity * item.price}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* PAYMENT & FINANCIAL SUMMARY */}
              <div className="bg-bg-surface border border-border-subtle rounded-2xl p-4 space-y-3 shadow-xs">
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-primary-600" /> Payment & Financial Summary
                </span>
                <div className="space-y-2 text-xs font-mono border-t border-border-subtle pt-3">
                  <div className="flex justify-between text-zinc-600">
                    <span>Payment Method</span>
                    <span className="font-bold text-gray-900">{order.paymentMethod || "COD"}</span>
                  </div>
                  <div className="flex justify-between text-zinc-600">
                    <span>Payment Status</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] ${paymentStatusClasses[order.paymentStatus] || "bg-zinc-100 text-zinc-700"}`}>
                      {order.paymentStatus}
                    </span>
                  </div>
                  <div className="flex justify-between text-base font-bold text-gray-900 pt-2 border-t border-border-subtle">
                    <span>Total Amount Paid</span>
                    <span className="text-emerald-600 font-extrabold">{formatCurrency(order.totalAmount)}</span>
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
