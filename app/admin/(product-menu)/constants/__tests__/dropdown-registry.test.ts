import { describe, it, expect, jest } from "@jest/globals";
import { DROPDOWN_REGISTRY, type DropdownContext } from "../dropdown-registry";
import type { BuilderState } from "../../types/builder-state";
import type { MenuLabel, MenuCategory, MenuProduct } from "../../types/menu";

describe("Dropdown Registry", () => {
  // Mock context factory
  const createMockContext = (
    overrides?: Partial<DropdownContext>
  ): DropdownContext => ({
    state: {
      selectedIds: [],
      undoStack: [],
      redoStack: [],
      currentView: "menu",
      currentLabelId: "label-1",
      currentCategoryId: "category-1",
      totalLabels: 5,
      totalCategories: 5,
      totalProducts: 10,
    } as BuilderState,
    labels: [
      { id: "label-1", name: "Label 1", isVisible: true } as MenuLabel,
      { id: "label-2", name: "Label 2", isVisible: false } as MenuLabel,
    ],
    categories: [
      { id: "cat-1", name: "Category 1", isVisible: true } as MenuCategory,
      { id: "cat-2", name: "Category 2", isVisible: false } as MenuCategory,
    ],
    products: [
      { id: "prod-1", name: "Product 1" } as MenuProduct,
      { id: "prod-2", name: "Product 2" } as MenuProduct,
    ],
    updateLabel: jest
      .fn<DropdownContext["updateLabel"]>()
      .mockResolvedValue({ ok: true }),
    attachCategory: jest
      .fn<DropdownContext["attachCategory"]>()
      .mockResolvedValue({ ok: true }),
    detachCategory: jest
      .fn<DropdownContext["detachCategory"]>()
      .mockResolvedValue({ ok: true }),
    attachProductToCategory: jest
      .fn<DropdownContext["attachProductToCategory"]>()
      .mockResolvedValue({ ok: true }),
    detachProductFromCategory: jest
      .fn<DropdownContext["detachProductFromCategory"]>()
      .mockResolvedValue({ ok: true }),
    ...overrides,
  });

  describe("Registry Structure", () => {
    it("should have entries for all dropdown actions", () => {
      expect(DROPDOWN_REGISTRY).toHaveProperty("add-labels");
      expect(DROPDOWN_REGISTRY).toHaveProperty("add-categories");
      expect(DROPDOWN_REGISTRY).toHaveProperty("add-products");
    });

    it("should have Component and buildProps for each entry", () => {
      Object.entries(DROPDOWN_REGISTRY).forEach(([_key, value]) => {
        expect(value).toHaveProperty("Component");
        expect(value).toHaveProperty("buildProps");
        expect(typeof value.buildProps).toBe("function");
      });
    });
  });

  describe("Add Labels Dropdown", () => {
    it("should build props with labels and updateLabel", () => {
      const context = createMockContext();
      const config = DROPDOWN_REGISTRY["add-labels"];
      const props = config.buildProps(context);

      expect(props).toHaveProperty("labels");
      expect(props).toHaveProperty("updateLabel");
      expect(props.labels).toEqual(context.labels);
      expect(props.updateLabel).toBe(context.updateLabel);
    });

    it("should provide all labels", () => {
      const context = createMockContext();
      const config = DROPDOWN_REGISTRY["add-labels"];
      const props = config.buildProps(context);

      expect(props.labels).toHaveLength(2);
      expect(props.labels[0].name).toBe("Label 1");
      expect(props.labels[1].name).toBe("Label 2");
    });
  });

  describe("Add Categories Dropdown", () => {
    it("should build props with currentLabelId and categories", () => {
      const context = createMockContext();
      const config = DROPDOWN_REGISTRY["add-categories"];
      const props = config.buildProps(context);

      expect(props).toHaveProperty("currentLabelId");
      expect(props).toHaveProperty("categories");
      expect(props).toHaveProperty("labels");
      expect(props).toHaveProperty("attachCategory");
      expect(props).toHaveProperty("detachCategory");
      expect(props.currentLabelId).toBe("label-1");
    });

    it("should provide all categories", () => {
      const context = createMockContext();
      const config = DROPDOWN_REGISTRY["add-categories"];
      const props = config.buildProps(context);

      expect(props.categories).toHaveLength(2);
      expect(props.categories[0].name).toBe("Category 1");
    });

    it("should include mutation functions", () => {
      const context = createMockContext();
      const config = DROPDOWN_REGISTRY["add-categories"];
      const props = config.buildProps(context);

      expect(props.attachCategory).toBe(context.attachCategory);
      expect(props.detachCategory).toBe(context.detachCategory);
    });
  });

  describe("Add Products Dropdown", () => {
    it("should build props with currentCategoryId and products", () => {
      const context = createMockContext();
      const config = DROPDOWN_REGISTRY["add-products"];
      const props = config.buildProps(context);

      expect(props).toHaveProperty("currentCategoryId");
      expect(props).toHaveProperty("products");
      expect(props).toHaveProperty("attachProductToCategory");
      expect(props).toHaveProperty("detachProductFromCategory");
      expect(props.currentCategoryId).toBe("category-1");
    });

    it("should provide all products", () => {
      const context = createMockContext();
      const config = DROPDOWN_REGISTRY["add-products"];
      const props = config.buildProps(context);

      expect(props.products).toHaveLength(2);
      expect(props.products[0].name).toBe("Product 1");
      expect(props.products[1].name).toBe("Product 2");
    });

    it("should include mutation functions", () => {
      const context = createMockContext();
      const config = DROPDOWN_REGISTRY["add-products"];
      const props = config.buildProps(context);

      expect(props.attachProductToCategory).toBe(
        context.attachProductToCategory
      );
      expect(props.detachProductFromCategory).toBe(
        context.detachProductFromCategory
      );
    });
  });

  describe("Type Safety", () => {
    it("should have properly typed mutation functions", () => {
      const context = createMockContext();

      // These should all be callable with correct signatures
      expect(typeof context.updateLabel).toBe("function");
      expect(typeof context.attachCategory).toBe("function");
      expect(typeof context.detachCategory).toBe("function");
      expect(typeof context.attachProductToCategory).toBe("function");
      expect(typeof context.detachProductFromCategory).toBe("function");
    });

    it("should return proper result shape from mutations", async () => {
      const context = createMockContext();

      const result = await context.updateLabel("label-1", { isVisible: true });
      expect(result).toHaveProperty("ok");
      expect(result.ok).toBe(true);
    });
  });
});
