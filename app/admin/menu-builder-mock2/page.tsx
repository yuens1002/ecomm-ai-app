"use client";

import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import {
  ShoppingBag,
  Tags,
  Tag,
  FileSpreadsheet,
  ChevronDown,
  ChevronRight,
  ListChevronsUpDown,
  ListChevronsDownUp,
  Plus,
  Copy,
  Trash2,
  RotateCcw,
  Save,
  Pencil,
  Eye,
} from "lucide-react";

type View = "menu" | "label" | "category" | "all-labels" | "all-categories";

export default function ProductMenuMock2Page() {
  const [currentView, setCurrentView] = useState<View>("menu");
  const [showCheckboxes, setShowCheckboxes] = useState(false);
  const [hasLabel, setHasLabel] = useState(false);
  const [hasCategory, setHasCategory] = useState(false);
  const [hasProduct, setHasProduct] = useState(false);
  const [labelExpanded, setLabelExpanded] = useState(false);
  const [categoryExpanded, setCategoryExpanded] = useState(false);
  const [showLabelsDropdown, setShowLabelsDropdown] = useState(false);
  const [showCategoriesDropdown, setShowCategoriesDropdown] = useState(false);

  const handleAddClick = () => {
    if (currentView === "menu" && !hasLabel) {
      setHasLabel(true);
    } else if (currentView === "label" && !hasCategory) {
      setHasCategory(true);
    } else if (currentView === "category" && !hasProduct) {
      setHasProduct(true);
    }
  };
  return (
    <div className="min-h-screen bg-background">
      {/* Page Header */}
      <div className="mb-2">
        <h1 className="text-2xl font-semibold mb-2">Menu Builder</h1>
        <p className="text-sm text-muted-foreground">
          Build a menu tree by attaching Labels, grouping Categories, and
          attaching Products.
        </p>
      </div>

      {/* Breadcrumb Navigation */}
      <div className="mb-2 pb-2 flex items-center gap-2 text-sm">
        {currentView === "menu" && (
          <>
            <ShoppingBag className="w-4 h-4" strokeWidth={2.5} />
            <span className="text-border">|</span>
            <Tags className="w-4 h-4" />
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowLabelsDropdown(!showLabelsDropdown)}
                className="hover:opacity-70"
                title="Labels menu"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
              {showLabelsDropdown && (
                <div className="absolute top-full left-0 mt-1 bg-background border rounded-md shadow-lg z-10 min-w-[150px]">
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentView("all-labels");
                      setShowLabelsDropdown(false);
                    }}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-muted"
                  >
                    All labels
                  </button>
                  {hasLabel && (
                    <button
                      type="button"
                      onClick={() => {
                        setCurrentView("label");
                        setShowLabelsDropdown(false);
                      }}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-muted"
                    >
                      label1...
                    </button>
                  )}
                </div>
              )}
            </div>
            <span className="text-border">|</span>
            <FileSpreadsheet className="w-4 h-4" />
            <div className="relative">
              <button
                type="button"
                onClick={() =>
                  setShowCategoriesDropdown(!showCategoriesDropdown)
                }
                className="hover:opacity-70"
                title="Categories menu"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
              {showCategoriesDropdown && (
                <div className="absolute top-full left-0 mt-1 bg-background border rounded-md shadow-lg z-10 min-w-[150px]">
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentView("all-categories");
                      setShowCategoriesDropdown(false);
                    }}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-muted"
                  >
                    All categories
                  </button>
                  {hasCategory && (
                    <button
                      type="button"
                      onClick={() => {
                        setCurrentView("category");
                        setShowCategoriesDropdown(false);
                      }}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-muted"
                    >
                      category1...
                    </button>
                  )}
                </div>
              )}
            </div>
          </>
        )}

        {currentView === "label" && (
          <>
            <button
              type="button"
              onClick={() => setCurrentView("menu")}
              className="hover:opacity-70"
            >
              <ShoppingBag className="w-4 h-4" />
            </button>
            <span className="text-border">|</span>
            <Tag className="w-4 h-4" />
            <span className="font-bold">sample label 1</span>
            <ChevronDown className="w-4 h-4" />
            <span className="text-border">/</span>
            <FileSpreadsheet className="w-4 h-4" />
            <ChevronDown className="w-4 h-4" />
          </>
        )}

        {currentView === "category" && (
          <>
            <button
              type="button"
              onClick={() => setCurrentView("menu")}
              className="hover:opacity-70"
            >
              <ShoppingBag className="w-4 h-4" />
            </button>
            <span className="text-border">|</span>
            <button
              type="button"
              onClick={() => setCurrentView("label")}
              className="hover:opacity-70"
            >
              <Tag className="w-4 h-4" />
            </button>
            <ChevronDown className="w-4 h-4" />
            <span className="text-border">/</span>
            <FileSpreadsheet className="w-4 h-4" />
            <span className="font-bold">sample category 1</span>
            <ChevronDown className="w-4 h-4" />
          </>
        )}

        {currentView === "all-labels" && (
          <>
            <button
              type="button"
              onClick={() => setCurrentView("menu")}
              className="hover:opacity-70"
            >
              <ShoppingBag className="w-4 h-4" />
            </button>
            <span className="text-border">|</span>
            <Tags className="w-4 h-4" strokeWidth={2.5} />
            <span className="font-bold">All labels</span>
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowLabelsDropdown(!showLabelsDropdown)}
                className="hover:opacity-70"
                title="Labels menu"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
              {showLabelsDropdown && (
                <div className="absolute top-full left-0 mt-1 bg-background border rounded-md shadow-lg z-10 min-w-[150px]">
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentView("all-labels");
                      setShowLabelsDropdown(false);
                    }}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-muted"
                  >
                    All labels
                  </button>
                  {hasLabel && (
                    <button
                      type="button"
                      onClick={() => {
                        setCurrentView("label");
                        setShowLabelsDropdown(false);
                      }}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-muted"
                    >
                      label1...
                    </button>
                  )}
                </div>
              )}
            </div>
            <span className="text-border">|</span>
            <FileSpreadsheet className="w-4 h-4" />
            <div className="relative">
              <button
                type="button"
                onClick={() =>
                  setShowCategoriesDropdown(!showCategoriesDropdown)
                }
                className="hover:opacity-70"
                title="Categories menu"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
              {showCategoriesDropdown && (
                <div className="absolute top-full left-0 mt-1 bg-background border rounded-md shadow-lg z-10 min-w-[150px]">
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentView("all-categories");
                      setShowCategoriesDropdown(false);
                    }}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-muted"
                  >
                    All categories
                  </button>
                  {hasCategory && (
                    <button
                      type="button"
                      onClick={() => {
                        setCurrentView("category");
                        setShowCategoriesDropdown(false);
                      }}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-muted"
                    >
                      category1...
                    </button>
                  )}
                </div>
              )}
            </div>
          </>
        )}

        {currentView === "all-categories" && (
          <>
            <button
              type="button"
              onClick={() => setCurrentView("menu")}
              className="hover:opacity-70"
            >
              <ShoppingBag className="w-4 h-4" />
            </button>
            <span className="text-border">|</span>
            <Tags className="w-4 h-4" />
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowLabelsDropdown(!showLabelsDropdown)}
                className="hover:opacity-70"
                title="Labels menu"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
              {showLabelsDropdown && (
                <div className="absolute top-full left-0 mt-1 bg-background border rounded-md shadow-lg z-10 min-w-[150px]">
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentView("all-labels");
                      setShowLabelsDropdown(false);
                    }}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-muted"
                  >
                    All labels
                  </button>
                  {hasLabel && (
                    <button
                      type="button"
                      onClick={() => {
                        setCurrentView("label");
                        setShowLabelsDropdown(false);
                      }}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-muted"
                    >
                      label1...
                    </button>
                  )}
                </div>
              )}
            </div>
            <span className="text-border">|</span>
            <FileSpreadsheet className="w-4 h-4" strokeWidth={2.5} />
            <span className="font-bold">All categories</span>
            <div className="relative">
              <button
                type="button"
                onClick={() =>
                  setShowCategoriesDropdown(!showCategoriesDropdown)
                }
                className="hover:opacity-70"
                title="Categories menu"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
              {showCategoriesDropdown && (
                <div className="absolute top-full left-0 mt-1 bg-background border rounded-md shadow-lg z-10 min-w-[150px]">
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentView("all-categories");
                      setShowCategoriesDropdown(false);
                    }}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-muted"
                  >
                    All categories
                  </button>
                  {hasCategory && (
                    <button
                      type="button"
                      onClick={() => {
                        setCurrentView("category");
                        setShowCategoriesDropdown(false);
                      }}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-muted"
                    >
                      category1...
                    </button>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Action Bar */}
      <div className="mb-2 flex items-center gap-3">
        <button
          type="button"
          onClick={handleAddClick}
          className="w-8 h-8 flex items-center justify-center hover:bg-muted rounded"
          title={
            currentView === "menu"
              ? "Add label"
              : currentView === "label"
                ? "Add category"
                : "Add product"
          }
        >
          <Plus className="w-4 h-4" />
        </button>
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
          <ListChevronsUpDown className="w-4 h-4" />
        </button>
        <button
          type="button"
          className="w-8 h-8 flex items-center justify-center"
        >
          <ListChevronsDownUp className="w-4 h-4" />
        </button>
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
          {/* Menu View */}
          {currentView === "menu" && (
            <>
              {/* Header Row */}
              <tr className="h-10 bg-muted/40 border-b">
                <td className="w-6 p-2">
                  <div className="flex items-center justify-center h-full">
                    <input
                      type="checkbox"
                      className="w-4 h-4 accent-foreground"
                      checked={showCheckboxes}
                      onChange={(e) => setShowCheckboxes(e.target.checked)}
                      aria-label="Select all"
                    />
                  </div>
                </td>
                <td className="text-sm font-medium pl-2 pr-4 truncate max-w-0">
                  Labels
                </td>
                <td className="text-sm font-medium px-4 truncate max-w-0 text-center">
                  Visibility
                </td>
                <td className="text-sm font-medium px-4 truncate max-w-0 text-center">
                  Categories
                </td>
                <td className="text-sm font-medium px-4 truncate max-w-0 text-center">
                  Products
                </td>
              </tr>

              {/* Data Row */}
              {hasLabel ? (
                <>
                  <tr
                    className="h-10 hover:bg-muted/40 cursor-pointer"
                    onClick={() => setCurrentView("label")}
                  >
                    <td className="w-6 p-2">
                      <div className="flex items-center justify-center h-full">
                        {showCheckboxes && (
                          <input
                            type="checkbox"
                            className="w-4 h-4 accent-foreground"
                            onClick={(e) => e.stopPropagation()}
                          />
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-2 text-sm pl-2 pr-4">
                        {hasCategory ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setLabelExpanded(!labelExpanded);
                            }}
                            className="w-4 h-4 flex items-center justify-center shrink-0"
                          >
                            {labelExpanded ? (
                              <ChevronDown className="w-4 h-4" />
                            ) : (
                              <ChevronRight className="w-4 h-4" />
                            )}
                          </button>
                        ) : (
                          <div className="w-4 h-4 shrink-0" />
                        )}
                        <Tags className="w-4 h-4 text-muted-foreground" />
                        <span className="italic text-muted-foreground">
                          label1...
                        </span>
                        <Pencil className="w-3 h-3 text-muted-foreground ml-1" />
                      </div>
                    </td>
                    <td
                      className="text-sm px-4"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex justify-center">
                        <Switch defaultChecked />
                      </div>
                    </td>
                    <td className="text-sm px-4 text-center">
                      {hasCategory ? 1 : 0}
                    </td>
                    <td className="text-sm px-4 text-center">
                      {hasProduct ? 1 : 0}
                    </td>
                  </tr>

                  {/* Category child row - indented */}
                  {labelExpanded && hasCategory && (
                    <tr
                      className="h-10 hover:bg-muted/40 cursor-pointer"
                      onClick={() => setCurrentView("category")}
                    >
                      <td className="w-6 p-2">
                        <div className="flex items-center justify-center h-full">
                          {showCheckboxes && (
                            <input
                              type="checkbox"
                              className="w-4 h-4 accent-foreground"
                              onClick={(e) => e.stopPropagation()}
                            />
                          )}
                        </div>
                      </td>
                      <td>
                        <div
                          className="flex items-center gap-2 text-sm pr-4"
                          style={{ paddingLeft: "24px" }}
                        >
                          {hasProduct ? (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setCategoryExpanded(!categoryExpanded);
                              }}
                              className="w-4 h-4 flex items-center justify-center shrink-0"
                            >
                              {categoryExpanded ? (
                                <ChevronDown className="w-4 h-4" />
                              ) : (
                                <ChevronRight className="w-4 h-4" />
                              )}
                            </button>
                          ) : (
                            <div className="w-4 h-4 shrink-0" />
                          )}
                          <FileSpreadsheet className="w-4 h-4 text-muted-foreground" />
                          <span className="italic text-muted-foreground">
                            category1...
                          </span>
                          <Pencil className="w-3 h-3 text-muted-foreground ml-1" />
                        </div>
                      </td>
                      <td
                        className="text-sm px-4"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex justify-center">
                          <Eye className="w-4 h-4 text-muted-foreground" />
                        </div>
                      </td>
                      <td className="text-sm px-4 text-center"></td>
                      <td className="text-sm px-4 text-center">
                        {hasProduct ? 1 : 0}
                      </td>
                    </tr>
                  )}

                  {/* Product child row - doubly indented */}
                  {labelExpanded && categoryExpanded && hasProduct && (
                    <tr className="h-10 hover:bg-muted/40">
                      <td className="w-6 p-2">
                        <div className="flex items-center justify-center h-full">
                          {showCheckboxes && (
                            <input
                              type="checkbox"
                              className="w-4 h-4 accent-foreground"
                            />
                          )}
                        </div>
                      </td>
                      <td>
                        <div
                          className="flex items-center gap-2 text-sm pr-4"
                          style={{ paddingLeft: "48px" }}
                        >
                          <div className="w-4 h-4 shrink-0" />
                          <span className="text-sm">sample product 1</span>
                        </div>
                      </td>
                      <td className="text-sm px-4">
                        <div className="flex justify-center">
                          <Eye className="w-4 h-4 text-muted-foreground" />
                        </div>
                      </td>
                      <td className="text-sm px-4 text-center"></td>
                      <td className="text-sm px-4 text-center"></td>
                    </tr>
                  )}
                </>
              ) : (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-8 text-center text-muted-foreground"
                  >
                    No labels yet. Click + to add a label.
                  </td>
                </tr>
              )}
            </>
          )}

          {/* Label View */}
          {currentView === "label" && (
            <>
              {/* Header Row */}
              <tr className="h-10 bg-muted/40 border-b">
                <td className="w-6 p-2">
                  <div className="flex items-center justify-center h-full">
                    <input
                      type="checkbox"
                      className="w-4 h-4 accent-foreground"
                      checked={showCheckboxes}
                      onChange={(e) => setShowCheckboxes(e.target.checked)}
                      aria-label="Select all"
                    />
                  </div>
                </td>
                <td className="text-sm font-medium pl-2 pr-4 truncate max-w-0">
                  Categories
                </td>
                <td className="text-sm font-medium px-4 truncate max-w-0 text-center">
                  Visibility
                </td>
                <td className="text-sm font-medium px-4 truncate max-w-0 text-center">
                  Products
                </td>
              </tr>

              {/* Data Row */}
              {hasCategory ? (
                <>
                  <tr
                    className="h-10 hover:bg-muted/40 cursor-pointer"
                    onClick={() => setCurrentView("category")}
                  >
                    <td className="w-6 p-2">
                      <div className="flex items-center justify-center h-full">
                        <input
                          type="checkbox"
                          className="w-4 h-4 accent-foreground"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-2 text-sm pl-2 pr-4">
                        {hasProduct ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setCategoryExpanded(!categoryExpanded);
                            }}
                            className="w-4 h-4 flex items-center justify-center shrink-0"
                          >
                            {categoryExpanded ? (
                              <ChevronDown className="w-4 h-4" />
                            ) : (
                              <ChevronRight className="w-4 h-4" />
                            )}
                          </button>
                        ) : (
                          <div className="w-4 h-4 shrink-0" />
                        )}
                        <FileSpreadsheet className="w-4 h-4 text-muted-foreground" />
                        <span className="italic text-muted-foreground">
                          category1...
                        </span>
                        <Pencil className="w-3 h-3 text-muted-foreground ml-1" />
                      </div>
                    </td>
                    <td
                      className="text-sm px-4"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex justify-center">
                        <Eye className="w-4 h-4 text-muted-foreground" />
                      </div>
                    </td>
                    <td className="text-sm px-4 text-center">
                      {hasProduct ? 1 : 0}
                    </td>
                  </tr>

                  {/* Product child row - indented */}
                  {categoryExpanded && hasProduct && (
                    <tr className="h-10 hover:bg-muted/40">
                      <td className="w-6 p-2">
                        <div className="flex items-center justify-center h-full">
                          {showCheckboxes && (
                            <input
                              type="checkbox"
                              className="w-4 h-4 accent-foreground"
                            />
                          )}
                        </div>
                      </td>
                      <td>
                        <div
                          className="flex items-center gap-2 text-sm pr-4"
                          style={{ paddingLeft: "24px" }}
                        >
                          <div className="w-4 h-4 shrink-0" />
                          <span className="text-sm">sample product 1</span>
                        </div>
                      </td>
                      <td className="text-sm px-4">
                        <div className="flex justify-center">
                          <Eye className="w-4 h-4 text-muted-foreground" />
                        </div>
                      </td>
                      <td className="text-sm px-4 text-center"></td>
                    </tr>
                  )}
                </>
              ) : (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-8 text-center text-muted-foreground"
                  >
                    No categories yet. Click + to add a category.
                  </td>
                </tr>
              )}
            </>
          )}

          {/* Category View */}
          {currentView === "category" && (
            <>
              {/* Header Row */}
              <tr className="h-10 bg-muted/40 border-b">
                <td className="w-6 p-2">
                  <div className="flex items-center justify-center h-full">
                    <input
                      type="checkbox"
                      className="w-4 h-4 accent-foreground"
                      checked={showCheckboxes}
                      onChange={(e) => setShowCheckboxes(e.target.checked)}
                      aria-label="Select all"
                    />
                  </div>
                </td>
                <td className="text-sm font-medium pl-2 pr-4 truncate max-w-0">
                  Products
                </td>
                <td className="text-sm font-medium px-4 truncate max-w-0 text-center">
                  Visibility
                </td>
                <td className="text-sm font-medium px-4 truncate max-w-0 text-center">
                  Added in categories
                </td>
              </tr>

              {/* Data Row */}
              {hasProduct ? (
                <tr className="h-10 hover:bg-muted/40">
                  <td className="w-6 p-2">
                    <div className="flex items-center justify-center h-full">
                      <input
                        type="checkbox"
                        className="w-4 h-4 accent-foreground"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  </td>
                  <td className="text-sm pl-2 pr-4">sample product 1</td>
                  <td className="text-sm px-4">
                    <div className="flex justify-center">
                      <Eye className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </td>
                  <td className="text-sm px-4 text-center">
                    sample category 1
                  </td>
                </tr>
              ) : (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-8 text-center text-muted-foreground"
                  >
                    No products yet. Click + to add a product.
                  </td>
                </tr>
              )}
            </>
          )}

          {/* All Labels View */}
          {currentView === "all-labels" && (
            <>
              {/* Header Row */}
              <tr className="h-10 bg-muted/40 border-b">
                <td className="w-6 p-2">
                  <div className="flex items-center justify-center h-full">
                    <input
                      type="checkbox"
                      className="w-4 h-4 accent-foreground"
                      checked={showCheckboxes}
                      onChange={(e) => setShowCheckboxes(e.target.checked)}
                      aria-label="Select all"
                    />
                  </div>
                </td>
                <td className="text-sm font-medium pl-2 pr-4 truncate max-w-0">
                  Icon
                </td>{" "}
                <td className="text-sm font-medium px-4 truncate max-w-0">
                  Name
                </td>{" "}
                <td className="text-sm font-medium px-4 truncate max-w-0 text-center">
                  Categories
                </td>
                <td className="text-sm font-medium px-4 truncate max-w-0 text-center">
                  Visibility
                </td>
              </tr>

              {/* Data Row */}
              {hasLabel ? (
                <tr className="h-10 hover:bg-muted/40">
                  <td className="w-6 p-2">
                    <div className="flex items-center justify-center h-full">
                      {showCheckboxes && (
                        <input
                          type="checkbox"
                          className="w-4 h-4 accent-foreground"
                        />
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="flex items-center gap-2 text-sm pl-2 pr-4">
                      <Tags className="w-4 h-4 text-muted-foreground" />{" "}
                    </div>
                  </td>
                  <td>
                    <div className="flex items-center gap-2 text-sm px-4">
                      {" "}
                      <span className="italic text-muted-foreground">
                        label1...
                      </span>
                      <Pencil className="w-3 h-3 text-muted-foreground ml-1" />
                    </div>
                  </td>
                  <td className="text-sm px-4 text-center">
                    {hasCategory ? 1 : 0}
                  </td>
                  <td className="text-sm px-4">
                    <div className="flex justify-center">
                      <Switch defaultChecked />
                    </div>
                  </td>
                </tr>
              ) : (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-8 text-center text-muted-foreground"
                  >
                    No labels yet.
                  </td>
                </tr>
              )}
            </>
          )}

          {/* All Categories View */}
          {currentView === "all-categories" && (
            <>
              {/* Header Row */}
              <tr className="h-10 bg-muted/40 border-b">
                <td className="w-6 p-2">
                  <div className="flex items-center justify-center h-full">
                    <input
                      type="checkbox"
                      className="w-4 h-4 accent-foreground"
                      checked={showCheckboxes}
                      onChange={(e) => setShowCheckboxes(e.target.checked)}
                      aria-label="Select all"
                    />
                  </div>
                </td>
                <td className="text-sm font-medium pl-2 pr-4 truncate max-w-0">
                  Name
                </td>
                <td className="text-sm font-medium px-4 truncate max-w-0 text-center">
                  Labels
                </td>
                <td className="text-sm font-medium px-4 truncate max-w-0 text-center">
                  Visibility
                </td>
              </tr>

              {/* Data Row */}
              {hasCategory ? (
                <tr className="h-10 hover:bg-muted/40">
                  <td className="w-6 p-2">
                    <div className="flex items-center justify-center h-full">
                      {showCheckboxes && (
                        <input
                          type="checkbox"
                          className="w-4 h-4 accent-foreground"
                        />
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="flex items-center gap-2 text-sm pl-2 pr-4">
                      <FileSpreadsheet className="w-4 h-4 text-muted-foreground" />
                      <span className="italic text-muted-foreground">
                        category1...
                      </span>
                      <Pencil className="w-3 h-3 text-muted-foreground ml-1" />
                    </div>
                  </td>
                  <td className="text-sm px-4 text-center">
                    {hasLabel ? 1 : 0}
                  </td>
                  <td className="text-sm px-4">
                    <div className="flex justify-center">
                      <Switch defaultChecked />
                    </div>
                  </td>
                </tr>
              ) : (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-8 text-center text-muted-foreground"
                  >
                    No categories yet.
                  </td>
                </tr>
              )}
            </>
          )}
        </tbody>
      </table>
    </div>
  );
}
