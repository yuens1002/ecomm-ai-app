import { VoiceBaristaSystemPrompt } from "./voice-barista-system-prompt";

export const VAPI_ASSISTANT_CONFIG = {
  name: "Artisan Roast Barista",
  firstMessage: "Hi! I'm your Artisan Roast barista. I can help you find the perfect coffee or check your order status. How can I help you today?",
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
    model: "gpt-4-turbo",
    messages: [
      {
        role: "system",
        content: VoiceBaristaSystemPrompt,
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
                roastLevel: { type: "string", enum: ["light", "medium", "dark"] },
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
            purchaseType: { type: "string", enum: ["ONE_TIME", "SUBSCRIPTION"] },
            billingInterval: { type: "string", enum: ["WEEK", "MONTH"] },
            billingIntervalCount: { type: "number" },
          },
          required: ["productId", "variantId", "purchaseType"],
        },
      },
    ],
  },
};
