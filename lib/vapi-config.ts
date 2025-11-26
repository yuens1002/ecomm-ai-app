import { VOICE_BARISTA_SYSTEM_PROMPT } from "./voice-barista-system-prompt";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL;
const LOCALTUNNEL_URL = "https://stupid-cases-joke.loca.lt";

// Use the production URL if available and not localhost, otherwise fallback to localtunnel
const BASE_URL =
  APP_URL && !APP_URL.includes("localhost") ? APP_URL : LOCALTUNNEL_URL;

const isLocaltunnel = BASE_URL.includes("loca.lt");

const VAPI_WEBHOOK_SECRET = process.env.NEXT_PUBLIC_VAPI_WEBHOOK_SECRET || "";

// Note: This config uses a hardcoded store name for VAPI assistant.
// In production, you would dynamically fetch the store name from settings
// when creating the assistant via the VAPI API.
const STORE_NAME = "Artisan Roast"; // TODO: Make dynamic via admin settings

export const VAPI_ASSISTANT_CONFIG = {
  name: `${STORE_NAME} Barista`,
  server: {
    url: `${BASE_URL}/api/vapi/webhook`,
    secret: VAPI_WEBHOOK_SECRET,
    headers: {
      "x-vapi-secret": VAPI_WEBHOOK_SECRET,
      "User-Agent": "Vapi-Webhook/1.0",
      // Only include bypass header for localtunnel
      ...(isLocaltunnel ? { "bypass-tunnel-reminder": "true" } : {}),
    },
  },
  firstMessage:
    `Hi there. I'm your ${STORE_NAME} barista. I can help you find the perfect coffee... or check your order status. How can I help you today?`,
  transcriber: {
    provider: "deepgram",
    model: "nova-2",
    language: "multi", // Auto-detect
  },
  voice: {
    provider: "11labs",
    voiceId: "21m00Tcm4TlvDq8ikWAM", // Rachel (default) - we can change this
  },
  model: {
    provider: "openai",
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: VOICE_BARISTA_SYSTEM_PROMPT,
      },
    ],
    functions: [
      {
        name: "getUserContext",
        description: "Get authenticated user's profile and preferences",
        parameters: { type: "object", properties: {} },
      },
      {
        name: "getOrderHistory",
        description: "Fetch user's recent orders for personalization",
        parameters: {
          type: "object",
          properties: {
            limit: { type: "number", description: "Number of orders to fetch" },
          },
        },
      },
      {
        name: "searchProducts",
        description: "Find products based on natural language query",
        parameters: {
          type: "object",
          properties: {
            query: { type: "string", description: "Search query" },
            filters: {
              type: "object",
              properties: {
                roastLevel: {
                  type: "string",
                  enum: ["light", "medium", "dark"],
                },
                origin: { type: "string" },
              },
            },
          },
        },
      },
      {
        name: "addToCart",
        description: "Add product variant to user's cart",
        parameters: {
          type: "object",
          properties: {
            productId: { type: "string" },
            variantId: { type: "string" },
            quantity: { type: "number" },
            purchaseType: {
              type: "string",
              enum: ["ONE_TIME", "SUBSCRIPTION"],
            },
            billingInterval: { type: "string", enum: ["WEEK", "MONTH"] },
            billingIntervalCount: { type: "number" },
          },
          required: ["productId", "variantId", "purchaseType"],
        },
      },
    ],
  },
};
