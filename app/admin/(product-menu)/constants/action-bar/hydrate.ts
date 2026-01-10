import type { ViewType } from "../../types/builder-state";
import { ACTION_AVAILABILITY } from "./availability";
import { ACTION_BEHAVIORS } from "./behaviors";
import { ACTION_DEFINITIONS } from "./definitions";
import { ACTION_EFFECTS } from "./effects";
import type { ActionDefinition } from "./model";
import { ACTION_PRESENTATION } from "./presentation";
import { ACTION_UI_OVERRIDES } from "./ui-overrides";

function assertPresent<T>(value: T | undefined, label: string): T {
  if (!value) throw new Error(`[action-bar] Missing ${label}`);
  return value;
}

export function getActionsForView(view: ViewType): ActionDefinition[] {
  const ids = ACTION_AVAILABILITY[view];

  return ids.map((id) => {
    const ui = assertPresent(ACTION_DEFINITIONS[id], `ACTION_DEFINITIONS[${id}]`);
    const uiOverrides = ACTION_UI_OVERRIDES?.[view]?.[id];
    const presentation = assertPresent(
      ACTION_PRESENTATION[view]?.[id],
      `ACTION_PRESENTATION[${view}][${id}]`
    );
    const behavior = assertPresent(ACTION_BEHAVIORS[id], `ACTION_BEHAVIORS[${id}]`);
    const effects = ACTION_EFFECTS[id];

    return {
      ...ui,
      ...(uiOverrides ?? {}),
      ...presentation,
      ...behavior,
      ...(effects ?? {}),
    };
  });
}

export const ACTION_BAR_CONFIG: Record<ViewType, ActionDefinition[]> = {
  menu: getActionsForView("menu"),
  label: getActionsForView("label"),
  category: getActionsForView("category"),
  "all-labels": getActionsForView("all-labels"),
  "all-categories": getActionsForView("all-categories"),
};
