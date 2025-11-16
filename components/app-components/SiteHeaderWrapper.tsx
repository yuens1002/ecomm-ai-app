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
  // Fetch all categories for the navigation menu
  const categories = await getAllCategories();

  // Get current user session
  const session = await auth();

  // Check if user is admin
  const userIsAdmin = await isAdmin();

  // Handle case where no categories are found (e.g., first deployment/empty DB)
  if (!categories) {
    // Return an empty array to prevent map errors in SiteHeader
    return (
      <SiteHeader
        categories={[]}
        user={session?.user || null}
        isAdmin={userIsAdmin}
      />
    );
  }

  // Pass the fetched, non-stale categories and user down to the client component
  return (
    <SiteHeader
      categories={categories}
      user={session?.user || null}
      isAdmin={userIsAdmin}
    />
  );
}
