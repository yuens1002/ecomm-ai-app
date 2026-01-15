"use client";

import { VIEW_CONFIGS, type TableViewId } from "@/app/admin/(product-menu)/constants/view-configs";
import { useMenuBuilder } from "@/app/admin/(product-menu)/menu-builder/MenuBuilderProvider";
import { AllCategoriesTableView } from "@/app/admin/(product-menu)/menu-builder/components/table-views/AllCategoriesTableView";
import { Table as ShadcnTable } from "@/components/ui/table";

import { AllLabelsTableView } from "@/app/admin/(product-menu)/menu-builder/components/table-views/AllLabelsTableView";
import { CategoryTableView } from "@/app/admin/(product-menu)/menu-builder/components/table-views/CategoryTableView";
import { LabelTableView } from "@/app/admin/(product-menu)/menu-builder/components/table-views/LabelTableView";
import { MenuTableView } from "@/app/admin/(product-menu)/menu-builder/components/table-views/MenuTableView";

const TABLE_VIEWS: Record<TableViewId, React.ComponentType> = {
  menu: MenuTableView,
  label: LabelTableView,
  category: CategoryTableView,
  "all-labels": AllLabelsTableView,
  "all-categories": AllCategoriesTableView,
};

/**
 * MenuBuilderTable
 *
 * Shell component that decides which table view to render based on the current view config.
 */
export function MenuBuilderTable() {
  const { builder } = useMenuBuilder();
  const config = VIEW_CONFIGS[builder.currentView];

  const View = TABLE_VIEWS[config.tableViewId];

  return (
    <ShadcnTable className="table-fixed min-w-[660px] w-full mt-4">
      <View />
    </ShadcnTable>
  );
}
