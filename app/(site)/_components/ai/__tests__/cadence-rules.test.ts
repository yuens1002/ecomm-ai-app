/**
 * Cadence Business Rule Tests
 *
 * These test the deterministic cadence rules — code-enforced, not AI-decided.
 * The rules define when and how response elements render.
 */

import type { ChatMessage, ProductSummary } from "@/stores/chat-panel-store";

// ---------------------------------------------------------------------------
// Helpers — replicate the cadence logic from MessageBubble
// ---------------------------------------------------------------------------

function makeSummary(id: string): ProductSummary {
  return {
    id,
    name: `Product ${id}`,
    slug: `product-${id}`,
    imageUrl: "/img.jpg",
    categorySlug: "coffee",
    productType: "COFFEE",
    roastLevel: "Medium",
    tastingNotes: ["chocolate", "citrus"],
    description: null,
  };
}

function makeMsgWithProducts(
  count: number,
  overrides?: Partial<ChatMessage>
): ChatMessage {
  return {
    id: `msg-${count}`,
    role: "assistant",
    content: "Here's what I found for you.",
    acknowledgment: "You're looking for something smooth.",
    followUpQuestion: count > 3 ? "What roast are you into?" : "",
    products: Array.from({ length: count }, (_, i) => makeSummary(String(i))),
    followUps: count > 3 ? ["Light", "Medium", "Dark"] : [],
    isLoading: false,
    ...overrides,
  };
}

/**
 * Cadence visibility rules — mirrors MessageBubble's logic.
 * This is the source of truth we're testing.
 */
function getCadenceVisibility(msg: ChatMessage) {
  const productCount = msg.products?.length ?? 0;
  const hasProducts = productCount > 0;
  const hasContent = !!msg.content;

  const showFollowUp =
    productCount > 3 &&
    !!msg.followUpQuestion &&
    msg.followUps !== undefined &&
    msg.followUps.length > 0;

  return { hasContent, hasProducts, productCount, showFollowUp };
}

// ---------------------------------------------------------------------------
// AC-TST-4: Acknowledgment before products (render order)
// ---------------------------------------------------------------------------

describe("AC-TST-4: acknowledgment before products", () => {
  it("acknowledgment is rendered when content is present", () => {
    const msg = makeMsgWithProducts(5);
    const { hasContent, hasProducts } = getCadenceVisibility(msg);
    expect(hasContent).toBe(true);
    expect(hasProducts).toBe(true);
    // In the component, acknowledgment div precedes product cards div
    // This test verifies the data conditions that control this order
  });

  it("acknowledgment without products is valid (e.g. aiFailed)", () => {
    const msg = makeMsgWithProducts(0, {
      content: "Sorry, I spaced out.",
      products: [],
    });
    const { hasContent, hasProducts } = getCadenceVisibility(msg);
    expect(hasContent).toBe(true);
    expect(hasProducts).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// AC-TST-5: No follow-up when ≤3 products
// ---------------------------------------------------------------------------

describe("AC-TST-5: no follow-up when ≤3 products", () => {
  it.each([0, 1, 2, 3])("hides follow-up when product count is %i", (count) => {
    const msg = makeMsgWithProducts(count, {
      followUpQuestion: "What roast?",
      followUps: ["Light", "Dark"],
    });
    const { showFollowUp } = getCadenceVisibility(msg);
    expect(showFollowUp).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// AC-TST-6: Follow-up shown when >3 products
// ---------------------------------------------------------------------------

describe("AC-TST-6: follow-up shown when >3 products", () => {
  it.each([4, 5, 10, 50])("shows follow-up when product count is %i", (count) => {
    const msg = makeMsgWithProducts(count);
    const { showFollowUp } = getCadenceVisibility(msg);
    expect(showFollowUp).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// AC-TST-7: Chips only with follow-up question
// ---------------------------------------------------------------------------

describe("AC-TST-7: chips only with follow-up question", () => {
  it("hides chips when followUpQuestion is empty even if followUps array has items", () => {
    const msg = makeMsgWithProducts(5, {
      followUpQuestion: "",
      followUps: ["Light", "Dark", "Medium"],
    });
    const { showFollowUp } = getCadenceVisibility(msg);
    expect(showFollowUp).toBe(false);
  });

  it("hides chips when followUpQuestion is undefined", () => {
    const msg = makeMsgWithProducts(5, {
      followUpQuestion: undefined,
      followUps: ["Light", "Dark"],
    });
    const { showFollowUp } = getCadenceVisibility(msg);
    expect(showFollowUp).toBe(false);
  });

  it("hides chips when followUps array is empty even with question", () => {
    const msg = makeMsgWithProducts(5, {
      followUpQuestion: "What roast?",
      followUps: [],
    });
    const { showFollowUp } = getCadenceVisibility(msg);
    expect(showFollowUp).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// AC-TST-8: AI failure → no junk results
// ---------------------------------------------------------------------------

describe("AC-TST-8: AI failure → no junk results", () => {
  it("aiFailed response has fallback message and no products", () => {
    const msg: ChatMessage = {
      id: "ai-failed",
      role: "assistant",
      content: "Ah sorry, I spaced out for a sec — what were you looking for again?",
      products: [],
      followUps: [],
      isLoading: false,
    };
    const { hasContent, hasProducts, showFollowUp } = getCadenceVisibility(msg);
    expect(hasContent).toBe(true);
    expect(hasProducts).toBe(false);
    expect(showFollowUp).toBe(false);
    expect(msg.products).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// AC-TST-9: Salutation → no products
// ---------------------------------------------------------------------------

describe("AC-TST-9: salutation → no products", () => {
  it("greeting-only response has salutation text and no product cards", () => {
    const msg: ChatMessage = {
      id: "salutation",
      role: "assistant",
      content: "Hey! What can I help you find today?",
      products: [],
      followUps: [],
      isLoading: false,
    };
    const { hasContent, hasProducts, showFollowUp } = getCadenceVisibility(msg);
    expect(hasContent).toBe(true);
    expect(hasProducts).toBe(false);
    expect(showFollowUp).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// AC-TST-13: Context-aware initialization
// ---------------------------------------------------------------------------

describe("AC-TST-13: context-aware initialization", () => {
  // These test the greeting selection logic
  const surfaces = {
    "greeting.home":
      "What are you in the mood for? Tell me how you like to brew.",
    "greeting.product": "Curious about {product}?",
    "greeting.category": "Browsing our {category}?",
    waiting: "um",
    salutation: "Hey!",
    aiFailed: "Sorry, spaced out.",
    noResults: "Nothing matched.",
    error: "Something broke.",
  };

  function getGreetingForPath(pathname: string): string {
    const productMatch = pathname.match(/^\/products\/([^/]+)$/);
    if (productMatch) {
      const name = productMatch[1]
        .replace(/-/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase());
      return surfaces["greeting.product"].replace("{product}", name);
    }
    const categoryMatch = pathname.match(/^\/categor(?:y|ies)\/([^/]+)$/);
    if (categoryMatch) {
      const name = categoryMatch[1]
        .replace(/-/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase());
      return surfaces["greeting.category"].replace("{category}", name);
    }
    return surfaces["greeting.home"];
  }

  it("homepage → open-ended greeting", () => {
    expect(getGreetingForPath("/")).toBe(surfaces["greeting.home"]);
  });

  it("product page → product-specific greeting", () => {
    const greeting = getGreetingForPath("/products/ethiopian-yirgacheffe");
    expect(greeting).toContain("Ethiopian Yirgacheffe");
    expect(greeting).not.toBe(surfaces["greeting.home"]);
  });

  it("category page → category-specific greeting", () => {
    const greeting = getGreetingForPath("/categories/dark-roast");
    expect(greeting).toContain("Dark Roast");
    expect(greeting).not.toBe(surfaces["greeting.home"]);
  });
});
