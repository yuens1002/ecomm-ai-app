import {
  ArrowUpDown,
  Copy,
  CornerUpLeft,
  Eye,
  ListChevronsDownUp,
  ListChevronsUpDown,
  Plus,
  Redo,
  Undo,
} from "lucide-react";
import type { ActionBase, ActionContext, ActionId } from "./model";
import { hasRedoHistory, hasSelection, hasUndoHistory, modKey } from "./shared";

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
    kbd: [modKey, "D"],
    disabled: (state) => !hasSelection(state),
    ariaLabel: (state) =>
      hasSelection(state) ? "Clone selected items" : "Clone disabled - no items selected",
    onClick: async (_state, actions) => {
      await actions.cloneSelected();
    },

    execute: {
      menu: async ({ selectedIds }) => {
        // TODO: Implement label cloning with categories
        console.log("[Clone] Menu Labels:", selectedIds);
      },
      "all-labels": async ({ selectedIds }) => {
        // TODO: Implement label cloning
        console.log("[Clone] All Labels:", selectedIds);
      },
      "all-categories": async ({ selectedIds, categories, mutations }) => {
        const createdIds: string[] = [];
        for (const categoryId of selectedIds) {
          const original = categories.find((c) => c.id === categoryId);
          if (!original) continue;
          const res = await mutations.cloneCategory({ id: categoryId });
          const createdId = res.ok ? (res.data as { id?: string } | undefined)?.id : undefined;
          if (createdId) createdIds.push(createdId);
        }
        return { createdIds };
      },
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
    kbd: [modKey, "⌫"],
    disabled: (state) => !hasSelection(state),
    ariaLabel: (state) =>
      hasSelection(state) ? "Remove selected items" : "Remove disabled - no items selected",
    onClick: async (_state, actions) => {
      await actions.removeSelected();
    },

    execute: {
      menu: hideLabels,
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
    kbd: ["Space"],
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
    icon: ListChevronsDownUp,
    label: "Expand All",
    tooltip: "Expand all sections",
    kbd: [modKey, "↓"],
    disabled: () => false,
    onClick: (_state, actions) => {
      actions.expandAll([]);
    },
  },

  // ─────────────────────────────────────────────────────────────
  // COLLAPSE ALL
  // ─────────────────────────────────────────────────────────────
  "collapse-all": {
    id: "collapse-all",
    icon: ListChevronsUpDown,
    label: "Collapse All",
    tooltip: "Collapse all sections",
    kbd: [modKey, "↑"],
    disabled: () => false,
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
    kbd: [modKey, "Z"],
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
    kbd: [modKey, "Shift", "Z"],
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
    kbd: [modKey, "N"],
    disabled: () => false,
    onClick: async (state) => {
      console.log("New Label clicked", state);
    },
  },

  // ─────────────────────────────────────────────────────────────
  // ADD LABELS
  // ─────────────────────────────────────────────────────────────
  "add-labels": {
    id: "add-labels",
    icon: Plus,
    label: "Add Label(s)",
    tooltip: "Add labels to menu",
    kbd: [],
    disabled: (state) => state.totalLabels === 0,
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
  // SORT MODE
  // ─────────────────────────────────────────────────────────────
  "sort-mode": {
    id: "sort-mode",
    icon: ArrowUpDown,
    label: "Sort Mode",
    tooltip: "Category ordering mode",
    kbd: [modKey, "R"],
    disabled: () => false,
    onClick: async (state) => {
      console.log("Sort Mode clicked", state);
    },
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
    disabled: (state) => state.totalProducts === 0,
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
    kbd: [modKey, "N"],
    disabled: (state) => hasSelection(state),
    ariaLabel: (state) =>
      hasSelection(state) ? "New category disabled - clear selection first" : "Add new category",
    onClick: async (_state, actions) => {
      await actions.createNewCategory();
    },
  },
};
