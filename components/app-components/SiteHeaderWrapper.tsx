import {
  getAllCategories,
  getAllOrigins,
  getRoastLevels,
  getSpecialCategories,
} from "@/lib/data";
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
  const [categories, origins, session, userIsAdmin] = await Promise.all([
    getAllCategories(),
    getAllOrigins(),
    auth(),
    isAdmin(),
  ]);

  const roastLevels = getRoastLevels();
  const specialCategories = getSpecialCategories();

  // Handle case where no categories are found (e.g., first deployment/empty DB)
  if (!categories) {
    // Return an empty array to prevent map errors in SiteHeader
    return (
      <SiteHeader
        categories={[]}
        origins={origins || []}
        roastLevels={roastLevels}
        specialCategories={specialCategories}
        user={session?.user || null}
        isAdmin={userIsAdmin}
      />
    );
  }

  // Pass the fetched, non-stale categories and user down to the client component
  return (
    <SiteHeader
      categories={categories}
      origins={origins}
      roastLevels={roastLevels}
      specialCategories={specialCategories}
      user={session?.user || null}
      isAdmin={userIsAdmin}
    />
  );
}
