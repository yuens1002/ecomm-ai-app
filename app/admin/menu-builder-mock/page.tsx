"use client";

import { useState } from "react";
import {
  ChevronRight,
  ChevronDown,
  MoreVertical,
  Copy,
  Trash2,
  RotateCcw,
  Save,
  Plus,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Tree Row Component
function TreeRow({
  level,
  name,
  hasChevron = true,
  isExpanded = false,
  onToggle,
  showActionIcon = true,
}: {
  level: number;
  name: string;
  hasChevron?: boolean;
  isExpanded?: boolean;
  onToggle?: () => void;
  showActionIcon?: boolean;
}) {
  const indent = level * 8; // 8px per level - aligns text with chevron center above

  return (
    <tr className="h-10">
      <td className="pr-2">
        <div
          className="flex items-center gap-2"
          style={{ paddingLeft: `${indent}px` }}
        >
          {hasChevron ? (
            <button
              type="button"
              onClick={onToggle}
              className="w-4 h-4 flex items-center justify-center shrink-0"
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>
          ) : (
            <div className="w-4 h-4 shrink-0" />
          )}
          <span className="text-sm">{name}</span>
        </div>
      </td>
      <td className="w-8 text-center">
        {showActionIcon && (
          <button
            type="button"
            className="w-4 h-4 flex items-center justify-center mx-auto"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
        )}
      </td>
    </tr>
  );
}

// Section Header Component
function SectionHeader({
  title,
  count,
  isExpanded,
  onToggle,
  actionIcon,
}: {
  title: string;
  count?: number;
  isExpanded: boolean;
  onToggle: () => void;
  actionIcon?: React.ReactNode;
}) {
  return (
    <tr className="h-10">
      <td className="pr-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onToggle}
            className="w-4 h-4 flex items-center justify-center"
          >
            {isExpanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>
          <span className="text-sm">
            {title}
            {count !== undefined && ` - ${count}`}
          </span>
        </div>
      </td>
      <td className="w-8 text-center">
        {actionIcon && (
          <button
            type="button"
            className="w-4 h-4 flex items-center justify-center mx-auto"
          >
            {actionIcon}
          </button>
        )}
      </td>
    </tr>
  );
}

interface Label {
  id: string;
  name: string;
  categories: Category[];
}

interface Category {
  id: string;
  name: string;
  products: Product[];
}

interface Product {
  id: string;
  name: string;
}

export default function MenuBuilderMockPage() {
  const [menuExpanded, setMenuExpanded] = useState(true);
  const [labelsExpanded, setLabelsExpanded] = useState(false);
  const [categoriesExpanded, setCategoriesExpanded] = useState(false);
  const [productsExpanded, setProductsExpanded] = useState(false);

  // Data
  const [labels, setLabels] = useState<Label[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [menuLabel, setMenuLabel] = useState<Label | null>(null);

  let labelCounter = 1;
  let categoryCounter = 1;
  let productCounter = 1;

  const handleAddLabel = () => {
    const newLabel: Label = {
      id: `label-${Date.now()}`,
      name: `sample label ${labelCounter++}`,
      categories: [],
    };
    setLabels([...labels, newLabel]);
    setLabelsExpanded(true);
  };

  const handleAddCategory = () => {
    const newCategory: Category = {
      id: `category-${Date.now()}`,
      name: `sample category ${categoryCounter++}`,
      products: [],
    };
    setCategories([...categories, newCategory]);
    setCategoriesExpanded(true);
  };

  const handleAttachLabelToMenu = (labelId: string) => {
    const label = labels.find((l) => l.id === labelId);
    if (label) {
      setMenuLabel({ ...label });
      setLabels(labels.filter((l) => l.id !== labelId));
    }
  };

  const handleAttachCategoryToLabel = (categoryId: string) => {
    if (!menuLabel) return;
    const category = categories.find((c) => c.id === categoryId);
    if (category) {
      setMenuLabel({
        ...menuLabel,
        categories: [...menuLabel.categories, { ...category }],
      });
      setCategories(categories.filter((c) => c.id !== categoryId));
    }
  };

  const handleAttachProductToCategory = (categoryId: string) => {
    if (!menuLabel) return;
    const newProduct: Product = {
      id: `product-${Date.now()}`,
      name: `sample product ${productCounter++}`,
    };
    setMenuLabel({
      ...menuLabel,
      categories: menuLabel.categories.map((c) =>
        c.id === categoryId
          ? { ...c, products: [...c.products, newProduct] }
          : c
      ),
    });
  };

  const toggleLabelCategories = () => {
    // Toggle expand state for label (currently always expanded)
  };

  const toggleCategory = (categoryId: string) => {
    // Toggle expand state for category (currently always expanded)
  };

  return (
    <div className="min-h-screen bg-background p-6">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold mb-2">Menu Builder</h1>
        <p className="text-sm text-muted-foreground">
          Build a menu tree by attaching Labels, grouping Categories, and
          attaching Products.
        </p>
      </div>

      {/* Action Bar */}
      <div className="mb-4 pb-4 border-b flex items-center gap-3">
        <input type="checkbox" className="w-4 h-4" aria-label="Select all" />
        <button
          type="button"
          className="w-8 h-8 flex items-center justify-center"
        >
          <Copy className="w-4 h-4" />
        </button>
        <button
          type="button"
          className="w-8 h-8 flex items-center justify-center"
        >
          <Trash2 className="w-4 h-4" />
        </button>
        <div className="flex-1" />
        <button
          type="button"
          className="w-8 h-8 flex items-center justify-center"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
        <button
          type="button"
          className="w-8 h-8 flex items-center justify-center"
        >
          <Save className="w-4 h-4" />
        </button>
      </div>

      {/* Main Table */}
      <table className="w-full">
        <tbody>
          {/* Menu Section */}
          <tr className="h-10">
            <td className="pr-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setMenuExpanded(!menuExpanded)}
                  className="w-4 h-4 flex items-center justify-center"
                >
                  {menuExpanded ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </button>
                <span className="text-sm">Menu</span>
              </div>
            </td>
            <td className="w-8 text-center">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="w-4 h-4 flex items-center justify-center mx-auto"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Attach Label</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {labels.length === 0 ? (
                    <DropdownMenuItem disabled>
                      No labels available
                    </DropdownMenuItem>
                  ) : (
                    labels.map((label) => (
                      <DropdownMenuItem
                        key={label.id}
                        onClick={() => handleAttachLabelToMenu(label.id)}
                      >
                        {label.name}
                      </DropdownMenuItem>
                    ))
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </td>
          </tr>
          {menuExpanded && !menuLabel && (
            <tr className="h-10">
              <td colSpan={2} className="pr-2">
                <div
                  className="flex items-center gap-2"
                  style={{ paddingLeft: "8px" }}
                >
                  <div className="w-4 h-4 shrink-0" />
                  <span className="text-sm italic text-muted-foreground">
                    start by creating a new label and attach it
                  </span>
                </div>
              </td>
            </tr>
          )}
          {menuExpanded && menuLabel && (
            <>
              {/* Attached Label */}
              <tr className="h-10">
                <td className="pr-2">
                  <div
                    className="flex items-center gap-2"
                    style={{ paddingLeft: "8px" }}
                  >
                    {menuLabel.categories.length > 0 ? (
                      <button
                        type="button"
                        onClick={toggleLabelCategories}
                        className="w-4 h-4 flex items-center justify-center shrink-0"
                      >
                        <ChevronDown className="w-4 h-4" />
                      </button>
                    ) : (
                      <div className="w-4 h-4 shrink-0" />
                    )}
                    <span className="text-sm">{menuLabel.name}</span>
                  </div>
                </td>
                <td className="w-8 text-center">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        className="w-4 h-4 flex items-center justify-center mx-auto"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Attach Category</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {categories.length === 0 ? (
                        <DropdownMenuItem disabled>
                          No categories available
                        </DropdownMenuItem>
                      ) : (
                        categories.map((category) => (
                          <DropdownMenuItem
                            key={category.id}
                            onClick={() =>
                              handleAttachCategoryToLabel(category.id)
                            }
                          >
                            {category.name}
                          </DropdownMenuItem>
                        ))
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>

              {/* Attached Categories */}
              {menuLabel.categories.map((category) => (
                <>
                  <tr key={category.id} className="h-10">
                    <td className="pr-2">
                      <div
                        className="flex items-center gap-2"
                        style={{ paddingLeft: "16px" }}
                      >
                        {category.products.length > 0 ? (
                          <button
                            type="button"
                            onClick={() => toggleCategory(category.id)}
                            className="w-4 h-4 flex items-center justify-center shrink-0"
                          >
                            <ChevronDown className="w-4 h-4" />
                          </button>
                        ) : (
                          <div className="w-4 h-4 shrink-0" />
                        )}
                        <span className="text-sm">{category.name}</span>
                      </div>
                    </td>
                    <td className="w-8 text-center">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            type="button"
                            className="w-4 h-4 flex items-center justify-center mx-auto"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() =>
                              handleAttachProductToCategory(category.id)
                            }
                          >
                            Attach Product
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>

                  {/* Attached Products */}
                  {category.products.map((product) => (
                    <tr key={product.id} className="h-10">
                      <td className="pr-2">
                        <div
                          className="flex items-center gap-2"
                          style={{ paddingLeft: "24px" }}
                        >
                          <div className="w-4 h-4 shrink-0" />
                          <span className="text-sm">{product.name}</span>
                        </div>
                      </td>
                      <td className="w-8 text-center">
                        {/* No action icon for products */}
                      </td>
                    </tr>
                  ))}
                </>
              ))}
            </>
          )}

          {/* Labels Section */}
          <tr className="h-10">
            <td className="pr-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setLabelsExpanded(!labelsExpanded)}
                  className="w-4 h-4 flex items-center justify-center"
                >
                  {labelsExpanded ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </button>
                <span className="text-sm">Labels - {labels.length}</span>
              </div>
            </td>
            <td className="w-8 text-center">
              <button
                type="button"
                onClick={handleAddLabel}
                className="w-4 h-4 flex items-center justify-center mx-auto"
              >
                <Plus className="w-4 h-4" />
              </button>
            </td>
          </tr>
          {labelsExpanded &&
            labels.map((label) => (
              <tr key={label.id} className="h-10">
                <td className="pr-2">
                  <div
                    className="flex items-center gap-2"
                    style={{ paddingLeft: "8px" }}
                  >
                    <div className="w-4 h-4 shrink-0" />
                    <span className="text-sm">{label.name}</span>
                  </div>
                </td>
                <td className="w-8 text-center">
                  <button
                    type="button"
                    className="w-4 h-4 flex items-center justify-center mx-auto"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}

          {/* Categories Section */}
          <tr className="h-10">
            <td className="pr-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCategoriesExpanded(!categoriesExpanded)}
                  className="w-4 h-4 flex items-center justify-center"
                >
                  {categoriesExpanded ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </button>
                <span className="text-sm">
                  Categories - {categories.length}
                </span>
              </div>
            </td>
            <td className="w-8 text-center">
              <button
                type="button"
                onClick={handleAddCategory}
                className="w-4 h-4 flex items-center justify-center mx-auto"
              >
                <Plus className="w-4 h-4" />
              </button>
            </td>
          </tr>
          {categoriesExpanded &&
            categories.map((category) => (
              <tr key={category.id} className="h-10">
                <td className="pr-2">
                  <div
                    className="flex items-center gap-2"
                    style={{ paddingLeft: "8px" }}
                  >
                    <div className="w-4 h-4 shrink-0" />
                    <span className="text-sm">{category.name}</span>
                  </div>
                </td>
                <td className="w-8 text-center">
                  <button
                    type="button"
                    className="w-4 h-4 flex items-center justify-center mx-auto"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}

          {/* Products Section */}
          <tr className="h-10">
            <td className="pr-2" colSpan={2}>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setProductsExpanded(!productsExpanded)}
                  className="w-4 h-4 flex items-center justify-center"
                >
                  {productsExpanded ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </button>
                <span className="text-sm">Products - 0</span>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
