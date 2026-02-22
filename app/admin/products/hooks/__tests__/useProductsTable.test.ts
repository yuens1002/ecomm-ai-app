import {
  comparisonFilter,
  categoriesFilter,
  productFilterToColumnFilters,
} from "../useProductsTable";

describe("comparisonFilter", () => {
  it("= operator: exact match", () => {
    expect(comparisonFilter(100, { operator: "=", num: 100 })).toBe(true);
    expect(comparisonFilter(99, { operator: "=", num: 100 })).toBe(false);
    expect(comparisonFilter(101, { operator: "=", num: 100 })).toBe(false);
  });

  it("≥ operator: greater than or equal", () => {
    expect(comparisonFilter(100, { operator: "≥", num: 100 })).toBe(true);
    expect(comparisonFilter(101, { operator: "≥", num: 100 })).toBe(true);
    expect(comparisonFilter(99, { operator: "≥", num: 100 })).toBe(false);
  });

  it("≤ operator: less than or equal", () => {
    expect(comparisonFilter(100, { operator: "≤", num: 100 })).toBe(true);
    expect(comparisonFilter(99, { operator: "≤", num: 100 })).toBe(true);
    expect(comparisonFilter(101, { operator: "≤", num: 100 })).toBe(false);
  });

  it("returns true for null/undefined filter (passthrough)", () => {
    expect(comparisonFilter(50, null)).toBe(true);
    expect(comparisonFilter(50, undefined)).toBe(true);
  });

  it("returns true for non-number num (passthrough)", () => {
    expect(comparisonFilter(50, { operator: "=", num: "abc" as unknown as number })).toBe(true);
  });

  it("returns true for unknown operator (passthrough)", () => {
    expect(comparisonFilter(50, { operator: "?", num: 50 })).toBe(true);
  });
});

describe("categoriesFilter", () => {
  const catA = { id: "a", name: "Coffee", order: 0 };
  const catB = { id: "b", name: "Merch", order: 1 };

  it("single category match", () => {
    expect(categoriesFilter([catA, catB], ["a"])).toBe(true);
    expect(categoriesFilter([catA, catB], ["b"])).toBe(true);
  });

  it("single category no match", () => {
    expect(categoriesFilter([catA], ["b"])).toBe(false);
  });

  it("multi-select: any match passes", () => {
    expect(categoriesFilter([catA], ["a", "b"])).toBe(true);
    expect(categoriesFilter([catB], ["a", "b"])).toBe(true);
  });

  it("uncategorized: matches products with no categories", () => {
    expect(categoriesFilter([], ["__uncategorized__"])).toBe(true);
    expect(categoriesFilter([catA], ["__uncategorized__"])).toBe(false);
  });

  it("uncategorized + specific: matches either", () => {
    expect(categoriesFilter([], ["__uncategorized__", "a"])).toBe(true);
    expect(categoriesFilter([catA], ["__uncategorized__", "a"])).toBe(true);
    expect(categoriesFilter([catB], ["__uncategorized__", "a"])).toBe(false);
  });

  it("empty filter array: returns all (passthrough)", () => {
    expect(categoriesFilter([catA], [])).toBe(true);
    expect(categoriesFilter([], [])).toBe(true);
  });

  it("null/undefined filter: returns all (passthrough)", () => {
    expect(categoriesFilter([catA], null)).toBe(true);
    expect(categoriesFilter([catA], undefined)).toBe(true);
  });
});

describe("productFilterToColumnFilters", () => {
  it("price filter converts dollars to cents", () => {
    const result = productFilterToColumnFilters({
      configId: "price",
      operator: "≥",
      value: 5,
    });
    expect(result).toEqual([{ id: "price", value: { operator: "≥", num: 500 } }]);
  });

  it("stock filter produces column filter with correct structure", () => {
    const result = productFilterToColumnFilters({
      configId: "stock",
      operator: "≤",
      value: 10,
    });
    expect(result).toEqual([{ id: "stock", value: { operator: "≤", num: 10 } }]);
  });

  it("defaults operator to = when not provided", () => {
    const result = productFilterToColumnFilters({
      configId: "price",
      value: 100,
    });
    expect(result).toEqual([{ id: "price", value: { operator: "=", num: 10000 } }]);
  });

  it("categories filter with values", () => {
    const result = productFilterToColumnFilters({
      configId: "categories",
      value: ["a", "b"],
    });
    expect(result).toEqual([{ id: "categories", value: ["a", "b"] }]);
  });

  it("categories filter with empty array returns no column filters", () => {
    const result = productFilterToColumnFilters({
      configId: "categories",
      value: [],
    });
    expect(result).toEqual([]);
  });

  it("non-numeric price value returns no column filters", () => {
    const result = productFilterToColumnFilters({
      configId: "price",
      value: "",
    });
    expect(result).toEqual([]);
  });
});
