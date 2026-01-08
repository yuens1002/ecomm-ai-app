"use client";

import { VIEW_CONFIGS } from "../../../constants/view-configs";
import { useMenuBuilder } from "../../MenuBuilderProvider";
import { AllCategoriesTableView } from "./AllCategoriesTableView";
import { PlaceholderTableView } from "./PlaceholderTableView";

export function TableViewRenderer() {
  const { builder } = useMenuBuilder();
  const config = VIEW_CONFIGS[builder.currentView];

  if (config.tableViewId === "all-categories") {
    return <AllCategoriesTableView />;
  }

  return <PlaceholderTableView />;
}
