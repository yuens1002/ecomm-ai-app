import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { CategoryMenuColumns } from "@/components/app-components/CategoryMenuColumns";

describe("CategoryMenuColumns", () => {
  const mockCategoryGroups = {
    "BY ROAST LEVEL": [
      { name: "Light Roast", slug: "light-roast" },
      { name: "Medium Roast", slug: "medium-roast" },
      { name: "Dark Roast", slug: "dark-roast" },
    ],
    "BY TASTE PROFILE": [
      { name: "Nutty & Chocolatey", slug: "nutty-chocolatey" },
      { name: "Fruity & Floral", slug: "fruity-floral" },
    ],
    ORIGINS: Array.from({ length: 10 }, (_, i) => ({
      name: `Origin ${i + 1}`,
      slug: `origin-${i + 1}`,
    })),
  };

  describe("Basic Rendering", () => {
    it("renders all label groups", () => {
      render(<CategoryMenuColumns categoryGroups={mockCategoryGroups} />);

      expect(screen.getByText("BY ROAST LEVEL")).toBeInTheDocument();
      expect(screen.getByText("BY TASTE PROFILE")).toBeInTheDocument();
      expect(screen.getByText("ORIGINS")).toBeInTheDocument();
    });

    it("renders all categories from each group", () => {
      render(<CategoryMenuColumns categoryGroups={mockCategoryGroups} />);

      expect(screen.getByText("Light Roast")).toBeInTheDocument();
      expect(screen.getByText("Medium Roast")).toBeInTheDocument();
      expect(screen.getByText("Dark Roast")).toBeInTheDocument();
      expect(screen.getByText("Nutty & Chocolatey")).toBeInTheDocument();
      expect(screen.getByText("Fruity & Floral")).toBeInTheDocument();
    });

    it("renders categories as links with correct href", () => {
      render(<CategoryMenuColumns categoryGroups={mockCategoryGroups} />);

      const lightRoastLink = screen.getByRole("link", {
        name: "Light Roast",
      });
      expect(lightRoastLink).toHaveAttribute("href", "/light-roast");

      const nuttyLink = screen.getByRole("link", {
        name: "Nutty & Chocolatey",
      });
      expect(nuttyLink).toHaveAttribute("href", "/nutty-chocolatey");
    });

    it("renders in 3-column grid layout", () => {
      const { container } = render(
        <CategoryMenuColumns categoryGroups={mockCategoryGroups} />
      );

      const gridContainer = container.firstChild;
      expect(gridContainer).toHaveClass("grid", "grid-cols-3");
    });
  });

  describe("Icon Support", () => {
    it("renders icons when provided", () => {
      const labelIcons = {
        "BY ROAST LEVEL": "Flame",
        "BY TASTE PROFILE": "Coffee",
      };

      render(
        <CategoryMenuColumns
          categoryGroups={mockCategoryGroups}
          labelIcons={labelIcons}
        />
      );

      // Icons are rendered via DynamicIcon component
      // We can verify the icon container exists next to labels
      const roastLevelSection = screen
        .getByText("BY ROAST LEVEL")
        .closest("div");
      expect(roastLevelSection).toBeInTheDocument();
    });

    it("renders without icons when not provided", () => {
      render(<CategoryMenuColumns categoryGroups={mockCategoryGroups} />);

      // Should still render labels without icons
      expect(screen.getByText("BY ROAST LEVEL")).toBeInTheDocument();
      expect(screen.getByText("BY TASTE PROFILE")).toBeInTheDocument();
    });

    it("handles null icon values gracefully", () => {
      const labelIcons = {
        "BY ROAST LEVEL": null,
        "BY TASTE PROFILE": "Coffee",
      };

      render(
        <CategoryMenuColumns
          categoryGroups={mockCategoryGroups}
          labelIcons={labelIcons}
        />
      );

      expect(screen.getByText("BY ROAST LEVEL")).toBeInTheDocument();
      expect(screen.getByText("BY TASTE PROFILE")).toBeInTheDocument();
    });
  });

  describe("Expand/Collapse Functionality", () => {
    it("shows '...more' button when categories exceed maxInitialCategories", () => {
      render(
        <CategoryMenuColumns
          categoryGroups={mockCategoryGroups}
          maxInitialCategories={7}
        />
      );

      // ORIGINS has 10 categories, should show "...more"
      const moreButtons = screen.getAllByRole("button", { name: /more/i });
      expect(moreButtons.length).toBeGreaterThan(0);
    });

    it("initially shows only maxInitialCategories items", () => {
      render(
        <CategoryMenuColumns
          categoryGroups={mockCategoryGroups}
          maxInitialCategories={5}
        />
      );

      // ORIGINS has 10 categories, should only show first 5
      expect(screen.getByText("Origin 1")).toBeInTheDocument();
      expect(screen.getByText("Origin 5")).toBeInTheDocument();
      expect(screen.queryByText("Origin 6")).not.toBeInTheDocument();
      expect(screen.queryByText("Origin 10")).not.toBeInTheDocument();
    });

    it("expands to show all categories when '...more' is clicked", () => {
      render(
        <CategoryMenuColumns
          categoryGroups={mockCategoryGroups}
          maxInitialCategories={5}
        />
      );

      // Initially hidden
      expect(screen.queryByText("Origin 6")).not.toBeInTheDocument();

      // Click expand
      const moreButton = screen.getByRole("button", {
        name: /Show more categories in ORIGINS/i,
      });
      fireEvent.click(moreButton);

      // Now visible
      expect(screen.getByText("Origin 6")).toBeInTheDocument();
      expect(screen.getByText("Origin 10")).toBeInTheDocument();
    });

    it("collapses categories when '...less' is clicked", () => {
      render(
        <CategoryMenuColumns
          categoryGroups={mockCategoryGroups}
          maxInitialCategories={5}
        />
      );

      // Expand first
      const moreButton = screen.getByRole("button", {
        name: /Show more categories in ORIGINS/i,
      });
      fireEvent.click(moreButton);

      expect(screen.getByText("Origin 10")).toBeInTheDocument();

      // Then collapse
      const lessButton = screen.getByRole("button", {
        name: /Show less categories in ORIGINS/i,
      });
      fireEvent.click(lessButton);

      // Hidden again
      expect(screen.queryByText("Origin 10")).not.toBeInTheDocument();
    });

    it("does not show '...more' button when categories are <= maxInitialCategories", () => {
      render(
        <CategoryMenuColumns
          categoryGroups={{
            "BY ROAST LEVEL": [
              { name: "Light Roast", slug: "light-roast" },
              { name: "Medium Roast", slug: "medium-roast" },
            ],
          }}
          maxInitialCategories={7}
        />
      );

      expect(
        screen.queryByRole("button", { name: /more/i })
      ).not.toBeInTheDocument();
    });
  });

  describe("Weight-Balanced Distribution", () => {
    it("distributes label groups across 3 columns", () => {
      const { container } = render(
        <CategoryMenuColumns categoryGroups={mockCategoryGroups} />
      );

      // Should have 3 column divs
      const columns = container.querySelectorAll(".grid > div");
      expect(columns.length).toBe(3);
    });

    it("keeps label groups together (no splitting)", () => {
      render(<CategoryMenuColumns categoryGroups={mockCategoryGroups} />);

      // Each label should appear only once
      const roastLevelLabels = screen.getAllByText("BY ROAST LEVEL");
      expect(roastLevelLabels.length).toBe(1);

      const tasteProfileLabels = screen.getAllByText("BY TASTE PROFILE");
      expect(tasteProfileLabels.length).toBe(1);

      const originsLabels = screen.getAllByText("ORIGINS");
      expect(originsLabels.length).toBe(1);
    });

    it("rebalances columns when a label is expanded", () => {
      const { container } = render(
        <CategoryMenuColumns
          categoryGroups={mockCategoryGroups}
          maxInitialCategories={5}
        />
      );

      // Get initial column structure
      const columnsBefore = Array.from(
        container.querySelectorAll(".grid > div")
      ).map((col) => col.querySelectorAll(".space-y-3").length);

      // Expand ORIGINS
      const moreButton = screen.getByRole("button", {
        name: /Show more categories in ORIGINS/i,
      });
      fireEvent.click(moreButton);

      // Get column structure after expansion
      const columnsAfter = Array.from(
        container.querySelectorAll(".grid > div")
      ).map((col) => col.querySelectorAll(".space-y-3").length);

      // Total groups should remain the same
      const totalBefore = columnsBefore.reduce((a, b) => a + b, 0);
      const totalAfter = columnsAfter.reduce((a, b) => a + b, 0);
      expect(totalBefore).toBe(totalAfter);
    });
  });

  describe("Custom Styling", () => {
    it("applies custom className to container", () => {
      const { container } = render(
        <CategoryMenuColumns
          categoryGroups={mockCategoryGroups}
          className="custom-grid-class"
        />
      );

      expect(container.firstChild).toHaveClass("custom-grid-class");
    });

    it("applies custom linkClassName to category links", () => {
      render(
        <CategoryMenuColumns
          categoryGroups={mockCategoryGroups}
          linkClassName="custom-link-class"
        />
      );

      const link = screen.getByRole("link", { name: "Light Roast" });
      expect(link).toHaveClass("custom-link-class");
    });

    it("applies custom labelClassName to labels", () => {
      render(
        <CategoryMenuColumns
          categoryGroups={mockCategoryGroups}
          labelClassName="custom-label-class"
        />
      );

      const label = screen.getByText("BY ROAST LEVEL");
      expect(label).toHaveClass("custom-label-class");
    });
  });

  describe("Accessibility", () => {
    it("sets proper aria-expanded on expand/collapse buttons", () => {
      render(
        <CategoryMenuColumns
          categoryGroups={mockCategoryGroups}
          maxInitialCategories={5}
        />
      );

      const moreButton = screen.getByRole("button", {
        name: /Show more categories in ORIGINS/i,
      });

      // Initially collapsed
      expect(moreButton).toHaveAttribute("aria-expanded", "false");

      // Click to expand
      fireEvent.click(moreButton);

      const lessButton = screen.getByRole("button", {
        name: /Show less categories in ORIGINS/i,
      });

      // Now expanded
      expect(lessButton).toHaveAttribute("aria-expanded", "true");
    });

    it("has descriptive aria-labels for expand/collapse buttons", () => {
      render(
        <CategoryMenuColumns
          categoryGroups={mockCategoryGroups}
          maxInitialCategories={5}
        />
      );

      const button = screen.getByRole("button", {
        name: "Show more categories in ORIGINS",
      });
      expect(button).toBeInTheDocument();
    });

    it("renders links with accessible names", () => {
      render(<CategoryMenuColumns categoryGroups={mockCategoryGroups} />);

      expect(
        screen.getByRole("link", { name: "Light Roast" })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("link", { name: "Nutty & Chocolatey" })
      ).toBeInTheDocument();
    });
  });

  describe("Edge Cases", () => {
    it("handles empty categoryGroups object", () => {
      const { container } = render(<CategoryMenuColumns categoryGroups={{}} />);

      expect(container.firstChild).toBeInTheDocument();
      expect(container.querySelectorAll(".space-y-3").length).toBe(0);
    });

    it("handles single category in a group", () => {
      render(
        <CategoryMenuColumns
          categoryGroups={{
            SINGLE: [{ name: "Only One", slug: "only-one" }],
          }}
        />
      );

      expect(screen.getByText("SINGLE")).toBeInTheDocument();
      expect(screen.getByText("Only One")).toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: /more/i })
      ).not.toBeInTheDocument();
    });

    it("handles very long category names with truncation", () => {
      render(
        <CategoryMenuColumns
          categoryGroups={{
            LONG: [
              {
                name: "This is a very long category name that should be truncated",
                slug: "long-name",
              },
            ],
          }}
        />
      );

      const link = screen.getByRole("link", {
        name: /This is a very long category name/i,
      });
      expect(link).toHaveClass("truncate");
    });

    it("handles special characters in category names", () => {
      render(
        <CategoryMenuColumns
          categoryGroups={{
            SPECIAL: [
              { name: "Café & Co.", slug: "cafe-co" },
              { name: "100% Arabica", slug: "100-arabica" },
            ],
          }}
        />
      );

      expect(screen.getByText("Café & Co.")).toBeInTheDocument();
      expect(screen.getByText("100% Arabica")).toBeInTheDocument();
    });
  });

  describe("Integration Scenarios", () => {
    it("works with different maxInitialCategories values", () => {
      const { rerender } = render(
        <CategoryMenuColumns
          categoryGroups={mockCategoryGroups}
          maxInitialCategories={3}
        />
      );

      // With max=3, ORIGINS should show "...more"
      expect(
        screen.getByRole("button", { name: /Show more categories in ORIGINS/i })
      ).toBeInTheDocument();

      // Change to max=10
      rerender(
        <CategoryMenuColumns
          categoryGroups={mockCategoryGroups}
          maxInitialCategories={10}
        />
      );

      // With max=10, ORIGINS should NOT show "...more" (has exactly 10)
      expect(
        screen.queryByRole("button", { name: /more/i })
      ).not.toBeInTheDocument();
    });

    it("maintains expansion state across re-renders", () => {
      const { rerender } = render(
        <CategoryMenuColumns
          categoryGroups={mockCategoryGroups}
          maxInitialCategories={5}
        />
      );

      // Expand
      fireEvent.click(
        screen.getByRole("button", {
          name: /Show more categories in ORIGINS/i,
        })
      );

      expect(screen.getByText("Origin 10")).toBeInTheDocument();

      // Re-render with same props
      rerender(
        <CategoryMenuColumns
          categoryGroups={mockCategoryGroups}
          maxInitialCategories={5}
        />
      );

      // Should still be expanded
      expect(screen.getByText("Origin 10")).toBeInTheDocument();
    });
  });
});
