import { describe, expect, it, jest } from "@jest/globals";
import type { BuilderState } from "../../types/builder-state";
import type { MenuCategory, MenuLabel, MenuProduct } from "../../types/menu";
import {
  ACTION_BAR_CONFIG,
  type ActionContext,
  type ProductMenuMutations,
} from "../action-bar-config";

describe("Action Bar Configuration", () => {
  // Mock context factory
  const createMockContext = (overrides?: Partial<ActionContext>): ActionContext => {
    const mockMutations: ProductMenuMutations = {
      createCategory: jest
        .fn<ProductMenuMutations["createCategory"]>()
        .mockResolvedValue({ ok: true, data: { id: "new-category-id" } }),
      cloneCategory: jest
        .fn<ProductMenuMutations["cloneCategory"]>()
        .mockResolvedValue({ ok: true, data: { id: "cloned-category-id" } }),
      updateLabel: jest.fn<ProductMenuMutations["updateLabel"]>().mockResolvedValue({ ok: true }),
      updateCategory: jest
        .fn<ProductMenuMutations["updateCategory"]>()
        .mockResolvedValue({ ok: true }),
      detachCategory: jest
        .fn<ProductMenuMutations["detachCategory"]>()
        .mockResolvedValue({ ok: true }),
      detachProductFromCategory: jest
        .fn<ProductMenuMutations["detachProductFromCategory"]>()
        .mockResolvedValue({ ok: true }),
    };

    return {
      selectedIds: ["id1", "id2"],
      currentLabelId: "label-1",
      currentCategoryId: "category-1",
      mutations: mockMutations,
      labels: [
        { id: "id1", name: "Label 1", isVisible: true } as MenuLabel,
        { id: "id2", name: "Label 2", isVisible: false } as MenuLabel,
      ],
      categories: [
        { id: "id1", name: "Category 1", isVisible: true } as MenuCategory,
        { id: "id2", name: "Category 2", isVisible: false } as MenuCategory,
      ],
      products: [] as MenuProduct[],
      ...overrides,
    };
  };

  const createMockState = (overrides?: Partial<BuilderState>): BuilderState => ({
    selectedIds: [],
    selectedKind: null,
    undoStack: [],
    redoStack: [],
    currentView: "menu",
    currentLabelId: undefined,
    currentCategoryId: undefined,
    totalLabels: 5,
    totalCategories: 5,
    totalProducts: 10,
    ...overrides,
  });

  describe("Configuration Structure", () => {
    it("should define actions for all 5 views", () => {
      expect(ACTION_BAR_CONFIG).toHaveProperty("menu");
      expect(ACTION_BAR_CONFIG).toHaveProperty("label");
      expect(ACTION_BAR_CONFIG).toHaveProperty("category");
      expect(ACTION_BAR_CONFIG).toHaveProperty("all-labels");
      expect(ACTION_BAR_CONFIG).toHaveProperty("all-categories");
    });

    it("should define required action properties", () => {
      const menuActions = ACTION_BAR_CONFIG.menu;
      const firstAction = menuActions[0];

      expect(firstAction).toHaveProperty("id");
      expect(firstAction).toHaveProperty("type");
      expect(firstAction).toHaveProperty("icon");
      expect(firstAction).toHaveProperty("label");
      expect(firstAction).toHaveProperty("tooltip");
      expect(firstAction).toHaveProperty("kbd");
      expect(firstAction).toHaveProperty("position");
      expect(firstAction).toHaveProperty("disabled");
      expect(firstAction).toHaveProperty("onClick");
    });

    it("should have left and right positioned actions", () => {
      const menuActions = ACTION_BAR_CONFIG.menu;
      const leftActions = menuActions.filter((a) => a.position === "left");
      const rightActions = menuActions.filter((a) => a.position === "right");

      expect(leftActions.length).toBeGreaterThan(0);
      expect(rightActions.length).toBeGreaterThan(0);
    });
  });

  describe("Shared Actions - Remove", () => {
    it("should have execute logic for all relevant views", () => {
      const removeAction = ACTION_BAR_CONFIG.menu.find((a) => a.id === "remove");

      expect(removeAction?.execute).toBeDefined();
      expect(removeAction?.execute?.menu).toBeInstanceOf(Function);
      expect(removeAction?.execute?.label).toBeInstanceOf(Function);
      expect(removeAction?.execute?.category).toBeInstanceOf(Function);
      expect(removeAction?.execute?.["all-labels"]).toBeInstanceOf(Function);
      expect(removeAction?.execute?.["all-categories"]).toBeInstanceOf(Function);
    });

    it("should hide labels in menu view", async () => {
      const context = createMockContext();
      const removeAction = ACTION_BAR_CONFIG.menu.find((a) => a.id === "remove");

      await removeAction?.execute?.menu?.(context);

      expect(context.mutations.updateLabel).toHaveBeenCalledWith("id1", {
        isVisible: false,
      });
      expect(context.mutations.updateLabel).toHaveBeenCalledWith("id2", {
        isVisible: false,
      });
    });

    it("should detach categories in label view", async () => {
      const context = createMockContext();
      const removeAction = ACTION_BAR_CONFIG.label.find((a) => a.id === "remove");

      await removeAction?.execute?.label?.(context);

      expect(context.mutations.detachCategory).toHaveBeenCalledWith("label-1", "id1");
      expect(context.mutations.detachCategory).toHaveBeenCalledWith("label-1", "id2");
    });

    it("should detach products in category view", async () => {
      const context = createMockContext();
      const removeAction = ACTION_BAR_CONFIG.category.find((a) => a.id === "remove");

      await removeAction?.execute?.category?.(context);

      expect(context.mutations.detachProductFromCategory).toHaveBeenCalledWith("id1", "category-1");
      expect(context.mutations.detachProductFromCategory).toHaveBeenCalledWith("id2", "category-1");
    });

    it("should have proper refresh config", () => {
      const removeAction = ACTION_BAR_CONFIG.menu.find((a) => a.id === "remove");

      expect(removeAction?.refresh?.menu).toEqual(["labels"]);
      expect(removeAction?.refresh?.label).toEqual(["labels"]);
      expect(removeAction?.refresh?.category).toEqual(["products"]);
    });

    it("should have error messages for all views", () => {
      const removeAction = ACTION_BAR_CONFIG.menu.find((a) => a.id === "remove");

      expect(removeAction?.errorMessage?.menu).toBeTruthy();
      expect(removeAction?.errorMessage?.label).toBeTruthy();
      expect(removeAction?.errorMessage?.category).toBeTruthy();
    });
  });

  describe("Shared Actions - Clone", () => {
    it("should have execute logic for applicable views", () => {
      const cloneAction = ACTION_BAR_CONFIG.menu.find((a) => a.id === "clone");

      expect(cloneAction?.execute?.menu).toBeInstanceOf(Function);
      expect(cloneAction?.execute?.["all-labels"]).toBeInstanceOf(Function);
      expect(cloneAction?.execute?.["all-categories"]).toBeInstanceOf(Function);
    });

    it("should not have clone in label/category detail views", () => {
      const labelActions = ACTION_BAR_CONFIG.label;
      const categoryActions = ACTION_BAR_CONFIG.category;

      expect(labelActions.find((a) => a.id === "clone")).toBeUndefined();
      expect(categoryActions.find((a) => a.id === "clone")).toBeUndefined();
    });
  });

  describe("Shared Actions - Visibility", () => {
    it("should have execute logic for menu and all-* views", () => {
      const visibilityAction = ACTION_BAR_CONFIG.menu.find((a) => a.id === "visibility");

      expect(visibilityAction?.execute?.menu).toBeInstanceOf(Function);
      expect(visibilityAction?.execute?.["all-labels"]).toBeInstanceOf(Function);
      expect(visibilityAction?.execute?.["all-categories"]).toBeInstanceOf(Function);
    });

    it("should toggle label visibility in menu view", async () => {
      const context = createMockContext();
      const visibilityAction = ACTION_BAR_CONFIG.menu.find((a) => a.id === "visibility");

      await visibilityAction?.execute?.menu?.(context);

      // Label 1 is visible, should become hidden
      expect(context.mutations.updateLabel).toHaveBeenCalledWith("id1", {
        isVisible: false,
      });
      // Label 2 is hidden, should become visible
      expect(context.mutations.updateLabel).toHaveBeenCalledWith("id2", {
        isVisible: true,
      });
    });

    it("should toggle category visibility in all-categories view", async () => {
      const context = createMockContext();
      const visibilityAction = ACTION_BAR_CONFIG["all-categories"].find(
        (a) => a.id === "visibility"
      );

      await visibilityAction?.execute?.["all-categories"]?.(context);

      expect(context.mutations.updateCategory).toHaveBeenCalledWith("id1", {
        isVisible: false,
      });
      expect(context.mutations.updateCategory).toHaveBeenCalledWith("id2", {
        isVisible: true,
      });
    });
  });

  describe("Disabled State Logic", () => {
    it("should disable actions when no items selected", () => {
      const state = createMockState({ selectedIds: [] });
      const removeAction = ACTION_BAR_CONFIG.menu.find((a) => a.id === "remove");

      expect(removeAction?.disabled(state)).toBe(true);
    });

    it("should enable actions when items selected", () => {
      const state = createMockState({ selectedIds: ["id1"] });
      const removeAction = ACTION_BAR_CONFIG.menu.find((a) => a.id === "remove");

      expect(removeAction?.disabled(state)).toBe(false);
    });

    it("should disable add-labels when totalLabels is 0", () => {
      const state = createMockState({ totalLabels: 0 });
      const addLabelsAction = ACTION_BAR_CONFIG.menu.find((a) => a.id === "add-labels");

      expect(addLabelsAction?.disabled(state)).toBe(true);
    });

    it("should disable add-categories when totalCategories is 0", () => {
      const state = createMockState({ totalCategories: 0 });
      const addCategoriesAction = ACTION_BAR_CONFIG.label.find((a) => a.id === "add-categories");

      expect(addCategoriesAction?.disabled(state)).toBe(true);
    });

    it("should disable add-products when totalProducts is 0", () => {
      const state = createMockState({ totalProducts: 0 });
      const addProductsAction = ACTION_BAR_CONFIG.category.find((a) => a.id === "add-products");

      expect(addProductsAction?.disabled(state)).toBe(true);
    });

    it("should disable undo when no undo history", () => {
      const state = createMockState({ undoStack: [] });
      const undoAction = ACTION_BAR_CONFIG.menu.find((a) => a.id === "undo");

      expect(undoAction?.disabled(state)).toBe(true);
    });

    it("should disable redo when no redo history", () => {
      const state = createMockState({ redoStack: [] });
      const redoAction = ACTION_BAR_CONFIG.menu.find((a) => a.id === "redo");

      expect(redoAction?.disabled(state)).toBe(true);
    });
  });

  describe("Action Types", () => {
    it("should have correct action types", () => {
      const menuActions = ACTION_BAR_CONFIG.menu;

      const newLabelAction = menuActions.find((a) => a.id === "new-label");
      expect(newLabelAction?.type).toBe("combo");

      const removeAction = menuActions.find((a) => a.id === "remove");
      expect(removeAction?.type).toBe("button");
    });

    it("should have dropdown type for add-categories", () => {
      const labelActions = ACTION_BAR_CONFIG.label;
      const addCategoriesAction = labelActions.find((a) => a.id === "add-categories");

      expect(addCategoriesAction?.type).toBe("dropdown");
    });

    it("should have comboWith property for combo actions", () => {
      const menuActions = ACTION_BAR_CONFIG.menu;
      const newLabelAction = menuActions.find((a) => a.id === "new-label");

      expect(newLabelAction?.comboWith).toBe("add-labels");
    });
  });

  describe("View-specific Action Availability", () => {
    it("should have visibility action in menu view", () => {
      const menuActions = ACTION_BAR_CONFIG.menu;
      expect(menuActions.find((a) => a.id === "visibility")).toBeDefined();
    });

    it("should not have visibility action in label view", () => {
      const labelActions = ACTION_BAR_CONFIG.label;
      expect(labelActions.find((a) => a.id === "visibility")).toBeUndefined();
    });

    it("should have expand/collapse in menu and category views", () => {
      const menuActions = ACTION_BAR_CONFIG.menu;
      const categoryActions = ACTION_BAR_CONFIG.category;

      expect(menuActions.find((a) => a.id === "expand-all")).toBeDefined();
      expect(categoryActions.find((a) => a.id === "collapse-all")).toBeDefined();
    });

    it("should not have expand/collapse in label view", () => {
      const labelActions = ACTION_BAR_CONFIG.label;

      expect(labelActions.find((a) => a.id === "expand-all")).toBeUndefined();
      expect(labelActions.find((a) => a.id === "collapse-all")).toBeUndefined();
    });
  });

  describe("Structural Snapshot", () => {
    it("should match expected action bar structure", () => {
      const structure = Object.fromEntries(
        Object.entries(ACTION_BAR_CONFIG).map(([view, actions]) => [
          view,
          {
            left: actions
              .filter((a) => a.position === "left")
              .map((a) => ({ id: a.id, type: a.type })),
            right: actions
              .filter((a) => a.position === "right")
              .map((a) => ({ id: a.id, type: a.type })),
          },
        ])
      );

      expect(structure).toMatchInlineSnapshot(`
        {
          "all-categories": {
            "left": [
              {
                "id": "new-category",
                "type": "button",
              },
              {
                "id": "clone",
                "type": "button",
              },
              {
                "id": "remove",
                "type": "button",
              },
            ],
            "right": [
              {
                "id": "visibility",
                "type": "button",
              },
              {
                "id": "undo",
                "type": "button",
              },
              {
                "id": "redo",
                "type": "button",
              },
            ],
          },
          "all-labels": {
            "left": [
              {
                "id": "new-label",
                "type": "button",
              },
              {
                "id": "clone",
                "type": "button",
              },
              {
                "id": "remove",
                "type": "button",
              },
            ],
            "right": [
              {
                "id": "visibility",
                "type": "button",
              },
              {
                "id": "undo",
                "type": "button",
              },
              {
                "id": "redo",
                "type": "button",
              },
            ],
          },
          "category": {
            "left": [
              {
                "id": "add-products",
                "type": "dropdown",
              },
              {
                "id": "sort-order",
                "type": "dropdown",
              },
              {
                "id": "remove",
                "type": "button",
              },
            ],
            "right": [
              {
                "id": "expand-all",
                "type": "button",
              },
              {
                "id": "collapse-all",
                "type": "button",
              },
              {
                "id": "undo",
                "type": "button",
              },
              {
                "id": "redo",
                "type": "button",
              },
            ],
          },
          "label": {
            "left": [
              {
                "id": "add-categories",
                "type": "dropdown",
              },
              {
                "id": "sort-mode",
                "type": "dropdown",
              },
              {
                "id": "remove",
                "type": "button",
              },
            ],
            "right": [
              {
                "id": "undo",
                "type": "button",
              },
              {
                "id": "redo",
                "type": "button",
              },
            ],
          },
          "menu": {
            "left": [
              {
                "id": "new-label",
                "type": "combo",
              },
              {
                "id": "add-labels",
                "type": "combo",
              },
              {
                "id": "clone",
                "type": "button",
              },
              {
                "id": "remove",
                "type": "button",
              },
            ],
            "right": [
              {
                "id": "visibility",
                "type": "button",
              },
              {
                "id": "expand-all",
                "type": "button",
              },
              {
                "id": "collapse-all",
                "type": "button",
              },
              {
                "id": "undo",
                "type": "button",
              },
              {
                "id": "redo",
                "type": "button",
              },
            ],
          },
        }
      `);
    });
  });
});
