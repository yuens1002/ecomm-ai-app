"use client";

import { useCallback } from "react";
import type { IdentityRegistry } from "../types/identity-registry";

type MutationHandlers = {
  cloneLabel?: (id: string) => Promise<void>;
  cloneCategory?: (id: string, parentId: string) => Promise<void>;
  cloneProduct?: (id: string, categoryId: string) => Promise<void>;
  removeLabel?: (id: string) => Promise<void>;
  removeCategory?: (id: string, parentId: string) => Promise<void>;
  removeProduct?: (id: string, categoryId: string) => Promise<void>;
};

type ActionHandlerOptions = {
  /** Mutation handlers by entity kind */
  mutations: MutationHandlers;

  /** Callback after successful action */
  onSuccess?: () => void;

  /** Callback on error */
  onError?: (error: Error) => void;
};

/**
 * Unified action handler for clone, remove operations.
 *
 * Uses IdentityRegistry to extract correct entityId and parentId
 * for any key format (flat or hierarchical).
 *
 * @example
 * ```ts
 * const { handleClone, handleRemove } = useActionHandler(registry, {
 *   mutations: {
 *     cloneLabel: builder.cloneLabel,
 *     cloneCategory: builder.cloneCategory,
 *     removeLabel: builder.removeLabel,
 *     removeCategory: builder.removeCategory,
 *   },
 *   onSuccess: () => builder.clearSelection(),
 * });
 *
 * // In action bar config
 * { action: "clone", execute: () => handleClone(builder.selectedIds) }
 * ```
 */
export function useActionHandler(
  registry: IdentityRegistry,
  options: ActionHandlerOptions
) {
  const { mutations, onSuccess, onError } = options;

  /**
   * Clone selected items.
   */
  const handleClone = useCallback(
    async (keys: string[]) => {
      try {
        for (const key of keys) {
          const identity = registry.get(key);
          if (!identity) continue;

          // Get parent entity ID from parentKey
          const parentId = identity.parentKey
            ? registry.getEntityId(identity.parentKey)
            : undefined;

          switch (identity.kind) {
            case "label":
              await mutations.cloneLabel?.(identity.entityId);
              break;
            case "category":
              if (parentId) {
                await mutations.cloneCategory?.(identity.entityId, parentId);
              }
              break;
            case "product":
              if (parentId) {
                await mutations.cloneProduct?.(identity.entityId, parentId);
              }
              break;
          }
        }

        onSuccess?.();
      } catch (error) {
        onError?.(error instanceof Error ? error : new Error(String(error)));
      }
    },
    [registry, mutations, onSuccess, onError]
  );

  /**
   * Remove selected items.
   */
  const handleRemove = useCallback(
    async (keys: string[]) => {
      try {
        for (const key of keys) {
          const identity = registry.get(key);
          if (!identity) continue;

          // Get parent entity ID from parentKey
          const parentId = identity.parentKey
            ? registry.getEntityId(identity.parentKey)
            : undefined;

          switch (identity.kind) {
            case "label":
              await mutations.removeLabel?.(identity.entityId);
              break;
            case "category":
              if (parentId) {
                await mutations.removeCategory?.(identity.entityId, parentId);
              }
              break;
            case "product":
              if (parentId) {
                await mutations.removeProduct?.(identity.entityId, parentId);
              }
              break;
          }
        }

        onSuccess?.();
      } catch (error) {
        onError?.(error instanceof Error ? error : new Error(String(error)));
      }
    },
    [registry, mutations, onSuccess, onError]
  );

  /**
   * Get entity ID from a key (for external use).
   */
  const getEntityId = useCallback(
    (key: string): string | undefined => {
      return registry.getEntityId(key);
    },
    [registry]
  );

  /**
   * Get parent entity ID from a key (for external use).
   */
  const getParentId = useCallback(
    (key: string): string | undefined => {
      const parentKey = registry.getParentKey(key);
      return parentKey ? registry.getEntityId(parentKey) : undefined;
    },
    [registry]
  );

  return {
    handleClone,
    handleRemove,
    getEntityId,
    getParentId,
  };
}
