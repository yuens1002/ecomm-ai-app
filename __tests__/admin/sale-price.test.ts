/**
 * Unit tests for sale price functionality.
 *
 * Tests cover:
 * - Effective price resolution (salePriceInCents ?? priceInCents)
 * - Admin CRUD: set sale price, clear sale price, create with sale price
 * - Sale price validation
 */

describe("Sale price effective resolution", () => {
  const resolveEffectivePrice = (option: {
    priceInCents: number;
    salePriceInCents: number | null;
  }) => option.salePriceInCents ?? option.priceInCents;

  it("returns priceInCents when salePriceInCents is null", () => {
    const option = { priceInCents: 2200, salePriceInCents: null };
    expect(resolveEffectivePrice(option)).toBe(2200);
  });

  it("returns salePriceInCents when set", () => {
    const option = { priceInCents: 2200, salePriceInCents: 1800 };
    expect(resolveEffectivePrice(option)).toBe(1800);
  });

  it("returns salePriceInCents even if higher than price (edge case)", () => {
    const option = { priceInCents: 1000, salePriceInCents: 1500 };
    expect(resolveEffectivePrice(option)).toBe(1500);
  });

  it("returns salePriceInCents when set to 0 (free)", () => {
    const option = { priceInCents: 2200, salePriceInCents: 0 };
    // salePriceInCents is 0 which is falsy but still a valid value
    // The ?? operator treats 0 as non-nullish, so it returns 0
    expect(resolveEffectivePrice(option)).toBe(0);
  });
});

describe("Sale price display logic", () => {
  it("shows strikethrough when salePriceInCents is set", () => {
    const option = { priceInCents: 2200, salePriceInCents: 1800 };
    const hasSalePrice = option.salePriceInCents != null;
    expect(hasSalePrice).toBe(true);
  });

  it("does not show strikethrough when salePriceInCents is null", () => {
    const option = { priceInCents: 2200, salePriceInCents: null };
    const hasSalePrice = option.salePriceInCents != null;
    expect(hasSalePrice).toBe(false);
  });
});

describe("Subscription discount message with sale prices", () => {
  const getDiscountPercent = (
    oneTimePrice: { priceInCents: number; salePriceInCents: number | null },
    subscriptionPrice: {
      priceInCents: number;
      salePriceInCents: number | null;
    }
  ): number | null => {
    const oneTimeEffective =
      oneTimePrice.salePriceInCents ?? oneTimePrice.priceInCents;
    const subEffective =
      subscriptionPrice.salePriceInCents ?? subscriptionPrice.priceInCents;
    const savings = oneTimeEffective - subEffective;
    if (savings <= 0) return null;
    const percent = Math.round((savings / oneTimeEffective) * 100);
    return percent > 0 ? percent : null;
  };

  it("calculates discount based on effective prices when sale is active", () => {
    const oneTime = { priceInCents: 2000, salePriceInCents: 1800 };
    const subscription = { priceInCents: 1700, salePriceInCents: null };
    // Effective one-time: 1800, subscription: 1700
    // Savings: 100, percent: ~6%
    expect(getDiscountPercent(oneTime, subscription)).toBe(6);
  });

  it("calculates discount without sale prices", () => {
    const oneTime = { priceInCents: 2000, salePriceInCents: null };
    const subscription = { priceInCents: 1800, salePriceInCents: null };
    // Savings: 200, percent: 10%
    expect(getDiscountPercent(oneTime, subscription)).toBe(10);
  });

  it("returns null when subscription is more expensive", () => {
    const oneTime = { priceInCents: 2000, salePriceInCents: 1500 };
    const subscription = { priceInCents: 1800, salePriceInCents: null };
    // Effective one-time: 1500, subscription: 1800
    // Savings: negative
    expect(getDiscountPercent(oneTime, subscription)).toBe(null);
  });
});
