import type { ViewType } from "../../types/builder-state";
import type { ActionId, ActionUiDefinition } from "./model";

export const ACTION_UI_OVERRIDES: Partial<
  Record<ViewType, Partial<Record<ActionId, Partial<ActionUiDefinition>>>>
> = {
  label: {
    remove: {
      tooltip: "Remove from label",
    },
  },
  category: {
    remove: {
      tooltip: "Remove from category",
    },
  },
  "all-labels": {
    remove: {
      tooltip: "Remove from menu",
    },
  },
  "all-categories": {
    remove: {
      tooltip: "Remove from labels",
    },
  },
};
