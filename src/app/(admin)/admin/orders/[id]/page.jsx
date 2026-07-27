"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { 
  ChevronLeft, 
  ChevronDown,
  Download, 
  Loader2, 
  Calendar, 
  User, 
  Phone, 
  MapPin, 
  CreditCard, 
  ArrowLeft, 
  Clock,
  Mail,
  CheckCircle2,
  TrendingUp,
  Package,
  Check,
  ShoppingBag
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { jsPDF } from "jspdf";

const statusClasses = {
  Pending: "bg-amber-50 text-amber-700 border border-amber-200 font-black",
  Confirmed: "bg-sky-50 text-sky-700 border border-sky-200 font-black",
  Shipped: "bg-purple-50 text-purple-700 border border-purple-200 font-black",
  Delivered: "bg-emerald-50 text-emerald-700 border border-emerald-200 font-black",
  Cancelled: "bg-rose-50 text-rose-700 border border-rose-200 font-black",
};

const paymentStatusClasses = {
  Paid: "bg-emerald-50 text-emerald-700 border border-emerald-200 font-black",
  Pending: "bg-amber-50 text-amber-700 border border-amber-200 font-black",
  Failed: "bg-rose-50 text-rose-700 border border-rose-200 font-black",
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

function OrderDetailSkeleton() {
  return (
    <div className="w-full max-w-full space-y-6 animate-pulse font-sans">
      <div className="flex flex-wrap gap-3 justify-between items-center border-b border-border-subtle pb-5">
        <div className="space-y-2">
          <div className="h-4 w-24 bg-zinc-200 rounded" />
          <div className="h-8 w-48 bg-zinc-200 rounded" />
          <div className="h-4 w-32 bg-zinc-200 rounded" />
        </div>
        <div className="h-11 w-36 bg-zinc-200 rounded-2xl" />
      </div>

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="h-48 bg-white border border-border-subtle rounded-[26px] p-6" />
          <div className="h-64 bg-white border border-border-subtle rounded-[26px] p-6" />
        </div>
        <div className="space-y-6">
          <div className="h-32 bg-white border border-border-subtle rounded-[26px] p-6" />
          <div className="h-64 bg-white border border-border-subtle rounded-[26px] p-6" />
        </div>
      </div>
    </div>
  );
}

export default function OrderDetailPage() {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const [selectedNextStatus, setSelectedNextStatus] = useState("");
  const [isNextStatusDropdownOpen, setIsNextStatusDropdownOpen] = useState(false);

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
      <div className="w-full max-w-full py-12 text-center space-y-4 font-sans">
        <h1 className="text-xl font-black text-gray-900">Order Record Not Found</h1>
        <p className="text-zinc-600 text-sm font-medium">We couldn't retrieve details for the requested Order ID. It may not exist or has been deleted.</p>
        <Link href="/admin/orders" passHref>
          <Button variant="outline" className="border-border-subtle bg-white text-gray-900 rounded-2xl px-5 py-2.5 text-xs font-bold shadow-2xs">
            <ArrowLeft className="w-4 h-4 mr-2 text-primary-600" /> Back to Orders Feed
          </Button>
        </Link>
      </div>
    );
  }

  const allowedTargets = allowedTransitions[order.status] || [];
  const isFinished = allowedTargets.length === 0;

  const handleDownloadInvoice = () => {
    const doc = new jsPDF();

    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text("Adarsh Stationery", 14, 20);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Premium Stationery & Office Supplies", 14, 26);
    doc.line(14, 29, 196, 29);

    doc.setFont("helvetica", "bold");
    doc.text("TAX INVOICE", 14, 38);
    doc.setFont("helvetica", "normal");
    doc.text(`Invoice No: INV-${order.orderNumber.split("-").pop()}`, 14, 44);
    doc.text(`Order ID: ${order.orderNumber}`, 14, 50);
    doc.text(`Date Placed: ${formatDate(order.createdAt)}`, 14, 56);

    doc.setFont("helvetica", "bold");
    doc.text("Shipping To:", 110, 38);
    doc.setFont("helvetica", "normal");
    doc.text(order.shippingAddress?.name || order.customer?.name || "Customer", 110, 44);
    doc.text(`Phone: ${order.shippingAddress?.phone || "—"}`, 110, 50);
    doc.text(order.shippingAddress?.addressLine1 || order.shippingAddress?.street || "", 110, 56);
    const cityStateZip = `${order.shippingAddress?.city || ""}, ${order.shippingAddress?.state || ""} - ${order.shippingAddress?.pincode || order.shippingAddress?.postalCode || ""}`;
    doc.text(cityStateZip, 110, 62);

    let y = 74;
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
      const cleanName = (item.productName || item.product?.name || "Product Item").slice(0, 45);
      const qty = item.quantity || 1;
      const price = item.pricePerUnit || item.price || 0;
      const subtotal = item.subtotal || qty * price;

      doc.text(cleanName, 14, y);
      doc.text(String(qty), 120, y, { align: "center" });
      doc.text(`INR ${price.toFixed(2)}`, 150, y, { align: "right" });
      doc.text(`INR ${subtotal.toFixed(2)}`, 190, y, { align: "right" });
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
    <div className="w-full max-w-full space-y-6 font-sans pb-12 text-gray-900 overflow-x-hidden">
      
      {/* 1. HEADER SECTION */}
      <div className="flex flex-wrap gap-4 justify-between items-center border-b border-border-subtle pb-5">
        <div className="space-y-1.5">
          <Link href="/admin/orders" className="inline-flex items-center gap-1.5 text-zinc-600 hover:text-primary-700 transition-colors text-xs font-black uppercase tracking-wider">
            <ArrowLeft className="w-4 h-4 text-primary-600" /> Back to Orders Feed
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-xl sm:text-2xl font-black tracking-tight font-mono text-gray-900">{order.orderNumber}</h1>
            <span className={`px-3 py-1 rounded-xl text-xs ${statusClasses[order.status] || "bg-zinc-100 text-zinc-700"}`}>
              {order.status}
            </span>
          </div>
          <p className="text-xs text-zinc-600 font-bold flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-primary-600" /> Placed on {formatDate(order.createdAt)}
          </p>
        </div>
        <Button 
          onClick={handleDownloadInvoice} 
          className="bg-primary-600 hover:bg-primary-700 text-white font-black rounded-2xl px-5 h-11 text-xs sm:text-sm shadow-md cursor-pointer btn-modern shrink-0 flex items-center gap-2"
        >
          <Download className="w-4 h-4" /> Download Official Invoice
        </Button>
      </div>

      {/* 2. DETAIL CARDS RESPONSIVE LAYOUT */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
        
        {/* LEFT COLUMN: Customer & Shipping, Payment Info, Order Items & Profit Breakdown */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Customer & Shipping Details Card */}
          <div className="bg-bg-surface border border-border-subtle rounded-[26px] p-6 space-y-4 shadow-xs">
            <h2 className="text-sm sm:text-base font-black text-gray-900 flex items-center gap-2 uppercase tracking-wider">
              <User className="w-4 h-4 text-primary-600" /> Customer & Shipping Details
            </h2>
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 text-xs border-t border-border-subtle pt-4 font-sans">
              <div>
                <p className="text-zinc-500 font-black uppercase tracking-wider text-[11px]">Customer Name</p>
                <p className="mt-1 font-black text-gray-900 text-sm sm:text-base capitalize">
                  {order.shippingAddress?.fullName || order.shippingAddress?.name || order.customer?.name || "Customer"}
                </p>
              </div>
              <div>
                <p className="text-zinc-500 font-black uppercase tracking-wider text-[11px]">Phone Number</p>
                <p className="mt-1 font-bold text-zinc-800 text-xs sm:text-sm flex items-center gap-1.5 font-mono">
                  <Phone className="w-4 h-4 text-primary-600" /> {order.shippingAddress?.phone || order.shippingAddress?.phoneNumber || order.customer?.phone || "—"}
                </p>
              </div>
              <div>
                <p className="text-zinc-500 font-black uppercase tracking-wider text-[11px]">Contact Email</p>
                <p className="mt-1 font-bold text-zinc-800 text-xs sm:text-sm flex items-center gap-1.5 font-mono truncate">
                  <Mail className="w-4 h-4 text-primary-600" /> {order.shippingAddress?.email || order.customer?.email || "—"}
                </p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-zinc-500 font-black uppercase tracking-wider text-[11px]">Shipping Destination Address</p>
                <div className="mt-1.5 text-zinc-700 flex items-start gap-2 leading-relaxed text-xs sm:text-sm font-medium">
                  <MapPin className="w-4 h-4 text-primary-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-bold text-gray-900">{order.shippingAddress?.addressLine1 || order.shippingAddress?.street}</p>
                    {order.shippingAddress?.addressLine2 && <p>{order.shippingAddress?.addressLine2}</p>}
                    <p>{order.shippingAddress?.city}, {order.shippingAddress?.state} - {order.shippingAddress?.pincode || order.shippingAddress?.postalCode}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Information Card */}
          <div className="bg-bg-surface border border-border-subtle rounded-[26px] p-6 space-y-4 shadow-xs">
            <h2 className="text-sm sm:text-base font-black text-gray-900 flex items-center gap-2 uppercase tracking-wider">
              <CreditCard className="w-4 h-4 text-primary-600" /> Payment & Financial Details
            </h2>
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 text-xs border-t border-border-subtle pt-4 font-mono">
              <div>
                <p className="text-zinc-500 font-black uppercase tracking-wider text-[11px] font-sans">Payment Method</p>
                <p className="mt-1.5 font-black text-gray-900 text-sm sm:text-base">{order.paymentMethod || "COD"}</p>
              </div>
              <div>
                <p className="text-zinc-500 font-black uppercase tracking-wider text-[11px] font-sans">Payment Status</p>
                <div className="mt-1.5">
                  <span className={`px-3 py-1 rounded-xl text-xs ${paymentStatusClasses[order.paymentStatus] || "bg-zinc-100 text-zinc-700"}`}>
                    {order.paymentStatus}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Order Items & Profit Breakdown Table */}
          <div className="bg-bg-surface border border-border-subtle rounded-[26px] p-6 space-y-4 shadow-xs">
            <h2 className="text-sm sm:text-base font-black text-gray-900 uppercase tracking-wider">Order Items & Profit Breakdown</h2>
            <div className="overflow-x-auto rounded-2xl border border-border-subtle bg-white shadow-2xs">
              <Table className="min-w-[700px] font-sans text-xs">
                <TableHeader className="bg-primary-50/90 border-b border-border-subtle">
                  <TableRow className="border-b border-border-subtle uppercase text-xs">
                    <TableHead className="font-black text-primary-900">Product</TableHead>
                    <TableHead className="font-black text-primary-900 text-center w-20">Qty</TableHead>
                    <TableHead className="font-black text-primary-900 text-right w-28">Cost Price</TableHead>
                    <TableHead className="font-black text-primary-900 text-right w-28">Selling Price</TableHead>
                    <TableHead className="font-black text-primary-900 text-right w-32">Profit / Item</TableHead>
                    <TableHead className="font-black text-primary-900 text-right w-32">Subtotal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(() => {
                    let totalOrderProfit = 0;

                    return (
                      <>
                        {order.items?.map((item, idx) => {
                          const costPrice = item.costPricePerUnit !== undefined ? item.costPricePerUnit : (item.product?.costPrice || 0);
                          const sellingPrice = item.pricePerUnit || item.price || 0;
                          const profitPerItem = sellingPrice - costPrice;
                          const itemTotalProfit = profitPerItem * item.quantity;
                          totalOrderProfit += itemTotalProfit;

                          return (
                            <TableRow key={idx} className="border-b border-border-subtle hover:bg-primary-50/50 transition-colors bg-white">
                              <TableCell className="py-4">
                                <div className="flex items-center gap-3">
                                  {item.product?.images?.[0] ? (
                                    <img 
                                      src={item.product.images[0]} 
                                      className="w-12 h-12 object-contain rounded-xl bg-white border border-border-subtle p-0.5 shadow-2xs shrink-0" 
                                      alt={item.productName || item.product?.name} 
                                      referrerPolicy="no-referrer"
                                    />
                                  ) : (
                                    <div className="w-12 h-12 rounded-xl bg-primary-50 border border-primary-200 flex items-center justify-center text-primary-600 text-[10px] font-bold shrink-0">Item</div>
                                  )}
                                  <span className="font-black tracking-tight text-xs sm:text-sm text-gray-900 capitalize">{item.productName || item.product?.name}</span>
                                </div>
                              </TableCell>
                              <TableCell className="text-center font-mono py-4 font-black text-gray-900 text-xs sm:text-sm">{item.quantity}</TableCell>
                              <TableCell className="text-right font-mono py-4 text-zinc-600 font-bold text-xs sm:text-sm">₹{costPrice}</TableCell>
                              <TableCell className="text-right font-mono py-4 text-gray-900 font-black text-xs sm:text-sm">₹{sellingPrice}</TableCell>
                              <TableCell className="text-right font-mono py-4 text-xs sm:text-sm">
                                <span className={`px-2.5 py-1 rounded-lg font-black ${profitPerItem >= 0 ? "text-emerald-700 bg-emerald-50 border border-emerald-200" : "text-rose-700 bg-rose-50 border border-rose-200"}`}>
                                  ₹{profitPerItem}
                                </span>
                              </TableCell>
                              <TableCell className="text-right font-mono py-4 text-emerald-600 font-black text-xs sm:text-sm">₹{item.subtotal || (item.quantity * sellingPrice)}</TableCell>
                            </TableRow>
                          );
                        })}
                        <TableRow className="bg-primary-50/60 border-t border-border-subtle">
                          <TableCell colSpan={5} className="py-3.5 text-primary-900 text-xs sm:text-sm font-black uppercase">Total Order Profit</TableCell>
                          <TableCell className="text-right font-mono py-3.5 text-xs sm:text-sm text-emerald-600 font-black">{formatCurrency(totalOrderProfit)}</TableCell>
                        </TableRow>
                        <TableRow className="bg-white font-black border-t border-border-subtle">
                          <TableCell colSpan={5} className="py-4 text-gray-900 text-sm sm:text-base uppercase">Grand Total Amount</TableCell>
                          <TableCell className="text-right font-mono py-4 text-sm sm:text-base text-emerald-600 font-black">{formatCurrency(order.totalAmount)}</TableCell>
                        </TableRow>
                      </>
                    );
                  })()}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Status Update, Timeline, Related Orders */}
        <div className="space-y-6">
          
          {/* Status Update Card */}
          <div className="bg-bg-surface border border-border-subtle rounded-[26px] p-6 space-y-4 shadow-xs">
            <h2 className="text-sm sm:text-base font-black text-gray-900 uppercase tracking-wider">Update Order Status</h2>
            <div className="border-t border-border-subtle pt-4 space-y-4">
              {isFinished ? (
                <p className="text-xs text-zinc-500 font-bold italic">This order is in a final state ({order.status}) and cannot be transitioned further.</p>
              ) : (
                <div className="space-y-3">
                  <label className="text-xs text-gray-900 font-black block">Select Next Status State</label>
                  
                  {/* Custom Status Popover Drawer */}
                  <div className="relative w-full">
                    <button
                      type="button"
                      onClick={() => setIsNextStatusDropdownOpen(!isNextStatusDropdownOpen)}
                      className="bg-white border border-border-subtle rounded-2xl h-11 px-4 text-xs font-bold text-gray-900 hover:border-primary-400 transition-all flex items-center justify-between gap-2.5 cursor-pointer w-full shadow-2xs"
                    >
                      <span className="truncate">{selectedNextStatus || "Choose next status..."}</span>
                      <ChevronDown className={`w-4 h-4 text-zinc-400 transition-transform duration-200 ${isNextStatusDropdownOpen ? "rotate-180 text-primary-600" : ""}`} />
                    </button>
                    {isNextStatusDropdownOpen && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setIsNextStatusDropdownOpen(false)} />
                        <div className="absolute left-0 right-0 top-12 bg-white/95 backdrop-blur-2xl border border-border-subtle rounded-2xl p-2 shadow-xl z-50 space-y-1 text-gray-900 animate-in fade-in-50 zoom-in-95 duration-150 font-sans">
                          {allowedTargets.map((tgt) => (
                            <button
                              type="button"
                              key={tgt}
                              onClick={() => { setSelectedNextStatus(tgt); setIsNextStatusDropdownOpen(false); }}
                              className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs transition-all cursor-pointer flex items-center justify-between ${
                                selectedNextStatus === tgt ? "bg-primary-50 text-primary-700 font-black" : "text-gray-900 hover:bg-primary-50/60 font-bold"
                              }`}
                            >
                              <span>{tgt}</span>
                              {selectedNextStatus === tgt && <Check className="w-3.5 h-3.5 text-primary-600" />}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>

                  <Button 
                    onClick={() => {
                      if (!selectedNextStatus) return toast.error("Please select a status first.");
                      statusMutation.mutate({ id: order._id, nextStatus: selectedNextStatus });
                    }}
                    disabled={statusMutation.isPending || !selectedNextStatus}
                    className="w-full bg-primary-600 text-white hover:bg-primary-700 font-black rounded-2xl h-11 text-xs shadow-md cursor-pointer btn-modern"
                  >
                    {statusMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Update Status"}
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Status Timeline Card */}
          <div className="bg-bg-surface border border-border-subtle rounded-[26px] p-6 space-y-4 shadow-xs">
            <h2 className="text-sm sm:text-base font-black text-gray-900 flex items-center gap-2 uppercase tracking-wider">
              <Clock className="w-4 h-4 text-primary-600" /> Status Audit Timeline
            </h2>
            <div className="border-t border-border-subtle pt-6">
              {order.statusHistory && order.statusHistory.length > 0 ? (
                <div className="relative border-l-2 border-primary-200 pl-6 space-y-6 ml-2">
                  {[...order.statusHistory]
                    .sort((a, b) => new Date(b.changedAt) - new Date(a.changedAt))
                    .map((historyItem, idx) => (
                      <div key={idx} className="relative">
                        <span className="absolute -left-[31px] top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary-600 ring-4 ring-primary-100 text-white">
                          <span className="h-1.5 w-1.5 rounded-full bg-white" />
                        </span>
                        <div>
                          <p className="text-sm font-black text-gray-900">{historyItem.status}</p>
                          <p className="text-xs text-zinc-600 font-mono font-bold mt-0.5">
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
                <p className="text-xs text-zinc-500 font-bold italic">No timeline audit entries logged.</p>
              )}
            </div>
          </div>
          
          {/* Related Customer Orders */}
          <div className="bg-bg-surface border border-border-subtle rounded-[26px] p-6 space-y-4 shadow-xs">
            <h2 className="text-sm sm:text-base font-black text-gray-900 flex items-center gap-2 uppercase tracking-wider">
              <ShoppingBag className="w-4 h-4 text-primary-600" /> Other Customer Orders
            </h2>
            <div className="border-t border-border-subtle pt-4">
              {order.otherOrders && order.otherOrders.length > 0 ? (
                <div className="space-y-3">
                  {order.otherOrders.map((other) => (
                    <Link 
                      key={other._id}
                      href={`/admin/orders/${other._id}`}
                      className="flex items-center justify-between p-3.5 rounded-2xl bg-white border border-border-subtle hover:border-primary-400 hover:shadow-md transition-all cursor-pointer group"
                    >
                      <div className="space-y-1 min-w-0 pr-2">
                        <p className="font-black text-gray-900 text-xs sm:text-sm group-hover:text-primary-700 transition-colors truncate font-mono">
                          {other.orderNumber}
                        </p>
                        <p className="text-[11px] text-zinc-600 font-mono font-bold">
                          {formatDate(other.createdAt)}
                        </p>
                      </div>
                      <div className="text-right space-y-1 shrink-0 flex flex-col items-end">
                        <p className="font-black text-emerald-600 text-xs sm:text-sm font-mono">
                          {formatCurrency(other.totalAmount)}
                        </p>
                        <span className={`inline-block px-2.5 py-0.5 rounded-lg text-xs ${statusClasses[other.status] || "bg-zinc-100 text-zinc-700"}`}>
                          {other.status}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-zinc-500 font-bold italic py-2 text-center">No other orders found for this customer profile.</p>
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
