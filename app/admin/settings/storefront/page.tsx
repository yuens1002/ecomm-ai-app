import { PageTitle } from "@/app/admin/_components/forms/PageTitle";
import { HeroSettingsSection } from "./_components/HeroSettingsSection";
import { AISearchSettingsSection } from "./_components/AISearchSettingsSection";
import { ProductMenuSettingsSection } from "./_components/ProductMenuSettingsSection";
import { isAIConfigured } from "@/lib/ai-client";

/**
 * Store Front Settings Page
 * Product menu, add-ons, display preferences
 */
export default async function StoreFrontSettingsPage() {
  const aiConfigured = await isAIConfigured();

  return (
    <div className="space-y-8">
      <PageTitle
        title="Store Front Settings"
        subtitle="Customize your product menu and shopping experience"
      />

      <HeroSettingsSection />

      {aiConfigured && <AISearchSettingsSection />}

      <ProductMenuSettingsSection />
    </div>
  );
}
