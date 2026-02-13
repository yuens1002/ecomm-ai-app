"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Kbd, KbdGroup } from "@/components/ui/kbd";
import { TooltipProvider } from "@/components/ui/tooltip";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { useMemo, useRef, useState } from "react";
import { MoreHorizontal } from "lucide-react";
import {
  ACTION_BAR_CONFIG,
  type ActionContext,
  type ActionId,
} from "../../../constants/action-bar-config";
import { HELP_CONTENT } from "../../../constants/help-content";
import { getEntityIdFromKey, getActionableRoots } from "../../../types/identity-registry";
import { getExpandableIds } from "../../../hooks/useFlattenedMenuRows";
import { DROPDOWN_REGISTRY, type DropdownContext } from "../../../constants/dropdown-registry";
import { useKeyboardShortcuts } from "../../../hooks/useKeyboardShortcuts";
import { useMenuBuilder } from "../../MenuBuilderProvider";
import { ActionButton } from "./ActionButton";
import { ActionComboButton } from "./ActionComboButton";
import { ActionDropdownButton } from "./ActionDropdownButton";
import { DeleteAlertButton } from "./DeleteAlertButton";
import { HelpPopoverButton } from "./HelpPopoverButton";

/**
 * MenuActionBar - Action buttons for current view
 *
 * Gets all data from MenuBuilderProvider - no props needed.
 */
export function MenuActionBar() {
  const { toast } = useToast();
  const [mobileDeleteOpen, setMobileDeleteOpen] = useState(false);
  const [isMobileDeleting, setIsMobileDeleting] = useState(false);
  const [mobileHelpOpen, setMobileHelpOpen] = useState(false);
  const mobileHelpOpenedAt = useRef(0);

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
    restoreLabel,
    restoreCategory,
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

  // Compute expandable IDs (labels with categories only in 2-level view)
  const expandableIds = useMemo(
    () => getExpandableIds(labels),
    [labels]
  );

  // Build state object for action bar config (with data counts and expand state)
  const state = useMemo(
    () => ({
      ...builder,
      totalLabels: labels.length,
      totalCategories: categories.length,
      totalProducts: products.length,
      expandableIds,
    }),
    [builder, labels.length, categories.length, products.length, expandableIds]
  );

  // Build actions object for action bar config
  const builderActions = {
    // Selection
    toggleSelection: builder.toggleSelection,
    selectAll: builder.selectAll,
    clearSelection: builder.clearSelection,

    // Expand/collapse
    toggleExpand: builder.toggleExpand,
    expandAll: () => {
      builder.expandAll(expandableIds);
    },
    collapseAll: builder.collapseAll,

    // Navigation
    navigateToView: builder.navigateToView,
    navigateToLabel: builder.navigateToLabel,
    navigateToCategory: builder.navigateToCategory,
    navigateBack: builder.navigateBack,

    // Undo/redo
    undo: async () => {
      try {
        await builder.undo();
        toast({ title: "Undo", description: "Action undone" });
      } catch {
        toast({ title: "Undo failed", description: "Could not undo action", variant: "destructive" });
      }
    },
    redo: async () => {
      try {
        await builder.redo();
        toast({ title: "Redo", description: "Action redone" });
      } catch {
        toast({ title: "Redo failed", description: "Could not redo action", variant: "destructive" });
      }
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
    deleteSelected: async () => {
      await executeActionFromConfig("delete");
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

    // Get actionable root keys (items whose parents are not selected)
    const actionableRoots = getActionableRoots(builder.selectedIds);

    const context: ActionContext = {
      // Extract entity IDs from actionable roots only
      selectedIds: actionableRoots.map(getEntityIdFromKey),
      selectedKind: builder.selectedKind,
      currentLabelId: builder.currentLabelId,
      currentCategoryId: builder.currentCategoryId,
      mutations: {
        updateLabel,
        cloneLabel,
        deleteLabel,
        restoreLabel,
        createCategory,
        cloneCategory,
        deleteCategory,
        restoreCategory,
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
      setPinnedNew: builder.setPinnedNew,
      pushUndoAction: builder.pushUndoAction,
      toast,
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
      builder.setPinnedNew,
      builder.pushUndoAction,
      toast,
    ]
  );

  // Enable keyboard shortcuts for current view's actions
  useKeyboardShortcuts({
    actions,
    state,
    builderActions,
  });

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
    // Special rendering for help button
    if (action.id === "help") {
      return <HelpPopoverButton key={action.id} currentView={builder.currentView} />;
    }

    // Special rendering for delete button (with confirmation dialog)
    if (action.id === "delete") {
      const isDisabled = action.disabled(state);
      return (
        <DeleteAlertButton
          key={action.id}
          disabled={isDisabled}
          selectedCount={builder.selectedIds.length}
          currentView={builder.currentView}
          kbd={action.kbd}
          onConfirm={async () => {
            await builderActions.deleteSelected();
          }}
        />
      );
    }

    const isDisabled =
      action.disabled(state) ||
      (action.id === "remove" &&
        builder.currentView === "all-categories" &&
        disableRemoveInAllCategories);
    const renderer = RENDERERS[action.type];
    return renderer(action, isDisabled);
  };

  // Mobile: first action (New/Add) stays visible, rest collapse into dropdown
  const firstActionCount = leftActions[0]?.type === "combo" ? 2 : 1;
  const remainingLeft = leftActions.slice(firstActionCount);
  const mobileOverflowActions = [...remainingLeft, ...rightActions];

  const entityType = builder.currentView === "all-labels" ? "label" : "category";
  const entityPlural =
    builder.selectedIds.length === 1 ? entityType : `${entityType}s`;

  const handleMobileDelete = async () => {
    setIsMobileDeleting(true);
    try {
      await builderActions.deleteSelected();
    } finally {
      setIsMobileDeleting(false);
      setMobileDeleteOpen(false);
    }
  };

  // Render kbd shortcut matching context menu pattern
  const renderKbd = (kbd: string[]) => {
    if (kbd.length === 0) return null;
    if (kbd.length === 1) return <Kbd className="ml-auto">{kbd[0]}</Kbd>;
    return (
      <KbdGroup className="ml-auto">
        {kbd.map((key) => (
          <Kbd key={key}>{key}</Kbd>
        ))}
      </KbdGroup>
    );
  };

  return (
    <TooltipProvider>
      <div className="flex items-center gap-4 px-0">
        {/* First action (New/Add) — always visible */}
        <div className="flex items-center gap-2">
          {leftActions.slice(0, firstActionCount).map((action, index) => renderAction(action, index))}
        </div>

        {/* Remaining left actions — md+ only */}
        <div className="hidden md:flex items-center gap-2">
          {remainingLeft.map((action, index) => renderAction(action, index + firstActionCount))}
        </div>

        <div className="flex-1" />

        {/* Right actions — md+ only */}
        <div className="hidden md:flex items-center gap-2">
          {rightActions.map(renderAction)}
        </div>

        {/* Mobile overflow dropdown — below md */}
        {mobileOverflowActions.length > 0 && (
          <Popover open={mobileHelpOpen} onOpenChange={(open) => {
              // Debounce close: dropdown cleanup fires after setTimeout opens the popover,
              // causing an immediate dismiss. Ignore close events within 300ms of open.
              if (!open && Date.now() - mobileHelpOpenedAt.current < 300) return;
              setMobileHelpOpen(open);
            }}>
            <PopoverAnchor asChild>
              <div className="md:hidden">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" aria-label="More actions">
                      <MoreHorizontal className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-52">
                    {mobileOverflowActions.map((action, index) => {
                      const Icon = action.icon;
                      const isDisabled =
                        action.disabled(state) ||
                        (action.id === "remove" &&
                          builder.currentView === "all-categories" &&
                          disableRemoveInAllCategories);

                      // Separator between left and right groups
                      const isFirstRight = index === remainingLeft.length && remainingLeft.length > 0;

                      return (
                        <div key={action.id}>
                          {isFirstRight && <DropdownMenuSeparator />}
                          <DropdownMenuItem
                            disabled={isDisabled}
                            onClick={
                              action.id === "delete"
                                ? () => setMobileDeleteOpen(true)
                                : action.id === "help"
                                ? () => setTimeout(() => {
                                    mobileHelpOpenedAt.current = Date.now();
                                    setMobileHelpOpen(true);
                                  }, 150)
                                : () => action.onClick(state, builderActions)
                            }
                            className={action.id === "delete" ? "text-destructive focus:text-destructive" : ""}
                          >
                            <Icon className="size-4" />
                            {action.label}
                            {renderKbd(action.kbd)}
                          </DropdownMenuItem>
                        </div>
                      );
                    })}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </PopoverAnchor>
            <PopoverContent align="end" className="w-80">
              <div className="space-y-3">
                <h4 className="font-medium text-sm">{HELP_CONTENT[builder.currentView].title}</h4>
                <ul className="space-y-1.5 text-sm text-muted-foreground">
                  {HELP_CONTENT[builder.currentView].items.map((item, index) => (
                    <li key={index} className="flex gap-2">
                      <span className="text-muted-foreground/60">•</span>
                      <span>{item.text}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </PopoverContent>
          </Popover>
        )}
      </div>

      {/* Mobile delete confirmation dialog */}
      <AlertDialog open={mobileDeleteOpen} onOpenChange={setMobileDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              Delete {builder.selectedIds.length} {entityPlural}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The selected {entityPlural} will be
              permanently deleted
              {builder.currentView === "all-labels"
                ? " and all category associations will be removed."
                : " and all label and product associations will be removed."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isMobileDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={handleMobileDelete}
              disabled={isMobileDeleting}
            >
              {isMobileDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </TooltipProvider>
  );
}
