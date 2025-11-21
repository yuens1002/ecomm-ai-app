import { getAllCategories } from "@/lib/data";
import { auth } from "@/auth";
import { isAdmin } from "@/lib/admin";
import SiteHeader from "@components/app-components/SiteHeader";

/**
 * SiteHeaderWrapper is a Server Component responsible for fetching global,
 * persistent data (like navigation categories and user session) needed by the SiteHeader.
 * It ensures the client component (SiteHeader) receives data as props,
 * keeping the data fetching logic on the server.
 */
export default async function SiteHeaderWrapper() {
  // Fetch all data for the navigation menu in parallel
  const [categories, session, userIsAdmin] = await Promise.all([
    getAllCategories(),
    auth(),
    isAdmin(),
  ]);

  // Handle case where no categories are found (e.g., first deployment/empty DB)
  if (!categories) {
    // Return an empty array to prevent map errors in SiteHeader
    return (
      <SiteHeader
        categories={[]}
        originCategories={[]}
        roastCategories={[]}
        collectionCategories={[]}
        user={session?.user || null}
        isAdmin={userIsAdmin}
      />
    );
  }

  // Filter categories by label
  const originCategories = categories.filter((c) => c.label === "Origins");
  const roastCategories = categories.filter((c) => c.label === "Roast Level");
  const collectionCategories = categories.filter(
    (c) => c.label === "Collections"
  );

  // Pass the fetched, non-stale categories and user down to the client component
  return (
    <SiteHeader
      categories={categories}
      originCategories={originCategories}
      roastCategories={roastCategories}
      collectionCategories={collectionCategories}
      user={session?.user || null}
      isAdmin={userIsAdmin}
    />
  );
}
