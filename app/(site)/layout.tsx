import fs from "fs/promises";
import path from "path";
import SiteHeaderWrapper from "@/app/(site)/_components/layout/SiteHeaderWrapper";
import SiteFooter from "@/app/(site)/_components/layout/SiteFooter";
import { SiteBannerProvider } from "@/app/(site)/_hooks/useSiteBanner";
import { SiteBannerPortal } from "@/app/(site)/_components/layout/SiteBannerPortal";
import { DemoBanner } from "@/app/(site)/_components/content/DemoBanner";
import { getStorefrontTheme } from "@/lib/config/app-settings";
import { isAIConfigured } from "@/lib/ai-client";
import { ChatPanel } from "@/app/(site)/_components/ai/ChatPanel";

// Evaluated once at module load based on NEXT_PUBLIC_BUILD_VARIANT.
// DemoBanner and its hooks never enter the React tree unless this is true.
import { IS_DEMO } from "@/lib/demo";

/** Read the Google Fonts URL for the active theme from the manifest */
async function getThemeFontsUrl(
  themeId: string
): Promise<string | null> {
  try {
    const manifestPath = path.join(
      process.cwd(),
      "public/themes/manifest.json"
    );
    const raw = await fs.readFile(manifestPath, "utf-8");
    const manifest = JSON.parse(raw);
    const entry = manifest.themes.find(
      (t: { id: string }) => t.id === themeId
    );
    return entry?.fonts?.googleFontsUrl ?? null;
  } catch {
    return null;
  }
}

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
  const [theme, aiConfigured] = await Promise.all([
    getStorefrontTheme(),
    isAIConfigured(),
  ]);
  const fontsUrl =
    theme && theme !== "default" ? await getThemeFontsUrl(theme) : null;

  return (
    <SiteBannerProvider>
      {theme && theme !== "default" && (
        <>
          {fontsUrl && <link rel="stylesheet" href={fontsUrl} />}
          <link rel="stylesheet" href={`/themes/${theme}.css`} />
        </>
      )}
      {/* Outer flex row: left column (header + content + footer) + right panel */}
      <div data-site="" className="relative flex min-h-screen">
        {/* Left column — scrolls normally */}
        <div className="flex-1 min-w-0 flex flex-col">
          {/* Demo banner - only mounts on demo instances (NEXT_PUBLIC_BUILD_VARIANT=demo) */}
          {IS_DEMO && <DemoBanner />}

          {/* Banner portal - renders above header when active */}
          <SiteBannerPortal />

          {/* Site header */}
          <SiteHeaderWrapper />

          {/* Page content */}
          <main className="flex-1 w-full">{children}</main>

          {/* Site footer */}
          <SiteFooter />
        </div>

        {/* Right column: full-height sticky chat panel (desktop) + fixed bottom sheet (mobile) */}
        {aiConfigured && <ChatPanel />}
      </div>
    </SiteBannerProvider>
  );
}
