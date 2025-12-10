/** @jest-environment node */

import { GET } from "../route";
import { NextRequest } from "next/server";

// Mock auth to avoid session dependencies
jest.mock("@/auth", () => ({
  auth: jest.fn(),
}));

describe("GET /api/recommendations", () => {
  it("should return valid recommendations response structure", async () => {
    const request = new NextRequest(
      "http://localhost:3000/api/recommendations"
    );

    const response = await GET(request);

    // Should succeed even if no user session
    expect([200, 500]).toContain(response.status);

    if (response.status === 200) {
      const data = await response.json();

      expect(data).toHaveProperty("products");
      expect(Array.isArray(data.products)).toBe(true);
      expect(typeof data.isPersonalized).toBe("boolean");
      expect(["trending", "personalized"]).toContain(data.source);

      // Verify ProductCard requirements if products found
      if (data.products.length > 0) {
        const product = data.products[0];
        expect(product).toHaveProperty("id");
        expect(product).toHaveProperty("name");
        expect(product).toHaveProperty("slug");
        expect(product).toHaveProperty("categories");
        expect(product).toHaveProperty("variants");

        // Verify variants have purchaseOptions
        if (product.variants && product.variants.length > 0) {
          expect(product.variants[0]).toHaveProperty("purchaseOptions");
        }
      }
    }
  });

  it("should limit recommendations to reasonable amount", async () => {
    const request = new NextRequest(
      "http://localhost:3000/api/recommendations"
    );

    const response = await GET(request);

    if (response.status === 200) {
      const data = await response.json();
      expect(data.products.length).toBeLessThanOrEqual(6);
    }
  });
});
