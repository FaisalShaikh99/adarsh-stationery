import { z } from "zod";
import { STATUSES, TYPES, GATEWAYS, METHODS } from "@/models/payment.model";

export const createPaymentSchema = z.object({
  order: z.string().trim().optional(),
  customer: z.string().trim().optional(),
  invoice: z.string().trim().optional(),
  transactionId: z.string().trim().optional(),
  gatewayTransactionId: z.string().trim().optional(),
  gatewayOrderId: z.string().trim().optional(),
  gateway: z.enum(GATEWAYS).optional().default("None"),
  paymentMethod: z.enum(METHODS).optional().default("UPI"),
  type: z.enum(TYPES).optional().default("Incoming"),
  amount: z.coerce.number().nonnegative("Amount cannot be negative"),
  currency: z.string().optional().default("INR"),
  status: z.enum(STATUSES).optional().default("Pending"),
  paymentDate: z.coerce.date().optional(),
  referenceNumber: z.string().trim().optional(),
  bankName: z.string().trim().optional(),
  accountName: z.string().trim().optional(),
  accountNumber: z.string().trim().optional(),
  upiId: z.string().trim().optional(),
  remarks: z.string().trim().optional(),
  failureReason: z.string().trim().optional(),
  metadata: z.record(z.any()).optional(),
  createdBy: z.string().optional().default("System"),
});

export const updatePaymentSchema = z.object({
  status: z.enum(STATUSES).optional(),
  paymentMethod: z.enum(METHODS).optional(),
  gatewayTransactionId: z.string().trim().optional(),
  referenceNumber: z.string().trim().optional(),
  remarks: z.string().trim().optional(),
  failureReason: z.string().trim().optional(),
  updatedBy: z.string().optional(),
});

export const createRefundSchema = z.object({
  refundAmount: z.coerce.number().positive("Refund amount must be greater than zero"),
  reason: z.string().trim().min(1, "Reason is required"),
  approvedBy: z.string().optional().default("System"),
});

export const createSettlementSchema = z.object({
  settlementId: z.string().trim().min(1, "Settlement ID is required"),
  gateway: z.string().trim().min(1, "Gateway is required"),
  amount: z.coerce.number().nonnegative("Amount cannot be negative"),
  payments: z.array(z.string().trim()).min(1, "At least one payment is required"),
  bank: z.string().trim().optional(),
  settlementDate: z.coerce.date(),
  status: z.enum(["Pending", "Processed", "Failed"]).optional().default("Pending"),
});

export const createBankStatementSchema = z.object({
  date: z.coerce.date(),
  bank: z.string().trim().min(1, "Bank name is required"),
  transactionReference: z.string().trim().min(1, "Transaction reference is required"),
  credit: z.coerce.number().nonnegative().optional().default(0),
  debit: z.coerce.number().nonnegative().optional().default(0),
  balance: z.coerce.number(),
  remarks: z.string().trim().optional(),
  linkedPayment: z.string().trim().optional(),
});
