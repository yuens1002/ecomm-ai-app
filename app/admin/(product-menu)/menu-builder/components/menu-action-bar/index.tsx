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
    createNewCategory,
    // All mutations
    createCategory,
    cloneCategory,
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

    const selectedIdsSnapshot = [...builder.selectedIds];

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
        createCategory,
        cloneCategory,
        updateLabel,
        updateCategory,
        detachCategory,
        detachProductFromCategory,
        attachCategory,
      },
      labels,
      categories,
      products,
    };

    try {
      const viewSnapshot = builder.currentView;

      // Capture "before" state for undo/redo.
      const beforeAllCategoriesVisibility =
        viewSnapshot === "all-categories" && actionId === "visibility"
          ? selectedIdsSnapshot
              .map((id) => {
                const category = categories.find((c) => c.id === id);
                if (!category) return null;
                return { id, isVisible: category.isVisible };
              })
              .filter((x): x is { id: string; isVisible: boolean } => x !== null)
          : null;

      const beforeAllCategoriesRemovePairs =
        viewSnapshot === "all-categories" && actionId === "remove"
          ? selectedIdsSnapshot.flatMap((categoryId) =>
              labels
                .filter((label) => label.categories?.some((cat) => cat.id === categoryId))
                .map((label) => ({ labelId: label.id, categoryId }))
            )
          : null;

      const result = await executeForView(context);

      if (viewSnapshot === "all-categories") {
        if (actionId === "visibility" && beforeAllCategoriesVisibility?.length) {
          const after = beforeAllCategoriesVisibility.map(({ id, isVisible }) => ({
            id,
            isVisible: !isVisible,
          }));

          builder.pushUndoAction({
            action: "toggle-visibility:categories",
            timestamp: new Date(),
            data: {
              undo: async () => {
                await Promise.all(
                  beforeAllCategoriesVisibility.map(({ id, isVisible }) =>
                    updateCategory(id, { isVisible })
                  )
                );
              },
              redo: async () => {
                await Promise.all(
                  after.map(({ id, isVisible }) => updateCategory(id, { isVisible }))
                );
              },
            },
          });
        }

        if (actionId === "remove" && beforeAllCategoriesRemovePairs?.length) {
          const pairs = beforeAllCategoriesRemovePairs;
          builder.pushUndoAction({
            action: "remove:detach-categories-from-labels",
            timestamp: new Date(),
            data: {
              undo: async () => {
                await Promise.all(
                  pairs.map(({ labelId, categoryId }) => attachCategory(labelId, categoryId))
                );
              },
              redo: async () => {
                await Promise.all(
                  pairs.map(({ labelId, categoryId }) => detachCategory(labelId, categoryId))
                );
              },
            },
          });
        }

        if (actionId === "clone") {
          const originalIds = [...selectedIdsSnapshot];
          let createdIds = (result as { createdIds?: string[] } | void)?.createdIds ?? [];

          if (createdIds.length > 0) {
            builder.pushUndoAction({
              action: "clone:categories",
              timestamp: new Date(),
              data: {
                undo: async () => {
                  await Promise.all(createdIds.map((id) => deleteCategory(id)));
                },
                redo: async () => {
                  const nextCreated: string[] = [];
                  for (const categoryId of originalIds) {
                    const res = await cloneCategory({ id: categoryId });
                    const createdId = res.ok
                      ? ((res.data as { id?: string } | undefined)?.id ?? undefined)
                      : undefined;
                    if (createdId) nextCreated.push(createdId);
                  }
                  createdIds = nextCreated;
                },
              },
            });
          }
        }
      }

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
