import type { ViewType } from "../types/builder-state";

type HelpItem = {
  text: string;
};

type ViewHelpContent = {
  title: string;
  items: HelpItem[];
};

export const HELP_CONTENT: Record<ViewType, ViewHelpContent> = {
  menu: {
    title: "Menu View",
    items: [
      { text: "Drag labels to reorder them in the menu" },
      { text: "Click a label to select it, Ctrl/Cmd+click for multi-select" },
      { text: "Expand labels to see and manage their categories" },
      { text: "Use Clone to duplicate selected labels" },
      { text: "Use Remove to hide labels from the menu (not delete)" },
    ],
  },

  label: {
    title: "Label View",
    items: [
      { text: "Drag categories to reorder them within this label" },
      { text: "Click a category to select it, Ctrl/Cmd+click for multi-select" },
      { text: "Use Add Categories dropdown to attach categories to this label" },
      { text: "Use Remove to detach selected categories from this label" },
    ],
  },

  category: {
    title: "Category View",
    items: [
      { text: "Drag products to reorder them within this category" },
      { text: "Click a product to select it, Ctrl/Cmd+click for multi-select" },
      { text: "Use Add Products dropdown to attach products to this category" },
      { text: "Use Remove to detach selected products from this category" },
    ],
  },

  "all-labels": {
    title: "All Labels",
    items: [
      { text: "View and manage all labels in a table format" },
      { text: "Click to select, Ctrl/Cmd+click for multi-select" },
      { text: "Toggle visibility to show/hide labels in the menu" },
      { text: "Clone to duplicate selected labels" },
      { text: "Delete to permanently remove selected labels" },
    ],
  },

  "all-categories": {
    title: "All Categories",
    items: [
      { text: "View and manage all categories in a table format" },
      { text: "Click to select, Ctrl/Cmd+click for multi-select" },
      { text: "Toggle visibility to show/hide categories" },
      { text: "Clone to duplicate selected categories" },
      { text: "Remove to detach categories from all labels" },
      { text: "Delete to permanently remove selected categories" },
    ],
  },
};
