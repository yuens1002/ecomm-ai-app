/** @jest-environment node */
/**
 * Iter-7b AC-TST-4: filterByChip targets last assistant message by role,
 * even when a trailing user bubble is present.
 */

import { useChatPanelStore } from "@/lib/store/chat-panel-store";
import type { ChatMessage, ProductSummary } from "@/lib/store/chat-panel-store";

const makeProduct = (
  roastLevel: string,
  id = "p1",
  description: string | null = null,
  tastingNotes: string[] = [],
): ProductSummary => ({
  id,
  name: `Coffee ${id}`,
  slug: `coffee-${id}`,
  imageUrl: null,
  categorySlug: null,
  productType: "COFFEE",
  roastLevel,
  tastingNotes,
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

  it("clears followUps when the chip narrows the result set", () => {
    // Need 2 products of different roast so "bold" actually narrows (dark only)
    const allProducts = [darkProduct, lightProduct];

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

  it("preserves followUps when chip does not narrow the result set", () => {
    // "xyznonexistent" matches nothing → fallback = allProducts → same length → no update
    const allProducts = [darkProduct, lightProduct];

    useChatPanelStore.setState({
      messages: [
        {
          id: "assistant-1",
          role: "assistant",
          content: "Results.",
          products: allProducts,
          followUps: ["Bold", "Light"],
        },
      ],
      allProducts,
    });

    useChatPanelStore.getState().filterByChip("xyznonexistent");

    const messages = useChatPanelStore.getState().messages;
    const updated = messages.find((m) => m.id === "assistant-1");
    // Chips must survive a non-narrowing chip click
    expect(updated?.followUps).toEqual(["Bold", "Light"]);
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

  it("brew method chip filters by suitable roast level (pour-over → light/medium)", () => {
    const mediumProduct = makeProduct("medium", "p-medium");
    const darkProduct2 = makeProduct("dark", "p-dark2");
    const allProducts = [mediumProduct, darkProduct2];

    useChatPanelStore.setState({
      messages: [{ id: "assistant-1", role: "assistant", content: "Results.", products: allProducts }],
      allProducts,
    });

    useChatPanelStore.getState().filterByChip("Pour-over");

    const messages = useChatPanelStore.getState().messages;
    const updated = messages.find((m) => m.id === "assistant-1");
    // Pour-over → light/medium; dark excluded
    expect(updated?.products?.every((p) => p.roastLevel !== "dark")).toBe(true);
    expect(updated?.products).toHaveLength(1);
  });

  it("'With milk' chip: stopword 'with' excluded, 'milk' matches tasting notes", () => {
    // "With milk" → chipWords should be ["milk"] (stopword "with" removed)
    // "milk" text-matches products with "Milk Chocolate" tasting note
    const milkChocMedium = makeProduct("medium", "p-milk", null, ["Milk Chocolate", "Caramel"]);
    const floralMedium = makeProduct("medium", "p-floral", null, ["Floral", "Citrus"]);
    const allProducts = [milkChocMedium, floralMedium];

    useChatPanelStore.setState({
      messages: [{ id: "assistant-1", role: "assistant", content: "Results.", products: allProducts }],
      allProducts,
    });

    useChatPanelStore.getState().filterByChip("With milk");

    const messages = useChatPanelStore.getState().messages;
    const updated = messages.find((m) => m.id === "assistant-1");
    // Only the milk-chocolate product should survive — stopword "with" must not cause a false match
    expect(updated?.products).toHaveLength(1);
    expect(updated?.products?.[0].id).toBe("p-milk");
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
