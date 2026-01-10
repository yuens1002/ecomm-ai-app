import {
  ArrowUpDown,
  Copy,
  CornerUpLeft,
  Eye,
  ListChevronsDownUp,
  ListChevronsUpDown,
  Plus,
  Redo,
  Undo,
} from "lucide-react";
import { modKey } from "./keys";
import type { ActionUiDefinition } from "./model";

export const ACTION_DEFINITIONS: Record<string, ActionUiDefinition> = {
  // Shared actions
  clone: {
    id: "clone",
    icon: Copy,
    label: "Clone",
    tooltip: "Duplicate selected items",
    kbd: [modKey, "D"],
  },
  remove: {
    id: "remove",
    icon: CornerUpLeft,
    label: "Remove",
    tooltip: "Remove from added labels",
    kbd: [modKey, "⌫"],
  },
  visibility: {
    id: "visibility",
    icon: Eye,
    label: "Visibility",
    tooltip: "Toggle visibility",
    kbd: ["Space"],
  },
  "expand-all": {
    id: "expand-all",
    icon: ListChevronsDownUp,
    label: "Expand All",
    tooltip: "Expand all sections",
    kbd: [modKey, "↓"],
  },
  "collapse-all": {
    id: "collapse-all",
    icon: ListChevronsUpDown,
    label: "Collapse All",
    tooltip: "Collapse all sections",
    kbd: [modKey, "↑"],
  },
  undo: {
    id: "undo",
    icon: Undo,
    label: "Undo",
    tooltip: "Undo last change",
    kbd: [modKey, "Z"],
  },
  redo: {
    id: "redo",
    icon: Redo,
    label: "Redo",
    tooltip: "Redo last change",
    kbd: [modKey, "Shift", "Z"],
  },

  // View-local actions
  "new-label": {
    id: "new-label",
    icon: Plus,
    label: "New Label",
    tooltip: "Add new label",
    kbd: [modKey, "N"],
  },
  "add-labels": {
    id: "add-labels",
    icon: Plus,
    label: "Add Label(s)",
    tooltip: "Add labels to menu",
    kbd: [],
  },
  "add-categories": {
    id: "add-categories",
    icon: Plus,
    label: "Categories",
    tooltip: "Add categories to label",
    kbd: [],
  },
  "sort-mode": {
    id: "sort-mode",
    icon: ArrowUpDown,
    label: "Sort Mode",
    tooltip: "Category ordering mode",
    kbd: [modKey, "R"],
  },
  "add-products": {
    id: "add-products",
    icon: Plus,
    label: "Products",
    tooltip: "Add products to category",
    kbd: [],
  },
  "sort-order": {
    id: "sort-order",
    icon: ArrowUpDown,
    label: "Sort Order",
    tooltip: "Product ordering",
    kbd: [modKey, "R"],
  },
  "new-category": {
    id: "new-category",
    icon: Plus,
    label: "New Category",
    tooltip: "Add new category",
    kbd: [modKey, "N"],
  },
};
