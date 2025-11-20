import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { VOICE_BARISTA_SYSTEM_PROMPT } from "@/lib/voice-barista-system-prompt";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { message, conversationHistory } = await req.json();

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    // Get user context (full order history for better personalization)
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        orders: {
          orderBy: { createdAt: "desc" },
          include: {
            items: {
              include: {
                purchaseOption: {
                  include: {
                    variant: {
                      include: {
                        product: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
        addresses: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get all products for context
    const products = await prisma.product.findMany({
      include: {
        variants: {
          include: {
            purchaseOptions: true,
          },
        },
      },
    });

    // Build context for AI
    const userContext = {
      name: user.name,
      email: user.email,
      orderHistory: user.orders.map((order) => ({
        id: order.id,
        date: order.createdAt,
        items: order.items.map((item) => ({
          product: item.purchaseOption?.variant?.product?.name || "Unknown",
          size: item.purchaseOption?.variant?.name || "Unknown",
          quantity: item.quantity,
        })),
      })),
      favoriteProducts: getFavoriteProducts(user.orders),
    };

    const productsContext = products.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      description: p.description,
      roastLevel: p.roastLevel,
      origin: p.origin,
      tastingNotes: p.tastingNotes,
      variants: p.variants.map((v) => ({
        id: v.id,
        name: v.name,
        weightInGrams: v.weightInGrams,
        purchaseOptions: v.purchaseOptions.map((po) => ({
          id: po.id,
          type: po.type,
          price: po.priceInCents / 100,
        })),
      })),
    }));

    // Build conversation prompt
    const conversationContext = conversationHistory
      ? conversationHistory
          .map(
            (msg: { role: string; text: string }) =>
              `${msg.role === "user" ? "Customer" : "Barista"}: ${msg.text}`
          )
          .join("\n")
      : "";

    const prompt = `${VOICE_BARISTA_SYSTEM_PROMPT}

## Current User Context
${JSON.stringify(userContext, null, 2)}

## Available Products
${JSON.stringify(productsContext, null, 2)}

## Conversation So Far
${conversationContext}

Customer: ${message}
Barista:`;

    // Call Gemini AI via REST API
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not set");
    }

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    // Structure prompt consistently to enable Gemini's automatic caching
    // Static content (system + products) sent first encourages cache hits
    const requestBody = {
      contents: [
        {
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        maxOutputTokens: 1000,
        temperature: 0.7,
        thinkingConfig: {
          thinkingBudget: 200, // Limit thinking to save tokens for response
        },
      },
    };

    const aiResponse = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("Gemini API error:", aiResponse.status, errorText);

      // Handle rate limit
      if (aiResponse.status === 429) {
        return NextResponse.json({
          message:
            "I'm experiencing high demand right now. Please try again in a moment! ☕",
          error: "rate_limit",
        });
      }

      // Handle service unavailable/overload
      if (aiResponse.status === 503) {
        return NextResponse.json({
          message:
            "I'm taking a quick coffee break! Please try again in a few seconds. ☕",
          error: "service_unavailable",
        });
      }

      throw new Error(
        `Gemini API error: ${aiResponse.status} ${aiResponse.statusText}`
      );
    }

    const aiData = await aiResponse.json();

    // Better error handling for missing data
    if (!aiData.candidates || aiData.candidates.length === 0) {
      console.error("No candidates in response:", aiData);
      return NextResponse.json({
        message:
          "I'm having trouble processing that request. Could you try rephrasing? ☕",
        error: "no_candidates",
      });
    }

    const candidate = aiData.candidates[0];

    // Check for safety blocks or other finish reasons
    if (candidate.finishReason && candidate.finishReason !== "STOP") {
      console.error("Unusual finish reason:", candidate.finishReason);
      return NextResponse.json({
        message:
          "I couldn't complete that response. Please try a different question. ☕",
        error: "blocked_or_error",
      });
    }

    const text = candidate?.content?.parts?.[0]?.text;

    if (!text) {
      console.error("No text in response candidate");
      return NextResponse.json({
        message: "I couldn't generate a proper response. Please try again. ☕",
        error: "no_text",
      });
    }

    return NextResponse.json({
      message: text.trim(),
      userContext: {
        hasOrders: user.orders.length > 0,
        favoriteProducts: getFavoriteProducts(user.orders),
      },
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "Failed to process message" },
      { status: 500 }
    );
  }
}

// Helper function to get favorite products
function getFavoriteProducts(
  orders: Array<{
    items: Array<{
      purchaseOption: {
        variant: {
          product: { id: string; name: string };
        };
      } | null;
    }>;
  }>
) {
  const productCounts = new Map<string, { name: string; count: number }>();

  orders.forEach((order) => {
    order.items.forEach((item) => {
      const product = item.purchaseOption?.variant?.product;
      if (!product) return;

      const existing = productCounts.get(product.id);
      if (existing) {
        existing.count++;
      } else {
        productCounts.set(product.id, {
          name: product.name,
          count: 1,
        });
      }
    });
  });

  return Array.from(productCounts.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 3)
    .map((p) => p.name);
}
