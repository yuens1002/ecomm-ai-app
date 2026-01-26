import type { ViewType } from "../../types/builder-state";
import { ACTIONS } from "./actions";
import type { ActionDefinition, ActionPosition, ActionSlot } from "./model";
import { VIEW_CONFIG } from "./views";

// ─────────────────────────────────────────────────────────────
// HYDRATION
// ─────────────────────────────────────────────────────────────

function hydrateSlot(slot: ActionSlot, position: ActionPosition): ActionDefinition {
  const base = ACTIONS[slot.id];
  if (!base) {
    throw new Error(`[action-bar] Unknown action ID: ${slot.id}`);
  }

  return {
    id: base.id,
    icon: base.icon,
    kbd: base.kbd,
    disabled: base.disabled,
    ariaLabel: base.ariaLabel,
    onClick: base.onClick,
    execute: base.execute,
    captureUndo: base.captureUndo,
    // Effects (flattened from base.effects)
    refresh: base.effects?.refresh,
    errorMessage: base.effects?.errorMessage,
    successToast: base.effects?.successToast,
    failureToast: base.effects?.failureToast,
    // Slot overrides (inline in views.ts) win over base
    type: slot.type ?? "button",
    position,
    label: slot.label ?? base.label,
    tooltip: slot.tooltip ?? base.tooltip,
    comboWith: slot.comboWith,
    hasDropdown: slot.hasDropdown,
  };
}

export function getActionsForView(view: ViewType): ActionDefinition[] {
  const config = VIEW_CONFIG[view];
  if (!config) {
    throw new Error(`[action-bar] Unknown view: ${view}`);
  }

  const left = config.left.map((slot) => hydrateSlot(slot, "left"));
  const right = config.right.map((slot) => hydrateSlot(slot, "right"));

  return [...left, ...right];
}

// Precomputed config for all views (backwards compatibility)
export const ACTION_BAR_CONFIG: Record<ViewType, ActionDefinition[]> = {
  menu: getActionsForView("menu"),
  label: getActionsForView("label"),
  category: getActionsForView("category"),
  "all-labels": getActionsForView("all-labels"),
  "all-categories": getActionsForView("all-categories"),
};

// ─────────────────────────────────────────────────────────────
// EXPORTS
// ─────────────────────────────────────────────────────────────

export { ACTIONS } from "./actions";
export * from "./model";
export { hasRedoHistory, hasSameKindSelection, hasSelection, hasUndoHistory, modKey } from "./shared";
export { VIEW_CONFIG } from "./views";
