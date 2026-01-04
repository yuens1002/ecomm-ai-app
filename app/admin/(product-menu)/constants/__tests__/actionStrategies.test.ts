import { describe, it, expect, jest } from "@jest/globals";
import {
  ACTION_STRATEGIES,
  executeAction,
  type ActionContext,
} from "../action-strategies";

describe("Action Strategies", () => {
  // Mock context
  const createMockContext = (): ActionContext => ({
    selectedIds: ["id1", "id2"],
    currentLabelId: "label-1",
    currentCategoryId: "category-1",
    mutations: {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      updateLabel: (jest.fn() as any).mockResolvedValue({ ok: true }),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      updateCategory: (jest.fn() as any).mockResolvedValue({ ok: true }),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      detachCategory: (jest.fn() as any).mockResolvedValue({ ok: true }),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      detachProductFromCategory: (jest.fn() as any).mockResolvedValue({ ok: true }),
    },
    labels: [
      { id: "id1", name: "Label 1", isVisible: true },
      { id: "id2", name: "Label 2", isVisible: false },
    ],
    categories: [
      { id: "id1", name: "Category 1", isVisible: true },
      { id: "id2", name: "Category 2", isVisible: false },
    ],
    products: [],
  });

  const mockMutate = {
    labels: jest.fn(),
    categories: jest.fn(),
  };

  describe("Menu View Strategies", () => {
    it("should have remove strategy for menu view", () => {
      expect(ACTION_STRATEGIES.menu.remove).toBeDefined();
      expect(ACTION_STRATEGIES.menu.remove?.execute).toBeInstanceOf(Function);
    });

    it("should execute remove action and hide labels", async () => {
      const context = createMockContext();
      const strategy = ACTION_STRATEGIES.menu.remove!;

      await strategy.execute(context);

      expect(context.mutations.updateLabel).toHaveBeenCalledTimes(2);
      expect(context.mutations.updateLabel).toHaveBeenCalledWith("id1", {
        isVisible: false,
      });
      expect(context.mutations.updateLabel).toHaveBeenCalledWith("id2", {
        isVisible: false,
      });
    });

    it("should have correct refresh configuration", () => {
      const strategy = ACTION_STRATEGIES.menu.remove!;
      expect(strategy.refresh).toEqual(["labels"]);
    });

    it("should toggle visibility for labels", async () => {
      const context = createMockContext();
      const strategy = ACTION_STRATEGIES.menu.toggleVisibility!;

      await strategy.execute(context);

      expect(context.mutations.updateLabel).toHaveBeenCalledWith("id1", {
        isVisible: false, // Was true, now false
      });
      expect(context.mutations.updateLabel).toHaveBeenCalledWith("id2", {
        isVisible: true, // Was false, now true
      });
    });
  });

  describe("Label View Strategies", () => {
    it("should have remove strategy for label view", () => {
      expect(ACTION_STRATEGIES.label.remove).toBeDefined();
    });

    it("should execute remove action and detach categories", async () => {
      const context = createMockContext();
      const strategy = ACTION_STRATEGIES.label.remove!;

      await strategy.execute(context);

      expect(context.mutations.detachCategory).toHaveBeenCalledTimes(2);
      expect(context.mutations.detachCategory).toHaveBeenCalledWith(
        "label-1",
        "id1"
      );
      expect(context.mutations.detachCategory).toHaveBeenCalledWith(
        "label-1",
        "id2"
      );
    });
  });

  describe("Category View Strategies", () => {
    it("should have remove strategy for category view", () => {
      expect(ACTION_STRATEGIES.category.remove).toBeDefined();
    });

    it("should execute remove action and detach products", async () => {
      const context = createMockContext();
      const strategy = ACTION_STRATEGIES.category.remove!;

      await strategy.execute(context);

      expect(context.mutations.detachProductFromCategory).toHaveBeenCalledTimes(
        2
      );
      expect(context.mutations.detachProductFromCategory).toHaveBeenCalledWith(
        "id1",
        "category-1"
      );
    });
  });

  describe("All-Labels View Strategies", () => {
    it("should have all strategies for all-labels view", () => {
      expect(ACTION_STRATEGIES["all-labels"].remove).toBeDefined();
      expect(ACTION_STRATEGIES["all-labels"].clone).toBeDefined();
      expect(ACTION_STRATEGIES["all-labels"].toggleVisibility).toBeDefined();
    });
  });

  describe("All-Categories View Strategies", () => {
    it("should have all strategies for all-categories view", () => {
      expect(ACTION_STRATEGIES["all-categories"].remove).toBeDefined();
      expect(ACTION_STRATEGIES["all-categories"].clone).toBeDefined();
      expect(
        ACTION_STRATEGIES["all-categories"].toggleVisibility
      ).toBeDefined();
    });

    it("should toggle category visibility", async () => {
      const context = createMockContext();
      const strategy = ACTION_STRATEGIES["all-categories"].toggleVisibility!;

      await strategy.execute(context);

      expect(context.mutations.updateCategory).toHaveBeenCalledWith("id1", {
        isVisible: false,
      });
      expect(context.mutations.updateCategory).toHaveBeenCalledWith("id2", {
        isVisible: true,
      });
    });
  });

  describe("executeAction", () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it("should execute action and refresh data", async () => {
      const context = createMockContext();

      const result = await executeAction("remove", "menu", context, mockMutate);

      expect(result.ok).toBe(true);
      expect(mockMutate.labels).toHaveBeenCalled();
    });

    it("should return error for unsupported action", async () => {
      const context = createMockContext();

      const result = await executeAction(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        "invalid" as any,
        "menu",
        context,
        mockMutate
      );

      expect(result.ok).toBe(false);
      expect(result.error).toContain("not available");
    });

    it("should return error for action not supported in view", async () => {
      const context = createMockContext();

      // toggleVisibility not supported in label view
      const result = await executeAction(
        "toggleVisibility",
        "label",
        context,
        mockMutate
      );

      expect(result.ok).toBe(false);
      expect(result.error).toContain("not available");
    });

    it("should handle execution errors gracefully", async () => {
      const context = createMockContext();
      // Make mutation fail
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      context.mutations.updateLabel = (jest.fn() as any).mockRejectedValue(new Error("Network error"));

      const result = await executeAction("remove", "menu", context, mockMutate);

      expect(result.ok).toBe(false);
      expect(result.error).toBeTruthy();
    });

    it("should refresh multiple resources", async () => {
      // If we had a strategy that refreshes both labels and categories
      // (currently none do, but test the capability)
      const context = createMockContext();

      await executeAction("remove", "menu", context, mockMutate);

      // Should refresh labels as specified
      expect(mockMutate.labels).toHaveBeenCalled();
    });
  });

  describe("Strategy Configuration Completeness", () => {
    it("should have strategies for all views", () => {
      const views = [
        "menu",
        "label",
        "category",
        "all-labels",
        "all-categories",
      ];
      views.forEach((view) => {
        expect(
          ACTION_STRATEGIES[view as keyof typeof ACTION_STRATEGIES]
        ).toBeDefined();
      });
    });

    it("should have remove strategy for all views", () => {
      const views = [
        "menu",
        "label",
        "category",
        "all-labels",
        "all-categories",
      ];
      views.forEach((view) => {
        expect(
          ACTION_STRATEGIES[view as keyof typeof ACTION_STRATEGIES].remove
        ).toBeDefined();
      });
    });

    it("should have clone strategy for all views", () => {
      const views = [
        "menu",
        "label",
        "category",
        "all-labels",
        "all-categories",
      ];
      views.forEach((view) => {
        expect(
          ACTION_STRATEGIES[view as keyof typeof ACTION_STRATEGIES].clone
        ).toBeDefined();
      });
    });
  });
});
