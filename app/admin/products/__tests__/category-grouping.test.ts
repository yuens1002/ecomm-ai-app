/**
 * Test suite for category grouping and deduplication logic
 * Tests the logic used in ProductFormClient to group categories by labels
 */

interface CategoryLabel {
  id: string;
  name: string;
  icon: string | null;
  order: number;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  labels: CategoryLabel[];
}

type CategoryWithLabelOrder = {
  category: Category;
  order: number;
};

/**
 * Groups categories by their labels with proper deduplication
 * This is the logic extracted from ProductFormClient
 */
function groupCategoriesByLabels(categories: Category[]) {
  const labelGroups = new Map<
    string,
    {
      labelId: string;
      labelName: string;
      labelIcon: string | null;
      labelOrder: number;
      categories: CategoryWithLabelOrder[];
    }
  >();

  const displayedCategoryIds = new Set<string>();

  // Stage 1: Build label groups with all categories
  categories.forEach((category) => {
    if (category.labels.length === 0) {
      // Orphaned category - add to "Unlabeled*" group
      if (!labelGroups.has("unlabeled")) {
        labelGroups.set("unlabeled", {
          labelId: "unlabeled",
          labelName: "Unlabeled*",
          labelIcon: null,
          labelOrder: 999,
          categories: [],
        });
      }
      labelGroups.get("unlabeled")!.categories.push({
        category,
        order: 0,
      });
    } else {
      // Add to each label it belongs to
      category.labels.forEach((label) => {
        if (!labelGroups.has(label.id)) {
          labelGroups.set(label.id, {
            labelId: label.id,
            labelName: label.name,
            labelIcon: label.icon,
            labelOrder: label.order,
            categories: [],
          });
        }
        labelGroups.get(label.id)!.categories.push({
          category,
          order: label.order,
        });
      });
    }
  });

  // Stage 2-5: Sort, deduplicate, and filter
  const sortedLabelGroups = Array.from(labelGroups.values())
    .sort((a, b) => a.labelOrder - b.labelOrder)
    .map((group) => {
      // Stage 2: Deduplicate within each label group
      const seenIds = new Set<string>();
      const uniqueCategories = group.categories.filter(({ category }) => {
        if (seenIds.has(category.id)) return false;
        seenIds.add(category.id);
        return true;
      });
      // Sort by order within label
      uniqueCategories.sort((a, b) => a.order - b.order);
      return { ...group, categories: uniqueCategories };
    })
    .map((group) => {
      // Stage 3: Deduplicate across labels (first-seen wins)
      const filteredCategories = group.categories.filter(({ category }) => {
        if (displayedCategoryIds.has(category.id)) return false;
        displayedCategoryIds.add(category.id);
        return true;
      });
      return { ...group, categories: filteredCategories };
    })
    .filter((group) => group.categories.length > 0); // Stage 4: Remove empty groups

  return sortedLabelGroups;
}

describe("Category Grouping and Deduplication", () => {
  describe("Case 1: Category appears only once within any given label", () => {
    it("should deduplicate categories within the same label", () => {
      const categories: Category[] = [
        {
          id: "cat1",
          name: "Light Roast",
          slug: "light-roast",
          labels: [
            { id: "label1", name: "By Roast Level", icon: null, order: 1 },
            { id: "label1", name: "By Roast Level", icon: null, order: 1 }, // Duplicate label attachment
          ],
        },
      ];

      const result = groupCategoriesByLabels(categories);

      expect(result).toHaveLength(1);
      expect(result[0].labelName).toBe("By Roast Level");
      expect(result[0].categories).toHaveLength(1);
      expect(result[0].categories[0].category.name).toBe("Light Roast");
    });

    it("should handle categories with same name but different IDs in same label", () => {
      const categories: Category[] = [
        {
          id: "cat1",
          name: "Nutty & Chocolatey",
          slug: "chocolatey",
          labels: [
            { id: "label1", name: "By Taste Profile", icon: null, order: 2 },
          ],
        },
        {
          id: "cat2",
          name: "Nutty & Chocolatey", // Same name, different ID and slug
          slug: "nutty-chocolatey",
          labels: [
            { id: "label1", name: "By Taste Profile", icon: null, order: 2 },
          ],
        },
      ];

      const result = groupCategoriesByLabels(categories);

      expect(result).toHaveLength(1);
      expect(result[0].labelName).toBe("By Taste Profile");
      // Both categories should appear since they have different IDs
      // This exposes the data integrity issue!
      expect(result[0].categories).toHaveLength(2);
      expect(result[0].categories[0].category.name).toBe("Nutty & Chocolatey");
      expect(result[0].categories[1].category.name).toBe("Nutty & Chocolatey");
    });
  });

  describe("Case 2: Category belonging to multiple labels appears at first label only", () => {
    it("should show category only in its first label by order", () => {
      const categories: Category[] = [
        {
          id: "cat1",
          name: "Light Roast",
          slug: "light-roast",
          labels: [
            { id: "label1", name: "By Roast Level", icon: null, order: 1 },
            { id: "label2", name: "Popular", icon: null, order: 5 },
          ],
        },
      ];

      const result = groupCategoriesByLabels(categories);

      expect(result).toHaveLength(1); // Only first label has the category
      expect(result[0].labelName).toBe("By Roast Level");
      expect(result[0].categories).toHaveLength(1);
      expect(result[0].categories[0].category.name).toBe("Light Roast");
    });

    it("should respect label order when deduplicating across labels", () => {
      const categories: Category[] = [
        {
          id: "cat1",
          name: "Espresso Blend",
          slug: "espresso-blend",
          labels: [
            { id: "label1", name: "Blends", icon: null, order: 4 },
            { id: "label2", name: "Collections", icon: null, order: 5 },
          ],
        },
      ];

      const result = groupCategoriesByLabels(categories);

      expect(result).toHaveLength(1);
      expect(result[0].labelName).toBe("Blends"); // Lower order wins
      expect(result[0].categories[0].category.slug).toBe("espresso-blend");
    });
  });

  describe("Case 3: All categories are listed", () => {
    it("should list all unique categories across all labels", () => {
      const categories: Category[] = [
        {
          id: "cat1",
          name: "Light Roast",
          slug: "light-roast",
          labels: [
            { id: "label1", name: "By Roast Level", icon: null, order: 1 },
          ],
        },
        {
          id: "cat2",
          name: "Medium Roast",
          slug: "medium-roast",
          labels: [
            { id: "label1", name: "By Roast Level", icon: null, order: 1 },
          ],
        },
        {
          id: "cat3",
          name: "Ethiopia",
          slug: "ethiopia",
          labels: [{ id: "label2", name: "Origins", icon: null, order: 3 }],
        },
      ];

      const result = groupCategoriesByLabels(categories);

      // Count total categories across all label groups
      const totalCategories = result.reduce(
        (sum, group) => sum + group.categories.length,
        0
      );

      expect(totalCategories).toBe(3);

      // Verify each category appears exactly once
      const allCategoryIds = result.flatMap((group) =>
        group.categories.map((c) => c.category.id)
      );
      expect(new Set(allCategoryIds).size).toBe(3);
      expect(allCategoryIds).toContain("cat1");
      expect(allCategoryIds).toContain("cat2");
      expect(allCategoryIds).toContain("cat3");
    });

    it("should include orphaned categories in Unlabeled* group", () => {
      const categories: Category[] = [
        {
          id: "cat1",
          name: "Light Roast",
          slug: "light-roast",
          labels: [
            { id: "label1", name: "By Roast Level", icon: null, order: 1 },
          ],
        },
        {
          id: "cat2",
          name: "Orphan Category",
          slug: "orphan",
          labels: [], // No label
        },
      ];

      const result = groupCategoriesByLabels(categories);

      expect(result).toHaveLength(2);

      const unlabeledGroup = result.find((g) => g.labelName === "Unlabeled*");
      expect(unlabeledGroup).toBeDefined();
      expect(unlabeledGroup!.categories).toHaveLength(1);
      expect(unlabeledGroup!.categories[0].category.name).toBe(
        "Orphan Category"
      );
      expect(unlabeledGroup!.labelOrder).toBe(999); // Should be last
    });
  });

  describe("Case 4: All labels are listed", () => {
    it("should list all labels that have categories", () => {
      const categories: Category[] = [
        {
          id: "cat1",
          name: "Light Roast",
          slug: "light-roast",
          labels: [
            { id: "label1", name: "By Roast Level", icon: null, order: 1 },
          ],
        },
        {
          id: "cat2",
          name: "Ethiopia",
          slug: "ethiopia",
          labels: [{ id: "label2", name: "Origins", icon: null, order: 3 }],
        },
        {
          id: "cat3",
          name: "Espresso Blend",
          slug: "espresso-blend",
          labels: [{ id: "label3", name: "Blends", icon: null, order: 4 }],
        },
      ];

      const result = groupCategoriesByLabels(categories);

      expect(result).toHaveLength(3);
      expect(result[0].labelName).toBe("By Roast Level");
      expect(result[1].labelName).toBe("Origins");
      expect(result[2].labelName).toBe("Blends");
    });

    it("should not list labels that become empty after deduplication", () => {
      const categories: Category[] = [
        {
          id: "cat1",
          name: "Light Roast",
          slug: "light-roast",
          labels: [
            { id: "label1", name: "By Roast Level", icon: null, order: 1 },
            { id: "label2", name: "Popular", icon: null, order: 5 }, // Will be empty after dedup
          ],
        },
      ];

      const result = groupCategoriesByLabels(categories);

      expect(result).toHaveLength(1);
      expect(result[0].labelName).toBe("By Roast Level");
      // "Popular" label should not appear because its only category was already claimed
    });

    it("should sort labels by order field", () => {
      const categories: Category[] = [
        {
          id: "cat1",
          name: "Espresso Blend",
          slug: "espresso-blend",
          labels: [{ id: "label3", name: "Blends", icon: null, order: 4 }],
        },
        {
          id: "cat2",
          name: "Light Roast",
          slug: "light-roast",
          labels: [
            { id: "label1", name: "By Roast Level", icon: null, order: 1 },
          ],
        },
        {
          id: "cat3",
          name: "Ethiopia",
          slug: "ethiopia",
          labels: [{ id: "label2", name: "Origins", icon: null, order: 3 }],
        },
      ];

      const result = groupCategoriesByLabels(categories);

      expect(result[0].labelName).toBe("By Roast Level"); // order 1
      expect(result[1].labelName).toBe("Origins"); // order 3
      expect(result[2].labelName).toBe("Blends"); // order 4
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty category array", () => {
      const result = groupCategoriesByLabels([]);
      expect(result).toHaveLength(0);
    });

    it("should handle multiple categories with multiple overlapping labels", () => {
      const categories: Category[] = [
        {
          id: "cat1",
          name: "Light Roast",
          slug: "light-roast",
          labels: [
            { id: "label1", name: "By Roast Level", icon: null, order: 1 },
            { id: "label2", name: "Popular", icon: null, order: 5 },
          ],
        },
        {
          id: "cat2",
          name: "Medium Roast",
          slug: "medium-roast",
          labels: [
            { id: "label1", name: "By Roast Level", icon: null, order: 1 },
          ],
        },
        {
          id: "cat3",
          name: "Ethiopia",
          slug: "ethiopia",
          labels: [
            { id: "label3", name: "Origins", icon: null, order: 3 },
            { id: "label2", name: "Popular", icon: null, order: 5 },
          ],
        },
      ];

      const result = groupCategoriesByLabels(categories);

      // By Roast Level (order 1): Light Roast, Medium Roast
      // Origins (order 3): Ethiopia
      // Popular (order 5): empty (both Light Roast and Ethiopia already claimed)

      expect(result).toHaveLength(2); // Popular should be filtered out
      expect(result[0].labelName).toBe("By Roast Level");
      expect(result[0].categories).toHaveLength(2);
      expect(result[1].labelName).toBe("Origins");
      expect(result[1].categories).toHaveLength(1);
    });
  });
});
