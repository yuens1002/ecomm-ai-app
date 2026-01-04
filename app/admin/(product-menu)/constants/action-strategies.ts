/**
 * Action Strategy Configuration
 *
 * Defines how each action (remove, clone, toggleVisibility) behaves in each view.
 * This eliminates the need for if/else chains in action handlers.
 */

import type { ViewType } from "../types/builder-state";

export type ActionType = "remove" | "clone" | "toggleVisibility";

export type ActionStrategy = {
  // The async function to execute for this view
  execute: (context: ActionContext) => Promise<void>;

  // Optional: What to refresh after action completes
  refresh?: ("labels" | "categories" | "products")[];

  // Optional: Custom error message
  errorMessage?: string;
};

export type ActionContext = {
  selectedIds: string[];
  currentLabelId?: string;
  currentCategoryId?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  mutations: any; // From useProductMenuMutations
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  labels: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  categories: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  products: any[];
};

/**
 * Action strategies by view and action type
 */
export const ACTION_STRATEGIES: Record<
  ViewType,
  Partial<Record<ActionType, ActionStrategy>>
> = {
  // ==================== MENU VIEW ====================
  menu: {
    remove: {
      execute: async ({ selectedIds, mutations }: ActionContext) => {
        await Promise.all(
          selectedIds.map((id) =>
            mutations.updateLabel(id, { isVisible: false })
          )
        );
      },
      refresh: ["labels"],
      errorMessage: "Failed to hide labels from menu",
    },

    clone: {
      execute: async ({ selectedIds }) => {
        // TODO: Implement label cloning with categories
        console.log("[Clone] Labels:", selectedIds);
      },
      refresh: ["labels"],
      errorMessage: "Failed to clone labels",
    },

    toggleVisibility: {
      execute: async ({ selectedIds, mutations, labels }) => {
        await Promise.all(
          selectedIds.map(async (id) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const label = labels.find((l: any) => l.id === id);
            if (label) {
              await mutations.updateLabel(id, { isVisible: !label.isVisible });
            }
          })
        );
      },
      refresh: ["labels"],
      errorMessage: "Failed to toggle label visibility",
    },
  },

  // ==================== LABEL VIEW ====================
  label: {
    remove: {
      execute: async ({
        selectedIds,
        currentLabelId,
        mutations,
      }: ActionContext) => {
        if (!currentLabelId) return;
        await Promise.all(
          selectedIds.map((id) => mutations.detachCategory(currentLabelId, id))
        );
      },
      refresh: ["labels"],
      errorMessage: "Failed to detach categories from label",
    },

    clone: {
      execute: async ({ selectedIds }) => {
        // TODO: Implement category cloning
        console.log("[Clone] Categories:", selectedIds);
      },
      refresh: ["categories"],
      errorMessage: "Failed to clone categories",
    },
  },

  // ==================== CATEGORY VIEW ====================
  category: {
    remove: {
      execute: async ({
        selectedIds,
        currentCategoryId,
        mutations,
      }: ActionContext) => {
        if (!currentCategoryId) return;
        await Promise.all(
          selectedIds.map((id) =>
            mutations.detachProductFromCategory(id, currentCategoryId)
          )
        );
      },
      refresh: ["products"],
      errorMessage: "Failed to detach products from category",
    },

    clone: {
      execute: async ({ selectedIds }) => {
        // TODO: Implement product cloning
        console.log("[Clone] Products:", selectedIds);
      },
      refresh: ["products"],
      errorMessage: "Failed to clone products",
    },
  },

  // ==================== ALL-LABELS VIEW ====================
  "all-labels": {
    remove: {
      execute: async ({ selectedIds, mutations }) => {
        await Promise.all(
          selectedIds.map((id) =>
            mutations.updateLabel(id, { isVisible: false })
          )
        );
      },
      refresh: ["labels"],
      errorMessage: "Failed to hide labels",
    },

    clone: {
      execute: async ({ selectedIds }) => {
        // TODO: Implement label cloning
        console.log("[Clone] Labels:", selectedIds);
      },
      refresh: ["labels"],
      errorMessage: "Failed to clone labels",
    },

    toggleVisibility: {
      execute: async ({ selectedIds, mutations, labels }) => {
        await Promise.all(
          selectedIds.map(async (id) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const label = labels.find((l: any) => l.id === id);
            if (label) {
              await mutations.updateLabel(id, { isVisible: !label.isVisible });
            }
          })
        );
      },
      refresh: ["labels"],
      errorMessage: "Failed to toggle label visibility",
    },
  },

  // ==================== ALL-CATEGORIES VIEW ====================
  "all-categories": {
    remove: {
      execute: async ({ selectedIds, mutations }) => {
        await Promise.all(
          selectedIds.map((id) =>
            mutations.updateCategory(id, { isVisible: false })
          )
        );
      },
      refresh: ["categories"],
      errorMessage: "Failed to hide categories",
    },

    clone: {
      execute: async ({ selectedIds }) => {
        // TODO: Implement category cloning
        console.log("[Clone] Categories:", selectedIds);
      },
      refresh: ["categories"],
      errorMessage: "Failed to clone categories",
    },

    toggleVisibility: {
      execute: async ({ selectedIds, mutations, categories }) => {
        await Promise.all(
          selectedIds.map(async (id) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const category = categories.find((c: any) => c.id === id);
            if (category) {
              await mutations.updateCategory(id, {
                isVisible: !category.isVisible,
              });
            }
          })
        );
      },
      refresh: ["categories"],
      errorMessage: "Failed to toggle category visibility",
    },
  },
};

/**
 * Execute an action using the strategy pattern
 */
export async function executeAction(
  actionType: ActionType,
  currentView: ViewType,
  context: ActionContext,
  mutate: {
    labels: () => void;
    categories: () => void;
    products?: () => void;
  }
): Promise<{ ok: boolean; error?: string }> {
  // Get the strategy for this view and action
  const viewStrategies = ACTION_STRATEGIES[currentView];
  const strategy = viewStrategies?.[actionType];

  if (!strategy) {
    return {
      ok: false,
      error: `Action "${actionType}" is not available in "${currentView}" view`,
    };
  }

  try {
    // Execute the strategy
    await strategy.execute(context);

    // Refresh data as specified
    if (strategy.refresh) {
      strategy.refresh.forEach((resource) => {
        if (resource === "labels") mutate.labels();
        if (resource === "categories") mutate.categories();
        if (resource === "products" && mutate.products) mutate.products();
      });
    }

    return { ok: true };
  } catch (error) {
    console.error(`[executeAction] ${actionType} failed:`, error);
    return {
      ok: false,
      error: strategy.errorMessage || `Failed to execute ${actionType}`,
    };
  }
}
