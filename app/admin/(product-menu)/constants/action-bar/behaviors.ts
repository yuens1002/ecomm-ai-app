import type { BuilderState, MenuBuilderActions, ViewType } from "../../types/builder-state";
import { modKey } from "./keys";
import type { ActionBehavior, ActionContext, ActionId } from "./model";

const hasSelection = (state: BuilderState): boolean => state.selectedIds.length > 0;
const hasUndoHistory = (state: BuilderState): boolean => state.undoStack.length > 0;
const hasRedoHistory = (state: BuilderState): boolean => state.redoStack.length > 0;

export const ACTION_BEHAVIORS: Record<ActionId, ActionBehavior> = {
  clone: {
    disabled: (state) => !hasSelection(state),
    ariaLabel: (state) =>
      hasSelection(state) ? "Clone selected items" : "Clone disabled - no items selected",
    onClick: async (_state, actions: MenuBuilderActions) => {
      await actions.cloneSelected();
    },
    execute: {
      menu: async ({ selectedIds }: ActionContext) => {
        // TODO: Implement label cloning with categories
        console.log("[Clone] Menu Labels:", selectedIds);
      },
      "all-labels": async ({ selectedIds }: ActionContext) => {
        // TODO: Implement label cloning
        console.log("[Clone] All Labels:", selectedIds);
      },
      "all-categories": async ({ selectedIds, categories, mutations }: ActionContext) => {
        for (const categoryId of selectedIds) {
          const originalCategory = categories.find((c) => c.id === categoryId);
          if (!originalCategory) continue;
          await mutations.cloneCategory({ id: categoryId });
        }
      },
    } satisfies Partial<Record<ViewType, (context: ActionContext) => Promise<void>>>,
  },

  remove: {
    disabled: (state) => !hasSelection(state),
    ariaLabel: (state) =>
      hasSelection(state) ? "Remove selected items" : "Remove disabled - no items selected",
    onClick: async (_state, actions: MenuBuilderActions) => {
      await actions.removeSelected();
    },
    execute: {
      menu: async ({ selectedIds, mutations }: ActionContext) => {
        await Promise.all(selectedIds.map((id) => mutations.updateLabel(id, { isVisible: false })));
      },
      label: async ({ selectedIds, currentLabelId, mutations }: ActionContext) => {
        if (!currentLabelId) return;
        await Promise.all(selectedIds.map((id) => mutations.detachCategory(currentLabelId, id)));
      },
      category: async ({ selectedIds, currentCategoryId, mutations }: ActionContext) => {
        if (!currentCategoryId) return;
        await Promise.all(
          selectedIds.map((id) => mutations.detachProductFromCategory(id, currentCategoryId))
        );
      },
      "all-labels": async ({ selectedIds, mutations }: ActionContext) => {
        await Promise.all(selectedIds.map((id) => mutations.updateLabel(id, { isVisible: false })));
      },
      "all-categories": async ({ selectedIds, mutations, labels }: ActionContext) => {
        await Promise.all(
          selectedIds.flatMap((categoryId) =>
            labels
              .filter((label) => label.categories?.some((cat) => cat.id === categoryId))
              .map((label) => mutations.detachCategory(label.id, categoryId))
          )
        );
      },
    } satisfies Partial<Record<ViewType, (context: ActionContext) => Promise<void>>>,
  },

  visibility: {
    disabled: (state) => !hasSelection(state),
    ariaLabel: (state) =>
      hasSelection(state)
        ? "Toggle visibility of selected items"
        : "Visibility disabled - no items selected",
    onClick: async (_state, actions: MenuBuilderActions) => {
      await actions.toggleVisibility();
    },
    execute: {
      menu: async ({ selectedIds, mutations, labels }: ActionContext) => {
        await Promise.all(
          selectedIds.map(async (id) => {
            const label = labels.find((l) => l.id === id);
            if (label) await mutations.updateLabel(id, { isVisible: !label.isVisible });
          })
        );
      },
      "all-labels": async ({ selectedIds, mutations, labels }: ActionContext) => {
        await Promise.all(
          selectedIds.map(async (id) => {
            const label = labels.find((l) => l.id === id);
            if (label) await mutations.updateLabel(id, { isVisible: !label.isVisible });
          })
        );
      },
      "all-categories": async ({ selectedIds, mutations, categories }: ActionContext) => {
        await Promise.all(
          selectedIds.map(async (id) => {
            const category = categories.find((c) => c.id === id);
            if (category) {
              await mutations.updateCategory(id, { isVisible: !category.isVisible });
            }
          })
        );
      },
    } satisfies Partial<Record<ViewType, (context: ActionContext) => Promise<void>>>,
  },

  "expand-all": {
    disabled: () => false,
    onClick: (_state, actions: MenuBuilderActions) => {
      actions.expandAll([]);
    },
  },

  "collapse-all": {
    disabled: () => false,
    onClick: (_state, actions: MenuBuilderActions) => {
      actions.collapseAll();
    },
  },

  undo: {
    disabled: (state) => !hasUndoHistory(state),
    ariaLabel: (state) =>
      hasUndoHistory(state) ? "Undo last operation" : "Undo disabled - no changes to undo",
    onClick: (_state, actions: MenuBuilderActions) => {
      actions.undo();
    },
  },

  redo: {
    disabled: (state) => !hasRedoHistory(state),
    ariaLabel: (state) =>
      hasRedoHistory(state) ? "Redo last undone operation" : "Redo disabled - no changes to redo",
    onClick: (_state, actions: MenuBuilderActions) => {
      actions.redo();
    },
  },

  // View-local
  "new-label": {
    disabled: () => false,
    onClick: async (state) => {
      console.log("New Label clicked", state);
    },
  },

  "add-labels": {
    disabled: (state) => state.totalLabels === 0,
    onClick: () => {},
  },

  "add-categories": {
    disabled: (state) => state.totalCategories === 0,
    onClick: () => {},
  },

  "sort-mode": {
    disabled: () => false,
    onClick: async (state) => {
      console.log("Sort Mode clicked", state);
    },
  },

  "add-products": {
    disabled: (state) => state.totalProducts === 0,
    onClick: () => {},
  },

  "sort-order": {
    disabled: () => false,
    onClick: async (state) => {
      console.log("Sort Order clicked", state);
    },
  },

  "new-category": {
    disabled: (state) => hasSelection(state),
    ariaLabel: (state) =>
      hasSelection(state) ? "New category disabled - clear selection first" : "Add new category",
    onClick: async (_state, actions: MenuBuilderActions) => {
      await actions.createNewCategory();
    },
  },
};

// Keep this export available for docs/readers
export const ACTION_KEYS = { modKey };
