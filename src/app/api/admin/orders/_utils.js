import Product from "@/models/product.model";
import Payment from "@/models/payment.model";

export const orderPopulation = [
  { path: "customer", select: "name email" },
  { path: "items.product" },
  { path: "payment" },
];

/**
 * Temporary migration/compatibility layer to map properties from the new decoupled Payment
 * document back to legacy Order model fields expected by older UI views and seed inputs.
 * This can be retired once UI views fetch the Payments API directly.
 */
export const sanitizeOrder = (order) => {
  if (!order) return order;
  
  // If order is a lean JS object
  const paymentObj = order.payment || {};
  
  return {
    ...order,
    paymentStatus: paymentObj.status || "Pending",
    paymentId: paymentObj.gatewayTransactionId || "",
    paymentMethod: paymentObj.paymentMethod || "UPI",
    razorpayOrderId: paymentObj.gatewayOrderId || "",
  };
};
