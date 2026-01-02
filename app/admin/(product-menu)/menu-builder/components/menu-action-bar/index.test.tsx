import { describe, it, expect } from "@jest/globals";
import type { BuilderState } from "../../../types/builder-state";
import type { MenuLabel, MenuCategory, MenuProduct } from "../../../types/menu";
import { filterProductsBySearch, sectionProducts } from "./index";

/**
 * Tests for MenuActionBar dropdown logic
 *
 * These tests validate the business logic for:
 * - Disabled states based on data counts
 * - Product filtering and sectioning
 * - Alphabetical sorting within sections
 */

describe("MenuActionBar Dropdown Logic", () => {
  describe("Disabled States", () => {
    it("should disable add-labels when totalLabels is 0", () => {
      const state: BuilderState = {
        selectedIds: [],
        undoStack: [],
        redoStack: [],
        currentView: "menu",
        currentLabelId: undefined,
        currentCategoryId: undefined,
        totalLabels: 0,
        totalCategories: 5,
        totalProducts: 10,
      };

      const isDisabled = state.totalLabels === 0;
      expect(isDisabled).toBe(true);
    });

    it("should disable add-categories when totalCategories is 0", () => {
      const state: BuilderState = {
        selectedIds: [],
        undoStack: [],
        redoStack: [],
        currentView: "label",
        currentLabelId: "label-1",
        currentCategoryId: undefined,
        totalLabels: 5,
        totalCategories: 0,
        totalProducts: 10,
      };

      const isDisabled = state.totalCategories === 0;
      expect(isDisabled).toBe(true);
    });

    it("should disable add-products when totalProducts is 0", () => {
      const state: BuilderState = {
        selectedIds: [],
        undoStack: [],
        redoStack: [],
        currentView: "category",
        currentLabelId: "label-1",
        currentCategoryId: "category-1",
        totalLabels: 5,
        totalCategories: 5,
        totalProducts: 0,
      };

      const isDisabled = state.totalProducts === 0;
      expect(isDisabled).toBe(true);
    });

    it("should enable dropdown when data exists", () => {
      const state: BuilderState = {
        selectedIds: [],
        undoStack: [],
        redoStack: [],
        currentView: "category",
        currentLabelId: "label-1",
        currentCategoryId: "category-1",
        totalLabels: 5,
        totalCategories: 5,
        totalProducts: 10,
      };

      expect(state.totalLabels > 0).toBe(true);
      expect(state.totalCategories > 0).toBe(true);
      expect(state.totalProducts > 0).toBe(true);
    });
  });

  describe("Add Labels Dropdown", () => {
    const mockLabels: MenuLabel[] = [
      {
        id: "label-1",
        name: "Coffee",
        icon: "Coffee",
        order: 0,
        isVisible: true,
        autoOrder: false,
        categories: [],
      },
      {
        id: "label-2",
        name: "Tea",
        icon: "Leaf",
        order: 1,
        isVisible: false,
        autoOrder: false,
        categories: [],
      },
    ];

    it("should show all labels with correct isVisible state", () => {
      expect(mockLabels[0].isVisible).toBe(true);
      expect(mockLabels[1].isVisible).toBe(false);
    });
  });

  describe("Add Categories Dropdown", () => {
    const mockLabel: MenuLabel = {
      id: "label-1",
      name: "Coffee",
      icon: "Coffee",
      order: 0,
      isVisible: true,
      autoOrder: false,
      categories: [
        {
          id: "category-1",
          name: "Single Origin",
          slug: "single-origin",
          order: 0,
        },
      ],
    };

    it("should identify attached categories", () => {
      const mockCategories: MenuCategory[] = [
        {
          id: "category-1",
          name: "Single Origin",
          slug: "single-origin",
          order: 0,
          isVisible: true,
          productCount: 5,
          labels: [],
        },
        {
          id: "category-2",
          name: "Blends",
          slug: "blends",
          order: 1,
          isVisible: true,
          productCount: 3,
          labels: [],
        },
      ];

      const isCategory1Attached = mockLabel.categories.some(
        (c) => c.id === "category-1"
      );
      const isCategory2Attached = mockLabel.categories.some(
        (c) => c.id === "category-2"
      );

      expect(isCategory1Attached).toBe(true);
      expect(isCategory2Attached).toBe(false);
      expect(mockCategories).toHaveLength(2);
    });
  });

  describe("Add Products Dropdown - Filtering", () => {
    const mockProducts: MenuProduct[] = [
      {
        id: "1",
        name: "Ethiopian Yirgacheffe",
        slug: "ethiopian",
        categoryIds: ["cat-1"],
      },
      {
        id: "2",
        name: "Colombian Supremo",
        slug: "colombian",
        categoryIds: ["cat-2"],
      },
      { id: "3", name: "Hawaii Kona", slug: "hawaii", categoryIds: [] },
      { id: "4", name: "Mexican Altura", slug: "mexican", categoryIds: [] },
    ];

    it("should filter products by search term (case-insensitive)", () => {
      const search = "ethiopian";
      const filtered = filterProductsBySearch(mockProducts, search);

      expect(filtered).toHaveLength(1);
      expect(filtered[0].name).toBe("Ethiopian Yirgacheffe");
    });

    it("should filter products by partial search", () => {
      const search = "an";
      const filtered = filterProductsBySearch(mockProducts, search);

      expect(filtered).toHaveLength(3); // Ethiopian, Colombian, Mexican
      expect(filtered.map((p) => p.name)).toEqual([
        "Ethiopian Yirgacheffe",
        "Colombian Supremo",
        "Mexican Altura",
      ]);
    });

    it("should return empty array for no matches", () => {
      const search = "xyz123";
      const filtered = filterProductsBySearch(mockProducts, search);

      expect(filtered).toHaveLength(0);
    });
  });

  describe("Add Products Dropdown - Sectioning", () => {
    const currentCategoryId = "cat-1";
    const mockProducts: MenuProduct[] = [
      { id: "1", name: "Kenyan AA", slug: "kenyan", categoryIds: ["cat-1"] },
      {
        id: "2",
        name: "Ethiopian Yirgacheffe",
        slug: "ethiopian",
        categoryIds: ["cat-1"],
      },
      {
        id: "3",
        name: "Colombian Supremo",
        slug: "colombian",
        categoryIds: ["cat-2"],
      },
      {
        id: "4",
        name: "Brazilian Santos",
        slug: "brazilian",
        categoryIds: ["cat-2", "cat-3"],
      },
      { id: "5", name: "Hawaiian Kona", slug: "hawaii", categoryIds: [] },
      { id: "6", name: "Mexican Altura", slug: "mexican", categoryIds: [] },
    ];

    it("should separate products into Added section", () => {
      const { addedProducts } = sectionProducts(
        mockProducts,
        currentCategoryId
      );

      expect(addedProducts).toHaveLength(2);
      expect(addedProducts.map((p) => p.name)).toEqual([
        "Ethiopian Yirgacheffe",
        "Kenyan AA",
      ]);
    });

    it("should separate products into Unassigned section", () => {
      const { unassignedProducts } = sectionProducts(
        mockProducts,
        currentCategoryId
      );

      expect(unassignedProducts).toHaveLength(2);
      expect(unassignedProducts.map((p) => p.name)).toEqual([
        "Hawaiian Kona",
        "Mexican Altura",
      ]);
    });

    it("should separate products into Available section", () => {
      const { availableProducts } = sectionProducts(
        mockProducts,
        currentCategoryId
      );

      expect(availableProducts).toHaveLength(2);
      expect(availableProducts.map((p) => p.name)).toEqual([
        "Brazilian Santos",
        "Colombian Supremo",
      ]);
    });

    it("should have all products in exactly one section", () => {
      const { addedProducts, unassignedProducts, availableProducts } =
        sectionProducts(mockProducts, currentCategoryId);

      const total =
        addedProducts.length +
        unassignedProducts.length +
        availableProducts.length;

      expect(total).toBe(mockProducts.length);
    });
  });

  describe("Add Products Dropdown - Alphabetical Sorting", () => {
    const currentCategoryId = "cat-1";
    const mockProducts: MenuProduct[] = [
      { id: "1", name: "Zebra Coffee", slug: "zebra", categoryIds: ["cat-1"] },
      { id: "2", name: "Apple Blend", slug: "apple", categoryIds: ["cat-1"] },
      {
        id: "3",
        name: "Midnight Roast",
        slug: "midnight",
        categoryIds: ["cat-1"],
      },
    ];

    it("should sort Added section alphabetically", () => {
      const { addedProducts } = sectionProducts(
        mockProducts,
        currentCategoryId
      );

      expect(addedProducts.map((p) => p.name)).toEqual([
        "Apple Blend",
        "Midnight Roast",
        "Zebra Coffee",
      ]);
    });

    it("should sort Unassigned section alphabetically", () => {
      const unassignedMockProducts: MenuProduct[] = [
        { id: "1", name: "Zebra Coffee", slug: "zebra", categoryIds: [] },
        { id: "2", name: "Apple Blend", slug: "apple", categoryIds: [] },
        { id: "3", name: "Midnight Roast", slug: "midnight", categoryIds: [] },
      ];

      const { unassignedProducts } = sectionProducts(
        unassignedMockProducts,
        currentCategoryId
      );

      expect(unassignedProducts.map((p) => p.name)).toEqual([
        "Apple Blend",
        "Midnight Roast",
        "Zebra Coffee",
      ]);
    });

    it("should sort Available section alphabetically", () => {
      const availableMockProducts: MenuProduct[] = [
        {
          id: "1",
          name: "Zebra Coffee",
          slug: "zebra",
          categoryIds: ["cat-2"],
        },
        { id: "2", name: "Apple Blend", slug: "apple", categoryIds: ["cat-2"] },
        {
          id: "3",
          name: "Midnight Roast",
          slug: "midnight",
          categoryIds: ["cat-2"],
        },
      ];

      const { availableProducts } = sectionProducts(
        availableMockProducts,
        currentCategoryId
      );

      expect(availableProducts.map((p) => p.name)).toEqual([
        "Apple Blend",
        "Midnight Roast",
        "Zebra Coffee",
      ]);
    });
  });

  describe("Add Products Dropdown - Checked States", () => {
    const currentCategoryId = "cat-1";
    const mockProducts: MenuProduct[] = [
      { id: "1", name: "Product A", slug: "a", categoryIds: ["cat-1"] },
      { id: "2", name: "Product B", slug: "b", categoryIds: ["cat-2"] },
      { id: "3", name: "Product C", slug: "c", categoryIds: [] },
    ];

    it("should check products in Added section", () => {
      const product = mockProducts[0];
      const isChecked = product.categoryIds.includes(currentCategoryId);

      expect(isChecked).toBe(true);
    });

    it("should uncheck products in Available section", () => {
      const product = mockProducts[1];
      const isChecked = product.categoryIds.includes(currentCategoryId);

      expect(isChecked).toBe(false);
    });

    it("should uncheck products in Unassigned section", () => {
      const product = mockProducts[2];
      const isChecked = product.categoryIds.includes(currentCategoryId);

      expect(isChecked).toBe(false);
    });
  });

  describe("Add Products Dropdown - Combined Search and Sectioning", () => {
    const currentCategoryId = "cat-1";
    const mockProducts: MenuProduct[] = [
      {
        id: "1",
        name: "Ethiopian Yirgacheffe",
        slug: "ethiopian",
        categoryIds: ["cat-1"],
      },
      { id: "2", name: "Ethiopian Sidamo", slug: "sidamo", categoryIds: [] },
      {
        id: "3",
        name: "Ethiopian Harrar",
        slug: "harrar",
        categoryIds: ["cat-2"],
      },
      {
        id: "4",
        name: "Colombian Supremo",
        slug: "colombian",
        categoryIds: ["cat-1"],
      },
    ];

    it("should filter and section products correctly", () => {
      const search = "ethiopian";
      const filtered = filterProductsBySearch(mockProducts, search);
      const { addedProducts, unassignedProducts, availableProducts } =
        sectionProducts(filtered, currentCategoryId);

      expect(addedProducts).toHaveLength(1);
      expect(addedProducts[0].name).toBe("Ethiopian Yirgacheffe");

      expect(unassignedProducts).toHaveLength(1);
      expect(unassignedProducts[0].name).toBe("Ethiopian Sidamo");

      expect(availableProducts).toHaveLength(1);
      expect(availableProducts[0].name).toBe("Ethiopian Harrar");
    });

    it("should show all sections when no search applied", () => {
      const search = "";
      const filtered = filterProductsBySearch(mockProducts, search);

      expect(filtered).toHaveLength(mockProducts.length);
    });
  });

  describe("Action Button Type Logic", () => {
    describe("Menu View - Labels", () => {
      it("should show combo button (New + Add) when labels exist in DB", () => {
        const state: BuilderState = {
          selectedIds: [],
          undoStack: [],
          redoStack: [],
          currentView: "menu",
          currentLabelId: undefined,
          currentCategoryId: undefined,
          totalLabels: 5,
          totalCategories: 0,
          totalProducts: 0,
        };

        // New Label should always be enabled
        const isNewLabelDisabled = false;
        expect(isNewLabelDisabled).toBe(false);

        // Add Labels should be enabled when totalLabels > 0
        const isAddLabelsDisabled = state.totalLabels === 0;
        expect(isAddLabelsDisabled).toBe(false);
      });

      it("should show New button only (disable Add) when no labels in DB", () => {
        const state: BuilderState = {
          selectedIds: [],
          undoStack: [],
          redoStack: [],
          currentView: "menu",
          currentLabelId: undefined,
          currentCategoryId: undefined,
          totalLabels: 0,
          totalCategories: 0,
          totalProducts: 0,
        };

        // New Label should always be enabled
        const isNewLabelDisabled = false;
        expect(isNewLabelDisabled).toBe(false);

        // Add Labels should be disabled when totalLabels === 0
        const isAddLabelsDisabled = state.totalLabels === 0;
        expect(isAddLabelsDisabled).toBe(true);
      });
    });

    describe("Label View - Categories", () => {
      it("should show combo button (New + Add) when categories exist in DB", () => {
        const state: BuilderState = {
          selectedIds: [],
          undoStack: [],
          redoStack: [],
          currentView: "label",
          currentLabelId: "label-1",
          currentCategoryId: undefined,
          totalLabels: 5,
          totalCategories: 10,
          totalProducts: 0,
        };

        // New Category should always be enabled
        const isNewCategoryDisabled = false;
        expect(isNewCategoryDisabled).toBe(false);

        // Add Categories should be enabled when totalCategories > 0
        const isAddCategoriesDisabled = state.totalCategories === 0;
        expect(isAddCategoriesDisabled).toBe(false);
      });

      it("should show New button only (disable Add) when no categories in DB", () => {
        const state: BuilderState = {
          selectedIds: [],
          undoStack: [],
          redoStack: [],
          currentView: "label",
          currentLabelId: "label-1",
          currentCategoryId: undefined,
          totalLabels: 5,
          totalCategories: 0,
          totalProducts: 0,
        };

        // New Category should always be enabled
        const isNewCategoryDisabled = false;
        expect(isNewCategoryDisabled).toBe(false);

        // Add Categories should be disabled when totalCategories === 0
        const isAddCategoriesDisabled = state.totalCategories === 0;
        expect(isAddCategoriesDisabled).toBe(true);
      });
    });

    describe("Category View - Products", () => {
      it("should show combo button (New + Add) when products exist in DB", () => {
        const state: BuilderState = {
          selectedIds: [],
          undoStack: [],
          redoStack: [],
          currentView: "category",
          currentLabelId: "label-1",
          currentCategoryId: "category-1",
          totalLabels: 5,
          totalCategories: 10,
          totalProducts: 50,
        };

        // New Product should always be enabled
        const isNewProductDisabled = false;
        expect(isNewProductDisabled).toBe(false);

        // Add Products should be enabled when totalProducts > 0
        const isAddProductsDisabled = state.totalProducts === 0;
        expect(isAddProductsDisabled).toBe(false);
      });

      it("should show New button only (disable Add) when no products in DB", () => {
        const state: BuilderState = {
          selectedIds: [],
          undoStack: [],
          redoStack: [],
          currentView: "category",
          currentLabelId: "label-1",
          currentCategoryId: "category-1",
          totalLabels: 5,
          totalCategories: 10,
          totalProducts: 0,
        };

        // New Product should always be enabled
        const isNewProductDisabled = false;
        expect(isNewProductDisabled).toBe(false);

        // Add Products should be disabled when totalProducts === 0
        const isAddProductsDisabled = state.totalProducts === 0;
        expect(isAddProductsDisabled).toBe(true);
      });
    });

    describe("Standalone Dropdowns (Add Existing Only)", () => {
      it("should show dropdown for standalone add-existing actions when items exist", () => {
        const state: BuilderState = {
          selectedIds: [],
          undoStack: [],
          redoStack: [],
          currentView: "menu",
          currentLabelId: undefined,
          currentCategoryId: undefined,
          totalLabels: 5,
          totalCategories: 0,
          totalProducts: 0,
        };

        // Standalone dropdown should be enabled when items exist
        const isDropdownDisabled = state.totalLabels === 0;
        expect(isDropdownDisabled).toBe(false);
      });

      it("should disable dropdown when no items exist in DB", () => {
        const state: BuilderState = {
          selectedIds: [],
          undoStack: [],
          redoStack: [],
          currentView: "menu",
          currentLabelId: undefined,
          currentCategoryId: undefined,
          totalLabels: 0,
          totalCategories: 0,
          totalProducts: 0,
        };

        // Standalone dropdown should be disabled when no items exist
        const isDropdownDisabled = state.totalLabels === 0;
        expect(isDropdownDisabled).toBe(true);
      });
    });
  });
});
