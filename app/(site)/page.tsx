import { auth } from "@/auth";
import {
  getFeaturedProducts,
  getHomeRecommendations,
  getPublicSiteSettings,
} from "@/lib/data";
import { HomeHero } from "@/app/(site)/_components/content/HomeHero";
import FeaturedProducts from "@/app/(site)/_components/product/FeaturedProducts";
import RecommendationsSection from "@/app/(site)/_components/product/RecommendationsSection";

export default async function Home() {
  const [session, featuredProducts, settings] = await Promise.all([
    auth(),
    getFeaturedProducts(),
    getPublicSiteSettings(),
  ]);

  const userId = session?.user?.id;

  // Fetch recommendations (depends on userId from auth)
  const recommendations = await getHomeRecommendations(userId);

  return (
    <>
      <HomeHero
        storeName={settings.storeName}
        heroType={settings.homepageHeroType}
        heroSlides={settings.homepageHeroSlides}
        heroVideoUrl={settings.homepageHeroVideoUrl}
        heroVideoPosterUrl={settings.homepageHeroVideoPosterUrl}
        heroHeading={settings.homepageHeroHeading}
        heroTagline={settings.homepageHeroTagline}
      />

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
