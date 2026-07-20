import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { GoogleGenAI } from "@google/genai";
import { dbConnect } from "@/lib/dbConnect";
import Product from "@/models/product.model";
import { ApiError } from "@/utils/ApiError";
import { ApiResponse } from "@/utils/ApiResponse";
import { asyncHandler } from "@/utils/asyncHandler";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export const POST = asyncHandler(async (request, { params }) => {
  await dbConnect();

  // Secure authorization check
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  if (!token) {
    throw new ApiError(401, "Access Denied. Please sign in to draft notifications.");
  }

  const { id } = await params;
  
  // 1. Fetch product
  const product = await Product.findById(id).populate("category company");
  if (!product) {
    throw new ApiError(404, "Product not found.");
  }

  // 2. Parse and validate discount parameter
  const body = await request.json().catch(() => ({}));
  let discount = body.discount !== undefined ? Number(body.discount) : 0;
  
  if (isNaN(discount) || discount < 0 || discount > 100) {
    throw new ApiError(400, "Discount percentage must be a number between 0 and 100.");
  }

  const categoryName = product.category?.name || "Stationery";
  const brandName = product.company?.name || "Adarsh";

  // 3. Draft marketing content via Gemini
  try {
    const prompt = `You are a professional retail and analytics copywriter for Adarsh Stationery store.
    Draft an email announcement for our new product: "${product.name}" (Brand: ${brandName}) under Category: "${categoryName}".
    ${discount > 0 ? `The email should highlight a special launch discount of ${discount}% off.` : ""}
    Frame the email to welcome the customer and thank them for being a loyal buyer of ${categoryName} products in the past.
    
    Response rules:
    - Return the response ONLY as a strict JSON object containing exactly two keys: "subject" and "body".
    - Do not wrap the JSON object in markdown code block markers (like \`\`\`json). Return it as plain text.
    - Write in a professional, concise, engaging e-commerce marketing tone.
    - Use natural-looking newlines ("\\n") in the body copy.
    - Start the email body copy EXACTLY with the literal greeting "Hello [Customer Name]," (you MUST use the exact placeholder "[Customer Name]" in brackets; do NOT replace it with a real name or any other text under any circumstance).
    - Do not include any other personalizations like specific names in the static subject/body (those will be merged on the fly).
    
    Example response structure:
    {"subject": "New Category Launch: Product Name!", "body": "Hello [Customer Name],\\n\\nWe are excited to share..."}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
    });

    let draftContent = response.text?.trim() || "";
    
    // Remove potential markdown fences if returned
    if (draftContent.startsWith("```")) {
      draftContent = draftContent.replace(/^```json\s*/i, "").replace(/```$/, "").trim();
    }

    const parsedDraft = JSON.parse(draftContent);

    if (!parsedDraft.subject || !parsedDraft.body) {
      throw new Error("Invalid draft structure returned from AI.");
    }

    return NextResponse.json(
      new ApiResponse(200, parsedDraft, "AI Email draft generated successfully.")
    );
  } catch (error) {
    console.error("AI Email Drafting Error:", error);

    // Fallback draft in case of failure or syntax issues
    const discountText = discount > 0 ? ` with a special launch discount of ${discount}% off` : "";
    const fallbackDraft = {
      subject: `New Arrival: Discover the ${product.name}!`,
      body: `Hello [Customer Name],\n\nWe are thrilled to introduce the all-new ${product.name} by ${brandName} to our collection! As a valued shopper of our ${categoryName} range, we wanted you to be the first to know.\n\nExplore our latest addition today${discountText} and upgrade your stationery collection!\n\nBest regards,\nAdarsh Stationery Team`
    };

    return NextResponse.json(
      new ApiResponse(200, fallbackDraft, "AI Generation failed, fallback draft returned.")
    );
  }
});
