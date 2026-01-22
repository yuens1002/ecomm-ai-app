"use client";

import { useEffect, useCallback } from "react";
import type { ActionDefinition } from "../constants/action-bar/model";
import type { BuilderState, MenuBuilderActions } from "../types/builder-state";

// Platform detection for matching keyboard shortcuts
const isMac =
  typeof window !== "undefined" && navigator.platform.toUpperCase().indexOf("MAC") >= 0;

/**
 * Maps display symbols to keyboard event properties
 */
const KEY_MAP: Record<string, string> = {
  // Modifier display names
  "⌘": "meta",
  Ctrl: "ctrl",
  Shift: "shift",
  Alt: "alt",
  // Special keys
  "⌫": "backspace",
  "↑": "arrowup",
  "↓": "arrowdown",
  Space: " ",
  Enter: "enter",
  Escape: "escape",
};

/**
 * Checks if the current focus is in an editable element
 */
function isEditableElement(target: EventTarget | null): boolean {
  if (!target || !(target instanceof HTMLElement)) return false;

  const tagName = target.tagName.toLowerCase();
  if (tagName === "input" || tagName === "textarea") return true;
  if (target.isContentEditable) return true;

  // Check for elements with role="textbox" (rich text editors)
  if (target.getAttribute("role") === "textbox") return true;

  return false;
}

/**
 * Parses a kbd array into modifiers and key
 */
function parseKbd(kbd: string[]): { modifiers: Set<string>; key: string } | null {
  if (kbd.length === 0) return null;

  const modifiers = new Set<string>();
  let key = "";

  for (const part of kbd) {
    const mapped = KEY_MAP[part]?.toLowerCase();
    if (mapped === "meta" || mapped === "ctrl" || mapped === "shift" || mapped === "alt") {
      modifiers.add(mapped);
    } else if (mapped) {
      key = mapped;
    } else {
      // Regular key (letter, number, etc.)
      key = part.toLowerCase();
    }
  }

  // Handle platform-specific modifier (⌘ on Mac = meta, Ctrl on Windows = ctrl)
  // Both should match the platform's primary modifier
  if (modifiers.has("meta") && !isMac) {
    modifiers.delete("meta");
    modifiers.add("ctrl");
  }
  if (modifiers.has("ctrl") && isMac) {
    modifiers.delete("ctrl");
    modifiers.add("meta");
  }

  return key ? { modifiers, key } : null;
}

/**
 * Checks if a keyboard event matches the parsed shortcut
 */
function eventMatchesShortcut(
  event: KeyboardEvent,
  shortcut: { modifiers: Set<string>; key: string }
): boolean {
  // Check modifiers
  const eventMods = new Set<string>();
  if (event.metaKey) eventMods.add("meta");
  if (event.ctrlKey) eventMods.add("ctrl");
  if (event.shiftKey) eventMods.add("shift");
  if (event.altKey) eventMods.add("alt");

  // Compare modifier sets
  if (shortcut.modifiers.size !== eventMods.size) return false;
  for (const mod of shortcut.modifiers) {
    if (!eventMods.has(mod)) return false;
  }

  // Compare key (case-insensitive)
  const eventKey = event.key.toLowerCase();
  return eventKey === shortcut.key;
}

type UseKeyboardShortcutsOptions = {
  actions: ActionDefinition[];
  state: BuilderState;
  builderActions: MenuBuilderActions;
  enabled?: boolean;
};

/**
 * Hook to enable keyboard shortcuts for action bar actions
 *
 * Listens to global keydown events and executes matching actions.
 * Respects disabled state and skips shortcuts when typing in inputs.
 */
export function useKeyboardShortcuts({
  actions,
  state,
  builderActions,
  enabled = true,
}: UseKeyboardShortcutsOptions) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Skip if shortcuts are disabled
      if (!enabled) return;

      // Skip if user is typing in an input
      if (isEditableElement(event.target)) return;

      // Skip if a modal/dialog is open (has data-state="open" on an element)
      if (document.querySelector('[data-state="open"][role="dialog"]')) return;

      // Find matching action
      for (const action of actions) {
        // Skip actions without keyboard shortcuts
        if (!action.kbd || action.kbd.length === 0) continue;

        // Skip help action (no shortcut)
        if (action.id === "help") continue;

        // Parse the shortcut
        const shortcut = parseKbd(action.kbd);
        if (!shortcut) continue;

        // Check if event matches
        if (!eventMatchesShortcut(event, shortcut)) continue;

        // Check if action is disabled
        if (action.disabled(state)) continue;

        // Prevent default browser behavior
        event.preventDefault();
        event.stopPropagation();

        // Execute the action
        action.onClick(state, builderActions);
        return;
      }
    },
    [actions, state, builderActions, enabled]
  );

  useEffect(() => {
    if (!enabled) return;

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown, enabled]);
}
