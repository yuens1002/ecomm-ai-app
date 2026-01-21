"use client";

import { useCallback } from "react";
import type { SelectedEntityKind } from "../types/builder-state";

type UndoAction = {
  action: string;
  timestamp: Date;
  data: {
    undo: () => Promise<void>;
    redo: () => Promise<void>;
  };
};

type BuilderUndoApi = {
  pushUndoAction: (action: UndoAction) => void;
};

type UpdateResult = { ok: boolean; error?: string };

/**
 * Options for useInlineEditHandlers hook
 */
export type UseInlineEditHandlersOptions<TItem extends { id: string }> = {
  /** Builder instance with undo API */
  builder: BuilderUndoApi;
  /** Entity kind for undo action naming (e.g., "label", "category") */
  entityKind: SelectedEntityKind;
  /** Function to get current item by id */
  getItem: (id: string) => TItem | undefined;
  /** Function to update item (returns promise with ok/error) */
  updateItem: (id: string, data: Partial<TItem>) => Promise<UpdateResult>;
  /** Optional callback after successful save */
  onSaveComplete?: () => void;
  /** Optional function to check if a name already exists (for duplicate validation) */
  isDuplicateName?: (name: string, excludeId: string) => boolean;
  /** Optional callback when an error occurs (e.g., show toast) */
  onError?: (message: string) => void;
};

/**
 * Hook that provides inline edit handlers with undo/redo support.
 * Use named exports to import individual handlers.
 *
 * @example
 * ```tsx
 * const { handleNameSave, handleIconSave, handleVisibilitySave } = useInlineEditHandlers({
 *   builder,
 *   entityKind: "label",
 *   getItem: (id) => labels.find((l) => l.id === id),
 *   updateItem: updateLabel,
 *   onSaveComplete: clearEditing,
 * });
 * ```
 */
export function useInlineEditHandlers<
  TItem extends { id: string; name?: string; icon?: string | null; isVisible?: boolean },
>({ builder, entityKind, getItem, updateItem, onSaveComplete, isDuplicateName, onError }: UseInlineEditHandlersOptions<TItem>) {
  /**
   * Handle name field save with undo/redo support
   */
  const handleNameSave = useCallback(
    async (id: string, name: string) => {
      const item = getItem(id);
      if (!item || !("name" in item)) return;

      // Check for duplicate name before saving
      if (isDuplicateName?.(name, id)) {
        onError?.(`A ${entityKind} with this name already exists`);
        return;
      }

      const previousName = item.name;
      const res = await updateItem(id, { name } as Partial<TItem>);

      if (!res.ok) {
        onError?.(res.error ?? `Failed to update ${entityKind} name`);
        return;
      }

      if (previousName !== name) {
        builder.pushUndoAction({
          action: `rename-${entityKind}`,
          timestamp: new Date(),
          data: {
            undo: async () => {
              await updateItem(id, { name: previousName } as Partial<TItem>);
            },
            redo: async () => {
              await updateItem(id, { name } as Partial<TItem>);
            },
          },
        });
      }

      onSaveComplete?.();
    },
    [builder, entityKind, getItem, updateItem, onSaveComplete, isDuplicateName, onError]
  );

  /**
   * Handle icon field save with undo/redo support
   */
  const handleIconSave = useCallback(
    async (id: string, icon: string | null) => {
      const item = getItem(id);
      if (!item || !("icon" in item)) return;

      const previousIcon = item.icon;
      const res = await updateItem(id, { icon } as Partial<TItem>);

      if (res.ok && previousIcon !== icon) {
        builder.pushUndoAction({
          action: `update-icon:${entityKind}`,
          timestamp: new Date(),
          data: {
            undo: async () => {
              await updateItem(id, { icon: previousIcon } as Partial<TItem>);
            },
            redo: async () => {
              await updateItem(id, { icon } as Partial<TItem>);
            },
          },
        });
      }
    },
    [builder, entityKind, getItem, updateItem]
  );

  /**
   * Handle visibility toggle with undo/redo support
   */
  const handleVisibilitySave = useCallback(
    async (id: string, isVisible: boolean) => {
      const item = getItem(id);
      if (!item || !("isVisible" in item)) return;

      const previousIsVisible = item.isVisible;
      const res = await updateItem(id, { isVisible } as Partial<TItem>);

      if (res.ok && previousIsVisible !== isVisible) {
        builder.pushUndoAction({
          action: `toggle-visibility:${entityKind}`,
          timestamp: new Date(),
          data: {
            undo: async () => {
              await updateItem(id, { isVisible: previousIsVisible } as Partial<TItem>);
            },
            redo: async () => {
              await updateItem(id, { isVisible } as Partial<TItem>);
            },
          },
        });
      }
    },
    [builder, entityKind, getItem, updateItem]
  );

  return {
    handleNameSave,
    handleIconSave,
    handleVisibilitySave,
  };
}
