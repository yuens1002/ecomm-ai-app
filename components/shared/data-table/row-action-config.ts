/**
 * Declarative Row Action Configuration
 *
 * Defines action menu items via a static config array with `when` predicates.
 * The resolver evaluates conditions, wires onClick handlers by action `id`,
 * and strips orphan/consecutive separators.
 *
 * Usage:
 *   1. Define a config: RowActionConfigEntry<T>[]
 *   2. In your component, build a handler map: { actionId: (record) => void }
 *   3. Call resolveRowActions(record, config, handlers)
 */

import type { LucideIcon } from "lucide-react";
import type { RowActionItem } from "./RowActionMenu";

// ── Config entry types ─────────────────────────────────────────────

export interface RowActionItemDef<T> {
  id: string;
  type: "item";
  label: string | ((record: T) => string);
  icon?: LucideIcon;
  variant?: "default" | "destructive";
  when: (record: T) => boolean;
}

export interface RowActionSeparatorDef<T> {
  type: "separator";
  when: (record: T) => boolean;
}

export interface RowActionSubMenuDef<T> {
  id: string;
  type: "sub-menu-click";
  label: string;
  icon?: LucideIcon;
  when: (record: T) => boolean;
  getItems: (record: T) => { key: string; label: string }[];
}

export type RowActionConfigEntry<T> =
  | RowActionItemDef<T>
  | RowActionSeparatorDef<T>
  | RowActionSubMenuDef<T>;

// ── Handler maps ───────────────────────────────────────────────────

export type RowActionHandlers<T> = Record<string, (record: T) => void>;
export type RowActionSubMenuHandlers<T> = Record<
  string,
  (record: T, key: string) => void
>;

// ── Resolver ───────────────────────────────────────────────────────

/**
 * Evaluates a declarative action config against a record and produces
 * the concrete RowActionItem[] for RowActionMenu.
 */
export function resolveRowActions<T>(
  record: T,
  config: RowActionConfigEntry<T>[],
  handlers: RowActionHandlers<T>,
  subMenuHandlers?: RowActionSubMenuHandlers<T>
): RowActionItem[] {
  // 1. Filter by `when` predicate
  const visible = config.filter((entry) => entry.when(record));

  // 2. Map to RowActionItem[]
  const raw: RowActionItem[] = visible.map((entry) => {
    if (entry.type === "separator") {
      return { type: "separator" };
    }
    if (entry.type === "sub-menu-click") {
      const subItems = entry.getItems(record);
      const handler = subMenuHandlers?.[entry.id];
      return {
        type: "sub-menu-click",
        label: entry.label,
        icon: entry.icon,
        items: subItems.map((sub) => ({
          label: sub.label,
          onClick: () => handler?.(record, sub.key),
        })),
      };
    }
    // type === "item"
    const handler = handlers[entry.id];
    return {
      type: "item",
      label:
        typeof entry.label === "function" ? entry.label(record) : entry.label,
      icon: entry.icon,
      variant: entry.variant,
      onClick: () => handler?.(record),
    };
  });

  // 3. Strip leading, trailing, and consecutive separators
  return stripOrphanSeparators(raw);
}

function stripOrphanSeparators(items: RowActionItem[]): RowActionItem[] {
  const result: RowActionItem[] = [];
  for (const item of items) {
    if (item.type === "separator") {
      // Only add if last item was not a separator and list is non-empty
      if (result.length > 0 && result[result.length - 1].type !== "separator") {
        result.push(item);
      }
    } else {
      result.push(item);
    }
  }
  // Remove trailing separator
  if (result.length > 0 && result[result.length - 1].type === "separator") {
    result.pop();
  }
  return result;
}
