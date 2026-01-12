import type { ActionEffects, ActionId } from "./model";

export const ACTION_EFFECTS: Partial<Record<ActionId, ActionEffects>> = {
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
    successToast: {
      "all-categories": {
        title: "Cloned categories",
      },
    },
    failureToast: {
      title: "Clone failed",
      description: "Please try again.",
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
    successToast: {
      menu: {
        title: "Removed from menu",
      },
      label: {
        title: "Removed from label",
      },
      category: {
        title: "Removed from category",
      },
      "all-labels": {
        title: "Removed",
      },
      "all-categories": {
        title: "Removed from labels",
      },
    },
    failureToast: {
      title: "Remove failed",
      description: "Please try again.",
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
    successToast: {
      menu: {
        title: "Visibility updated",
      },
      "all-labels": {
        title: "Visibility updated",
      },
      "all-categories": {
        title: "Visibility updated",
      },
    },
    failureToast: {
      title: "Visibility update failed",
      description: "Please try again.",
    },
  },
};
