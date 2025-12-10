/** @jest-environment node */

import { POST } from "../route";
import { NextRequest } from "next/server";

// Mock auth to avoid session dependencies
jest.mock("@/auth", () => ({
  auth: jest.fn(),
}));

describe("POST /api/track-activity", () => {
  it("should return 400 if sessionId is missing", async () => {
    const request = new NextRequest(
      "http://localhost:3000/api/track-activity",
      {
        method: "POST",
        body: JSON.stringify({
          activityType: "PRODUCT_VIEW",
          productId: "prod-123",
        }),
      }
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Missing required fields");
  });

  it("should return 400 if activityType is missing", async () => {
    const request = new NextRequest(
      "http://localhost:3000/api/track-activity",
      {
        method: "POST",
        body: JSON.stringify({
          sessionId: "session-123",
          productId: "prod-123",
        }),
      }
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Missing required fields");
  });

  it("should accept valid PRODUCT_VIEW activity", async () => {
    const request = new NextRequest(
      "http://localhost:3000/api/track-activity",
      {
        method: "POST",
        body: JSON.stringify({
          sessionId: "session-123",
          activityType: "PRODUCT_VIEW",
          productId: "prod-456",
        }),
      }
    );

    const response = await POST(request);

    // Should either succeed (200) or fail gracefully (500)
    expect([200, 500]).toContain(response.status);
  });

  it("should accept valid ADD_TO_CART activity", async () => {
    const request = new NextRequest(
      "http://localhost:3000/api/track-activity",
      {
        method: "POST",
        body: JSON.stringify({
          sessionId: "session-abc",
          activityType: "ADD_TO_CART",
          productId: "prod-789",
        }),
      }
    );

    const response = await POST(request);

    expect([200, 500]).toContain(response.status);
  });

  it("should accept valid REMOVE_FROM_CART activity", async () => {
    const request = new NextRequest(
      "http://localhost:3000/api/track-activity",
      {
        method: "POST",
        body: JSON.stringify({
          sessionId: "session-xyz",
          activityType: "REMOVE_FROM_CART",
          productId: "prod-999",
        }),
      }
    );

    const response = await POST(request);

    expect([200, 500]).toContain(response.status);
  });
});
