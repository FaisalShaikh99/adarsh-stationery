import { z } from "zod";

export const shippingAddressSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  email: z.string().trim().email("Invalid email address").optional().or(z.literal("")),
  phone: z.string().trim().min(1, "Phone number is required"),
  addressLine1: z.string().trim().min(1, "Address is required"),
  addressLine2: z.string().trim().optional().default(""),
  city: z.string().trim().min(1, "City is required"),
  state: z.string().trim().min(1, "State is required"),
  pincode: z.string().trim().min(1, "Pincode is required"),
});

export const orderItemSchema = z.object({
  product: z.string().min(1, "Product is required"),
  productName: z.string().trim().min(1, "Product name is required"),
  quantity: z.coerce.number().int().positive("Quantity must be at least 1"),
  pricePerUnit: z.coerce.number().nonnegative("Price cannot be negative"),
  costPricePerUnit: z.coerce.number().nonnegative("Cost price cannot be negative").optional().default(0),
  subtotal: z.coerce.number().nonnegative("Subtotal cannot be negative"),
});

export const createOrderSchema = z.object({
  customer: z.string().min(1, "Customer is required"),
  items: z.array(orderItemSchema).min(1, "At least one item is required"),
  totalAmount: z.coerce.number().nonnegative("Total amount cannot be negative"),
  shippingAddress: shippingAddressSchema,
  payment: z.string().optional(),
});

export const updateShippingAddressSchema = shippingAddressSchema;
