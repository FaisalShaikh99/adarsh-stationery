import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function POST(req) {
  try {
    const { productName, brand, category } = await req.json();

    // Strict prompt to get clean JSON options from AI
    const prompt = `You are an expert copywriter for Adarsh Stationery store. 
    Generate 3 distinct description options for a product with Name: "${productName}", Brand: "${brand}", under Category: "${category}".
    Return the response ONLY as a strict JSON array of strings containing exactly 3 options. No markdown, no prose.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
    });

    // Parse the string text into a clean JavaScript array
    const options = JSON.parse(response.text); 

    return NextResponse.json({ success: true, options });
  } catch (error) {
    console.warn("AI generation failed, generating fallback options:", error.message);
    const pName = productName || "Stationery Item";
    const bName = brand || "Generic";
    const cName = category || "Office Supply";
    
    const options = [
      `Premium ${pName} by ${bName}. This high-quality item is crafted for professional results, delivering maximum reliability and a superior feel.`,
      `The ultimate addition to your ${cName} catalog. High-grade ${pName} engineered by ${bName} to stand the test of time.`,
      `Bring professional results with ${bName}'s deluxe ${pName}. Specifically designed for students and professionals alike.`
    ];

    return NextResponse.json({ success: true, options, fallback: true });
  }
}