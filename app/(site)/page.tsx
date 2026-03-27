import { auth } from "@/auth";
import {
  getFeaturedProducts,
  getHomeRecommendations,
  getPublicSiteSettings,
} from "@/lib/data";
import { isAIConfigured, isAIFeatureEnabled } from "@/lib/ai-client";
import HomeAiSection from "@/app/(site)/_components/ai/HomeAiSection";
import FeaturedProducts from "@/app/(site)/_components/product/FeaturedProducts";
import RecommendationsSection from "@/app/(site)/_components/product/RecommendationsSection";

export default async function Home() {
  const [session, featuredProducts, settings, aiConfigured, chatEnabled] = await Promise.all([
    auth(),
    getFeaturedProducts(),
    getPublicSiteSettings(),
    isAIConfigured(),
    isAIFeatureEnabled("chat"),
  ]);

  const userId = session?.user?.id;

  // Fetch recommendations (depends on userId from auth)
  const recommendations = await getHomeRecommendations(userId);

  return (
    <>
      {aiConfigured && chatEnabled && (
        <HomeAiSection
          userEmail={session?.user?.email || undefined}
          userName={session?.user?.name || undefined}
          isAuthenticated={!!session?.user}
        />
      )}

      <RecommendationsSection
        products={recommendations.products}
        isPersonalized={recommendations.isPersonalized}
        source={recommendations.source}
        userPreferences={recommendations.userPreferences}
        personalizedHeading={settings.homepageRecommendationsPersonalizedHeading}
        trendingHeading={settings.homepageRecommendationsTrendingHeading}
        trendingDescription={settings.homepageRecommendationsTrendingDescription}
        priorityCount={1}
      />

      <FeaturedProducts
        products={featuredProducts}
        heading={settings.homepageFeaturedHeading}
      />
    </>
  );
}
