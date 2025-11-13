import { NextResponse } from "next/server";
import { getProductsForAI } from "@/lib/data"; // <-- Import our new DAL function

// Define the expected structure of the *incoming* request body
interface RecommendRequest {
  taste: string;
  brewMethod: string;
  // --- 'products' array is REMOVED from the request ---
}

/**
 * API route to get an AI coffee recommendation.
 */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RecommendRequest;
    const { taste, brewMethod } = body;

    // --- 1. Input Validation ---
    if (!taste || !brewMethod) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    // --- 2. Fetch Products from Database (NEW) ---
    // We fetch the product list securely on the server.
    const products = await getProductsForAI();
    if (!products || products.length === 0) {
      throw new Error("No products found in database.");
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not set");
    }
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;

    // --- 3. Create the Product List for the Prompt ---
    const productList = products
      .map((p) => `- ${p.name}: (Tasting notes: ${p.tastingNotes.join(", ")})`)
      .join("\n");

    // --- 4. Engineer the AI Prompt ---
    const systemPrompt = `
      You are an expert coffee sommelier for "Artisan Roast," a specialty coffee roaster.
      A customer needs a recommendation.
      Your task is to recommend ONE coffee from the provided list that best matches the customer's preferences.
      You must ONLY recommend a coffee from the list.
      
      Your response should be friendly, concise (2-3 sentences), and justify your choice
      by connecting the coffee's tasting notes to the customer's preferences.
      Start by naming the coffee you recommend.

      Here is the list of available coffees:
      ${productList}
    `;

    const userQuery = `I typically enjoy coffee with ${taste} notes and I brew using a ${brewMethod}. Which coffee should I try?`;

    // --- 5. Construct the Gemini Payload ---
    const payload = {
      contents: [{ parts: [{ text: userQuery }] }],
      systemInstruction: {
        parts: [{ text: systemPrompt }],
      },
      generationConfig: {
        maxOutputTokens: 1000,
        temperature: 0.7,
      },
    };

    // --- 6. Call the Gemini API ---
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.error("Gemini API Error:", await response.text());
      throw new Error(`Gemini API failed with status: ${response.status}`);
    }

    const result = await response.json();
    const text = result.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      console.warn("Gemini Response:", result);
      throw new Error("No text in Gemini response");
    }

    // --- 7. Return the AI's response ---
    return NextResponse.json({ text });
  } catch (error) {
    console.error("AI Recommendation Error:", error);
    // Provide a generic error message to the client
    return new NextResponse(
      JSON.stringify({ message: "Internal Server Error" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
