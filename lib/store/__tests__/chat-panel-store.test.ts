/** @jest-environment node */
/**
 * Iter-7b AC-TST-4: filterByChip targets last assistant message by role,
 * even when a trailing user bubble is present.
 */

import { useChatPanelStore } from "@/lib/store/chat-panel-store";
import type { ChatMessage, ProductSummary } from "@/lib/store/chat-panel-store";

const makeProduct = (roastLevel: string, id = "p1", description: string | null = null): ProductSummary => ({
  id,
  name: `Coffee ${id}`,
  slug: `coffee-${id}`,
  imageUrl: null,
  categorySlug: null,
  productType: "COFFEE",
  roastLevel,
  tastingNotes: [],
  description,
});

const darkProduct = makeProduct("dark", "p-dark");
const lightProduct = makeProduct("light", "p-light");

describe("filterByChip — targets last assistant message by role (iter-7b AC-TST-4)", () => {
  beforeEach(() => {
    // Reset store state between tests
    useChatPanelStore.setState({
      messages: [],
      allProducts: [],
    });
  });

  it("updates the last assistant message even when a trailing user bubble is present", () => {
    const allProducts = [darkProduct, lightProduct];

    const assistantMsg: ChatMessage = {
      id: "assistant-1",
      role: "assistant",
      content: "Here are your results.",
      products: allProducts,
      followUps: ["Bold", "Light"],
    };

    const userBubble: ChatMessage = {
      id: "u-chip-1234",
      role: "user",
      content: "Bold",
    };

    useChatPanelStore.setState({
      messages: [assistantMsg, userBubble],
      allProducts,
    });

    useChatPanelStore.getState().filterByChip("bold");

    const messages = useChatPanelStore.getState().messages;

    // The assistant message (index 0) should have narrowed products
    const updatedAssistant = messages.find((m) => m.id === "assistant-1");
    expect(updatedAssistant).toBeDefined();
    expect(updatedAssistant?.products?.every((p) => p.roastLevel === "dark")).toBe(true);

    // The user bubble (index 1) should be untouched
    const userMsg = messages.find((m) => m.id === "u-chip-1234");
    expect(userMsg?.products).toBeUndefined();
  });

  it("clears followUps on the updated assistant message", () => {
    const allProducts = [darkProduct];

    useChatPanelStore.setState({
      messages: [
        {
          id: "assistant-1",
          role: "assistant",
          content: "Results.",
          products: allProducts,
          followUps: ["Bold", "Light", "Fruity"],
        },
      ],
      allProducts,
    });

    useChatPanelStore.getState().filterByChip("bold");

    const messages = useChatPanelStore.getState().messages;
    const updated = messages.find((m) => m.id === "assistant-1");
    expect(updated?.followUps).toEqual([]);
  });

  it("falls back to full allProducts when chip matches nothing", () => {
    const allProducts = [darkProduct, lightProduct];

    useChatPanelStore.setState({
      messages: [
        {
          id: "assistant-1",
          role: "assistant",
          content: "Results.",
          products: allProducts,
        },
      ],
      allProducts,
    });

    useChatPanelStore.getState().filterByChip("xyznonexistent");

    const messages = useChatPanelStore.getState().messages;
    const updated = messages.find((m) => m.id === "assistant-1");
    // Fallback: all products returned
    expect(updated?.products).toHaveLength(2);
  });

  it("falls through to text search when roast keyword maps to an absent roast level", () => {
    // "Bold and rich" → "bold" maps to "dark", but all products are medium-roast.
    // Should fall through to word-level text search and match on "rich" in description.
    const richMedium = makeProduct("medium", "p-medium", "Rich chocolate and caramel notes");
    const plainMedium = makeProduct("medium", "p-plain", "Clean and bright");
    const allProducts = [richMedium, plainMedium];

    useChatPanelStore.setState({
      messages: [
        {
          id: "assistant-1",
          role: "assistant",
          content: "Here are medium roasts that work well with milk.",
          products: allProducts,
        },
      ],
      allProducts,
    });

    useChatPanelStore.getState().filterByChip("Bold and rich");

    const messages = useChatPanelStore.getState().messages;
    const updated = messages.find((m) => m.id === "assistant-1");
    // "bold" → dark → 0 results → falls through to text search
    // "rich" matches richMedium.description → only that product returned
    expect(updated?.products).toHaveLength(1);
    expect(updated?.products?.[0].id).toBe("p-medium");
  });
});
