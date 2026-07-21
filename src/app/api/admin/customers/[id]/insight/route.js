import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { GoogleGenAI } from "@google/genai";
import { dbConnect } from "@/lib/dbConnect";
import Customer from "@/models/customer.model";
import Order from "@/models/order.model";
import { ApiError } from "@/utils/ApiError";
import { ApiResponse } from "@/utils/ApiResponse";
import { asyncHandler } from "@/utils/asyncHandler";
import { sanitizeOrder } from "../../../orders/_utils";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

function formatCurrency(amount) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount || 0);
}

export const GET = asyncHandler(async (request, { params }) => {
  await dbConnect();

  // Secure authorization
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  if (!token) {
    throw new ApiError(401, "Access Denied. Please sign in to view customer insights.");
  }

  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const regenerate = searchParams.get("regenerate") === "true";

  const customer = await Customer.findById(id);
  if (!customer) {
    throw new ApiError(404, "Customer not found.");
  }

  // Edge case: zero orders
  if (customer.orderCount === 0) {
    return NextResponse.json(
      new ApiResponse(200, { insight: "No order history yet." }, "Insight fetched successfully.")
    );
  }

  // Cache hit check
  if (customer.aiInsight && !regenerate) {
    return NextResponse.json(
      new ApiResponse(200, { insight: customer.aiInsight }, "Cached insight fetched successfully.")
    );
  }

  // Fetch full order history including product categories
  const orders = await Order.find({ customer: id })
    .populate({
      path: "items.product",
      populate: { path: "category", select: "name" }
    })
    .populate("payment")
    .sort({ createdAt: 1 })
    .lean();

  if (orders.length === 0) {
    return NextResponse.json(
      new ApiResponse(200, { insight: "No order history yet." }, "Insight fetched successfully.")
    );
  }

  const sanitizedOrders = orders.map(sanitizeOrder);

  // Format order history for prompt context
  const orderHistorySummary = sanitizedOrders.map((order, idx) => {
    const itemsText = order.items.map(item => {
      const categoryName = item.product?.category?.name || "Stationery";
      return `${item.quantity}x "${item.productName}" (Category: ${categoryName})`;
    }).join(", ");
    
    return `Order #${idx + 1} (${order.orderNumber}): Placed: ${new Date(order.createdAt).toLocaleDateString()}, Total Amount: ₹${order.totalAmount}, Status: ${order.status}, Payment Status: ${order.paymentStatus}, Items: [${itemsText}]`;
  }).join("\n");

  // Call AI text generator
  try {
    const prompt = `You are a professional retail and analytics copywriter for Adarsh Stationery store.
    Analyze the purchase history of the customer named "${customer.name}" and write a short, cohesive, natural-language summary (exactly 2-3 sentences) detailing their buyer behavior.
    Highlight details such as what types of products/categories they favor, their order sizes (bulk vs small retail purchases), order frequency, payment tendencies, and any cancellation patterns.
    
    Customer Profile & Order History:
    - Name: ${customer.name}
    - Total Spend: ₹${customer.totalSpent}
    - Total Orders: ${customer.orderCount}
    - Details:
    ${orderHistorySummary}

    Response rules:
    - Write exactly 2 to 3 sentences.
    - Focus on purchase pattern insights. If the customer has only placed 1 order, focus on their initial purchase categories/amounts and their welcome/acquisition profile, rather than analyzing frequency.
    - Do not include any title, markdown styling, bullets, quotes, introductory filler (like "Here is a summary..."), or footnotes. Return only the plain sentences.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
    });

    const insightText = response.text?.trim() || "";
    
    if (!insightText) {
      throw new Error("Received empty response from AI model.");
    }

    // Cache the result in customer profile
    customer.aiInsight = insightText;
    await customer.save();

    return NextResponse.json(
      new ApiResponse(200, { insight: insightText }, "AI Insight generated successfully.")
    );
  } catch (error) {
    console.error("AI Insight Generation Error:", error);
    throw new ApiError(500, `AI Insight Generation failed: ${error.message || "Unknown error"}`);
  }
});
