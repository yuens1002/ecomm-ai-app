import { renderHook, act } from "@testing-library/react";
import { useAddToCartWithFeedback, CartItemInput } from "../useAddToCartWithFeedback";
import { useCartStore } from "@/lib/store/cart-store";

// Mock the cart store
jest.mock("@/lib/store/cart-store", () => ({
  useCartStore: jest.fn(),
}));

const mockAddItem = jest.fn();
const mockGetTotalItems = jest.fn();
const mockSetCartOpen = jest.fn();

const mockCartStore = useCartStore as jest.MockedFunction<typeof useCartStore>;

const createMockItem = (): CartItemInput => ({
  productId: "prod-1",
  productName: "Test Coffee",
  productSlug: "test-coffee",
  variantId: "var-1",
  variantName: "12oz",
  purchaseOptionId: "po-1",
  purchaseType: "ONE_TIME",
  priceInCents: 1999,
  imageUrl: "/test.jpg",
});

describe("useAddToCartWithFeedback", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    // Setup mock implementations
    mockCartStore.mockImplementation((selector) => {
      const state = {
        addItem: mockAddItem,
        getTotalItems: mockGetTotalItems,
        setCartOpen: mockSetCartOpen,
      };
      return selector(state as never);
    });

    // Default: cart starts empty
    mockGetTotalItems.mockReturnValue(0);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe("Initial State", () => {
    it("starts with idle state", () => {
      const { result } = renderHook(() => useAddToCartWithFeedback());

      expect(result.current.buttonState).toBe("idle");
      expect(result.current.isCheckingOut).toBe(false);
      expect(result.current.lastAddedQuantity).toBe(0);
    });
  });

  describe("Add to Cart Flow", () => {
    it("transitions through states: idle → adding → added", async () => {
      mockGetTotalItems
        .mockReturnValueOnce(0) // Before add
        .mockReturnValue(1); // After add

      const { result } = renderHook(() => useAddToCartWithFeedback());

      act(() => {
        result.current.handleAddToCart(createMockItem(), 1);
      });

      // Should immediately be in adding state
      expect(result.current.buttonState).toBe("adding");

      // Advance past the brief delay (100ms)
      act(() => {
        jest.advanceTimersByTime(100);
      });

      expect(result.current.buttonState).toBe("added");
    });

    it("calls addItem with correct parameters", () => {
      const { result } = renderHook(() => useAddToCartWithFeedback());
      const item = createMockItem();

      act(() => {
        result.current.handleAddToCart(item, 2);
      });

      expect(mockAddItem).toHaveBeenCalledWith({
        ...item,
        quantity: 2,
      });
    });

    it("tracks lastAddedQuantity", () => {
      const { result } = renderHook(() => useAddToCartWithFeedback());

      act(() => {
        result.current.handleAddToCart(createMockItem(), 3);
      });

      expect(result.current.lastAddedQuantity).toBe(3);
    });
  });

  describe("Cart-Aware Transform", () => {
    it("shows 'buy-now' when cart was empty", () => {
      mockGetTotalItems
        .mockReturnValueOnce(0) // Before add
        .mockReturnValue(1); // After add

      const { result } = renderHook(() =>
        useAddToCartWithFeedback({ addedDuration: 100 })
      );

      act(() => {
        result.current.handleAddToCart(createMockItem(), 1);
      });

      // Advance to "added" state
      act(() => {
        jest.advanceTimersByTime(100);
      });

      // Advance past addedDuration
      act(() => {
        jest.advanceTimersByTime(100);
      });

      expect(result.current.buttonState).toBe("buy-now");
    });

    it("shows 'checkout-now' when cart has other items", () => {
      mockGetTotalItems
        .mockReturnValueOnce(2) // Before add (already has items)
        .mockReturnValue(3); // After add

      const { result } = renderHook(() =>
        useAddToCartWithFeedback({ addedDuration: 100 })
      );

      act(() => {
        result.current.handleAddToCart(createMockItem(), 1);
      });

      // Advance to "added" state
      act(() => {
        jest.advanceTimersByTime(100);
      });

      // Advance past addedDuration
      act(() => {
        jest.advanceTimersByTime(100);
      });

      expect(result.current.buttonState).toBe("checkout-now");
    });

    it("reverts to idle after actionReadyDuration", () => {
      mockGetTotalItems
        .mockReturnValueOnce(0)
        .mockReturnValue(1);

      const { result } = renderHook(() =>
        useAddToCartWithFeedback({
          addedDuration: 100,
          actionReadyDuration: 500,
        })
      );

      act(() => {
        result.current.handleAddToCart(createMockItem(), 1);
      });

      // Advance through all states
      act(() => {
        jest.advanceTimersByTime(100 + 100 + 500);
      });

      expect(result.current.buttonState).toBe("idle");
    });
  });

  describe("Action Click Handling", () => {
    it("opens cart drawer on checkout-now click", async () => {
      mockGetTotalItems
        .mockReturnValueOnce(1) // Already has items
        .mockReturnValue(2);

      const { result } = renderHook(() =>
        useAddToCartWithFeedback({ addedDuration: 100 })
      );

      act(() => {
        result.current.handleAddToCart(createMockItem(), 1);
      });

      // Advance to checkout-now state
      act(() => {
        jest.advanceTimersByTime(200);
      });

      expect(result.current.buttonState).toBe("checkout-now");

      // Click the action button
      await act(async () => {
        await result.current.handleActionClick();
      });

      expect(mockSetCartOpen).toHaveBeenCalledWith(true);
      expect(result.current.buttonState).toBe("idle");
    });
  });

  describe("Reset", () => {
    it("resets state to idle", () => {
      mockGetTotalItems
        .mockReturnValueOnce(0)
        .mockReturnValue(1);

      const { result } = renderHook(() =>
        useAddToCartWithFeedback({ addedDuration: 100 })
      );

      act(() => {
        result.current.handleAddToCart(createMockItem(), 1);
      });

      // Advance to buy-now state
      act(() => {
        jest.advanceTimersByTime(200);
      });

      expect(result.current.buttonState).toBe("buy-now");

      // Reset
      act(() => {
        result.current.reset();
      });

      expect(result.current.buttonState).toBe("idle");
      expect(result.current.isCheckingOut).toBe(false);
    });

    it("clears timeouts on reset", () => {
      mockGetTotalItems
        .mockReturnValueOnce(0)
        .mockReturnValue(1);

      const { result } = renderHook(() =>
        useAddToCartWithFeedback({
          addedDuration: 1000,
          actionReadyDuration: 5000,
        })
      );

      act(() => {
        result.current.handleAddToCart(createMockItem(), 1);
      });

      // Reset before transitions complete
      act(() => {
        result.current.reset();
      });

      // Advance time - should stay idle
      act(() => {
        jest.advanceTimersByTime(10000);
      });

      expect(result.current.buttonState).toBe("idle");
    });
  });

  describe("Rapid Clicks", () => {
    it("handles rapid add clicks by resetting state", () => {
      mockGetTotalItems.mockReturnValue(0);

      const { result } = renderHook(() =>
        useAddToCartWithFeedback({ addedDuration: 1000 })
      );

      // First click
      act(() => {
        result.current.handleAddToCart(createMockItem(), 1);
      });

      expect(result.current.buttonState).toBe("adding");

      // Immediate second click
      act(() => {
        result.current.handleAddToCart(createMockItem(), 1);
      });

      // Should restart the flow
      expect(result.current.buttonState).toBe("adding");
      expect(mockAddItem).toHaveBeenCalledTimes(2);
    });
  });
});
