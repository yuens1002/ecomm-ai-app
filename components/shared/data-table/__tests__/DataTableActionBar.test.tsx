import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { Search, Filter } from "lucide-react";
import {
  computeCollapseLevel,
  EXPANDED_SLOT_MIN_WIDTH,
  COLLAPSED_SLOT_WIDTH,
  SLOT_GAP,
  getCollapseConfig,
  isSlotActive,
  DataTableActionBar,
} from "../DataTableActionBar";
import type { ActionBarConfig, DataTableSlot, SearchSlot, FilterSlot } from "../types";

// ── computeCollapseLevel — dynamic width calculation ───────────────────

describe("computeCollapseLevel", () => {
  // Signature: computeCollapseLevel(leftAvailable, tabNaturalWidth, collapsibleCount, otherFixedWidth?)
  // Real-world scenario: Order Management page
  // tabNaturalWidth ≈ 400px, otherFixedWidth (col-vis toggle) ≈ 36px, 2 collapsible slots
  const TAB_WIDTH = 400;
  const OTHER_FIXED = 36; // column visibility toggle
  const COLLAPSIBLE = 2;  // search + filter

  // itemCount = 1 (tab) + 2 (collapsibles) + 1 (other fixed) = 4
  // gaps = 3 * 8 = 24
  // level 0 needed = 400 + 2*200 + 36 + 24 = 860
  // level 1 needed = 400 + 2*36  + 36 + 24 = 532

  it("returns 0 when no collapsible slots exist", () => {
    expect(computeCollapseLevel(300, 200, 0)).toBe(0);
  });

  describe("priority: collapse search/filter FIRST, tabs dropdown LAST", () => {
    it("level 0 — wide: everything expanded (tabs + search input + filter input)", () => {
      expect(computeCollapseLevel(900, TAB_WIDTH, COLLAPSIBLE, OTHER_FIXED)).toBe(0);
    });

    it("level 1 — medium: search/filter → icons, tabs STAY as TabsList", () => {
      expect(computeCollapseLevel(700, TAB_WIDTH, COLLAPSIBLE, OTHER_FIXED)).toBe(1);
    });

    it("level 2 — narrow: tabs also collapse to dropdown (last resort)", () => {
      expect(computeCollapseLevel(400, TAB_WIDTH, COLLAPSIBLE, OTHER_FIXED)).toBe(2);
    });
  });

  describe("boundary conditions", () => {
    it("exactly at level 0/1 boundary", () => {
      // needed for level 0 = 400 + 400 + 36 + 24 = 860
      expect(computeCollapseLevel(860, TAB_WIDTH, COLLAPSIBLE, OTHER_FIXED)).toBe(0);
      expect(computeCollapseLevel(859, TAB_WIDTH, COLLAPSIBLE, OTHER_FIXED)).toBe(1);
    });

    it("exactly at level 1/2 boundary", () => {
      // needed for level 1 = 400 + 72 + 36 + 24 = 532
      expect(computeCollapseLevel(532, TAB_WIDTH, COLLAPSIBLE, OTHER_FIXED)).toBe(1);
      expect(computeCollapseLevel(531, TAB_WIDTH, COLLAPSIBLE, OTHER_FIXED)).toBe(2);
    });
  });

  describe("without otherFixedWidth (no col-vis toggle)", () => {
    // itemCount = 1 + 2 + 0 = 3, gaps = 2 * 8 = 16
    // level 0 needed = 400 + 400 + 0 + 16 = 816
    // level 1 needed = 400 + 72  + 0 + 16 = 488
    it("needs less space without other fixed items", () => {
      expect(computeCollapseLevel(816, TAB_WIDTH, COLLAPSIBLE)).toBe(0);
      expect(computeCollapseLevel(815, TAB_WIDTH, COLLAPSIBLE)).toBe(1);
      expect(computeCollapseLevel(488, TAB_WIDTH, COLLAPSIBLE)).toBe(1);
      expect(computeCollapseLevel(487, TAB_WIDTH, COLLAPSIBLE)).toBe(2);
    });
  });

  describe("single collapsible slot", () => {
    it("needs less space when only one slot (search without filter)", () => {
      // itemCount = 1 + 1 + 1 = 3, gaps = 2 * 8 = 16
      // level 0 needed = 400 + 200 + 36 + 16 = 652
      // level 1 needed = 400 + 36  + 36 + 16 = 488
      expect(computeCollapseLevel(652, TAB_WIDTH, 1, OTHER_FIXED)).toBe(0);
      expect(computeCollapseLevel(651, TAB_WIDTH, 1, OTHER_FIXED)).toBe(1);
      expect(computeCollapseLevel(488, TAB_WIDTH, 1, OTHER_FIXED)).toBe(1);
      expect(computeCollapseLevel(487, TAB_WIDTH, 1, OTHER_FIXED)).toBe(2);
    });
  });

  describe("smaller tabs (e.g. reviews page with fewer tab items)", () => {
    it("keeps tabs longer when tab bar is narrower", () => {
      const SMALL_TAB = 250;
      // With SMALL_TAB, otherFixed=36, 2 collapsibles:
      // level 1 needed = 250 + 72 + 36 + 24 = 382
      expect(computeCollapseLevel(400, SMALL_TAB, COLLAPSIBLE, OTHER_FIXED)).toBe(1);
      // Same width forces level 2 with larger tabs
      expect(computeCollapseLevel(400, TAB_WIDTH, COLLAPSIBLE, OTHER_FIXED)).toBe(2);
    });
  });

  it("exports correct constants", () => {
    expect(EXPANDED_SLOT_MIN_WIDTH).toBe(200);
    expect(COLLAPSED_SLOT_WIDTH).toBe(36);
    expect(SLOT_GAP).toBe(8);
  });
});

// ── getCollapseConfig ──────────────────────────────────────────────────

describe("getCollapseConfig", () => {
  it("returns collapse config for a search slot with collapse", () => {
    const slot: SearchSlot = {
      type: "search", value: "", onChange: jest.fn(),
      collapse: { icon: Search },
    };
    expect(getCollapseConfig(slot)).toEqual({ icon: Search });
  });

  it("returns undefined for a slot without collapse", () => {
    const slot: DataTableSlot = { type: "recordCount", count: 42, label: "items" };
    expect(getCollapseConfig(slot)).toBeUndefined();
  });
});

// ── isSlotActive ───────────────────────────────────────────────────────

describe("isSlotActive", () => {
  it("returns false for empty search", () => {
    expect(isSlotActive({ type: "search", value: "", onChange: jest.fn() })).toBe(false);
  });

  it("returns true for non-empty search", () => {
    expect(isSlotActive({ type: "search", value: "hello", onChange: jest.fn() })).toBe(true);
  });

  it("returns false for filter with null activeFilter", () => {
    const slot: FilterSlot = { type: "filter", configs: [], activeFilter: null, onFilterChange: jest.fn() };
    expect(isSlotActive(slot)).toBe(false);
  });

  it("returns false for filter with null value (e.g. date filter with no selection)", () => {
    const slot: FilterSlot = { type: "filter", configs: [], activeFilter: { configId: "date", value: null }, onFilterChange: jest.fn() };
    expect(isSlotActive(slot)).toBe(false);
  });

  it("returns false for filter with empty string value", () => {
    const slot: FilterSlot = { type: "filter", configs: [], activeFilter: { configId: "s", value: "" }, onFilterChange: jest.fn() };
    expect(isSlotActive(slot)).toBe(false);
  });

  it("returns false for filter with empty array value", () => {
    const slot: FilterSlot = { type: "filter", configs: [], activeFilter: { configId: "s", value: [] }, onFilterChange: jest.fn() };
    expect(isSlotActive(slot)).toBe(false);
  });

  it("returns true for filter with non-empty value", () => {
    const slot: FilterSlot = { type: "filter", configs: [], activeFilter: { configId: "s", value: "ACTIVE" }, onFilterChange: jest.fn() };
    expect(isSlotActive(slot)).toBe(true);
  });

  it("returns true for filter with non-empty array value", () => {
    const slot: FilterSlot = { type: "filter", configs: [], activeFilter: { configId: "s", value: ["A", "B"] }, onFilterChange: jest.fn() };
    expect(isSlotActive(slot)).toBe(true);
  });

  it("returns false for non-collapsible slot types", () => {
    expect(isSlotActive({ type: "recordCount", count: 10 })).toBe(false);
  });
});

// ── Component render tests ─────────────────────────────────────────────

beforeAll(() => {
  class MockIntersectionObserver {
    observe = jest.fn();
    unobserve = jest.fn();
    disconnect = jest.fn();
  }
  Object.defineProperty(window, "IntersectionObserver", {
    value: MockIntersectionObserver,
  });

  class MockResizeObserver {
    observe = jest.fn();
    unobserve = jest.fn();
    disconnect = jest.fn();
  }
  Object.defineProperty(window, "ResizeObserver", {
    value: MockResizeObserver,
  });
});

describe("DataTableActionBar", () => {
  const baseConfig: ActionBarConfig = {
    left: [
      { type: "custom", content: <span data-testid="tabs">Tabs</span> },
      {
        type: "search",
        value: "",
        onChange: jest.fn(),
        placeholder: "Search...",
        collapse: { icon: Search },
      },
      {
        type: "filter",
        configs: [{ id: "status", label: "Status", filterType: "multiSelect", options: [] }],
        activeFilter: null,
        onFilterChange: jest.fn(),
        collapse: { icon: Filter },
      },
    ],
    right: [
      { type: "recordCount", count: 42, label: "orders" },
    ],
  };

  it("renders left and right sections as separate flex containers", () => {
    const { container } = render(<DataTableActionBar config={baseConfig} />);
    const stickyBar = container.children[1] as HTMLElement;
    const children = Array.from(stickyBar.children);
    expect(children).toHaveLength(2);

    expect(children[0]).toHaveClass("flex", "items-center", "gap-2", "flex-1", "min-w-0");
    expect(children[1]).toHaveClass("flex", "items-center", "gap-2", "flex-shrink-0");
  });

  it("outer container uses gap-4 (2× the inner gap-2) to separate sections", () => {
    const { container } = render(<DataTableActionBar config={baseConfig} />);
    const stickyBar = container.children[1] as HTMLElement;
    expect(stickyBar).toHaveClass("gap-4");
  });

  it("marks collapsible slots with data-collapsible attribute", () => {
    const { container } = render(<DataTableActionBar config={baseConfig} />);
    const leftSection = container.querySelector(".flex-1");
    const collapsibleItems = leftSection?.querySelectorAll("[data-collapsible]");
    expect(collapsibleItems).toHaveLength(2);
  });

  it("does not show active indicator at level 0 (expanded) even with active search", () => {
    // At level 0, collapsible slots render as full inputs — no icon, no dot
    const activeConfig: ActionBarConfig = {
      ...baseConfig,
      left: [
        { type: "search", value: "query", onChange: jest.fn(), collapse: { icon: Search } },
      ],
    };
    const { container } = render(<DataTableActionBar config={activeConfig} />);
    expect(container.querySelector(".bg-red-500")).not.toBeInTheDocument();
  });

  it("does not show active indicator when search is empty", () => {
    const emptyConfig: ActionBarConfig = {
      ...baseConfig,
      left: [
        { type: "search", value: "", onChange: jest.fn(), collapse: { icon: Search } },
      ],
    };
    const { container } = render(<DataTableActionBar config={emptyConfig} />);
    expect(container.querySelector(".bg-red-500")).not.toBeInTheDocument();
  });

  it("renders record count in right section", () => {
    render(<DataTableActionBar config={baseConfig} />);
    expect(screen.getByText("42 orders")).toBeInTheDocument();
  });

  it("expands a collapsible slot when icon button is clicked", () => {
    render(<DataTableActionBar config={baseConfig} />);
    const buttons = screen.getAllByRole("button");
    fireEvent.click(buttons[0]);
    expect(screen.getByPlaceholderText("Search...")).toBeInTheDocument();
  });

  it("collapses back when back arrow is clicked", () => {
    render(<DataTableActionBar config={baseConfig} />);
    const buttons = screen.getAllByRole("button");
    fireEvent.click(buttons[0]);
    const backButton = screen.getAllByRole("button")[0];
    fireEvent.click(backButton);
    expect(screen.getByTestId("tabs")).toBeInTheDocument();
  });
});
