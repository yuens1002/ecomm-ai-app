"use client";

import { VIEW_CONFIGS, type TableViewId } from "@/app/admin/(product-menu)/constants/view-configs";
import { useMenuBuilder } from "@/app/admin/(product-menu)/menu-builder/MenuBuilderProvider";
import { AllCategoriesTableView } from "./AllCategoriesTableView";
import { AllLabelsTableView } from "./AllLabelsTableView";
import { CategoryTableView } from "./CategoryTableView";
import { LabelTableView } from "./LabelTableView";
import { MenuTableView } from "./MenuTableView";

const TABLE_VIEWS: Record<TableViewId, React.ComponentType> = {
  menu: MenuTableView,
  label: LabelTableView,
  category: CategoryTableView,
  "all-labels": AllLabelsTableView,
  "all-categories": AllCategoriesTableView,
};

/**
 * MenuTableRenderer
 *
 * View selector that renders the appropriate table view based on current view config.
 * Each view handles its own TableViewWrapper (or EmptyState when no data).
 */
export function MenuTableRenderer() {
  const { builder } = useMenuBuilder();
  const config = VIEW_CONFIGS[builder.currentView];

  const View = TABLE_VIEWS[config.tableViewId];

  return <View />;
}
