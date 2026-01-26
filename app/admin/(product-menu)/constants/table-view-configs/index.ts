/**
 * Table View Configurations
 *
 * Re-exports all view configurations for the Menu Builder table views.
 */

// All Categories
export { allCategoriesConfig, ALL_CATEGORIES_HEADER_COLUMNS } from "./all-categories.config";
export type { AllCategoriesExtra } from "./all-categories.config";

// All Labels
export { allLabelsConfig, ALL_LABELS_HEADER_COLUMNS } from "./all-labels.config";
export type { AllLabelsExtra } from "./all-labels.config";

// Label View (categories in a label)
export { labelViewConfig, LABEL_VIEW_HEADER_COLUMNS } from "./label-view.config";
export type { LabelViewExtra, LabelCategory } from "./label-view.config";

// Category View (products in a category)
export { categoryViewConfig, CATEGORY_VIEW_HEADER_COLUMNS } from "./category-view.config";
export type { CategoryViewExtra, CategoryProduct } from "./category-view.config";

// Menu View (hierarchical: labels → categories)
export { menuLabelConfig, menuCategoryConfig, MENU_VIEW_HEADER_COLUMNS } from "./menu-view.config";
export type { MenuViewExtra } from "./menu-view.config";
