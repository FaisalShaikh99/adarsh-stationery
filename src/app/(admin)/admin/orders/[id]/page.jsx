"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { 
  ChevronLeft, 
  Download, 
  Loader2, 
  Calendar, 
  User, 
  Phone, 
  MapPin, 
  CreditCard, 
  ArrowLeft, 
  Clock,
  Mail
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { jsPDF } from "jspdf";

const statuses = ["Pending", "Confirmed", "Shipped", "Delivered", "Cancelled"];

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

function OrderDetailSkeleton() {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 animate-pulse">
      <div className="flex flex-wrap gap-3 justify-between items-center border-b border-zinc-800 pb-5">
        <div className="space-y-2">
          <div className="h-4 w-24 bg-zinc-800 rounded" />
          <div className="h-8 w-48 bg-zinc-800 rounded" />
          <div className="h-4 w-32 bg-zinc-800 rounded" />
        </div>
        <div className="h-9 w-28 bg-zinc-800 rounded-xl" />
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <div className="h-48 bg-[#0c0c0e] border border-zinc-800 rounded-2xl p-6" />
          <div className="h-64 bg-[#0c0c0e] border border-zinc-800 rounded-2xl p-6" />
        </div>
        <div className="space-y-6">
          <div className="h-32 bg-[#0c0c0e] border border-zinc-800 rounded-2xl p-6" />
          <div className="h-64 bg-[#0c0c0e] border border-zinc-800 rounded-2xl p-6" />
        </div>
      </div>
    </div>
  );
}

export default function OrderDetailPage() {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const [selectedNextStatus, setSelectedNextStatus] = useState("");

  const { data: order, isLoading, error } = useQuery({
    queryKey: ["order", id],
    queryFn: async () => {
      const res = await axios.get(`/api/admin/orders/${id}`);
      return res.data?.data;
    },
    enabled: !!id,
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, nextStatus }) => axios.patch(`/api/admin/orders/${id}/status`, { status: nextStatus }),
    onSuccess: (response) => {
      toast.success(response.data?.message || "Order status updated.");
      setSelectedNextStatus("");
      queryClient.invalidateQueries({ queryKey: ["order", id] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
    onError: (error) => toast.error(error.response?.data?.message || "Unable to update order status."),
  });

  if (isLoading) return <OrderDetailSkeleton />;

  if (error || !order) {
    return (
      <div className="mx-auto w-full max-w-7xl py-12 text-center space-y-4">
        <h1 className="text-xl font-bold text-white">Order Not Found</h1>
        <p className="text-zinc-400 text-sm">We couldn't retrieve details for the requested Order ID. It may not exist or has been deleted.</p>
        <Link href="/admin/orders" passHref>
          <Button variant="outline" className="border-zinc-800 bg-zinc-900 text-zinc-300 rounded-xl px-4 py-2 text-xs font-semibold">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Orders
          </Button>
        </Link>
      </div>
    );
  }

  const allowedTargets = allowedTransitions[order.status] || [];
  const isFinished = allowedTargets.length === 0;

  const handleDownloadInvoice = () => {
    const doc = new jsPDF();

    // Print Header
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text("Adarsh Stationery", 14, 20);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Premium Stationery & Office Supplies", 14, 26);
    doc.line(14, 29, 196, 29); // Draw dividing line

    // Order Details
    doc.setFont("helvetica", "bold");
    doc.text("INVOICE", 14, 38);
    doc.setFont("helvetica", "normal");
    doc.text(`Invoice No: INV-${order.orderNumber.split("-").pop()}`, 14, 44);
    doc.text(`Order ID: ${order.orderNumber}`, 14, 50);
    doc.text(`Date Placed: ${formatDate(order.createdAt)}`, 14, 56);

    // Billing & Shipping Info
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

    // Items Table Header
    let y = order.shippingAddress.addressLine2 ? 80 : 74;
    doc.line(14, y - 6, 196, y - 6);

    doc.setFont("helvetica", "bold");
    doc.text("Item Description", 14, y);
    doc.text("Qty", 120, y, { align: "center" });
    doc.text("Price", 150, y, { align: "right" });
    doc.text("Subtotal", 190, y, { align: "right" });

    doc.line(14, y + 2, 196, y + 2);
    doc.setFont("helvetica", "normal");

    // Items List
    y += 8;
    order.items?.forEach((item) => {
      // Truncate name if it's too long
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

    // Grand Total
    y += 6;
    doc.setFont("helvetica", "bold");
    doc.text("Grand Total:", 150, y, { align: "right" });
    doc.text(`INR ${order.totalAmount.toFixed(2)}`, 190, y, { align: "right" });

    // Footer note
    doc.setFont("helvetica", "italic");
    doc.setFontSize(8);
    doc.text("Thank you for shopping with Adarsh Stationery!", 14, 280);

    // Download PDF
    doc.save(`invoice-${order.orderNumber}.pdf`);
  };

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      {/* 1. HEADER SECTION */}
      <div className="flex flex-wrap gap-4 justify-between items-start border-b border-zinc-800 pb-5">
        <div className="space-y-2">
          <Link href="/admin/orders" className="flex items-center gap-1.5 text-zinc-500 hover:text-white transition-colors text-xs font-semibold uppercase tracking-wider mb-2">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Orders
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-xl font-bold tracking-tight text-white">{order.orderNumber}</h1>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${statusClasses[order.status] || "bg-zinc-800 text-zinc-400 border-zinc-700"}`}>
              {order.status}
            </span>
          </div>
          <p className="text-xs text-zinc-400 flex items-center gap-1.5 pt-0.5">
            <Calendar className="w-3.5 h-3.5 text-zinc-500" /> Placed on {formatDate(order.createdAt)}
          </p>
        </div>
        <Button 
          onClick={handleDownloadInvoice} 
          variant="outline" 
          className="border-zinc-800 bg-zinc-900 text-zinc-300 rounded-xl px-4 h-9 text-xs font-semibold hover:bg-zinc-800 hover:text-white transition-all shadow-md shrink-0"
        >
          <Download className="w-3.5 h-3.5 mr-2" /> Download Invoice
        </Button>
      </div>

      {/* 2. DETAIL CARDS LAYOUT */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* LEFT COLUMN: Customer info & Items table */}
        <div className="md:col-span-2 space-y-6">
          {/* Customer & Shipping Card */}
          <div className="bg-[#0c0c0e] border border-zinc-800/80 p-5 rounded-2xl shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-white flex items-center gap-2 uppercase tracking-wider text-zinc-400">
              <User className="w-4 h-4 text-zinc-500" /> Customer & Shipping Details
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 text-xs border-t border-zinc-800/60 pt-4">
              <div>
                <p className="text-zinc-500 font-bold uppercase tracking-wider">Customer Name</p>
                <p className="mt-1 font-semibold text-zinc-200 text-sm">{order.shippingAddress?.name}</p>
                <p className="text-zinc-450 mt-0.5 font-mono">{order.customer?.email || ""}</p>
              </div>
              <div>
                <p className="text-zinc-500 font-bold uppercase tracking-wider">Phone Number</p>
                <p className="mt-1 font-semibold text-zinc-200 text-sm flex items-center gap-1.5 font-mono">
                  <Phone className="w-3.5 h-3.5 text-zinc-500" /> {order.shippingAddress?.phone}
                </p>
              </div>
              <div>
                <p className="text-zinc-500 font-bold uppercase tracking-wider">Contact Email</p>
                <p className="mt-1 font-semibold text-zinc-200 text-sm flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-zinc-500" /> {order.shippingAddress?.email || "—"}
                </p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-zinc-500 font-bold uppercase tracking-wider">Shipping Address</p>
                <div className="mt-1 text-zinc-200 flex items-start gap-1.5 leading-relaxed text-sm">
                  <MapPin className="w-4 h-4 text-zinc-500 mt-0.5 shrink-0" />
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
          <div className="bg-[#0c0c0e] border border-zinc-800/80 p-5 rounded-2xl shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-white flex items-center gap-2 uppercase tracking-wider text-zinc-400">
              <CreditCard className="w-4 h-4 text-zinc-500" /> Payment Information
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 text-xs border-t border-zinc-800/60 pt-4">
              <div>
                <p className="text-zinc-500 font-bold uppercase tracking-wider">Payment Status</p>
                <div className="mt-1.5">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${paymentStatusClasses[order.paymentStatus] || "bg-zinc-800 text-zinc-450 border-zinc-700"}`}>
                    {order.paymentStatus}
                  </span>
                </div>
              </div>
              <div>
                <p className="text-zinc-500 font-bold uppercase tracking-wider">Payment ID</p>
                <p className="mt-1.5 font-mono text-zinc-350 text-sm">{order.paymentId || "—"}</p>
              </div>
            </div>
          </div>

          {/* Order Items Table */}
          <div className="bg-[#0c0c0e] border border-zinc-800/80 p-5 rounded-2xl shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider text-zinc-400">Order Items</h2>
            <div className="overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-900/10">
              <Table className="min-w-[600px]">
                <TableHeader className="bg-zinc-900/40">
                  <TableRow className="border-b border-zinc-800 hover:bg-transparent">
                    <TableHead className="font-semibold text-zinc-400">Product</TableHead>
                    <TableHead className="font-semibold text-zinc-400 text-center w-20">Qty</TableHead>
                    <TableHead className="font-semibold text-zinc-400 text-right w-32">Price</TableHead>
                    <TableHead className="font-semibold text-zinc-400 text-right w-32">Subtotal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {order.items?.map((item, idx) => (
                    <TableRow key={idx} className="border-b border-zinc-800/60 hover:bg-zinc-900/20 transition-colors">
                      <TableCell className="py-4">
                        <div className="flex items-center gap-3">
                          {item.product?.images?.[0] ? (
                            <img 
                              src={item.product.images[0]} 
                              className="w-12 h-12 object-contain rounded-xl bg-white border border-zinc-800 p-0.5 shadow-sm shrink-0" 
                              alt={item.productName} 
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-850 flex items-center justify-center text-zinc-500 text-[10px] font-mono shrink-0">No Image</div>
                          )}
                          <span className="font-bold tracking-tight text-xs sm:text-sm text-zinc-100 capitalize">{item.productName}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center font-mono py-4 text-zinc-300 text-xs sm:text-sm">{item.quantity}</TableCell>
                      <TableCell className="text-right font-mono py-4 text-zinc-300 text-xs sm:text-sm">₹{item.pricePerUnit}</TableCell>
                      <TableCell className="text-right font-mono py-4 text-zinc-100 font-semibold text-xs sm:text-sm">₹{item.subtotal}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-zinc-900/20 font-bold border-t border-zinc-800">
                    <TableCell colSpan={3} className="py-4 text-zinc-100 text-sm sm:text-base">Grand Total</TableCell>
                    <TableCell className="text-right font-mono py-4 text-sm sm:text-base text-emerald-400">{formatCurrency(order.totalAmount)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Status Updates & Status History Timeline */}
        <div className="space-y-6">
          {/* Status Update Card */}
          <div className="bg-[#0c0c0e] border border-zinc-800/80 p-5 rounded-2xl shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider text-zinc-400">Update Order Status</h2>
            <div className="border-t border-zinc-800/60 pt-4 space-y-4">
              {isFinished ? (
                <p className="text-xs text-zinc-500 italic">This order is in a final state ({order.status}) and cannot be transitioned further.</p>
              ) : (
                <div className="space-y-3">
                  <label className="text-xs text-zinc-450 font-bold uppercase tracking-wider">Select next status</label>
                  <div className="flex gap-2">
                    <select 
                      value={selectedNextStatus} 
                      onChange={(e) => setSelectedNextStatus(e.target.value)}
                      className="flex-1 h-10 bg-[#141416] border border-zinc-700 rounded-xl px-3 text-xs font-semibold text-zinc-300 hover:text-white hover:border-zinc-550 transition-all outline-none cursor-pointer"
                    >
                      <option value="" className="bg-zinc-950 text-zinc-450">Choose next status...</option>
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
                      className="bg-white text-black hover:bg-zinc-200 font-semibold rounded-xl text-xs px-4"
                    >
                      {statusMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Update"}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Status History Timeline Card */}
          <div className="bg-[#0c0c0e] border border-zinc-800/80 p-5 rounded-2xl shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-white flex items-center gap-2 uppercase tracking-wider text-zinc-400">
              <Clock className="w-4 h-4 text-zinc-500" /> Status Timeline
            </h2>
            <div className="border-t border-zinc-800/60 pt-6">
              {order.statusHistory && order.statusHistory.length > 0 ? (
                <div className="relative border-l border-zinc-800 pl-6 space-y-6 ml-2">
                  {[...order.statusHistory]
                    .sort((a, b) => new Date(b.changedAt) - new Date(a.changedAt))
                    .map((historyItem, idx) => (
                      <div key={idx} className="relative">
                        <span className={`absolute -left-[31px] top-1 flex h-4 w-4 items-center justify-center rounded-full border bg-zinc-950 ${statusClasses[historyItem.status] || "border-zinc-700 bg-zinc-850"}`}>
                          <span className="h-1.5 w-1.5 rounded-full bg-current" />
                        </span>
                        <div>
                          <p className="text-sm font-semibold text-zinc-100">{historyItem.status}</p>
                          <p className="text-xs text-zinc-500 mt-0.5">
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
                <p className="text-sm text-zinc-500 italic">No timeline entries available.</p>
              )}
            </div>
          </div>
          
          {/* Other Customer Orders Card */}
          <div className="bg-[#0c0c0e] border border-zinc-800/80 p-5 rounded-2xl shadow-sm space-y-4 animate-in fade-in duration-300">
            <h2 className="text-sm font-bold text-white flex items-center gap-2 uppercase tracking-wider text-zinc-400">
              <Clock className="w-4 h-4 text-zinc-550" /> Other Orders
            </h2>
            <div className="border-t border-zinc-800/60 pt-4">
              {order.otherOrders && order.otherOrders.length > 0 ? (
                <div className="space-y-3">
                  {order.otherOrders.map((other) => (
                    <Link 
                      key={other._id}
                      href={`/admin/orders/${other._id}`}
                      className="flex items-center justify-between p-3 rounded-xl bg-zinc-900/10 border border-zinc-850 hover:border-zinc-700/80 hover:bg-zinc-900/40 transition-all cursor-pointer group"
                    >
                      <div className="space-y-1 min-w-0 pr-2">
                        <p className="font-bold text-zinc-200 text-xs group-hover:text-blue-400 transition-colors truncate">
                          {other.orderNumber}
                        </p>
                        <p className="text-[10px] text-zinc-500 font-mono">
                          {formatDate(other.createdAt)}
                        </p>
                      </div>
                      <div className="text-right space-y-1 shrink-0 flex flex-col items-end">
                        <p className="font-semibold text-zinc-300 text-xs font-mono">
                          {formatCurrency(other.totalAmount)}
                        </p>
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusClasses[other.status] || "bg-zinc-800 text-zinc-500 border-zinc-700"}`}>
                          {other.status}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-zinc-500 italic py-2 text-center">No other orders found for this customer.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
