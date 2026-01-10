import type { ActionEffects } from "./model";

export const ACTION_EFFECTS: Record<string, ActionEffects> = {
  clone: {
    refresh: {
      menu: ["labels"],
      "all-labels": ["labels"],
      "all-categories": ["categories"],
    },
    errorMessage: {
      menu: "Failed to clone labels",
      "all-labels": "Failed to clone labels",
      "all-categories": "Failed to clone categories",
    },
  },

  remove: {
    refresh: {
      menu: ["labels"],
      label: ["labels"],
      category: ["products"],
      "all-labels": ["labels"],
      "all-categories": ["categories"],
    },
    errorMessage: {
      menu: "Failed to hide labels from menu",
      label: "Failed to detach categories from label",
      category: "Failed to detach products from category",
      "all-labels": "Failed to hide labels",
      "all-categories": "Failed to detach categories from labels",
    },
  },

  visibility: {
    refresh: {
      menu: ["labels"],
      "all-labels": ["labels"],
      "all-categories": ["categories"],
    },
    errorMessage: {
      menu: "Failed to toggle label visibility",
      "all-labels": "Failed to toggle label visibility",
      "all-categories": "Failed to toggle category visibility",
    },
  },
};
