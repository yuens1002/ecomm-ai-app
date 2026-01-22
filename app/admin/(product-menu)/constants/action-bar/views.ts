import type { ViewConfig } from "./model";

export const VIEW_CONFIG: ViewConfig = {
  // ─────────────────────────────────────────────────────────────
  // MENU VIEW
  // ─────────────────────────────────────────────────────────────
  menu: {
    left: [
      { id: "new-label", type: "combo", comboWith: "add-labels" },
      { id: "add-labels", type: "combo", comboWith: "new-label" },
      { id: "clone" },
      { id: "remove", tooltip: "Hide from menu" },
    ],
    right: [
      { id: "visibility" },
      { id: "expand-all" },
      { id: "collapse-all" },
      { id: "undo" },
      { id: "redo" },
      { id: "help" },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  // LABEL VIEW
  // ─────────────────────────────────────────────────────────────
  label: {
    left: [
      { id: "add-categories", type: "dropdown", hasDropdown: true },
      { id: "remove", tooltip: "Remove from label" },
    ],
    right: [{ id: "undo" }, { id: "redo" }, { id: "help" }],
  },

  // ─────────────────────────────────────────────────────────────
  // CATEGORY VIEW
  // ─────────────────────────────────────────────────────────────
  category: {
    left: [
      { id: "add-products", type: "dropdown", hasDropdown: true },
      { id: "remove", tooltip: "Remove from categories" },
    ],
    right: [{ id: "undo" }, { id: "redo" }, { id: "help" }],
  },

  // ─────────────────────────────────────────────────────────────
  // ALL LABELS VIEW
  // ─────────────────────────────────────────────────────────────
  "all-labels": {
    left: [{ id: "new-label" }, { id: "clone" }],
    right: [
      { id: "visibility" },
      { id: "undo" },
      { id: "redo" },
      { id: "delete" },
      { id: "help" },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  // ALL CATEGORIES VIEW
  // ─────────────────────────────────────────────────────────────
  "all-categories": {
    left: [
      { id: "new-category" },
      { id: "clone" },
      { id: "remove", tooltip: "Remove from labels" },
    ],
    right: [
      { id: "visibility" },
      { id: "undo" },
      { id: "redo" },
      { id: "delete" },
      { id: "help" },
    ],
  },
};
