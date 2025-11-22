import { VOICE_BARISTA_SYSTEM_PROMPT } from "./voice-barista-system-prompt";

export const VAPI_ASSISTANT_CONFIG = {
  name: "Artisan Roast Barista",
  // Temporary localtunnel configuration
  server: {
    url: "https://stupid-cases-joke.loca.lt/api/vapi/webhook",
    secret: "8f6a9b2e-5d4c-4f3d-9f4b-1c3e5d7a9b2c-artisan-roast-webhook",
    headers: {
      "x-vapi-secret":
        "8f6a9b2e-5d4c-4f3d-9f4b-1c3e5d7a9b2c-artisan-roast-webhook",
      // Bypass localtunnel warning page
      "bypass-tunnel-reminder": "true",
      "User-Agent": "Vapi-Webhook/1.0",
    },
  },
  firstMessage:
    "Hi there. I'm your Artisan Roast barista. I can help you find the perfect coffee... or check your order status. How can I help you today?",
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
