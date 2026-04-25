import { prisma } from "@/lib/prisma";
import { PageTitle } from "@/app/admin/_components/forms/PageTitle";
import { SearchSettingsForm } from "./_components/SearchSettingsForm";

const KEY_HEADING = "search_drawer_chips_heading";
const KEY_CHIP_CATEGORIES = "search_drawer_chip_categories";
const KEY_CURATED_CATEGORY = "search_drawer_curated_category";

const DEFAULT_HEADING = "Top Categories";

interface InitialSettings {
  chipsHeading: string;
  chipCategories: string[];
  curatedCategory: string | null;
}

async function getInitialSettings(): Promise<InitialSettings> {
  const rows = await prisma.siteSettings.findMany({
    where: {
      key: { in: [KEY_HEADING, KEY_CHIP_CATEGORIES, KEY_CURATED_CATEGORY] },
    },
    select: { key: true, value: true },
  });

  const map = rows.reduce<Record<string, string>>((acc, row) => {
    acc[row.key] = row.value;
    return acc;
  }, {});

  let chipCategories: string[] = [];
  if (map[KEY_CHIP_CATEGORIES]) {
    try {
      const parsed = JSON.parse(map[KEY_CHIP_CATEGORIES]) as unknown;
      if (Array.isArray(parsed) && parsed.every((s) => typeof s === "string")) {
        chipCategories = parsed as string[];
      }
    } catch {
      // ignore
    }
  }

  return {
    chipsHeading: map[KEY_HEADING] || DEFAULT_HEADING,
    chipCategories,
    curatedCategory: map[KEY_CURATED_CATEGORY] || null,
  };
}

async function getCategoryOptions() {
  return prisma.category.findMany({
    select: { id: true, name: true, slug: true },
    orderBy: { name: "asc" },
  });
}

export default async function SearchSettingsPage() {
  const [settings, categories] = await Promise.all([
    getInitialSettings(),
    getCategoryOptions(),
  ]);

  return (
    <div className="space-y-8">
      <PageTitle
        title="Search Settings"
        subtitle="Configure the search drawer's discovery surface — chip row and curated products section."
      />

      <SearchSettingsForm initialSettings={settings} categories={categories} />
    </div>
  );
}
