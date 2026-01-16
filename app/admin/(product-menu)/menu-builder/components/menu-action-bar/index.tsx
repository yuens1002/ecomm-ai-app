"use client";

import { TooltipProvider } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { useMemo } from "react";
import {
  ACTION_BAR_CONFIG,
  type ActionContext,
  type ActionId,
} from "../../../constants/action-bar-config";
import { DROPDOWN_REGISTRY, type DropdownContext } from "../../../constants/dropdown-registry";
import { useMenuBuilder } from "../../MenuBuilderProvider";
import { ActionButton } from "./ActionButton";
import { ActionComboButton } from "./ActionComboButton";
import { ActionDropdownButton } from "./ActionDropdownButton";

/**
 * MenuActionBar - Action buttons for current view
 *
 * Gets all data from MenuBuilderProvider - no props needed.
 */
export function MenuActionBar() {
  const { toast } = useToast();

  const {
    builder,
    labels,
    categories,
    products,
    mutate,
    createNewLabel,
    createNewCategory,
    // All mutations
    createCategory,
    cloneLabel,
    cloneCategory,
    deleteLabel,
    deleteCategory,
    updateLabel,
    updateCategory,
    attachCategory,
    detachCategory,
    detachProductFromCategory,
    attachProductToCategory,
  } = useMenuBuilder();

  const actions = ACTION_BAR_CONFIG[builder.currentView];
  const leftActions = actions.filter((a) => a.position === "left");
  const rightActions = actions.filter((a) => a.position === "right");

  const disableRemoveInAllCategories = useMemo(() => {
    if (builder.currentView !== "all-categories") return false;
    if (builder.selectedIds.length === 0) return false;

    // In all-categories, "Remove" detaches selected categories from labels.
    // If none of the selected categories are attached to any label, disable the action.
    return !builder.selectedIds.some((id) => {
      const category = categories.find((c) => c.id === id);
      return (category?.labels?.length ?? 0) > 0;
    });
  }, [builder.currentView, builder.selectedIds, categories]);

  // Build state object for action bar config (with data counts)
  const state = useMemo(
    () => ({
      ...builder,
      totalLabels: labels.length,
      totalCategories: categories.length,
      totalProducts: products.length,
    }),
    [builder, labels.length, categories.length, products.length]
  );

  // Build actions object for action bar config
  const builderActions = {
    // Selection
    toggleSelection: builder.toggleSelection,
    selectAll: builder.selectAll,
    clearSelection: builder.clearSelection,

    // Expand/collapse
    toggleExpand: builder.toggleExpand,
    expandAll: builder.expandAll,
    collapseAll: builder.collapseAll,

    // Navigation
    navigateToView: builder.navigateToView,
    navigateToLabel: builder.navigateToLabel,
    navigateToCategory: builder.navigateToCategory,
    navigateBack: builder.navigateBack,

    // Undo/redo
    undo: () => {
      void builder.undo();
    },
    redo: () => {
      void builder.redo();
    },

    // CRUD operations - now handled by action.execute
    removeSelected: async () => {
      await executeActionFromConfig("remove");
    },
    cloneSelected: async () => {
      await executeActionFromConfig("clone");
    },
    toggleVisibility: async () => {
      await executeActionFromConfig("visibility");
    },

    createNewLabel: async () => {
      const createdId = await createNewLabel();
      if (createdId) {
        builder.setPinnedNew({ kind: "label", id: createdId });
        builder.setEditing({ kind: "label", id: createdId });

        if (builder.currentView === "menu" || builder.currentView === "all-labels") {
          let activeId = createdId;
          builder.pushUndoAction({
            action: "new-label",
            timestamp: new Date(),
            data: {
              undo: async () => {
                await updateLabel(activeId, { isVisible: false });
              },
              redo: async () => {
                const nextId = await createNewLabel();
                if (nextId) activeId = nextId;
              },
            },
          });
        }
      }
    },

    createNewCategory: async () => {
      const createdId = await createNewCategory();
      if (createdId) {
        builder.setPinnedNew({ kind: "category", id: createdId });
        builder.setEditing({ kind: "category", id: createdId });

        if (builder.currentView === "all-categories") {
          let activeId = createdId;
          builder.pushUndoAction({
            action: "new-category",
            timestamp: new Date(),
            data: {
              undo: async () => {
                await deleteCategory(activeId);
              },
              redo: async () => {
                const nextId = await createNewCategory();
                if (nextId) activeId = nextId;
              },
            },
          });
        }
      }
    },
  };

  // Helper to execute actions using action.execute from config
  const executeActionFromConfig = async (actionId: ActionId) => {
    if (builder.selectedIds.length === 0) return;

    const action = actions.find((a) => a.id === actionId);
    if (!action?.execute) {
      console.error(`[MenuActionBar] Action ${actionId} has no execute logic`);
      return;
    }

    const executeForView = action.execute[builder.currentView];
    if (!executeForView) {
      console.error(
        `[MenuActionBar] Action ${actionId} not available in ${builder.currentView} view`
      );
      return;
    }

    const context: ActionContext = {
      selectedIds: builder.selectedIds,
      currentLabelId: builder.currentLabelId,
      currentCategoryId: builder.currentCategoryId,
      mutations: {
        updateLabel,
        cloneLabel,
        deleteLabel,
        createCategory,
        cloneCategory,
        deleteCategory,
        updateCategory,
        detachCategory,
        detachProductFromCategory,
        attachProductToCategory,
        attachCategory,
      },
      labels,
      categories,
      products,
    };

    try {
      const viewSnapshot = builder.currentView;

      // Execute the action
      const result = await executeForView(context);

      // Declarative undo capture from action config
      const captureUndoFn = action.captureUndo?.[viewSnapshot];
      if (captureUndoFn) {
        const undoAction = captureUndoFn(context, result);
        if (undoAction) {
          builder.pushUndoAction(undoAction);
        }
      }

      // Auto-edit when cloning single label
      if (
        actionId === "clone" &&
        (builder.currentView === "menu" || builder.currentView === "all-labels") &&
        builder.selectedIds.length === 1
      ) {
        const createdIds = (result as { createdIds?: string[] } | void)?.createdIds ?? [];
        if (createdIds.length === 1) {
          builder.setEditing({ kind: "label", id: createdIds[0] });
        }
      }

      // Auto-edit when cloning single category
      if (
        actionId === "clone" &&
        builder.currentView === "all-categories" &&
        builder.selectedIds.length === 1
      ) {
        const createdIds = (result as { createdIds?: string[] } | void)?.createdIds ?? [];
        if (createdIds.length === 1) {
          builder.setEditing({ kind: "category", id: createdIds[0] });
        }
      }

      // Refresh data as specified
      const refreshForView = action.refresh?.[builder.currentView];
      if (refreshForView) {
        refreshForView.forEach((resource) => {
          if (resource === "labels" || resource === "categories" || resource === "products") {
            mutate();
          }
        });
      }

      const successToast = action.successToast?.[viewSnapshot];
      if (successToast) {
        toast({
          title: successToast.title,
          description: successToast.description,
        });
      }
    } catch (error) {
      const errorMsg =
        action.errorMessage?.[builder.currentView] || `Failed to execute ${actionId}`;
      console.error(`[MenuActionBar] ${errorMsg}:`, error);

      toast({
        title: action.failureToast?.title ?? `${action.label} failed`,
        description: action.failureToast?.description ?? "Please try again.",
        variant: "destructive",
      });
    }

    builder.clearSelection();
  };

  // Context for dropdown registry
  const dropdownContext: DropdownContext = useMemo(
    () => ({
      state,
      labels,
      categories,
      products,
      updateLabel,
      attachCategory,
      detachCategory,
      attachProductToCategory,
      detachProductFromCategory,
    }),
    [
      state,
      labels,
      categories,
      products,
      updateLabel,
      attachCategory,
      detachCategory,
      attachProductToCategory,
      detachProductFromCategory,
    ]
  );

  // Helper to build dropdown content from registry
  const buildDropdownContent = (actionId: ActionId): React.ReactNode => {
    const config = DROPDOWN_REGISTRY[actionId as keyof typeof DROPDOWN_REGISTRY];

    if (!config) {
      return <div className="p-4 text-sm text-muted-foreground">Coming soon</div>;
    }

    const Component = config.Component;
    const props = config.buildProps(dropdownContext);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return <Component {...(props as any)} />;
  };

  // Component renderers - no switch, just mapping
  const renderButton = (action: (typeof actions)[0], isDisabled: boolean) => (
    <ActionButton
      key={action.id}
      icon={action.icon}
      label={action.label}
      tooltip={action.tooltip}
      kbd={action.kbd}
      disabled={isDisabled}
      ariaLabel={action.ariaLabel?.(state)}
      onClick={() => action.onClick(state, builderActions)}
    />
  );

  const renderDropdown = (action: (typeof actions)[0], isDisabled: boolean) => {
    const dropdownContent = buildDropdownContent(action.id);

    return (
      <ActionDropdownButton
        key={action.id}
        icon={action.icon}
        label={action.label}
        tooltip={action.tooltip}
        kbd={action.kbd}
        disabled={isDisabled}
        ariaLabel={action.ariaLabel?.(state)}
        dropdownContent={dropdownContent}
      />
    );
  };

  const renderCombo = (action: (typeof actions)[0], isDisabled: boolean) => {
    // Only render if this is the "new" action (to avoid duplicates)
    if (!action.id.startsWith("new-")) return null;

    const addAction = leftActions.find((a) => a.id === action.comboWith);
    if (!addAction) return null;

    const dropdownContent = buildDropdownContent(addAction.id);

    return (
      <div key={action.id} className="pr-4">
        <ActionComboButton
          newButton={{
            icon: action.icon,
            label: action.label,
            tooltip: action.tooltip,
            kbd: action.kbd,
            disabled: isDisabled,
            ariaLabel: action.ariaLabel?.(state),
            onClick: () => action.onClick(state, builderActions),
          }}
          addButton={{
            label: addAction.label,
            tooltip: addAction.tooltip,
            disabled: addAction.disabled(state),
            dropdownContent,
          }}
        />
      </div>
    );
  };

  const RENDERERS = {
    button: renderButton,
    dropdown: renderDropdown,
    combo: renderCombo,
  };

  const renderAction = (action: (typeof actions)[0], _index: number) => {
    const isDisabled =
      action.disabled(state) ||
      (action.id === "remove" &&
        builder.currentView === "all-categories" &&
        disableRemoveInAllCategories);
    const renderer = RENDERERS[action.type];
    return renderer(action, isDisabled);
  };

  return (
    <TooltipProvider>
      <div className="flex items-center justify-between gap-4 px-0 bg-background">
        {/* LEFT SIDE */}
        <div className="flex items-center gap-2">
          {leftActions.map((action, index) => renderAction(action, index))}
        </div>

        {/* RIGHT SIDE */}
        <div className="flex items-center gap-2">{rightActions.map(renderAction)}</div>
      </div>
    </TooltipProvider>
  );
}
