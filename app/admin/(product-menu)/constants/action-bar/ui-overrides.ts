import type { ViewType } from "../../types/builder-state";
import type { ActionUiDefinition } from "./model";

export const ACTION_UI_OVERRIDES: Partial<
  Record<ViewType, Partial<Record<string, Partial<ActionUiDefinition>>>>
> = {
  label: {
    remove: {
      tooltip: "Remove selected categories from label",
    },
  },
  category: {
    remove: {
      tooltip: "Remove selected products from category",
    },
  },
  "all-labels": {
    remove: {
      tooltip: "Remove selected labels",
    },
  },
  "all-categories": {
    remove: {
      tooltip: "Remove selected categories",
    },
  },
};
