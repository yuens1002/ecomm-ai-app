import SiteHeaderWrapper from "@/components/app-components/SiteHeaderWrapper";
import SiteFooter from "@components/app-components/SiteFooter";
import { SiteBannerProvider } from "@/hooks/useSiteBanner";
import { SiteBannerPortal } from "@/components/app-components/SiteBannerPortal";

/**
 * Layout for all customer-facing (site) routes.
 * Wraps pages with the site header and footer.
 */
export default function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SiteBannerProvider>
      <div className="relative flex min-h-screen flex-col">
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
