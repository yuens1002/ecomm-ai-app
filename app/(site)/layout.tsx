import SiteHeaderWrapper from "@/app/(site)/_components/layout/SiteHeaderWrapper";
import SiteFooter from "@/app/(site)/_components/layout/SiteFooter";
import { SiteBannerProvider } from "@/app/(site)/_hooks/useSiteBanner";
import { SiteBannerPortal } from "@/app/(site)/_components/layout/SiteBannerPortal";
import { DemoBanner } from "@/app/(site)/_components/content/DemoBanner";
import { getStorefrontTheme } from "@/lib/config/app-settings";

/**
 * Layout for all customer-facing (site) routes.
 * Wraps pages with the site header and footer.
 * Loads the active storefront theme CSS (if any) via a server-rendered <link> tag.
 */
export default async function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const theme = await getStorefrontTheme();

  return (
    <SiteBannerProvider>
      {theme && theme !== "default" && (
        <link rel="stylesheet" href={`/themes/${theme}.css`} />
      )}
      <div className="relative flex min-h-screen flex-col">
        {/* Demo banner - only shows when NEXT_PUBLIC_DEMO_MODE=true */}
        <DemoBanner />

        {/* Banner portal - renders above header when active */}
        <SiteBannerPortal />

        {/* Site header */}
        <SiteHeaderWrapper />

        {/* Page content */}
        <main className="flex-1 w-full">{children}</main>

        {/* Site footer */}
        <SiteFooter />
      </div>
    </SiteBannerProvider>
  );
}
