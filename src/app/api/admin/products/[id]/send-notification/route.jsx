import React from "react";
import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { dbConnect } from "@/lib/dbConnect";
import { resend } from "@/lib/resend";
import Product from "@/models/product.model";
import Customer from "@/models/customer.model";
import NewProductNotification from "@/emails/new-product-notification";
import { ApiError } from "@/utils/ApiError";
import { ApiResponse } from "@/utils/ApiResponse";
import { asyncHandler } from "@/utils/asyncHandler";

export const POST = asyncHandler(async (request, { params }) => {
  await dbConnect();

  // Secure authorization check
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  if (!token) {
    throw new ApiError(401, "Access Denied. Please sign in to send notifications.");
  }

  const { id } = await params;
  
  // 1. Fetch product details
  const product = await Product.findById(id).populate("category company");
  if (!product) {
    throw new ApiError(404, "Product not found.");
  }

  // 2. Parse request body
  const body = await request.json().catch(() => ({}));
  const { subject, body: emailBody, customerIds, discount = 0 } = body;

  if (!subject || !emailBody) {
    throw new ApiError(400, "Subject and email body are required.");
  }

  if (!customerIds || !Array.isArray(customerIds) || customerIds.length === 0) {
    throw new ApiError(400, "At least one recipient customer ID is required.");
  }

  const successes = [];
  const failures = [];

  const apiKey = process.env.ADMIN_RESEND_API_KEY;
  const isMockSend = !apiKey || apiKey.startsWith("re_dummy");

  // 3. Loop through customers and send notifications
  for (const customerId of customerIds) {
    let customer;
    try {
      customer = await Customer.findById(customerId);
      if (!customer || !customer.email) {
        failures.push({
          customerId,
          name: customer?.name || "Unknown",
          error: "No email address found for customer.",
        });
        continue;
      }

      if (isMockSend) {
        // Safe development simulation fallback
        console.log(`\n========================================`);
        console.log(`[MOCK EMAIL DELIVERED]`);
        console.log(`To: ${customer.name} <${customer.email}>`);
        console.log(`Subject: ${subject}`);
        console.log(`Body (Snippet): ${emailBody.substring(0, 100)}...`);
        console.log(`========================================\n`);
        
        successes.push({ id: customer._id, name: customer.name, email: customer.email });
      } else {
        // Send email via Resend (passing react element directly)
        const sendResult = await resend.emails.send({
          from: process.env.SENDER_EMAIL || "Adarsh Stationery <onboarding@resend.dev>",
          to: customer.email,
          subject: subject,
          react: (
            <NewProductNotification
              customerName={customer.name}
              subject={subject}
              body={emailBody}
              productName={product.name}
              productImage={product.images?.[0] || ""}
              productCategory={product.category?.name || "Stationery"}
              sellingPrice={product.sellingPrice}
              discount={discount}
            />
          ),
        });

        if (sendResult.error) {
          failures.push({
            customerId: customer._id,
            name: customer.name,
            error: sendResult.error.message || "Resend delivery error",
          });
        } else {
          successes.push({ id: customer._id, name: customer.name, email: customer.email });
        }
      }
    } catch (err) {
      console.error(`Failed to send notification to customer ${customerId}:`, err);
      failures.push({
        customerId,
        name: customer?.name || "Unknown",
        error: err.message || "Unexpected exception during processing",
      });
    }
  }

  return NextResponse.json(
    new ApiResponse(
      200,
      {
        successCount: successes.length,
        failedCount: failures.length,
        failures,
      },
      `Dispatched notifications: ${successes.length} success, ${failures.length} failed.`
    )
  );
});
