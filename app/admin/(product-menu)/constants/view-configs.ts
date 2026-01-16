import { ALL_VIEWS, type ViewType } from "../types/builder-state";

export type TableViewId = ViewType;

export type ViewConfig = {
  /**
   * High-level features present in a view.
   * This is intended to be the single source of truth for "what does this view support?"
   */
  features: {
    table?: boolean;
    contextMenu?: boolean;
  };

  /**
   * Declarative identifier for the table surface in this view.
   * MenuTableRenderer maps this to an actual component.
   */
  tableViewId: TableViewId;

  /**
   * References action IDs (from ACTION_BAR_CONFIG) without duplicating action definitions.
   * This lets other UI surfaces (tables, context menus, etc.) stay in sync with the action bar.
   */
  actionIds: {
    /**
     * Suggested actions for a row-level context menu.
     * (Not wired yet; intended for future table/context-menu implementations.)
     */
    rowContextMenu?: string[];

    /**
     * Suggested actions for bulk selection context.
     * (Not wired yet; intended for future table/context-menu implementations.)
     */
    bulkContextMenu?: string[];
  };
};

const DEFAULT_VIEW_CONFIG: ViewConfig = {
  features: { table: true, contextMenu: false },
  tableViewId: "menu",
  actionIds: {},
};

function defineViewConfigs(overrides: Partial<Record<ViewType, Partial<ViewConfig>>>) {
  const configs: Record<ViewType, ViewConfig> = {} as Record<ViewType, ViewConfig>;

  for (const view of ALL_VIEWS) {
    const override = overrides[view];
    configs[view] = {
      ...DEFAULT_VIEW_CONFIG,
      ...override,
      features: {
        ...DEFAULT_VIEW_CONFIG.features,
        ...(override?.features ?? {}),
      },
      tableViewId: override?.tableViewId ?? view,
      actionIds: {
        ...DEFAULT_VIEW_CONFIG.actionIds,
        ...(override?.actionIds ?? {}),
      },
    };
  }

  return configs;
}

export const VIEW_CONFIGS: Record<ViewType, ViewConfig> = defineViewConfigs({
  "all-labels": {
    features: { contextMenu: true },
    actionIds: {
      bulkContextMenu: ["visibility", "remove"],
    },
  },
  "all-categories": {
    // future intentions
    features: { contextMenu: true },
    actionIds: {
      // future intentions
      rowContextMenu: ["clone"],
      bulkContextMenu: ["clone", "visibility"],
    },
  },
});
