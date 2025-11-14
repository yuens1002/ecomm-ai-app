import { create } from "zustand";
import { persist } from "zustand/middleware";

// --- Cart Item Interface ---
export interface CartItem {
  productId: string;
  productName: string;
  productSlug: string;
  variantId: string;
  variantName: string; // e.g., "12oz"
  purchaseOptionId: string;
  purchaseType: "ONE_TIME" | "SUBSCRIPTION";
  priceInCents: number;
  quantity: number;
  imageUrl?: string;
  // For subscriptions
  deliverySchedule?: string;
}

// --- Cart State Interface ---
interface CartState {
  items: CartItem[];
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
  // Computed
  getTotalItems: () => number;
  getTotalPrice: () => number;
}

// --- Zustand Store with Persistence ---
export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (newItem) => {
        set((state) => {
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
