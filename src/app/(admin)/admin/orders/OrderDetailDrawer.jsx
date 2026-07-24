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
  Pending: "bg-amber-500/10 text-amber-300 border border-amber-500/25",
  Confirmed: "bg-sky-500/10 text-sky-300 border border-sky-500/25",
  Shipped: "bg-violet-500/10 text-violet-300 border border-violet-500/25",
  Delivered: "bg-emerald-500/10 text-emerald-300 border border-emerald-500/25",
  Cancelled: "bg-rose-500/10 text-rose-300 border border-rose-500/25",
};

const paymentStatusClasses = {
  Paid: "bg-emerald-500/10 text-emerald-300 border border-emerald-500/25",
  Pending: "bg-amber-500/10 text-amber-300 border border-amber-500/25",
  Failed: "bg-rose-500/10 text-rose-300 border border-rose-500/25",
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
      toast.success(response.data?.message || "Order status updated.");
      setSelectedNextStatus("");
      queryClient.invalidateQueries({ queryKey: ["order", orderId] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["order-stats"] });
    },
    onError: (error) => toast.error(error.response?.data?.message || "Unable to update order status."),
  });

  if (!isOpen || !orderId) return null;

  const allowedTargets = order ? (allowedTransitions[order.status] || []) : [];
  const isFinished = allowedTargets.length === 0;

  const handleDownloadInvoice = () => {
    if (!order) return;
    const doc = new jsPDF();

    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text("Adarsh Stationery", 14, 20);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Premium Stationery & Office Supplies", 14, 26);
    doc.line(14, 29, 196, 29);

    doc.setFont("helvetica", "bold");
    doc.text("INVOICE", 14, 38);
    doc.setFont("helvetica", "normal");
    doc.text(`Invoice No: INV-${order.orderNumber.split("-").pop()}`, 14, 44);
    doc.text(`Order ID: ${order.orderNumber}`, 14, 50);
    doc.text(`Date Placed: ${formatDate(order.createdAt)}`, 14, 56);

    doc.setFont("helvetica", "bold");
    doc.text("Shipping To:", 110, 38);
    doc.setFont("helvetica", "normal");
    doc.text(order.shippingAddress.name, 110, 44);
    doc.text(`Phone: ${order.shippingAddress.phone}`, 110, 50);
    doc.text(order.shippingAddress.addressLine1, 110, 56);
    if (order.shippingAddress.addressLine2) {
      doc.text(order.shippingAddress.addressLine2, 110, 62);
    }
    const cityStateZip = `${order.shippingAddress.city}, ${order.shippingAddress.state} - ${order.shippingAddress.pincode}`;
    doc.text(cityStateZip, 110, order.shippingAddress.addressLine2 ? 68 : 62);

    let y = order.shippingAddress.addressLine2 ? 80 : 74;
    doc.line(14, y - 6, 196, y - 6);

    doc.setFont("helvetica", "bold");
    doc.text("Item Description", 14, y);
    doc.text("Qty", 120, y, { align: "center" });
    doc.text("Price", 150, y, { align: "right" });
    doc.text("Subtotal", 190, y, { align: "right" });

    doc.line(14, y + 2, 196, y + 2);
    doc.setFont("helvetica", "normal");

    y += 8;
    order.items?.forEach((item) => {
      const cleanName = item.productName.length > 55 ? `${item.productName.substring(0, 52)}...` : item.productName;
      doc.text(cleanName, 14, y);
      doc.text(String(item.quantity), 120, y, { align: "center" });
      doc.text(`INR ${item.pricePerUnit.toFixed(2)}`, 150, y, { align: "right" });
      doc.text(`INR ${item.subtotal.toFixed(2)}`, 190, y, { align: "right" });
      y += 8;

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
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200" 
        onClick={onClose} 
      />

      {/* Drawer Container (45% viewport width on desktop with 700px max-width cap, full-width on mobile) */}
      <div className="relative w-full lg:w-[45%] max-w-[700px] bg-[#0c0c0e] border-l border-zinc-800 h-full flex flex-col shadow-2xl z-10 animate-in slide-in-from-right duration-300">
        
        {/* FIXED DRAWER HEADER */}
        <div className="flex items-center justify-between border-b border-zinc-800/80 p-5 shrink-0 bg-[#0c0c0e] sticky top-0 z-20">
          <div className="flex items-center gap-3 min-w-0 pr-2">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-tight">{order?.orderNumber || "Loading Order..."}</h3>
                {order && (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusClasses[order.status] || "bg-zinc-800 text-zinc-400 border-zinc-700"}`}>
                    {order.status}
                  </span>
                )}
              </div>
              {order && (
                <p className="text-[11px] text-zinc-400 flex items-center gap-1 mt-0.5">
                  <Calendar className="w-3 h-3 text-zinc-500" /> Placed on {formatDate(order.createdAt)}
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
                  className="border-zinc-800 bg-zinc-900 text-zinc-300 rounded-xl px-3 h-8 text-xs font-semibold hover:bg-zinc-800 hover:text-white transition-all shadow-sm shrink-0 flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" /> Invoice
                </Button>
                <Link
                  href={`/admin/orders/${order._id}`}
                  className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
                  title="Open standalone page"
                >
                  <ExternalLink className="w-4 h-4" />
                </Link>
              </>
            )}
            <button 
              onClick={onClose} 
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* SCROLLABLE DRAWER BODY */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar">
          {isLoading ? (
            <div className="py-20 text-center space-y-3">
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin mx-auto" />
              <p className="text-xs text-zinc-400 font-medium">Fetching order breakdown...</p>
            </div>
          ) : error || !order ? (
            <div className="py-12 text-center space-y-3 text-rose-400 text-xs">
              <p>Failed to load order details.</p>
            </div>
          ) : (
            <>
              {/* Customer & Shipping Card */}
              <div className="bg-[#121215] border border-zinc-800/80 p-4 rounded-2xl space-y-3">
                <h4 className="text-xs font-bold text-zinc-300 flex items-center gap-2 uppercase tracking-wider">
                  <User className="w-3.5 h-3.5 text-blue-400" /> Customer & Shipping Details
                </h4>
                <div className="grid gap-3 sm:grid-cols-2 text-xs border-t border-zinc-800/60 pt-3">
                  <div>
                    <p className="text-zinc-500 font-bold uppercase tracking-wider text-[10px]">Customer Name</p>
                    <p className="mt-0.5 font-bold text-zinc-100 text-xs capitalize">{order.shippingAddress?.name}</p>
                    <p className="text-zinc-400 mt-0.5 font-mono text-[11px]">{order.customer?.email || ""}</p>
                  </div>
                  <div>
                    <p className="text-zinc-500 font-bold uppercase tracking-wider text-[10px]">Phone Number</p>
                    <p className="mt-0.5 font-semibold text-zinc-200 text-xs flex items-center gap-1 font-mono">
                      <Phone className="w-3 h-3 text-zinc-500" /> {order.shippingAddress?.phone}
                    </p>
                  </div>
                  <div className="sm:col-span-2">
                    <p className="text-zinc-500 font-bold uppercase tracking-wider text-[10px]">Shipping Address</p>
                    <div className="mt-0.5 text-zinc-300 flex items-start gap-1.5 leading-snug text-xs">
                      <MapPin className="w-3.5 h-3.5 text-zinc-500 mt-0.5 shrink-0" />
                      <div>
                        <p>{order.shippingAddress?.addressLine1}</p>
                        {order.shippingAddress?.addressLine2 && <p>{order.shippingAddress?.addressLine2}</p>}
                        <p>{order.shippingAddress?.city}, {order.shippingAddress?.state} - {order.shippingAddress?.pincode}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Info Card */}
              <div className="bg-[#121215] border border-zinc-800/80 p-4 rounded-2xl space-y-3">
                <h4 className="text-xs font-bold text-zinc-300 flex items-center gap-2 uppercase tracking-wider">
                  <CreditCard className="w-3.5 h-3.5 text-emerald-400" /> Payment Information
                </h4>
                <div className="grid gap-3 sm:grid-cols-2 text-xs border-t border-zinc-800/60 pt-3">
                  <div>
                    <p className="text-zinc-500 font-bold uppercase tracking-wider text-[10px]">Payment Status</p>
                    <div className="mt-1">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${paymentStatusClasses[order.paymentStatus] || "bg-zinc-800 text-zinc-400 border-zinc-700"}`}>
                        {order.paymentStatus}
                      </span>
                    </div>
                  </div>
                  <div>
                    <p className="text-zinc-500 font-bold uppercase tracking-wider text-[10px]">Payment ID</p>
                    <p className="mt-1 font-mono text-zinc-300 text-xs">{order.paymentId || "—"}</p>
                  </div>
                </div>
              </div>

              {/* Order Items Table & Profit Breakdown */}
              <div className="bg-[#121215] border border-zinc-800/80 p-4 rounded-2xl space-y-3">
                <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Order Items & Profit Breakdown</h4>
                <div className="overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-950/40">
                  <Table className="min-w-[500px] text-xs">
                    <TableHeader className="bg-zinc-900/60">
                      <TableRow className="border-b border-zinc-800 hover:bg-transparent">
                        <TableHead className="font-semibold text-zinc-400 text-xs">Product</TableHead>
                        <TableHead className="font-semibold text-zinc-400 text-center w-14 text-xs">Qty</TableHead>
                        <TableHead className="font-semibold text-zinc-400 text-right w-20 text-xs">Cost Price</TableHead>
                        <TableHead className="font-semibold text-zinc-400 text-right w-20 text-xs">Sell Price</TableHead>
                        <TableHead className="font-semibold text-zinc-400 text-right w-24 text-xs">Profit/Item</TableHead>
                        <TableHead className="font-semibold text-zinc-400 text-right w-24 text-xs">Subtotal</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(() => {
                        let totalOrderProfit = 0;

                        return (
                          <>
                            {order.items?.map((item, idx) => {
                              const costPrice = item.costPricePerUnit !== undefined ? item.costPricePerUnit : 0;
                              const sellingPrice = item.pricePerUnit || 0;
                              const profitPerItem = sellingPrice - costPrice;
                              const itemTotalProfit = profitPerItem * item.quantity;
                              totalOrderProfit += itemTotalProfit;

                              return (
                                <TableRow key={idx} className="border-b border-zinc-800/60 hover:bg-zinc-900/20 transition-colors">
                                  <TableCell className="py-2.5">
                                    <div className="flex items-center gap-2.5">
                                      {item.product?.images?.[0] ? (
                                        <img 
                                          src={item.product.images[0]} 
                                          className="w-8 h-8 object-contain rounded-lg bg-white border border-zinc-800 p-0.5 shrink-0" 
                                          alt={item.productName} 
                                          referrerPolicy="no-referrer"
                                        />
                                      ) : (
                                        <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500 text-[8px] font-mono shrink-0">No Img</div>
                                      )}
                                      <span className="font-bold text-zinc-100 capitalize text-xs">{item.productName}</span>
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-center font-mono py-2.5 text-zinc-300 text-xs">{item.quantity}</TableCell>
                                  <TableCell className="text-right font-mono py-2.5 text-zinc-400 text-xs">₹{costPrice}</TableCell>
                                  <TableCell className="text-right font-mono py-2.5 text-zinc-300 text-xs">₹{sellingPrice}</TableCell>
                                  <TableCell className="text-right font-mono py-2.5 text-xs">
                                    <span className={`px-1.5 py-0.5 rounded font-bold ${profitPerItem >= 0 ? "text-emerald-400 bg-emerald-500/10 border border-emerald-500/20" : "text-rose-400 bg-rose-500/10 border border-rose-500/20"}`}>
                                      ₹{profitPerItem}
                                    </span>
                                  </TableCell>
                                  <TableCell className="text-right font-mono py-2.5 text-zinc-100 font-semibold text-xs">₹{item.subtotal}</TableCell>
                                </TableRow>
                              );
                            })}
                            <TableRow className="bg-zinc-900/60 border-t border-zinc-800">
                              <TableCell colSpan={5} className="py-2.5 text-zinc-400 text-xs font-semibold">Total Order Profit</TableCell>
                              <TableCell className="text-right font-mono py-2.5 text-xs text-emerald-400 font-bold">{formatCurrency(totalOrderProfit)}</TableCell>
                            </TableRow>
                            <TableRow className="bg-zinc-900/90 font-bold border-t border-zinc-700">
                              <TableCell colSpan={5} className="py-3 text-zinc-100 text-xs">Grand Total Amount</TableCell>
                              <TableCell className="text-right font-mono py-3 text-sm text-emerald-400">{formatCurrency(order.totalAmount)}</TableCell>
                            </TableRow>
                          </>
                        );
                      })()}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Status Update Control Card */}
              <div className="bg-[#121215] border border-zinc-800/80 p-4 rounded-2xl space-y-3">
                <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Update Order Status</h4>
                <div className="border-t border-zinc-800/60 pt-3">
                  {isFinished ? (
                    <p className="text-xs text-zinc-500 italic">This order is in a final state ({order.status}) and cannot be transitioned further.</p>
                  ) : (
                    <div className="flex gap-2 items-center">
                      <select 
                        value={selectedNextStatus} 
                        onChange={(e) => setSelectedNextStatus(e.target.value)}
                        className="flex-1 h-9 bg-[#1a1a1e] border border-zinc-700 rounded-xl px-3 text-xs font-semibold text-zinc-300 hover:text-white hover:border-zinc-500 transition-all outline-none cursor-pointer"
                      >
                        <option value="" className="bg-zinc-950 text-zinc-400">Choose next status...</option>
                        {allowedTargets.map(tgt => (
                          <option key={tgt} value={tgt} className="bg-zinc-950 text-zinc-200">{tgt}</option>
                        ))}
                      </select>
                      <Button 
                        onClick={() => {
                          if (!selectedNextStatus) return toast.error("Please select a status first.");
                          statusMutation.mutate({ id: order._id, nextStatus: selectedNextStatus });
                        }}
                        disabled={statusMutation.isPending || !selectedNextStatus}
                        className="bg-white text-black hover:bg-zinc-200 font-semibold rounded-xl text-xs px-4 h-9 cursor-pointer"
                      >
                        {statusMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Update"}
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Status History Timeline Card */}
              <div className="bg-[#121215] border border-zinc-800/80 p-4 rounded-2xl space-y-3">
                <h4 className="text-xs font-bold text-zinc-300 flex items-center gap-2 uppercase tracking-wider">
                  <Clock className="w-3.5 h-3.5 text-purple-400" /> Status Timeline
                </h4>
                <div className="border-t border-zinc-800/60 pt-4">
                  {order.statusHistory && order.statusHistory.length > 0 ? (
                    <div className="relative border-l border-zinc-800 pl-5 space-y-4 ml-2">
                      {[...order.statusHistory]
                        .sort((a, b) => new Date(b.changedAt) - new Date(a.changedAt))
                        .map((historyItem, idx) => (
                          <div key={idx} className="relative">
                            <span className={`absolute -left-[27px] top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full border bg-zinc-950 ${statusClasses[historyItem.status] || "border-zinc-700 bg-zinc-800"}`}>
                              <span className="h-1 w-1 rounded-full bg-current" />
                            </span>
                            <div>
                              <p className="text-xs font-bold text-zinc-100">{historyItem.status}</p>
                              <p className="text-[10px] text-zinc-500 font-mono mt-0.5">
                                {new Date(historyItem.changedAt).toLocaleString("en-IN", {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </p>
                            </div>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <p className="text-xs text-zinc-500 italic">No timeline entries available.</p>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
