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
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    // Parse the string text into a clean JavaScript array
    const options = JSON.parse(response.text); 

    return NextResponse.json({ success: true, options });
  } catch (error) {
    return NextResponse.json({ success: false, message: "AI Engine Timeout" }, { status: 500 });
  }
}