import { CategoryMenuColumns } from "@/components/app-components/CategoryMenuColumns";

/**
 * Test/demo page for CategoryMenuColumns component
 * Navigate to /test/category-columns to view
 *
 * This page demonstrates the weight-balanced distribution algorithm
 * that keeps label groups together while balancing visual height.
 */
export default function CategoryColumnsTestPage() {
  // Test data with various sizes to demonstrate balancing
  const testCategoryGroups = {
    "BY ROAST LEVEL": [
      { name: "Light Roast", slug: "light-roast" },
      { name: "Medium Roast", slug: "medium-roast" },
      { name: "Dark Roast", slug: "dark-roast" },
    ],
    "BY TASTE PROFILE": [
      { name: "Nutty & Chocolatey", slug: "nutty-chocolatey" },
      { name: "Fruity & Floral", slug: "fruity-floral" },
      { name: "Spicy & Earthy", slug: "spicy-earthy" },
    ],
    ORIGINS: [
      { name: "Central America", slug: "central-america" },
      { name: "Islands", slug: "islands" },
      { name: "Africa", slug: "africa" },
      { name: "Asia", slug: "asia" },
      { name: "South America", slug: "south-america" },
      { name: "Caribbean", slug: "caribbean" },
      { name: "Pacific", slug: "pacific" },
      { name: "Middle East", slug: "middle-east" },
      { name: "Australia", slug: "australia" },
      { name: "Hawaii", slug: "hawaii" },
    ],
    BLENDS: [
      { name: "Espresso Blends", slug: "espresso-blends" },
      { name: "Filter/Drip Blends", slug: "filter-drip-blends" },
      { name: "Cold Brew Blends", slug: "cold-brew-blends" },
    ],
    COLLECTIONS: [
      { name: "New Arrivals", slug: "new-arrivals" },
      { name: "Micro Lot", slug: "micro-lot" },
      { name: "Seasonal Specials", slug: "seasonal-specials" },
      { name: "Best Sellers", slug: "best-sellers" },
      { name: "Limited Edition", slug: "limited-edition" },
      { name: "Award Winners", slug: "award-winners" },
      { name: "Organic & Fair Trade", slug: "organic-fair-trade" },
      { name: "Single Origin", slug: "single-origin" },
    ],
    MERCH: [
      { name: "Drinkware", slug: "drinkware" },
      { name: "Wearables", slug: "wearables" },
      { name: "Supplies", slug: "supplies" },
      { name: "Brewing Gadgets", slug: "brewing-gadgets" },
    ],
  };

  return (
    <div className="container mx-auto px-4 py-12 space-y-12">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold mb-4">CategoryMenuColumns Demo</h1>
        <p className="text-muted-foreground mb-4">
          Weight-balanced 3-column distribution algorithm that keeps label
          groups together.
        </p>
        <div className="p-4 bg-secondary rounded-lg">
          <h3 className="font-semibold mb-2">
            ⚖️ Weight-Balanced Distribution
          </h3>
          <ul className="text-sm space-y-1 text-muted-foreground">
            <li>✅ Keeps label groups together</li>
            <li>✅ Balances by visual weight/height</li>
            <li>✅ Dynamically rebalances on expand/collapse</li>
            <li>✅ Better visual balance with mixed sizes</li>
          </ul>
        </div>
      </div>

      {/* Main Demo */}
      <section className="space-y-6">
        <div className="border-t-4 border-primary pt-6">
          <h2 className="text-3xl font-bold mb-2">Standard Product Menu</h2>
          <p className="text-muted-foreground mb-6">
            Realistic data with mixed label group sizes. Try
            expanding/collapsing to see dynamic rebalancing.
          </p>
          <div className="border rounded-lg p-6 bg-card">
            <CategoryMenuColumns categoryGroups={testCategoryGroups} />
          </div>
          <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
            <p className="text-sm font-medium mb-2">How it works:</p>
            <ol className="text-sm space-y-1 list-decimal list-inside text-muted-foreground">
              <li>
                Calculate weight: Label (1) + Visible Categories (N) + &quot;...more&quot;
                link (1 if present)
              </li>
              <li>
                For each label group, add to column with smallest current weight
              </li>
              <li>Label groups never split across columns</li>
              <li>Visual heights balanced (not strict item counts)</li>
            </ol>
          </div>
        </div>
      </section>

      {/* Edge Case */}
      <section className="space-y-6">
        <div className="border-t-4 border-purple-500 pt-6">
          <h2 className="text-3xl font-bold mb-2">
            🧪 Edge Case: Extremely Unbalanced Data
          </h2>
          <p className="text-muted-foreground mb-6">
            One label with 20 categories, others with 1-8. See how the algorithm
            handles it.
          </p>

          <div className="border rounded-lg p-6 bg-card">
            <CategoryMenuColumns
              categoryGroups={{
                Tiny: [{ name: "Single Item", slug: "single" }],
                Small: [
                  { name: "Item A", slug: "a" },
                  { name: "Item B", slug: "b" },
                ],
                Huge: Array.from({ length: 20 }, (_, i) => ({
                  name: `Category ${i + 1}`,
                  slug: `cat-${i + 1}`,
                })),
                Medium: Array.from({ length: 8 }, (_, i) => ({
                  name: `Product ${i + 1}`,
                  slug: `prod-${i + 1}`,
                })),
              }}
            />
          </div>
          <p className="text-sm text-muted-foreground italic mt-4">
            Notice: &quot;Huge&quot; label stays together in one column (collapsed with
            &quot;...more&quot;), while smaller groups fill the remaining columns to
            balance visual height.
          </p>
        </div>
      </section>

      {/* Instructions */}
      <section className="space-y-4 border rounded-lg p-6 bg-secondary">
        <h2 className="text-2xl font-semibold mb-4">🧪 Testing Instructions</h2>
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">Try these interactions:</h3>
            <ol className="space-y-2 list-decimal list-inside text-sm">
              <li>
                Expand &quot;ORIGINS&quot; (10 categories) - watch the entire group move to
                balance columns
              </li>
              <li>
                Expand &quot;COLLECTIONS&quot; (8 categories) - see dynamic rebalancing
                across all columns
              </li>
              <li>
                Collapse them back - notice groups stay together while
                rebalancing
              </li>
              <li>Observe that label groups never split mid-list</li>
            </ol>
          </div>
          <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
            <p className="font-semibold mb-2">📊 Why this approach?</p>
            <ul className="text-sm space-y-1">
              <li>
                • <strong>Better readability</strong>: Label groups stay
                semantically together
              </li>
              <li>
                • <strong>Visual balance</strong>: Heights balanced, not just
                item counts
              </li>
              <li>
                • <strong>Natural ordering</strong>: Left-to-right flow
                maintains label order
              </li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
