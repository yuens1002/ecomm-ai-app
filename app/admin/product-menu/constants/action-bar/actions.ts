import {
  ArrowUpDown,
  ConciergeBell,
  Copy,
  CornerUpLeft,
  Eye,
  ListChevronsDownUp,
  ListChevronsUpDown,
  Plus,
  Redo,
  Trash2,
  Undo,
} from "lucide-react";
import type { ActionBase, ActionContext, ActionExecuteResult, ActionId } from "./model";
import { allCollapsed, allExpanded, hasRedoHistory, hasSameKindSelection, hasSelection, hasUndoHistory, modKey } from "./shared";

// ─────────────────────────────────────────────────────────────
// UTILS - Common execute patterns
// ─────────────────────────────────────────────────────────────

const toggleLabelVisibility = async ({ selectedIds, mutations, labels }: ActionContext) => {
  await Promise.all(
    selectedIds.map(async (id) => {
      const label = labels.find((l) => l.id === id);
      if (label) await mutations.updateLabel(id, { isVisible: !label.isVisible });
    })
  );
};

const toggleCategoryVisibility = async ({ selectedIds, mutations, categories }: ActionContext) => {
  await Promise.all(
    selectedIds.map(async (id) => {
      const category = categories.find((c) => c.id === id);
      if (category) await mutations.updateCategory(id, { isVisible: !category.isVisible });
    })
  );
};

const hideLabels = async ({ selectedIds, mutations }: ActionContext) => {
  await Promise.all(selectedIds.map((id) => mutations.updateLabel(id, { isVisible: false })));
};

/**
 * Generic clone helper - executes clone mutation for each selected ID
 * @param selectedIds - Array of IDs to clone
 * @param items - Array of items to validate against
 * @param cloneFn - Clone mutation function
 * @returns Object with array of created IDs
 */
const cloneItems = async <T extends { id: string }>(
  selectedIds: string[],
  items: T[],
  cloneFn?: (payload: { id: string }) => Promise<{ ok: boolean; data?: unknown }>
): Promise<{ createdIds: string[] }> => {
  if (!cloneFn) return { createdIds: [] };

  const createdIds: string[] = [];
  for (const id of selectedIds) {
    const original = items.find((item) => item.id === id);
    if (!original) continue;

    const res = await cloneFn({ id });
    const createdId = res.ok ? (res.data as { id?: string } | undefined)?.id : undefined;
    if (createdId) createdIds.push(createdId);
  }

  return { createdIds };
};

/**
 * Generic clone undo capture helper
 * @param actionName - Action name for undo history (e.g., "clone:labels")
 * @param selectedIds - Original IDs that were cloned
 * @param result - Result from clone execution containing createdIds
 * @param deleteFn - Delete mutation function for undo
 * @param cloneFn - Clone mutation function for redo
 * @returns UndoAction or null if no items were created
 */
const captureCloneUndo = (
  actionName: string,
  selectedIds: string[],
  result: ActionExecuteResult,
  deleteFn?: (id: string) => Promise<{ ok: boolean; data?: unknown }>,
  cloneFn?: (payload: { id: string }) => Promise<{ ok: boolean; data?: unknown }>
) => {
  const originalIds = [...selectedIds];
  let createdIds = (result as { createdIds?: string[] } | void)?.createdIds ?? [];

  if (createdIds.length === 0) return null;

  return {
    action: actionName,
    timestamp: new Date(),
    data: {
      undo: async () => {
        if (!deleteFn) return;
        await Promise.all(createdIds.map((id) => deleteFn(id)));
      },
      redo: async () => {
        if (!cloneFn) return;
        const nextCreated: string[] = [];
        for (const id of originalIds) {
          const res = await cloneFn({ id });
          const createdId = res.ok
            ? ((res.data as { id?: string } | undefined)?.id ?? undefined)
            : undefined;
          if (createdId) nextCreated.push(createdId);
        }
        createdIds = nextCreated;
      },
    },
  };
};

// ─────────────────────────────────────────────────────────────
// ACTIONS
// ─────────────────────────────────────────────────────────────

export const ACTIONS: Record<ActionId, ActionBase> = {
  // ─────────────────────────────────────────────────────────────
  // CLONE
  // ─────────────────────────────────────────────────────────────
  clone: {
    id: "clone",
    icon: Copy,
    label: "Clone",
    tooltip: "Duplicate selected items",
    kbd: ["D"],
    disabled: (state) => !hasSameKindSelection(state),
    ariaLabel: (state) =>
      hasSameKindSelection(state)
        ? "Clone selected items"
        : hasSelection(state)
          ? "Clone disabled - select items of same type"
          : "Clone disabled - no items selected",
    onClick: async (_state, actions) => {
      await actions.cloneSelected();
    },

    execute: {
      menu: async ({ selectedIds, selectedKind, labels, categories, mutations }) => {
        // Clone based on selected entity type
        if (selectedKind === "label") {
          return cloneItems(selectedIds, labels, mutations.cloneLabel);
        } else if (selectedKind === "category") {
          return cloneItems(selectedIds, categories, mutations.cloneCategory);
        }
        // Products cannot be cloned in menu view
        return { createdIds: [] };
      },
      "all-labels": async ({ selectedIds, labels, mutations }) =>
        cloneItems(selectedIds, labels, mutations.cloneLabel),
      "all-categories": async ({ selectedIds, categories, mutations }) =>
        cloneItems(selectedIds, categories, mutations.cloneCategory),
    },

    captureUndo: {
      menu: ({ selectedIds, selectedKind, mutations }, result) => {
        if (selectedKind === "label") {
          return captureCloneUndo("clone:labels", selectedIds, result, mutations.deleteLabel, mutations.cloneLabel);
        } else if (selectedKind === "category") {
          return captureCloneUndo("clone:categories", selectedIds, result, mutations.deleteCategory, mutations.cloneCategory);
        }
        return null;
      },
      "all-labels": ({ selectedIds, mutations }, result) =>
        captureCloneUndo("clone:labels", selectedIds, result, mutations.deleteLabel, mutations.cloneLabel),
      "all-categories": ({ selectedIds, mutations }, result) =>
        captureCloneUndo("clone:categories", selectedIds, result, mutations.deleteCategory, mutations.cloneCategory),
    },

    effects: {
      refresh: {
        menu: ["labels"],
        "all-labels": ["labels"],
        "all-categories": ["categories"],
      },
      errorMessage: {
        menu: "Failed to clone labels",
        "all-labels": "Failed to clone labels",
        "all-categories": "Failed to clone categories",
      },
      successToast: {
        menu: { title: "Cloned labels" },
        "all-labels": { title: "Cloned labels" },
        "all-categories": { title: "Cloned categories" },
      },
      failureToast: { title: "Clone failed", description: "Please try again." },
    },
  },

  // ─────────────────────────────────────────────────────────────
  // REMOVE
  // ─────────────────────────────────────────────────────────────
  remove: {
    id: "remove",
    icon: CornerUpLeft,
    label: "Remove",
    tooltip: "Remove selected items",
    kbd: ["R"],
    disabled: (state) => !hasSameKindSelection(state),
    ariaLabel: (state) =>
      hasSameKindSelection(state)
        ? "Remove selected items"
        : hasSelection(state)
          ? "Remove disabled - select items of same type"
          : "Remove disabled - no items selected",
    onClick: async (_state, actions) => {
      await actions.removeSelected();
    },

    execute: {
      menu: async ({ selectedIds, selectedKind, labels, products, mutations }) => {
        // Remove based on selected entity type
        if (selectedKind === "label") {
          // Hide labels from menu (set isVisible: false)
          await Promise.all(selectedIds.map((id) => mutations.updateLabel(id, { isVisible: false })));
        } else if (selectedKind === "category") {
          // Detach categories from their parent labels
          await Promise.all(
            selectedIds.flatMap((categoryId) =>
              labels
                .filter((label) => label.categories?.some((cat) => cat.id === categoryId))
                .map((label) => mutations.detachCategory(label.id, categoryId))
            )
          );
        } else if (selectedKind === "product") {
          // Detach products from their actual parent categories (using product.categoryIds)
          await Promise.all(
            selectedIds.flatMap((productId) => {
              const product = products.find((p) => p.id === productId);
              if (!product) return [];
              return product.categoryIds.map((categoryId) =>
                mutations.detachProductFromCategory(productId, categoryId)
              );
            })
          );
        }
      },
      "all-labels": hideLabels,
      label: async ({ selectedIds, currentLabelId, mutations }) => {
        if (!currentLabelId) return;
        await Promise.all(selectedIds.map((id) => mutations.detachCategory(currentLabelId, id)));
      },
      category: async ({ selectedIds, currentCategoryId, mutations }) => {
        if (!currentCategoryId) return;
        await Promise.all(
          selectedIds.map((id) => mutations.detachProductFromCategory(id, currentCategoryId))
        );
      },
      "all-categories": async ({ selectedIds, mutations, labels }) => {
        await Promise.all(
          selectedIds.flatMap((categoryId) =>
            labels
              .filter((label) => label.categories?.some((cat) => cat.id === categoryId))
              .map((label) => mutations.detachCategory(label.id, categoryId))
          )
        );
      },
    },

    captureUndo: {
      menu: ({ selectedIds, selectedKind, labels, products, mutations }) => {
        if (selectedKind === "label") {
          // Store visibility state for undo
          const labelIds = [...selectedIds];
          if (labelIds.length === 0) return null;

          return {
            action: "remove:hide-labels-from-menu",
            timestamp: new Date(),
            data: {
              undo: async () => {
                await Promise.all(
                  labelIds.map((id) => mutations.updateLabel(id, { isVisible: true }))
                );
              },
              redo: async () => {
                await Promise.all(
                  labelIds.map((id) => mutations.updateLabel(id, { isVisible: false }))
                );
              },
            },
          };
        } else if (selectedKind === "category") {
          // Store label-category pairs for undo
          const pairs = selectedIds.flatMap((categoryId) =>
            labels
              .filter((label) => label.categories?.some((cat) => cat.id === categoryId))
              .map((label) => ({ labelId: label.id, categoryId }))
          );

          if (pairs.length === 0) return null;

          return {
            action: "remove:detach-categories-from-menu",
            timestamp: new Date(),
            data: {
              undo: async () => {
                if (!mutations.attachCategory) return;
                await Promise.all(
                  pairs.map(({ labelId, categoryId }) =>
                    mutations.attachCategory!(labelId, categoryId)
                  )
                );
              },
              redo: async () => {
                await Promise.all(
                  pairs.map(({ labelId, categoryId }) =>
                    mutations.detachCategory(labelId, categoryId)
                  )
                );
              },
            },
          };
        } else if (selectedKind === "product") {
          // Store product-category pairs for undo
          const pairs = selectedIds.flatMap((productId) => {
            const product = products.find((p) => p.id === productId);
            if (!product) return [];
            return product.categoryIds.map((categoryId) => ({ productId, categoryId }));
          });

          if (pairs.length === 0) return null;

          return {
            action: "remove:detach-products-from-menu",
            timestamp: new Date(),
            data: {
              undo: async () => {
                if (!mutations.attachProductToCategory) return;
                await Promise.all(
                  pairs.map(({ productId, categoryId }) =>
                    mutations.attachProductToCategory!(productId, categoryId)
                  )
                );
              },
              redo: async () => {
                await Promise.all(
                  pairs.map(({ productId, categoryId }) =>
                    mutations.detachProductFromCategory(productId, categoryId)
                  )
                );
              },
            },
          };
        }
        return null;
      },
      label: ({ selectedIds, currentLabelId, mutations }) => {
        if (!currentLabelId) return null;

        const pairs = selectedIds.map((categoryId) => ({
          labelId: currentLabelId,
          categoryId,
        }));

        if (pairs.length === 0) return null;

        return {
          action: "remove:detach-categories-from-label",
          timestamp: new Date(),
          data: {
            undo: async () => {
              if (!mutations.attachCategory) return;
              await Promise.all(
                pairs.map(({ labelId, categoryId }) =>
                  mutations.attachCategory!(labelId, categoryId)
                )
              );
            },
            redo: async () => {
              await Promise.all(
                pairs.map(({ labelId, categoryId }) =>
                  mutations.detachCategory(labelId, categoryId)
                )
              );
            },
          },
        };
      },
      category: ({ selectedIds, currentCategoryId, mutations }) => {
        if (!currentCategoryId) return null;

        const pairs = selectedIds.map((productId) => ({
          productId,
          categoryId: currentCategoryId,
        }));

        if (pairs.length === 0) return null;

        return {
          action: "remove:detach-products-from-category",
          timestamp: new Date(),
          data: {
            undo: async () => {
              if (!mutations.attachProductToCategory) return;
              await Promise.all(
                pairs.map(({ productId, categoryId }) =>
                  mutations.attachProductToCategory!(productId, categoryId)
                )
              );
            },
            redo: async () => {
              await Promise.all(
                pairs.map(({ productId, categoryId }) =>
                  mutations.detachProductFromCategory(productId, categoryId)
                )
              );
            },
          },
        };
      },
      "all-categories": ({ selectedIds, labels, mutations }) => {
        const pairs = selectedIds.flatMap((categoryId) =>
          labels
            .filter((label) => label.categories?.some((cat) => cat.id === categoryId))
            .map((label) => ({ labelId: label.id, categoryId }))
        );

        if (pairs.length === 0) return null;

        return {
          action: "remove:detach-categories-from-labels",
          timestamp: new Date(),
          data: {
            undo: async () => {
              if (!mutations.attachCategory) return;
              await Promise.all(
                pairs.map(({ labelId, categoryId }) =>
                  mutations.attachCategory!(labelId, categoryId)
                )
              );
            },
            redo: async () => {
              await Promise.all(
                pairs.map(({ labelId, categoryId }) => mutations.detachCategory(labelId, categoryId))
              );
            },
          },
        };
      },
    },

    effects: {
      refresh: {
        menu: ["labels"],
        label: ["labels"],
        category: ["products"],
        "all-labels": ["labels"],
        "all-categories": ["categories"],
      },
      errorMessage: {
        menu: "Failed to hide labels from menu",
        label: "Failed to detach categories from label",
        category: "Failed to detach products from category",
        "all-labels": "Failed to hide labels",
        "all-categories": "Failed to detach categories from labels",
      },
      successToast: {
        menu: { title: "Removed from menu" },
        label: { title: "Removed from label" },
        category: { title: "Removed from category" },
        "all-labels": { title: "Removed" },
        "all-categories": { title: "Removed from labels" },
      },
      failureToast: { title: "Remove failed", description: "Please try again." },
    },
  },

  // ─────────────────────────────────────────────────────────────
  // VISIBILITY
  // ─────────────────────────────────────────────────────────────
  visibility: {
    id: "visibility",
    icon: Eye,
    label: "Visibility",
    tooltip: "Toggle visibility",
    kbd: ["V"],
    disabled: (state) => !hasSelection(state),
    ariaLabel: (state) =>
      hasSelection(state)
        ? "Toggle visibility of selected items"
        : "Visibility disabled - no items selected",
    onClick: async (_state, actions) => {
      await actions.toggleVisibility();
    },

    execute: {
      menu: toggleLabelVisibility,
      "all-labels": toggleLabelVisibility,
      "all-categories": toggleCategoryVisibility,
    },

    captureUndo: {
      menu: ({ selectedIds, labels, mutations }) => {
        const before = selectedIds
          .map((id) => {
            const label = labels.find((l) => l.id === id);
            if (!label) return null;
            return { id, isVisible: label.isVisible };
          })
          .filter((x): x is { id: string; isVisible: boolean } => x !== null);

        if (before.length === 0) return null;

        return {
          action: "toggle-visibility:labels",
          timestamp: new Date(),
          data: {
            undo: async () => {
              await Promise.all(
                before.map(({ id, isVisible }) => mutations.updateLabel(id, { isVisible }))
              );
            },
            redo: async () => {
              await Promise.all(
                before.map(({ id, isVisible }) => mutations.updateLabel(id, { isVisible: !isVisible }))
              );
            },
          },
        };
      },
      "all-labels": ({ selectedIds, labels, mutations }) => {
        const before = selectedIds
          .map((id) => {
            const label = labels.find((l) => l.id === id);
            if (!label) return null;
            return { id, isVisible: label.isVisible };
          })
          .filter((x): x is { id: string; isVisible: boolean } => x !== null);

        if (before.length === 0) return null;

        return {
          action: "toggle-visibility:labels",
          timestamp: new Date(),
          data: {
            undo: async () => {
              await Promise.all(
                before.map(({ id, isVisible }) => mutations.updateLabel(id, { isVisible }))
              );
            },
            redo: async () => {
              await Promise.all(
                before.map(({ id, isVisible }) => mutations.updateLabel(id, { isVisible: !isVisible }))
              );
            },
          },
        };
      },
      "all-categories": ({ selectedIds, categories, mutations }) => {
        const before = selectedIds
          .map((id) => {
            const category = categories.find((c) => c.id === id);
            if (!category) return null;
            return { id, isVisible: category.isVisible };
          })
          .filter((x): x is { id: string; isVisible: boolean } => x !== null);

        if (before.length === 0) return null;

        return {
          action: "toggle-visibility:categories",
          timestamp: new Date(),
          data: {
            undo: async () => {
              await Promise.all(
                before.map(({ id, isVisible }) => mutations.updateCategory(id, { isVisible }))
              );
            },
            redo: async () => {
              await Promise.all(
                before.map(({ id, isVisible }) => mutations.updateCategory(id, { isVisible: !isVisible }))
              );
            },
          },
        };
      },
    },

    effects: {
      refresh: {
        menu: ["labels"],
        "all-labels": ["labels"],
        "all-categories": ["categories"],
      },
      errorMessage: {
        menu: "Failed to toggle label visibility",
        "all-labels": "Failed to toggle label visibility",
        "all-categories": "Failed to toggle category visibility",
      },
      successToast: {
        menu: { title: "Visibility updated" },
        "all-labels": { title: "Visibility updated" },
        "all-categories": { title: "Visibility updated" },
      },
      failureToast: { title: "Visibility update failed", description: "Please try again." },
    },
  },

  // ─────────────────────────────────────────────────────────────
  // EXPAND ALL
  // ─────────────────────────────────────────────────────────────
  "expand-all": {
    id: "expand-all",
    icon: ListChevronsUpDown,
    label: "Expand All",
    tooltip: "Expand all sections",
    kbd: ["E"],
    disabled: (state) => allExpanded(state),
    onClick: (_state, actions) => {
      actions.expandAll();
    },
  },

  // ─────────────────────────────────────────────────────────────
  // COLLAPSE ALL
  // ─────────────────────────────────────────────────────────────
  "collapse-all": {
    id: "collapse-all",
    icon: ListChevronsDownUp,
    label: "Collapse All",
    tooltip: "Collapse all sections",
    kbd: ["C"],
    disabled: (state) => allCollapsed(state),
    onClick: (_state, actions) => {
      actions.collapseAll();
    },
  },

  // ─────────────────────────────────────────────────────────────
  // UNDO
  // ─────────────────────────────────────────────────────────────
  undo: {
    id: "undo",
    icon: Undo,
    label: "Undo",
    tooltip: "Undo last change",
    kbd: ["U"],
    disabled: (state) => !hasUndoHistory(state),
    ariaLabel: (state) =>
      hasUndoHistory(state) ? "Undo last operation" : "Undo disabled - no changes to undo",
    onClick: (_state, actions) => {
      actions.undo();
    },
  },

  // ─────────────────────────────────────────────────────────────
  // REDO
  // ─────────────────────────────────────────────────────────────
  redo: {
    id: "redo",
    icon: Redo,
    label: "Redo",
    tooltip: "Redo last change",
    kbd: ["Shift", "U"],
    disabled: (state) => !hasRedoHistory(state),
    ariaLabel: (state) =>
      hasRedoHistory(state) ? "Redo last undone operation" : "Redo disabled - no changes to redo",
    onClick: (_state, actions) => {
      actions.redo();
    },
  },

  // ─────────────────────────────────────────────────────────────
  // NEW LABEL
  // ─────────────────────────────────────────────────────────────
  "new-label": {
    id: "new-label",
    icon: Plus,
    label: "New Label",
    tooltip: "Add new label",
    kbd: ["N"],
    disabled: (state) => hasSelection(state),
    ariaLabel: (state) =>
      hasSelection(state) ? "New label disabled - clear selection first" : "Add new label",
    onClick: async (_state, actions) => {
      await actions.createNewLabel?.();
    },
  },

  // ─────────────────────────────────────────────────────────────
  // ADD/REMOVE LABELS
  // ─────────────────────────────────────────────────────────────
  "add-labels": {
    id: "add-labels",
    icon: Plus,
    label: "Labels",
    tooltip: "Add/remove labels to menu",
    kbd: [],
    disabled: (state) => state.totalLabels === 0 || hasSelection(state),
    onClick: () => {},
  },

  // ─────────────────────────────────────────────────────────────
  // ADD CATEGORIES
  // ─────────────────────────────────────────────────────────────
  "add-categories": {
    id: "add-categories",
    icon: Plus,
    label: "Categories",
    tooltip: "Add categories to label",
    kbd: [],
    disabled: (state) => state.totalCategories === 0,
    onClick: () => {},
  },

  // ─────────────────────────────────────────────────────────────
  // ADD PRODUCTS
  // ─────────────────────────────────────────────────────────────
  "add-products": {
    id: "add-products",
    icon: Plus,
    label: "Products",
    tooltip: "Add products to category",
    kbd: [],
    disabled: (state) => state.totalProducts === 0 || hasSelection(state),
    onClick: () => {},
  },

  // ─────────────────────────────────────────────────────────────
  // SORT ORDER
  // ─────────────────────────────────────────────────────────────
  "sort-order": {
    id: "sort-order",
    icon: ArrowUpDown,
    label: "Sort Order",
    tooltip: "Product ordering",
    kbd: [modKey, "R"],
    disabled: () => false,
    onClick: async (state) => {
      console.log("Sort Order clicked", state);
    },
  },

  // ─────────────────────────────────────────────────────────────
  // NEW CATEGORY
  // ─────────────────────────────────────────────────────────────
  "new-category": {
    id: "new-category",
    icon: Plus,
    label: "New Category",
    tooltip: "Add new category",
    kbd: ["N"],
    disabled: (state) => hasSelection(state),
    ariaLabel: (state) =>
      hasSelection(state) ? "New category disabled - clear selection first" : "Add new category",
    onClick: async (_state, actions) => {
      await actions.createNewCategory();
    },
  },

  // ─────────────────────────────────────────────────────────────
  // HELP
  // ─────────────────────────────────────────────────────────────
  help: {
    id: "help",
    icon: ConciergeBell,
    label: "Help",
    tooltip: "View help",
    kbd: ["?"],
    disabled: () => false,
    onClick: () => {
      // Dispatch custom event for HelpPopoverButton to listen to
      window.dispatchEvent(new CustomEvent("menu-builder:toggle-help"));
    },
  },

  // ─────────────────────────────────────────────────────────────
  // DELETE
  // ─────────────────────────────────────────────────────────────
  delete: {
    id: "delete",
    icon: Trash2,
    label: "Delete",
    tooltip: "Permanently delete selected items",
    kbd: ["X"],
    disabled: (state) => !hasSelection(state),
    ariaLabel: (state) =>
      hasSelection(state)
        ? "Permanently delete selected items"
        : "Delete disabled - no items selected",
    onClick: async (_state, actions) => {
      await actions.deleteSelected();
    },

    execute: {
      "all-labels": async ({ selectedIds, mutations }) => {
        if (!mutations.deleteLabel) return;
        await Promise.all(selectedIds.map((id) => mutations.deleteLabel!(id)));
      },
      "all-categories": async ({ selectedIds, mutations }) => {
        if (!mutations.deleteCategory) return;
        await Promise.all(selectedIds.map((id) => mutations.deleteCategory!(id)));
      },
    },

    captureUndo: {
      "all-labels": ({ selectedIds, labels, mutations }) => {
        // Capture full state of labels to be deleted (including category relationships)
        const deletedLabels = selectedIds
          .map((id) => labels.find((l) => l.id === id))
          .filter((l): l is NonNullable<typeof l> => l !== undefined)
          .map((label) => ({
            name: label.name,
            icon: label.icon,
            isVisible: label.isVisible,
            autoOrder: label.autoOrder,
            order: label.order,
            categoryIds: label.categories.map((c) => c.id),
          }));

        if (deletedLabels.length === 0) return null;

        // Track IDs of restored labels for redo
        let restoredIds: string[] = [];

        return {
          action: "delete:labels",
          timestamp: new Date(),
          data: {
            undo: async () => {
              if (!mutations.restoreLabel) return;
              restoredIds = [];
              for (const labelData of deletedLabels) {
                const res = await mutations.restoreLabel(labelData);
                if (res.ok && res.data) {
                  const newId = (res.data as { id?: string })?.id;
                  if (newId) restoredIds.push(newId);
                }
              }
            },
            redo: async () => {
              if (!mutations.deleteLabel) return;
              await Promise.all(restoredIds.map((id) => mutations.deleteLabel!(id)));
              restoredIds = [];
            },
          },
        };
      },
      "all-categories": ({ selectedIds, categories, mutations }) => {
        // Capture full state of categories to be deleted (including label relationships)
        const deletedCategories = selectedIds
          .map((id) => categories.find((c) => c.id === id))
          .filter((c): c is NonNullable<typeof c> => c !== undefined)
          .map((category) => ({
            name: category.name,
            slug: category.slug,
            isVisible: category.isVisible,
            order: category.order,
            labelIds: category.labels.map((l) => l.id),
          }));

        if (deletedCategories.length === 0) return null;

        // Track IDs of restored categories for redo
        let restoredIds: string[] = [];

        return {
          action: "delete:categories",
          timestamp: new Date(),
          data: {
            undo: async () => {
              if (!mutations.restoreCategory) return;
              restoredIds = [];
              for (const categoryData of deletedCategories) {
                const res = await mutations.restoreCategory(categoryData);
                if (res.ok && res.data) {
                  const newId = (res.data as { id?: string })?.id;
                  if (newId) restoredIds.push(newId);
                }
              }
            },
            redo: async () => {
              if (!mutations.deleteCategory) return;
              await Promise.all(restoredIds.map((id) => mutations.deleteCategory!(id)));
              restoredIds = [];
            },
          },
        };
      },
    },

    effects: {
      refresh: {
        "all-labels": ["labels"],
        "all-categories": ["categories"],
      },
      successToast: {
        "all-labels": { title: "Labels deleted" },
        "all-categories": { title: "Categories deleted" },
      },
      failureToast: { title: "Delete failed", description: "Please try again." },
    },
  },
};
