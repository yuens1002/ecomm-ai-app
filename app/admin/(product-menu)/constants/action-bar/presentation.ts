import type { ViewType } from "../../types/builder-state";
import type { ActionId, ActionPresentation } from "./model";

// Presentation is view-specific because some action IDs intentionally render differently
// (e.g. new-label is a combo in menu but a plain button in all-labels).
export const ACTION_PRESENTATION: Record<
  ViewType,
  Partial<Record<ActionId, ActionPresentation>>
> = {
  menu: {
    "new-label": { type: "combo", position: "left", comboWith: "add-labels" },
    "add-labels": { type: "combo", position: "left", comboWith: "new-label" },
    clone: { type: "button", position: "left" },
    remove: { type: "button", position: "left" },
    visibility: { type: "button", position: "right" },
    "expand-all": { type: "button", position: "right" },
    "collapse-all": { type: "button", position: "right" },
    undo: { type: "button", position: "right" },
    redo: { type: "button", position: "right" },
  },
  label: {
    "add-categories": { type: "dropdown", position: "left", hasDropdown: true },
    "sort-mode": { type: "dropdown", position: "left", hasDropdown: true },
    remove: { type: "button", position: "left" },
    undo: { type: "button", position: "right" },
    redo: { type: "button", position: "right" },
  },
  category: {
    "add-products": { type: "dropdown", position: "left", hasDropdown: true },
    "sort-order": { type: "dropdown", position: "left", hasDropdown: true },
    remove: { type: "button", position: "left" },
    "expand-all": { type: "button", position: "right" },
    "collapse-all": { type: "button", position: "right" },
    undo: { type: "button", position: "right" },
    redo: { type: "button", position: "right" },
  },
  "all-labels": {
    "new-label": { type: "button", position: "left" },
    clone: { type: "button", position: "left" },
    remove: { type: "button", position: "left" },
    visibility: { type: "button", position: "right" },
    undo: { type: "button", position: "right" },
    redo: { type: "button", position: "right" },
  },
  "all-categories": {
    "new-category": { type: "button", position: "left" },
    clone: { type: "button", position: "left" },
    remove: { type: "button", position: "left" },
    visibility: { type: "button", position: "right" },
    undo: { type: "button", position: "right" },
    redo: { type: "button", position: "right" },
  },
};
