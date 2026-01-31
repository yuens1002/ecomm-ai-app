import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import FooterCategories from "@/app/(site)/_components/navigation/FooterCategories";

describe("FooterCategories - Integration Tests", () => {
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

  describe("Rendering", () => {
    it("renders the component with default heading", () => {
      render(<FooterCategories categoryGroups={mockCategoryGroups} />);

      expect(screen.getByText("Shop")).toBeInTheDocument();
    });

    it("renders with custom heading", () => {
      render(
        <FooterCategories
          categoryGroups={mockCategoryGroups}
          productMenuText="Our Coffee Collection"
        />
      );

      expect(screen.getByText("Our Coffee Collection")).toBeInTheDocument();
    });

    it("renders all category groups using CategoryMenuColumns", () => {
      render(<FooterCategories categoryGroups={mockCategoryGroups} />);

      // All labels should be present
      expect(screen.getByText("BY ROAST LEVEL")).toBeInTheDocument();
      expect(screen.getByText("BY TASTE PROFILE")).toBeInTheDocument();
      expect(screen.getByText("ORIGINS")).toBeInTheDocument();

      // Categories should be rendered
      expect(screen.getByText("Light Roast")).toBeInTheDocument();
      expect(screen.getByText("Nutty & Chocolatey")).toBeInTheDocument();
    });

    it("renders category links with correct hrefs", () => {
      render(<FooterCategories categoryGroups={mockCategoryGroups} />);

      const lightRoastLink = screen.getByRole("link", { name: "Light Roast" });
      expect(lightRoastLink).toHaveAttribute("href", "/light-roast");

      const nuttyLink = screen.getByRole("link", {
        name: "Nutty & Chocolatey",
      });
      expect(nuttyLink).toHaveAttribute("href", "/nutty-chocolatey");
    });
  });

  describe("Icon Support", () => {
    it("renders label icons when provided", () => {
      const labelIcons = {
        "BY ROAST LEVEL": "Flame",
        "BY TASTE PROFILE": "Coffee",
        ORIGINS: "Globe",
      };

      render(
        <FooterCategories
          categoryGroups={mockCategoryGroups}
          labelIcons={labelIcons}
        />
      );

      // Labels should still be visible
      expect(screen.getByText("BY ROAST LEVEL")).toBeInTheDocument();
      expect(screen.getByText("BY TASTE PROFILE")).toBeInTheDocument();
      expect(screen.getByText("ORIGINS")).toBeInTheDocument();
    });

    it("renders without icons when labelIcons not provided", () => {
      render(<FooterCategories categoryGroups={mockCategoryGroups} />);

      // Should render successfully without icons
      expect(screen.getByText("BY ROAST LEVEL")).toBeInTheDocument();
    });

    it("handles partial labelIcons object", () => {
      const labelIcons = {
        "BY ROAST LEVEL": "Flame",
        // ORIGINS has no icon
      };

      render(
        <FooterCategories
          categoryGroups={mockCategoryGroups}
          labelIcons={labelIcons}
        />
      );

      // All labels should render
      expect(screen.getByText("BY ROAST LEVEL")).toBeInTheDocument();
      expect(screen.getByText("ORIGINS")).toBeInTheDocument();
    });
  });

  describe("CategoryMenuColumns Integration", () => {
    it("uses weight-balanced distribution from CategoryMenuColumns", () => {
      const { container } = render(
        <FooterCategories categoryGroups={mockCategoryGroups} />
      );

      // Should have the 3-column grid structure from CategoryMenuColumns
      const gridContainer = container.querySelector(".grid.grid-cols-3");
      expect(gridContainer).toBeInTheDocument();
    });

    it("supports expand/collapse functionality from CategoryMenuColumns", () => {
      render(<FooterCategories categoryGroups={mockCategoryGroups} />);

      // ORIGINS has 10 items, should show "...more" with default maxInitialCategories=7
      const moreButton = screen.getByRole("button", {
        name: /Show more categories in ORIGINS/i,
      });
      expect(moreButton).toBeInTheDocument();

      // Click to expand
      fireEvent.click(moreButton);

      // Should now show all items
      expect(screen.getByText("Origin 10")).toBeInTheDocument();
    });

    it("maintains expand/collapse state across interactions", () => {
      render(<FooterCategories categoryGroups={mockCategoryGroups} />);

      // Expand ORIGINS
      const moreButton = screen.getByRole("button", {
        name: /Show more categories in ORIGINS/i,
      });
      fireEvent.click(moreButton);

      // Verify expanded
      expect(screen.getByText("Origin 10")).toBeInTheDocument();

      // Click collapse
      const lessButton = screen.getByRole("button", {
        name: /Show less categories in ORIGINS/i,
      });
      fireEvent.click(lessButton);

      // Verify collapsed
      expect(screen.queryByText("Origin 10")).not.toBeInTheDocument();
    });
  });

  describe("Edge Cases", () => {
    it("handles empty categoryGroups", () => {
      render(<FooterCategories categoryGroups={{}} />);

      expect(screen.getByText("Shop")).toBeInTheDocument();
    });

    it("handles single category group", () => {
      render(
        <FooterCategories
          categoryGroups={{
            SINGLE: [{ name: "Only One", slug: "only-one" }],
          }}
        />
      );

      expect(screen.getByText("SINGLE")).toBeInTheDocument();
      expect(screen.getByText("Only One")).toBeInTheDocument();
    });

    it("handles very large category groups", () => {
      const largeCategoryGroups = {
        HUGE: Array.from({ length: 50 }, (_, i) => ({
          name: `Category ${i + 1}`,
          slug: `category-${i + 1}`,
        })),
      };

      render(<FooterCategories categoryGroups={largeCategoryGroups} />);

      // Should only show first 7 initially
      expect(screen.getByText("Category 1")).toBeInTheDocument();
      expect(screen.getByText("Category 7")).toBeInTheDocument();
      expect(screen.queryByText("Category 8")).not.toBeInTheDocument();

      // Should have "...more" button
      expect(
        screen.getByRole("button", { name: /Show more categories in HUGE/i })
      ).toBeInTheDocument();
    });
  });

  describe("Layout and Styling", () => {
    it("applies proper semantic HTML structure", () => {
      const { container } = render(
        <FooterCategories categoryGroups={mockCategoryGroups} />
      );

      // Should have a heading
      expect(
        container.querySelector("h3.text-lg.font-semibold")
      ).toBeInTheDocument();
    });

    it("uses CategoryMenuColumns with footer context", () => {
      render(<FooterCategories categoryGroups={mockCategoryGroups} />);

      // CategoryMenuColumns should be present with all its functionality
      expect(screen.getByText("BY ROAST LEVEL")).toBeInTheDocument();
      expect(screen.getByText("BY TASTE PROFILE")).toBeInTheDocument();
      expect(screen.getByText("ORIGINS")).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("has accessible heading hierarchy", () => {
      render(<FooterCategories categoryGroups={mockCategoryGroups} />);

      const heading = screen.getByRole("heading", { name: "Shop" });
      expect(heading.tagName).toBe("H3");
    });

    it("has accessible links for all categories", () => {
      render(<FooterCategories categoryGroups={mockCategoryGroups} />);

      const links = screen.getAllByRole("link");
      expect(links.length).toBeGreaterThan(0);

      links.forEach((link) => {
        expect(link).toHaveAttribute("href");
      });
    });

    it("has accessible expand/collapse buttons", () => {
      render(<FooterCategories categoryGroups={mockCategoryGroups} />);

      const buttons = screen.getAllByRole("button");
      buttons.forEach((button) => {
        expect(button).toHaveAttribute("aria-expanded");
        expect(button).toHaveAttribute("aria-label");
      });
    });
  });

  describe("Integration with SiteFooter", () => {
    it("maintains consistent category rendering across header and footer", () => {
      render(<FooterCategories categoryGroups={mockCategoryGroups} />);

      // Same categories as would appear in header
      expect(screen.getByText("Light Roast")).toBeInTheDocument();
      expect(screen.getByText("Medium Roast")).toBeInTheDocument();
      expect(screen.getByText("Dark Roast")).toBeInTheDocument();
    });

    it("uses same link structure as header navigation", () => {
      render(<FooterCategories categoryGroups={mockCategoryGroups} />);

      const footerLink = screen.getByRole("link", { name: "Light Roast" });
      expect(footerLink).toHaveAttribute("href", "/light-roast");
    });
  });
});
