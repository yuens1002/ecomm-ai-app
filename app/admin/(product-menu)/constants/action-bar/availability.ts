import type { ViewType } from "../../types/builder-state";
import type { ActionId } from "./model";

// Per-view availability: keep these lists small/readable.
// (IDs must be present in definitions/presentation/behavior.)
export const ACTION_AVAILABILITY: Record<ViewType, ActionId[]> = {
  menu: [
    "new-label",
    "add-labels",
    "clone",
    "remove",
    "visibility",
    "expand-all",
    "collapse-all",
    "undo",
    "redo",
  ],
  label: ["add-categories", "sort-mode", "remove", "undo", "redo"],
  category: ["add-products", "sort-order", "remove", "expand-all", "collapse-all", "undo", "redo"],
  "all-labels": ["new-label", "clone", "remove", "visibility", "undo", "redo"],
  "all-categories": ["new-category", "clone", "remove", "visibility", "undo", "redo"],
};
