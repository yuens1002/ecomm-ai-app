import { getAllCategories } from "@/lib/data";
import { auth } from "@/auth";
import SiteHeader from "@components/app-components/SiteHeader";
import { getPagesForHeader } from "@/app/actions";

/**
 * SiteHeaderWrapper is a Server Component responsible for fetching global,
 * persistent data (like navigation categories and user session) needed by the SiteHeader.
 * It ensures the client component (SiteHeader) receives data as props,
 * keeping the data fetching logic on the server.
 */
export default async function SiteHeaderWrapper() {
  // Fetch all data for the navigation menu in parallel
  const [categories, session, headerPages] = await Promise.all([
    getAllCategories(),
    auth(),
    getPagesForHeader(),
  ]);

  // Handle case where no categories are found (e.g., first deployment/empty DB)
  if (!categories || categories.length === 0) {
    return (
      <SiteHeader
        categoryGroups={{}}
        user={session?.user || null}
        pages={headerPages}
      />
    );
  }

  // Sort categories by order field, then group by label from SiteSettings
  const sortedCategories = [...categories].sort((a, b) => a.order - b.order);

  // Dynamically group categories by their labelSetting.value (maintaining sort order)
  const categoryGroups = sortedCategories.reduce(
    (acc, category) => {
      const label = category.labelSetting.value;
      if (!acc[label]) {
        acc[label] = [];
      }
      acc[label].push(category);
      return acc;
    },
    {} as Record<string, typeof categories>
  );

  // Pass the dynamically grouped categories and pages to the client component
  return (
    <SiteHeader
      categoryGroups={categoryGroups}
      user={session?.user || null}
      pages={headerPages}
    />
  );
}
