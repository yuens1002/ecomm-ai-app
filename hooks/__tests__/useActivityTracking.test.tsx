import { renderHook } from "@testing-library/react";
import { useSession } from "next-auth/react";
import { useActivityTracking } from "../useActivityTracking";

// Mock next-auth
jest.mock("next-auth/react", () => ({
  useSession: jest.fn(),
}));

const mockUseSession = useSession as jest.MockedFunction<typeof useSession>;

describe("useActivityTracking", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    sessionStorage.clear();
    global.fetch = jest.fn();
  });

  describe("session ID management", () => {
    it("should persist session ID in sessionStorage", () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: "unauthenticated",
        update: jest.fn(),
      });

      renderHook(() => useActivityTracking());

      // Session ID should be created and stored
      const sessionId = sessionStorage.getItem("artisan_session_id");
      expect(sessionId).toBeTruthy();
      expect(sessionId).toMatch(/^session_\d+_[a-z0-9]+$/);
    });

    it("should retrieve existing session ID from sessionStorage", () => {
      const existingId = "session_123_existing";
      sessionStorage.setItem("artisan_session_id", existingId);

      mockUseSession.mockReturnValue({
        data: null,
        status: "unauthenticated",
        update: jest.fn(),
      });

      renderHook(() => useActivityTracking());

      // Should keep the existing ID
      const sessionId = sessionStorage.getItem("artisan_session_id");
      expect(sessionId).toBe(existingId);
    });
  });

  describe("trackActivity", () => {
    it("should send PRODUCT_VIEW activity for authenticated user", async () => {
      const mockFetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      });
      global.fetch = mockFetch;

      mockUseSession.mockReturnValue({
        data: {
          user: { id: "user-123", email: "test@example.com" },
          expires: new Date(Date.now() + 86400000).toISOString(),
        },
        status: "authenticated",
        update: jest.fn(),
      });

      const { result } = renderHook(() => useActivityTracking());

      await result.current.trackActivity({
        activityType: "PRODUCT_VIEW",
        productId: "prod-456",
      });

      expect(mockFetch).toHaveBeenCalled();
      const fetchCall = mockFetch.mock.calls[0];
      expect(fetchCall[0]).toBe("/api/track-activity");

      const requestBody = JSON.parse(fetchCall[1].body);
      expect(requestBody.activityType).toBe("PRODUCT_VIEW");
      expect(requestBody.productId).toBe("prod-456");
      expect(requestBody.userId).toBe("user-123");
      expect(requestBody.sessionId).toBeTruthy();
    });

    it("should send ADD_TO_CART activity", async () => {
      const mockFetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      });
      global.fetch = mockFetch;

      mockUseSession.mockReturnValue({
        data: {
          user: { id: "user-789" },
          expires: new Date(Date.now() + 86400000).toISOString(),
        },
        status: "authenticated",
        update: jest.fn(),
      });

      const { result } = renderHook(() => useActivityTracking());

      await result.current.trackActivity({
        activityType: "ADD_TO_CART",
        productId: "prod-123",
      });

      expect(mockFetch).toHaveBeenCalled();
      const fetchCall = mockFetch.mock.calls[0];
      const requestBody = JSON.parse(fetchCall[1].body);
      expect(requestBody.activityType).toBe("ADD_TO_CART");
      expect(requestBody.productId).toBe("prod-123");
      expect(requestBody.userId).toBe("user-789");
    });

    it("should send REMOVE_FROM_CART activity", async () => {
      const mockFetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      });
      global.fetch = mockFetch;

      mockUseSession.mockReturnValue({
        data: null,
        status: "unauthenticated",
        update: jest.fn(),
      });

      const { result } = renderHook(() => useActivityTracking());

      await result.current.trackActivity({
        activityType: "REMOVE_FROM_CART",
        productId: "prod-999",
      });

      expect(mockFetch).toHaveBeenCalled();
      const fetchCall = mockFetch.mock.calls[0];
      const requestBody = JSON.parse(fetchCall[1].body);
      expect(requestBody.activityType).toBe("REMOVE_FROM_CART");
      expect(requestBody.productId).toBe("prod-999");
      expect(requestBody.userId).toBe(null);
    });

    it("should silently handle fetch errors without throwing", async () => {
      const mockFetch = jest.fn().mockRejectedValue(new Error("Network error"));
      global.fetch = mockFetch;

      const errorSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});

      mockUseSession.mockReturnValue({
        data: null,
        status: "unauthenticated",
        update: jest.fn(),
      });

      const { result } = renderHook(() => useActivityTracking());

      // Should not throw
      await expect(
        result.current.trackActivity({
          activityType: "PRODUCT_VIEW",
          productId: "prod-123",
        })
      ).resolves.not.toThrow();

      errorSpy.mockRestore();
    });

    it("should silently handle non-ok responses", async () => {
      const mockFetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
      });
      global.fetch = mockFetch;

      mockUseSession.mockReturnValue({
        data: null,
        status: "unauthenticated",
        update: jest.fn(),
      });

      const { result } = renderHook(() => useActivityTracking());

      // Should not throw
      await expect(
        result.current.trackActivity({
          activityType: "PRODUCT_VIEW",
          productId: "prod-123",
        })
      ).resolves.not.toThrow();
    });
  });
});
