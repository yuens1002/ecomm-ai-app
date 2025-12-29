"use client";

import { useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import {
  MoreVertical,
  Copy,
  Trash2,
  RotateCcw,
  Save,
  Plus,
  ChevronRight,
  ChevronDown,
} from "lucide-react";
import { IconPicker } from "@/components/app-components/IconPicker";
import { DynamicIcon } from "@/components/app-components/DynamicIcon";

// Types
interface MockProduct {
  id: string;
  name: string;
}
interface MockCategory {
  id: string;
  name: string;
  icon?: string | null;
  products: MockProduct[];
}
interface MockLabel {
  id: string;
  name: string;
  icon?: string | null;
  categories: MockCategory[];
}

// Dummy products
const dummyProducts: MockProduct[] = [
  { id: "p1", name: "Ethiopian Yirgacheffe Natural" },
  { id: "p2", name: "Colombian Huila Supremo" },
  { id: "p3", name: "Kenyan AA" },
  { id: "p4", name: "Indonesian Sumatra" },
  { id: "p5", name: "Brazilian Santos" },
  { id: "p6", name: "Costa Rican Tarrazú" },
  { id: "p7", name: "Guatemalan Antigua" },
  { id: "p8", name: "Tanzanian Peaberry" },
  { id: "p9", name: "Rwandan Bourbon" },
  { id: "p10", name: "Vietnamese Robusta" },
];

const LONG_PRESS_MS = 420;

export default function MenuBuilderMockPage() {
  // Menu state
  const [menuName, setMenuName] = useState<string>("menu");
  const [menuIcon, setMenuIcon] = useState<string | null>(null);
  const [menuExpanded, setMenuExpanded] = useState<boolean>(false);

  // Section accordion state
  const [labelsSectionOpen, setLabelsSectionOpen] = useState<boolean>(false);
  const [categoriesSectionOpen, setCategoriesSectionOpen] =
    useState<boolean>(false);
  const [productsSectionOpen, setProductsSectionOpen] =
    useState<boolean>(false);

  // Data
  const [labels, setLabels] = useState<MockLabel[]>([]);
  const [expandedLabels, setExpandedLabels] = useState<Set<string>>(new Set());
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set()
  );
  const [unattachedLabels, setUnattachedLabels] = useState<MockLabel[]>([]);
  const [unattachedCategories, setUnattachedCategories] = useState<
    MockCategory[]
  >([]);

  // Selection
  const [selectionMode, setSelectionMode] = useState<boolean>(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Inline actions
  const [editTarget, setEditTarget] = useState<{
    id: string;
    type: "menu" | "label" | "category";
    field: "name" | "icon";
  } | null>(null);
  const [draftName, setDraftName] = useState<string>("");

  // Section add flows
  const [addingLabel, setAddingLabel] = useState<boolean>(false);
  const [newLabelName, setNewLabelName] = useState<string>("");
  const [newLabelIcon, setNewLabelIcon] = useState<string>("");

  const [addingCategory, setAddingCategory] = useState<boolean>(false);
  const [newCategoryName, setNewCategoryName] = useState<string>("");
  const [newCategoryIcon, setNewCategoryIcon] = useState<string>("");
  const [targetLabelForCategory, setTargetLabelForCategory] = useState<
    string | null
  >(null);

  const [autoOrderIds, setAutoOrderIds] = useState<Set<string>>(new Set());

  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const longPressTriggered = useRef<boolean>(false);

  // Counts
  const labelsCount = useMemo(
    () => unattachedLabels.length,
    [unattachedLabels.length]
  );
  const categoriesCount = useMemo(
    () => unattachedCategories.length,
    [unattachedCategories.length]
  );
  const productsCount = useMemo(() => dummyProducts.length, []);

  const allIds = useMemo(() => {
    const ids: string[] = [];
    labels.forEach((l) => {
      ids.push(l.id);
      l.categories.forEach((c) => {
        ids.push(c.id);
        c.products.forEach((p) => ids.push(p.id));
      });
    });
    return ids;
  }, [labels]);

  const bulkActionsEnabled =
    selectedIds.size > 1 ||
    (allIds.length > 0 && selectedIds.size === allIds.length);

  // Handlers
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      if (next.size === 0) setSelectionMode(false);
      return next;
    });
  };

  const selectAll = () => {
    setSelectionMode(true);
    setSelectedIds(new Set(allIds));
  };
  const deselectAll = () => {
    setSelectedIds(new Set());
    setSelectionMode(false);
  };

  const toggleLabelExpand = (id: string) => {
    setExpandedLabels((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleCategoryExpand = (id: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const clearLongPress = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const handlePressStart = (id: string) => {
    clearLongPress();
    longPressTriggered.current = false;
    longPressTimer.current = setTimeout(() => {
      longPressTriggered.current = true;
      setSelectionMode(true);
      setSelectedIds((prev) => new Set(prev).add(id));
    }, LONG_PRESS_MS);
  };

  const handlePressEnd = () => {
    clearLongPress();
  };

  const beginRename = (
    id: string,
    type: "menu" | "label" | "category",
    current: string
  ) => {
    setEditTarget({ id, type, field: "name" });
    setDraftName(current);
  };

  const saveRename = () => {
    if (!editTarget || !draftName.trim()) {
      setEditTarget(null);
      return;
    }
    if (editTarget.type === "menu") {
      setMenuName(draftName.trim());
    } else if (editTarget.type === "label") {
      setLabels((prev) =>
        prev.map((l) =>
          l.id === editTarget.id ? { ...l, name: draftName.trim() } : l
        )
      );
      setUnattachedLabels((prev) =>
        prev.map((l) =>
          l.id === editTarget.id ? { ...l, name: draftName.trim() } : l
        )
      );
    } else if (editTarget.type === "category") {
      setLabels((prev) =>
        prev.map((l) => ({
          ...l,
          categories: l.categories.map((c) =>
            c.id === editTarget.id ? { ...c, name: draftName.trim() } : c
          ),
        }))
      );
      setUnattachedCategories((prev) =>
        prev.map((c) =>
          c.id === editTarget.id ? { ...c, name: draftName.trim() } : c
        )
      );
    }
    setEditTarget(null);
  };

  const cancelRename = () => setEditTarget(null);

  const beginIconEdit = (id: string, type: "menu" | "label" | "category") => {
    setEditTarget({ id, type, field: "icon" });
  };

  const saveIcon = (icon: string | null) => {
    if (!editTarget) return;
    if (editTarget.type === "menu") setMenuIcon(icon);
    else if (editTarget.type === "label") {
      setLabels((prev) =>
        prev.map((l) => (l.id === editTarget.id ? { ...l, icon } : l))
      );
      setUnattachedLabels((prev) =>
        prev.map((l) => (l.id === editTarget.id ? { ...l, icon } : l))
      );
    } else if (editTarget.type === "category") {
      setLabels((prev) =>
        prev.map((l) => ({
          ...l,
          categories: l.categories.map((c) =>
            c.id === editTarget.id ? { ...c, icon } : c
          ),
        }))
      );
      setUnattachedCategories((prev) =>
        prev.map((c) => (c.id === editTarget.id ? { ...c, icon } : c))
      );
    }
    setEditTarget(null);
  };

  const addLabelInline = () => {
    const name = newLabelName.trim() || "New label";
    const id = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    const icon = newLabelIcon || null;
    const newLabel: MockLabel = { id, name, icon, categories: [] };
    setUnattachedLabels((prev) => [...prev, newLabel]);
    setNewLabelName("");
    setNewLabelIcon("");
    setAddingLabel(false);
  };

  const addCategoryInline = () => {
    const name = newCategoryName.trim() || "New category";
    const id = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    const icon = newCategoryIcon || null;
    const newCategory: MockCategory = { id, name, icon, products: [] };
    setUnattachedCategories((prev) => [...prev, newCategory]);
    setNewCategoryName("");
    setNewCategoryIcon("");
    setAddingCategory(false);
  };

  const attachLabelToMenu = (labelId: string) => {
    const label =
      unattachedLabels.find((l) => l.id === labelId) ||
      labels.find((l) => l.id === labelId);
    if (!label) return;
    if (unattachedLabels.find((l) => l.id === labelId)) {
      setUnattachedLabels((prev) => prev.filter((l) => l.id !== labelId));
    }
    setLabels((prev) => {
      if (prev.find((l) => l.id === labelId)) return prev;
      return [...prev, { ...label, categories: label.categories || [] }];
    });
    setExpandedLabels((prev) => new Set(prev).add(labelId));
  };

  const attachCategoryToLabel = (labelId: string, categoryId: string) => {
    const category =
      unattachedCategories.find((c) => c.id === categoryId) ||
      labels.flatMap((l) => l.categories).find((c) => c.id === categoryId);
    if (!category) return;
    if (unattachedCategories.find((c) => c.id === categoryId)) {
      setUnattachedCategories((prev) =>
        prev.filter((c) => c.id !== categoryId)
      );
    }
    setLabels((prev) =>
      prev.map((l) => {
        if (
          l.id === labelId &&
          !l.categories.find((c) => c.id === categoryId)
        ) {
          return {
            ...l,
            categories: [
              ...l.categories,
              { ...category, products: category.products || [] },
            ],
          };
        }
        return l;
      })
    );
    setExpandedLabels((prev) => new Set(prev).add(labelId));
    setExpandedCategories((prev) => new Set(prev).add(categoryId));
  };

  const detachCategoryFromLabel = (labelId: string, categoryId: string) => {
    setLabels((prev) =>
      prev.map((l) =>
        l.id === labelId
          ? {
              ...l,
              categories: l.categories.filter((c) => c.id !== categoryId),
            }
          : l
      )
    );
  };

  const attachProductToCategory = (categoryId: string, productId: string) => {
    const product = dummyProducts.find((p) => p.id === productId);
    if (!product) return;
    setLabels((prev) =>
      prev.map((l) => ({
        ...l,
        categories: l.categories.map((c) => {
          if (
            c.id === categoryId &&
            !c.products.find((p) => p.id === productId)
          ) {
            return { ...c, products: [...c.products, product] };
          }
          return c;
        }),
      }))
    );
  };

  const detachProductFromCategory = (categoryId: string, productId: string) => {
    setLabels((prev) =>
      prev.map((l) => ({
        ...l,
        categories: l.categories.map((c) =>
          c.id === categoryId
            ? { ...c, products: c.products.filter((p) => p.id !== productId) }
            : c
        ),
      }))
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="flex flex-col md:flex-row md:h-screen gap-2">
        {/* Left: tree */}
        <div className="md:flex-1 flex flex-col">
          <div className="px-4 py-3">
            <div className="text-lg font-medium text-foreground">
              Menu Builder
            </div>
            <div className="text-sm font-medium text-muted-foreground">
              Build a menu tree by attaching Labels, grouping Categories, and
              attaching Products.
            </div>
          </div>

          {/* Action bar */}
          <div className="flex items-center gap-3 px-4 py-2 border-b">
            <input
              aria-label="Select all"
              type="checkbox"
              checked={
                selectedIds.size > 0 && selectedIds.size === allIds.length
              }
              onChange={(e) => (e.target.checked ? selectAll() : deselectAll())}
              className="w-4 h-4 ml-1 mr-2 cursor-pointer accent-foreground"
            />
            <Button
              size="sm"
              variant="ghost"
              className="w-8 h-8 p-0"
              disabled={!bulkActionsEnabled}
            >
              <Copy className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="w-8 h-8 p-0"
              disabled={!bulkActionsEnabled}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
            <div className="flex-1" />
            <Button
              size="sm"
              variant="ghost"
              className="w-8 h-8 p-0"
              disabled={!bulkActionsEnabled}
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="w-8 h-8 p-0"
              disabled={!bulkActionsEnabled}
            >
              <Save className="w-4 h-4" />
            </Button>
          </div>

          {/* Tree - simple table */}
          <div className="md:flex-1 overflow-y-auto p-2">
            <table className="w-full border-collapse">
              <tbody>
                {/* Menu row */}
                <tr className="h-10 hover:bg-muted/40 cursor-pointer">
                  <td className="w-6"></td>
                  <td className="px-2">
                    <div className="flex items-center">
                      <button
                        type="button"
                        onClick={() => setMenuExpanded((v) => !v)}
                        className="w-4 h-4 mr-2 flex items-center justify-center text-muted-foreground hover:text-foreground"
                      >
                        {menuExpanded ? (
                          <ChevronDown className="w-4 h-4" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                      </button>
                      {menuIcon && (
                        <DynamicIcon
                          name={menuIcon as any}
                          size={16}
                          className="mr-2 text-muted-foreground shrink-0"
                        />
                      )}
                      <span className="truncate text-sm font-medium text-muted-foreground">
                        {menuName}
                      </span>
                    </div>
                  </td>
                  <td className="w-8 text-center">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="w-8 h-8 p-0"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuLabel>Menu</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => beginIconEdit("menu", "menu")}
                        >
                          Use / edit icon
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => beginRename("menu", "menu", menuName)}
                        >
                          Rename
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: stacked sections */}
        <div className="md:w-72 bg-muted/10 flex flex-col gap-0 p-2">
          {/* Labels section */}
          <table className="w-full border-collapse">
            <tbody>
              <tr className="h-10 hover:bg-muted/30">
                <td className="px-2">
                  <button
                    type="button"
                    onClick={() => setLabelsSectionOpen((v) => !v)}
                    className="flex items-center gap-2 text-sm font-medium text-muted-foreground"
                  >
                    {labelsSectionOpen ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                    <span>Labels</span>
                    <span>{labelsCount}</span>
                  </button>
                </td>
                <td className="w-8 text-center">
                  <Button size="sm" variant="ghost" className="w-8 h-8 p-0">
                    <Plus className="w-4 h-4" />
                  </Button>
                </td>
              </tr>
            </tbody>
          </table>

          {/* Categories section */}
          <table className="w-full border-collapse">
            <tbody>
              <tr className="h-10 hover:bg-muted/30">
                <td className="px-2">
                  <button
                    type="button"
                    onClick={() => setCategoriesSectionOpen((v) => !v)}
                    className="flex items-center gap-2 text-sm font-medium text-muted-foreground"
                  >
                    {categoriesSectionOpen ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                    <span>Categories</span>
                    <span>{categoriesCount}</span>
                  </button>
                </td>
                <td className="w-8 text-center">
                  <Button size="sm" variant="ghost" className="w-8 h-8 p-0">
                    <Plus className="w-4 h-4" />
                  </Button>
                </td>
              </tr>
            </tbody>
          </table>

          {/* Products section */}
          <table className="w-full border-collapse">
            <tbody>
              <tr className="h-10 hover:bg-muted/30">
                <td className="px-2" colSpan={2}>
                  <button
                    type="button"
                    onClick={() => setProductsSectionOpen((v) => !v)}
                    className="flex items-center gap-2 text-sm font-medium text-muted-foreground"
                  >
                    {productsSectionOpen ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                    <span>Products</span>
                    <span>{productsCount}</span>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
