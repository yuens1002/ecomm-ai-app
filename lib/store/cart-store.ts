import { create } from "zustand";
import { persist } from "zustand/middleware";

// --- Cart Item Interface ---
export interface CartItem {
  productId: string;
  productName: string;
  productSlug: string;
  categorySlug?: string; // Added for linking back to product page
  variantId: string;
  variantName: string; // e.g., "12oz"
  purchaseOptionId: string;
  purchaseType: "ONE_TIME" | "SUBSCRIPTION";
  priceInCents: number;
  quantity: number;
  imageUrl?: string;
  billingInterval?: string; // e.g., "WEEK", "MONTH"
  billingIntervalCount?: number; // e.g., 1, 2
}

// --- Cart State Interface ---
interface CartState {
  items: CartItem[];
  isCartOpen: boolean;
  // Actions
  addItem: (item: Omit<CartItem, "quantity"> & { quantity?: number }) => void;
  removeItem: (
    productId: string,
    variantId: string,
    purchaseOptionId: string
  ) => void;
  updateQuantity: (
    productId: string,
    variantId: string,
    purchaseOptionId: string,
    quantity: number
  ) => void;
  clearCart: () => void;
  setCartOpen: (isOpen: boolean) => void;
  // Computed
  getTotalItems: () => number;
  getTotalPrice: () => number;
}

// --- Zustand Store with Persistence ---
export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isCartOpen: false,

      setCartOpen: (isOpen) => set({ isCartOpen: isOpen }),

      addItem: (newItem) => {
        set((state) => {
          // Check for mixed subscription billing intervals
          if (newItem.purchaseType === "SUBSCRIPTION") {
            const existingSubscriptions = state.items.filter(
              (item) => item.purchaseType === "SUBSCRIPTION"
            );

            if (existingSubscriptions.length > 0) {
              // Check if any existing subscription has a different billing interval
              const hasDifferentInterval = existingSubscriptions.some(
                (item) =>
                  item.billingInterval !== newItem.billingInterval ||
                  item.billingIntervalCount !== newItem.billingIntervalCount
              );

              if (hasDifferentInterval) {
                // Show error to user
                window.dispatchEvent(
                  new CustomEvent("cartError", {
                    detail: {
                      message:
                        "Cannot mix subscriptions with different billing intervals. Please purchase them separately or remove other subscriptions first.",
                    },
                  })
                );
                return state; // Don't add the item
              }
            }
          }

          // Check if item already exists in cart
          const existingIndex = state.items.findIndex(
            (item) =>
              item.productId === newItem.productId &&
              item.variantId === newItem.variantId &&
              item.purchaseOptionId === newItem.purchaseOptionId
          );

          if (existingIndex !== -1) {
            // Item exists
            const updatedItems = [...state.items];

            if (newItem.purchaseType === "SUBSCRIPTION") {
              // For subscriptions, replace the item (update schedule if changed)
              updatedItems[existingIndex] = {
                ...newItem,
                quantity: newItem.quantity || 1,
              };
            } else {
              // For one-time purchases, increment quantity
              updatedItems[existingIndex].quantity += newItem.quantity || 1;
            }

            return { items: updatedItems };
          } else {
            // New item, add to cart
            return {
              items: [
                ...state.items,
                {
                  ...newItem,
                  quantity: newItem.quantity || 1,
                },
              ],
            };
          }
        });
      },

      removeItem: (productId, variantId, purchaseOptionId) => {
        set((state) => ({
          items: state.items.filter(
            (item) =>
              !(
                item.productId === productId &&
                item.variantId === variantId &&
                item.purchaseOptionId === purchaseOptionId
              )
          ),
        }));
      },

      updateQuantity: (productId, variantId, purchaseOptionId, quantity) => {
        if (quantity <= 0) {
          // Remove item if quantity is 0 or negative
          get().removeItem(productId, variantId, purchaseOptionId);
          return;
        }

        set((state) => ({
          items: state.items.map((item) =>
            item.productId === productId &&
            item.variantId === variantId &&
            item.purchaseOptionId === purchaseOptionId
              ? { ...item, quantity }
              : item
          ),
        }));
      },

      clearCart: () => {
        set({ items: [] });
      },

      getTotalItems: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      },

      getTotalPrice: () => {
        return get().items.reduce(
          (total, item) => total + item.priceInCents * item.quantity,
          0
        );
      },
    }),
    {
      name: "artisan-roast-cart", // localStorage key
      // Optional: add version for migration if cart structure changes
      version: 1,
    }
  )
);
